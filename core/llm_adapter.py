"""
LLM APIとの通信を抽象化するアダプターモジュール

このモジュールは、LLM API（主にGoogle Gemini）との通信を担当し、
他のモジュールがLLMの機能を簡単に利用できるようにするインターフェースを提供します。
"""

import os
import json
import re
from typing import Dict, Optional, Any, List
import logging
from dotenv import load_dotenv

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
            api_key: LLM APIキー（省略時は環境変数または.envファイルから読み込み）

        Raises:
            LLMAdapterError: APIキーが設定されていない場合
        """
        # .envファイルから環境変数を読み込む
        load_dotenv()

        # APIキーの取得（引数 -> 環境変数の順）
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY")

        if not self.api_key:
            raise LLMAdapterError(
                "APIキーが設定されていません。引数で渡すか、環境変数 GOOGLE_API_KEY を設定するか、"
                'プロジェクトルートに .env ファイルを作成して GOOGLE_API_KEY="YOUR_API_KEY" と記述してください。'
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

        # character_nameプレースホルダーを埋める
        if "character_name" not in context_dict and "immutable_context" in context_dict:
            # immutable_contextから名前を取得する簡易的な方法
            # 「〇〇は」という形式から名前を抽出
            immutable_text = context_dict["immutable_context"]
            if "は" in immutable_text:
                name_part = immutable_text.split("は")[0]
                if "【キャラクター基本情報】" in name_part:
                    name = name_part.split("】\n")[1].strip()
                    filled_prompt = filled_prompt.replace("{{character_name}}", name)

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

            # Gemini APIを呼び出して思考生成
            try:
                response = self.model.generate_content(final_prompt)
                response_text = response.text

                logger.debug(f"LLMからの応答: {response_text}")

                # コードブロックマーカーの除去
                # ```json や ``` などのマーカーを削除する
                cleaned_response = self._clean_json_response(response_text)

                # JSON形式の応答をパース
                try:
                    response_dict = json.loads(cleaned_response)

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
                    error_msg = f"LLMからの応答をJSONとしてパースできません: {e}\n応答: {response_text}\nクリーン後: {cleaned_response}"
                    logger.error(error_msg)
                    raise InvalidLLMResponseError(response_text, error_msg)

            except Exception as e:
                # LLM API呼び出し関連のエラー
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

    def _clean_json_response(self, response_text: str) -> str:
        """
        LLMからの応答テキストからコードブロックマーカーを除去する

        Args:
            response_text: LLMからの応答テキスト

        Returns:
            クリーニングされたJSONテキスト
        """
        # ```json や ``` などのマーカーを削除
        # 複数行の応答から ```json と ``` を削除
        cleaned = re.sub(r"^```json\s*\n", "", response_text, flags=re.MULTILINE)
        cleaned = re.sub(r"\n```\s*$", "", cleaned, flags=re.MULTILINE)

        # 単一行の応答から ```json と ``` を削除
        cleaned = re.sub(r"^```json", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned)

        return cleaned.strip()

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
            error: Optional[str] = None

        # ノード関数の定義
        def generate_thought(state: State) -> State:
            """LLMで思考を生成するノード関数"""
            try:
                # プロンプトからLLM応答を生成
                response = self.model.generate_content(state["prompt"])
                state["response"] = response.text
                return state
            except Exception as e:
                state["error"] = str(e)
                return state

        # グラフの構築
        builder = StateGraph(State)
        builder.add_node("generate_thought", generate_thought)
        builder.set_entry_point("generate_thought")
        builder.add_edge("generate_thought", END)

        # 完成したグラフを返す
        return builder.compile()

    def update_character_long_term_info(
        self,
        character_id: str,
        context_for_lt_update: Dict[str, str],
        prompt_template_path: str,
    ) -> Dict[str, Any]:
        """
        キャラクターの長期情報を更新する提案を生成する

        Args:
            character_id: 更新対象のキャラクターID
            context_for_lt_update: 長期情報更新用のコンテクスト情報を格納した辞書
                {
                    "character_name": "キャラクターの名前",
                    "existing_long_term_context_str": "キャラクターの既存の長期情報",
                    "recent_significant_events_or_thoughts_str": "最近の重要な出来事や思考"
                }
            prompt_template_path: 使用するプロンプトテンプレートのパス

        Returns:
            更新提案情報を格納した辞書
            {
                "new_experiences": [{"event": "...", "importance": 7}, ...],
                "updated_goals": [{"goal": "...", "importance": 8}, ...],
                "new_memories": [{"memory": "...", "scene_id_of_memory": "...", "related_character_ids": [...]}, ...]
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
            final_prompt = self._fill_prompt_template(
                template_str, context_for_lt_update
            )

            logger.debug(f"生成された長期情報更新用プロンプト: {final_prompt}")

            # Gemini APIを呼び出して更新提案を生成
            try:
                response = self.model.generate_content(final_prompt)
                response_text = response.text

                logger.debug(f"LLMからの長期情報更新応答: {response_text}")

                # コードブロックマーカーの除去
                cleaned_response = self._clean_json_response(response_text)

                # JSON形式の応答をパース
                try:
                    response_dict = json.loads(cleaned_response)

                    # 応答の構造を検証
                    self._validate_long_term_update_response(response_dict)

                    return response_dict

                except json.JSONDecodeError as e:
                    error_msg = f"LLMからの長期情報更新応答をJSONとしてパースできません: {e}\n応答: {response_text}\nクリーン後: {cleaned_response}"
                    logger.error(error_msg)
                    raise InvalidLLMResponseError(response_text, error_msg)

            except Exception as e:
                # LLM API呼び出し関連のエラー
                if isinstance(e, InvalidLLMResponseError):
                    raise
                error_msg = f"長期情報更新のLLM API呼び出しに失敗しました: {str(e)}"
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
            error_msg = f"長期情報更新中に予期せぬエラーが発生しました: {str(e)}"
            logger.error(error_msg)
            raise LLMGenerationError(error_msg, e)

    def _validate_long_term_update_response(
        self, response_dict: Dict[str, Any]
    ) -> None:
        """
        長期情報更新の応答が有効な形式かどうかを検証する

        Args:
            response_dict: 検証対象の応答辞書

        Raises:
            InvalidLLMResponseError: 応答が不正な形式の場合
        """
        # 必要なキーのいずれかが存在するか確認
        valid_keys = ["new_experiences", "updated_goals", "new_memories"]
        if not any(key in response_dict for key in valid_keys):
            raise InvalidLLMResponseError(
                str(response_dict),
                f"応答に必要なキー ({', '.join(valid_keys)}) のいずれも含まれていません",
            )

        # 各キーの内容を検証
        if "new_experiences" in response_dict:
            if not isinstance(response_dict["new_experiences"], list):
                raise InvalidLLMResponseError(
                    str(response_dict),
                    "new_experiences はリスト形式である必要があります",
                )

            # 各経験の内容を検証
            for i, exp in enumerate(response_dict["new_experiences"]):
                if (
                    not isinstance(exp, dict)
                    or "event" not in exp
                    or "importance" not in exp
                ):
                    raise InvalidLLMResponseError(
                        str(response_dict),
                        f"new_experiences[{i}] には 'event' と 'importance' キーが必要です",
                    )

                # importanceが1-10の整数値かチェック
                if not isinstance(exp["importance"], int) or not (
                    1 <= exp["importance"] <= 10
                ):
                    raise InvalidLLMResponseError(
                        str(response_dict),
                        f"new_experiences[{i}].importance は1から10の整数値である必要があります",
                    )

        # 目標の検証
        if "updated_goals" in response_dict:
            if not isinstance(response_dict["updated_goals"], list):
                raise InvalidLLMResponseError(
                    str(response_dict), "updated_goals はリスト形式である必要があります"
                )

            # 各目標の内容を検証
            for i, goal in enumerate(response_dict["updated_goals"]):
                if (
                    not isinstance(goal, dict)
                    or "goal" not in goal
                    or "importance" not in goal
                ):
                    raise InvalidLLMResponseError(
                        str(response_dict),
                        f"updated_goals[{i}] には 'goal' と 'importance' キーが必要です",
                    )

                # importanceが1-10の整数値かチェック
                if not isinstance(goal["importance"], int) or not (
                    1 <= goal["importance"] <= 10
                ):
                    raise InvalidLLMResponseError(
                        str(response_dict),
                        f"updated_goals[{i}].importance は1から10の整数値である必要があります",
                    )

        # 記憶の検証
        if "new_memories" in response_dict:
            if not isinstance(response_dict["new_memories"], list):
                raise InvalidLLMResponseError(
                    str(response_dict), "new_memories はリスト形式である必要があります"
                )

            # 各記憶の内容を検証
            for i, memory in enumerate(response_dict["new_memories"]):
                if (
                    not isinstance(memory, dict)
                    or "memory" not in memory
                    or "scene_id_of_memory" not in memory
                ):
                    raise InvalidLLMResponseError(
                        str(response_dict),
                        f"new_memories[{i}] には 'memory' と 'scene_id_of_memory' キーが必要です",
                    )

                # related_character_idsがリストかチェック
                if "related_character_ids" in memory and not isinstance(
                    memory["related_character_ids"], list
                ):
                    raise InvalidLLMResponseError(
                        str(response_dict),
                        f"new_memories[{i}].related_character_ids はリスト形式である必要があります",
                    )
