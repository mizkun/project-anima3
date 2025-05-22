#!/usr/bin/env python3
"""
Project Anima - メインエントリーポイント

このファイルは、プロジェクトの起動点となります。
SimulationEngineを使用してキャラクターシミュレーションを実行します。
"""

import argparse
import logging
import sys
import os

# 必要なモジュールをインポート
from core.simulation_engine import SimulationEngine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
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


def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(
        description="Project Anima - AIキャラクターシミュレーター"
    )
    parser.add_argument(
        "--scene",
        type=str,
        default="scenes/school_rooftop.yaml",
        help="場面設定ファイルのパス (例: scenes/school_rooftop.yaml)",
    )
    parser.add_argument(
        "--characters-dir",
        type=str,
        default="characters",
        help="キャラクター設定ファイルが格納されているディレクトリのパス",
    )
    parser.add_argument(
        "--prompts-dir",
        type=str,
        default="prompts",
        help="プロンプトテンプレートが格納されているディレクトリのパス",
    )
    parser.add_argument(
        "--max-turns", type=int, default=3, help="実行するターン数（デフォルト: 3）"
    )
    parser.add_argument(
        "--debug", action="store_true", help="デバッグモードを有効にする"
    )
    parser.add_argument(
        "--llm-model",
        type=str,
        default="gemini-1.5-flash-latest",
        help="使用するLLMモデル名 (デフォルト: gemini-1.5-flash-latest)",
    )

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("デバッグモードが有効です")

    # パスの正規化
    current_dir = os.path.dirname(os.path.abspath(__file__))
    scene_file_path = os.path.join(current_dir, args.scene)
    characters_base_path = os.path.join(current_dir, args.characters_dir)
    prompts_dir_path = os.path.join(current_dir, args.prompts_dir)

    # ファイルの存在確認
    if not os.path.exists(scene_file_path):
        logger.error(f"指定された場面設定ファイルが見つかりません: {scene_file_path}")
        return 1

    if not os.path.exists(characters_base_path):
        logger.error(
            f"指定されたキャラクターディレクトリが見つかりません: {characters_base_path}"
        )
        return 1

    if not os.path.exists(prompts_dir_path):
        logger.error(
            f"指定されたプロンプトディレクトリが見つかりません: {prompts_dir_path}"
        )
        return 1

    # ヘッダー表示
    display_header("Project Anima - シミュレーション実行")
    logger.info(f"場面設定ファイル: {scene_file_path}")
    logger.info(f"キャラクターディレクトリ: {characters_base_path}")
    logger.info(f"プロンプトディレクトリ: {prompts_dir_path}")
    logger.info(f"使用するLLMモデル: {args.llm_model}")
    logger.info(f"最大ターン数: {args.max_turns}")

    try:
        # SimulationEngineの初期化
        logger.info("SimulationEngineを初期化しています...")
        engine = SimulationEngine(
            scene_file_path=scene_file_path,
            characters_base_path=characters_base_path,
            llm_model_name=args.llm_model,
            prompts_dir_path=prompts_dir_path,
        )

        # シミュレーションの実行
        logger.info(f"シミュレーションを開始します...")
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

    except Exception as e:
        logger.error(
            f"シミュレーション中にエラーが発生しました: {str(e)}", exc_info=True
        )
        return 1

    logger.info("シミュレーションが終了しました")
    return 0


if __name__ == "__main__":
    sys.exit(main())
