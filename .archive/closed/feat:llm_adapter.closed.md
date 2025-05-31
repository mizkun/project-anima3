## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 2.3. LLMアダプター基本実装 (core/llm_adapter.py)`
* **担当モジュール/ファイル**: `project_anima/core/llm_adapter.py` (新規作成)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 2.1. システム構成案 (思考実行モジュール (LLM連携))」
    * 「詳細仕様書 2.2. 主要技術スタック (LLM連携フレームワーク: LangGraph, LLM API: GeminiまたはOpenAI)」
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理) - LLM API呼び出し」
    * 「詳細仕様書 5.1. `core/` ディレクトリ内の各Pythonファイルの役割と主要な関数・クラス（想定）」
* **このタスクのゴール**: `LLMAdapter`クラス（またはLangGraphのGraph構築関数群）の基本構造を実装する。LLM APIクライアントの初期化、プロンプトテンプレートの読み込み、およびLangGraphを用いた基本的なLLM呼び出しフロー（思考生成用）の雛形を構築する。

## 背景と目的 (Background and Purpose)

* 本プロジェクトの中核機能であるキャラクターの自律的思考は、LLM APIの呼び出しによって実現される。`LLMAdapter`は、このLLM APIとの通信を抽象化し、他のモジュール（主に`SimulationEngine`）が容易にLLMの機能を利用できるようにするためのインターフェースを提供する。
* LangGraphフレームワークを利用することで、LLM呼び出しのロジック（例: 複数のLLMコールを組み合わせる、エラーリトライ、状態管理など）を柔軟かつ堅牢に構築することを目指す。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **入力**:
    * `LLMAdapter` のコンストラクタ: (オプション) LLM APIキー、使用するモデル名など。これらは環境変数からの読み込みを推奨。
    * `generate_character_thought` メソッド:
        * `context_dict: Dict[str, str]`: `ContextBuilder`が生成した、各種コンテクスト文字列を格納した辞書。
        * `prompt_template_path: str`: 使用するプロンプトテンプレートファイルのパス (例: `"project_anima/prompts/think_generate.txt"`)。
* **処理内容**:
    1.  `LLMAdapter` クラスは、コンストラクタでLLM APIクライアント（例: Geminiクライアント、OpenAIクライアント）を初期化する。APIキーは環境変数から取得することを推奨。
    2.  プロンプトテンプレートファイルを読み込むヘルパー関数（またはメソッド）を実装する。
    3.  `generate_character_thought` メソッド:
        * 指定された `prompt_template_path` からプロンプトテンプレート文字列を読み込む。
        * 読み込んだテンプレート文字列に、引数で受け取った `context_dict` の値を埋め込む（例: Pythonのf-stringや文字列の`.format()`メソッド、あるいはJinja2のようなテンプレートエンジンを使用）。
        * 最終的に生成されたプロンプト文字列をLLM APIに送信し、応答（キャラクターの思考・行動・発言を含むJSON形式の文字列）を取得する。
        * **このタスクでは、LangGraphの基本的なグラフ構造の雛形（例えば、単一のLLM呼び出しノードを持つグラフ）を定義し、その中でLLM APIを呼び出すことを目指す。** 複雑なグラフ構造は後のタスクで構築する。
        * LLMからの応答文字列をJSONとしてパースし、Pythonの辞書（またはPydanticモデル）に変換して返す。
    4.  エラーハンドリング: LLM API呼び出し時のエラー（認証エラー、API制限、タイムアウト、不正な応答形式など）を適切に処理する。
* **出力/返り値**:
    * `generate_character_thought`: LLMからの応答をパースしたPython辞書 (例: `{"think": "...", "act": "...", "talk": "..."}`)。
* **エラーハンドリング**:
    * LLM API関連のエラー (例: `google.api_core.exceptions.GoogleAPIError`, `openai.APIError`)
    * JSONパースエラー (`json.JSONDecodeError`)
    * プロンプトテンプレートファイルが見つからない場合 (`FileNotFoundError`)
    * これらのエラーは、カスタム例外でラップして呼び出し元に伝播させることを推奨。
* **考慮事項**:
    * 使用するLLM（GeminiまたはOpenAI）を切り替えられるような設計を意識する（必須ではないが、将来的な拡張性のため）。
    * APIキーの安全な管理（環境変数を使用し、コードに直接埋め込まない）。
    * LangGraphの基本的な使い方を習得する。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルとクラス/関数の定義:**

* 作成するファイル: `project_anima/core/llm_adapter.py`
* 作成するクラス: `LLMAdapter`
* クラスの主要メソッド:
    * `__init__(self, model_name: str = "gemini-1.5-flash-latest", api_key: Optional[str] = None)` (またはGeminiとOpenAIのクライアントを内部で選択・初期化する設計)
    * `generate_character_thought(self, context_dict: Dict[str, str], prompt_template_path: str) -> Dict[str, str]`
    * `_load_prompt_template(self, template_path: str) -> str` (プライベートヘルパーメソッド)
    * `_fill_prompt_template(self, template_str: str, context_dict: Dict[str, str]) -> str` (プライベートヘルパーメソッド)
* 必要なインポート:
    ```python
    import os
    import json
    from typing import Dict, Optional, Any
    # LLMライブラリ (いずれか、または両方。設定に応じて切り替えられるようにするのも良い)
    # import google.generativeai as genai (Geminiの場合)
    # from openai import OpenAI (OpenAIの場合)
    # LangGraph関連 (基本的なものを想定)
    # from langgraph.graph import StateGraph, END
    # from langgraph.checkpoint.sqlite import SqliteSaver # (もし状態管理や永続化を試すなら)
    ```
    **注意**: 本格的なLangGraphのグラフ定義は後のタスクとし、このタスクではLLM APIを呼び出す基本的な機能に集中してもよい。LangGraphを使う場合は、シンプルな単一ノードのグラフから始める。

**2. 実装ロジックの詳細:**

* **`__init__`**:
    1.  APIキーを環境変数 (例: `GOOGLE_API_KEY`, `OPENAI_API_KEY`) から読み込む。引数で渡された場合はそちらを優先する。
    2.  指定された `model_name` に基づいて、適切なLLM APIクライアントを初期化し、インスタンス変数に保持する。 (例: `self._llm_client`)
    3.  (LangGraphを使用する場合) 基本的なLangGraphのグラフをここで定義または初期化する準備をする。

* **`_load_prompt_template(self, template_path: str) -> str`**:
    1.  指定された `template_path` のテキストファイルを読み込み、その内容を文字列として返す。
    2.  `FileNotFoundError` を適切に処理する (例: カスタム例外 `PromptTemplateNotFoundError` をraise)。

* **`_fill_prompt_template(self, template_str: str, context_dict: Dict[str, str]) -> str`**:
    1.  `template_str` 内のプレースホルダー (例: `{{key}}`) を `context_dict` の対応する値で置換する。Pythonのf-stringや `.format()` はプレースホルダーの形式によっては使いにくい場合があるため、単純な文字列置換 (`str.replace`) を繰り返すか、より高度なテンプレートエンジン (例: Jinja2 – ただし、このタスクでは必須ではない) の利用も検討できる。ここでは単純な置換で可。
        ```python
        # 単純な置換の例
        filled_prompt = template_str
        for key, value in context_dict.items():
            filled_prompt = filled_prompt.replace(f"{{{{{key}}}}}", str(value)) # str(value)で安全に
        return filled_prompt
        ```

* **`generate_character_thought(self, context_dict: Dict[str, str], prompt_template_path: str) -> Dict[str, str]`**:
    1.  `_load_prompt_template(prompt_template_path)` でテンプレートを読み込む。
    2.  `_fill_prompt_template()` でコンテクストを埋め込み、最終的なプロンプト文字列を生成する。
    3.  LLM APIクライアントを使って、生成したプロンプトを送信する。
        * **(単純なAPI呼び出しの場合)**:
            ```python
            # Geminiの例 (クライアント初期化は__init__で行う)
            # response = self._llm_client.generate_content(final_prompt_str)
            # response_text = response.text
            ```
        * **(LangGraphを使用する場合の雛形)**:
            * 思考生成のためのシンプルなグラフ（入力: プロンプト文字列、出力: LLM応答文字列）を定義する。
            * グラフを実行し、結果を取得する。
            * (例) グラフのステートにプロンプト文字列を格納し、LLM呼び出しノードでそれを使ってAPIを叩き、結果をステートに格納して返す。
    4.  LLMからの応答テキスト（JSON形式のはず）を取得する。
    5.  `json.loads(response_text)` でPython辞書にパースする。
    6.  APIエラー、JSONパースエラーなどを適切に処理し、カスタム例外 (例: `LLMGenerationError`, `InvalidLLMResponseError`) をraiseする。
    7.  パースした辞書を返す。

* **カスタム例外の定義** (同ファイル内または別の `exceptions.py` ファイルに定義):
    ```python
    class LLMAdapterError(Exception):
        """Base exception for LLMAdapter."""
        pass

    class PromptTemplateNotFoundError(LLMAdapterError):
        """Raised when a prompt template file is not found."""
        # ... (scene_manager.pyの例外定義を参考に)

    class LLMGenerationError(LLMAdapterError):
        """Raised when the LLM API call fails."""
        # ...

    class InvalidLLMResponseError(LLMAdapterError):
        """Raised when the LLM response is not in the expected format (e.g., invalid JSON)."""
        # ...
    ```

**3. 返り値/出力の詳細:**

* `generate_character_thought`: LLMからの応答 (思考、行動、発言を含む) をパースしたPython辞書。

**4. エラーハンドリングの詳細:**

* 上記「実装ロジックの詳細」および「カスタム例外の定義」を参照。
* LLM APIの具体的なエラーコードやメッセージをログに出力することも検討する。

**5. コーディング規約・その他指示:**

* Pythonの型ヒントを必ず全てのメソッドの引数、返り値に付与してください。
* 各クラス、メソッドにはdocstringを適切な形式で記述してください。
* APIキーは絶対にコードに直接記述せず、環境変数から読み込むようにしてください。README等に環境変数の設定方法を記載することを推奨します。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトと設定
* LLM APIクライアントをモックする (実際のAPI呼び出しを避けるため)。モッククライアントは、特定のプロンプト入力に対して、期待されるJSON形式の文字列応答を返すように設定する。
* テスト用のプロンプトテンプレートファイル (`test_think_generate.txt`) を準備する。
* テスト用のコンテクスト辞書を準備する。

### 正常系テスト

1.  **テストケース1: 正常な思考生成プロセス**
    * **前提条件/入力**: `LLMAdapter` を初期化。テスト用プロンプトテンプレートとコンテクスト辞書を用意。モックLLMクライアントが正常なJSON文字列応答を返すように設定。
    * **操作手順**: `adapter.generate_character_thought(test_context_dict, "path/to/test_think_generate.txt")` を実行。
    * **期待される結果**:
        * モックLLMクライアントが、正しく構築されたプロンプト文字列で呼び出されること。
        * メソッドが、モックLLMクライアントの応答をパースしたPython辞書 (例: `{"think": "...", "act": "...", "talk": "..."}`) を返すこと。
2.  **テストケース2: プロンプトテンプレートの読み込み成功**
    * **前提条件/入力**: 存在するテスト用プロンプトテンプレートファイル。
    * **操作手順**: `adapter._load_prompt_template("path/to/existing_template.txt")` を実行。
    * **期待される結果**: ファイルの内容が文字列として正しく返されること。

### 異常系テスト

1.  **テストケース1: プロンプトテンプレートファイルが見つからない**
    * **前提条件/入力**: 存在しないテンプレートファイルパス。
    * **操作手順**: `try-except PromptTemplateNotFoundError` で `adapter.generate_character_thought(test_context_dict, "path/to/non_existent_template.txt")` を実行。
    * **期待される結果**: `PromptTemplateNotFoundError` が発生すること。
2.  **テストケース2: LLM API呼び出し失敗**
    * **前提条件/入力**: モックLLMクライアントがAPIエラーを発生させるように設定。
    * **操作手順**: `try-except LLMGenerationError` で `adapter.generate_character_thought(...)` を実行。
    * **期待される結果**: `LLMGenerationError` が発生すること。
3.  **テストケース3: LLM応答が不正なJSON形式**
    * **前提条件/入力**: モックLLMクライアントがJSONとして不正な文字列応答を返すように設定。
    * **操作手順**: `try-except InvalidLLMResponseError` で `adapter.generate_character_thought(...)` を実行。
    * **期待される結果**: `InvalidLLMResponseError` が発生すること。

## 完了の定義 (Definition of Done)

* [ ] `project_anima/core/llm_adapter.py` に `LLMAdapter` クラスが実装され、基本的な思考生成 (`generate_character_thought`) 機能が動作する。
* [ ] プロンプトテンプレートの読み込みとコンテクストの埋め込みが正しく行われる。
* [ ] LLM APIクライアントが初期化され、(LangGraphの雛形または直接呼び出しで) LLM APIにリクエストを送信できる。
* [ ] LLMからのJSON応答をパースして辞書として返すことができる。
* [ ] LLM API関連のエラー、ファイルI/Oエラー、JSONパースエラーに対する適切なエラーハンドリング（カスタム例外を含む）が実装されている。
* [ ] APIキーが環境変数から安全に読み込まれる。
* [ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
* [ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: `project_anima/tests/test_llm_adapter.py`）、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* このタスクは「基本実装」です。LangGraphを用いたより複雑なフロー（リトライ、フォールバック、複数LLM呼び出しの連結など）や、複数のLLMプロバイダ（Gemini, OpenAIなど）を動的に切り替える高度な仕組みは、将来のタスクで検討します。まずは、一つのLLMプロバイダ（例: Gemini）で、基本的な思考生成リクエストが通ることを目標にしてください。
* LLMクライアントの具体的な初期化方法やAPI呼び出し方法は、使用するLLMプロバイダのSDKドキュメントを参照してください。
* テストでは、実際のAPI呼び出しを避けるために、LLMクライアントのモックを徹底してください。
* このタスクでは、LLMプロバイダとしてGoogleのGemini (gemini-1.5-flash-latestモデルを想定) を使用して実装を進めてください。