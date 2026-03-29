import {
  cloneBoard,
  getValidMoves,
  placeStone,
  isGameOver,
  opponent,
  countStones
} from '../core/board';
import { BLACK, type Board, type CellState } from '../core/constants';

interface AIRequest {
  board: Board;
  player: CellState;
  level: number;
}

self.onmessage = (e: MessageEvent<AIRequest>) => {
  const { board, player, level } = e.data;
  const moves = getValidMoves(board, player);

  if (moves.length === 0) {
    self.postMessage(null);
    return;
  }

  let chosen: [number, number];
  switch (level) {
    case 1:
      chosen = aiRandom(moves);
      break;
    case 3:
      chosen = aiMinimax(board, player, moves);
      break;
    default:
      chosen = aiEvaluate(board, player, moves);
      break;
  }

  self.postMessage(chosen);
};

function aiRandom(moves: [number, number][]): [number, number] {
  return moves[Math.floor(Math.random() * moves.length)];
}

function aiEvaluate(board: Board, player: CellState, moves: [number, number][]): [number, number] {
  const weights = [
    [120, -20,  20,   5,   5,  20, -20, 120],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [120, -20,  20,   5,   5,  20, -20, 120],
  ];

  let bestScore = -Infinity;
  let bestMove = moves[0];
  for (const [r, c] of moves) {
    const newBoard = cloneBoard(board);
    placeStone(newBoard, r, c, player);
    let score = weights[r][c];
    const counts = countStones(newBoard);
    score += player === BLACK ? counts.black - counts.white : counts.white - counts.black;
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }
  return bestMove;
}

function aiMinimax(board: Board, player: CellState, moves: [number, number][], depth: number = 4): [number, number] {
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const [r, c] of moves) {
    const newBoard = cloneBoard(board);
    placeStone(newBoard, r, c, player);
    const score = minimax(newBoard, opponent(player), depth - 1, -Infinity, Infinity, false, player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }
  return bestMove;
}

function minimax(board: Board, player: CellState, depth: number, alpha: number, beta: number, maximizing: boolean, originalPlayer: CellState): number {
  if (depth === 0 || isGameOver(board)) {
    return evaluateBoard(board, originalPlayer);
  }

  const moves = getValidMoves(board, player);
  if (moves.length === 0) {
    return minimax(board, opponent(player), depth - 1, alpha, beta, !maximizing, originalPlayer);
  }

  if (maximizing) {
    let maxEval = -Infinity;
    for (const [r, c] of moves) {
      const newBoard = cloneBoard(board);
      placeStone(newBoard, r, c, player);
      const ev = minimax(newBoard, opponent(player), depth - 1, alpha, beta, false, originalPlayer);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const [r, c] of moves) {
      const newBoard = cloneBoard(board);
      placeStone(newBoard, r, c, player);
      const ev = minimax(newBoard, opponent(player), depth - 1, alpha, beta, true, originalPlayer);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateBoard(board: Board, player: CellState): number {
  const weights = [
    [120, -20,  20,   5,   5,  20, -20, 120],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [  5,  -5,   3,   3,   3,   3,  -5,   5],
    [ 20,  -5,  15,   3,   3,  15,  -5,  20],
    [-20, -40,  -5,  -5,  -5,  -5, -40, -20],
    [120, -20,  20,   5,   5,  20, -20, 120],
  ];

  let score = 0;
  const opp = opponent(player);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === player) score += weights[r][c];
      else if (board[r][c] === opp) score -= weights[r][c];
    }
  }

  const myMoves = getValidMoves(board, player).length;
  const oppMoves = getValidMoves(board, opp).length;
  score += (myMoves - oppMoves) * 5;

  return score;
}
