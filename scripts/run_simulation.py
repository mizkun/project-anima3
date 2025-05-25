#!/usr/bin/env python3
"""
Project Anima - Main entry point
"""

import sys
import os

# プロジェクトルートをPythonパスに追加
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.project_anima.cli import main

if __name__ == "__main__":
    main()
