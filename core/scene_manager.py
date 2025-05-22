"""
場面設定ファイルの読み込みと管理を行うモジュール

このモジュールは、Project Animaで使用される場面設定ファイルの読み込みと
管理を行うSceneManagerクラスを提供します。
"""

from typing import List, Optional
import yaml
from pydantic import ValidationError

from .data_models import SceneInfoData
from utils.file_handler import load_yaml


class SceneManagerError(Exception):
    """SceneManager関連の基本例外クラス"""

    pass


class SceneFileNotFoundError(SceneManagerError):
    """場面設定ファイルが見つからない場合に発生する例外"""

    def __init__(self, scene_file_path: str):
        super().__init__(f"Scene file not found: {scene_file_path}")
        self.scene_file_path = scene_file_path


class InvalidSceneDataError(SceneManagerError):
    """場面設定データが不正または解析できない場合に発生する例外"""

    def __init__(self, scene_file_path: str, original_error: Exception):
        super().__init__(
            f"Invalid scene data in file: {scene_file_path}. Original error: {original_error}"
        )
        self.scene_file_path = scene_file_path
        self.original_error = original_error


class SceneNotLoadedError(SceneManagerError):
    """場面がロードされていない状態で操作が実行された場合に発生する例外"""

    def __init__(self):
        super().__init__("No scene is currently loaded. Please load a scene first.")


class SceneManager:
    """
    場面設定ファイルの読み込みと管理を行うクラス

    このクラスは、YAMLファイルから場面情報を読み込み、管理します。
    シミュレーションエンジンから場面情報にアクセスするためのインターフェースを提供します。
    """

    def __init__(self):
        """
        SceneManagerを初期化します。

        初期状態では場面情報はロードされておらず、self._current_sceneはNoneです。
        """
        self._current_scene: Optional[SceneInfoData] = None

    def load_scene_from_file(self, scene_file_path: str) -> None:
        """
        指定されたファイルパスから場面設定を読み込みます。

        Args:
            scene_file_path: 読み込む場面設定ファイルのパス

        Raises:
            SceneFileNotFoundError: 指定されたファイルが存在しない場合
            InvalidSceneDataError: YAMLの形式が不正またはSceneInfoDataの要件を満たさない場合
        """
        try:
            # YAMLファイルを読み込む
            raw_scene_data = load_yaml(scene_file_path)

            # SceneInfoDataモデルに変換
            scene_data = SceneInfoData(**raw_scene_data)

            # 現在の場面情報として保存
            self._current_scene = scene_data

        except FileNotFoundError as e:
            # ファイルが見つからない場合
            raise SceneFileNotFoundError(scene_file_path) from e

        except (yaml.YAMLError, ValidationError) as e:
            # YAMLの形式が不正またはSceneInfoDataの要件を満たさない場合
            raise InvalidSceneDataError(scene_file_path, e) from e

        except Exception as e:
            # その他の予期せぬエラー
            raise SceneManagerError(f"Unexpected error loading scene file: {e}") from e

    def get_current_scene_info(self) -> Optional[SceneInfoData]:
        """
        現在ロードされている場面情報を返します。

        Returns:
            現在の場面情報。場面がロードされていない場合はNone。
        """
        return self._current_scene

    def get_participant_character_ids(self) -> List[str]:
        """
        現在の場面に参加しているキャラクターIDのリストを返します。

        Returns:
            参加キャラクターIDのリスト。場面がロードされていない場合は空リスト。
        """
        if self._current_scene is None:
            return []
        return self._current_scene.participant_character_ids

    def update_scene_situation(self, new_situation_description: str) -> None:
        """
        現在の場面の状況説明を更新します。(将来の実装用)

        Args:
            new_situation_description: 新しい状況説明

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
        """
        # タスク5.3で本格実装予定
        pass

    def add_character_to_scene(self, character_id: str) -> None:
        """
        現在の場面に新しいキャラクターを追加します。(将来の実装用)

        Args:
            character_id: 追加するキャラクターのID

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
        """
        # タスク5.3で本格実装予定
        pass

    def remove_character_from_scene(self, character_id: str) -> None:
        """
        現在の場面から指定されたキャラクターを削除します。(将来の実装用)

        Args:
            character_id: 削除するキャラクターのID

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
            ValueError: 指定されたキャラクターが場面に存在しない場合
        """
        # タスク5.3で本格実装予定
        pass
