"""
シミュレーションエンジンモジュール

このモジュールは、Project Animaのシミュレーションを制御する中核的なエンジンを提供します。
各コンポーネント（CharacterManager、SceneManager、ContextBuilder、LLMAdapter、InformationUpdater）を
協調させ、シミュレーションの基本的な流れ（ループ）を実現します。
"""

import os
import logging
import json
from typing import Optional, List, Dict, Any, TYPE_CHECKING

# 循環参照を避けるための型チェック時のみのインポート
if TYPE_CHECKING:
    from .character_manager import CharacterManager, CharacterNotFoundError
    from .scene_manager import SceneManager, SceneFileNotFoundError, SceneNotLoadedError
    from .context_builder import ContextBuilder
    from .llm_adapter import LLMAdapter, LLMGenerationError
    from .information_updater import InformationUpdater
    from .data_models import SceneLogData, InterventionData, SceneInfoData

# ロガーの設定
logger = logging.getLogger(__name__)


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
        scene_file_path: str,
        characters_base_path: str,
        llm_model_name: str = "gemini-1.5-flash-latest",
        llm_api_key: Optional[str] = None,
        prompts_dir_path: str = "prompts",
    ):
        """
        SimulationEngineを初期化する

        Args:
            scene_file_path: 処理対象の場面設定ファイルのパス
            characters_base_path: キャラクター設定ファイルが格納されているベースディレクトリのパス
            llm_model_name: 使用するLLMモデル名（デフォルト: "gemini-1.5-flash-latest"）
            llm_api_key: LLM APIキー（省略時は環境変数から読み込み）
            prompts_dir_path: プロンプトテンプレートが格納されているディレクトリのパス
        """
        # ファイルパスの保存
        self.scene_file_path = scene_file_path
        self.characters_base_path = characters_base_path
        self.prompts_dir_path = prompts_dir_path

        # 各コンポーネントのインポートと初期化
        # インポートは循環参照を避けるため、メソッド内で行う
        from .character_manager import CharacterManager
        from .scene_manager import SceneManager
        from .context_builder import ContextBuilder
        from .llm_adapter import LLMAdapter
        from .information_updater import InformationUpdater

        # 各コンポーネントのインスタンス化
        self._character_manager = CharacterManager(characters_base_path)
        self._scene_manager = SceneManager()
        self._context_builder = ContextBuilder(
            self._character_manager, self._scene_manager
        )
        self._llm_adapter = LLMAdapter(model_name=llm_model_name, api_key=llm_api_key)
        self._information_updater = InformationUpdater(self._character_manager)

        # シミュレーション状態の初期化
        self._current_scene_log = None  # 現在の場面ログ
        self._current_turn_index = 0  # 次の行動キャラクターを決定するためのインデックス

        logger.info("SimulationEngineを初期化しました")

    def start_simulation(self, max_turns: Optional[int] = None) -> None:
        """
        シミュレーションを開始する

        指定された場面設定ファイルに基づいてシミュレーションを開始し、
        参加キャラクターが順番に行動するループを実行します。

        Args:
            max_turns: 最大ターン数（省略時は参加キャラクターの数だけ実行）

        Raises:
            SimulationEngineError: シミュレーション実行中にエラーが発生した場合
        """
        logger.info(f"シミュレーションを開始します: {self.scene_file_path}")

        # 場面情報のロード
        try:
            self._scene_manager.load_scene_from_file(self.scene_file_path)
        except Exception as e:
            error_msg = f"場面情報のロードに失敗しました: {str(e)}"
            logger.error(error_msg)
            raise SimulationEngineError(error_msg) from e

        # 場面情報の取得
        from .data_models import SceneLogData

        scene_info = self._scene_manager.get_current_scene_info()
        if scene_info is None:
            error_msg = "場面情報が取得できませんでした"
            logger.error(error_msg)
            raise SimulationEngineError(error_msg)

        # 場面ログの初期化
        self._current_scene_log = SceneLogData(
            scene_info=scene_info, interventions_in_scene=[], turns=[]
        )

        # 参加キャラクターの取得
        participants = scene_info.participant_character_ids
        if not participants:
            logger.warning("参加キャラクターが指定されていません")
            return

        logger.info(f"参加キャラクター: {', '.join(participants)}")

        # ループの実行回数を決定
        if max_turns is None:
            # デフォルトでは、全員が1回ずつ行動するシンプルなシミュレーション
            max_turns = len(participants)

        # シミュレーションのメインループ
        self._current_turn_index = 0
        executed_turns = 0

        while executed_turns < max_turns:
            try:
                # 次の行動キャラクターを決定
                character_id = self._determine_next_character()
                if character_id is None:
                    logger.info(
                        "全キャラクターが行動しました。シミュレーションを終了します"
                    )
                    break

                # キャラクターのターンを実行
                self.next_turn(character_id)

                # ターンカウントを更新
                executed_turns += 1
                self._current_turn_index = (self._current_turn_index + 1) % len(
                    participants
                )

            except Exception as e:
                error_msg = f"ターン実行中にエラーが発生しました: {str(e)}"
                logger.error(error_msg)
                # エラーは記録するが、可能ならシミュレーションは継続
                continue

        logger.info(
            f"シミュレーションが終了しました。実行されたターン数: {executed_turns}"
        )

        # 場面ログの保存（雛形）
        self._save_scene_log()

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

        if self._current_turn_index >= len(participants):
            logger.warning("全キャラクターが行動済みです")
            return None

        return participants[self._current_turn_index]

    def next_turn(self, character_id: str) -> None:
        """
        指定されたキャラクターのターンを実行する

        コンテクスト構築、LLM思考生成（ダミー応答）、短期ログへの記録という
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
                char_info = self._character_manager.get_immutable_context(character_id)
                character_name = char_info.name
            except Exception as e:
                logger.warning(f"キャラクター情報の取得に失敗しました: {str(e)}")

            # コンテクストの構築
            context_dict = self._context_builder.build_context_for_character(
                character_id, self._current_scene_log.turns
            )

            # LLM思考生成（このタスクではダミー応答）
            # 本来は以下のコードを使用する:
            # llm_response = self._llm_adapter.generate_character_thought(
            #    context_dict,
            #    os.path.join(self.prompts_dir_path, "think_generate.txt")
            # )

            # ダミーのLLM応答
            dummy_llm_response = {
                "think": f"{character_name}は状況を観察し、次にどうするか考えています。",
                "act": f"{character_name}は周囲を見回しながら、静かに立っています。",
                "talk": f"{character_name}「こんにちは、素敵な天気ですね。」",
            }

            # 短期ログへの記録
            self._information_updater.record_turn_to_short_term_log(
                self._current_scene_log,
                character_id,
                character_name,
                dummy_llm_response["think"],
                dummy_llm_response["act"],
                dummy_llm_response["talk"],
            )

            # 現在のターンの情報をログに出力
            turn_number = len(self._current_scene_log.turns)
            logger.info(f"ターン {turn_number}: {character_name}")
            logger.info(f"  思考: {dummy_llm_response['think']}")
            logger.info(f"  行動: {dummy_llm_response['act']}")
            logger.info(f"  発言: {dummy_llm_response['talk']}")

        except Exception as e:
            error_msg = f"ターン実行中にエラーが発生しました: {str(e)}"
            logger.error(error_msg)
            raise SimulationEngineError(error_msg) from e

    def process_user_intervention(self, intervention_data: "InterventionData") -> None:
        """
        ユーザー介入を処理する

        注: このメソッドはタスク5.3で本格的に実装予定です。
        現時点では雛形のみが提供されています。

        Args:
            intervention_data: 処理する介入情報
        """
        # タスク5.3で本格的に実装予定
        if self._current_scene_log is None:
            raise SceneNotLoadedError()

        # 仮実装: 介入情報をログに記録するだけ
        self._information_updater.record_intervention_to_log(
            self._current_scene_log, intervention_data
        )

        logger.info(
            f"ユーザー介入を記録しました: {intervention_data.intervention_type} "
            f"(ターン {intervention_data.applied_before_turn_number} の前に適用)"
        )

    def _save_scene_log(self) -> None:
        """
        場面ログをファイルに保存する

        注: このメソッドはタスク3.3で本格的に実装予定です。
        現時点では雛形のみが提供されています。
        """
        # タスク3.3で本格的に実装予定
        logger.info("場面ログの保存は未実装です（タスク3.3で実装予定）")
        pass
