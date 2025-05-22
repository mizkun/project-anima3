"""
LLMAdapterクラスのユニットテスト
"""

import os
import json
import tempfile
from unittest import mock, TestCase
from typing import Dict, Any

import pytest
from pydantic import BaseModel

from core.llm_adapter import (
    LLMAdapter,
    LLMAdapterError,
    PromptTemplateNotFoundError,
    LLMGenerationError,
    InvalidLLMResponseError,
)


class TestLLMAdapter(TestCase):
    """LLMAdapterクラスのテスト"""

    def setUp(self):
        """テスト前の準備"""
        # テスト用の環境変数を設定
        os.environ["GOOGLE_API_KEY"] = "dummy_api_key_for_testing"

        # LLM APIのモックを作成
        self.genai_patcher = mock.patch("google.generativeai.GenerativeModel")
        self.mock_genai = self.genai_patcher.start()

        # モックモデルが返すレスポンスを設定
        self.mock_model = mock.MagicMock()
        self.mock_genai.return_value = self.mock_model

        # モックレスポンスの準備
        self.mock_response = mock.MagicMock()
        self.mock_response.text = json.dumps(
            {
                "think": "これはテスト用の思考内容です。",
                "act": "テスト用の行動内容",
                "talk": "テスト用の発言内容",
            }
        )
        self.mock_model.generate_content.return_value = self.mock_response

        # テスト用のコンテクスト辞書
        self.test_context_dict = {
            "character_name": "テストキャラクター",
            "immutable_context": "テスト用の不変情報",
            "long_term_context": "テスト用の長期情報",
            "scene_context": "テスト用の場面情報",
            "short_term_context": "テスト用の短期情報",
        }

        # テスト用のプロンプトテンプレート
        self.test_template_content = """
あなたは{{character_name}}です。
以下の情報を参考にしてください。

【不変情報】
{{immutable_context}}

【長期情報】
{{long_term_context}}

【場面情報】
{{scene_context}}

【短期情報】
{{short_term_context}}

応答は必ずJSON形式で返してください:
```json
{
  "think": "思考内容",
  "act": "行動内容",
  "talk": "発言内容"
}
```
"""

    def tearDown(self):
        """テスト後の後片付け"""
        # モックパッチを停止
        self.genai_patcher.stop()

        # テスト用の環境変数をクリア
        if "GOOGLE_API_KEY" in os.environ:
            del os.environ["GOOGLE_API_KEY"]

    def test_init_with_environment_variable(self):
        """環境変数からAPIキーを読み込んで初期化できること"""
        adapter = LLMAdapter()
        self.assertEqual(adapter.api_key, "dummy_api_key_for_testing")
        self.assertEqual(adapter.model_name, "gemini-1.5-flash-latest")

    def test_init_with_api_key_parameter(self):
        """パラメータで指定されたAPIキーを使用して初期化できること"""
        adapter = LLMAdapter(api_key="custom_api_key")
        self.assertEqual(adapter.api_key, "custom_api_key")

    def test_init_with_missing_api_key(self):
        """APIキーが設定されていない場合にエラーを発生させること"""
        # 環境変数をクリア
        if "GOOGLE_API_KEY" in os.environ:
            del os.environ["GOOGLE_API_KEY"]

        with self.assertRaises(LLMAdapterError):
            LLMAdapter(api_key=None)

    def test_load_prompt_template(self):
        """プロンプトテンプレートを正しく読み込めること"""
        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as temp_file:
            temp_file.write(self.test_template_content)
            temp_path = temp_file.name

        try:
            adapter = LLMAdapter()
            template_str = adapter._load_prompt_template(temp_path)
            self.assertEqual(template_str, self.test_template_content)
        finally:
            # 一時ファイルを削除
            os.unlink(temp_path)

    def test_load_prompt_template_not_found(self):
        """存在しないテンプレートファイルを読み込もうとした場合にエラーを発生させること"""
        adapter = LLMAdapter()
        with self.assertRaises(PromptTemplateNotFoundError):
            adapter._load_prompt_template("non_existent_template.txt")

    def test_fill_prompt_template(self):
        """プロンプトテンプレートにコンテクストを正しく埋め込めること"""
        adapter = LLMAdapter()
        filled_prompt = adapter._fill_prompt_template(
            self.test_template_content, self.test_context_dict
        )

        # 各プレースホルダーが置換されていることを確認
        for key, value in self.test_context_dict.items():
            self.assertIn(value, filled_prompt)
            self.assertNotIn(f"{{{{{key}}}}}", filled_prompt)

    def test_generate_character_thought_success(self):
        """キャラクターの思考生成が正常に動作すること"""
        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as temp_file:
            temp_file.write(self.test_template_content)
            temp_path = temp_file.name

        try:
            adapter = LLMAdapter()
            result = adapter.generate_character_thought(
                self.test_context_dict, temp_path
            )

            # APIが呼び出されたことを確認
            self.mock_model.generate_content.assert_called_once()

            # 結果の検証
            self.assertIsInstance(result, dict)
            self.assertIn("think", result)
            self.assertIn("act", result)
            self.assertIn("talk", result)
            self.assertEqual(result["think"], "これはテスト用の思考内容です。")
            self.assertEqual(result["act"], "テスト用の行動内容")
            self.assertEqual(result["talk"], "テスト用の発言内容")
        finally:
            # 一時ファイルを削除
            os.unlink(temp_path)

    def test_generate_character_thought_api_error(self):
        """LLM API呼び出しエラー時に適切な例外を発生させること"""
        # APIエラーをシミュレート
        self.mock_model.generate_content.side_effect = Exception("API呼び出しエラー")

        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as temp_file:
            temp_file.write(self.test_template_content)
            temp_path = temp_file.name

        try:
            adapter = LLMAdapter()
            with self.assertRaises(LLMGenerationError):
                adapter.generate_character_thought(self.test_context_dict, temp_path)
        finally:
            # 一時ファイルを削除
            os.unlink(temp_path)

    def test_generate_character_thought_invalid_response(self):
        """不正な形式のLLM応答に対して適切な例外を発生させること"""
        # 不正なJSONをシミュレート
        self.mock_response.text = "これはJSONではないテキスト"

        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as temp_file:
            temp_file.write(self.test_template_content)
            temp_path = temp_file.name

        try:
            adapter = LLMAdapter()
            with self.assertRaises(InvalidLLMResponseError):
                adapter.generate_character_thought(self.test_context_dict, temp_path)
        finally:
            # 一時ファイルを削除
            os.unlink(temp_path)

    def test_generate_character_thought_missing_keys(self):
        """必須キーが欠けたLLM応答に対して適切な例外を発生させること"""
        # 必須キーが欠けたJSONをシミュレート
        self.mock_response.text = json.dumps(
            {
                "think": "思考内容",
                # "act"キーが欠けている
                "talk": "発言内容",
            }
        )

        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as temp_file:
            temp_file.write(self.test_template_content)
            temp_path = temp_file.name

        try:
            adapter = LLMAdapter()
            with self.assertRaises(InvalidLLMResponseError):
                adapter.generate_character_thought(self.test_context_dict, temp_path)
        finally:
            # 一時ファイルを削除
            os.unlink(temp_path)

    def test_update_character_long_term_info_dummy(self):
        """長期情報更新メソッドがダミーデータを返すこと（将来的な実装用）"""
        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as temp_file:
            temp_file.write(self.test_template_content)
            temp_path = temp_file.name

        try:
            adapter = LLMAdapter()
            result = adapter.update_character_long_term_info(
                "test_character", self.test_context_dict, temp_path
            )

            # ダミーデータの構造を検証
            self.assertIsInstance(result, dict)
            self.assertIn("experiences", result)
            self.assertIn("goals", result)
            self.assertIn("memories", result)
        finally:
            # 一時ファイルを削除
            os.unlink(temp_path)


if __name__ == "__main__":
    pytest.main(["-v", "test_llm_adapter.py"])
