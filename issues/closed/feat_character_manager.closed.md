## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 1.3. キャラクター設定ファイルの読み込み (core/character_manager.py)`
* **担当モジュール/ファイル**: `project_anima/core/character_manager.py` (新規作成または既存ファイルに追記)
* **関連する詳細仕様書セクション**: 「詳細仕様書 2.1. システム構成案 (キャラクター設定管理モジュール)」、「3.2.2. コンテクスト管理 (不変情報, 長期情報)」、「5.1. `core/` ディレクトリ内の各Pythonファイルの役割と主要な関数・クラス（想定）」
* **このタスクのゴール**: `CharacterManager` クラスを定義し、指定されたキャラクターの不変情報 (`immutable.yaml`) と長期情報 (`long_term.yaml`) をファイルから読み込み、対応するPydanticデータモデルのインスタンスとして保持・提供する機能を実装する。

## 背景と目的 (Background and Purpose)

* シミュレーションに必要なキャラクターの基本設定や成長情報を、ファイルベースで永続化し、プログラムから容易にアクセスできるようにする。これにより、キャラクターデータの管理を一元化し、シミュレーションエンジンの他のモジュールがキャラクター情報を利用しやすくする。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**:
    * `CharacterManager` のコンストラクタ: キャラクター設定ファイルが格納されているベースディレクトリのパス (例: `"project_anima/characters/"`)
    * `load_character_data` メソッド: 読み込む対象のキャラクターID (文字列)
    * `get_immutable_context` メソッド: 対象のキャラクターID (文字列)
    * `get_long_term_context` メソッド: 対象のキャラクターID (文字列)
* **処理内容**:
    * `CharacterManager` クラスは、インスタンス化される際にキャラクターデータのベースパスを保持する。
    * `load_character_data` メソッドは、指定された `character_id` に基づき、対応するキャラクターのディレクトリパスを特定する (例: `characters/<character_name_or_id>/`)。
    * 特定したディレクトリ内の `immutable.yaml` と `long_term.yaml` を、タスク1.2で実装した `file_handler.load_yaml` 関数を使って読み込む。
    * 読み込んだデータを、タスク1.1で定義した `ImmutableCharacterData` および `LongTermCharacterData` のPydanticモデルにパース（インスタンス化）する。
    * パースしたデータモデルのインスタンスを、クラス内部の辞書などに `character_id` をキーとしてキャッシュ（保持）する。一度読み込んだデータは再度ファイルアクセスしないようにする。
    * `get_immutable_context` および `get_long_term_context` メソッドは、キャッシュされたデータモデルのインスタンスを返す。キャッシュにない場合は、`load_character_data` を内部で呼び出してから返すか、エラーとする（要検討）。
* **出力/返り値**:
    * `load_character_data`: なし (内部状態を更新)
    * `get_immutable_context`: 対応する `ImmutableCharacterData` インスタンス。見つからない場合は `None` または例外 (例: `CharacterNotFoundError`) を返す。
    * `get_long_term_context`: 対応する `LongTermCharacterData` インスタンス。見つからない場合は `None` または例外を返す。
* **エラーハンドリング**:
    * 指定された `character_id` に対応するキャラクターディレクトリや設定ファイルが存在しない場合 (`FileNotFoundError`)。
    * YAMLファイルの内容が不正でPydanticモデルへのパースに失敗した場合 (`pydantic.ValidationError`, `yaml.YAMLError`)。
    * これらのエラーは、適切にログ出力し、呼び出し元に例外として伝播させるか、あるいは `None` を返すなど、明確なエラー処理方針を定める。
* **考慮事項**:
    * キャラクターデータのファイルパス解決ロジック（ベースパスとキャラクターIDから実際のファイルパスを組み立てる部分）。
    * 詳細仕様書「5. フォルダ構成案」では、`characters/` ディレクトリ下の各キャラクターフォルダ名は人間可読な名前を推奨し、YAMLファイル内に `character_id` を持つ形式としたが、`CharacterManager` が `character_id` を元にこれらのファイルを見つけられるようにする必要がある。一つの方法として、`CharacterManager` 初期化時に `characters/` ディレクトリをスキャンし、全キャラクターの `immutable.yaml` を読み込んで `character_id` とフォルダパスのマッピングを内部に保持する、などが考えられる。あるいは、キャラクターフォルダ名自体を `character_id` とすることを強制するルールも検討できる。ここでは、**キャラクターフォルダ名は `character_id` と同一であると仮定して実装を進めることを推奨する。** (例: `characters/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/immutable.yaml`) これによりパス解決が簡潔になる。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 作成/編集するファイル: `project_anima/core/character_manager.py`
* 作成するクラス: `CharacterManager`
* クラスの主要メソッド:
    * `__init__(self, characters_base_path: str)`
    * `load_character_data(self, character_id: str) -> None` (または成功/失敗を示すbool値を返す)
    * `get_immutable_context(self, character_id: str) -> Optional[ImmutableCharacterData]`
    * `get_long_term_context(self, character_id: str) -> Optional[LongTermCharacterData]`
    * `update_long_term_context(self, character_id: str, new_long_term_data: LongTermCharacterData) -> None` (これはタスク5.2で本格実装するが、雛形だけ用意しても良い)
* 必要なインポート: `from typing import Optional, Dict`, `from ..utils.file_handler import load_yaml, save_yaml` (相対インポート), `from .data_models import ImmutableCharacterData, LongTermCharacterData` (相対インポート), `import os`, `from pydantic import ValidationError` (エラーハンドリング用), `import yaml` (エラーハンドリング用)

**2. 実装ロジックの詳細:**

* **`__init__(self, characters_base_path: str)`**:
    1.  引数で受け取った `characters_base_path` をインスタンス変数として保存する。
    2.  読み込んだキャラクターデータをキャッシュするための辞書を初期化する (例: `self._immutable_cache: Dict[str, ImmutableCharacterData] = {}`, `self._long_term_cache: Dict[str, LongTermCharacterData] = {}`)。

* **`_get_character_dir_path(self, character_id: str) -> str`** (プライベートヘルパーメソッド推奨):
    1.  `self.characters_base_path` と `character_id` を結合して、対象キャラクターのディレクトリパスを生成して返す (例: `os.path.join(self.characters_base_path, character_id)`)。

* **`load_character_data(self, character_id: str) -> None`**:
    1.  もし `character_id` が既にキャッシュに存在すれば、何もしないで早期リターンする。
    2.  `_get_character_dir_path(character_id)` を使ってキャラクターのディレクトリパスを取得する。
    3.  `immutable_file_path = os.path.join(character_dir_path, "immutable.yaml")` を作成。
    4.  `long_term_file_path = os.path.join(character_dir_path, "long_term.yaml")` を作成。
    5.  `try-except` ブロックを使用し、以下の処理を行う:
        * `load_yaml(immutable_file_path)` で不変情報を読み込み、`ImmutableCharacterData(**raw_immutable_data)` でPydanticモデルに変換する。
        * `load_yaml(long_term_file_path)` で長期情報を読み込み、`LongTermCharacterData(**raw_long_term_data)` でPydanticモデルに変換する。
        * 変換したモデルインスタンスを、それぞれ `self._immutable_cache[character_id]` と `self._long_term_cache[character_id]` に保存する。
    6.  例外処理:
        * `FileNotFoundError`: ログにエラーメッセージを出力し、`CharacterNotFoundError` (カスタム例外、後述) をraiseする。
        * `yaml.YAMLError`, `ValidationError`: ログにエラーメッセージを出力し、`InvalidCharacterDataError` (カスタム例外、後述) をraiseする。
        * その他の `Exception`: 予期せぬエラーとしてログ出力し、そのままraiseするか、汎用的なカスタム例外をraiseする。

* **`get_immutable_context(self, character_id: str) -> Optional[ImmutableCharacterData]`**:
    1.  もし `character_id` が `self._immutable_cache` になければ、`self.load_character_data(character_id)` を呼び出す。
    2.  `self._immutable_cache.get(character_id)` を返す (存在しない場合は `None` が返る)。
    3.  `load_character_data` で例外が発生した場合は、それがそのまま伝播される。

* **`get_long_term_context(self, character_id: str) -> Optional[LongTermCharacterData]`**:
    1.  もし `character_id` が `self._long_term_cache` になければ、`self.load_character_data(character_id)` を呼び出す。
    2.  `self._long_term_cache.get(character_id)` を返す。
    3.  `load_character_data` で例外が発生した場合は、それがそのまま伝播される。

* **カスタム例外の定義** (同ファイル内または別の `exceptions.py` ファイルに定義):
    ```python
    class CharacterManagerError(Exception):
        """Base exception for CharacterManager."""
        pass

    class CharacterNotFoundError(CharacterManagerError):
        """Raised when a character's data is not found."""
        def __init__(self, character_id: str):
            super().__init__(f"Character data not found for ID: {character_id}")
            self.character_id = character_id

    class InvalidCharacterDataError(CharacterManagerError):
        """Raised when character data is invalid or cannot be parsed."""
        def __init__(self, character_id: str, original_error: Exception):
            super().__init__(f"Invalid character data for ID: {character_id}. Original error: {original_error}")
            self.character_id = character_id
            self.original_error = original_error
    ```

**3. 返り値/出力の詳細:**

* `get_immutable_context`: `ImmutableCharacterData` インスタンスまたは `None` (エラー時は例外)。
* `get_long_term_context`: `LongTermCharacterData` インスタンスまたは `None` (エラー時は例外)。

**4. エラーハンドリングの詳細:**

* 上記「実装ロジックの詳細」の `load_character_data` 内の例外処理を参照。
* `get_*` メソッドは、内部で呼び出す `load_character_data` から発生する例外をそのまま伝播させるか、あるいは `None` を返すことでエラーを示す。Docstringにその挙動を明記する。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全てのメソッドの引数、返り値に付与してください。
* 各クラス、メソッドにはdocstringを適切な形式で記述してください。
* `characters_base_path` の末尾に `/` があってもなくても正しく動作するように、`os.path.join` を適切に使用してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: テスト用のキャラクターデータ準備
* `tests/test_data/characters/char_001/immutable.yaml`
* `tests/test_data/characters/char_001/long_term.yaml`
* `tests/test_data/characters/char_002_invalid_yaml/immutable.yaml` (不正なYAML形式)
* `tests/test_data/characters/char_003_validation_error/immutable.yaml` (Pydanticバリデーションエラーを起こすデータ)

### 正常系テスト

1.  **テストケース1: 正常なキャラクターデータの読み込みと取得**
    * **前提条件/入力**: `CharacterManager("tests/test_data/characters/")` をインスタンス化。
    * **操作手順**:
        1.  `manager.load_character_data("char_001")` (明示的に呼ぶか、getメソッド経由で呼ばせる)
        2.  `immutable_data = manager.get_immutable_context("char_001")`
        3.  `long_term_data = manager.get_long_term_context("char_001")`
    * **期待される結果**:
        * `immutable_data` が `ImmutableCharacterData` のインスタンスであり、ファイルの内容と一致すること。
        * `long_term_data` が `LongTermCharacterData` のインスタンスであり、ファイルの内容と一致すること。
        * 再度 `get_immutable_context("char_001")` を呼び出しても、ファイルアクセスが発生せずキャッシュから返されること (モック等で確認)。
2.  **テストケース2: `get_*` メソッドでデータが存在しない場合に初回ロードが行われる**
    * **前提条件/入力**: `CharacterManager("tests/test_data/characters/")` をインスタンス化。キャッシュは空。
    * **操作手順**: `immutable_data = manager.get_immutable_context("char_001")`
    * **期待される結果**: `immutable_data` が正しく取得できること。

### 異常系テスト

1.  **テストケース1: 存在しないキャラクターIDの指定**
    * **前提条件/入力**: `CharacterManager("tests/test_data/characters/")`
    * **操作手順**: `try-except CharacterNotFoundError` で `manager.get_immutable_context("non_existent_char")` を実行。
    * **期待される結果**: `CharacterNotFoundError` が発生すること。
2.  **テストケース2: `immutable.yaml` が存在しない**
    * **前提条件/入力**: `char_001` のディレクトリに `immutable.yaml` がない状態で `CharacterManager` を設定。
    * **操作手順**: `try-except CharacterNotFoundError` で `manager.get_immutable_context("char_001")` を実行。
    * **期待される結果**: `CharacterNotFoundError` が発生すること。
3.  **テストケース3: YAMLファイルが不正な形式**
    * **前提条件/入力**: `CharacterManager("tests/test_data/characters/")`
    * **操作手順**: `try-except InvalidCharacterDataError` で `manager.get_immutable_context("char_002_invalid_yaml")` を実行。
    * **期待される結果**: `InvalidCharacterDataError` が発生し、`original_error` が `yaml.YAMLError` であること。
4.  **テストケース4: データがPydanticモデルのバリデーションに失敗**
    * **前提条件/入力**: `CharacterManager("tests/test_data/characters/")`
    * **操作手順**: `try-except InvalidCharacterDataError` で `manager.get_immutable_context("char_003_validation_error")` を実行。
    * **期待される結果**: `InvalidCharacterDataError` が発生し、`original_error` が `ValidationError` であること。

## 完了の定義 (Definition of Done)

* [ ] `project_anima/core/character_manager.py` に `CharacterManager` クラスが実装されている。
* [ ] `load_character_data`, `get_immutable_context`, `get_long_term_context` メソッドが仕様通りに動作する。
* [ ] キャラクターデータの読み込みとPydanticモデルへの変換が正しく行われる。
* [ ] 読み込んだデータは適切にキャッシュされ、不要なファイルアクセスが削減される。
* [ ] ファイルが見つからない場合やデータが不正な場合の適切なエラーハンドリング（カスタム例外を含む）が実装されている。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_character_manager.py`）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* キャラクターフォルダ名と `character_id` の関連付けについて、このタスクでは「キャラクターフォルダ名が `character_id` と同一である」という前提で実装を進めてください。もし将来的に異なるアプローチ（例: マッピングファイルの導入など）が必要になった場合は、別途タスクとして対応します。
* `update_long_term_context` メソッドは、このタスクでは雛形のみ（pass文など）で構いません。本格的な実装はタスク5.2で行います。