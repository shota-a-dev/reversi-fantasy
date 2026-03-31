/**
 * 共通モーダルコンポーネント
 */
export interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export class Modal {
  private element: HTMLElement;

  constructor(options: ModalOptions) {
    this.element = document.createElement('div');
    this.element.className = 'modal-overlay';
    this.element.style.display = 'flex';
    
    const confirmText = options.confirmText || 'OK';
    const cancelText = options.cancelText || 'キャンセル';

    this.element.innerHTML = `
      <div class="modal-content">
        <h2>${options.title}</h2>
        <div style="text-align: center; margin: 1.5rem 0;">
          <p style="color: var(--color-text); line-height: 1.6;">${options.message}</p>
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button class="menu-btn menu-btn-primary" id="modal-confirm-btn" style="flex: 1;">${confirmText}</button>
          </div>
        </div>
        <button class="btn-secondary modal-close" id="modal-cancel-btn">${cancelText}</button>
      </div>
    `;

    this.element.querySelector('#modal-confirm-btn')?.addEventListener('click', () => {
      options.onConfirm();
      this.close();
    });

    this.element.querySelector('#modal-cancel-btn')?.addEventListener('click', () => {
      if (options.onCancel) options.onCancel();
      this.close();
    });
  }

  public show(): void {
    document.body.appendChild(this.element);
  }

  public close(): void {
    if (this.element.parentNode) {
      document.body.removeChild(this.element);
    }
  }
}

/**
 * 簡易的にモーダルを表示するヘルパー関数
 */
export function showModal(options: ModalOptions): void {
  const modal = new Modal(options);
  modal.show();
}
