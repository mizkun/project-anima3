## タスク概要 (Summary)

* **タスクリスト番号**: (バグ修正のため、特定のタスクリスト番号とは直接紐づかないが、フェーズ4「LLM連携と本格的な思考生成」に関連)
* **担当モジュール/ファイル**: `project_anima/core/llm_adapter.py`
* **関連するログ**: ユーザー提供のコンソールログ (2025-05-22 22:38頃の `Invalid control character` エラー)
* **このタスクのゴール**:
    1. LLMからの応答に含まれる不正な制御文字による `json.JSONDecodeError` を解消し、JSONパースの安定性を向上させる。
    2. `_clean_json_response` メソッドが、LLM応答に含まれるMarkdownコードブロックマーカー（例: ```json ... ```）を確実に除去できるように改善する。

## 背景と目的 (Background and Purpose)

* 現状、LLM (Gemini) からの応答に、JSONとして不正な制御文字が含まれている場合があり、`json.loads()` でパースエラーが発生している。
* また、LLMが応答をMarkdownのコードブロック形式で返すことがあるが、`_clean_json_response` メソッドによるマーカー除去が期待通りに機能していない場合がある。
* これらの問題により、LLMからの有効な応答が得られていても、システムがそれを正しく処理できず、キャラクターの思考生成が失敗している。この問題を解決し、LLMとの連携の信頼性を高める必要がある。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **1. 不正な制御文字への対策 (`project_anima/core/llm_adapter.py` の `generate_character_thought` および `update_character_long_term_info` 内の応答処理部分)**:
    * **デバッグログの強化**:
        * `json.loads()` でエラーが発生した場合、パースしようとした文字列の `repr()` をログに出力し、目に見えない不正文字を特定しやすくする。
    * **応答文字列のクリーニング強化 (オプション、慎重に検討)**:
        * `_clean_json_response` メソッド、または新しいヘルパー関数内で、一般的な不正制御文字（ASCII 0x00-0x1F のうち、`\n`, `\r`, `\t` 以外のものなど）を、JSONパース前に除去または適切なエスケープシーケンスに置換する処理を追加することを検討する。
            * **注意**: この処理は、正当なデータを破壊しないよう、非常に慎重に行う必要がある。除去する文字の範囲を限定的にするか、あるいはエスケープ処理に留めるのが安全。
    * **プロンプトでの指示強化 (`prompts/think_generate.txt`, `prompts/long_term_update.txt`)**:
        * LLMに対し、「JSON文字列内の改行やタブ、その他の特殊文字は必ず適切にエスケープシーケンス（例: `\\n`, `\\t`）を使用してください。制御文字をそのまま含めないでください」といった指示を、プロンプトテンプレートに追記・強調する。

* **2. Markdownコードブロックマーカー除去の改善 (`project_anima/core/llm_adapter.py` の `_clean_json_response` メソッド)**:
    * 現在の正規表現 (`re.sub(r'^```json\s*\n', ...)` など) が、ユーザー提供のログで確認された応答パターンに正しくマッチしていない可能性を調査する。
    * Gemini APIの応答形式 (`response.parts[0].text`) の特性を考慮し、マーカーがテキストのどの部分に含まれうるか（例: 文字列全体の最初と最後か、あるいは内部的な改行の後かなど）を再確認する。
    * 正規表現を修正し、より多くのマーカーパターン（例: ````json` の代わりに単に ```` 、スペースの有無、大文字小文字の違いなど）に対応できるようにする。
    * `strip()` の呼び出し位置なども含め、確実にマーカーのみを除去し、JSON本体を壊さないように注意する。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. `project_anima/core/llm_adapter.py` の修正:**

* **`_clean_json_response` メソッドの改善**:
    * 正規表現を見直し、ユーザー提供のログにあった ` ```json ... ``` ` のようなマーカーを確実に除去できるように修正してください。
    * 例えば、`re.match` や `re.search` を使って、より柔軟にマーカー部分を特定し、JSON本体のみを抽出するロジックを検討してください。
    * （オプション、慎重に）一般的な不正制御文字（例: `\x00` から `\x1f` のうち `\n`, `\r`, `\t` 以外）を除去またはエスケープする処理を追加することを検討してください。

* **`generate_character_thought` メソッドおよび `update_character_long_term_info` メソッド内のエラーハンドリングとログ出力**:
    * `json.JSONDecodeError` が発生した際、ログに出力するエラーメッセージに、`_clean_json_response` 適用後の文字列の `repr()` を含めるようにしてください。
        ```python
        # 例 (generate_character_thought内)
        # ...
        except json.JSONDecodeError as e:
            error_msg = f"LLMからの応答をJSONとしてパースできません: {str(e)}"
            # logger.error(f"{error_msg}\n応答テキスト(クリーン後): {cleaned_response}") # 既存
            logger.error(f"{error_msg}\n応答テキスト(クリーン後、repr): {repr(cleaned_response)}") # repr()を追加
            raise InvalidLLMResponseError(cleaned_response, error_msg) from e
        ```

**2. `project_anima/prompts/think_generate.txt` および `project_anima/prompts/long_term_update.txt` の修正:**

* 各プロンプトテンプレートの「指示」セクションに、JSON文字列内の特殊文字のエスケープに関する注意書きを追記・強調してください。
    * 例: 「生成するJSON文字列内の値に改行、タブ、引用符などの特殊文字が含まれる場合は、必ず適切なJSONエスケープシーケンス（`\\n`, `\\t`, `\\"` など）を使用してください。不正な制御文字を直接含めないでください。」

**3. コーディング規約・その他指示:**

* Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
* 正規表現の修正は、意図しない副作用がないか慎重にテストしてください。

---

## テストケース (Test Cases)

**(このタスクの完了を確認するためのテストケースをTDDの観点から記述)**

### 前提: モックオブジェクトとテストデータ準備
* `LLMAdapter` のLLM API呼び出し部分はモック化する (`self.model.generate_content` をモック)。
* モックされた `generate_content` が、以下のパターンの文字列応答を返すように設定する:
    1.  正常なJSON文字列。
    2.  Markdownコードブロックマーカー (```json ... ```) で囲まれた正常なJSON文字列。
    3.  Markdownコードブロックマーカー (単に ``` ... ```) で囲まれた正常なJSON文字列。
    4.  JSON文字列の途中に不正な制御文字（例: `\x08` (バックスペース)など）を含む文字列。
    5.  上記マーカーと不正な制御文字の両方を含む文字列。

### `_clean_json_response` のユニットテスト (新規または拡張)

1.  **テストケース1: マーカーなしの正常なJSON文字列**
    * **入力**: `"{\"key\": \"value\"}"`
    * **期待される結果**: `"{\"key\": \"value\"}"` (変更なし、または前後の空白除去のみ)
2.  **テストケース2: ` ```json ... ``` ` マーカー付きJSON文字列**
    * **入力**: `"```json\\n{\"key\": \"value\"}\\n```"`
    * **期待される結果**: `"{\"key\": \"value\"}"`
3.  **テストケース3: ` ``` ... ``` ` マーカー付きJSON文字列**
    * **入力**: `"```\\n{\"key\": \"value\"}\\n```"`
    * **期待される結果**: `"{\"key\": \"value\"}"`
4.  **テストケース4: 不正な制御文字を含む文字列 (クリーニング対象とする場合)**
    * **入力**: `"{\"key\": \"value\\x08\"}"`
    * **期待される結果**: （もしクリーニング処理を実装した場合）不正文字が除去またはエスケープされた文字列。そうでなければ入力のまま。

### `generate_character_thought` / `update_character_long_term_info` の結合テスト (LLM呼び出しはモック)

1.  **テストケース1: LLM応答がマーカー付き正常JSONの場合**
    * **前提条件/入力**: モックLLMが ` ```json\n{"think": "思考", "act": "", "talk": "発言"}\n``` ` のような文字列を返す。
    * **操作手順**: `adapter.generate_character_thought(...)` を実行。
    * **期待される結果**: メソッドが `{"think": "思考", "act": "", "talk": "発言"}` という辞書を正しく返すこと。`InvalidLLMResponseError` が発生しないこと。
2.  **テストケース2: LLM応答に不正な制御文字が含まれる場合**
    * **前提条件/入力**: モックLLMが `{"think": "思考\x08内容", "act": "", "talk": ""}` のような不正制御文字を含むJSON文字列を返す (マーカーなし)。
    * **操作手順**: `try-except InvalidLLMResponseError` で `adapter.generate_character_thought(...)` を実行。
    * **期待される結果**:
        * もし制御文字クリーニングを実装し、成功すれば、パースされた辞書が返る。
        * クリーニングを実装しないか、しても除去できない場合は、`InvalidLLMResponseError` が発生し、ログに `repr()` で問題箇所が示唆されるメッセージが出力されること。

## 完了の定義 (Definition of Done)

* [ ] `_clean_json_response` メソッドが、一般的なMarkdownコードブロックマーカー（```json ... ``` および ``` ... ```）を応答テキストから除去できるように改善されている。
* [ ] (推奨) `_clean_json_response` メソッドまたは新しいヘルパー関数で、JSON文字列内の一般的な不正制御文字を処理（除去またはエスケープ）する試みがなされ、その効果と安全性が確認されている。あるいは、プロンプトでの指示強化で対応する方針が明確になっている。
* [ ] `generate_character_thought` および `update_character_long_term_info` メソッドで、JSONパースエラー発生時に、問題のある文字列の `repr()` を含む詳細なデバッグログが出力される。
* [ ] `prompts/think_generate.txt` および `prompts/long_term_update.txt` に、JSON文字列内の特殊文字のエスケープに関するLLMへの指示が追記・強調されている。
* [ ] 上記テストケースを満たすユニットテストが作成・更新され、全て成功する。
* [ ] コードに明らかなバグや非効率な箇所がない。

## 備考 (Notes)

* 不正な制御文字の完全な除去・エスケープは非常に難しい問題であり、完璧を目指すと複雑になりすぎる可能性があります。まずは一般的なケースに対応し、デバッグログを充実させて問題発生時の原因特定を容易にすることを優先してください。
* LLMへのプロンプトによる指示強化も、合わせて行う重要な対策です。
* この修正により、LLMからの応答をより安定して処理できるようになることを期待していますわ！