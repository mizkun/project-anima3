"""
InformationUpdaterクラスの手動テスト用スクリプト

このスクリプトは、InformationUpdaterクラスの基本機能を手動でテストするためのものです。
シンプルな場面設定を作成し、ターンの記録と介入の記録を行い、結果を表示します。
"""

import os
import json
import logging
from pprint import pprint

from core.data_models import (
    SceneInfoData,
    SceneLogData,
    InterventionData,
    SceneUpdateDetails,
    RevelationDetails,
)
from core.information_updater import InformationUpdater
from core.character_manager import CharacterManager

# ロギングの設定
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_test_scene() -> SceneLogData:
    """テスト用の場面データを作成する"""
    # 場面情報を作成
    scene_info = SceneInfoData(
        scene_id="test_scene_001",
        location="カフェ",
        time="午後3時",
        situation="放課後のカフェで、アリスとボブが待ち合わせをしている。",
        participant_character_ids=["alice", "bob"],
    )

    # 場面ログデータを作成
    scene_log = SceneLogData(scene_info=scene_info, interventions_in_scene=[], turns=[])

    return scene_log


def display_scene_log(scene_log: SceneLogData) -> None:
    """場面ログの内容を表示する"""
    print("\n===== 場面ログの内容 =====")
    print(f"場面ID: {scene_log.scene_info.scene_id}")
    print(f"場所: {scene_log.scene_info.location}")
    print(f"時間: {scene_log.scene_info.time}")
    print(f"状況: {scene_log.scene_info.situation}")
    print(
        f"参加キャラクター: {', '.join(scene_log.scene_info.participant_character_ids)}"
    )

    print("\n----- ターン -----")
    if not scene_log.turns:
        print("  (ターンはまだありません)")
    else:
        for turn in scene_log.turns:
            print(f"[ターン {turn.turn_number}] {turn.character_name}:")
            print(f"  思考: {turn.think}")
            print(f"  行動: {turn.act if turn.act else '(なし)'}")
            print(f"  発言: {turn.talk if turn.talk else '(なし)'}")
            print()

    print("\n----- 介入 -----")
    if not scene_log.interventions_in_scene:
        print("  (介入はまだありません)")
    else:
        for i, intervention in enumerate(scene_log.interventions_in_scene, 1):
            print(f"[介入 {i}] タイプ: {intervention.intervention_type}")
            print(f"  適用ターン: {intervention.applied_before_turn_number}の前")
            if intervention.target_character_id:
                print(f"  対象キャラクター: {intervention.target_character_id}")
            print(f"  説明: {intervention.intervention.description}")

            # 介入タイプごとの詳細を表示
            if intervention.intervention_type == "SCENE_SITUATION_UPDATE":
                print(
                    f"  更新内容: {intervention.intervention.updated_situation_element}"
                )
            elif intervention.intervention_type == "REVELATION":
                print(f"  天啓内容: {intervention.intervention.revelation_content}")
            print()


def main():
    """InformationUpdaterの手動テスト"""
    try:
        # CharacterManagerのインスタンスを作成（ダミー）
        character_manager = CharacterManager("./characters")

        # InformationUpdaterのインスタンスを作成
        logger.info("InformationUpdaterを初期化しています...")
        updater = InformationUpdater(character_manager)

        # テスト用の場面データを作成
        scene_log = create_test_scene()

        # 初期状態の場面ログを表示
        display_scene_log(scene_log)

        # ===== ターンの記録テスト =====
        logger.info("ターンの記録をテストします...")

        # 1ターン目: アリスの行動
        updater.record_turn_to_short_term_log(
            scene_log,
            "alice",
            "アリス",
            "ボブを待っている。少し緊張している。",
            "窓の外を見ながらコーヒーを飲む",
            None,  # 発言なし
        )

        # 2ターン目: ボブの行動
        updater.record_turn_to_short_term_log(
            scene_log,
            "bob",
            "ボブ",
            "遅れてしまった。アリスに謝らなければ。",
            "急いでカフェに入り、アリスのテーブルに向かう",
            "ごめん、遅れちゃった！",
        )

        # 3ターン目: アリスの行動
        updater.record_turn_to_short_term_log(
            scene_log,
            "alice",
            "アリス",
            "ボブが来てくれて安心した。",
            "微笑む",
            "大丈夫よ、待ってたところ",
        )

        # ===== 介入の記録テスト =====
        logger.info("介入の記録をテストします...")

        # 介入1: 場面状況の更新（4ターン目の前に適用）
        scene_update = SceneUpdateDetails(
            description="カフェが混雑し始める",
            updated_situation_element="カフェに多くの客が入ってきて、周囲が騒がしくなる",
        )

        intervention1 = InterventionData(
            applied_before_turn_number=4,
            intervention_type="SCENE_SITUATION_UPDATE",
            intervention=scene_update,
        )

        updater.record_intervention_to_log(scene_log, intervention1)

        # 介入2: ボブへの天啓（5ターン目の前に適用）
        revelation = RevelationDetails(
            description="ボブが大事な約束を思い出す",
            revelation_content="アリスとの約束の後に、重要な課題の提出期限があることを思い出した",
        )

        intervention2 = InterventionData(
            applied_before_turn_number=5,
            intervention_type="REVELATION",
            intervention=revelation,
            target_character_id="bob",
        )

        updater.record_intervention_to_log(scene_log, intervention2)

        # 4ターン目: ボブの行動
        updater.record_turn_to_short_term_log(
            scene_log,
            "bob",
            "ボブ",
            "周りがうるさくなってきた。落ち着かない。",
            "周囲を見回す",
            "急に混んできたね",
        )

        # 5ターン目: ボブの行動（天啓を受けた後）
        updater.record_turn_to_short_term_log(
            scene_log,
            "bob",
            "ボブ",
            "あっ、課題の提出を忘れるところだった！焦っている。",
            "時計を見て驚く",
            "あ、ごめん。課題の提出があったの忘れてた。早めに切り上げないと...",
        )

        # 最終的な場面ログを表示
        display_scene_log(scene_log)

        # 長期情報更新トリガーのテスト（雛形なので実際には何も起きない）
        logger.info("長期情報更新トリガーをテストします（雛形実装）...")
        updater.trigger_long_term_update("alice", None, scene_log)

        # ログをJSONとして保存（サンプル出力）
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "test_scene_log.json")
        with open(log_path, "w", encoding="utf-8") as f:
            f.write(scene_log.model_dump_json(indent=2, exclude_none=False))
        logger.info(f"場面ログをJSONとして保存しました: {log_path}")

    except Exception as e:
        logger.error(f"テスト中にエラーが発生しました: {str(e)}", exc_info=True)


if __name__ == "__main__":
    main()
