## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 3.1. 情報更新モジュール基本実装 (core/information_updater.py)`
* **担当モジュール/ファイル**: `project_anima/core/information_updater.py` (新規作成)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 2.1. システム構成案 (情報更新モジュール)」
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理) - 応答解釈と短期情報更新, 長期情報更新トリガー」
    * 「詳細仕様書 3.2.2. コンテクスト管理 (短期情報 (ログファイル構造), 長期情報)」
    * 「詳細仕様書 5.1. `core/` ディレクトリ内の各Pythonファイルの役割と主要な関数・クラス（想定）」
* **このタスクのゴール**: `InformationUpdater`クラスの基本構造を実装し、1ターンの結果（思考・行動・発言）およびユーザーによる介入情報を、メモリ上の場面ログデータ（`SceneLogData`のインスタンスを想定）に追加・記録する機能を実装する。長期情報の更新トリガーメソッドの雛形も作成する。

## 背景と目的 (Background and Purpose)

* シミュレーション中に発生するキャラクターの行動やユーザーの介入は、物語の進行を記録し、後の場面のコンテクストとして利用されたり、最終的なログとして出力されたりするための重要な情報源となる。
* `InformationUpdater`は、これらの情報を一元的に管理・更新する責務を負い、シミュレーションエンジンが状態を正確に追跡できるようにする。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**:
    * `InformationUpdater` のコンストラクタ: `CharacterManager` のインスタンス (長期情報更新時に利用)。
    * `record_turn_to_short_term_log` メソッド:
        * `scene_log_data: SceneLogData`: 更新対象の場面ログデータ。
        * `character_id: str`, `character_name: str`, `think: str`, `act: Optional[str]`, `talk: Optional[str]`: 1ターンの結果。
    * `record_intervention_to_log` メソッド:
        * `scene_log_data: SceneLogData`: 更新対象の場面ログデータ。
        * `intervention_data: InterventionData`: 記録するユーザー介入情報。
    * `trigger_long_term_update` メソッド (雛形):
        * `character_id: str`
        * `llm_adapter: 'LLMAdapter'`
        * `current_scene_log: SceneLogData`
* **処理内容**:
    1.  `InformationUpdater` クラスは、コンストラクタで `CharacterManager` のインスタンスを保持する。
    2.  `record_turn_to_short_term_log` メソッド:
        * 現在の場面ログ (`scene_log_data`) のターンリスト (`turns`) の次のターン番号を決定する。
        * 受け取ったキャラクターの行動結果から `TurnData` インスタンスを生成する。
        * 生成した `TurnData` インスタンスを `scene_log_data.turns` リストに追加する。
    3.  `record_intervention_to_log` メソッド:
        * 受け取った `intervention_data` (既に `InterventionData` モデルのはず) を、`scene_log_data.interventions_in_scene` リストに追加する。
        * `applied_before_turn_number` は、この介入が次のどのターンの前に適用されるかを示すため、呼び出し側で適切に設定されていることを前提とする。
    4.  `trigger_long_term_update` メソッド:
        * **このタスクでは雛形のみを実装する (pass文など)。** 本格的な実装はタスク5.2で行う。
* **出力/返り値**:
    * `record_turn_to_short_term_log`: なし (引数で受け取った `scene_log_data` を直接変更する)。
    * `record_intervention_to_log`: なし (引数で受け取った `scene_log_data` を直接変更する)。
    * `trigger_long_term_update`: (雛形のため) なし。
* **エラーハンドリング**:
    * 基本的には、渡されるデータ (`SceneLogData`, `TurnData`, `InterventionData`) は既にPydanticモデルによってバリデーション済みであることを期待する。
    * もし `scene_log_data` が予期せず `None` だった場合など、基本的な引数チェックは行うことを検討。
* **考慮事項**:
    * `SceneLogData` オブジェクトは、`SimulationEngine` が場面ごとに生成・管理し、この `InformationUpdater` のメソッドに渡されることを想定する。`InformationUpdater` 自身は場面ログの永続化（ファイル保存）は行わない。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 作成するファイル: `project_anima/core/information_updater.py`
* 作成するクラス: `InformationUpdater`
* クラスの主要メソッド:
    * `__init__(self, character_manager: 'CharacterManager')`
    * `record_turn_to_short_term_log(self, scene_log_data: 'SceneLogData', character_id: str, character_name: str, think: str, act: Optional[str], talk: Optional[str]) -> None`
    * `record_intervention_to_log(self, scene_log_data: 'SceneLogData', intervention_data: 'InterventionData') -> None`
    * `trigger_long_term_update(self, character_id: str, llm_adapter: 'LLMAdapter', current_scene_log: 'SceneLogData') -> None` (雛形)
* 必要なインポート:
    ```python
    from typing import Optional, TYPE_CHECKING
    # from .character_manager import CharacterManager # 循環参照対策
    # from .data_models import SceneLogData, TurnData, InterventionData # 循環参照対策
    # from .llm_adapter import LLMAdapter # 循環参照対策 (trigger_long_term_update用)
    ```
    **注意**: 循環参照を避けるため、型ヒントは文字列リテラル (`'ClassName'`) や `TYPE_CHECKING` ブロックを使用してください。

**2. 実装ロジックの詳細:**

* **`__init__(self, character_manager: 'CharacterManager')`**:
    1.  `character_manager` のインスタンスを `self._character_manager` に保存する。

* **`record_turn_to_short_term_log`**:
    1.  引数 `scene_log_data` が `None` でないことを確認する（もし `None` ならエラーログを出力して早期リターン、または例外を発生させる）。
    2.  新しいターン番号を決定する (例: `next_turn_number = len(scene_log_data.turns) + 1`)。
    3.  受け取った引数から `TurnData` インスタンスを生成する。
        ```python
        # from .data_models import TurnData (インポートが必要)
        # new_turn = TurnData(
        #     turn_number=next_turn_number,
        #     character_id=character_id,
        #     character_name=character_name,
        #     think=think,
        #     act=act,
        #     talk=talk
        # )
        ```
    4.  `scene_log_data.turns.append(new_turn)` でリストに追加する。

* **`record_intervention_to_log`**:
    1.  引数 `scene_log_data` が `None` でないことを確認する。
    2.  `scene_log_data.interventions_in_scene.append(intervention_data)` でリストに追加する。

* **`trigger_long_term_update`**:
    1.  メソッド内に `pass` と記述し、docstringに「タスク5.2で本格実装予定」と明記する。

**3. 返り値/出力の詳細:**

* 各メソッドは返り値なし (`None`)。引数で渡された `scene_log_data` オブジェクトを直接変更する。

**4. エラーハンドリングの詳細:**

* `record_turn_to_short_term_log` と `record_intervention_to_log` では、`scene_log_data` が `None` の場合に `ValueError` を発生させるか、ログに警告を出力して何もしない、といった対応を検討する。ここでは `ValueError` を推奨。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全てのメソッドの引数、返り値に付与してください。
* 各クラス、メソッドにはdocstringを適切な形式で記述してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトとデータ準備
* `CharacterManager` のモックインスタンスを作成。
* `SceneLogData`, `TurnData`, `InterventionData` のインスタンスをテスト用に生成できるようにしておく (必要ならダミーの `SceneInfoData` なども)。

### 正常系テスト

1.  **テストケース1: ターンの記録が正しく行われる**
    * **前提条件/入力**: 空の `turns` リストを持つ `SceneLogData` インスタンス (`log_data`)。`InformationUpdater(mock_char_manager)` をインスタンス化。
    * **操作手順**:
        1.  `updater.record_turn_to_short_term_log(log_data, "char_001", "アリス", "何を話そうか考えている", None, "こんにちは")`
        2.  `updater.record_turn_to_short_term_log(log_data, "char_002", "ボブ", "アリスの挨拶にどう返そうか", "少し微笑む", "やあ")`
    * **期待される結果**:
        * `log_data.turns` リストの長さが2になること。
        * 最初の要素がターン番号1でアリスの行動、次の要素がターン番号2でボブの行動になっていること。
        * 各 `TurnData` の内容が正しく設定されていること。
2.  **テストケース2: ユーザー介入の記録が正しく行われる**
    * **前提条件/入力**: 空の `interventions_in_scene` リストを持つ `SceneLogData` インスタンス (`log_data`)。ダミーの `InterventionData` インスタンス (`intervention1`)。
    * **操作手順**: `updater.record_intervention_to_log(log_data, intervention1)`
    * **期待される結果**: `log_data.interventions_in_scene` リストに `intervention1` が追加されていること。

### 異常系テスト

1.  **テストケース1: `record_turn_to_short_term_log` に `scene_log_data` として `None` が渡された場合**
    * **前提条件/入力**: `InformationUpdater(mock_char_manager)`
    * **操作手順**: `try-except ValueError` で `updater.record_turn_to_short_term_log(None, ...)` を実行。
    * **期待される結果**: `ValueError` が発生すること。
2.  **テストケース2: `record_intervention_to_log` に `scene_log_data` として `None` が渡された場合**
    * **前提条件/入力**: `InformationUpdater(mock_char_manager)`
    * **操作手順**: `try-except ValueError` で `updater.record_intervention_to_log(None, ...)` を実行。
    * **期待される結果**: `ValueError` が発生すること。

## 完了の定義 (Definition of Done)

* [ ] `project_anima/core/information_updater.py` に `InformationUpdater` クラスが実装されている。
* [ ] `record_turn_to_short_term_log` メソッドが、渡されたターンの情報を `SceneLogData` の `turns` リストに正しく追加する。
* [ ] `record_intervention_to_log` メソッドが、渡された介入情報を `SceneLogData` の `interventions_in_scene` リストに正しく追加する。
* [ ] `trigger_long_term_update` メソッドの雛形が作成されている。
* [ ] 引数として `None` が渡された場合の基本的なエラーハンドリングが実装されている。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_information_updater.py`）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクでは、`InformationUpdater` は渡された `SceneLogData` オブジェクトを直接変更（ミューテート）します。これは、`SimulationEngine` が場面ごとのログ状態を一元的に管理し、必要に応じてこのアップデーターに渡すという設計を想定しているためです。
* `trigger_long_term_update` の本格的な実装はタスク5.2で行います。