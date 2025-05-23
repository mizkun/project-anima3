"""
LLMAdapterクラスの手動テスト用スクリプト

このスクリプトは、LLMAdapterクラスの基本機能を手動でテストするためのものです。
実際のGemini APIを呼び出すため、環境変数にAPIキーが設定されている必要があります。

使用方法:
1. 環境変数に `GOOGLE_API_KEY` を設定
   例: export GOOGLE_API_KEY="your_api_key_here"
2. スクリプトを実行: python manual_test_llm_adapter.py
"""

import os
import json
import logging
from typing import Dict

from core.llm_adapter import LLMAdapter

# ロギングの設定
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def create_test_prompt_template() -> str:
    """テスト用のシンプルなプロンプトテンプレートを作成する"""
    template = """
あなたは{{character_name}}というキャラクターです。
以下の情報を参考にしてください。

【基本情報】
{{basic_info}}

【現在の状況】
{{current_situation}}

あなたの思考、行動、発言を生成してください。
応答は必ず以下のJSON形式で返してください：

```json
{
  "think": "ここにキャラクターの思考内容を記述します。",
  "act": "ここに行動内容を記述します。行動がなければ空文字列です。",
  "talk": "ここに発言内容を記述します。発言がなければ空文字列です。"
}
```
"""
    # 一時ファイルに保存
    # シンプル化のため、examplesディレクトリに保存
    current_dir = os.path.dirname(os.path.abspath(__file__))
    temp_file_path = os.path.join(current_dir, "temp_prompt_template.txt")
    with open(temp_file_path, "w", encoding="utf-8") as f:
        f.write(template)

    return temp_file_path


def create_test_context() -> Dict[str, str]:
    """テスト用のシンプルなコンテキスト情報を作成する"""
    return {
        "character_name": "田中太郎",
        "basic_info": "28歳の男性。IT企業でプログラマーとして働いています。几帳面で真面目な性格ですが、ユーモアのセンスもあります。",
        "current_situation": "会社のカフェテリアでランチタイム。同僚の佐藤さんと山田さんが近くのテーブルで食事をしています。あなたは一人で食事を終えたところです。",
    }


def main():
    """LLMAdapterの手動テスト"""
    # APIキーが設定されているか確認
    if "GOOGLE_API_KEY" not in os.environ:
        logger.error("環境変数 GOOGLE_API_KEY が設定されていません。")
        logger.error(
            "export GOOGLE_API_KEY='your_api_key_here' を実行してから再度試してください。"
        )
        return

    try:
        # テスト用のプロンプトテンプレートを作成
        template_path = create_test_prompt_template()

        # テスト用のコンテキスト情報を作成
        context_dict = create_test_context()

        # LLMAdapterのインスタンスを作成
        logger.info("LLMAdapterを初期化しています...")
        adapter = LLMAdapter()

        # キャラクターの思考を生成
        logger.info("Gemini APIを呼び出して思考生成を行います...")
        result = adapter.generate_character_thought(context_dict, template_path)

        # 結果を表示
        logger.info("生成結果:")
        logger.info(f"思考: {result['think']}")
        logger.info(f"行動: {result['act']}")
        logger.info(f"発言: {result['talk']}")

        # 結果をJSONでも表示
        logger.info("JSON形式の結果:")
        logger.info(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        logger.error(f"テスト中にエラーが発生しました: {str(e)}", exc_info=True)

    finally:
        # 一時ファイルを削除
        current_dir = os.path.dirname(os.path.abspath(__file__))
        temp_file_path = os.path.join(current_dir, "temp_prompt_template.txt")
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            logger.info("一時ファイルを削除しました。")


if __name__ == "__main__":
    main()
