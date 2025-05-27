# fix: フロントエンドAPIエンドポイントの不一致を修正

## 問題の概要
フロントエンドで異なるAPIエンドポイントが使用されており、バックエンドのエンドポイントと一致していない。

## 現象
- シミュレーション開始ボタンを押すと404エラーが発生
- ログに `POST /api/simulations/start HTTP/1.1" 404 Not Found` が記録される

## 原因
- バックエンド: `/api/simulation/start` （単数形）
- フロントエンド（useSimulationControls.ts）: `/api/simulations/start` （複数形）
- フロントエンド（useSimulation.ts）: `/api/simulation/start` （単数形）

## 修正方針
`useSimulationControls.ts` のAPIエンドポイントをバックエンドと一致するように修正する。

## 影響範囲
- `web/frontend/src/hooks/useSimulationControls.ts`
- シミュレーション制御機能全般

## 優先度
高 - シミュレーション機能の基本動作に影響

## 修正内容
- `/simulations/start` → `/simulation/start` に修正
- `/simulations/stop` → `/simulation/stop` に修正
- `/simulations/next-turn` → `/simulation/next` に修正
- pause/resume機能は未実装のため一時的にコメントアウト

## 完了日時
2025-05-26 21:35 