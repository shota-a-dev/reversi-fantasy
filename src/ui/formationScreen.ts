import '../styles/screens/formation.css';
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
    // 所持している神格のみをフィルタリング
    const ownedIds = CHARACTER_IDS.filter(id => data.characters[id].owned);

    screen.innerHTML = `
      <div class="screen-header">
        <button class="btn-back" id="formation-back">← 戻る</button>
        <h1 class="screen-title">神格</h1>
      </div>
      <div class="formation-content">
        <div class="character-grid">
          ${ownedIds.map(id => {
            const char = CHARACTERS[id];
            const state = data.characters[id];
            const isLeader = id === data.selectedLeader;
            const imgUrl = char.imageUrl ? `${char.imageUrl}` : '';
            return `
              <div class="char-card owned ${isLeader ? 'selected' : ''}" 
                   data-char-id="${id}">
                <div class="char-icon ${char.imageUrl ? 'has-image' : ''}"
                     style="background-image: ${char.imageUrl ? `url(${imgUrl})` : 'none'}">
                  ${char.imageUrl ? '' : char.icon}
                </div>
                <div class="char-name">${char.name}</div>
                <div class="char-rarity rarity-${char.rarity.toLowerCase()}">${char.rarity}</div>
                <div class="uncap-stars">
                  ${'★'.repeat(state.uncapLevel)}${'☆'.repeat(5 - state.uncapLevel)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 詳細モーダル -->
      <div class="detail-modal-overlay" id="detail-modal">
        <div class="detail-modal-content" id="detail-modal-content">
          <!-- 内容は動的に生成 -->
        </div>
      </div>
    `;

    // イベントバインド
    screen.querySelector('#formation-back')?.addEventListener('click', () => {
      screenManager.back();
    });

    // カードタップで詳細表示
    screen.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-char-id') as CharacterId;
        showDetail(id);
      });
    });
  };

  const showDetail = (id: CharacterId) => {
    const modal = screen.querySelector('#detail-modal') as HTMLElement;
    const content = screen.querySelector('#detail-modal-content') as HTMLElement;
    if (!modal || !content) return;

    const data = store.getData();
    const isLeader = id === data.selectedLeader;

    content.innerHTML = `
      <button class="btn-modal-close" id="detail-close">✕</button>
      ${renderCharacterDetail(id)}
      <button class="btn-select-leader" id="btn-set-leader" ${isLeader ? 'disabled' : ''}>
        ${isLeader ? '選択中' : '選択する'}
      </button>
    `;

    modal.classList.add('active');

    content.querySelector('#detail-close')?.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    content.querySelector('#btn-set-leader')?.addEventListener('click', () => {
      store.setLeader(id);
      modal.classList.remove('active');
      render();
    });

    // 背景タップで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  };

  render();

  // 画面遷移時に再レンダリング
  screenManager.onChange((to) => {
    if (to === 'formation') {
      render();
    }
  });

  return screen;
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
        <h4>🗡️ 権能（アクティブ）</h4>
        <p class="skill-name">${char.activeSkill.name}</p>
        <p class="skill-desc">${char.activeSkill.description}</p>
      </div>
      <div class="skill-box passive-skill">
        <h4>🛡️ 加護（パッシブ）</h4>
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
