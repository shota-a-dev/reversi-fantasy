import { store } from '../store/store';
import { CHARACTERS } from '../core/characters';
import type { CharacterId } from '../core/constants';
import { CHARACTER_IDS } from '../core/constants';
import { screenManager } from './screenManager';

export function createFormationScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-formation';
  screen.className = 'screen screen-scrollable';
  screen.style.display = 'none';

  const render = () => {
    const data = store.getData();

    screen.innerHTML = `
      <div class="screen-header">
        <button class="btn-back" id="formation-back">← 戻る</button>
        <h1 class="screen-title">キャラクター</h1>
      </div>
      <div class="formation-content">
        <div class="leader-section">
          <h2 class="section-title">リーダー</h2>
          <div class="leader-card" id="leader-display">
            ${renderCharacterCard(data.selectedLeader, true)}
          </div>
        </div>
        <div class="character-grid">
          ${CHARACTER_IDS.map(id => {
            const char = CHARACTERS[id];
            const state = data.characters[id];
            const isLeader = id === data.selectedLeader;
            const imgUrl = char.imageUrl ? `${char.imageUrl}` : '';
            return `
              <div class="char-card ${state.owned ? 'owned' : 'locked'} ${isLeader ? 'selected' : ''}" 
                   data-char-id="${id}">
                <div class="char-icon ${char.imageUrl ? 'has-image' : ''}"
                     style="background-image: ${char.imageUrl ? `url(${imgUrl})` : 'none'}">
                  ${char.imageUrl ? '' : char.icon}
                </div>
                <div class="char-name">${char.name}</div>
                <div class="char-rarity rarity-${char.rarity.toLowerCase()}">${char.rarity}</div>
                ${state.owned ? `
                  <div class="uncap-stars">
                    ${'★'.repeat(state.uncapLevel)}${'☆'.repeat(5 - state.uncapLevel)}
                  </div>
                ` : '<div class="lock-overlay">🔒</div>'}
              </div>
            `;
          }).join('')}
        </div>
        <div class="char-detail" id="char-detail-panel">
          ${renderCharacterDetail(data.selectedLeader)}
        </div>
      </div>
    `;

    // イベントバインド
    screen.querySelector('#formation-back')?.addEventListener('click', () => {
      screenManager.back();
    });

    screen.querySelectorAll('.char-card.owned').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-char-id') as CharacterId;
        store.setLeader(id);
        render();
      });
    });

    // キャラ詳細表示
    screen.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-char-id') as CharacterId;
        const detail = document.getElementById('char-detail-panel');
        if (detail) {
          detail.innerHTML = renderCharacterDetail(id);
        }
      });
    });
  };

  render();

  // 画面遷移時に再レンダリング（ガチャ後に反映されるように）
  screenManager.onChange((to) => {
  if (to === 'formation') {
    render();
  }
  });

  // 初回表示時にもデータを確実に取得
  screen.addEventListener('show', () => {
  render();
  });

  return screen;
  }
function renderCharacterCard(id: CharacterId, large: boolean = false): string {
  const char = CHARACTERS[id];
  const state = store.getCharacter(id);
  const imgUrl = char.imageUrl ? `${char.imageUrl}` : '';
  return `
    <div class="leader-preview ${large ? 'large' : ''}">
      <div class="leader-icon ${char.imageUrl ? 'has-image' : ''}" 
           style="background-image: ${char.imageUrl ? `url(${imgUrl})` : `linear-gradient(135deg, ${char.color}44, ${char.color})`}">
        ${char.imageUrl ? '' : char.icon}
      </div>
      <div class="leader-info">
        <span class="leader-name">${char.name}</span>
        <span class="leader-title">${char.title}</span>
        <span class="uncap-stars">${'★'.repeat(state.uncapLevel)}${'☆'.repeat(5 - state.uncapLevel)}</span>
      </div>
    </div>
  `;
}

function renderCharacterDetail(id: CharacterId): string {
  const char = CHARACTERS[id];
  const state = store.getCharacter(id);
  const imgUrl = char.imageUrl ? `${char.imageUrl}` : '';
  
  return `
    <div class="detail-header" style="border-color: ${char.color}">
      <div class="detail-icon ${char.imageUrl ? 'has-image' : ''}" 
           style="background-image: ${char.imageUrl ? `url(${imgUrl})` : `linear-gradient(135deg, ${char.color}66, ${char.color})`}">
        ${char.imageUrl ? '' : char.icon}
      </div>
      <div>
        <h3>${char.name}</h3>
        <p class="detail-title">${char.title}</p>
        <p class="detail-rarity rarity-${char.rarity.toLowerCase()}">${char.rarity}</p>
      </div>
    </div>
    <div class="detail-skills">
      <div class="skill-box active-skill">
        <h4>🗡️ アクティブスキル</h4>
        <p class="skill-name">${char.activeSkill.name}</p>
        <p class="skill-desc">${char.activeSkill.description}</p>
      </div>
      <div class="skill-box passive-skill">
        <h4>🛡️ パッシブスキル</h4>
        <p class="skill-name">${char.passiveSkill.name}</p>
        <p class="skill-desc">${char.passiveSkill.description}</p>
      </div>
    </div>
    <div class="detail-uncap">
      <h4>凸ボーナス</h4>
      ${char.uncapBonuses.map(b => `
        <div class="uncap-item ${b.level <= state.uncapLevel ? 'unlocked' : 'locked'}">
          <span class="uncap-level">凸${b.level}</span>
          <span class="uncap-desc">${b.description}</span>
        </div>
      `).join('')}
    </div>
  `;
}
