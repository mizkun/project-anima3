#!/usr/bin/env python3
"""
Project Anima Web UI - サーバー起動スクリプト

FastAPIサーバーを起動するためのスクリプト
"""
import sys
import os
from pathlib import Path

# プロジェクトルートをPythonパスに追加
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import uvicorn
from web.backend.main import app

if __name__ == "__main__":
    print("Project Anima Web UI APIサーバーを起動しています...")
    print("サーバーURL: http://localhost:8000")
    print("API ドキュメント: http://localhost:8000/docs")
    print("停止するには Ctrl+C を押してください")

    uvicorn.run(
        "web.backend.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info"
    )
