"""
インタラクティブコマンドラインインターフェース

このモジュールは、Project Animaのインタラクティブコマンドラインインターフェースを提供します。
ユーザーはターンの進行を制御したり、シミュレーションに介入したりすることができます。
"""

import argparse
import os
import sys
import cmd
import shlex
from datetime import datetime
from typing import List, Optional, Dict, Any

from project_anima.core.simulation_engine import SimulationEngine, SceneNotLoadedError


class ProjectAnimaShell(cmd.Cmd):
    """
    Project Animaのインタラクティブシェル

    ユーザーがコマンドを入力してシミュレーションを制御できるインターフェースを提供します。
    """

    intro = """
    Project Anima インタラクティブシェルへようこそ。
    シミュレーションの制御やキャラクターの介入を行うことができます。
    利用可能なコマンドを確認するには、'help'または'?'と入力してください。
    """
    prompt = "Project Anima> "

    def __init__(self, engine: SimulationEngine):
        """
        ProjectAnimaShellを初期化する

        Args:
            engine: 使用するSimulationEngineのインスタンス
        """
        super().__init__()
        self.engine = engine
        self.simulation_running = False

    def do_start(self, arg):
        """
        シミュレーションを開始する

        使用法: start
        """
        if self.simulation_running:
            print("シミュレーションは既に実行中です。")
            return

        try:
            if self.engine.start_simulation_setup():
                self.simulation_running = True
                print("シミュレーションを開始しました。")
                self.show_status()
            else:
                print("シミュレーションの開始に失敗しました。")
        except Exception as e:
            print(f"エラー: {str(e)}")

    def do_next(self, arg):
        """
        次のターンを実行する

        使用法: next
        または短縮形: n
        """
        if not self.simulation_running:
            print(
                "シミュレーションが開始されていません。'start'コマンドで開始してください。"
            )
            return

        try:
            if self.engine.execute_one_turn():
                print("-" * 40)
                turn_data = self.engine._current_scene_log.turns[-1]
                print(f"ターン {turn_data.turn_number}: {turn_data.character_name}")
                print(f"  思考: {turn_data.think}")
                if turn_data.act:
                    print(f"  行動: {turn_data.act}")
                if turn_data.talk:
                    print(f"  発言: 「{turn_data.talk}」")
                print("-" * 40)
            else:
                print("シミュレーションが終了しました。")
                self.simulation_running = False
        except SceneNotLoadedError:
            print(
                "シミュレーションが開始されていません。'start'コマンドで開始してください。"
            )
        except Exception as e:
            print(f"エラー: {str(e)}")

    def do_status(self, arg):
        """
        現在のシミュレーション状態を表示する

        使用法: status
        または短縮形: s
        """
        if not self.simulation_running:
            print("シミュレーションが開始されていません。")
            return

        self.show_status()

    def show_status(self):
        """シミュレーションの現在の状態を表示する"""
        try:
            status = self.engine.get_simulation_status()
            if not status.get("is_running", False):
                print(status.get("error", "シミュレーションが実行されていません。"))
                return

            print("-" * 40)
            print(f"場面ID: {status['scene_id']}")
            print(f"場所: {status.get('location', '不明')}")
            print(f"時間: {status.get('time', '不明')}")
            print(f"状況: {status['situation']}")
            print(f"参加キャラクター: {', '.join(status['participants'])}")
            print(f"完了したターン数: {status['turns_completed']}")

            if "next_character" in status:
                print(
                    f"次のターン: {status['next_character']['name']} ({status['next_character']['id']})"
                )

            print("-" * 40)
        except Exception as e:
            print(f"ステータス表示エラー: {str(e)}")

    def do_intervene(self, arg):
        """
        シミュレーションに介入する

        使用法: intervene <介入タイプ> [追加パラメータ...]
        または短縮形: i <介入タイプ> [追加パラメータ...]

        介入タイプ:
          - update_situation <新しい状況説明文> - 場面の状況を更新する
          - give_revelation <キャラID> <天啓内容> - キャラクターに天啓を付与する
          - add_character <キャラID> - キャラクターを場面に追加する
          - remove_character <キャラID> - キャラクターを場面から削除する
          - end_scene - 場面を終了する

        例:
          - intervene update_situation 突然、雷が鳴り響いた。
          - intervene give_revelation char_001 友人が嘘をついていることに気づいた。
        """
        if not self.simulation_running:
            print(
                "シミュレーションが開始されていません。'start'コマンドで開始してください。"
            )
            return

        if not arg:
            print(
                "介入タイプを指定してください。詳細は 'help intervene' を参照してください。"
            )
            return

        try:
            success, message = self.engine.process_intervention_command(arg)
            if success:
                print(f"介入成功: {message}")
            else:
                print(f"介入失敗: {message}")
        except Exception as e:
            print(f"介入処理エラー: {str(e)}")

    def do_quit(self, arg):
        """
        シミュレーションを終了してシェルを閉じる

        使用法: quit
        または短縮形: q
        """
        if self.simulation_running:
            print("シミュレーションを終了しています...")
            self.engine.end_simulation()

        print("Project Animaを終了します。お疲れ様でした！")
        return True

    def do_help_interventions(self, arg):
        """
        利用可能な介入タイプの詳細を表示する

        使用法: help_interventions
        """
        print(
            """
利用可能な介入タイプ:

1. 場面状況の更新 (update_situation または update)
   - 形式: intervene update_situation <新しい状況説明文>
   - 例: intervene update_situation 突然、大きな音がした。全員が振り向いた。

2. キャラクターへの天啓付与 (give_revelation または revelation)
   - 形式: intervene give_revelation <キャラID> <天啓内容>
   - 例: intervene give_revelation char_001 あなたは相手が嘘をついていることに気づいた。

3. キャラクターの追加 (add_character または add)
   - 形式: intervene add_character <キャラID>
   - 例: intervene add_character char_002

4. キャラクターの削除 (remove_character または remove)
   - 形式: intervene remove_character <キャラID>
   - 例: intervene remove_character char_001

5. 場面の終了 (end_scene または end)
   - 形式: intervene end_scene
        """
        )

    # コマンドのエイリアス設定
    do_n = do_next
    do_s = do_status
    do_i = do_intervene
    do_q = do_quit


def parse_args():
    """コマンドライン引数をパースする"""
    parser = argparse.ArgumentParser(
        description="Run Project Anima simulation in interactive mode"
    )
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
    """インタラクティブCLIのメイン関数"""
    args = parse_args()

    # Check if scene file exists
    if not os.path.exists(args.scene):
        print(f"Error: Scene file '{args.scene}' not found.")
        sys.exit(1)

    # Create logs directory if it doesn't exist
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_dir = f"logs/sim_{timestamp}"
    os.makedirs(log_dir, exist_ok=True)

    print(f"\nProject Anima インタラクティブモード")
    print(f"場面ファイル: {args.scene}")
    print(f"使用LLMモデル: {args.llm_model}")
    print(f"ログ保存先: {log_dir}\n")

    # Initialize simulation engine
    engine = SimulationEngine(
        scene_file_path=args.scene,
        characters_dir=args.characters_dir,
        prompts_dir=args.prompts_dir,
        log_dir=log_dir,
        llm_model=args.llm_model,
        debug=args.debug,
    )

    # Start the interactive shell
    shell = ProjectAnimaShell(engine)

    try:
        shell.cmdloop()
    except KeyboardInterrupt:
        print("\nシミュレーションを中断しました。")
    finally:
        if shell.simulation_running:
            engine.end_simulation()


if __name__ == "__main__":
    main()
