#!/usr/bin/env python3
"""
Project Anima - メインエントリーポイント

このファイルは、プロジェクトの起動点となります。
現時点では、必要なモジュールのインポートと動作確認を行います。
"""

import argparse
import logging
import sys

from core.data_models import (
    ImmutableCharacterData,
    LongTermCharacterData,
    SceneInfoData,
    SceneLogData,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(
        description="Project Anima - AIキャラクターシミュレーター"
    )
    parser.add_argument(
        "--scene", type=str, help="場面設定ファイルのパス (例: scenes/S001.yaml)"
    )
    parser.add_argument(
        "--debug", action="store_true", help="デバッグモードを有効にする"
    )

    args = parser.parse_args()

    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("デバッグモードが有効です")

    # ここでは簡単な動作確認として、定義済みのデータモデルが正常にインポートできることを確認
    logger.info("Project Animaを起動します...")
    logger.info("データモデルの動作確認: %s", ImmutableCharacterData.__name__)
    logger.info("データモデルの動作確認: %s", LongTermCharacterData.__name__)
    logger.info("データモデルの動作確認: %s", SceneInfoData.__name__)
    logger.info("データモデルの動作確認: %s", SceneLogData.__name__)

    # 将来的に、ここでシミュレーションエンジンを初期化し、場面をロードして実行する
    if args.scene:
        logger.info("場面設定ファイル %s を読み込みます（未実装）", args.scene)
    else:
        logger.info(
            "場面設定ファイルが指定されていません。--scene オプションで指定してください。"
        )

    logger.info("Project Animaを終了します")
    return 0


if __name__ == "__main__":
    sys.exit(main())
