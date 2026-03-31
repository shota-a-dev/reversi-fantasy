/**
 * 共通モーダルコンポーネント
 */
export interface ModalOptions {
  title: string;
  message?: string;
  contentHtml?: string; // 難易度選択などのカスタムHTML
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export class Modal {
  private element: HTMLElement;

  constructor(options: ModalOptions) {
    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    // 初期状態で非表示ではなく、DOMに追加されたら表示される運用
    
    const confirmText = options.confirmText || 'OK';
    const cancelText = options.cancelText || '閉じる';

    this.element.innerHTML = `
      <div class="modal-content">
        <h2>${options.title}</h2>
        <div class="modal-body-container" style="text-align: center; margin: 1.5rem 0;">
          ${options.message ? `<p style="color: var(--color-text); line-height: 1.6;">${options.message}</p>` : ''}
          ${options.contentHtml || ''}
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            ${options.onConfirm ? `<button class="menu-btn menu-btn-primary" id="modal-confirm-btn" style="flex: 1;">${confirmText}</button>` : ''}
          </div>
        </div>
        <button class="btn-secondary modal-close" id="modal-cancel-btn">${cancelText}</button>
      </div>
    `;

    // モーダルコンテンツ内でのクリックが背後に透過しないようにする
    this.element.querySelector('.modal-content')?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 決定ボタン
    this.element.querySelector('#modal-confirm-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (options.onConfirm) options.onConfirm();
      this.close();
    });

    // キャンセル/閉じるボタン
    this.element.querySelector('#modal-cancel-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (options.onCancel) options.onCancel();
      this.close();
    });

    // 外側タップで閉じる（オプション的に動作）
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      if (options.onCancel) options.onCancel();
      this.close();
    });
  }

  public show(): void {
    // 既存のモーダルがあれば消す（二重表示防止）
    const existing = document.querySelector('.modal-overlay');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    document.body.appendChild(this.element);
    // アニメーション用に一瞬遅らせて表示状態にするなどの処理も可能
    this.element.style.display = 'flex';
  }

  public close(): void {
    if (this.element.parentNode) {
      document.body.removeChild(this.element);
    }
  }

  // 特定のセレクタにイベントを貼りたい場合用
  public getElement(): HTMLElement {
    return this.element;
  }
}

export function showModal(options: ModalOptions): Modal {
  const modal = new Modal(options);
  modal.show();
  return modal;
}
