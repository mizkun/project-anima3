 ## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 5.1. 長期情報更新プロンプトとLLM連携 (core/context_builder.py, core/llm_adapter.py, prompts/long_term_update.txt)`
* **担当モジュール/ファイル**:
    * `project_anima/core/context_builder.py` (既存ファイルに追記・修正)
    * `project_anima/core/llm_adapter.py` (既存ファイルに追記・修正)
    * `project_anima/prompts/long_term_update.txt` (既存ファイルを修正)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理) - 長期情報更新トリガー」
    * 「詳細仕様書 3.2.2. コンテクスト管理 (長期情報)」
    * 「タスク2.2で作成した `long_term_update.txt` の雛形」
* **このタスクのゴール**:
    1. `prompts/long_term_update.txt` プロンプトテンプレートを詳細化し、LLMがキャラクターの長期情報（経験、目標、記憶）の更新案を効果的に提案できるようにする。
    2. `ContextBuilder` に、長期情報更新プロンプトに必要なコンテクスト（既存の長期情報、現在の場面での重要な出来事や思考の要約など）を整形する機能を追加する。
    3. `LLMAdapter` に、この新しいプロンプトとコンテクストを使ってLLM APIを呼び出し、長期情報の更新案（JSON形式）を取得するメソッド (`update_character_long_term_info`) を本格的に実装する。

## 背景と目的 (Background and Purpose)

* キャラクターがシミュレーションを通じて経験したことや考えたことを、そのキャラクターの「長期情報」として蓄積・更新していくことで、キャラクターは成長し、より深みのある行動をとるようになる。
* このタスクでは、LLMの力を借りて、現在の場面での出来事を踏まえ、キャラクターの長期情報をどのように更新すべきかの「提案」を生成させる仕組みを構築する。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **1. `prompts/long_term_update.txt` の詳細化**:
    * タスク2.2で作成した雛形をベースに、LLMへの指示をより具体的にする。
    * **入力として期待する情報**:
        * 対象キャラクターの名前 (`{{character_name}}`)
        * 対象キャラクターの現在の全長期情報 (`{{existing_long_term_context_str}}` - `ContextBuilder`が整形)
        * 現在の場面で起きた特筆すべき出来事、キャラクターの重要な気づきや感情の変化などをまとめたもの (`{{recent_significant_events_or_thoughts_str}}` - `ContextBuilder`が整形、または`SimulationEngine`が場面ログから抽出・要約して渡す)
    * **LLMへの指示**:
        * 上記情報を踏まえ、キャラクターの「経験」「目標」「記憶」の各項目について、どのような追加、変更、削除が適切か提案させる。
        * 例えば、「新しい経験としてこれを追加すべきか？」「既存の目標の重要度は変わったか？新しい目標が生まれたか？」「この出来事は記憶として残すべきか？」といった観点で考えさせる。
        * 提案は、詳細仕様書「3.2.2. コンテクスト管理」の長期情報のYAML構造に準拠したJSON形式で、更新が必要な箇所のみ（または更新後の全データ）を返すように明確に指示する。Issue for Task 2.2 のJSON形式例を参考にする。
    * **出力形式の明確化**: 返すべきJSONの具体的なキー（例: `new_experiences`, `updated_goals`, `new_memories`）と、それぞれの値の構造（例: `event`, `importance` を持つオブジェクトのリスト）をプロンプト内で明示する。

* **2. `project_anima/core/context_builder.py` の修正・追記**:
    * **新規メソッド (例: `build_context_for_long_term_update`)**:
        * **入力**: `character_id: str`, `current_scene_log: SceneLogData` (またはその要約)
        * **処理**:
            1. `character_id` を用いて `CharacterManager` から現在の長期情報 (`LongTermCharacterData`) を取得し、`_format_long_term_context` (既存のものを流用または専用のものを新規作成) で整形し、`existing_long_term_context_str` を生成する。
            2. `current_scene_log` (場面全体のログ) から、キャラクターの長期情報更新の判断材料となりそうな「重要な出来事」や「キャラクターの大きな感情の変化・気づき」などを抽出・要約し、`recent_significant_events_or_thoughts_str` を生成する。
                * **この抽出・要約ロジックは、このタスクではシンプルで良い**。例えば、「ユーザーによる介入があった箇所」「キャラクターの思考(think)の中で特に感情的なキーワードや決意表明があった箇所」「特定の行動(act)の結果」などをピックアップする程度から始める。本格的なイベント抽出は将来のタスク。
            3. キャラクター名も取得する。
            4. これらの情報をキーとする辞書を返す (例: `{"character_name": ..., "existing_long_term_context_str": ..., "recent_significant_events_or_thoughts_str": ...}`)。

* **3. `project_anima/core/llm_adapter.py` の `update_character_long_term_info` メソッドの本格実装**:
    * タスク2.3で作成した雛形を本格的な実装に置き換える。
    * **入力**: `character_id: str`, `context_for_lt_update: Dict[str, str]` (上記`ContextBuilder`が生成した辞書), `prompt_template_path: str` (例: `"project_anima/prompts/long_term_update.txt"`)
    * **処理**:
        1. `_load_prompt_template` で長期情報更新用プロンプトテンプレートを読み込む。
        2. `_fill_prompt_template` で、受け取った `context_for_lt_update` をテンプレートに埋め込み、最終的なプロンプト文字列を生成する。
        3. Gemini APIクライアント (`self.model`) を使って、生成したプロンプトをLLMに送信する。
        4. LLMからの応答テキスト（長期情報の更新案を含むJSON形式のはず）を取得する。
        5. 応答テキストを `json.loads()` でPython辞書にパースする。
        6. パースした辞書が期待されるキー（例: `new_experiences`, `updated_goals`, `new_memories`）と構造を持っているか検証する。不足や不正があれば `InvalidLLMResponseError` を発生させる。
    * **出力**: パース・検証済みの長期情報更新案の辞書。
    * **エラーハンドリング**: `generate_character_thought` と同様に、`PromptTemplateNotFoundError`, `LLMGenerationError`, `InvalidLLMResponseError` などを適切に処理する。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. `project_anima/prompts/long_term_update.txt` の修正:**

* 上記「実装する機能の詳細 - 1」で検討した内容に基づき、プロンプトテンプレートを具体的に記述してください。
* LLMがどのような情報を元に、どのような形式で長期情報の更新案を返すべきか、明確に指示してください。JSONのキー名や構造例をプロンプトに含めてください。

**2. `project_anima/core/context_builder.py` の修正・追記:**

* 新しいパブリックメソッド `build_context_for_long_term_update(self, character_id: str, current_scene_log: 'SceneLogData') -> Dict[str, str]` を追加してください。
* このメソッド内で、`CharacterManager` から既存の長期情報を取得し、整形します (`_format_long_term_context` を利用または参考にしてください)。
* `current_scene_log` から「最近の重要な出来事や思考」を抽出・要約するロジックを実装してください。
    * **初期実装のヒント**:
        * ユーザー介入 (`interventions_in_scene`) があれば、その内容をテキスト化する。
        * ターンのログ (`turns`) から、キャラクター自身の思考 (`think`) の中で特定のキーワード（例: 「決意した」「悲しい」「学んだ」など、あるいは感情分析APIを将来的に使うならその結果）を含むものをピックアップする。
        * あるいは、単純に直近Nターンの `think`, `act`, `talk` を結合して渡すだけでも初期段階ではOKです。
* キャラクター名も取得し、これらをキーとする辞書 (`{"character_name": ..., "existing_long_term_context_str": ..., "recent_significant_events_or_thoughts_str": ...}`) を返してください。

**3. `project_anima/core/llm_adapter.py` の修正:**

* `update_character_long_term_info(self, character_id: str, context_for_lt_update: Dict[str, str], prompt_template_path: str) -> Dict[str, Any]` メソッドのダミー実装を削除し、本格的な実装に置き換えてください。
    * メソッドのシグネチャは、`context_dict` を `context_for_lt_update` のように、より目的に合った名前に変更することを推奨します。返り値の型も `Dict[str, Any]` としてください（更新案の構造が複雑なため）。
* 実装内容は、`generate_character_thought` メソッドのロジック（テンプレート読み込み、埋め込み、LLM呼び出し、JSONパース、エラーハンドリング）を参考に、長期情報更新用に調整してください。
* LLMからの応答JSONが、`long_term_update.txt` で指示したキーと構造（例: `new_experiences` リスト、各要素は `event` と `importance` を持つ辞書）を持っているか検証する処理を追加してください。

**4. コーディング規約・その他指示:**

* Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
* 各コンポーネントの役割分担を意識し、`ContextBuilder` はコンテクスト整形に、`LLMAdapter` はLLMとの通信と応答の基本パースに専念するようにしてください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトとテストデータ準備
* `CharacterManager` と `SceneManager` のモック。
* `LLMAdapter._load_prompt_template`, `LLMAdapter._fill_prompt_template` は正しく動作すると仮定（または個別にテスト済み）。
* **`LLMAdapter` のLLM API呼び出し部分 (`self.model.generate_content`) をモック化する。**
    * モックは、特定の入力プロンプトに対して、期待される長期情報更新案のJSON文字列を返すように設定する。
* テスト用のキャラクターデータ、場面ログデータ (`SceneLogData` のインスタンス) を準備する。

### `ContextBuilder.build_context_for_long_term_update` のテスト

1.  **テストケース1: 正常なコンテクスト整形**
    * **前提条件/入力**: `CharacterManager` が正常な長期情報を返し、`SceneLogData` にいくつかのターンと介入が含まれる。
    * **操作手順**: `context_builder.build_context_for_long_term_update("test_char_id", test_scene_log)` を実行。
    * **期待される結果**: 返される辞書に `"character_name"`, `"existing_long_term_context_str"`, `"recent_significant_events_or_thoughts_str"` のキーが存在し、それぞれの値が期待通りに整形された文字列であること。特に「重要な出来事」が適切に抽出・要約されていることを確認。

### `LLMAdapter.update_character_long_term_info` のテスト

1.  **テストケース1: 正常な長期情報更新案の取得**
    * **前提条件/入力**: `LLMAdapter` を初期化。`ContextBuilder` が生成した形式の `context_for_lt_update` 辞書と、`long_term_update.txt` のパス。モックLLMが期待される更新案のJSON文字列を返す。
    * **操作手順**: `adapter.update_character_long_term_info(test_char_id, test_context_for_lt_update, "path/to/long_term_update.txt")` を実行。
    * **期待される結果**: メソッドが、期待されるPython辞書（例: `{"new_experiences": [{"event": ..., "importance": ...}], ...}`）を返すこと。
2.  **テストケース2: LLM応答が不正なJSON形式または期待したキー構造でない場合**
    * **前提条件/入力**: モックLLMが不正なJSON文字列、またはキーが不足したJSON文字列を返す。
    * **操作手順**: `try-except InvalidLLMResponseError` で `adapter.update_character_long_term_info(...)` を実行。
    * **期待される結果**: `InvalidLLMResponseError` が発生すること。

## 完了の定義 (Definition of Done)

* [ ] `project_anima/prompts/long_term_update.txt` が修正され、LLMへの指示と期待されるJSON出力形式が詳細化されている。
* [ ] `ContextBuilder` に `build_context_for_long_term_update` メソッドが追加され、長期情報更新プロンプトに必要なコンテクストを整形して辞書として返す。
* [ ] `LLMAdapter.update_character_long_term_info` メソッドが本格的に実装され、指定されたコンテクストとプロンプトテンプレートを用いてGemini APIを呼び出し、長期情報の更新案（JSON）を取得・パースする。
* [ ] LLM応答の検証（期待されるキーの存在など）が行われる。
* [ ] 関連するエラーハンドリングが適切に実装されている。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `tests/test_context_builder.py` と `tests/test_llm_adapter.py` を拡張）、全て成功する（LLM API呼び出しはモックを使用）。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクは、LLMに「提案」をさせる部分です。実際にキャラクターの長期情報をファイルに書き込んで永続化するのは、次のタスク5.2「長期情報更新の実行と保存」で行います。
* `ContextBuilder` での「重要な出来事の抽出・要約」ロジックは、最初はシンプルに実装し、今後の改善タスクでより高度なもの（例: 意味的な重要度判定など）にしていくことができます。
* `long_term_update.txt` のJSON出力形式の指示は、後のタスク5.2でそのJSONを解釈して実際に `LongTermCharacterData` を更新する処理と整合性が取れるように、慎重に設計してください。