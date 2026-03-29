# GEMINI.md

## 基本情報
*   **プロジェクト名**: 盤上のファンタジア -Skill Reversi-
*   **概要**: キャラクターのスキルと凸強化要素を盛り込んだ、PWA形式の戦略オセロゲーム[cite: 1, 2]。
*   **想定技術スタック**:
    *   Frontend: TypeScript, Vite
    *   Rendering: Canvas API
    *   Communication: PeerJS (WebRTC) + Supabase/Firebase (Signaling)
    *   Offline: Service Worker / Cache API
    *   Logic: Web Workers (AI Computation)

## 設計指針
*   **ディレクトリ構造**:
    *   `/src/core`: オセロエンジン、スキル定義
    *   `/src/render`: Canvas描画、エフェクト
    *   `/src/ai`: Web Worker用AIロジック
    *   `/src/store`: LocalStorage管理 (State)
    *   `/src/ui`: DOMベースのUIコンポーネント
*   **命名規則**: クラス名は PascalCase、関数・変数は camelCase、定数は UPPER_SNAKE_CASE。
*   **PWA/ServiceWorker**: オフラインでのAI対戦を可能にするため、全てのアセットをキャッシュする[cite: 2]。

## 制約事項
*   **アセットサイズ上限**: 全アセット合計 5MB 未満（WebP形式を推奨）[cite: 2]。
*   **パフォーマンス予算**: iPhone 12以降で常時 60FPS を維持。初期ロード 2秒以内。
*   **外部API制限**: サーバー代節約のため、シグナリング以外のバックエンドは使用しない[cite: 2]。
*   **iOS制約**: オーディオ再生は必ずユーザーのボタンタップをトリガーとする[cite: 2]。

## 運用フロー
*   **ビルド・デプロイ**: `main` ブランチへのプッシュで GitHub Actions により GitHub Pages へ自動デプロイ。
*   **コミット方針**: 意味のある単位で分割し、機能名をプレフィックスに含める（例: `feat(skill): add Alfred's active skill`）。
*   **テスト**: ロジック変更時は必ず `npm test` を通過させること。

## 自律実行ルール
*   **承認が必要なタイミング**:
    *   ゲームバランスに影響するスキル効果の根本的変更
    *   外部ライブラリの新規追加
    *   データスキーマ（保存形式）の変更
*   **自律判断可能範囲**:
    *   UIの微調整、アニメーションの演出強化
    *   AIの評価関数微調整
    *   バグ修正

## QA要件
*   **エビデンス**:
    *   各画面のスクリーンショット（iPhone 縦向きアスペクト比）
    *   P2P接続成功時のコンソールログ
    *   Lighthouse によるパフォーマンス計測結果（Accessibility/PWA項目重視）
*   **色覚多様性モード**: 開発段階でシミュレーターを用い、青/オレンジの配色が有効に機能するか確認すること[cite: 2]。