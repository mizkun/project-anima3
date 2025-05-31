# fix: サーバー再起動とシミュレーション開始機能修正

## 問題
1. バックエンドサーバーが`ModuleNotFoundError: No module named 'web'`で起動失敗
2. タイムラインの開始ボタンを押しても何も起きない

## 現在の状況
- バックエンド: localhost:8000で正常起動✅
- フロントエンド: localhost:3000で動作中✅
- API接続: 基本的な接続は成功✅

## 解決済み
- [x] バックエンドimportパス修正（既に対応済み）
- [x] サーバー再起動成功
- [x] EngineWrapper初期化問題修正
- [x] scenes_dir, prompts_dir, log_dir属性追加
- [x] デフォルトシーンファイル作成機能追加

## 残存問題
- [ ] SimulationEngineクラスのcharacter_manager属性不足
- [ ] 開始ボタンを押してもシミュレーションが開始されない

## 次のステップ
1. SimulationEngineクラスの修正が必要
2. より簡易的なシミュレーション開始フローを検討
3. フロントエンドのエラーハンドリング改善

## 実装内容
1. **EngineWrapper**: 不足属性を追加
2. **シーンファイル**: 動的作成機能を追加
3. **サーバー**: 正常起動確認

⚠️ **進行中**: SimulationEngineとの連携部分で課題が残存 