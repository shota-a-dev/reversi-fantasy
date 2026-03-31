/**
 * 共通モーダルコンポーネント
 */
import './modal.css';

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
    
    const confirmText = options.confirmText || '決定';
    const cancelText = options.cancelText || '閉じる';

    this.element.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${options.title}</h2>
        </div>
        
        <div class="modal-body">
          ${options.message ? `<p class="modal-message">${options.message}</p>` : ''}
          ${options.contentHtml || ''}
        </div>

        <div class="modal-footer">
          ${options.onConfirm ? `<button class="menu-btn menu-btn-primary" id="modal-confirm-btn">${confirmText}</button>` : ''}
          <button class="btn-secondary modal-close-btn" id="modal-cancel-btn">${cancelText}</button>
        </div>
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

    // 外側タップで閉じる
    this.element.addEventListener('click', (e) => {
      e.stopPropagation();
      if (options.onCancel) options.onCancel();
      this.close();
    });
  }

  public show(): void {
    const existing = document.querySelector('.modal-overlay');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    document.body.appendChild(this.element);
    this.element.style.display = 'flex';
  }

  public close(): void {
    if (this.element.parentNode) {
      document.body.removeChild(this.element);
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}

export function showModal(options: ModalOptions): Modal {
  const modal = new Modal(options);
  modal.show();
  return modal;
}
