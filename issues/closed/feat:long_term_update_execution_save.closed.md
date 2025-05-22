## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 5.2. 長期情報更新の実行と保存 (core/information_updater.py, core/character_manager.py)`
* **担当モジュール/ファイル**:
    * `project_anima/core/information_updater.py` (既存ファイルに追記・修正)
    * `project_anima/core/character_manager.py` (既存ファイルに追記・修正)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理) - 長期情報更新トリガー」
    * 「詳細仕様書 3.2.2. コンテクスト管理 (長期情報)」
    * 「タスク5.1で実装した `LLMAdapter.update_character_long_term_info`」
* **このタスクのゴール**:
    1. `InformationUpdater` の `trigger_long_term_update` メソッドを本格的に実装し、`LLMAdapter` から取得した長期情報更新案に基づいて、対象キャラクターの長期情報データ（Pydanticモデルインスタンス）を実際に更新するロジックを実装する。
    2. `CharacterManager` に、更新された長期情報データモデルをYAMLファイルに永続化する機能 (`save_character_long_term_data`のようなメソッド) を追加実装する。
    3. `InformationUpdater` の `trigger_long_term_update` メソッド内で、更新された長期情報を `CharacterManager` を介してファイルに保存する。

## 背景と目的 (Background and Purpose)

* タスク5.1では、LLMにキャラクターの長期情報更新を「提案」させる機能を実装した。このタスクでは、その提案を実際にキャラクターのデータに反映し、永続化することで、キャラクターの成長をシミュレーション全体を通じて一貫して管理できるようにする。
* これにより、キャラクターは過去の経験や達成した目標、新たな記憶に基づいて、将来の思考や行動を変化させていくことが可能になる。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **1. `project_anima/core/information_updater.py` の `trigger_long_term_update` メソッドの本格実装**:
    * **入力**: `character_id: str`, `llm_adapter: 'LLMAdapter'`, `current_scene_log: 'SceneLogData'`
    * **処理**:
        1.  `ContextBuilder` (このクラスのインスタンスは `self._character_manager` 経由でアクセスするか、あるいは `SimulationEngine` から渡される必要がある。Issue for Task 3.1では `InformationUpdater` は `CharacterManager` のみ保持。ここでは `SimulationEngine` が `ContextBuilder` を渡すか、`InformationUpdater` が `ContextBuilder` も保持する設計変更を検討。今回は、`SimulationEngine` が `ContextBuilder` を使って事前にコンテクストを生成し、その結果をこのメソッドに渡す方がシンプルかもしれない。**Issue for Task 5.1 の `LLMAdapter.update_character_long_term_info` の引数に合わせて、このメソッドの引数も `context_for_lt_update: Dict[str, str]` と `prompt_template_path: str` を受け取るように変更することを推奨。** )
            * **修正案**: メソッドシグネチャを `trigger_long_term_update(self, character_id: str, llm_adapter: 'LLMAdapter', context_for_lt_update: Dict[str, str], prompt_template_path: str) -> bool` のように変更する。
        2.  `llm_adapter.update_character_long_term_info(character_id, context_for_lt_update, prompt_template_path)` を呼び出し、長期情報の更新案（辞書）を取得する。
        3.  取得した更新案に基づき、対象キャラクターの現在の長期情報（`self._character_manager.get_long_term_context(character_id)` で取得した `LongTermCharacterData` インスタンス）を実際に変更する。
            * `new_experiences`: 更新案のリストを現在の `experiences` リストに追加する。
            * `updated_goals`: 更新案のリストに基づいて、既存の目標を更新（例: `importance` の変更）したり、新しい目標を `goals` リストに追加したりする。既存の目標を名前でマッチングするか、あるいはLLMにIDのようなものを振らせるか検討が必要。**初期実装では、既存目標の更新は一旦スコープ外とし、新しい目標の追加のみを実装する方がシンプルかもしれない。**
            * `new_memories`: 更新案のリストを現在の `memories` リストに追加する。
            * **注意**: Pydanticモデルのリストフィールドを更新する際は、リストを直接変更するか、新しいリストで置き換える。
        4.  更新処理が成功したら、`self._character_manager.save_character_long_term_data(character_id, updated_long_term_data_instance)` を呼び出して、変更をファイルに保存する。
    * **出力/返り値**: 更新が成功したかどうかを示すbool値 (例: `True` なら成功)。
    * **エラーハンドリング**: `LLMAdapter`からの例外、`CharacterManager`からの例外（データ取得や保存時）を適切に処理し、ログに出力する。更新に失敗した場合は `False` を返すか、専用の例外を発生させる。

* **2. `project_anima/core/character_manager.py` の修正・追記**:
    * **新規メソッド (例: `save_character_long_term_data`)**:
        * **入力**: `character_id: str`, `long_term_data_instance: LongTermCharacterData`
        * **処理**:
            1.  指定された `character_id` に対応する `long_term.yaml` のファイルパスを特定する (`_get_character_dir_path` を利用)。
            2.  `long_term_data_instance` (Pydanticモデル) を辞書に変換する (`.model_dump(mode='json')` または `.dict()`)。
            3.  タスク1.2で実装した `file_handler.save_yaml` 関数を使って、変換したデータをファイルに上書き保存する。
        * **出力/返り値**: なし (または成功/失敗を示すbool値)。
        * **エラーハンドリング**: ファイル書き込み時のI/Oエラーを適切に処理する。
    * **既存メソッドの調整 (必要であれば)**:
        * `load_character_data` で読み込んだ `LongTermCharacterData` インスタンスは、`InformationUpdater` によって変更される可能性があるため、キャッシュの扱い（コピーを渡すなど）を検討する（このタスクでは、キャッシュされたインスタンスが直接変更されることを許容するシンプルな実装で良い）。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. `project_anima/core/character_manager.py` の修正・追記:**

* 以下のシグネチャで新しいメソッドを追加してください:
    ```python
    # from .data_models import LongTermCharacterData (インポートが必要)
    # from ..utils.file_handler import save_yaml (インポートが必要)
    # import os (インポートが必要)

    def save_character_long_term_data(self, character_id: str, long_term_data: 'LongTermCharacterData') -> None:
        # 実装ロジック:
        # 1. self._get_character_dir_path(character_id) でディレクトリパス取得。
        # 2. long_term_file_path = os.path.join(character_dir_path, "long_term.yaml") を作成。
        # 3. long_term_data.model_dump(mode='json') # Pydantic V2 (または .dict() for V1) で辞書に変換。
        # 4. save_yaml(data_dict, long_term_file_path) でファイルに保存。
        # 5. 適切なエラーハンドリング (例: FileNotFoundError は発生しにくいが、PermissionErrorなど)。
        # 6. 成功/失敗をログに出力。
    ```
* `load_character_data` でキャッシュした `LongTermCharacterData` インスタンスは、`InformationUpdater` によって直接変更される可能性があることを念頭に置いてください（今回はそのままでOK）。

**2. `project_anima/core/information_updater.py` の修正:**

* `trigger_long_term_update` メソッドのシグネチャを以下のように変更し、本格的な実装を行ってください:
    ```python
    # from .llm_adapter import LLMAdapter, LLMGenerationError, InvalidLLMResponseError # インポートが必要
    # from .data_models import ExperienceData, GoalData, MemoryData # インポートが必要

    def trigger_long_term_update(
        self,
        character_id: str,
        llm_adapter: 'LLMAdapter',
        context_for_lt_update: Dict[str, str], # ContextBuilderが生成した辞書
        prompt_template_path: str              # 例: "project_anima/prompts/long_term_update.txt"
    ) -> bool:                                 # 成功/失敗を返す
    ```
* **実装ロジックの詳細 (`trigger_long_term_update`):**
    1.  `logger.info(f"キャラクター {character_id} の長期情報更新処理を開始します...")`
    2.  `try-except` ブロックで `llm_adapter.update_character_long_term_info(...)` を呼び出し、更新案の辞書 (`update_proposal_dict`) を取得。
        * 例外 (`LLMGenerationError`, `InvalidLLMResponseError` など) が発生した場合は、ログにエラーを出力し、`return False`。
    3.  `current_long_term_data = self._character_manager.get_long_term_context(character_id)` で現在の長期情報を取得。
        * もし取得に失敗した場合（例: `CharacterNotFoundError` や `None` が返るなど）、ログにエラーを出力し、`return False`。
    4.  `update_proposal_dict` の内容に基づいて `current_long_term_data` の各フィールド（`experiences`, `goals`, `memories`）を更新する。
        * `new_experiences`: `update_proposal_dict.get("new_experiences", [])` でリストを取得し、各要素を `ExperienceData` モデルに変換して `current_long_term_data.experiences` に追加する。
        * `updated_goals`: `update_proposal_dict.get("updated_goals", [])` でリストを取得。**初期実装では、これを新しい目標として `GoalData` モデルに変換し、`current_long_term_data.goals` に追加する（既存目標の更新は複雑なので一旦見送り）。**
        * `new_memories`: `update_proposal_dict.get("new_memories", [])` でリストを取得し、各要素を `MemoryData` モデルに変換して `current_long_term_data.memories` に追加する。
        * **注意**: 各リストに追加する際には、Pydanticモデルのインスタンスを生成してから追加すること。LLMの提案が正しいキーと型を持っているかのバリデーションは `LLMAdapter._validate_long_term_update_response` で行われている前提。
    5.  `try-except` ブロックで `self._character_manager.save_character_long_term_data(character_id, current_long_term_data)` を呼び出してファイルに保存。
        * 例外が発生した場合は、ログにエラーを出力し、`return False`。
    6.  全て成功したら `logger.info(f"キャラクター {character_id} の長期情報を正常に更新・保存しました。")` し、`return True`。

**3. コーディング規約・その他指示:**

* Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
* Pydanticモデルのリストへの要素追加は、`append()` メソッドを使用してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトとテストデータ準備
* `CharacterManager` のモック: `get_long_term_context` がテスト用の `LongTermCharacterData` インスタンスを返し、`save_character_long_term_data` が呼び出されたことを確認できるようにする。
* `LLMAdapter` のモック: `update_character_long_term_info` が、テスト用の長期情報更新案の辞書（正常系、一部キー欠損、空の提案など複数パターン）を返すように設定する。
* テスト用の `character_id`, `context_for_lt_update` 辞書, `prompt_template_path` を準備。

### `CharacterManager.save_character_long_term_data` のテスト

1.  **テストケース1: 長期情報の正常なファイル保存**
    * **前提条件/入力**: `CharacterManager` インスタンス。テスト用の `character_id` と `LongTermCharacterData` インスタンス。
    * **操作手順**: `character_manager.save_character_long_term_data(test_char_id, test_lt_data)` を実行。
    * **期待される結果**:
        * 対応する `long_term.yaml` ファイルが期待通りに上書き保存されること (内容は `test_lt_data` をYAML化したもの)。
        * `utils.file_handler.save_yaml` が正しい引数で呼び出されること (モックを使用する場合)。

### `InformationUpdater.trigger_long_term_update` のテスト

1.  **テストケース1: 正常な長期情報更新と保存**
    * **前提条件/入力**: `InformationUpdater` インスタンス (モック `CharacterManager` を使用)。モック `LLMAdapter` が正常な更新案辞書を返す。`CharacterManager.get_long_term_context` が初期状態の `LongTermCharacterData` を返す。
    * **操作手順**: `updater.trigger_long_term_update(test_char_id, mock_llm_adapter, test_context, test_prompt_path)` を実行。
    * **期待される結果**:
        * メソッドが `True` を返すこと。
        * `LLMAdapter.update_character_long_term_info` が正しい引数で呼び出されること。
        * `CharacterManager.get_long_term_context` が呼び出されること。
        * `CharacterManager.save_character_long_term_data` が呼び出され、その際の `LongTermCharacterData` 引数が、LLMの提案に基づいて正しく更新（経験・目標・記憶が追加）されていること。
        * 適切な成功ログが出力されること。
2.  **テストケース2: LLMが更新案を返さなかった場合 (空の辞書など)**
    * **前提条件/入力**: モック `LLMAdapter` が空の更新案辞書 (例: `{"new_experiences": [], ...}`) を返す。
    * **操作手順**: `updater.trigger_long_term_update(...)` を実行。
    * **期待される結果**:
        * メソッドが `True` を返すこと (エラーではないため)。
        * `CharacterManager.save_character_long_term_data` が呼び出されるが、渡される `LongTermCharacterData` は実質的に変更されていない（または空のリストが追加されただけ）こと。
3.  **テストケース3: `LLMAdapter.update_character_long_term_info` が例外を発生させる場合**
    * **前提条件/入力**: モック `LLMAdapter` が `LLMGenerationError` を発生させる。
    * **操作手順**: `updater.trigger_long_term_update(...)` を実行。
    * **期待される結果**: メソッドが `False` を返し、エラーログが出力されること。`CharacterManager.save_character_long_term_data` は呼び出されないこと。
4.  **テストケース4: `CharacterManager.get_long_term_context` がキャラクターを見つけられない場合**
    * **前提条件/入力**: モック `CharacterManager.get_long_term_context` が `CharacterNotFoundError` を発生させる (または `None` を返す)。
    * **操作手順**: `updater.trigger_long_term_update(...)` を実行。
    * **期待される結果**: メソッドが `False` を返し、エラーログが出力されること。
5.  **テストケース5: `CharacterManager.save_character_long_term_data` がファイル保存に失敗する場合**
    * **前提条件/入力**: モック `CharacterManager.save_character_long_term_data` が例外を発生させる。
    * **操作手順**: `updater.trigger_long_term_update(...)` を実行。
    * **期待される結果**: メソッドが `False` を返し、エラーログが出力されること。

## 完了の定義 (Definition of Done)

* [ ] `CharacterManager` に `save_character_long_term_data` メソッドが実装され、指定された `LongTermCharacterData` をYAMLファイルに正しく保存する。
* [ ] `InformationUpdater.trigger_long_term_update` メソッドが本格的に実装され、`LLMAdapter` から取得した更新案に基づいてキャラクターの長期情報 (Pydanticモデルインスタンス) を更新し、`CharacterManager` を介してファイルに保存する。
* [ ] 長期情報の更新ロジック（経験・目標・記憶のリストへの追加）が正しく実装されている。
* [ ] 関連するエラーハンドリング（LLMからのエラー、ファイルI/Oエラーなど）が適切に実装され、更新処理の成否が明確に示される。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `tests/test_information_updater.py` と `tests/test_character_manager.py` を拡張）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクの完了により、キャラクターがシミュレーションを通じて得た経験や記憶が、実際にデータとして蓄積され、永続化されるようになります！これはキャラクターの「成長」を実現する上で非常に重要なマイルストーンですわ！
* 「既存目標の更新」は初期実装ではスコープ外とし、新しい目標の「追加」のみを実装する方針としましたが、もし余力があれば、LLMの提案に既存目標のIDや名前を含めさせ、それをキーに更新するロジックも検討してみてくださいまし。
* `InformationUpdater.trigger_long_term_update` の引数で `context_for_lt_update` と `prompt_template_path` を受け取るように変更しましたが、これは `SimulationEngine` がこれらの情報を準備して渡すことを想定しています。