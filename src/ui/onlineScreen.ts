import { screenManager } from './screenManager';
import { onlineManager } from '../core/onlineManager';
import { store } from '../store/store';
import { CHARACTERS } from '../core/characters';
import { startGame } from './gameScreen';

export function createOnlineScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-online';
  screen.className = 'screen';
  screen.style.display = 'none';

  screen.innerHTML = `
    <div class="online-container">
      <h2 class="online-title">🌐 オンライン対戦</h2>
      
      <div class="online-section" id="peer-id-section">
        <p>あなたのID:</p>
        <div class="id-display">
          <span id="my-peer-id">読込中...</span>
          <button class="btn-icon" id="btn-copy-id" title="コピー">📋</button>
        </div>
      </div>

      <div class="online-section">
        <p>相手のIDを入力して接続:</p>
        <div class="id-input-group">
          <input type="text" id="target-peer-id" placeholder="相手のIDを入力">
          <button class="btn-primary" id="btn-connect">接続</button>
        </div>
      </div>

      <div class="online-status" id="online-status">
        接続待機中...
      </div>

      <div class="online-actions" id="online-actions" style="display: none;">
        <button class="btn-primary btn-large" id="btn-start-online">対戦開始！</button>
      </div>

      <button class="btn-secondary" id="btn-online-back">もどる</button>
    </div>
  `;

  // イベント
  screen.querySelector('#btn-online-back')?.addEventListener('click', () => {
    onlineManager.disconnect();
    screenManager.navigate('home');
  });

  screen.querySelector('#btn-copy-id')?.addEventListener('click', () => {
    const id = document.getElementById('my-peer-id')?.textContent;
    if (id && id !== '読込中...') {
      navigator.clipboard.writeText(id);
      alert('IDをコピーしました');
    }
  });

  screen.querySelector('#btn-connect')?.addEventListener('click', async () => {
    const targetId = (document.getElementById('target-peer-id') as HTMLInputElement).value.trim();
    if (!targetId) return;

    const statusEl = document.getElementById('online-status');
    if (statusEl) statusEl.textContent = '接続中...';

    try {
      await onlineManager.connect(targetId);
    } catch (err) {
      if (statusEl) statusEl.textContent = '接続失敗: ' + err;
    }
  });

  screen.querySelector('#btn-start-online')?.addEventListener('click', () => {
    // ホスト側が開始
    const data = store.getData();
    const leader = CHARACTERS[data.selectedLeader];
    
    onlineManager.send({
      type: 'init',
      leaderId: data.selectedLeader,
      uncapLevel: data.characters[data.selectedLeader].uncapLevel,
      name: leader.name
    });

    startGame('online');
    screenManager.navigate('game');
  });

  return screen;
}

export async function initOnlineScreen(): Promise<void> {
  const idEl = document.getElementById('my-peer-id');
  const statusEl = document.getElementById('online-status');
  const actionEl = document.getElementById('online-actions');

  try {
    const id = await onlineManager.init();
    if (idEl) idEl.textContent = id;
    if (statusEl) statusEl.textContent = '接続待機中... IDを相手に伝えてください';
  } catch (err) {
    if (idEl) idEl.textContent = 'エラー';
    if (statusEl) statusEl.textContent = '初期化失敗: ' + err;
  }

  onlineManager.onConnect(() => {
    if (statusEl) statusEl.textContent = '接続成功！対戦相手が見つかりました';
    if (actionEl) actionEl.style.display = 'block';
  });

  onlineManager.onDisconnect(() => {
    if (statusEl) statusEl.textContent = '切断されました';
    if (actionEl) actionEl.style.display = 'none';
  });
}
