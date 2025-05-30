# feat: コンテクストビルダー基本実装 (core/context_builder.py)

## 概要
タスク2.1に基づき、ContextBuilderクラスの基本構造と、各コンテクスト情報を整形するプライベートメソッドを実装します。

## 目的
キャラクターの不変情報、長期情報、場面情報、短期情報を整形し、LLMに渡すためのコンテクストを構築するクラスを実装します。これにより、キャラクターの思考生成や長期情報更新のための基盤を整えます。

## 実装内容
- `ContextBuilder`クラスの基本構造を実装
- コンストラクタで`CharacterManager`と`SceneManager`を受け取り、内部で保持
- 以下のメソッドを実装:
  - `build_context_for_character`: メインのコンテクスト構築メソッド
  - `_format_immutable_context`: 不変情報を整形
  - `_format_long_term_context`: 長期情報を整形
  - `_format_scene_context`: 場面情報を整形
  - `_format_short_term_context`: 短期情報を整形

## 技術的考慮事項
- 循環参照を避けるための型ヒントの扱いに注意
- 実装の初期段階では、各フォーマットメソッドは基本的な整形のみを行い、タスク4.1で詳細化する予定

## テスト
- 各フォーマットメソッドが期待通りの形式（文字列）で値を返すことを確認するユニットテスト
- サンプルデータを用いてコンテクスト全体が正しく構築されることを確認

## 修正履歴

### 2023-07-12: フィードバックに基づく修正
- `build_context_for_character`メソッドの返り値を文字列から辞書（Dict[str, str]）に変更
  - 各コンテクスト要素を個別のキーで保持し、`full_context`キーで統合されたコンテクストも提供
  - これにより、将来的にLLMAdapter側で柔軟にコンテクストを組み立てられるようになった
- `_format_scene_context`内のエラーハンドリングを改善
  - 広範囲な例外捕捉（`Exception`）を、より具体的な例外に分けて処理
  - エラーが発生した場合にログメッセージを出力するよう変更 