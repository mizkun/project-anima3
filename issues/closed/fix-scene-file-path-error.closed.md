# fix: シーンファイルパス構築エラーを修正

## 問題の概要
シミュレーション開始時に、character_nameが空のためシーンファイルが見つからないエラーが発生している。

## 現象
- シミュレーション開始時に以下のエラーが発生:
  ```
  シーンファイルが見つかりません: /Users/kyohei/vscode/project-anima/data/scenes/.yaml
  ```
- character_nameが空文字列のため、ファイル名が`.yaml`になってしまう

## 原因
1. `engine_wrapper.py`でシーンファイルパスを`config.character_name`で構築している
2. フロントエンドからcharacter_nameが適切に送信されていない
3. シーンファイルとキャラクターの関連付けが不明確

## 修正方針
1. 利用可能なシーンファイルから適切なデフォルトを選択する
2. character_nameが空の場合の処理を追加する
3. シーンとキャラクターの関連付けロジックを見直す

## 影響範囲
- `web/backend/services/engine_wrapper.py`
- シミュレーション開始機能

## 優先度
高 - シミュレーション機能の基本動作に影響

## 修正内容
- シーンファイルパスの構築を`config.character_name`から`get_available_scenes()`の最初のシーンを使用するように変更
- `get_simulation_state`メソッドでデフォルト設定を完全に指定するように修正
- シミュレーション開始が正常に動作することを確認

## 完了日時
2025-05-26 21:50 