 ## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 1.4. 場面設定ファイルの読み込み (core/scene_manager.py)`
* **担当モジュール/ファイル**: `project_anima/core/scene_manager.py` (新規作成または既存ファイルに追記)
* **関連する詳細仕様書セクション**: 「詳細仕様書 2.1. システム構成案 (場面管理モジュール)」、「3.2.2. コンテクスト管理 (場面情報)」、「4.2. ファイル形式と入出力 (場面設定ファイルの入力)」、「5.1. `core/` ディレクトリ内の各Pythonファイルの役割と主要な関数・クラス（想定）」
* **このタスクのゴール**: `SceneManager` クラスを定義し、指定された場面設定ファイル (`scenes/<scene_id>.yaml`) を読み込み、対応するPydanticデータモデル (`SceneInfoData`) のインスタンスとして保持・提供する機能を実装する。

## 背景と目的 (Background and Purpose)

* シミュレーションの舞台となる各場面の情報をファイルベースで管理し、プログラムから容易にアクセスできるようにする。これにより、シミュレーションエンジンが現在の場面状況を把握し、キャラクターのコンテクスト生成に利用できるようにする。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**:
    * `SceneManager` のコンストラクタ: (現時点では引数なし、または場面ファイルが格納されるベースディレクトリパスも検討可)
    * `load_scene_from_file` メソッド: 読み込む対象の場面設定ファイルのパス (文字列)
    * `get_current_scene_info` メソッド: (引数なし)
    * `get_participant_character_ids` メソッド: (引数なし)
* **処理内容**:
    * `SceneManager` クラスは、インスタンス化される際に、現在の場面情報を保持するためのインスタンス変数 (例: `self._current_scene: Optional[SceneInfoData] = None`) を初期化する。
    * `load_scene_from_file` メソッドは、指定されたファイルパスの場面設定YAMLファイルを、タスク1.2で実装した `file_handler.load_yaml` 関数を使って読み込む。
    * 読み込んだデータを、タスク1.1で定義した `SceneInfoData` のPydanticモデルにパース（インスタンス化）する。
    * パースした `SceneInfoData` インスタンスを `self._current_scene` に格納する。
    * `get_current_scene_info` メソッドは、`self._current_scene` を返す。場面がロードされていない場合は `None` または例外 (例: `SceneNotLoadedError`) を返す。
    * `get_participant_character_ids` メソッドは、`self._current_scene` から参加キャラクターIDのリストを返す。場面がロードされていない、または参加者がいない場合は空リストまたは例外を返す。
* **出力/返り値**:
    * `load_scene_from_file`: なし (内部状態を更新)
    * `get_current_scene_info`: `SceneInfoData` インスタンスまたは `None` (エラー時は例外)。
    * `get_participant_character_ids`: `List[str]` (参加キャラクターIDのリスト)。
* **エラーハンドリング**:
    * 指定された場面設定ファイルが存在しない場合 (`FileNotFoundError`)。
    * YAMLファイルの内容が不正でPydanticモデルへのパースに失敗した場合 (`pydantic.ValidationError`, `yaml.YAMLError`)。
    * これらのエラーは、適切にログ出力し、呼び出し元に例外として伝播させるか、あるいは `None` を返すなど、明確なエラー処理方針を定める。
* **考慮事項**:
    * `SceneManager` は一度に一つの場面情報のみを管理する想定で良いか。 (現状の仕様ではその想定)
    * 「詳細仕様書 4.2」では、場面設定ファイルのパスはシステム起動時に引数として指定される想定だが、`SceneManager` としてはファイルパスを受け取ってロードする機能を持つ。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 作成/編集するファイル: `project_anima/core/scene_manager.py`
* 作成するクラス: `SceneManager`
* クラスの主要メソッド:
    * `__init__(self)`
    * `load_scene_from_file(self, scene_file_path: str) -> None` (または成功/失敗を示すbool値を返す)
    * `get_current_scene_info(self) -> Optional[SceneInfoData]`
    * `get_participant_character_ids(self) -> List[str]`
    * `update_scene_situation(self, new_situation_description: str) -> None` (これはタスク5.3で本格実装するが、雛形だけ用意しても良い)
    * `add_character_to_scene(self, character_id: str) -> None` (タスク5.3雛形)
    * `remove_character_from_scene(self, character_id: str) -> None` (タスク5.3雛形)
* 必要なインポート: `from typing import Optional, List`, `from ..utils.file_handler import load_yaml` (相対インポート), `from .data_models import SceneInfoData` (相対インポート), `from pydantic import ValidationError` (エラーハンドリング用), `import yaml` (エラーハンドリング用)

**2. 実装ロジックの詳細:**

* **`__init__(self)`**:
    1.  現在の場面情報を保持するインスタンス変数 `self._current_scene: Optional[SceneInfoData]` を `None` で初期化する。

* **`load_scene_from_file(self, scene_file_path: str) -> None`**:
    1.  `try-except` ブロックを使用し、以下の処理を行う:
        * `load_yaml(scene_file_path)` で場面設定情報を読み込む。
        * 読み込んだデータを `SceneInfoData(**raw_scene_data)` でPydanticモデルに変換する。
        * 変換したモデルインスタンスを `self._current_scene` に保存する。
    2.  例外処理:
        * `FileNotFoundError`: ログにエラーメッセージを出力し、`SceneFileNotFoundError` (カスタム例外、後述) をraiseする。
        * `yaml.YAMLError`, `ValidationError`: ログにエラーメッセージを出力し、`InvalidSceneDataError` (カスタム例外、後述) をraiseする。
        * その他の `Exception`: 予期せぬエラーとしてログ出力し、そのままraiseするか、汎用的なカスタム例外をraiseする。

* **`get_current_scene_info(self) -> Optional[SceneInfoData]`**:
    1.  `self._current_scene` を返す。まだ場面がロードされていない場合は `None` が返る。
    2.  あるいは、場面がロードされていない場合に `SceneNotLoadedError` (カスタム例外、後述) をraiseする設計も検討可。Docstringにその挙動を明記する。現時点では `Optional` を推奨。

* **`get_participant_character_ids(self) -> List[str]`**:
    1.  `self._current_scene` が `None` でなければ、`self._current_scene.participant_character_ids` を返す。
    2.  `self._current_scene` が `None` の場合は、空のリスト `[]` を返す。

* **カスタム例外の定義** (同ファイル内または別の `exceptions.py` ファイルに定義):
    ```python
    class SceneManagerError(Exception):
        """Base exception for SceneManager."""
        pass

    class SceneFileNotFoundError(SceneManagerError):
        """Raised when a scene file is not found."""
        def __init__(self, scene_file_path: str):
            super().__init__(f"Scene file not found: {scene_file_path}")
            self.scene_file_path = scene_file_path

    class InvalidSceneDataError(SceneManagerError):
        """Raised when scene data is invalid or cannot be parsed."""
        def __init__(self, scene_file_path: str, original_error: Exception):
            super().__init__(f"Invalid scene data in file: {scene_file_path}. Original error: {original_error}")
            self.scene_file_path = scene_file_path
            self.original_error = original_error
            
    class SceneNotLoadedError(SceneManagerError):
        """Raised when an operation requires a scene to be loaded, but it isn't."""
        def __init__(self):
            super().__init__("No scene is currently loaded. Please load a scene first.")
    ```

**3. 返り値/出力の詳細:**

* `get_current_scene_info`: `SceneInfoData` インスタンスまたは `None` (エラー時は例外の可能性も)。
* `get_participant_character_ids`: `List[str]`。

**4. エラーハンドリングの詳細:**

* 上記「実装ロジックの詳細」の `load_scene_from_file` 内の例外処理を参照。
* `get_*` メソッドの挙動（`None` を返すか、例外を発生させるか）を明確にし、docstringに記載する。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全てのメソッドの引数、返り値に付与してください。
* 各クラス、メソッドにはdocstringを適切な形式で記述してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: テスト用の場面設定ファイル準備
* `tests/test_data/scenes/S001.yaml` (正常なデータ)
    ```yaml
    scene_id: "S001"
    location: "放課後の教室"
    time: "夕方"
    situation: "夕日が窓から差し込み、机と椅子が整然と並んでいる。誰もいないように見える。"
    participant_character_ids: ["mei_kinoshita_001", "rinko_kizuki_002"]
    ```
* `tests/test_data/scenes/S002_invalid_yaml.yaml` (不正なYAML形式)
* `tests/test_data/scenes/S003_validation_error.yaml` (Pydanticバリデーションエラーを起こすデータ、例: `scene_id` がない)

### 正常系テスト

1.  **テストケース1: 正常な場面設定ファイルの読み込みと情報取得**
    * **前提条件/入力**: `SceneManager()` をインスタンス化。
    * **操作手順**:
        1.  `manager.load_scene_from_file("tests/test_data/scenes/S001.yaml")`
        2.  `scene_info = manager.get_current_scene_info()`
        3.  `participants = manager.get_participant_character_ids()`
    * **期待される結果**:
        * `scene_info` が `SceneInfoData` のインスタンスであり、ファイルの内容と一致すること。
        * `participants` が `["mei_kinoshita_001", "rinko_kizuki_002"]` となること。
2.  **テストケース2: 場面ロード前に情報を取得しようとした場合**
    * **前提条件/入力**: `SceneManager()` をインスタンス化。場面はまだロードされていない。
    * **操作手順**:
        1. `scene_info = manager.get_current_scene_info()`
        2. `participants = manager.get_participant_character_ids()`
    * **期待される結果**:
        * `scene_info` が `None` であること。
        * `participants` が空のリスト `[]` であること。(または `SceneNotLoadedError` が発生する設計にするか)

### 異常系テスト

1.  **テストケース1: 存在しない場面設定ファイルの読み込み**
    * **前提条件/入力**: `SceneManager()`
    * **操作手順**: `try-except SceneFileNotFoundError` で `manager.load_scene_from_file("tests/test_data/scenes/non_existent_scene.yaml")` を実行。
    * **期待される結果**: `SceneFileNotFoundError` が発生すること。
2.  **テストケース2: 不正な形式のYAMLファイルの読み込み**
    * **前提条件/入力**: `SceneManager()`
    * **操作手順**: `try-except InvalidSceneDataError` で `manager.load_scene_from_file("tests/test_data/scenes/S002_invalid_yaml.yaml")` を実行。
    * **期待される結果**: `InvalidSceneDataError` が発生し、`original_error` が `yaml.YAMLError` であること。
3.  **テストケース3: データがPydanticモデルのバリデーションに失敗**
    * **前提条件/入力**: `SceneManager()`
    * **操作手順**: `try-except InvalidSceneDataError` で `manager.load_scene_from_file("tests/test_data/scenes/S003_validation_error.yaml")` を実行。
    * **期待される結果**: `InvalidSceneDataError` が発生し、`original_error` が `ValidationError` であること。

## 完了の定義 (Definition of Done)

* [ ] `project_anima/core/scene_manager.py` に `SceneManager` クラスが実装されている。
* [ ] `load_scene_from_file`, `get_current_scene_info`, `get_participant_character_ids` メソッドが仕様通りに動作する。
* [ ] 場面設定YAMLファイルの読み込みとPydanticモデル (`SceneInfoData`) への変換が正しく行われる。
* [ ] 読み込んだ場面情報はクラス内部で適切に保持される。
* [ ] ファイルが見つからない場合やデータが不正な場合の適切なエラーハンドリング（カスタム例外を含む）が実装されている。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_scene_manager.py`）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* `update_scene_situation` などの場面更新系メソッドは、このタスクでは雛形のみ（pass文など）で構いません。本格的な実装は後のタスクで行います。
* `get_current_scene_info` の場面未ロード時の挙動（`None` を返すか `SceneNotLoadedError` を発生させるか）は、実装時に最終決定し、docstringに明記してください。`Optional` を推奨したのは、呼び出し側での `if scene_info:` といった判定を容易にするためです。