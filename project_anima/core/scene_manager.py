"""
場面設定ファイルの読み込みと管理を行うモジュール

このモジュールは、Project Animaで使用される場面設定ファイルの読み込みと
管理を行うSceneManagerクラスを提供します。
"""

import logging
from typing import List, Optional
import yaml
from pydantic import ValidationError

from .data_models import SceneInfoData
from utils.file_handler import load_yaml

# ロガーの設定
logger = logging.getLogger(__name__)


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
        現在の場面の状況説明を更新します。

        Args:
            new_situation_description: 新しい状況説明

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
        """
        if self._current_scene is None:
            error_msg = "場面がロードされていないため、状況説明を更新できません。"
            logger.error(error_msg)
            raise SceneNotLoadedError()

        # 変更前の状況説明を記録（ログ用）
        old_situation = self._current_scene.situation

        # 状況説明を更新
        self._current_scene.situation = new_situation_description

        logger.info(
            f"場面の状況説明を更新しました。\n  変更前: {old_situation}\n  変更後: {new_situation_description}"
        )

    def add_character_to_scene(self, character_id: str) -> None:
        """
        現在の場面に新しいキャラクターを追加します。

        Args:
            character_id: 追加するキャラクターのID

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
        """
        if self._current_scene is None:
            error_msg = "場面がロードされていないため、キャラクターを追加できません。"
            logger.error(error_msg)
            raise SceneNotLoadedError()

        # キャラクターが既に参加しているかチェック
        if character_id in self._current_scene.participant_character_ids:
            logger.warning(
                f"キャラクター '{character_id}' は既に場面に参加しています。追加操作は無視されます。"
            )
            return

        # キャラクターを参加者リストに追加
        self._current_scene.participant_character_ids.append(character_id)

        logger.info(
            f"キャラクター '{character_id}' を場面に追加しました。"
            f"現在の参加者: {self._current_scene.participant_character_ids}"
        )

    def remove_character_from_scene(self, character_id: str) -> None:
        """
        現在の場面から指定されたキャラクターを削除します。

        Args:
            character_id: 削除するキャラクターのID

        Raises:
            SceneNotLoadedError: 場面がロードされていない場合
            ValueError: 指定されたキャラクターが場面に存在しない場合
        """
        if self._current_scene is None:
            error_msg = "場面がロードされていないため、キャラクターを削除できません。"
            logger.error(error_msg)
            raise SceneNotLoadedError()

        # キャラクターが参加しているかチェック
        if character_id not in self._current_scene.participant_character_ids:
            error_msg = f"キャラクター '{character_id}' は場面に参加していないため、削除できません。"
            logger.error(error_msg)
            raise ValueError(error_msg)

        # キャラクターを参加者リストから削除
        self._current_scene.participant_character_ids.remove(character_id)

        logger.info(
            f"キャラクター '{character_id}' を場面から削除しました。"
            f"現在の参加者: {self._current_scene.participant_character_ids}"
        )
