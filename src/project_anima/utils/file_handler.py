"""
YAMLおよびJSONファイルの読み書きを行うユーティリティ関数

このモジュールは、Project Animaで使用されるYAMLファイルおよびJSONファイルの
読み込み・書き込みを行うユーティリティ関数を提供します。
"""

import json
import os
from typing import Any, Optional

import yaml


def load_yaml(file_path: str) -> Any:
    """
    YAMLファイルを読み込みPythonオブジェクトに変換する

    Args:
        file_path: 読み込むYAMLファイルのパス

    Returns:
        読み込んだデータ（通常は辞書またはリスト）

    Raises:
        FileNotFoundError: 指定されたファイルが存在しない場合
        PermissionError: ファイルへのアクセス権限がない場合
        yaml.YAMLError: YAMLのパースに失敗した場合
    """
    with open(file_path, "r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def save_yaml(data: Any, file_path: str) -> None:
    """
    PythonオブジェクトをYAMLファイルとして保存する

    Args:
        data: 保存するPythonオブジェクト（辞書やリストなど）
        file_path: 保存先のファイルパス

    Raises:
        PermissionError: ファイルへの書き込み権限がない場合
        OSError: その他のファイル書き込みエラー
    """
    # 必要に応じてディレクトリを作成
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as file:
        yaml.dump(data, file, allow_unicode=True, sort_keys=False)


def load_json(file_path: str) -> Any:
    """
    JSONファイルを読み込みPythonオブジェクトに変換する

    Args:
        file_path: 読み込むJSONファイルのパス

    Returns:
        読み込んだデータ（通常は辞書またはリスト）

    Raises:
        FileNotFoundError: 指定されたファイルが存在しない場合
        PermissionError: ファイルへのアクセス権限がない場合
        json.JSONDecodeError: JSONのパースに失敗した場合
    """
    with open(file_path, "r", encoding="utf-8") as file:
        return json.load(file)


def save_json(data: Any, file_path: str, indent: Optional[int] = 4) -> None:
    """
    PythonオブジェクトをJSONファイルとして保存する

    Args:
        data: 保存するPythonオブジェクト（辞書やリストなど）
        file_path: 保存先のファイルパス
        indent: JSONの整形時のインデント幅（デフォルト: 4）

    Raises:
        PermissionError: ファイルへの書き込み権限がない場合
        TypeError: JSONに変換できないオブジェクトが含まれる場合
        OSError: その他のファイル書き込みエラー
    """
    # 必要に応じてディレクトリを作成
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=indent)
