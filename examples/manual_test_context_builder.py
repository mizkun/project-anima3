"""
ContextBuilderの機能を手動でテストするスクリプト

実際のキャラクターデータとシーンデータを使用して、コンテクストが正しく生成されるか確認します。
"""

import os
import sys
from core.character_manager import CharacterManager
from core.scene_manager import SceneManager
from core.context_builder import ContextBuilder
from core.data_models import TurnData


def main():
    # 現在のディレクトリを取得
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # CharacterManagerの初期化
    characters_dir = os.path.join(current_dir, "characters")
    character_manager = CharacterManager(characters_dir)

    # 利用可能なキャラクターを表示
    available_characters = [
        d
        for d in os.listdir(characters_dir)
        if os.path.isdir(os.path.join(characters_dir, d))
    ]
    print(f"利用可能なキャラクター: {available_characters}")

    if not available_characters:
        print(
            "エラー: キャラクターデータが見つかりません。サンプルキャラクターを作成してください。"
        )
        return

    # 最初のキャラクターを使用
    character_id = available_characters[0]
    print(f"使用するキャラクター: {character_id}")

    # シーンファイルのパスを指定
    scenes_dir = os.path.join(current_dir, "scenes")
    available_scenes = [
        f for f in os.listdir(scenes_dir) if f.endswith(".yaml") or f.endswith(".yml")
    ]
    print(f"利用可能なシーン: {available_scenes}")

    if not available_scenes:
        print(
            "エラー: シーンデータが見つかりません。サンプルシーンを作成してください。"
        )
        return

    # 最初のシーンを使用
    scene_file_path = os.path.join(scenes_dir, available_scenes[0])
    print(f"使用するシーン: {scene_file_path}")

    # SceneManagerの初期化と場面の読み込み
    scene_manager = SceneManager()
    try:
        scene_manager.load_scene_from_file(scene_file_path)
        print(f"シーン読み込み成功: {scene_manager.get_current_scene_info().scene_id}")
    except Exception as e:
        print(f"シーン読み込みエラー: {e}")
        return

    # ContextBuilderの初期化
    context_builder = ContextBuilder(character_manager, scene_manager)

    # ダミーの短期ログを作成
    short_term_log = [
        TurnData(
            turn_number=1,
            character_id="another_character",
            character_name="別のキャラクター",
            think="何か考えていることのサンプル",
            act="何か行動のサンプル",
            talk="こんにちは、調子はどう？",
        ),
    ]

    # コンテクストを構築
    try:
        context_dict = context_builder.build_context_for_character(
            character_id, short_term_log, "これは前の場面のサマリーのサンプルです。"
        )

        print("\n" + "=" * 80)
        print("生成されたコンテクスト（辞書形式）:")
        print("=" * 80)

        # 辞書のキーを一覧表示
        print("利用可能なコンテクストキー:", list(context_dict.keys()))
        print()

        # 各コンテクスト要素を表示
        for key, value in context_dict.items():
            if key != "full_context":  # full_contextは後で表示
                print(f"===== {key} =====")
                print(value)
                print()

        # 最後に統合されたコンテクスト全体を表示
        print("=" * 80)
        print("統合された完全なコンテクスト:")
        print("=" * 80)
        print(context_dict["full_context"])
        print("=" * 80)

    except Exception as e:
        print(f"コンテクスト構築エラー: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
