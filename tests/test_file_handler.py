"""
ファイルハンドラのユニットテスト

このモジュールでは、utils/file_handler.pyで定義された関数のテストを行います。
"""

import json
import os
import tempfile
from pathlib import Path

import pytest
import yaml

from utils.file_handler import load_yaml, save_yaml, load_json, save_json


class TestYamlHandler:
    """YAMLファイル読み書き機能のテスト"""

    def test_load_yaml_valid(self):
        """正常なYAMLファイルの読み込みテスト"""
        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(suffix=".yaml", delete=False) as temp:
            temp.write(
                b"""
name: Project Anima
version: 0.1.0
settings:
  debug: true
  port: 8000
"""
            )
            temp_path = temp.name

        try:
            # ファイルを読み込み
            data = load_yaml(temp_path)

            # 読み込んだデータの検証
            assert data["name"] == "Project Anima"
            assert data["version"] == "0.1.0"
            assert data["settings"]["debug"] is True
            assert data["settings"]["port"] == 8000
        finally:
            # テスト終了後に一時ファイルを削除
            os.unlink(temp_path)

    def test_save_yaml(self):
        """YAMLファイルの書き込みテスト"""
        # テストデータ
        test_data = {"key": "value", "numbers": [1, 2, 3], "nested": {"a": True}}

        # 一時ディレクトリに保存
        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = os.path.join(temp_dir, "output.yaml")

            # データをYAMLファイルとして保存
            save_yaml(test_data, file_path)

            # ファイルが作成されたか確認
            assert os.path.exists(file_path)

            # 読み込んでデータが一致するか確認
            loaded_data = load_yaml(file_path)
            assert loaded_data == test_data

    def test_load_yaml_file_not_found(self):
        """存在しないYAMLファイルの読み込みテスト"""
        with pytest.raises(FileNotFoundError):
            load_yaml("non_existent.yaml")

    def test_load_yaml_invalid_format(self):
        """不正な形式のYAMLファイルの読み込みテスト"""
        # 不正なYAMLファイルを作成
        with tempfile.NamedTemporaryFile(suffix=".yaml", delete=False) as temp:
            temp.write(b"name: Test: value_with_unescaped_colon")
            temp_path = temp.name

        try:
            # ファイル読み込み時にエラーが発生することを確認
            with pytest.raises(yaml.YAMLError):
                load_yaml(temp_path)
        finally:
            # テスト終了後に一時ファイルを削除
            os.unlink(temp_path)


class TestJsonHandler:
    """JSONファイル読み書き機能のテスト"""

    def test_load_json_valid(self):
        """正常なJSONファイルの読み込みテスト"""
        # 一時ファイルを作成
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as temp:
            temp.write(
                b"""
{
    "name": "Project Anima",
    "version": "0.1.0",
    "settings": {
        "debug": true,
        "port": 8000
    }
}
"""
            )
            temp_path = temp.name

        try:
            # ファイルを読み込み
            data = load_json(temp_path)

            # 読み込んだデータの検証
            assert data["name"] == "Project Anima"
            assert data["version"] == "0.1.0"
            assert data["settings"]["debug"] is True
            assert data["settings"]["port"] == 8000
        finally:
            # テスト終了後に一時ファイルを削除
            os.unlink(temp_path)

    def test_save_json(self):
        """JSONファイルの書き込みテスト"""
        # テストデータ
        test_data = {"key": "value", "numbers": [1, 2, 3], "nested": {"a": True}}

        # 一時ディレクトリに保存
        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = os.path.join(temp_dir, "output.json")

            # データをJSONファイルとして保存（インデント設定テスト）
            save_json(test_data, file_path, indent=2)

            # ファイルが作成されたか確認
            assert os.path.exists(file_path)

            # 読み込んでデータが一致するか確認
            loaded_data = load_json(file_path)
            assert loaded_data == test_data

            # インデントが適用されているか確認（ファイル内容チェック）
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                assert (
                    "  " in content
                )  # インデントが2スペースで適用されていることを確認

    def test_load_json_file_not_found(self):
        """存在しないJSONファイルの読み込みテスト"""
        with pytest.raises(FileNotFoundError):
            load_json("non_existent.json")

    def test_load_json_invalid_format(self):
        """不正な形式のJSONファイルの読み込みテスト"""
        # 不正なJSONファイルを作成
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as temp:
            temp.write(b"{invalid: json, format: true}")
            temp_path = temp.name

        try:
            # ファイル読み込み時にエラーが発生することを確認
            with pytest.raises(json.JSONDecodeError):
                load_json(temp_path)
        finally:
            # テスト終了後に一時ファイルを削除
            os.unlink(temp_path)

    def test_save_json_nested_dir(self):
        """ネストされたディレクトリにJSONファイルを保存するテスト"""
        test_data = {"test": "data"}

        with tempfile.TemporaryDirectory() as temp_dir:
            # ネストされたパスを作成
            nested_path = os.path.join(temp_dir, "nested", "dirs", "output.json")

            # ファイル保存（自動的にディレクトリが作成されることを期待）
            save_json(test_data, nested_path)

            # ファイルが作成されたか確認
            assert os.path.exists(nested_path)

            # データが正しく保存されているか確認
            loaded_data = load_json(nested_path)
            assert loaded_data == test_data
