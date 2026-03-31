import './gacha.css';
import { store } from '../../store/store';
import { CHARACTERS } from '../../core/characters';
import type { CharacterId } from '../../core/constants';
import { CHARACTER_IDS, GACHA_COST } from '../../core/constants';
import { screenManager } from '../screenManager';
import { audioManager } from '../../core/audioManager';
import { showModal } from '../components/modal/modal';

// ─── ガチャ確率設定 ─────────────────────
const GACHA_RATES = {
  SSR: 5,
  SR: 25,
  R: 70
};

// ガチャ排出ロジック
function rollGacha(): CharacterId {
  const roll = Math.random() * 100;
  let cumulative = 0;

  // 各レアリティのキャラプールを作成
  const ssrPool = CHARACTER_IDS.filter(id => CHARACTERS[id].rarity === 'SSR');
  const srPool = CHARACTER_IDS.filter(id => CHARACTERS[id].rarity === 'SR');
  const rPool = CHARACTER_IDS.filter(id => CHARACTERS[id].rarity === 'R');

  // SSR判定
  cumulative += GACHA_RATES.SSR;
  if (roll <= cumulative && ssrPool.length > 0) {
    return ssrPool[Math.floor(Math.random() * ssrPool.length)];
  }

  // SR判定
  cumulative += GACHA_RATES.SR;
  if (roll <= cumulative && srPool.length > 0) {
    return srPool[Math.floor(Math.random() * srPool.length)];
  }

  // R判定（フォールバック）
  if (rPool.length > 0) {
    return rPool[Math.floor(Math.random() * rPool.length)];
  }

  // 万が一プールが空の場合の最終手段
  return CHARACTER_IDS[Math.floor(Math.random() * CHARACTER_IDS.length)];
}

export function createGachaScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-gacha';
  screen.className = 'screen';
  screen.style.display = 'none';

  let isAnimating = false;

  const render = () => {
    const data = store.getData();

    screen.innerHTML = `
      <div class="gacha-bg-overlay"></div>
      <div class="screen-header">
        <button class="btn-back" id="gacha-back">← 戻る</button>
        <h1 class="screen-title">神託</h1>
        <div class="currency-badge"> ${data.currency} </div>
      </div>
      <div class="gacha-content">
        <div class="gacha-view">
          <div class="gacha-orb-image" id="gacha-orb"></div>
        </div>

        <div class="gacha-rates-table">
          <span class="rate-item ssr">SSR ${GACHA_RATES.SSR}%</span>
          <span class="rate-item sr">SR ${GACHA_RATES.SR}%</span>
          <span class="rate-item r">R ${GACHA_RATES.R}%</span>
        </div>

        <div class="gacha-result" id="gacha-result" style="display: none;">
        </div>

        <div class="btn-gacha-container">
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

    const showConfirm = (count: number) => {
      if (isAnimating) return;
      showModal({
        title: '🎰 神託の確認',
        message: `${count}回召喚を実行しますか？<br><br>消費: <span class="currency-icon-small"></span> ${GACHA_COST * count}`,
        confirmText: '召喚する！',
        cancelText: 'キャンセル',
        onConfirm: () => performGacha(count)
      });
    };

    screen.querySelector('#btn-gacha-single')?.addEventListener('click', () => showConfirm(1));
    screen.querySelector('#btn-gacha-ten')?.addEventListener('click', () => showConfirm(10));
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
    const resultPanel = screen.querySelector('#gacha-result') as HTMLElement;

    results.forEach(r => {
      const char = CHARACTERS[r.id];
      if (char.imageUrl) {
        const imgPreload = new Image();
        imgPreload.src = char.imageUrl;
      }
    });

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

      const currencyDisplay = screen.querySelector('.currency-badge');
      if (currencyDisplay) {
        currencyDisplay.innerHTML = `${store.getCurrency()}`;
      }
    }, 200);
  };

  render();
  return screen;
}
