"""
LLM APIとの通信を抽象化するアダプターモジュール

このモジュールは、LLM API（主にGoogle Gemini）との通信を担当し、
他のモジュールがLLMの機能を簡単に利用できるようにするインターフェースを提供します。
"""

import os
import json
from typing import Dict, Optional, Any, List
import logging

import google.generativeai as genai
from langgraph.graph import StateGraph, END

# ロガーの設定
logger = logging.getLogger(__name__)


class LLMAdapterError(Exception):
    """LLMAdapterの基本例外クラス"""

    pass


class PromptTemplateNotFoundError(LLMAdapterError):
    """プロンプトテンプレートファイルが見つからない場合に発生する例外"""

    def __init__(self, template_path: str):
        self.template_path = template_path
        message = f"プロンプトテンプレートファイルが見つかりません: {template_path}"
        super().__init__(message)


class LLMGenerationError(LLMAdapterError):
    """LLM API呼び出し時に発生する例外"""

    def __init__(self, message: str, original_error: Optional[Exception] = None):
        self.original_error = original_error
        super().__init__(message)


class InvalidLLMResponseError(LLMAdapterError):
    """LLMからの応答が期待された形式でない場合に発生する例外"""

    def __init__(self, response_text: str, error_details: str):
        self.response_text = response_text
        self.error_details = error_details
        message = f"LLMからの応答が不正な形式です: {error_details}"
        super().__init__(message)


class LLMAdapter:
    """
    LLM APIとの通信を抽象化するアダプタークラス

    このクラスは、LLM API（主にGoogle Gemini）との通信を抽象化し、
    他のモジュールがLLMの機能を簡単に利用できるようにするインターフェースを提供します。
    """

    def __init__(
        self, model_name: str = "gemini-1.5-flash-latest", api_key: Optional[str] = None
    ):
        """
        LLMAdapterを初期化する

        Args:
            model_name: 使用するLLMモデル名（デフォルト: "gemini-1.5-flash-latest"）
            api_key: LLM APIキー（省略時は環境変数から読み込み）

        Raises:
            LLMAdapterError: APIキーが設定されていない場合
        """
        # APIキーの取得（引数 -> 環境変数の順）
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")

        if not self.api_key:
            raise LLMAdapterError(
                "APIキーが設定されていません。引数で渡すか、環境変数 GOOGLE_API_KEY を設定してください。"
            )

        # モデル名の保存
        self.model_name = model_name

        # Google Gemini APIの初期化
        genai.configure(api_key=self.api_key)

        # モデル設定
        self.generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 2048,
        }

        # LLMモデルの初期化
        try:
            self.model = genai.GenerativeModel(
                model_name=self.model_name, generation_config=self.generation_config
            )
            logger.info(f"LLMAdapterを初期化しました（モデル: {model_name}）")
        except Exception as e:
            error_msg = f"LLMモデルの初期化に失敗しました: {str(e)}"
            logger.error(error_msg)
            raise LLMAdapterError(error_msg) from e

    def _load_prompt_template(self, template_path: str) -> str:
        """
        プロンプトテンプレートファイルを読み込む

        Args:
            template_path: テンプレートファイルのパス

        Returns:
            読み込んだテンプレート文字列

        Raises:
            PromptTemplateNotFoundError: テンプレートファイルが見つからない場合
        """
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                template_str = f.read()
            return template_str
        except FileNotFoundError:
            logger.error(
                f"プロンプトテンプレートファイルが見つかりません: {template_path}"
            )
            raise PromptTemplateNotFoundError(template_path)

    def _fill_prompt_template(
        self, template_str: str, context_dict: Dict[str, str]
    ) -> str:
        """
        プロンプトテンプレートにコンテクスト情報を埋め込む

        Args:
            template_str: テンプレート文字列
            context_dict: コンテクスト情報を格納した辞書

        Returns:
            コンテクスト情報が埋め込まれたプロンプト文字列
        """
        filled_prompt = template_str

        # 辞書内の各キーと値に対して置換を行う
        for key, value in context_dict.items():
            placeholder = f"{{{{{key}}}}}"
            filled_prompt = filled_prompt.replace(placeholder, str(value))

            # _str サフィックス付きのプレースホルダーも対応
            placeholder_with_suffix = f"{{{{{key}_str}}}}"
            filled_prompt = filled_prompt.replace(placeholder_with_suffix, str(value))

        return filled_prompt

    def generate_character_thought(
        self, context_dict: Dict[str, str], prompt_template_path: str
    ) -> Dict[str, str]:
        """
        キャラクターの思考・行動・発言を生成する

        Args:
            context_dict: コンテクスト情報を格納した辞書
            prompt_template_path: 使用するプロンプトテンプレートのパス

        Returns:
            生成された思考・行動・発言を格納した辞書
            {
                "think": "キャラクターの思考内容",
                "act": "キャラクターの行動内容",
                "talk": "キャラクターの発言内容"
            }

        Raises:
            PromptTemplateNotFoundError: テンプレートファイルが見つからない場合
            LLMGenerationError: LLM API呼び出しに失敗した場合
            InvalidLLMResponseError: LLMからの応答が不正な形式の場合
        """
        try:
            # プロンプトテンプレートの読み込み
            template_str = self._load_prompt_template(prompt_template_path)

            # コンテクスト情報の埋め込み
            final_prompt = self._fill_prompt_template(template_str, context_dict)

            logger.debug(f"生成された最終プロンプト: {final_prompt}")

            # LangGraphを使用せずに直接LLM APIを呼び出す（簡易版）
            try:
                response = self.model.generate_content(final_prompt)
                response_text = response.text

                logger.debug(f"LLMからの応答: {response_text}")

                # JSON形式の応答をパース
                try:
                    response_dict = json.loads(response_text)

                    # 必要なキーが含まれているか検証
                    required_keys = ["think", "act", "talk"]
                    for key in required_keys:
                        if key not in response_dict:
                            raise InvalidLLMResponseError(
                                response_text,
                                f"応答に必須キー '{key}' が含まれていません",
                            )

                    return response_dict

                except json.JSONDecodeError as e:
                    error_msg = f"LLMからの応答をJSONとしてパースできません: {e}"
                    logger.error(error_msg)
                    raise InvalidLLMResponseError(response_text, error_msg)

            except InvalidLLMResponseError:
                # InvalidLLMResponseErrorはそのまま上位に伝播
                raise
            except Exception as e:
                # InvalidLLMResponseError以外の例外はLLMGenerationErrorでラップ
                if isinstance(e, InvalidLLMResponseError):
                    raise
                error_msg = f"LLM API呼び出しに失敗しました: {str(e)}"
                logger.error(error_msg)
                raise LLMGenerationError(error_msg, e)

        except PromptTemplateNotFoundError:
            # 既に適切な例外が発生しているので、そのまま再度発生させる
            raise
        except (InvalidLLMResponseError, LLMGenerationError):
            # 既知の例外はそのまま再発生
            raise
        except Exception as e:
            # その他の例外は LLMGenerationError でラップ
            error_msg = f"思考生成中に予期せぬエラーが発生しました: {str(e)}"
            logger.error(error_msg)
            raise LLMGenerationError(error_msg, e)

    def _create_basic_thought_generation_graph(self):
        """
        思考生成のための基本的なLangGraphグラフを作成する（将来的な拡張用）

        Returns:
            思考生成用のStateGraph
        """

        # ステートの型定義
        class State(dict):
            """グラフの状態を表す辞書型クラス"""

            prompt: str
            response: Optional[str] = None

        # 思考生成ノード
        def generate_thought(state: State) -> State:
            """LLM APIを呼び出して思考を生成するノード"""
            try:
                response = self.model.generate_content(state["prompt"])
                state["response"] = response.text
                return state
            except Exception as e:
                state["error"] = str(e)
                return state

        # グラフの構築
        builder = StateGraph(State)
        builder.add_node("generate_thought", generate_thought)

        # エッジの設定
        builder.set_entry_point("generate_thought")
        builder.add_edge("generate_thought", END)

        # グラフのコンパイル
        graph = builder.compile()

        return graph

    def update_character_long_term_info(
        self, character_id: str, context_dict: Dict[str, str], prompt_template_path: str
    ) -> Dict[str, Any]:
        """
        キャラクターの長期情報更新案を生成する

        Args:
            character_id: 更新対象のキャラクターID
            context_dict: コンテクスト情報を格納した辞書
            prompt_template_path: 使用するプロンプトテンプレートのパス

        Returns:
            生成された長期情報更新案を格納した辞書

        Note:
            このメソッドは現段階では実装の雛形のみで、実際の機能はタスク5.1で実装します。
        """
        # 現段階では実装の雛形のみを提供
        # タスク5.1 「長期情報更新プロンプトとLLM連携」で本格的に実装予定

        # プロンプトテンプレートの読み込み
        template_str = self._load_prompt_template(prompt_template_path)

        # コンテクスト情報の埋め込み
        context_dict["character_id"] = character_id
        final_prompt = self._fill_prompt_template(template_str, context_dict)

        # この段階では、ダミーの更新案を返す
        dummy_update = {"experiences": [], "goals": [], "memories": []}

        logger.info(
            f"キャラクター {character_id} の長期情報更新（ダミー）を生成しました"
        )

        return dummy_update
