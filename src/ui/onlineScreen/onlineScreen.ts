import './online.css';
import { screenManager } from '../screenManager';
import { onlineManager } from '../../core/onlineManager';
import { startGame } from '../gameScreen/gameScreen';

export function createOnlineScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-online';
  screen.className = 'screen';
  screen.style.display = 'none';

  return screen;
}

export function initOnlineScreen(): void {
  const screen = document.getElementById('screen-online');
  if (!screen) return;


  screen.innerHTML = `
    <div class="screen-header">
      <button class="btn-back" id="online-back">← 戻る</button>
      <h1 class="screen-title">オンライン対戦</h1>
    </div>
    <div class="online-container">
      <div class="online-card">
        <h3>あなたのID</h3>
        <p class="desc">対戦相手に伝えてください</p>
        <div class="id-display">
          <span id="my-peer-id">接続中...</span>
          <button class="btn-copy-icon" id="btn-copy-id" title="IDをコピー">📋</button>
        </div>
      </div>

      <div class="online-card">
        <h3>対戦を待つ</h3>
        <div class="online-status">マッチング待機中...</div>
      </div>

      <div class="online-card">
        <h3>相手に接続する</h3>
        <div class="id-input-group">
          <input type="text" id="opponent-id-input" placeholder="相手のIDを入力">
          <button id="btn-connect">接続</button>
        </div>
      </div>
    </div>
  `;

  screen.querySelector('#online-back')?.addEventListener('click', () => {
    onlineManager.disconnect();
    screenManager.back();
  });

  screen.querySelector('#btn-copy-id')?.addEventListener('click', () => {
    const idText = document.getElementById('my-peer-id')?.textContent;
    if (idText && idText !== '接続中...') {
      navigator.clipboard.writeText(idText);
      alert('IDをコピーしました');
    }
  });

  screen.querySelector('#btn-connect')?.addEventListener('click', () => {
    const input = document.getElementById('opponent-id-input') as HTMLInputElement;
    const opponentId = input.value.trim();
    if (opponentId) {
      onlineManager.connect(opponentId).catch(err => {
        alert(`接続失敗: ${err}`);
      });
    } else {
      alert('相手のIDを入力してください');
    }
  });

  // Online Manager Events
  onlineManager.onConnect(() => {
    screenManager.navigate('game');
    setTimeout(() => startGame('online'), 100);
  });

  onlineManager.onDisconnect(() => {
    alert('対戦相手が切断しました');
    screenManager.navigate('home');
  });

  onlineManager.init()
    .then(id => {
      const el = document.getElementById('my-peer-id');
      if (el) el.textContent = id;
    })
    .catch(err => {
      const el = document.getElementById('my-peer-id');
      if (el) el.textContent = '初期化エラー';
      console.error('Peer init error:', err);
    });
}
