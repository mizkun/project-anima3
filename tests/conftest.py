"""
pytest設定ファイル: プロジェクトルートをPythonパスに追加するなどの設定を行う
"""

import os
import sys
from pathlib import Path

# プロジェクトルートディレクトリをPythonパスに追加
# これによりどのテストファイルからでも'core'などのモジュールを直接インポートできるようになる
project_root = str(Path(__file__).parent.parent.absolute())
if project_root not in sys.path:
    sys.path.insert(0, project_root)
    print(f"Added project root to PYTHONPATH: {project_root}")
