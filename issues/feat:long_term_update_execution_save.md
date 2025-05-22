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
    * タスク2.2で作成した雛形（チャットログで「最終改訂案」として提示したもの）をベースに、LLMへの指示をさらに具体的にする。
    * **入力として期待する情報**:
        * 対象キャラクターの名前 (`{{character_name}}`)
        * 対象キャラクターの現在の全長期情報 (`{{existing_long_term_context_str}}` - `ContextBuilder`が整形)
        * 現在の場面で起きた特筆すべき出来事、キャラクターの重要な気づきや感情の変化などをまとめたもの (`{{recent_significant_events_or_thoughts_str}}` - `ContextBuilder`が整形)
    * **LLMへの指示**:
        * 上記情報を踏まえ、キャラクターの「経験」「目標」「記憶」の各項目について、どのような追加、変更、削除が適切か提案させる。
        * 例えば、「新しい経験としてこれを追加すべきか？」「既存の目標の重要度は変わったか？新しい目標が生まれたか？」「この出来事は記憶として残すべきか？」といった観点で考えさせる。
        * 提案は、詳細仕様書「3.2.2. コンテクスト管理」の長期情報のYAML構造に準拠したJSON形式で、更新が必要な箇所のみ（または更新後の全データ）を返すように明確に指示する。Issue for Task 2.2 のJSON形式例を参考にする。
    * **出力形式の明確化**: 返すべきJSONの具体的なキー（例: `new_experiences`, `updated_goals`, `new_memories`）と、それぞれの値の構造（例: `event`, `importance` を持つオブジェクトのリスト）をプロンプト内で明示する。

* **2. `project_anima/core/context_builder.py` の修正・追記**:
    * **既存メソッドの確認・調整**: タスク4.1で実装した `build_context_for_long_term_update` メソッドと `_extract_significant_events` メソッドが、上記のプロンプトテンプレートの要求する情報を適切に生成できているか確認し、必要であれば調整する。
        * `existing_long_term_context_str`: `_format_long_term_context` を利用して整形。
        * `recent_significant_events_or_thoughts_str`: `_extract_significant_events` で場面ログから重要な情報を抽出・整形。この抽出ロジックは、LLMが長期情報更新の判断を下すのに十分な情報量と質になっているか再検討する（初期実装はシンプルで良いが、より多くの情報を渡すことも検討）。

* **3. `project_anima/core/llm_adapter.py` の `update_character_long_term_info` メソッドの本格実装**:
    * タスク2.3で作成した雛形を本格的な実装に置き換える。
    * **入力**: `character_id: str`, `context_for_lt_update: Dict[str, str]` (上記`ContextBuilder`が生成した辞書), `prompt_template_path: str` (例: `"project_anima/prompts/long_term_update.txt"`)
    * **処理**:
        1. `_load_prompt_template` で長期情報更新用プロンプトテンプレートを読み込む。
        2. `_fill_prompt_template` で、受け取った `context_for_lt_update` をテンプレートに埋め込み、最終的なプロンプト文字列を生成する。
        3. Gemini APIクライアント (`self.model`) を使って、生成したプロンプトをLLMに送信する。
        4. LLMからの応答テキスト（長期情報の更新案を含むJSON形式のはず）を取得する。
        5. `_clean_json_response` メソッドで応答テキストをクリーニングする。
        6. クリーニングされた応答テキストを `json.loads()` でPython辞書にパースする。
        7. `_validate_long_term_update_response` メソッドで、パースした辞書が期待されるキー（例: `new_experiences`, `updated_goals`, `new_memories`）と構造を持っているか厳密に検証する。不足や不正があれば `InvalidLLMResponseError` を発生させる。
    * **出力**: パース・検証済みの長期情報更新案の辞書。
    * **エラーハンドリング**: `generate_character_thought` と同様に、`PromptTemplateNotFoundError`, `LLMGenerationError`, `InvalidLLMResponseError` などを適切に処理する。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. `project_anima/prompts/long_term_update.txt` の修正:**

* タスク2.2で作成したドラフト（チャットログで「最終改訂案」として提示したもの）をベースに、上記「実装する機能の詳細 - 1」で検討した内容に基づき、プロンプトテンプレートを具体的に記述・修正してください。
* LLMがどのような情報を元に、どのような形式で長期情報の更新案を返すべきか、JSONのキー名や構造例をプロンプトに含め、より明確に指示してください。

**2. `project_anima/core/context_builder.py` の修正・追記:**

* `build_context_for_long_term_update` メソッドと `_extract_significant_events` メソッドが、修正された `long_term_update.txt` プロンプトテンプレートの要求する情報を適切に生成できているか確認し、必要であればロジックを調整・強化してください。
    * 特に `_extract_significant_events` は、LLMが判断材料とするのに十分な情報（例: ユーザー介入の内容、対象キャラクター自身の思考や感情の変化が読み取れるターン、他キャラクターからの重要な働きかけなど）を抽出できるように、抽出ロジックを具体化してください。
    * 例えば、ターンのログから「決意した」「悲しい」「学んだ」「驚いた」などの感情キーワードや、特定の行動パターン（例：誰かを助けた、目標に関連する行動をした）を検出し、それらを要約に含めることを検討してください。

**3. `project_anima/core/llm_adapter.py` の修正:**

* `update_character_long_term_info(self, character_id: str, context_for_lt_update: Dict[str, str], prompt_template_path: str) -> Dict[str, Any]` メソッドのダミー実装を削除し、本格的な実装に置き換えてください。
* 実装内容は、`generate_character_thought` メソッドのロジック（テンプレート読み込み、埋め込み、LLM呼び出し、応答クリーニング、JSONパース、エラーハンドリング）を参考に、長期情報更新用に調整してください。
* `_validate_long_term_update_response` メソッドを呼び出し、LLMからの応答JSONが、`long_term_update.txt` で指示したキーと構造を持っているか厳密に検証する処理を必ず含めてください。

**4. コーディング規約・その他指示:**

* Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
* 各コンポーネントの役割分担を意識し、`ContextBuilder` はコンテクスト整形に、`LLMAdapter` はLLMとの通信と応答の基本パース・検証に専念するようにしてください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトとテストデータ準備
* `CharacterManager` と `SceneManager` のモック。
* `LLMAdapter` のLLM API呼び出し部分 (`self.model.generate_content`) をモック化する。
    * モックは、特定の入力プロンプトに対して、期待される長期情報更新案のJSON文字列（正常系、キー不足、型不正など複数パターン）を返すように設定する。
* テスト用のキャラクターデータ、場面ログデータ (`SceneLogData` のインスタンス) を準備する。
* テスト用の `long_term_update.txt` プロンプトテンプレートファイルを準備する。

### `ContextBuilder.build_context_for_long_term_update` のテスト (拡張)

1.  **テストケース1: 重要な出来事が含まれる場面ログからのコンテクスト整形**
    * **前提条件/入力**: 特定のキーワード（例: 「決意」）を含む思考や、ユーザー介入が含まれる場面ログ。
    * **操作手順**: `context_builder.build_context_for_long_term_update("test_char_id", test_scene_log_with_event)` を実行。
    * **期待される結果**: 返される辞書の `"recent_significant_events_or_thoughts_str"` に、その重要な出来事や思考が適切に要約・整形されて含まれていること。

### `LLMAdapter.update_character_long_term_info` のテスト (拡張・詳細化)

1.  **テストケース1: 正常な長期情報更新案の取得 (詳細な構造検証)**
    * **前提条件/入力**: モックLLMが、期待されるキー（`new_experiences`, `updated_goals`, `new_memories`）と、各キーの値が正しい構造（例: `new_experiences` が `event` と `importance` を持つ辞書のリストであるなど）を持つJSON文字列を返す。
    * **操作手順**: `adapter.update_character_long_term_info(...)` を実行。
    * **期待される結果**: メソッドが、期待されるPython辞書を返すこと。`_validate_long_term_update_response` がエラーを発生させないこと。
2.  **テストケース2: LLM応答JSONのキーが不足している場合 (例: `new_experiences` のみ)**
    * **前提条件/入力**: モックLLMが `{"new_experiences": [...]}` のような、一部の主要キーのみを含むJSON文字列を返す。
    * **操作手順**: `adapter.update_character_long_term_info(...)` を実行。
    * **期待される結果**: `_validate_long_term_update_response` がエラーを発生させず、受け取ったキーと値のみを含む辞書が返されること（プロンプトで「変更があった箇所のみ」と指示している場合）。あるいは、プロンプトで全キーを期待しているなら `InvalidLLMResponseError` が発生すること（プロンプトの指示とバリデーションロジックを整合させる）。
3.  **テストケース3: LLM応答JSONのリスト内のオブジェクトのキーが不足している場合 (例: `new_experiences` の要素に `importance` がない)**
    * **前提条件/入力**: モックLLMが `{"new_experiences": [{"event": "出来事"}]}` のようなJSON文字列を返す。
    * **操作手順**: `try-except InvalidLLMResponseError` で `adapter.update_character_long_term_info(...)` を実行。
    * **期待される結果**: `InvalidLLMResponseError` が発生し、どの要素のどのキーが不足しているかの情報が含まれること。
4.  **テストケース4: LLM応答JSONの値の型が不正な場合 (例: `importance` が文字列)**
    * **前提条件/入力**: モックLLMが `{"new_experiences": [{"event": "出来事", "importance": "高い"}]}` のようなJSON文字列を返す。
    * **操作手順**: `try-except InvalidLLMResponseError` で `adapter.update_character_long_term_info(...)` を実行。
    * **期待される結果**: `InvalidLLMResponseError` が発生し、どの値の型が不正かの情報が含まれること。

## 完了の定義 (Definition of Done)

* [ ] `project_anima/prompts/long_term_update.txt` が修正され、LLMへの指示と期待されるJSON出力形式がより詳細かつ効果的になっている。
* [ ] `ContextBuilder.build_context_for_long_term_update` メソッドが、`long_term_update.txt` の要求するコンテクスト（特に「最近の重要な出来事や思考」の抽出・整形）を適切に生成する。
* [ ] `LLMAdapter.update_character_long_term_info` メソッドが本格的に実装され、指定されたコンテクストとプロンプトテンプレートを用いてGemini APIを呼び出し、長期情報の更新案（JSON）を取得・パース・検証する。
* [ ] LLM応答の検証 (`_validate_long_term_update_response`) が厳密に行われる。
* [ ] 関連するエラーハンドリングが適切に実装されている。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `tests/test_context_builder.py` と `tests/test_llm_adapter.py` を拡張）、全て成功する（LLM API呼び出しはモックを使用）。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクの完了により、LLMにキャラクターの長期情報更新を「提案」させることができるようになります。実際にその提案をキャラクターデータに反映するのは次のタスク5.2です。
* `ContextBuilder`での「重要な出来事の抽出」ロジックは、この段階では完璧でなくても構いません。まずは基本的な情報をLLMに渡せるようにし、シミュレーションを動かしながら改善していくのが良いでしょう。
* `_validate_long_term_update_response` の実装は、LLMの応答が不安定な場合に非常に役立ちます。