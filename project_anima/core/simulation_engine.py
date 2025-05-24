"""
シミュレーションエンジンモジュール

このモジュールは、Project Animaのシミュレーションを制御する中核的なエンジンを提供します。
各コンポーネント（CharacterManager、SceneManager、ContextBuilder、LLMAdapter、InformationUpdater）を
協調させ、シミュレーションの基本的な流れ（ループ）を実現します。
"""

import os
import logging
import json
import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING, Tuple

# 循環参照を避けるための型チェック時のみのインポート
if TYPE_CHECKING:
    from .character_manager import CharacterManager, CharacterNotFoundError
    from .scene_manager import SceneManager, SceneFileNotFoundError, SceneNotLoadedError
    from .context_builder import ContextBuilder
    from .llm_adapter import (
        LLMAdapter,
        LLMGenerationError,
        InvalidLLMResponseError,
        PromptTemplateNotFoundError,
    )
    from .information_updater import InformationUpdater
    from .data_models import SceneLogData, InterventionData, SceneInfoData

# ロガーの設定
logger = logging.getLogger(__name__)

# ファイルハンドラーモジュールをインポート
from utils.file_handler import save_json


class SimulationEngineError(Exception):
    """SimulationEngineの基本例外クラス"""

    pass


class SceneNotLoadedError(SimulationEngineError):
    """場面がロードされていない状態で操作が実行された場合に発生する例外"""

    def __init__(self):
        super().__init__(
            "シミュレーションが開始されていないか、場面がロードされていません"
        )


class SimulationEngine:
    """
    シミュレーションを制御するエンジンクラス

    このクラスは、Project Animaの中核となるシミュレーションエンジンです。
    指定された場面設定ファイルに基づいて、参加キャラクターが順番に行動するシミュレーションを
    実行します。各コンポーネント（CharacterManager、SceneManager、ContextBuilder、
    LLMAdapter、InformationUpdater）を協調させ、シミュレーションの基本的な流れを実現します。
    """

    def __init__(
        self,
        scene_file_path,
        characters_dir="data/characters",
        prompts_dir="data/prompts",
        log_dir="logs",
        llm_model="gemini-1.5-flash-latest",
        debug=False,
    ):
        """
        シミュレーションエンジンを初期化する

        Args:
            scene_file_path (str): 場面設定ファイルのパス
            characters_dir (str): キャラクター設定ファイルディレクトリのパス
            prompts_dir (str): プロンプトテンプレートディレクトリのパス
            log_dir (str): ログ出力先ディレクトリ
            llm_model (str): 使用するLLMモデル名
            debug (bool): デバッグモードフラグ
        """
        self.logger = logging.getLogger(self.__class__.__name__)
        self.debug = debug
        if debug:
            logging.getLogger().setLevel(logging.DEBUG)
            self.logger.setLevel(logging.DEBUG)
            self.logger.debug("デバッグモードが有効です")

        self.scene_file_path = scene_file_path
        self.log_dir = log_dir
        self.prompts_dir_path = prompts_dir

        # 各マネージャ・モジュールの初期化
        from .character_manager import CharacterManager
        from .scene_manager import SceneManager
        from .information_updater import InformationUpdater
        from .llm_adapter import LLMAdapter
        from .context_builder import ContextBuilder

        self.character_manager = CharacterManager(characters_dir)
        self.scene_manager = SceneManager()
        self.information_updater = InformationUpdater(self.log_dir)

        # LLMアダプターの初期化
        self.llm_adapter = LLMAdapter(model_name=llm_model, prompts_dir=prompts_dir)

        # コンテキストビルダーの初期化
        self.context_builder = ContextBuilder(
            self.character_manager, self.scene_manager
        )

        # シミュレーション状態の初期化
        self._is_running = False
        self._current_turn = 0
        self._max_turns = None
        self._current_scene_log = None
        self._divine_revelation = None
        self._end_scene_requested = False
        self._turn_count = 0

        # 天啓情報を保持する辞書 (キャラクターID -> 天啓内容のリスト)
        self._pending_revelations: Dict[str, List[str]] = {}

        logger.info("SimulationEngineを初期化しました")

    def start_simulation_setup(self) -> bool:
        """
        シミュレーションの初期セットアップを行う

        指定された場面設定をロードし、参加キャラクターの情報を読み込みます。

        Returns:
            bool: セットアップが成功したかどうか

        Raises:
            FileNotFoundError: 場面設定ファイルが見つからない場合
            ValueError: 場面設定ファイルの形式が不正な場合
        """
        logger.info(
            f"シミュレーションのセットアップを開始します。場面ファイル: {self.scene_file_path}"
        )

        try:
            # 場面設定をロード
            self.scene_manager.load_scene_from_file(self.scene_file_path)
            scene_info = self.scene_manager.get_current_scene_info()

            if scene_info is None:
                raise ValueError("場面情報の取得に失敗しました")

            # 参加キャラクターを確認
            participant_ids = scene_info.participant_character_ids
            if not participant_ids:
                logger.warning(
                    "参加キャラクターが存在しません。シミュレーションを終了します。"
                )
                return False

            # 参加キャラクターの情報をロード
            for character_id in participant_ids:
                try:
                    self.character_manager.load_character_data(character_id)
                except Exception as e:
                    logger.error(
                        f"キャラクター '{character_id}' の読み込みに失敗しました: {str(e)}"
                    )

            # 場面ログの初期化（インメモリ）
            from .data_models import SceneLogData

            self._current_scene_log = SceneLogData(
                scene_info=scene_info, interventions_in_scene=[], turns=[]
            )

            # 場面終了フラグを初期化
            self._end_scene_requested = False

            # ターンカウンターとインデックスの初期化
            self._turn_count = 0
            self._current_turn = 0
            self._is_running = True

            logger.info(
                f"場面 '{scene_info.scene_id}' のセットアップが完了しました。参加キャラクター: {participant_ids}"
            )
            return True

        except Exception as e:
            error_msg = (
                f"シミュレーションのセットアップ中にエラーが発生しました: {str(e)}"
            )
            logger.error(error_msg)
            raise SimulationEngineError(error_msg) from e

    def execute_one_turn(self) -> bool:
        """
        シミュレーションの1ターンを実行する

        現在のターンインデックスに基づいて次のキャラクターを決定し、
        そのキャラクターのターンを実行します。

        Returns:
            bool: シミュレーションが続行可能かどうか（Falseの場合は終了）
        """
        if not self._is_running or self._current_scene_log is None:
            raise SceneNotLoadedError()

        # 場面終了フラグのチェック
        if self._end_scene_requested:
            logger.info("場面終了が要求されたため、シミュレーションを終了します。")
            self._save_scene_log()
            self._is_running = False
            return False

        # 次の行動キャラクターを決定
        character_id = self._determine_next_character()

        # 全キャラクターが行動済みなら一巡完了
        if character_id is None:
            self._current_turn = 0
            self._turn_count += len(
                self._current_scene_log.scene_info.participant_character_ids
            )
            logger.info(
                f"全キャラクターの行動が完了しました（計 {self._turn_count} ターン）"
            )

            # 再度次のキャラクターを取得
            character_id = self._determine_next_character()
            if character_id is None:  # 参加者がいなくなった場合
                logger.warning(
                    "参加キャラクターがいなくなりました。シミュレーションを終了します。"
                )
                self._save_scene_log()
                self._is_running = False
                return False

        # キャラクターのターンを実行
        try:
            self.next_turn(character_id)
            self._current_turn += 1
            return True
        except Exception as e:
            logger.error(f"ターン実行中にエラーが発生しました: {str(e)}")
            # エラーが発生しても次のキャラクターに進む
            self._current_turn += 1
            return True

    def start_simulation(self, max_turns: Optional[int] = None) -> None:
        """
        シミュレーションを開始する（自動実行モード）

        指定された場面設定をロードし、シミュレーションループを開始します。
        各ターンで、参加キャラクターが順番に行動します。

        Args:
            max_turns: 最大ターン数（Noneの場合は無制限）

        Raises:
            FileNotFoundError: 場面設定ファイルが見つからない場合
            ValueError: 場面設定ファイルの形式が不正な場合
        """
        if not self.start_simulation_setup():
            return

        self._max_turns = max_turns

        # メインループ
        while True:
            # 最大ターン数のチェック
            if max_turns is not None and self._turn_count >= max_turns:
                logger.info(
                    f"最大ターン数 ({max_turns}) に達しました。シミュレーションを終了します。"
                )
                break

            if not self.execute_one_turn():
                break

        # シミュレーション終了時の処理
        logger.info("シミュレーションを終了します")

    def get_simulation_status(self) -> Dict[str, Any]:
        """
        現在のシミュレーション状態を取得する

        シミュレーションの現在の状態（ターン数、場面情報、参加キャラクターなど）を
        整形して返します。

        Returns:
            Dict[str, Any]: シミュレーション状態を表す辞書
        """
        if not self._is_running or self._current_scene_log is None:
            return {
                "is_running": False,
                "error": "シミュレーションが開始されていないか、場面がロードされていません",
            }

        scene_info = self._current_scene_log.scene_info
        status = {
            "is_running": self._is_running,
            "current_turn": self._current_turn,
            "turn_count": self._turn_count,
            "scene_id": scene_info.scene_id,
            "location": scene_info.location,
            "time": scene_info.time,
            "situation": scene_info.situation,
            "participants": scene_info.participant_character_ids,
            "turns_completed": len(self._current_scene_log.turns),
            "interventions_applied": len(
                self._current_scene_log.interventions_in_scene
            ),
            "end_requested": self._end_scene_requested,
        }

        # 次のターンで行動するキャラクターを表示
        next_character_id = self._determine_next_character()
        if next_character_id:
            try:
                char_info = self.character_manager.get_immutable_context(
                    next_character_id
                )
                status["next_character"] = {
                    "id": next_character_id,
                    "name": char_info.name,
                }
            except:
                status["next_character"] = {"id": next_character_id, "name": "不明"}

        return status

    def end_simulation(self) -> None:
        """
        シミュレーションを明示的に終了する

        現在の場面ログを保存し、シミュレーション状態をリセットします。
        """
        if self._is_running and self._current_scene_log is not None:
            self._save_scene_log()
            logger.info("シミュレーションを手動で終了しました")

        self._is_running = False
        self._end_scene_requested = True

    def _determine_next_character(self) -> Optional[str]:
        """
        次に行動するキャラクターを決定する

        現在のターンインデックスに基づいて、次に行動するキャラクターのIDを返します。
        単純なラウンドロビン方式で、参加キャラクターが順番に行動します。

        Returns:
            次に行動するキャラクターのID、決定できない場合はNone
        """
        if self._current_scene_log is None:
            logger.warning("場面ログが初期化されていません")
            return None

        participants = self._current_scene_log.scene_info.participant_character_ids

        if not participants:
            logger.warning("参加キャラクターが指定されていません")
            return None

        if self._current_turn >= len(participants):
            logger.warning("全キャラクターが行動済みです")
            return None

        return participants[self._current_turn]

    def next_turn(self, character_id: str) -> None:
        """
        指定されたキャラクターのターンを実行する

        コンテクスト構築、LLM思考生成、短期ログへの記録という
        一連の処理を実行します。

        Args:
            character_id: 行動するキャラクターのID

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
            SimulationEngineError: ターン実行中にエラーが発生した場合
        """
        if self._current_scene_log is None:
            raise SceneNotLoadedError()

        logger.info(f"キャラクター '{character_id}' のターンを開始します")

        try:
            # キャラクター情報の取得
            character_name = character_id  # デフォルト値（情報取得に失敗した場合）
            try:
                char_info = self.character_manager.get_immutable_context(character_id)
                character_name = char_info.name
            except Exception as e:
                logger.warning(f"キャラクター情報の取得に失敗しました: {str(e)}")

            # 短期ログの取得（現在の場面のターンリスト）
            current_scene_short_term_log = self._current_scene_log.turns

            # キャラクターのコンテクストを構築
            # 天啓情報がある場合は追加情報として渡す
            previous_scene_summary = None
            if (
                character_id in self._pending_revelations
                and self._pending_revelations[character_id]
            ):
                # 天啓情報を結合して一つの文字列にする
                revelations = self._pending_revelations[character_id]
                revelation_text = "\n".join([f"- {rev}" for rev in revelations])
                previous_scene_summary = (
                    f"【あなたは次の天啓を受けました】\n{revelation_text}"
                )

                # 使用した天啓情報をクリア
                self._pending_revelations[character_id] = []

                logger.info(f"キャラクター '{character_id}' に天啓情報を反映します")

            # コンテクスト構築
            context_dict = self.context_builder.build_context_for_character(
                character_id, current_scene_short_term_log, previous_scene_summary
            )

            # プロンプトテンプレートのパスを設定
            prompt_file_path = os.path.join(self.prompts_dir_path, "think_generate.txt")

            # LLM思考生成
            try:
                # LLMAdapterを使って思考を生成
                from .llm_adapter import (
                    LLMGenerationError,
                    InvalidLLMResponseError,
                    PromptTemplateNotFoundError,
                )

                llm_response = self.llm_adapter.generate_character_thought(
                    context_dict, prompt_file_path
                )

                think_content = llm_response.get(
                    "think", "（思考の生成に失敗しました）"
                )
                act_content = llm_response.get(
                    "act", ""
                )  # エラー時やキーがない場合は空文字
                talk_content = llm_response.get("talk", "")  # 同上

            except (
                LLMGenerationError,
                InvalidLLMResponseError,
                PromptTemplateNotFoundError,
            ) as e:
                logger.error(
                    f"キャラクター '{character_name}' ({character_id}) の思考生成中にエラーが発生しました: {str(e)}"
                )
                # エラーが発生した場合のフォールバック動作
                think_content = (
                    f"（エラーにより思考できませんでした: {type(e).__name__}）"
                )
                act_content = ""  # または "（エラーにより行動できません）" など
                talk_content = ""  # または "（エラーにより発言できません）" など
            except Exception as e:  # その他の予期せぬLLMAdapter関連エラー
                logger.error(
                    f"キャラクター '{character_name}' ({character_id}) の思考生成中に予期せぬLLMAdapterエラー: {str(e)}"
                )
                think_content = f"（予期せぬエラーにより思考停止: {type(e).__name__}）"
                act_content = ""
                talk_content = ""

            # 短期ログへの記録
            self.information_updater.record_turn_to_short_term_log(
                self._current_scene_log,
                character_id,
                character_name,
                think_content,
                act_content,
                talk_content,
            )

            # 現在のターンの情報をログに出力
            turn_number = len(self._current_scene_log.turns)
            logger.info(f"ターン {turn_number}: {character_name}")
            logger.info(f"  思考: {think_content}")
            if act_content:
                logger.info(f"  行動: {act_content}")
            if talk_content:
                logger.info(f"  発言: 「{talk_content}」")  # 発言を括弧で囲む
            if (
                not act_content and not talk_content and "エラー" not in think_content
            ):  # エラーでない場合で行動も発言もない場合
                logger.info(f"  (何も行動せず、何も話さなかった)")

        except Exception as e:
            error_msg = f"ターン実行中にエラーが発生しました: {str(e)}"
            logger.error(error_msg)
            # SimulationEngineErrorとしてラップせず、そのままログに出力して継続する
            # これにより、start_simulationのループ内でキャッチされて処理が継続する
            pass  # ターン全体のエラーがあっても次のキャラクターのターンに進む

    def process_user_intervention(self, intervention_data: "InterventionData") -> None:
        """
        ユーザー介入を処理する

        場面状況の更新、キャラクターへの天啓付与など、ユーザーからの介入指示を
        解釈し、対応する処理を実行します。

        Args:
            intervention_data: 処理する介入情報

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
            ValueError: 介入処理に必要な情報が不足している場合
        """
        # 場面ログの存在確認
        if self._current_scene_log is None:
            raise SceneNotLoadedError()

        # 介入情報をログに記録
        self.information_updater.record_intervention_to_log(
            self._current_scene_log, intervention_data
        )

        logger.info(
            f"ユーザー介入を受け付けました: {intervention_data.intervention_type} "
            f"(ターン {intervention_data.applied_before_turn_number} の前に適用)"
        )

        # 介入タイプに応じた処理を実行
        try:
            if intervention_data.intervention_type == "SCENE_SITUATION_UPDATE":
                # 場面状況更新
                new_situation = intervention_data.intervention.updated_situation_element
                self.scene_manager.update_scene_situation(new_situation)
                # 場面ログの情報も更新
                self._current_scene_log.scene_info.situation = new_situation
                logger.info(f"場面状況を更新しました: {new_situation}")

            elif intervention_data.intervention_type == "REVELATION":
                # 天啓付与
                if intervention_data.target_character_id is None:
                    raise ValueError("天啓付与には対象キャラクターIDが必要です")

                target_character_id = intervention_data.target_character_id
                revelation_content = intervention_data.intervention.revelation_content

                # 天啓情報を保存（次のターンのコンテクスト生成時に使用）
                if target_character_id not in self._pending_revelations:
                    self._pending_revelations[target_character_id] = []

                self._pending_revelations[target_character_id].append(
                    revelation_content
                )

                logger.info(
                    f"キャラクター '{target_character_id}' に天啓を付与しました: "
                    f"{revelation_content}"
                )

            elif intervention_data.intervention_type == "ADD_CHARACTER_TO_SCENE":
                # キャラクター追加（仮実装：GenericInterventionDetailsからキャラクターIDを取得）
                extra_data = getattr(intervention_data.intervention, "extra_data", {})
                character_id_to_add = extra_data.get("character_id_to_add")

                if not character_id_to_add:
                    logger.warning("追加するキャラクターIDが指定されていません")
                    return

                self.scene_manager.add_character_to_scene(character_id_to_add)
                # 場面ログの情報も更新
                if (
                    character_id_to_add
                    not in self._current_scene_log.scene_info.participant_character_ids
                ):
                    self._current_scene_log.scene_info.participant_character_ids.append(
                        character_id_to_add
                    )

                logger.info(
                    f"キャラクター '{character_id_to_add}' を場面に追加しました"
                )

            elif intervention_data.intervention_type == "REMOVE_CHARACTER_FROM_SCENE":
                # キャラクター削除（仮実装：GenericInterventionDetailsからキャラクターIDを取得）
                extra_data = getattr(intervention_data.intervention, "extra_data", {})
                character_id_to_remove = extra_data.get("character_id_to_remove")

                if not character_id_to_remove:
                    logger.warning("削除するキャラクターIDが指定されていません")
                    return

                self.scene_manager.remove_character_from_scene(character_id_to_remove)
                # 場面ログの情報も更新
                if (
                    character_id_to_remove
                    in self._current_scene_log.scene_info.participant_character_ids
                ):
                    self._current_scene_log.scene_info.participant_character_ids.remove(
                        character_id_to_remove
                    )

                logger.info(
                    f"キャラクター '{character_id_to_remove}' を場面から削除しました"
                )

            elif intervention_data.intervention_type == "END_SCENE":
                # 場面終了フラグを設定（start_simulationメソッドで参照）
                self._end_scene_requested = True
                logger.info("場面終了が要求されました")

            else:
                # 未定義の介入タイプ
                logger.warning(
                    f"未定義の介入タイプです: {intervention_data.intervention_type}"
                )

        except Exception as e:
            error_msg = f"介入処理中にエラーが発生しました: {str(e)}"
            logger.error(error_msg)
            # 元の例外を保持して再発生させず、警告ログとして出力
            # これにより、介入処理が失敗してもシミュレーションは継続可能

    def _save_scene_log(self) -> None:
        """
        場面ログをファイルに保存する

        シミュレーション終了時に、メモリ上の場面ログデータをJSONファイルとして
        logsディレクトリに保存します。ファイル名は「scene_<scene_id>.json」の
        形式で、人間が読みやすいように整形されたJSONで保存されます。

        Raises:
            PermissionError: ファイルへの書き込み権限がない場合
            OSError: その他のファイル書き込みエラー
        """
        # 場面ログが存在しない場合は処理を中断
        if (
            self._current_scene_log is None
            or self._current_scene_log.scene_info is None
        ):
            logger.warning("保存すべき場面ログが存在しません。")
            return

        # 場面IDを取得
        scene_id = self._current_scene_log.scene_info.scene_id

        # タイムスタンプを含むシミュレーションIDを生成
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        simulation_id = f"sim_{timestamp}"

        # ログディレクトリのパスを作成
        log_directory = os.path.join(self.log_dir, simulation_id)

        # ファイル名を決定
        file_name = f"scene_{scene_id}.json"

        # 出力ファイルの完全パスを作成
        output_file_path = os.path.join(log_directory, file_name)

        try:
            # ディレクトリを作成（存在しない場合）
            os.makedirs(log_directory, exist_ok=True)

            # 場面ログデータをPydanticモデルから辞書に変換
            log_data_dict = self._current_scene_log.model_dump()

            # ファイルに保存（インデント=2で見やすく整形）
            save_json(log_data_dict, output_file_path, indent=2)

            logger.info(f"場面ログをファイルに保存しました: {output_file_path}")

        except PermissionError as e:
            logger.error(
                f"ログファイルへの書き込み権限がありません: {output_file_path}. Error: {e}"
            )
        except Exception as e:
            logger.error(
                f"ログファイルの保存中に予期せぬエラーが発生しました: {output_file_path}. Error: {e}"
            )

    def update_character_long_term_info(
        self, character_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        キャラクターの長期情報を更新する

        指定されたキャラクターの長期情報をLLMによる更新提案に基づいて更新します。
        シミュレーション実行中に任意のタイミングで呼び出すことができます。

        Args:
            character_id: 更新対象のキャラクターID

        Returns:
            更新提案の内容を格納した辞書、またはエラー時にはNone

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
            ValueError: 指定されたキャラクターが現在の場面に参加していない場合
        """
        # 場面ログの存在確認
        if self._current_scene_log is None:
            raise SceneNotLoadedError()

        # 指定されたキャラクターが現在の場面に参加しているか確認
        participants = self._current_scene_log.scene_info.participant_character_ids
        if character_id not in participants:
            error_msg = f"キャラクター '{character_id}' は現在の場面に参加していません"
            logger.error(error_msg)
            raise ValueError(error_msg)

        logger.info(f"キャラクター '{character_id}' の長期情報更新を実行します")

        try:
            # 長期情報更新用プロンプトテンプレートのパスを設定
            prompt_template_path = os.path.join(
                self.prompts_dir_path, "long_term_update.txt"
            )

            # InformationUpdaterを使って長期情報を更新
            update_proposal = self.information_updater.trigger_long_term_update(
                character_id,
                self.llm_adapter,
                self._current_scene_log,
                self.context_builder,
                prompt_template_path,
            )

            logger.info(f"キャラクター '{character_id}' の長期情報を更新しました")
            return update_proposal

        except Exception as e:
            error_msg = f"キャラクター '{character_id}' の長期情報更新中にエラーが発生しました: {str(e)}"
            logger.error(error_msg)
            # ユーザーインターフェースでのハンドリングを容易にするためにNoneを返す
            return None

    def process_intervention_command(self, command_str: str) -> Tuple[bool, str]:
        """
        ユーザーからの介入コマンドを処理する

        コマンド文字列をパースして適切な介入データを生成し、process_user_interventionを呼び出します。

        Args:
            command_str: 処理する介入コマンド文字列
              - 形式: "<介入タイプ> [追加パラメータ...]"
              - 例:
                - "update_situation 新しい状況説明文"
                - "give_revelation <キャラID> <天啓内容>"
                - "add_character <キャラID>"
                - "remove_character <キャラID>"
                - "end_scene"

        Returns:
            Tuple[bool, str]: (成功したかどうか, メッセージ)
        """
        if not self._is_running or self._current_scene_log is None:
            return (
                False,
                "シミュレーションが開始されていないか、場面がロードされていません",
            )

        # 現在のターン情報を取得
        current_turn_number = len(self._current_scene_log.turns)

        # コマンドをパース
        parts = command_str.strip().split()
        if not parts:
            return False, "介入コマンドが指定されていません"

        intervention_type = parts[0].lower()

        from .data_models import (
            InterventionData,
            SceneUpdateDetails,
            RevelationDetails,
            GenericInterventionDetails,
        )

        try:
            if intervention_type == "update_situation" or intervention_type == "update":
                if len(parts) < 2:
                    return False, "新しい状況説明文が指定されていません"

                # 状況説明文を結合（スペースを含む文章に対応）
                new_situation = " ".join(parts[1:])

                intervention = InterventionData(
                    applied_before_turn_number=current_turn_number + 1,
                    intervention_type="SCENE_SITUATION_UPDATE",
                    intervention=SceneUpdateDetails(
                        description=f"ユーザーによる場面状況の更新",
                        updated_situation_element=new_situation,
                    ),
                )

                self.process_user_intervention(intervention)
                return True, f"場面状況を更新しました: {new_situation}"

            elif (
                intervention_type == "give_revelation"
                or intervention_type == "revelation"
            ):
                if len(parts) < 3:
                    return False, "対象キャラクターIDと天啓内容が必要です"

                target_character_id = parts[1]
                revelation_content = " ".join(parts[2:])

                # キャラクターの存在確認
                try:
                    self.character_manager.get_immutable_context(target_character_id)
                except:
                    return (
                        False,
                        f"キャラクター '{target_character_id}' が見つかりません",
                    )

                # 場面に参加しているか確認
                if (
                    target_character_id
                    not in self._current_scene_log.scene_info.participant_character_ids
                ):
                    return (
                        False,
                        f"キャラクター '{target_character_id}' は現在の場面に参加していません",
                    )

                intervention = InterventionData(
                    applied_before_turn_number=current_turn_number + 1,
                    intervention_type="REVELATION",
                    intervention=RevelationDetails(
                        description=f"ユーザーからキャラクター '{target_character_id}' への天啓",
                        revelation_content=revelation_content,
                    ),
                    target_character_id=target_character_id,
                )

                self.process_user_intervention(intervention)
                return (
                    True,
                    f"キャラクター '{target_character_id}' に天啓を付与しました: {revelation_content}",
                )

            elif intervention_type == "add_character" or intervention_type == "add":
                if len(parts) < 2:
                    return False, "追加するキャラクターIDが指定されていません"

                character_id_to_add = parts[1]

                # キャラクターの存在確認とデータのロード
                try:
                    self.character_manager.load_character_data(character_id_to_add)
                except Exception as e:
                    return (
                        False,
                        f"キャラクター '{character_id_to_add}' のロードに失敗しました: {str(e)}",
                    )

                # 既に場面に参加しているか確認
                if (
                    character_id_to_add
                    in self._current_scene_log.scene_info.participant_character_ids
                ):
                    return (
                        False,
                        f"キャラクター '{character_id_to_add}' は既に場面に参加しています",
                    )

                intervention = InterventionData(
                    applied_before_turn_number=current_turn_number + 1,
                    intervention_type="ADD_CHARACTER_TO_SCENE",
                    intervention=GenericInterventionDetails(
                        description=f"ユーザーによるキャラクター '{character_id_to_add}' の追加",
                        extra_data={"character_id_to_add": character_id_to_add},
                    ),
                )

                self.process_user_intervention(intervention)
                return (
                    True,
                    f"キャラクター '{character_id_to_add}' を場面に追加しました",
                )

            elif (
                intervention_type == "remove_character" or intervention_type == "remove"
            ):
                if len(parts) < 2:
                    return False, "削除するキャラクターIDが指定されていません"

                character_id_to_remove = parts[1]

                # 場面に参加しているか確認
                if (
                    character_id_to_remove
                    not in self._current_scene_log.scene_info.participant_character_ids
                ):
                    return (
                        False,
                        f"キャラクター '{character_id_to_remove}' は現在の場面に参加していません",
                    )

                intervention = InterventionData(
                    applied_before_turn_number=current_turn_number + 1,
                    intervention_type="REMOVE_CHARACTER_FROM_SCENE",
                    intervention=GenericInterventionDetails(
                        description=f"ユーザーによるキャラクター '{character_id_to_remove}' の削除",
                        extra_data={"character_id_to_remove": character_id_to_remove},
                    ),
                )

                self.process_user_intervention(intervention)
                return (
                    True,
                    f"キャラクター '{character_id_to_remove}' を場面から削除しました",
                )

            elif intervention_type == "end_scene" or intervention_type == "end":
                intervention = InterventionData(
                    applied_before_turn_number=current_turn_number + 1,
                    intervention_type="END_SCENE",
                    intervention=GenericInterventionDetails(
                        description="ユーザーによる場面終了", extra_data={}
                    ),
                )

                self.process_user_intervention(intervention)
                return True, "場面を終了します"

            else:
                return False, f"未知の介入タイプです: {intervention_type}"

        except Exception as e:
            logger.error(f"介入コマンド処理中にエラーが発生しました: {str(e)}")
            return False, f"介入コマンド処理中にエラーが発生しました: {str(e)}"
