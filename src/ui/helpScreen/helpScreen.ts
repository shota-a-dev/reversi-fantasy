import './help.css';
import { screenManager } from '../screenManager';

export function createHelpScreen(): HTMLElement {
  const screen = document.createElement('div');
  screen.id = 'screen-help';
  screen.className = 'screen';
  screen.style.display = 'none';

  screen.innerHTML = `
    <div class="screen-header">
      <button class="btn-back" id="help-back">← 戻る</button>
      <h1 class="screen-title">ヘルプ</h1>
    </div>
    <div class="help-content">
      <div class="help-section">
        <h2>📖 ゲーム概要</h2>
        <p>「盤上のファンタジア」は、キャラクタースキルを駆使して戦う戦略オセロゲームです。</p>
        <p>盤面の石を多く取った方が勝利！ただし、各キャラクターのスキルが戦況を一変させます。</p>
      </div>

      <div class="help-section">
        <h2>🎮 基本ルール</h2>
        <ul>
          <li>8×8の盤面で、黒と白の石を交互に置きます</li>
          <li>相手の石を自分の石で挟むと、挟まれた石が全て自分の色に変わります</li>
          <li>石を置ける場所（合法手）がない場合は自動的にパスされます</li>
          <li>両者とも置けなくなったらゲーム終了です</li>
          <li>石の多い方が勝ち！</li>
        </ul>
      </div>

      <div class="help-section">
        <h2>⚡ スキルシステム</h2>
        <h3>アクティブスキル</h3>
        <ul>
          <li>盤面や石に直接影響する強力な効果</li>
          <li>発動にはキャラクターごとに決まった<strong>マナ</strong>が必要です</li>
          <li>1対局中にマナが貯まれば何度でも使用可能ですが、強力なスキルほど多くのマナを消費します</li>
        </ul>
        <h3>パッシブスキル</h3>
        <ul>
          <li>特定のタイミングで自動発動</li>
          <li>凸レベルが上がると効果が強化</li>
        </ul>
      </div>

      <div class="help-section">
        <h2>💧 マナシステム</h2>
        <ul>
          <li>スキルの発動に必要なエネルギーです</li>
          <li><strong>自分のターンが回ってくるたびに 1 貯まります</strong></li>
          <li>マナの初期値: <strong>先攻(黒)は 1 、後攻(白)は 0 </strong>からスタートします</li>
          <li>最大 10 まで貯めることができます</li>
        </ul>
      </div>

      <div class="help-section">
        <h2>⭐ 凸（とつ）システム</h2>
        <ul>
          <li>ガチャで同じキャラが出ると「凸レベル」が上がります</li>
          <li>凸レベルは最大5まで</li>
          <li>凸レベルに応じてパッシブ強化やスコア倍率が向上</li>
        </ul>
      </div>

      <div class="help-section">
        <h2>⏱️ 制限時間</h2>
        <ul>
          <li>各ターンの制限時間は<strong>15秒</strong></li>
          <li>時間切れの場合、ランダムに石が置かれます</li>
          <li>一部のスキルで制限時間をボーナス延長できます</li>
        </ul>
      </div>

      <div class="help-section">
        <h2>🌐 オンライン対戦</h2>
        <ul>
          <li><strong>IDの共有</strong>: 自分のIDを相手に伝えます（クリップボードにコピー可能）。</li>
          <li><strong>接続</strong>: 相手のIDを入力して「接続」ボタンを押します。</li>
          <li><strong>準備完了</strong>: 両者が接続されると「対戦開始！」ボタンが表示されます。</li>
          <li><strong>ホスト</strong>: 「対戦開始！」を押した側が先攻（黒）となります。</li>
        </ul>
      </div>
    </div>
  `;

  screen.querySelector('#help-back')?.addEventListener('click', () => {
    screenManager.back();
  });

  return screen;
}
