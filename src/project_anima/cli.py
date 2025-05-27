#!/usr/bin/env python3
"""
Project Anima - Command Line Interface

このモジュールは、Project Animaのコマンドラインインターフェースを提供します。
"""

import argparse
import os
import sys
from datetime import datetime
from .core.simulation_engine import SimulationEngine


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run Project Anima simulation")
    parser.add_argument(
        "--scene",
        type=str,
        default="data/scenes/school_rooftop.yaml",
        help="Path to scene file",
    )
    parser.add_argument(
        "--characters-dir",
        type=str,
        default="data/characters",
        help="Path to characters directory",
    )
    parser.add_argument(
        "--prompts-dir",
        type=str,
        default="data/prompts",
        help="Path to prompts directory",
    )
    parser.add_argument(
        "--max-turns",
        type=int,
        default=3,
        help="Maximum number of turns to simulate",
    )
    parser.add_argument(
        "--llm-model",
        type=str,
        default="gemini-1.5-flash-latest",
        help="LLM model to use",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode",
    )
    return parser.parse_args()


def main():
    """Main entry point for the application."""
    print("=" * 60)
    print("Project Anima - 自動実行機能は無効化されました")
    print("=" * 60)
    print()
    print("自動実行機能は完全に無効化されました。")
    print("手動制御を使用するには、以下のオプションをご利用ください：")
    print()
    print("1. インタラクティブCLI（推奨）:")
    print("   python -m project_anima.interactive_cli --scene <scene_file>")
    print()
    print("2. Web UI:")
    print("   cd web && python -m uvicorn backend.main:app --reload")
    print()
    print("3. プログラムから手動制御:")
    print("   engine.start_simulation_setup()")
    print("   while engine.execute_one_turn():")
    print("       # 1ターンずつ実行")
    print("       pass")
    print()
    print("詳細については、README.mdを参照してください。")
    print("=" * 60)

    # 引数を解析して警告を表示
    args = parse_args()
    print(f"\n注意: 指定された設定は無視されます:")
    print(f"  - Scene: {args.scene}")
    print(f"  - Max turns: {args.max_turns}")
    print(f"  - LLM model: {args.llm_model}")
    print(
        f"\n上記の設定を使用するには、インタラクティブCLIまたはWeb UIをご利用ください。"
    )

    sys.exit(0)


if __name__ == "__main__":
    main()
