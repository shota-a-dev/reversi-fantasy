// ─── 画面遷移管理 ─────
export type ScreenId = 'home' | 'formation' | 'gacha' | 'game' | 'result' | 'help' | 'online';

class ScreenManager {
  private currentScreen: ScreenId = 'home';
  private listeners: Set<(screen: ScreenId, prev: ScreenId) => void> = new Set();
  private history: ScreenId[] = [];

  navigate(screen: ScreenId): void {
    const prev = this.currentScreen;
    this.history.push(prev);
    this.currentScreen = screen;

    // DOM切り替えアニメーション
    this.transitionScreens(prev, screen);
    this.notify(screen, prev);
  }

  back(): void {
    const prev = this.currentScreen;
    const target = this.history.pop() || 'home';
    this.currentScreen = target;
    this.transitionScreens(prev, target, true);
    this.notify(target, prev);
  }

  getCurrent(): ScreenId {
    return this.currentScreen;
  }

  onChange(callback: (screen: ScreenId, prev: ScreenId) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(screen: ScreenId, prev: ScreenId): void {
    for (const cb of this.listeners) {
      cb(screen, prev);
    }
  }

  private transitionScreens(from: ScreenId, to: ScreenId, reverse: boolean = false): void {
    const fromEl = document.getElementById(`screen-${from}`);
    const toEl = document.getElementById(`screen-${to}`);

    if (fromEl) {
      fromEl.classList.add(reverse ? 'screen-exit-right' : 'screen-exit-left');
      fromEl.addEventListener('animationend', () => {
        fromEl.classList.remove('screen-active', 'screen-exit-left', 'screen-exit-right');
        fromEl.style.display = 'none';
      }, { once: true });
    }

    if (toEl) {
      toEl.style.display = 'flex';
      toEl.classList.add('screen-active', reverse ? 'screen-enter-right' : 'screen-enter-left');
      toEl.addEventListener('animationend', () => {
        toEl.classList.remove('screen-enter-left', 'screen-enter-right');
      }, { once: true });
    }
  }
}

export const screenManager = new ScreenManager();
