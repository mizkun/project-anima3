## タスク概要 (Summary)

* **タスクリスト番号**: (例: `[ ] 5.2b. 長期記憶更新トリガーの統合とコマンド実装` - 既存タスク5.2の修正・完了、または新規タスクとして)
* **担当モジュール/ファイル**:
    * `project_anima/core/simulation_engine.py` (既存ファイルを修正)
    * `project_anima/interactive_cli.py` (または `main.py` のインタラクティブ部分、既存ファイルを修正)
    * (必要に応じて) `project_anima/core/data_models.py` (新しい介入タイプ用のモデル追加)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理) - 長期情報更新トリガー」
    * 「詳細仕様書 3.2.3. ユーザーによる介入」
    * 「タスク5.2で実装した `InformationUpdater.trigger_long_term_update` および `CharacterManager.save_character_long_term_data`」
    * 「タスク5.3で実装した `SimulationEngine.update_character_long_term_info` および `process_user_intervention`」
* **このタスクのゴール**:
    1. `SimulationEngine` の `start_simulation` メソッドの最後に、場面に参加した全キャラクターの長期情報を更新する処理を組み込む。
    2. インタラクティブCLIに、特定のキャラクターの長期情報更新を指示するための新しいユーザーコマンド（例: `update_ltm <character_id>`）を追加し、`SimulationEngine.process_user_intervention` で対応する処理を実行できるようにする。

## 背景と目的 (Background and Purpose)

* 現在、キャラクターの長期情報を更新する機能（`SimulationEngine.update_character_long_term_info`）は実装されているが、それがシミュレーションの適切なタイミング（場面終了時やユーザー指示時）で確実に呼び出される仕組みが不足している。
* このタスクでは、これらのトリガーを明確に実装し、キャラクターの成長がシミュレーションに反映され、永続化されることを保証する。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **1. `project_anima/core/simulation_engine.py` の修正**:
    * **`start_simulation` メソッドの修正**:
        * シミュレーションループが終了し、`_save_scene_log()` を呼び出す「前」に、現在の場面の参加キャラクター全員に対して長期情報更新処理を呼び出すループを追加する。
        * 各キャラクター `char_id` について、`self.update_character_long_term_info(char_id)` を呼び出す。
        * この際、`update_character_long_term_info` が `None` やエラーを示す値を返した場合のログ出力を検討する（ただし、シミュレーションのメイン処理は終わっているので、致命的エラーでなければログ出力のみで良いかもしれない）。
    * **`process_user_intervention` メソッドの修正**:
        * 新しい介入タイプ（例: `"TRIGGER_LONG_TERM_UPDATE"`）を処理する分岐を追加する。
        * この介入タイプが指定された場合、`intervention_data.target_character_id` を取得し、`self.update_character_long_term_info(target_character_id)` を呼び出す。
        * 処理の成否（`update_character_long_term_info` の返り値）をログに出力する。

* **2. `project_anima/interactive_cli.py` (または `main.py`) の修正**:
    * **新しいユーザーコマンドの追加 (例: `update_ltm`)**:
        * ユーザーが `update_ltm <character_id>` のように入力できるようにする。
        * `<character_id>` を引数としてパースする。
        * パースした情報から、`intervention_type="TRIGGER_LONG_TERM_UPDATE"` と `target_character_id` を持つ `InterventionData` オブジェクトを生成する（`intervention` の詳細は空または汎用的なもので良い）。
            * (オプション) `InterventionDetailData` に、このための新しい詳細モデル（例: `TriggerLTMUpdateDetails(BaseModel)`) を定義しても良いが、`target_character_id`だけで十分なら不要。
        * 生成した `InterventionData` を `SimulationEngine.process_user_intervention` に渡す。
    * コマンドのヘルプ情報なども更新する。

* **3. `project_anima/core/data_models.py` の修正 (検討)**:
    * もし `"TRIGGER_LONG_TERM_UPDATE"` のために専用の `InterventionDetailData` サブクラスが必要であれば定義する。`GenericInterventionDetails` で代用可能であれば不要。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. `project_anima/core/simulation_engine.py` の修正:**

* **`start_simulation` メソッドの最後、`self._save_scene_log()` の直前に以下のような処理を追加してください:**
    ```python
    # ... (メインループ終了後)
    logger.info("場面終了に伴い、参加キャラクターの長期情報を更新します...")
    if self._current_scene_log and self._current_scene_log.scene_info:
        # この時点での最終的な参加者リストを使用する
        final_participants = list(self._current_scene_log.scene_info.participant_character_ids)
        for char_id_to_update in final_participants:
            logger.info(f"キャラクター '{char_id_to_update}' の長期情報更新を試みます...")
            try:
                update_result = self.update_character_long_term_info(char_id_to_update)
                if update_result and update_result.get("status") == "success":
                    logger.info(f"キャラクター '{char_id_to_update}' の長期情報更新に成功しました。")
                elif update_result:
                    logger.warning(f"キャラクター '{char_id_to_update}' の長期情報更新結果: {update_result.get('message', '詳細不明')}")
                else: # Noneが返ってきた場合など
                    logger.warning(f"キャラクター '{char_id_to_update}' の長期情報更新は行われませんでした、または結果が不明です。")
            except Exception as e:
                logger.error(f"キャラクター '{char_id_to_update}' の長期情報更新中に予期せぬエラーが発生しました: {str(e)}", exc_info=True)
    else:
        logger.warning("場面ログが存在しないため、長期情報更新はスキップされました。")
    
    self._save_scene_log() # その後にログ保存
    ```

* **`process_user_intervention` メソッドに、新しい介入タイプ `"TRIGGER_LONG_TERM_UPDATE"` の処理分岐を追加してください:**
    ```python
    # ... (既存の介入タイプの処理の後)
    elif intervention_type == "TRIGGER_LONG_TERM_UPDATE":
        if intervention_data.target_character_id:
            logger.info(f"ユーザー指示により、キャラクター '{intervention_data.target_character_id}' の長期情報更新を試みます...")
            try:
                update_result = self.update_character_long_term_info(intervention_data.target_character_id)
                if update_result and update_result.get("status") == "success":
                    logger.info(f"キャラクター '{intervention_data.target_character_id}' の長期情報更新コマンド成功。")
                    # CLIに応答を返す場合は、ここで result を組み立てる
                    return True # 介入処理成功を示す
                elif update_result:
                    logger.warning(f"キャラクター '{intervention_data.target_character_id}' の長期情報更新コマンド結果: {update_result.get('message', '詳細不明')}")
                    return False # 介入処理失敗を示す
                else:
                    logger.warning(f"キャラクター '{intervention_data.target_character_id}' の長期情報更新コマンドは実行されませんでした、または結果が不明です。")
                    return False
            except Exception as e:
                logger.error(f"ユーザー指示によるキャラクター '{intervention_data.target_character_id}' の長期情報更新中にエラー: {e}", exc_info=True)
                return False
        else:
            logger.error("TRIGGER_LONG_TERM_UPDATE 介入には対象キャラクターIDが必要です。")
            return False
    # ... (else: 未定義の介入タイプの処理) ...
    ```
    **注意**: `process_user_intervention` の返り値を `bool` に変更し、CLI側で処理の成否を判断できるようにすることを推奨します。

**2. `project_anima/interactive_cli.py` (または `main.py`) の修正:**

* ユーザーコマンドの入力ループに、`update_ltm <character_id>` (または `ultm <character_id>`) のような新しいコマンドを追加してください。
* このコマンドが入力されたら、`<character_id>` をパースし、`InterventionData` オブジェクトを以下のように生成してください:
    ```python
    # from project_anima.core.data_models import InterventionData, GenericInterventionDetails (必要なら)
    # from project_anima.core.simulation_engine import SimulationEngine (型ヒント用)
    # engine: SimulationEngine = ...

    # (コマンドパース後)
    # target_char_id = ... (パースしたID)
    # current_turn_for_intervention_log = len(engine._current_scene_log.turns) + 1 # 次のターンの前に適用するイメージ

    # intervention_detail = GenericInterventionDetails(description=f"User triggered long-term update for {target_char_id}")
    # intervention = InterventionData(
    #     applied_before_turn_number=current_turn_for_intervention_log,
    #     intervention_type="TRIGGER_LONG_TERM_UPDATE",
    #     intervention=intervention_detail, # GenericInterventionDetails または適切な詳細モデル
    #     target_character_id=target_char_id
    # )
    # success = engine.process_user_intervention(intervention)
    # if success:
    #     print(f"キャラクター {target_char_id} の長期情報更新をトリガーしました。")
    # else:
    #     print(f"キャラクター {target_char_id} の長期情報更新に失敗しました。詳細はログを確認してください。")
    ```
* ユーザーに処理結果（成功/失敗）をフィードバックするようにしてください。

**3. `project_anima/core/data_models.py` の修正 (オプション):**

* `InterventionData` の `intervention_type` として `"TRIGGER_LONG_TERM_UPDATE"` を許容できるように、関連するコメントやEnum定義（もしあれば）を更新してください。
* この介入タイプ専用の `InterventionDetailData` サブクラス（例: `TriggerLTMUpdateDetails(BaseModel)`) を定義しても良いですが、現状では `GenericInterventionDetails` に簡単な説明 (`description`) を入れるだけでも機能します。

**4. コーディング規約・その他指示:**

* Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
* 各処理で適切なログ出力（特にエラー発生時）を行ってください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### `SimulationEngine` のテスト (拡張)

1.  **テストケース1: 場面終了時の全キャラクター長期情報更新**
    * **前提条件/入力**: `SimulationEngine` が場面を実行し、複数の参加キャラクターが存在する。`SimulationEngine.update_character_long_term_info` がモックされ、呼び出しを記録できるようにする。
    * **操作手順**: `engine.start_simulation()` を実行し、シミュレーションループを正常に完了させる。
    * **期待される結果**: `_save_scene_log()` が呼び出される直前に、場面に参加していた各キャラクターIDに対して `engine.update_character_long_term_info()` が1回ずつ呼び出されること。
2.  **テストケース2: ユーザーコマンドによる特定キャラクターの長期情報更新**
    * **前提条件/入力**: `SimulationEngine` が場面を実行中。`InterventionData` (type=`"TRIGGER_LONG_TERM_UPDATE"`, target_character_id=`"char_001"`) を準備。`SimulationEngine.update_character_long_term_info` がモックされ、呼び出しを記録できるようにする。
    * **操作手順**: `engine.process_user_intervention(intervention_data)` を実行。
    * **期待される結果**: `engine.update_character_long_term_info("char_001")` が呼び出されること。メソッドが `True` を返すこと。
3.  **テストケース3: ユーザーコマンドで存在しないキャラクターIDを指定した場合の長期情報更新**
    * **前提条件/入力**: `InterventionData` (type=`"TRIGGER_LONG_TERM_UPDATE"`, target_character_id=`"unknown_char"`)。
    * **操作手順**: `engine.process_user_intervention(intervention_data)` を実行。
    * **期待される結果**: `engine.update_character_long_term_info` がエラー（例: `ValueError`）を発生させ、`process_user_intervention` が `False` を返すこと。エラーログが出力されること。

### `interactive_cli.py` (または `main.py`) のテスト (主に手動E2Eテスト)

1.  **テストケース1: `update_ltm <character_id>` コマンドの正常実行**
    * **操作手順**: インタラクティブモードでシミュレーションを開始し、有効なキャラクターIDを指定して `update_ltm` コマンドを実行。
    * **期待される結果**: 対応するキャラクターの長期情報更新処理がトリガーされた旨のメッセージが表示され、ログに記録が残ること。
2.  **テストケース2: `update_ltm` コマンドで不正なキャラクターIDを指定**
    * **操作手順**: 無効なキャラクターIDを指定して `update_ltm` コマンドを実行。
    * **期待される結果**: エラーメッセージが表示され、長期情報更新処理が実行されないこと。

## 完了の定義 (Definition of Done)

* [x] `SimulationEngine.start_simulation` メソッドの最後に、参加キャラクター全員の長期情報更新処理が呼び出されるように修正されている。
* [x] `interactive_cli.py` (または `main.py`) に、特定のキャラクターの長期情報更新を指示するユーザーコマンド (例: `update_ltm <character_id>`) が追加されている。
* [x] `SimulationEngine.process_user_intervention` が、上記のユーザーコマンドに対応する新しい介入タイプ (`"TRIGGER_LONG_TERM_UPDATE"`) を処理し、`update_character_long_term_info` を呼び出すように修正されている。
* [x] 長期情報更新処理の成否が適切にログ出力され、ユーザーにもフィードバックされる。
* [x] 関連するエラーハンドリングが適切に実装されている。
* [x] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [x] 上記テストケースを満たすテストが実施され（ユニットテストと手動E2Eテスト）、主要な動作が確認されている。
* [x] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクの完了により、キャラクターの成長がシミュレーションの適切なタイミングで確実に記録・永続化されるようになりますわ！物語がより深みを増すことでしょう！
* `InformationUpdater.trigger_long_term_update` メソッドと `SimulationEngine.update_character_long_term_info` メソッドの役割分担や引数の受け渡しについて、このIssueの指示と既存の実装との間で齟齬がないか、よく確認してくださいまし。