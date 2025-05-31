 ## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 4.2. LLM API連携による思考生成 (core/llm_adapter.py)`
* **担当モジュール/ファイル**: `project_anima/core/llm_adapter.py` (既存ファイルを修正)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 2.1. システム構成案 (思考実行モジュール (LLM連携))」
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理) - LLM API呼び出し」
    * 「タスク2.3で作成した `llm_adapter.py` の基本実装」
    * 「タスク4.1で修正した `prompts/think_generate.txt` および `context_builder.py`」
* **このタスクのゴール**: `LLMAdapter`の`generate_character_thought`メソッドを本格的に実装し、`ContextBuilder`が生成したコンテクストと`think_generate.txt`プロンプトテンプレートを用いて、実際にLLM API（Gemini）を呼び出し、キャラクターの思考・行動・発言のJSON応答を取得できるようにする。

## 背景と目的 (Background and Purpose)

* タスク2.3では`LLMAdapter`の基本構造とダミーのLLM呼び出しを実装したが、このタスクでは実際のLLM API（Gemini）との連携を確立し、キャラクターの自律的な思考生成機能を実現する。
* これにより、シミュレーションエンジンが、キャラクターの状況に応じた「それらしい」思考、行動、発言を動的に生成できるようになる。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **対象ファイルと主な修正箇所**:
    * **`project_anima/core/llm_adapter.py`**:
        * `generate_character_thought` メソッドの本格実装:
            1.  `ContextBuilder`から受け取ったコンテクスト辞書 (`context_dict`) と、指定されたプロンプトテンプレートファイルパス (`prompt_template_path`) を使用する。
            2.  `_load_prompt_template` メソッドでプロンプトテンプレート文字列を読み込む。
            3.  `_fill_prompt_template` メソッドで、テンプレートにコンテクスト辞書の値を埋め込み、最終的なプロンプト文字列を生成する。
            4.  初期化済みのGeminiクライアント (`self.model`) を使用して、生成したプロンプト文字列をLLM APIに送信する (`self.model.generate_content(final_prompt)`)。
            5.  LLMからの応答テキスト（JSON形式のはず）を取得する。
            6.  取得した応答テキストを `json.loads()` でPython辞書にパースする。
            7.  パースした辞書に、必須キー（`"think"`, `"act"`, `"talk"`）が存在するか検証する。不足している場合は `InvalidLLMResponseError` を発生させる。
            8.  エラーハンドリング:
                * プロンプトテンプレートが見つからない場合 (`PromptTemplateNotFoundError`)。
                * LLM API呼び出し時のエラー（例: `google.api_core.exceptions.GoogleAPIError` など、Gemini API固有のエラー）。これらは `LLMGenerationError` でラップする。
                * LLMの応答が期待したJSON形式でない場合 (`json.JSONDecodeError` や必須キー不足)。これらは `InvalidLLMResponseError` でラップまたは直接発生させる。
* **考慮事項**:
    * **APIキーの取り扱い**: `__init__` で実装済みの通り、環境変数からAPIキーを安全に読み込む。
    * **LLMの生成設定 (`generation_config`)**: `__init__` で定義した `self.generation_config` がLLM呼び出し時に適用されることを確認する（Geminiクライアントの初期化時に設定済みのはず）。
    * **LangGraphの利用**: Issue for Task 2.3の備考で「LangGraphを用いたより複雑なフローは将来のタスクで検討」としたため、このタスクではLangGraphの本格的なグラフ構築までは要求しない。まずはGeminiクライアントを直接呼び出す形で実装し、基本的なAPI連携を確立することを優先する。もしCursorがLangGraphのシンプルな単一ノードでの実装を選択する場合は、それでも構わない。
    * **ロギング**: プロンプトの内容（長すぎる場合は一部またはハッシュ値）、LLMからの応答、発生したエラーなどを適宜ログに出力する。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルの編集:**

* **`project_anima/core/llm_adapter.py`**:
    * `generate_character_thought` メソッドを、上記の「実装する機能の詳細」に従って本格的に実装してください。
    * ダミー応答を返す部分は削除し、実際のGemini API呼び出しに置き換えてください。
    * エラーハンドリングを強化し、Issueで定義したカスタム例外 (`PromptTemplateNotFoundError`, `LLMGenerationError`, `InvalidLLMResponseError`) を適切に発生させてください。

**2. 実装ロジックの詳細 (`generate_character_thought`):**

1.  プロンプトテンプレートを `_load_prompt_template` で読み込みます。
2.  コンテクスト辞書を使って `_fill_prompt_template` でプロンプトを完成させます。
3.  完成したプロンプトを `logger.debug()` で出力します（デバッグ用）。
4.  `try-except` ブロックでGemini API呼び出しと応答処理を行います。
    * `self.model.generate_content(final_prompt)` を呼び出します。
    * 応答 (`response.text`) を取得します。
    * `logger.debug()` でLLMからの生応答を出力します。
    * `json.loads()` で応答テキストをパースします。
    * パース後の辞書に必要なキー（`"think"`, `"act"`, `"talk"`）が含まれているか検証します。
        * 含まれていない場合は、`InvalidLLMResponseError` を発生させます。
    * 検証済みの辞書を返します。
5.  例外処理:
    * `self.model.generate_content()` が発生させる可能性のあるGemini API関連の例外 (例: `google.api_core.exceptions.GoogleAPIError`、`ValueError` (安全設定によるブロックなど)、その他ネットワークエラーなど) をキャッチし、`LLMGenerationError(message, original_error=e)` でラップしてraiseします。
    * `json.JSONDecodeError` をキャッチし、`InvalidLLMResponseError(response_text, error_details=str(e))` でラップしてraiseします。
    * `_load_prompt_template` から `PromptTemplateNotFoundError` が発生した場合は、そのまま再raiseします。
    * その他の予期せぬ例外は、`LLMAdapterError` または `LLMGenerationError` でラップしてraiseします。

**3. コーディング規約・その他指示:**

* Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
* Gemini APIの呼び出しやエラーハンドリングの詳細は、`google-generativeai` ライブラリのドキュメントも参照してください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトと設定
* **`google.generativeai.GenerativeModel` をモック化する (`@patch`などを使用)。**
    * モックされた `generate_content` メソッドは、特定の入力プロンプトに対して、以下のようなパターンの応答を返すように設定する:
        * 正常なJSON文字列 (例: `{"think": "思考内容", "act": "行動内容", "talk": "発言内容"}`)
        * JSONとして不正な文字列
        * 必須キーが欠けたJSON文字列
        * APIエラーを模倣した例外の発生
* テスト用のプロンプトテンプレートファイル (`test_think_generate.txt`) とコンテクスト辞書を準備する (タスク2.3のテスト資産を流用・拡張)。
* 環境変数 `GOOGLE_API_KEY` にダミーのキーを設定しておく (実際のAPIコールはモックするため不要だが、`__init__`でのキー存在チェックのため)。

### 正常系テスト

1.  **テストケース1: 正常な思考生成 (LLM応答が正しいJSON)**
    * **前提条件/入力**: `LLMAdapter` を初期化。モックされた `generate_content` が正常なJSON文字列を返す。
    * **操作手順**: `adapter.generate_character_thought(test_context_dict, "path/to/test_think_generate.txt")` を実行。
    * **期待される結果**:
        * モック `generate_content` が、正しく構築されたプロンプト文字列で呼び出されること。
        * メソッドが、期待されるPython辞書 (例: `{"think": "思考内容", "act": "行動内容", "talk": "発言内容"}`) を返すこと。
        * 関連する情報がログに出力されること。

### 異常系テスト

1.  **テストケース1: プロンプトテンプレートファイルが見つからない**
    * **前提条件/入力**: 存在しないテンプレートファイルパス。
    * **操作手順**: `try-except PromptTemplateNotFoundError` で `adapter.generate_character_thought(test_context_dict, "path/to/non_existent_template.txt")` を実行。
    * **期待される結果**: `PromptTemplateNotFoundError` が発生すること。
2.  **テストケース2: LLM API呼び出しでエラーが発生**
    * **前提条件/入力**: モックされた `generate_content` が `google.api_core.exceptions.InternalServerError` などのAPIエラーを発生させる。
    * **操作手順**: `try-except LLMGenerationError` で `adapter.generate_character_thought(...)` を実行。
    * **期待される結果**: `LLMGenerationError` が発生し、元のAPIエラーが `original_error` として保持されていること。
3.  **テストケース3: LLM応答が不正なJSON形式**
    * **前提条件/入力**: モックされた `generate_content` が `"invalid json"` のような文字列を返す。
    * **操作手順**: `try-except InvalidLLMResponseError` で `adapter.generate_character_thought(...)` を実行。
    * **期待される結果**: `InvalidLLMResponseError` が発生し、エラー詳細にパースエラーの情報が含まれていること。
4.  **テストケース4: LLM応答JSONに必須キーが欠けている**
    * **前提条件/入力**: モックされた `generate_content` が `{"think": "思考のみ"}` のようなJSON文字列を返す。
    * **操作手順**: `try-except InvalidLLMResponseError` で `adapter.generate_character_thought(...)` を実行。
    * **期待される結果**: `InvalidLLMResponseError` が発生し、エラー詳細にどのキーが欠けているかの情報が含まれていること。

## 完了の定義 (Definition of Done)

* [ ] `LLMAdapter.generate_character_thought` メソッドが、`ContextBuilder`が生成したコンテクストとプロンプトテンプレートを用いて、実際にGemini APIを呼び出し、応答を取得する。
* [ ] LLMからのJSON応答を正しくパースし、必須キー（`think`, `act`, `talk`）の検証を行う。
* [ ] プロンプトテンプレートの読み込みエラー、LLM API呼び出しエラー、応答形式エラーに対する適切なエラーハンドリング（カスタム例外を含む）が実装されている。
* [ ] APIキーが環境変数から安全に読み込まれる（既存の`__init__`の実装を維持）。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_llm_adapter.py` を拡張）、全て成功する（LLM API呼び出しはモックを使用）。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクでは、Gemini APIとの基本的な連携を確立することに焦点を当てます。LangGraphを用いたより高度なフロー制御は、この基本連携が確立した後のタスクで検討します。
* Gemini APIの呼び出しには `google-generativeai` ライブラリを使用します。適切なエラーハンドリングについては、ライブラリのドキュメントも参照してください。
* テストでは、実際のAPIキーやコストが発生しないように、LLMクライアントのAPI呼び出し部分を確実にモックしてください。