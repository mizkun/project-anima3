import sys
import platform


def test_imports():
    """基本的なインポートが機能することを確認するテスト"""
    # コアモジュールのインポート
    from project_anima.core import simulation_engine, character_manager
    from project_anima.utils import file_handler

    # データモデルのインポート
    from project_anima.core import data_models

    # CLIのインポート
    from project_anima import cli

    # バージョン情報のインポート
    from project_anima import __version__

    assert __version__ == "0.1.0"
    assert simulation_engine is not None
    assert character_manager is not None
    assert file_handler is not None
    assert data_models is not None
    assert cli is not None


def test_python_version():
    """Pythonバージョンの確認テスト"""
    # Python 3.9以上が必要
    version_info = sys.version_info
    assert version_info.major == 3
    assert version_info.minor >= 9


def test_project_structure():
    """プロジェクト構造の確認テスト"""
    import os

    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

    # 主要なディレクトリの存在確認
    assert os.path.isdir(os.path.join(base_path, "project_anima"))
    assert os.path.isdir(os.path.join(base_path, "project_anima/core"))
    assert os.path.isdir(os.path.join(base_path, "project_anima/utils"))
    assert os.path.isdir(os.path.join(base_path, "data"))
    assert os.path.isdir(os.path.join(base_path, "data/characters"))
    assert os.path.isdir(os.path.join(base_path, "data/scenes"))
    assert os.path.isdir(os.path.join(base_path, "data/prompts"))
    assert os.path.isdir(os.path.join(base_path, "tests"))

    # 主要なファイルの存在確認
    assert os.path.isfile(os.path.join(base_path, "main.py"))
    assert os.path.isfile(os.path.join(base_path, "setup.py"))
    assert os.path.isfile(os.path.join(base_path, "pyproject.toml"))
    assert os.path.isfile(os.path.join(base_path, "project_anima/__init__.py"))
    assert os.path.isfile(os.path.join(base_path, "project_anima/cli.py"))
