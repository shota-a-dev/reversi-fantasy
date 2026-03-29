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
    const weight = char.rarity === 'SSR' ? 0.10 / 2 : char.rarity === 'SR' ? 0.25 / 2 : 0.65 / 2;
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
    const orb = screen.querySelector('#gacha-orb') as HTMLElement;
    const resultPanel = screen.querySelector('#gacha-result') as HTMLElement;

    if (orb) {
      orb.classList.add('gacha-spinning');
    }

    // 演出: 1.5秒後に結果表示
    setTimeout(() => {
    if (orb) orb.classList.remove('gacha-spinning');

    if (resultPanel) {
      resultPanel.style.display = 'block';
      resultPanel.innerHTML = `
        <div class="gacha-result-cards">
          ${results.map(r => {
            const char = CHARACTERS[r.id];
            const imgUrl = char.imageUrl ? `${char.imageUrl}` : '';
            return `
              <div class="gacha-result-card ${r.isNew ? 'new-char' : 'dupe-char'} rarity-${char.rarity.toLowerCase()}-bg"
                   style="animation-delay: ${results.indexOf(r) * 0.15}s">
                <div class="result-rarity">${char.rarity}</div>
                <div class="result-icon ${char.imageUrl ? 'has-image' : ''}" 
                     style="background-image: ${char.imageUrl ? `url(${imgUrl})` : 'none'}; background-color: ${char.imageUrl ? 'transparent' : `${char.color}44`}">
                  ${char.imageUrl ? '' : char.icon}
                </div>
                <div class="result-name">${char.name}</div>
                <div class="result-status">
                  ${r.isNew ? '<span class="new-badge">NEW!</span>' : `<span class="dupe-badge">凸${r.uncapLevel}</span>`}
                </div>
              </div>            `;
          }).join('')}        </div>
        <button class="btn-gacha-ok" id="gacha-ok">OK</button>
      `;

      resultPanel.querySelector('#gacha-ok')?.addEventListener('click', () => {
        isAnimating = false;
        render();
      });
    }

    // 通貨表示更新（アイコンを維持）
    const currencyDisplay = screen.querySelector('.currency-badge');
    if (currencyDisplay) {
      currencyDisplay.innerHTML = `💎 ${store.getCurrency()}`;
    }
    }, 1500);  };

  render();
  return screen;
}
