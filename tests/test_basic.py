def test_imports():
    """基本的なインポートが可能かどうかをテスト"""
    import langgraph
    import pydantic
    import yaml
    import google.generativeai
    import openai
    import pytest
    import black
    import isort
    import flake8

def test_python_version():
    """Pythonのバージョンをテスト"""
    import sys
    assert sys.version_info >= (3, 10), "Python 3.10以上が必要です" 