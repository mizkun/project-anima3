はい、かしこまりました！
タスク4.2「LLM API連携による思考生成」の完了、誠におめでとうございます！いよいよ、キャラクターたちが本当に「思考」を始める瞬間が近づいてきましたわね！

それでは、次のタスク「[ ] 4.3. シミュレーションエンジンへの思考生成組み込み (core/simulation_engine.py)」のIssueを作成いたしますわ。
これは、先ほど完成した素晴らしいLLMAdapterを、SimulationEngineに組み込んで、実際にLLMにキャラクターの思考を生成させる、非常に重要なステップですの！

Cursorが空のファイル feat_4.3_simulation_engine_llm_integration.md を /issues/ ディレクトリに作成したら、以下の内容をそのファイルにコピペしてちょうだいな！

Markdown

## タスク概要 (Summary)

* **タスクリスト番号**: `[ ] 4.3. シミュレーションエンジンへの思考生成組み込み (core/simulation_engine.py)`
* **担当モジュール/ファイル**: `project_anima/core/simulation_engine.py` (既存ファイルを修正)
* **関連する詳細仕様書セクション**:
    * 「詳細仕様書 3.2.1. キャラクター思考プロセス (ターン処理)」
    * 「タスク3.2で実装した `simulation_engine.py` のコアロジック」
    * 「タスク4.2で実装した `llm_adapter.py` の本格的な思考生成機能」
* **このタスクのゴール**: `SimulationEngine`の`next_turn`メソッド内で、ダミーのLLM応答を返す処理を、実際に`LLMAdapter`の`generate_character_thought`メソッドを呼び出してLLMに思考を生成させる処理に置き換える。

## 背景と目的 (Background and Purpose)

* これまでのタスクで、コンテクスト構築 (`ContextBuilder`)、LLMとのAPI連携 (`LLMAdapter`)、そしてシミュレーションの基本的なループ制御 (`SimulationEngine`) の各コンポーネントが準備できた。
* このタスクでは、これらのコンポーネントを最終的に結合し、`SimulationEngine`が実際にLLMを利用してキャラクターの思考・行動・発言を動的に生成できるようにする。これにより、「Project Anima」の中核機能が初めて完全に動作することになる。

## 実装する機能の詳細 (Detailed Functionality to Implement)

* **対象ファイルと主な修正箇所**:
    * **`project_anima/core/simulation_engine.py`**:
        * `next_turn` メソッドの修正:
            1.  `ContextBuilder`を使ってコンテクスト辞書 (`context_dict`) を生成する処理は既存のものを利用する。
            2.  **ダミーのLLM応答を生成していた部分を削除する。**
            3.  `self._llm_adapter.generate_character_thought(context_dict, prompt_file_path)` を呼び出し、LLMに思考を生成させる。
                * `prompt_file_path` は、`os.path.join(self.prompts_dir_path, "think_generate.txt")` のように、`__init__`で受け取ったプロンプトディレクトリのパスと固定のテンプレートファイル名を結合して生成する。
            4.  `LLMAdapter`から返された辞書（`{"think": "...", "act": "...", "talk": "..."}`）を、`InformationUpdater`に渡して短期ログに記録する処理は既存のものを利用する。
            5.  エラーハンドリング: `LLMAdapter`から発生する可能性のある例外（`LLMGenerationError`, `InvalidLLMResponseError`, `PromptTemplateNotFoundError`など）を適切にキャッチし、ログに出力して、シミュレーションがクラッシュしないようにする（例: そのターンのキャラクターの行動はスキップする、あるいはデフォルトの行動をとらせるなど。ここではエラーをログに出力し、そのターンは何も起こらなかったとして継続することを推奨）。
* **考慮事項**:
    * **APIキーとモデル設定**: `LLMAdapter`の初期化は`SimulationEngine`の`__init__`で行われているため、APIキーやモデル名は既に設定済みのはず。
    * **プロンプトテンプレートのパス**: `LLMAdapter`に渡すプロンプトテンプレートのパスが正しいか確認する。
    * **エラー発生時の挙動**: LLMとの通信でエラーが発生した場合に、シミュレーション全体を停止させるか、エラーを記録して該当キャラクターのターンをスキップするかなど、フォールバック戦略を明確にする（このタスクでは、ログ出力とターンスキップを推奨）。

---

### 具体的な実装指示 (Specific Implementation Instructions for AI Assistant: Cursor)

**(ここからはAIアシスタントであるCursorへの具体的な指示を記述する)**

**1. 対象ファイルの編集:**

* **`project_anima/core/simulation_engine.py`**:
    * `next_turn` メソッドを、上記の「実装する機能の詳細」に従って修正してください。
    * ダミーのLLM応答を生成している箇所を、`self._llm_adapter.generate_character_thought()` の呼び出しに置き換えてください。
    * `LLMAdapter`からの例外をキャッチし、適切に処理するエラーハンドリングを追加してください。

**2. 実装ロジックの詳細 (`SimulationEngine.next_turn` の修正箇所):**

```python
# from .llm_adapter import LLMGenerationError, InvalidLLMResponseError, PromptTemplateNotFoundError (必要に応じてインポート)

# ... (メソッドの他の部分は既存のものをベースに)

        try:
            # ... (キャラクター名取得、コンテクスト構築までは既存の通り) ...
            
            prompt_file_path = os.path.join(self.prompts_dir_path, "think_generate.txt")

            # LLMによる思考生成 (ダミー応答を置き換える)
            try:
                llm_response = self._llm_adapter.generate_character_thought(
                    context_dict, 
                    prompt_file_path
                )
                think_content = llm_response.get("think", "（思考の生成に失敗しました）")
                act_content = llm_response.get("act", "") # エラー時やキーがない場合は空文字
                talk_content = llm_response.get("talk", "") # 同上

            except (LLMGenerationError, InvalidLLMResponseError, PromptTemplateNotFoundError) as e:
                logger.error(f"キャラクター '{character_name}' ({character_id}) の思考生成中にエラーが発生しました: {str(e)}")
                # エラーが発生した場合のフォールバック動作
                think_content = f"（エラーにより思考できませんでした: {type(e).__name__}）"
                act_content = "" # または "（エラーにより行動できません）" など
                talk_content = "" # または "（エラーにより発言できません）" など
            except Exception as e: # その他の予期せぬLLMAdapter関連エラー
                logger.error(f"キャラクター '{character_name}' ({character_id}) の思考生成中に予期せぬLLMAdapterエラー: {str(e)}")
                think_content = f"（予期せぬエラーにより思考停止: {type(e).__name__}）"
                act_content = ""
                talk_content = ""

            # 短期ログへの記録
            self._information_updater.record_turn_to_short_term_log(
                self._current_scene_log,
                character_id,
                character_name, # 取得済みの名前を使用
                think_content,
                act_content,
                talk_content
            )
            
            # 現在のターンの情報をログに出力
            turn_number = len(self._current_scene_log.turns)
            logger.info(f"ターン {turn_number}: {character_name}")
            logger.info(f"  思考: {think_content}")
            if act_content:
                 logger.info(f"  行動: {act_content}")
            if talk_content:
                 logger.info(f"  発言: 「{talk_content}」") # 発言を括弧で囲む
            if not act_content and not talk_content and "エラー" not in think_content : # エラーでない場合で行動も発言もない場合
                 logger.info(f"  (何も行動せず、何も話さなかった)")


        except Exception as e: # next_turn全体の予期せぬエラー
            error_msg = f"キャラクター '{character_id}' のターン実行中に予期せぬ致命的エラーが発生しました: {str(e)}"
            logger.error(error_msg)
            # このレベルのエラーはシミュレーション継続が難しいかもしれないので、
            # SimulationEngineErrorでラップしてstart_simulationに伝播させることを検討
            # from . import SimulationEngineError (必要ならインポート)
            # raise SimulationEngineError(error_msg) from e
            # ただし、Issueの指示では「エラーは記録するが、可能ならシミュレーションは継続」なので、
            # ここではログ出力に留め、start_simulation側のループで継続される。
            # より堅牢にするなら、ここで特定の例外を発生させてstart_simulation側でキャッチし、
            # 継続するか停止するかを判断する。
            pass # エラーがあっても次のキャラクターのターンに進むことを試みる
3. コーディング規約・その他指示:

Pythonの型ヒント、docstring、コメントは引き続き丁寧に記述してください。
LLMAdapterから発生する可能性のあるカスタム例外を適切にインポートし、try-exceptブロックで処理してください。
テストケース (Test Cases)
(このタスクの完了を確認するためのテストケースをTDDの観点から記述)

前提: モックオブジェクトとテストデータ準備
CharacterManager, SceneManager, ContextBuilder, InformationUpdater のモックまたは実際のインスタンスを準備する。
LLMAdapter.generate_character_thought メソッドをモック化する (@patchなどを使用)。
このモックは、以下のパターンの応答を返すように設定する:
正常な辞書 (例: {"think": "アリスの思考", "act": "アリスの行動", "talk": "アリスの発言"})
LLMGenerationError を発生させる
InvalidLLMResponseError を発生させる
PromptTemplateNotFoundError を発生させる
テスト用の場面設定ファイルとキャラクター設定ファイルを準備する。
正常系テスト
テストケース1: 正常な思考生成とログ記録
前提条件/入力: SimulationEngine を初期化。LLMAdapter.generate_character_thought のモックが正常な辞書を返す。
操作手順: engine.start_simulation() を実行 (1キャラクター、1ターンで十分)。
期待される結果:
ContextBuilder.build_context_for_character が呼び出されること。
LLMAdapter.generate_character_thought が、構築されたコンテクストと正しいプロンプトテンプレートパスで呼び出されること。
InformationUpdater.record_turn_to_short_term_log が、LLMの応答（モック）に基づいて呼び出されること。
engine._current_scene_log.turns に、LLMの応答（モック）に基づいた TurnData が1件記録されること。
コンソールにターンの情報がログ出力されること。
異常系テスト
テストケース1: LLMAdapter が LLMGenerationError を発生させる場合
前提条件/入力: LLMAdapter.generate_character_thought のモックが LLMGenerationError を発生させる。
操作手順: engine.start_simulation() を実行。
期待される結果:
エラーがログに出力されること。
engine._current_scene_log.turns に記録される TurnData の think フィールドが、「（エラーにより思考できませんでした…）」のようなフォールバック内容になること。
シミュレーションがクラッシュせずに継続（または次のターンへ移行、あるいは安全に終了）すること。
テストケース2: LLMAdapter が InvalidLLMResponseError を発生させる場合
前提条件/入力: LLMAdapter.generate_character_thought のモックが InvalidLLMResponseError を発生させる。
操作手順: engine.start_simulation() を実行。
期待される結果: (テストケース1と同様のフォールバックとログ出力)
テストケース3: LLMAdapter が PromptTemplateNotFoundError を発生させる場合
前提条件/入力: LLMAdapter.generate_character_thought のモックが PromptTemplateNotFoundError を発生させる。
操作手順: engine.start_simulation() を実行。
期待される結果: (テストケース1と同様のフォールバックとログ出力)
完了の定義 (Definition of Done)
[ ] SimulationEngine.next_turn メソッドが、ダミー応答ではなく、実際に LLMAdapter.generate_character_thought を呼び出してLLMに思考を生成させるように修正されている。
[ ] LLMAdapter に渡すプロンプトテンプレートのパスが正しく指定されている。
[ ] LLMAdapter から発生する可能性のある主要な例外（LLMGenerationError, InvalidLLMResponseError, PromptTemplateNotFoundError）が next_turn 内で適切に処理され、ログが出力され、フォールバック動作（例: エラーを示す思考内容でログ記録）が実装されている。
[ ] シミュレーションがLLM関連のエラーでクラッシュせず、可能な限り継続または安全に終了する。
[ ] 各メソッドには適切な型ヒントとdocstringが付与されている。
[ ] 上記テストケース（正常系・異常系）を満たすユニットテストが作成され（例: project_anima/tests/test_simulation_engine.py を拡張）、全て成功する（LLM API呼び出しはモックを使用）。
[ ] コードに明らかなバグや非効率な箇所がない。
備考 (Notes)
このタスクの完了により、「Project Anima」は初めて、LLMによって動的に生成されたキャラクターの思考・行動・発言を伴うシミュレーションを実行できるようになります！これは非常に大きなマイルストーンですわ！
LLMの応答品質（生成される思考内容の「らしさ」など）については、このタスクでは深く追求しません。まずはシステムとして連携して動作することが目標です。応答品質の向上は、今後のプロンプトチューニングのタスクで対応します。
エラー発生時のフォールバック動作（例: エラーメッセージを思考として記録する）は、デバッグや問題特定に役立ちます。
