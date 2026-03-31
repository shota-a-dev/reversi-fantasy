import './formationDetail.css';
import { CHARACTERS } from '../../core/characters/characters';
import { store } from '../../store/store';
import type { CharacterId } from '../../core/constants';

/**
 * キャラ詳細画面を表示する
 */
export function showCharacterDetail(id: CharacterId, onUpdate: () => void): void {
  const char = CHARACTERS[id];
  const state = store.getCharacter(id);
  const data = store.getData();
  const isLeader = id === data.selectedLeader;
  const imgUrl = char.imageUrl ? `${char.imageUrl}` : '';

  const overlay = document.createElement('div');
  overlay.className = 'detail-modal-overlay active';
  
  // キャラ詳細画面
  overlay.innerHTML = `
    <div class="detail-modal-content custom-size" id="detail-modal-content">
      <div class="detail-header" style="border-color: ${char.color}">
        <div class="detail-icon clickable-preview ${char.imageUrl ? 'has-image' : ''}" 
             style="background-image: ${char.imageUrl ? `url(${imgUrl})` : `linear-gradient(135deg, ${char.color}66, ${char.color})`}">
          ${char.imageUrl ? '' : char.icon}
        </div>
        <div class="detail-info-main">
          <h3>${char.name}</h3>
          <p class="detail-title">${char.title}</p>
          <p class="detail-rarity rarity-${char.rarity.toLowerCase()}">${char.rarity}</p>
        </div>
      </div>
      
      <div class="detail-scroll-area">
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
      </div>

      <button class="btn-select-leader" id="btn-set-leader" ${isLeader ? 'disabled' : ''}>
        ${isLeader ? '選択中' : '選択する'}
      </button>
    </div>

    <!-- 拡大プレビューレイヤー -->
    <div class="rich-preview-layer" id="rich-preview">
      <div class="preview-glow"></div>
      <div class="preview-image-container">
        <div class="preview-image ${char.imageUrl ? 'has-image' : ''}" 
             style="background-image: ${char.imageUrl ? `url(${imgUrl})` : `linear-gradient(135deg, ${char.color}66, ${char.color})`}">
          ${char.imageUrl ? '' : char.icon}
        </div>
        <div class="preview-char-name">${char.name}</div>
      </div>
    </div>
  `;

  // イベント: 閉じる（背景タップ）
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  // イベント: リーダー設定
  overlay.querySelector('#btn-set-leader')?.addEventListener('click', (e) => {
    e.stopPropagation();
    store.setLeader(id);
    onUpdate();
    document.body.removeChild(overlay);
  });

  // イベント: プレビュー表示
  const previewLayer = overlay.querySelector('#rich-preview') as HTMLElement;
  overlay.querySelector('.clickable-preview')?.addEventListener('click', (e) => {
    e.stopPropagation();
    previewLayer.classList.add('active');
  });

  // プレビューを閉じる
  previewLayer.addEventListener('click', (e) => {
    e.stopPropagation();
    previewLayer.classList.remove('active');
  });

  document.body.appendChild(overlay);
}
