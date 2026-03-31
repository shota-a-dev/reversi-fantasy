import '../styles/screens/gacha.css';
import { store } from '../store/store';
import { CHARACTERS } from '../core/characters';
import type { CharacterId } from '../core/constants';
import { CHARACTER_IDS, GACHA_COST } from '../core/constants';
import { screenManager } from './screenManager';
import { audioManager } from '../core/audioManager';

// ガチャ排出ロジック
function rollGacha(): CharacterId {
  const roll = Math.random();
  let cumulative = 0;

  // SSR: 10%, SR: 25%, R: 65%
  const pool: { id: CharacterId; weight: number }[] = CHARACTER_IDS.map(id => {
    const char = CHARACTERS[id];
    const weight = char.rarity === 'SSR' ? 0.05 / 2 : char.rarity === 'SR' ? 0.25 / 2 : 0.7 / 2;
    return { id, weight };
  });

  for (const entry of pool) {
    cumulative += entry.weight;
    if (roll <= cumulative) return entry.id;
  }

  return pool[pool.length - 1].id;
}

export function createGachaScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-gacha';
  screen.className = 'screen screen-scrollable';
  screen.style.display = 'none';

  let isAnimating = false;

  const render = () => {
    const data = store.getData();

    screen.innerHTML = `
      <div class="gacha-bg-overlay"></div>
      <div class="screen-header">
        <button class="btn-back" id="gacha-back">← 戻る</button>
        <h1 class="screen-title">神託</h1>
        <div class="currency-badge">💎 ${data.currency} </div>
      </div>
      <div class="gacha-content">
        <div class="gacha-machine-container">
          <div class="gacha-machine">
            <div class="gacha-orb" id="gacha-orb">
              <div class="gacha-orb-image"></div>
            </div>
            <div class="gacha-light-beam"></div>
          </div>
          <div class="gacha-rates-table">
            <span class="rate-item ssr">SSR 10%</span>
            <span class="rate-item sr">SR 25%</span>
            <span class="rate-item r">R 65%</span>
          </div>
        </div>
        <div class="gacha-result" id="gacha-result" style="display: none;">
        </div>
        <div class="gacha-buttons">
          <button class="btn-gacha btn-single" id="btn-gacha-single" ${data.currency < GACHA_COST ? 'disabled' : ''}>
            単発召喚<br><small>${GACHA_COST} 💎</small>
          </button>
          <button class="btn-gacha btn-ten" id="btn-gacha-ten" ${data.currency < GACHA_COST * 10 ? 'disabled' : ''}>
            10連召喚<br><small>${GACHA_COST * 10} 💎</small>
          </button>
        </div>
      </div>
    `;

    // イベント
    screen.querySelector('#gacha-back')?.addEventListener('click', () => {
      screenManager.back();
    });

    screen.querySelector('#btn-gacha-single')?.addEventListener('click', () => {
      if (isAnimating) return;
      performGacha(1);
    });

    screen.querySelector('#btn-gacha-ten')?.addEventListener('click', () => {
      if (isAnimating) return;
      performGacha(10);
    });
  };

  const performGacha = (count: number) => {
    const totalCost = GACHA_COST * count;
    if (!store.spendCurrency(totalCost)) return;

    audioManager.playGacha();
    isAnimating = true;
    const results: { id: CharacterId; isNew: boolean; uncapLevel: number }[] = [];

    for (let i = 0; i < count; i++) {
      const id = rollGacha();
      const result = store.addCharacter(id);
      results.push({ id, ...result });
    }

    // アニメーション開始
    // const orb = screen.querySelector('#gacha-orb') as HTMLElement;
    const resultPanel = screen.querySelector('#gacha-result') as HTMLElement;

    // 結果画像を事前に読み込んで、ネットワーク読み込みによる表示遅延を抑える
    results.forEach(r => {
      const char = CHARACTERS[r.id];
      if (char.imageUrl) {
        const imgPreload = new Image();
        imgPreload.src = char.imageUrl;
      }
    });

    // 演出: 短い待ち時間に変更（以前は1.5秒）してUXを改善
    setTimeout(() => {

      if (resultPanel) {
        resultPanel.style.display = 'block';

        const renderCardHtml = (r: { id: CharacterId; isNew: boolean; uncapLevel: number }, animDelay = 0) => {
          const char = CHARACTERS[r.id];
          const imgUrl = char.imageUrl ? `${char.imageUrl}` : '';
          return `
            <div class="gacha-result-cards single-card">
              <div class="gacha-result-card ${r.isNew ? 'new-char' : 'dupe-char'} rarity-${char.rarity.toLowerCase()}-bg"
                   style="animation-delay: ${animDelay}s">
                <div class="result-rarity">${char.rarity}</div>
                <div class="result-image-container">
                  ${char.imageUrl ? `<img class="result-img" src="${imgUrl}" alt="${char.name}">` : `<div class="result-icon" style="background-color: ${char.color}44">${char.icon}</div>`}
                </div>
                <div class="result-name">${char.name}</div>
                <div class="result-status">
                  ${r.isNew ? '<span class="new-badge">NEW!</span>' : `<span class="dupe-badge">凸${r.uncapLevel}</span>`}
                </div>
              </div>
            </div>
          `;
        };

        const getTapText = (index: number) => index < results.length - 1 ? 'タップして次へ' : 'タップして閉じる';

        if (results.length === 1) {
          resultPanel.innerHTML = `
            <div class="gacha-result-overlay" id="gacha-result-overlay">
              ${renderCardHtml(results[0], 0)}
              <div class="tap-to-close">${getTapText(0)}</div>
            </div>
          `;

          resultPanel.querySelector('#gacha-result-overlay')?.addEventListener('click', () => {
            isAnimating = false;
            render();
          });
        } else {
          // 10連など複数ヒット時は単発表示1件ずつを順に表示（タップで次へ・最終は閉じる表示）
          let idx = 0;
          resultPanel.innerHTML = `
            <div class="gacha-result-overlay" id="gacha-result-overlay">
              ${renderCardHtml(results[idx], 0)}
              <div class="tap-to-close">${getTapText(idx)}</div>
            </div>
          `;

          const overlay = resultPanel.querySelector('#gacha-result-overlay') as HTMLElement;
          overlay?.addEventListener('click', () => {
            idx++;
            if (idx >= results.length) {
              isAnimating = false;
              render();
              return;
            }
            overlay.innerHTML = `${renderCardHtml(results[idx], 0)}<div class="tap-to-close">${getTapText(idx)}</div>`;
          });
        }
      }

      // 通貨表示更新（アイコンを維持）
      const currencyDisplay = screen.querySelector('.currency-badge');
      if (currencyDisplay) {
        currencyDisplay.innerHTML = `💎 ${store.getCurrency()}`;
      }
    }, 200);
  };

  render();
  return screen;
}
