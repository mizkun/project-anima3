"""
SimulationEngineクラスの手動テスト用スクリプト

このスクリプトは、SimulationEngineクラスの基本機能を手動でテストするためのものです。
サンプルシーンを使用してシミュレーションを実行し、各ターンの結果を表示します。
"""

import os
import sys
import logging
import argparse
from unittest import mock
from pprint import pprint

from core.simulation_engine import SimulationEngine
from core.llm_adapter import LLMAdapter

# ロギングの設定
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def display_header(title):
    """セクションのヘッダーを表示する"""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)


def display_footer():
    """セクションのフッターを表示する"""
    print("-" * 80)


def create_dummy_llm_adapter(character_id, character_name):
    """ダミーのLLMAdapter応答を作成する"""

    def dummy_generate_character_thought(context, template_file):
        return {
            "think": f"{character_name}は状況を観察し、次にどうするか考えています。キャラクターID: {character_id}",
            "act": f"{character_name}は周囲を見回しながら、静かに立っています。",
            "talk": f"{character_name}「こんにちは、素敵な天気ですね。」",
        }

    # LLMAdapterのモックを作成
    mock_llm = mock.MagicMock(spec=LLMAdapter)
    mock_llm.generate_character_thought.side_effect = dummy_generate_character_thought

    return mock_llm


def parse_arguments():
    """コマンドライン引数をパースする"""
    parser = argparse.ArgumentParser(description="SimulationEngineの手動テスト")
    parser.add_argument(
        "--use-real-llm",
        action="store_true",
        help="実際のLLMAdapterを使用する（デフォルトはモック）",
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=3,
        help="実行するターン数（デフォルト: 3）",
    )
    return parser.parse_args()


def main():
    """SimulationEngineの手動テスト"""
    # コマンドライン引数のパース
    args = parse_arguments()

    try:
        display_header("シミュレーションエンジンの手動テスト")

        # テスト用のパス設定
        current_dir = os.path.dirname(os.path.abspath(__file__))
        scene_file_path = os.path.join(current_dir, "scenes", "school_rooftop.yaml")
        characters_base_path = os.path.join(current_dir, "characters")

        logger.info("SimulationEngineを初期化しています...")

        if args.use_real_llm:
            # 実際のLLMAdapterを使用
            logger.info("実際のLLMAdapterを使用します")
            engine = SimulationEngine(
                scene_file_path=scene_file_path,
                characters_base_path=characters_base_path,
            )
        else:
            # LLMAdapterクラスをモック化
            logger.info("モック化されたLLMAdapterを使用します")
            with mock.patch("core.llm_adapter.LLMAdapter") as mock_llm_adapter_class:
                # LLMAdapterのインスタンスが呼び出されたとき、ダミーのモックを返すように設定
                mock_llm_adapter_class.return_value = create_dummy_llm_adapter(
                    "rinko_kizuki_002", "城月燐子"
                )

                # SimulationEngineのインスタンス化
                engine = SimulationEngine(
                    scene_file_path=scene_file_path,
                    characters_base_path=characters_base_path,
                )

                # モック化に成功していることを確認
                if mock_llm_adapter_class.called:
                    logger.info("LLMAdapterのモック化に成功しました")

        # シミュレーションの実行
        logger.info(
            f"シーンファイル '{scene_file_path}' を使用してシミュレーションを開始します... （最大ターン数: {args.max_turns}）"
        )
        engine.start_simulation(max_turns=args.max_turns)

        # 結果の表示
        if engine._current_scene_log:
            display_header("シミュレーション結果")

            print(f"場面ID: {engine._current_scene_log.scene_info.scene_id}")
            print(f"場所: {engine._current_scene_log.scene_info.location}")
            print(f"時間: {engine._current_scene_log.scene_info.time}")
            print(f"状況: {engine._current_scene_log.scene_info.situation}")
            print(
                f"参加キャラクター: {', '.join(engine._current_scene_log.scene_info.participant_character_ids)}"
            )

            print("\n----- ターン履歴 -----")
            for turn in engine._current_scene_log.turns:
                print(
                    f"[ターン {turn.turn_number}] {turn.character_name} (ID: {turn.character_id})"
                )
                print(f"  思考: {turn.think}")
                print(f"  行動: {turn.act if turn.act else '(なし)'}")
                print(f"  発言: {turn.talk if turn.talk else '(なし)'}")
                print()

            display_footer()
        else:
            logger.warning(
                "シミュレーションが正常に実行されなかったため、結果を表示できません。"
            )

        logger.info("テストが完了しました。")

    except Exception as e:
        logger.error(f"テスト中にエラーが発生しました: {str(e)}", exc_info=True)


if __name__ == "__main__":
    main()
