# feat: 自動実行機能の完全無効化

## 概要
Project Animaの自動実行機能を完全に無効化し、手動制御のみに限定する。

## 背景
ユーザーから「自動実行はもう一生しないので、やめてください」という要求があった。
現在のシステムには以下の自動実行機能が存在している：

1. `SimulationEngine.start_simulation()` - 無制限ループでの自動実行
2. CLI (`cli.py`) - 最大ターン数まで自動実行
3. インタラクティブCLI - 手動制御（維持）
4. Web UI - 手動制御（維持）

## 対応方針
1. `start_simulation`メソッドを非推奨化または削除
2. CLIの自動実行機能を無効化
3. 手動制御のみを推奨する設計に変更
4. ドキュメントの更新

## 実装内容

### 1. SimulationEngineの修正
- `start_simulation`メソッドを非推奨化
- 自動ループ機能を削除
- 手動制御（`start_simulation_setup` + `execute_one_turn`）のみを推奨

### 2. CLIの修正
- `cli.py`の自動実行機能を無効化
- インタラクティブCLIへの誘導メッセージを追加

### 3. ドキュメント更新
- README.mdの更新
- 使用例の修正

## 完了条件
- [x] `start_simulation`メソッドの非推奨化
- [x] CLIの自動実行機能無効化
- [x] テストの修正
- [x] ドキュメントの更新
- [x] 手動制御のみでの動作確認

## 実装完了

自動実行機能の完全無効化が完了しました。

### 実装内容
1. **SimulationEngine.start_simulation()の非推奨化**
   - 非推奨警告を追加
   - 自動ループを削除し、セットアップのみ実行
   - 手動制御への誘導メッセージを追加

2. **CLIの自動実行機能無効化**
   - `cli.py`を完全に無効化
   - 手動制御オプションの案内を表示
   - 指定された設定の警告表示

3. **テストファイルの修正**
   - `examples/manual_test_simulation_engine.py`を手動制御方式に変更
   - `tests/manual/manual_test_simulation_engine.py`を手動制御方式に変更

4. **ドキュメントの更新**
   - README.mdの使用方法を手動制御方式に更新
   - 自動実行無効化の警告を追加

### 利用可能な手動制御方式
1. **インタラクティブCLI（推奨）**: `python -m project_anima.interactive_cli`
2. **Web UI**: バックエンド + フロントエンドサーバー
3. **プログラムから**: `start_simulation_setup()` + `execute_one_turn()`

自動実行機能は完全に無効化され、手動制御のみが利用可能になりました。

## 注意事項
- Web UIとインタラクティブCLIの手動制御機能は維持
- 既存のテストコードは手動制御方式に変更
- 後方互換性は考慮しない（破壊的変更として扱う） 