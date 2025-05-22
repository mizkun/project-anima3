#!/usr/bin/env python
"""
テスト実行スクリプト

Project Animaのテストを実行するためのスクリプトです。
"""

import os
import sys
import pytest

if __name__ == "__main__":
    # ルートディレクトリを Python パスに追加
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

    # 引数に特定のテストファイルやパターンが指定されていなければ、デフォルトでtestsディレクトリ全体を実行
    args = sys.argv[1:] if len(sys.argv) > 1 else ["tests/"]

    # Pytestを実行
    sys.exit(pytest.main(args))
