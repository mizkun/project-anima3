 ## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 2.1. コンテクストビルダー基本実装 (core/context_builder.py)`
* **担当モジュール/ファイル**: `project_anima/core/context_builder.py` (新規作成)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 2.1. システム構成案 (コンテクスト生成モジュール)」
    * 「詳細仕様書 2.3. 用語定義 (コンテクスト、不変情報、長期情報、場面情報、短期情報)」
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理) - コンテクスト収集」
    * 「詳細仕様書 5.1. `core/` ディレクトリ内の各Pythonファイルの役割と主要な関数・クラス（想定）」
* **このタスクのゴール**: `ContextBuilder`クラスの基本構造を実装し、キャラクターの不変情報、長期情報、現在の場面情報、短期情報（直近の会話履歴など）をそれぞれ整形するプライベートメソッドの雛形を作成する。この段階では、各情報を個別に整形し、最終的に辞書として取得できる状態を目指す。

## 背景と目的 (Background and Purpose)

* キャラクターが思考する際に必要となる多岐にわたる情報（不変設定、経験、目標、記憶、現在の場面状況、直近のやり取りなど）を、関連するマネージャークラス (`CharacterManager`, `SceneManager`) から収集し、LLMが解釈しやすい形に整形・統合するための基盤を構築する。このモジュールは、LLMへのプロンプト品質を左右する重要な役割を担う。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**:
    * `ContextBuilder` のコンストラクタ: `CharacterManager` のインスタンス、`SceneManager` のインスタンス。
    * `build_context_for_character` メソッド:
        * `character_id: str`: コンテクストを構築する対象のキャラクターID。
        * `current_scene_short_term_log: List[TurnData]`: 現在の場面における短期情報（主に直近のターン履歴）。
        * `previous_scene_summary: Optional[str] = None`: (オプション) 直前場面の要約情報。このタスクではダミー処理または無視で可。
* **処理内容**:
    * `ContextBuilder` クラスは、コンストラクタで受け取った `CharacterManager` と `SceneManager` のインスタンスを内部に保持する。
    * `build_context_for_character` メソッドは、以下のステップで処理を行う:
        1.  `character_id` を用いて `CharacterManager` から不変情報 (`ImmutableCharacterData`) と長期情報 (`LongTermCharacterData`) を取得する。
        2.  `SceneManager` から現在の場面情報 (`SceneInfoData`) を取得する。
        3.  取得した各データと引数の `current_scene_short_term_log` を、それぞれ専用のプライベート整形メソッド (`_format_immutable_context`, `_format_long_term_context`, `_format_scene_context`, `_format_short_term_context`) に渡して整形処理を行う。
        4.  **このタスクの段階では、各 `_format_*` メソッドは、受け取ったデータを単純な説明的な文字列（例: "キャラクター名: アリス\n性格: 好奇心旺盛..."）に変換するダミー実装でよい。本格的なプロンプトエンジニアリングは後のタスク(4.1)で行う。**
        5.  整形された各コンテクスト情報（不変情報文字列、長期情報文字列、場面情報文字列、短期情報文字列）をキーと値のペアとする辞書を作成して返す。
* **出力/返り値**:
    * `build_context_for_character`: 各コンテクスト情報（文字列）を格納した辞書。キーの例: `"immutable_context_str"`, `"long_term_context_str"`, `"scene_context_str"`, `"short_term_context_str"`。
* **エラーハンドリング**:
    * `CharacterManager` または `SceneManager` から情報を取得する際に発生した例外 (例: `CharacterNotFoundError`, `SceneNotLoadedError`) は、そのまま呼び出し元に伝播させる。
    * 各 `_format_*` メソッド内での予期せぬエラーも適切に処理する（基本的には発生しない想定のダミー実装だが）。
* **考慮事項**:
    * 各 `_format_*` メソッドの返り値は、この段階では単純な文字列で良いが、将来的に構造化されたデータ（例: LLMのFew-shotプロンプト用のメッセージリスト形式）に変更される可能性も視野に入れる（ただし、今回は文字列で実装）。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 作成するファイル: `project_anima/core/context_builder.py`
* 作成するクラス: `ContextBuilder`
* クラスの主要メソッド:
    * `__init__(self, character_manager: 'CharacterManager', scene_manager: 'SceneManager')` (型ヒントは前方参照または `from .character_manager import CharacterManager` など)
    * `build_context_for_character(self, character_id: str, current_scene_short_term_log: List['TurnData'], previous_scene_summary: Optional[str] = None) -> Dict[str, str]`
    * `_format_immutable_context(self, immutable_data: 'ImmutableCharacterData') -> str` (プライベートメソッド)
    * `_format_long_term_context(self, long_term_data: 'LongTermCharacterData') -> str` (プライベートメソッド)
    * `_format_scene_context(self, scene_data: 'SceneInfoData') -> str` (プライベートメソッド)
    * `_format_short_term_context(self, short_term_log: List['TurnData']) -> str` (プライベートメソッド)
* 必要なインポート:
    ```python
    from typing import Dict, List, Optional
    # from .character_manager import CharacterManager # 循環参照を避けるため、型ヒントは文字列で'CharacterManager'などとするか、
    # from .scene_manager import SceneManager       # 実行時にインポートするか、あるいはTypeAliasを使うなどを検討。
    # from .data_models import ImmutableCharacterData, LongTermCharacterData, SceneInfoData, TurnData # こちらは直接利用
    ```
    **注意**: `character_manager` と `scene_manager` は `core` パッケージ内の他のモジュールなので、循環参照を避けるために型チェック時のみ有効なインポート (`if TYPE_CHECKING:`) や文字列リテラルによる型ヒント (`'CharacterManager'`) を使用することを推奨します。

**2. 実装ロジックの詳細:**

* **`__init__`**:
    1.  `character_manager` と `scene_manager` のインスタンスを、それぞれインスタンス変数 `self._character_manager` と `self._scene_manager` に保存する。

* **`build_context_for_character`**:
    1.  `self._character_manager.get_immutable_context(character_id)` を呼び出し不変情報を取得。
    2.  `self._character_manager.get_long_term_context(character_id)` を呼び出し長期情報を取得。
    3.  `self._scene_manager.get_current_scene_info()` を呼び出し場面情報を取得。
    4.  上記で取得したデータと `current_scene_short_term_log` を、それぞれ対応する `_format_*` メソッドに渡して整形済み文字列を取得する。
    5.  `previous_scene_summary` はこの段階では使用しなくても良い。
    6.  結果を辞書にまとめて返す。例:
        ```python
        return {
            "immutable_context_str": formatted_immutable_str,
            "long_term_context_str": formatted_long_term_str,
            "scene_context_str": formatted_scene_str,
            "short_term_context_str": formatted_short_term_str,
        }
        ```

* **`_format_immutable_context(self, immutable_data: 'ImmutableCharacterData') -> str`**:
    * (ダミー実装) `immutable_data` の主要なフィールド（名前、性格など）を人間が読める形式の文字列に整形して返す。例: `f"キャラクター名: {immutable_data.name}\n性格: {immutable_data.base_personality}"`

* **`_format_long_term_context(self, long_term_data: 'LongTermCharacterData') -> str`**:
    * (ダミー実装) `long_term_data` の経験、目標、記憶などを要約した文字列を生成して返す。例: `f"経験の数: {len(long_term_data.experiences)}\n目標の数: {len(long_term_data.goals)}"`

* **`_format_scene_context(self, scene_data: 'SceneInfoData') -> str`**:
    * (ダミー実装) `scene_data` の場所、時間、状況などを説明する文字列を生成して返す。例: `f"場所: {scene_data.location}\n状況: {scene_data.situation}"`

* **`_format_short_term_context(self, short_term_log: List['TurnData']) -> str`**:
    * (ダミー実装) `short_term_log` （直近のターン履歴）を会話形式のような文字列に整形して返す。例: 各ターンの「キャラ名: 発言」を改行で繋げたもの。もしログが空なら「直近の会話はありません。」など。

**3. 返り値/出力の詳細:**

* `build_context_for_character` は、キーがコンテクスト種別を示す文字列、値が整形されたコンテクスト文字列である辞書 (`Dict[str, str]`) を返す。

**4. エラーハンドリングの詳細:**

* `CharacterManager` や `SceneManager` から例外がスローされた場合は、それを捕捉せずそのまま呼び出し元に伝播させる。
* `_format_*` メソッド内で、渡されたデータが `None` である可能性も考慮する（例: `SceneManager`が場面未ロード時に`None`を返す場合など）。その場合は、対応するコンテクスト文字列として「情報なし」などを返すようにする。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全てのメソッドの引数、返り値に付与してください。
* 各クラス、メソッドにはdocstringを適切な形式で記述してください。
* **循環参照を避けるための型ヒントの扱い**に注意してください。`from __future__ import annotations` をファイルの先頭に記述し、クラス名を文字列で指定するか (`'ClassName'`)、`typing.TYPE_CHECKING` を使用した条件付きインポートを検討してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトの準備
* `CharacterManager` と `SceneManager` のモックを作成する。
* これらのモックは、`get_immutable_context`, `get_long_term_context`, `get_current_scene_info` が、テスト用のダミー `ImmutableCharacterData`, `LongTermCharacterData`, `SceneInfoData` インスタンス、または `None` (場面未ロード時など) を返すように設定する。
* テスト用のダミー `TurnData` のリストも準備する。

### 正常系テスト

1.  **テストケース1: 全てのコンテクスト情報が正常に取得・整形される**
    * **前提条件/入力**: モックされた `CharacterManager` と `SceneManager` が、全ての情報（不変、長期、場面）を正常に返すように設定。`current_scene_short_term_log` にもダミーターンデータを提供。
    * **操作手順**: `context_builder.build_context_for_character("test_char_id", dummy_short_term_log)` を実行。
    * **期待される結果**: 返される辞書に、"immutable_context_str", "long_term_context_str", "scene_context_str", "short_term_context_str" のキーが存在し、各値がそれぞれの `_format_*` メソッドのダミー実装によって整形された期待通りの文字列であること。
2.  **テストケース2: 場面情報が未ロードの場合 (SceneManagerがNoneを返す)**
    * **前提条件/入力**: モックされた `SceneManager.get_current_scene_info()` が `None` を返すように設定。他は正常。
    * **操作手順**: `context_builder.build_context_for_character(...)` を実行。
    * **期待される結果**: 返される辞書の "scene_context_str" の値が「場面情報なし」のような適切な文字列になること。他のコンテクストは正常に整形されること。
3.  **テストケース3: 短期ログが空の場合**
    * **前提条件/入力**: `current_scene_short_term_log` が空のリスト `[]`。他は正常。
    * **操作手順**: `context_builder.build_context_for_character(...)` を実行。
    * **期待される結果**: 返される辞書の "short_term_context_str" の値が「直近の会話はありません。」のような適切な文字列になること。

### 異常系テスト

1.  **テストケース1: CharacterManagerがCharacterNotFoundErrorを発生させる場合**
    * **前提条件/入力**: モックされた `CharacterManager.get_immutable_context()` が `CharacterNotFoundError` を発生させるように設定。
    * **操作手順**: `try-except CharacterNotFoundError` で `context_builder.build_context_for_character(...)` を実行。
    * **期待される結果**: `CharacterNotFoundError` がそのまま伝播されること。
2.  **テストケース2: SceneManagerが (例えば) InvalidSceneDataErrorを発生させる場合 (ロードに失敗しているケース)**
    * **前提条件/入力**: モックされた `SceneManager.get_current_scene_info()` が `InvalidSceneDataError` (またはそれに類するエラー) を発生させるように設定。
    * **操作手順**: `try-except InvalidSceneDataError` で `context_builder.build_context_for_character(...)` を実行。
    * **期待される結果**: 例外がそのまま伝播されること。

## 完了の定義 (Definition of Done)

* [ ] `project_anima/core/context_builder.py` に `ContextBuilder` クラスと指定されたメソッドの雛形が実装されている。
* [ ] `__init__` メソッドで `CharacterManager` と `SceneManager` のインスタンスが正しく受け取られ、保持される。
* [ ] `_format_immutable_context`, `_format_long_term_context`, `_format_scene_context`, `_format_short_term_context` メソッドが、ダミー実装として、渡されたデータを基に簡単な説明文字列を返す。
* [ ] `build_context_for_character` メソッドが、上記プライベートメソッドを呼び出し、結果を整形済み文字列の辞書として返す。
* [ ] 関連マネージャからの例外は適切に伝播される。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_context_builder.py`）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクはあくまで「基本実装」です。各コンテクスト情報をどのようにLLMに効果的に伝えるか、という本格的なプロンプトエンジニアリングは後のタスク（4.1）で行います。今回は、各情報を取得し、単純な文字列に整形するパイプラインを作ることに集中してください。
* 循環参照を避けるための型ヒントの扱いは、Pythonのバージョンやプロジェクトの規約に応じて、`from __future__ import annotations`、文字列リテラル型ヒント、`TYPE_CHECKING`ブロックなどを適切に選択してください。