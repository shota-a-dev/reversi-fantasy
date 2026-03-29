import { BOARD_SIZE, EMPTY, BLACK, WHITE, DIRECTIONS, type CellState, type Board } from './constants';

/** 空の盤面を作成（初期配置なし） */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => EMPTY as CellState)
  );
}

/** 初期配置の盤面を作成 */
export function createInitialBoard(): Board {
  const board = createEmptyBoard();
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = WHITE;
  board[mid - 1][mid] = BLACK;
  board[mid][mid - 1] = BLACK;
  board[mid][mid] = WHITE;
  return board;
}

/** 盤面のディープコピー */
export function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

/** 座標が盤面内かチェック */
export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** 指定方向にひっくり返せる石のリストを返す */
function getFlipsInDirection(
  board: Board,
  row: number,
  col: number,
  player: CellState,
  dr: number,
  dc: number
): [number, number][] {
  const opponent = player === BLACK ? WHITE : BLACK;
  const flips: [number, number][] = [];
  let r = row + dr;
  let c = col + dc;

  while (isInBounds(r, c) && board[r][c] === opponent) {
    flips.push([r, c]);
    r += dr;
    c += dc;
  }

  if (flips.length > 0 && isInBounds(r, c) && board[r][c] === player) {
    return flips;
  }
  return [];
}

/** 指定位置に石を置いた場合にひっくり返る石の全リスト */
export function getFlips(board: Board, row: number, col: number, player: CellState): [number, number][] {
  if (board[row][col] !== EMPTY) return [];

  const allFlips: [number, number][] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const flips = getFlipsInDirection(board, row, col, player, dr, dc);
    allFlips.push(...flips);
  }
  return allFlips;
}

/** 指定位置が合法手かチェック */
export function isValidMove(board: Board, row: number, col: number, player: CellState): boolean {
  if (!isInBounds(row, col) || board[row][col] !== EMPTY) return false;
  return getFlips(board, row, col, player).length > 0;
}

/** 全合法手を取得 */
export function getValidMoves(board: Board, player: CellState): [number, number][] {
  const moves: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isValidMove(board, r, c, player)) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

/** 石を置いて盤面を更新（破壊的変更） */
export function placeStone(board: Board, row: number, col: number, player: CellState): [number, number][] {
  const flips = getFlips(board, row, col, player);
  if (flips.length === 0) return [];

  board[row][col] = player;
  for (const [r, c] of flips) {
    board[r][c] = player;
  }
  return flips;
}

/** 石を置いて新しい盤面を返す（非破壊） */
export function placeStoneImmutable(board: Board, row: number, col: number, player: CellState): { board: Board; flips: [number, number][] } {
  const newBoard = cloneBoard(board);
  const flips = placeStone(newBoard, row, col, player);
  return { board: newBoard, flips };
}

/** 各色の石の数をカウント */
export function countStones(board: Board): { black: number; white: number; empty: number } {
  let black = 0;
  let white = 0;
  let empty = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
      else empty++;
    }
  }
  return { black, white, empty };
}

/** ゲーム終了判定 */
export function isGameOver(board: Board): boolean {
  return getValidMoves(board, BLACK).length === 0 && getValidMoves(board, WHITE).length === 0;
}

/** 勝者判定（0=引き分け） */
export function getWinner(board: Board): CellState {
  const { black, white } = countStones(board);
  if (black > white) return BLACK;
  if (white > black) return WHITE;
  return EMPTY;
}

/** 相手の色を返す */
export function opponent(player: CellState): CellState {
  return player === BLACK ? WHITE : BLACK;
}

/** 指定マスに強制的に石を設置（スキル用：反転処理なし） */
export function forceSetStone(board: Board, row: number, col: number, player: CellState): void {
  board[row][col] = player;
}

/** 指定マスの石をひっくり返す（スキル用） */
export function flipStone(board: Board, row: number, col: number): void {
  if (board[row][col] === BLACK) board[row][col] = WHITE;
  else if (board[row][col] === WHITE) board[row][col] = BLACK;
}
