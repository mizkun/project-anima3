## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 5.3. ユーザー介入機能の実装 (core/simulation_engine.py, core/scene_manager.py)`
* **担当モジュール/ファイル**:
    * `project_anima/core/simulation_engine.py` (既存ファイルに追記・修正)
    * `project_anima/core/scene_manager.py` (既存ファイルに追記・修正)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 3.2.3. ユーザーによる介入」
    * 「詳細仕様書 3.1. 機能一覧 (機能No.6 場面状況へのユーザー介入, 機能No.7 キャラクターへの天啓付与)」
    * 「タスク1.4で作成した `scene_manager.py` の雛形メソッド」
    * 「タスク3.2で作成した `simulation_engine.py` の `process_user_intervention` 雛形メソッド」
* **このタスクのゴール**:
    1. `SceneManager` に、場面の状況説明を更新する、キャラクターを場面に追加/削除するメソッドを本格的に実装する。
    2. `SimulationEngine` の `process_user_intervention` メソッドを本格的に実装し、ユーザーからの介入指示（場面状況の変更、キャラクターへの天啓付与など）を解釈し、対応する処理を `SceneManager` や `InformationUpdater` を介して実行できるようにする。
    3. 介入内容はログに記録されるようにする（これは `InformationUpdater.record_intervention_to_log` で既に基本実装済み）。

## 背景と目的 (Background and Purpose)

* シミュレーションはキャラクターの自律的な行動だけでなく、ユーザーが物語の展開に影響を与える「介入」によって、よりダイナミックで予測不可能なものになる。
* このタスクでは、ユーザーが物語の「神」や「脚本家」のような役割を果たせるように、具体的な介入手段を提供し、それをシミュレーションに反映させる仕組みを構築する。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **1. `project_anima/core/scene_manager.py` のメソッド本格実装**:
    * **`update_scene_situation(self, new_situation_description: str) -> None`**:
        * `self._current_scene` (Pydanticモデル `SceneInfoData`) が存在することを確認する (存在しない場合は `SceneNotLoadedError` を発生)。
        * `self._current_scene.situation` を `new_situation_description` で更新する。
        * ログに状況が更新された旨を出力する。
    * **`add_character_to_scene(self, character_id: str) -> None`**:
        * `self._current_scene` が存在することを確認する。
        * `character_id` が既に `self._current_scene.participant_character_ids` に含まれていないか確認する。含まれていなければ追加する。
        * ログにキャラクターが追加された旨を出力する。
    * **`remove_character_from_scene(self, character_id: str) -> None`**:
        * `self._current_scene` が存在することを確認する。
        * `character_id` が `self._current_scene.participant_character_ids` に含まれているか確認する。含まれていれば削除する。含まれていなければ警告ログを出すか、`ValueError` を発生させる。
        * ログにキャラクターが削除された旨を出力する。

* **2. `project_anima/core/simulation_engine.py` の `process_user_intervention` メソッドの本格実装**:
    * **入力**: `intervention_data: InterventionData` (Pydanticモデル)
    * **処理**:
        1.  `self._current_scene_log` が存在することを確認する (存在しない場合は `SceneNotLoadedError` を発生)。
        2.  まず、`self._information_updater.record_intervention_to_log(self._current_scene_log, intervention_data)` を呼び出して、介入情報をログに記録する（これは既存の呼び出しを維持）。
        3.  `intervention_data.intervention_type` に基づいて、具体的な処理を分岐する:
            * **`"SCENE_SITUATION_UPDATE"`**:
                * `intervention_data.intervention` (これは `SceneUpdateDetails` のインスタンスのはず) から `updated_situation_element` を取得。
                * `self._scene_manager.update_scene_situation(updated_situation_element)` を呼び出す。
            * **`"ADD_CHARACTER_TO_SCENE"`** (仮の介入タイプ名、`InterventionData`の`intervention_type`として定義が必要):
                * `intervention_data.intervention` (例えば `GenericInterventionDetails` で `{"character_id_to_add": "char_xyz"}` のようなデータを持つ想定) から追加するキャラクターIDを取得。
                * `self._scene_manager.add_character_to_scene(character_id_to_add)` を呼び出す。
            * **`"REMOVE_CHARACTER_FROM_SCENE"`** (仮の介入タイプ名):
                * `intervention_data.intervention` から削除するキャラクターIDを取得。
                * `self._scene_manager.remove_character_from_scene(character_id_to_remove)` を呼び出す。
            * **`"REVELATION"`**:
                * `intervention_data.target_character_id` と `intervention_data.intervention.revelation_content` を取得。
                * この「天啓」は、次のターンの対象キャラクターのコンテクストに含める必要がある。`ContextBuilder` が短期情報ログを参照する際に、この介入情報も考慮するようにするか、あるいは `SimulationEngine` が `next_turn` で `ContextBuilder` に渡す情報にこの天啓内容を特別に含めるようにする。
                * **初期実装**: `next_turn` で `ContextBuilder` を呼び出す前に、もし次の行動キャラクターが天啓の対象であれば、その天啓内容を特別な文字列として `current_scene_short_term_log` の最後に一時的に追加するか、`ContextBuilder` のメソッドに直接渡す引数を追加する。`ContextBuilder._format_short_term_context` または専用のフォーマットメソッドで「あなたは次の天啓を受けました: ...」のような形で整形し、LLMへのプロンプトに含める。
            * **`"END_SCENE"`** (仮の介入タイプ名):
                * シミュレーションループ (`start_simulation`内) を終了させるフラグを立てるか、あるいは直接ループを抜ける処理を行う (これは `SimulationEngine` のメインループの設計に依存)。
            * **その他**: 未定義の介入タイプの場合は警告ログを出す。
    * **出力/返り値**: なし。
    * **エラーハンドリング**: 各処理で発生しうる例外（`SceneNotLoadedError`, `ValueError`など）を適切に処理し、ログに出力する。

* **3. `SimulationEngine.start_simulation` メソッドのループ内での介入処理呼び出し (検討)**:
    * 現在の `start_simulation` のループは、主にキャラクターのターンを順番に実行するもの。ユーザー介入をどのタイミングで受け付け、処理するかを明確にする必要がある。
    * **案1 (シンプル)**: 各ターンの実行「前」に、ユーザーからの介入指示があるか確認し、あれば `process_user_intervention` を呼び出すキューのような仕組みを導入する（このタスクでは、キューまでは実装せず、`start_simulation` が外部から `process_user_intervention` を呼び出せるようにするだけで良い）。
    * **案2 (対話的)**: 将来的に対話的なインターフェースを設ける場合、ユーザーが任意のタイミングで介入コマンドを入力できるようにする。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. `project_anima/core/scene_manager.py` の修正:**

* `update_scene_situation(self, new_situation_description: str) -> None` メソッドの `pass` を削除し、本格的な実装を行ってください。
    * `self._current_scene` が `None` なら `SceneNotLoadedError` を発生させます。
    * `self._current_scene.situation = new_situation_description` で更新します。
    * `logger.info(...)` で更新内容をログに出力します。
* `add_character_to_scene(self, character_id: str) -> None` メソッドの `pass` を削除し、本格的な実装を行ってください。
    * `self._current_scene` が `None` なら `SceneNotLoadedError` を発生させます。
    * `participant_character_ids` に `character_id` がなければ追加し、ログを出力します。あれば警告ログを出します。
* `remove_character_from_scene(self, character_id: str) -> None` メソッドの `pass` を削除し、本格的な実装を行ってください。
    * `self._current_scene` が `None` なら `SceneNotLoadedError` を発生させます。
    * `participant_character_ids` から `character_id` を削除し、ログを出力します。存在しなければ `ValueError` を発生させるか、警告ログを出します。

**2. `project_anima/core/simulation_engine.py` の修正:**

* `process_user_intervention(self, intervention_data: 'InterventionData') -> None` メソッドの `pass` を削除し、本格的な実装を行ってください。
    * `intervention_data.intervention_type` に応じて処理を分岐します。
    * `"SCENE_SITUATION_UPDATE"`: `self._scene_manager.update_scene_situation()` を呼び出します。`intervention_data.intervention` から必要な情報を取得してください (Pydanticモデルのフィールドアクセス)。
    * `"REVELATION"`:
        * この介入は、次のターンのコンテクストに影響を与える必要があります。
        * 一つの簡単な実装方法として、`self._current_scene_log` (またはエンジン内に一時的な変数) に、対象キャラクターIDと天啓内容を保持しておき、`next_turn` で `ContextBuilder` を呼び出す際に、その情報を `previous_scene_summary` のような形で渡すか、あるいは `current_scene_short_term_log` に特別な形式で追加することを検討してください。
        * `ContextBuilder._format_short_term_context` (または専用メソッド) で、この天啓情報を「あなたは次の天啓を受けました: ...」のように整形してLLMへのプロンプトに含めるようにします。
    * (その他の介入タイプ `"ADD_CHARACTER_TO_SCENE"`, `"REMOVE_CHARACTER_FROM_SCENE"`, `"END_SCENE"` は、このタスクではログ出力のみのスタブ実装で構いません。本格実装は将来のタスクとします。)
* `start_simulation` メソッドのメインループ内で、各ターンの実行前（または後）に、外部から介入指示があった場合に `process_user_intervention` を呼び出すようなフックポイントを設けることを意識してください（具体的なキューイングメカニズムはこのタスクの範囲外）。

**3. `project_anima/core/data_models.py` の修正 (必要であれば):**

* `InterventionData` の `intervention` フィールドの型 (`Union[...]`) に、新しい介入タイプに対応する詳細モデル (例: `AddCharacterDetails`, `RemoveCharacterDetails`, `EndSceneDetails`) を追加する必要が出てくるかもしれませんが、このタスクでは既存の `GenericInterventionDetails` を使って `character_id` などの情報を格納する形で進めても構いません。

**4. コーディング規約・その他指示:**

* Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
* 各処理で適切なログ出力を行ってください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### `SceneManager` のテスト (拡張)

1.  **テストケース1: 場面状況の正常な更新**
    * **前提条件/入力**: `SceneManager` が場面 (`S001.yaml`) をロード済み。
    * **操作手順**: `scene_manager.update_scene_situation("新しい状況説明です。")` を実行。
    * **期待される結果**: `scene_manager.get_current_scene_info().situation` が "新しい状況説明です。" に更新されていること。
2.  **テストケース2: キャラクターの場面への追加と削除**
    * **前提条件/入力**: `SceneManager` が場面をロード済み。
    * **操作手順**:
        1. `scene_manager.add_character_to_scene("new_char_id")`
        2. `scene_manager.remove_character_from_scene("existing_char_id")`
    * **期待される結果**: `participant_character_ids` が正しく更新されていること。

### `SimulationEngine.process_user_intervention` のテスト

1.  **テストケース1: 場面状況更新の介入処理**
    * **前提条件/入力**: `SimulationEngine` が初期化・場面ロード済み。`InterventionData` (type=`"SCENE_SITUATION_UPDATE"`, intervention=`SceneUpdateDetails(...)`) を準備。`SceneManager` をモック化し、`update_scene_situation` が呼び出されたことを確認できるようにする。
    * **操作手順**: `engine.process_user_intervention(intervention_data)` を実行。
    * **期待される結果**: モックされた `SceneManager.update_scene_situation` が、正しい状況説明で呼び出されること。介入情報がログに記録されること。
2.  **テストケース2: 天啓付与の介入処理 (初期実装)**
    * **前提条件/入力**: `SimulationEngine` が初期化・場面ロード済み。`InterventionData` (type=`"REVELATION"`, target_character_id, intervention=`RevelationDetails(...)`) を準備。
    * **操作手順**:
        1. `engine.process_user_intervention(revelation_intervention)` を実行。
        2. (次のターンで) `engine.next_turn(target_character_id)` を実行。
        3. `ContextBuilder.build_context_for_character` が呼び出される際の引数、または `LLMAdapter.generate_character_thought` に渡されるプロンプトに、天啓の内容が含まれていることを確認 (モックやログで)。
    * **期待される結果**: 天啓情報が次のターンのコンテクストに影響を与えていること。介入情報がログに記録されること。
3.  **テストケース3: 未定義の介入タイプの場合**
    * **前提条件/入力**: `InterventionData` (type=`"UNKNOWN_INTERVENTION"`) を準備。
    * **操作手順**: `engine.process_user_intervention(unknown_intervention)` を実行。
    * **期待される結果**: 警告ログが出力され、大きなエラーは発生しないこと。

## 完了の定義 (Definition of Done)

* [ ] `SceneManager` の `update_scene_situation`, `add_character_to_scene`, `remove_character_from_scene` メソッドが本格的に実装され、場面情報を正しく更新する。
* [ ] `SimulationEngine.process_user_intervention` メソッドが本格的に実装され、`"SCENE_SITUATION_UPDATE"` と `"REVELATION"` の介入タイプを処理し、対応するマネージャーメソッドを呼び出すか、次ターンのコンテクストに影響を与える。
* [ ] その他の主要な介入タイプ（キャラクター追加/削除、場面終了）については、ログ出力のみのスタブ実装がされている。
* [ ] ユーザー介入の情報は、`InformationUpdater` を介して場面ログに記録される。
* [ ] 関連するエラーハンドリングが適切に実装されている。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `tests/test_scene_manager.py` と `tests/test_simulation_engine.py` を拡張）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクの完了により、ユーザーがシミュレーションの進行に積極的に関与できるようになり、「Project Anima」のインタラクティブ性が大幅に向上しますわ！
* 「天啓付与」の具体的なコンテクストへの反映方法は、`ContextBuilder` の修正も伴う可能性があります。`SimulationEngine` と `ContextBuilder` がうまく連携できるように設計してください。
* `SimulationEngine` のメインループでユーザー介入をどのタイミングで受け付けるか（例: 各ターンの合間など）は、このタスクでは具体的な実装までは求めませんが、将来的な拡張を意識した設計にしてください。