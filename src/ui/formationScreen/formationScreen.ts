import './formation.css';
import { store } from '../../store/store';
import { CHARACTERS } from '../../core/characters';
import type { CharacterId } from '../../core/constants';
import { CHARACTER_IDS } from '../../core/constants';
import { screenManager } from '../screenManager';
import { showCharacterDetail } from '../formationDetail/formationDetail';

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
    `;

    // イベントバインド
    screen.querySelector('#formation-back')?.addEventListener('click', () => {
      screenManager.back();
    });

    // カードタップで詳細表示
    screen.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-char-id') as CharacterId;
        showCharacterDetail(id, () => render());
      });
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
