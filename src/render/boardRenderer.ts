import { BOARD_SIZE, BLACK, WHITE, EMPTY, type CellState, type Board } from '../core/constants';
import type { GameState } from '../core/gameManager';

// ─── 描画定数 ─────
const CELL_COLORS = {
  board: '#1a6b3c',
  boardDark: '#15592f',
  border: '#0d3d1e',
  validMove: 'rgba(255, 255, 255, 0.25)',
  lastMove: 'rgba(255, 215, 0, 0.4)',
  skillAffected: 'rgba(255, 100, 100, 0.5)',
  preview: 'rgba(100, 200, 255, 0.4)',
};

const STONE_COLORS: Record<number, { fill: string; stroke: string; highlight: string }> = {
  [BLACK]: { fill: '#1a1a2e', stroke: '#0f0f1a', highlight: '#3a3a5e' },
  [WHITE]: { fill: '#f0f0f0', stroke: '#cccccc', highlight: '#ffffff' },
};

interface AnimatingStone {
  row: number;
  col: number;
  progress: number;     // 0-1
  fromColor: CellState;
  toColor: CellState;
}

interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface SkillAnimation {
  cells: [number, number][];
  progress: number;
  color: string;
  type: 'flash' | 'ripple' | 'burn';
}

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private boardOffset: { x: number; y: number } = { x: 0, y: 0 };
  private animatingStones: AnimatingStone[] = [];
  private particles: ParticleEffect[] = [];
  private skillAnimation: SkillAnimation | null = null;
  private animFrame: number = 0;
  private shakeAmount: number = 0;

  // 色覚多様性モード
  private colorBlindMode: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  setColorBlindMode(enabled: boolean): void {
    this.colorBlindMode = enabled;
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const maxSize = Math.min(container.clientWidth - 16, 500);
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = maxSize * dpr;
    this.canvas.height = maxSize * dpr;
    this.canvas.style.width = `${maxSize}px`;
    this.canvas.style.height = `${maxSize}px`;
    this.ctx.scale(dpr, dpr);

    this.cellSize = (maxSize - 8) / BOARD_SIZE;
    this.boardOffset = { x: 4, y: 4 };
  }

  // メイン描画
  render(state: GameState): void {
    const { ctx } = this;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    // 背景クリア
    ctx.clearRect(0, 0, w, h);

    // スクリーンシェイクの適用
    if (this.shakeAmount > 0.1) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.save();
      ctx.translate(sx, sy);
      this.shakeAmount *= 0.9;
    }

    // 盤面描画
    this.drawBoard(state);

    // 石描画
    this.drawStones(state.board);

    // 合法手表示
    if (state.phase === 'playing') {
      this.drawValidMoves(state.validMoves);
    }

    // 最後の手
    if (state.lastMove) {
      this.drawLastMove(state.lastMove);
    }

    // プレビューセル（ミラスキル）
    if (state.previewCells.length > 0) {
      this.drawPreviewCells(state.previewCells);
    }

    // アニメーション中の石
    this.drawAnimatingStones();

    // スキルアニメーション
    if (this.skillAnimation) {
      this.drawSkillAnimation();
    }

    // パーティクル
    this.drawParticles();

    if (this.shakeAmount > 0.1) {
      ctx.restore();
    }
  }

  // 盤面グリッド
  private drawBoard(_state: GameState): void {
    const { ctx, cellSize, boardOffset: off } = this;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = off.x + c * cellSize;
        const y = off.y + r * cellSize;
        const isEven = (r + c) % 2 === 0;

        // セル背景
        ctx.fillStyle = isEven ? CELL_COLORS.board : CELL_COLORS.boardDark;
        ctx.fillRect(x, y, cellSize, cellSize);

        // セル境界線
        ctx.strokeStyle = CELL_COLORS.border;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    // 星点（マーカー）
    const starPoints = [
      [2, 2], [2, 6], [6, 2], [6, 6],
    ];
    ctx.fillStyle = CELL_COLORS.border;
    for (const [r, c] of starPoints) {
      const x = off.x + (c - 0.5) * cellSize + cellSize / 2;
      const y = off.y + (r - 0.5) * cellSize + cellSize / 2;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 石の描画
  private drawStones(board: Board): void {
    const { ctx, cellSize, boardOffset: off } = this;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = board[r][c];
        if (cell === EMPTY) continue;

        // アニメーション中の石はスキップ
        if (this.animatingStones.some(s => s.row === r && s.col === c)) continue;

        this.drawSingleStone(ctx, off.x + c * cellSize + cellSize / 2, off.y + r * cellSize + cellSize / 2, cellSize * 0.4, cell);
      }
    }
  }

  private drawSingleStone(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: CellState): void {
    const colors = this.colorBlindMode
      ? (color === BLACK
          ? { fill: '#0066CC', stroke: '#004488', highlight: '#3399FF' }
          : { fill: '#FF8800', stroke: '#CC6600', highlight: '#FFAA33' })
      : STONE_COLORS[color];

    if (!colors) return;

    // 影
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // メイン石
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
    gradient.addColorStop(0, colors.highlight);
    gradient.addColorStop(0.6, colors.fill);
    gradient.addColorStop(1, colors.stroke);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    // 模様（色覚モード用）
    if (this.colorBlindMode) {
      ctx.strokeStyle = color === BLACK ? '#ffffff' : '#000000';
      ctx.lineWidth = 2;
      if (color === BLACK) {
        // ×マーク
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.4, cy - radius * 0.4);
        ctx.lineTo(cx + radius * 0.4, cy + radius * 0.4);
        ctx.moveTo(cx + radius * 0.4, cy - radius * 0.4);
        ctx.lineTo(cx - radius * 0.4, cy + radius * 0.4);
        ctx.stroke();
      } else {
        // ○マーク
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // 合法手の表示
  private drawValidMoves(moves: [number, number][]): void {
    const { ctx, cellSize, boardOffset: off } = this;

    for (const [r, c] of moves) {
      const cx = off.x + c * cellSize + cellSize / 2;
      const cy = off.y + r * cellSize + cellSize / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = CELL_COLORS.validMove;
      ctx.fill();

      // 脈動アニメーション
      const pulse = Math.sin(performance.now() / 500) * 0.05 + 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // 最後の手ハイライト
  private drawLastMove([r, c]: [number, number]): void {
    const { ctx, cellSize, boardOffset: off } = this;
    const x = off.x + c * cellSize;
    const y = off.y + r * cellSize;

    ctx.fillStyle = CELL_COLORS.lastMove;
    ctx.fillRect(x, y, cellSize, cellSize);
  }

  // プレビューセル
  private drawPreviewCells(cells: [number, number][]): void {
    const { ctx, cellSize, boardOffset: off } = this;

    for (const [r, c] of cells) {
      const x = off.x + c * cellSize;
      const y = off.y + r * cellSize;

      const pulse = Math.sin(performance.now() / 300) * 0.2 + 0.3;
      ctx.fillStyle = `rgba(100, 200, 255, ${pulse})`;
      ctx.fillRect(x, y, cellSize, cellSize);

      // 星マーク  
      ctx.fillStyle = '#fff';
      ctx.font = `${cellSize * 0.4}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x + cellSize / 2, y + cellSize / 2);
    }
  }

  // ─── アニメーション ─────
  startFlipAnimation(flips: [number, number][], fromColor: CellState, toColor: CellState): void {
    for (let i = 0; i < flips.length; i++) {
      const [r, c] = flips[i];
      this.animatingStones.push({
        row: r,
        col: c,
        progress: -i * 0.1, // staggered start
        fromColor,
        toColor,
      });
    }
  }

  private drawAnimatingStones(): void {
    const { ctx, cellSize, boardOffset: off } = this;
    const toRemove: number[] = [];

    for (let i = 0; i < this.animatingStones.length; i++) {
      const stone = this.animatingStones[i];
      stone.progress += 0.04;

      if (stone.progress < 0) continue; // stagger delay

      const p = Math.min(stone.progress, 1);
      const cx = off.x + stone.col * cellSize + cellSize / 2;
      const cy = off.y + stone.row * cellSize + cellSize / 2;

      // Flip animation: scale X from 1 -> 0 -> 1
      const scaleX = Math.abs(Math.cos(p * Math.PI));
      const color = p < 0.5 ? stone.fromColor : stone.toColor;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scaleX, 1);
      this.drawSingleStone(ctx, 0, 0, cellSize * 0.4, color);
      ctx.restore();

      if (stone.progress >= 1) {
        toRemove.push(i);
        // パーティクル発生
        this.spawnFlipParticles(cx, cy, stone.toColor);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.animatingStones.splice(toRemove[i], 1);
    }
  }

  // スキルアニメーション
  startSkillAnimation(cells: [number, number][], color: string, type: 'flash' | 'ripple' | 'burn' = 'flash'): void {
    this.skillAnimation = { cells, progress: 0, color, type };
    this.shakeAmount = 15;
    for (const [r, c] of cells) {
      const cx = this.boardOffset.x + c * this.cellSize + this.cellSize / 2;
      const cy = this.boardOffset.y + r * this.cellSize + this.cellSize / 2;
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          maxLife: 1,
          color: color,
          size: 2 + Math.random() * 5,
        });
      }
    }
  }

  private drawSkillAnimation(): void {
    if (!this.skillAnimation) return;
    const { ctx, cellSize, boardOffset: off } = this;
    const anim = this.skillAnimation;

    anim.progress += 0.02;
    const p = Math.min(anim.progress, 1);

    for (const [r, c] of anim.cells) {
      const x = off.x + c * cellSize;
      const y = off.y + r * cellSize;

      switch (anim.type) {
        case 'flash': {
          const alpha = Math.sin(p * Math.PI) * 0.8;
          ctx.fillStyle = `${anim.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.fillRect(x, y, cellSize, cellSize);
          break;
        }
        case 'ripple': {
          const radius = p * cellSize;
          const alpha = (1 - p) * 0.6;
          ctx.strokeStyle = `${anim.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'burn': {
          const alpha = (1 - p) * 0.9;
          const gradient = ctx.createRadialGradient(
            x + cellSize / 2, y + cellSize / 2, 0,
            x + cellSize / 2, y + cellSize / 2, cellSize * p
          );
          gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.7})`);
          gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, cellSize, cellSize);
          break;
        }
      }
    }

    if (anim.progress >= 1) {
      this.skillAnimation = null;
    }
  }

  // パーティクルエフェクト
  private spawnFlipParticles(x: number, y: number, color: CellState): void {
    const c = color === BLACK ? '#6060ff' : '#ffcc00';
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1,
        life: 1,
        maxLife: 1,
        color: c,
        size: 1.5 + Math.random() * 2,
      });
    }
  }

  private drawParticles(): void {
    const { ctx } = this;
    const toRemove: number[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life -= 0.02;

      if (p.life <= 0) {
        toRemove.push(i);
        continue;
      }

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.particles.splice(toRemove[i], 1);
    }
  }

  // アニメーションループ
  startLoop(getState: () => GameState): void {
    const loop = (_time: number) => {
      this.render(getState());
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
  }

  // タッチ座標からセル座標への変換
  getCellFromPoint(clientX: number, clientY: number): [number, number] | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left - this.boardOffset.x;
    const y = clientY - rect.top - this.boardOffset.y;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return [row, col];
    }
    return null;
  }

  get hasActiveAnimations(): boolean {
    return this.animatingStones.length > 0 || this.skillAnimation !== null || this.particles.length > 0;
  }
}
