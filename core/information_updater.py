"""
シミュレーション中の情報更新を担当するモジュール

このモジュールは、キャラクターの行動（思考・行動・発言）やユーザーの介入を
シミュレーションログに記録する機能を提供します。また、キャラクターの長期情報の
更新をトリガーする機能の雛形も含まれています。
"""

import logging
from typing import Optional, TYPE_CHECKING

# 循環参照を避けるための型チェック時のみのインポート
if TYPE_CHECKING:
    from .character_manager import CharacterManager
    from .llm_adapter import LLMAdapter
    from .data_models import SceneLogData, TurnData, InterventionData

# ロガーの設定
logger = logging.getLogger(__name__)


class InformationUpdater:
    """
    シミュレーション中の情報更新を担当するクラス

    キャラクターの行動（思考・行動・発言）やユーザーの介入をシミュレーションログに
    記録する機能と、キャラクターの長期情報更新をトリガーする機能を提供します。
    """

    def __init__(self, character_manager: "CharacterManager"):
        """
        InformationUpdaterを初期化する

        Args:
            character_manager: キャラクター情報を管理するCharacterManagerインスタンス
        """
        self._character_manager = character_manager
        logger.info("InformationUpdaterを初期化しました")

    def record_turn_to_short_term_log(
        self,
        scene_log_data: "SceneLogData",
        character_id: str,
        character_name: str,
        think: str,
        act: Optional[str],
        talk: Optional[str],
    ) -> None:
        """
        1ターンの結果を短期ログに記録する

        Args:
            scene_log_data: 更新対象の場面ログデータ
            character_id: 行動したキャラクターのID
            character_name: 行動したキャラクターの名前
            think: キャラクターの思考内容
            act: キャラクターの行動内容（行動しない場合はNone）
            talk: キャラクターの発言内容（発言しない場合はNone）

        Raises:
            ValueError: scene_log_dataがNoneの場合
        """
        if scene_log_data is None:
            error_msg = (
                "scene_log_dataがNoneです。有効な場面ログデータを指定してください。"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)

        # 次のターン番号を決定（現在のターン数 + 1）
        next_turn_number = len(scene_log_data.turns) + 1

        # 型チェック時はimportされないため、動的にインポート
        from .data_models import TurnData

        # TurnDataインスタンスを生成
        new_turn = TurnData(
            turn_number=next_turn_number,
            character_id=character_id,
            character_name=character_name,
            think=think,
            act=act,
            talk=talk,
        )

        # scene_log_dataのturnsリストに追加
        scene_log_data.turns.append(new_turn)

        logger.info(
            f"ターン {next_turn_number}: キャラクター '{character_name}' の行動を記録しました"
        )

    def record_intervention_to_log(
        self, scene_log_data: "SceneLogData", intervention_data: "InterventionData"
    ) -> None:
        """
        ユーザー介入情報を短期ログに記録する

        Args:
            scene_log_data: 更新対象の場面ログデータ
            intervention_data: 記録する介入情報

        Raises:
            ValueError: scene_log_dataがNoneの場合
        """
        if scene_log_data is None:
            error_msg = (
                "scene_log_dataがNoneです。有効な場面ログデータを指定してください。"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)

        # scene_log_dataのinterventions_in_sceneリストに追加
        scene_log_data.interventions_in_scene.append(intervention_data)

        # 介入タイプとターン番号を取得してログに出力
        intervention_type = intervention_data.intervention_type
        target_turn = intervention_data.applied_before_turn_number

        logger.info(
            f"介入 '{intervention_type}' をターン {target_turn} の前に適用する記録を追加しました"
        )

    def trigger_long_term_update(
        self,
        character_id: str,
        llm_adapter: "LLMAdapter",
        current_scene_log: "SceneLogData",
    ) -> None:
        """
        キャラクターの長期情報更新をトリガーする

        注: このメソッドはタスク5.2で本格的に実装予定です。
        現時点では雛形のみが提供されています。

        Args:
            character_id: 更新対象のキャラクターID
            llm_adapter: LLM API呼び出しを行うLLMAdapterインスタンス
            current_scene_log: 現在の場面ログデータ
        """
        # タスク5.2で本格的に実装予定
        logger.info(
            f"キャラクター {character_id} の長期情報更新をトリガーしました（未実装）"
        )
        pass
