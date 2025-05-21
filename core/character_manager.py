"""
キャラクター設定ファイルの読み込みと管理を行うモジュール

このモジュールは、キャラクターの不変情報（immutable.yaml）と長期情報（long_term.yaml）を
読み込み、Pydanticモデルに変換して提供する機能を実装します。
"""

import os
from typing import Dict, Optional

import yaml
from pydantic import ValidationError

from .data_models import ImmutableCharacterData, LongTermCharacterData
from utils.file_handler import load_yaml, save_yaml


# カスタム例外の定義
class CharacterManagerError(Exception):
    """CharacterManagerの基底例外クラス"""

    pass


class CharacterNotFoundError(CharacterManagerError):
    """キャラクターデータが見つからない場合に発生する例外"""

    def __init__(self, character_id: str):
        super().__init__(f"Character data not found for ID: {character_id}")
        self.character_id = character_id


class InvalidCharacterDataError(CharacterManagerError):
    """キャラクターデータが不正な形式の場合に発生する例外"""

    def __init__(self, character_id: str, original_error: Exception):
        super().__init__(
            f"Invalid character data for ID: {character_id}. Original error: {original_error}"
        )
        self.character_id = character_id
        self.original_error = original_error


class CharacterManager:
    """
    キャラクター設定ファイルを管理するクラス

    指定されたキャラクターの不変情報（immutable.yaml）と長期情報（long_term.yaml）を
    読み込み、Pydanticモデルとして提供します。
    一度読み込んだデータはキャッシュされ、再度の読み込みは行われません。
    """

    def __init__(self, characters_base_path: str):
        """
        CharacterManagerを初期化する

        Args:
            characters_base_path: キャラクターデータが格納されているディレクトリのパス
        """
        self.characters_base_path = characters_base_path
        self._immutable_cache: Dict[str, ImmutableCharacterData] = {}
        self._long_term_cache: Dict[str, LongTermCharacterData] = {}

    def _get_character_dir_path(self, character_id: str) -> str:
        """
        キャラクターIDからキャラクターディレクトリのパスを取得する

        Args:
            character_id: キャラクターID

        Returns:
            キャラクターディレクトリの絶対パス
        """
        return os.path.join(self.characters_base_path, character_id)

    def load_character_data(self, character_id: str) -> None:
        """
        指定されたキャラクターの設定ファイルを読み込む

        キャラクターの不変情報（immutable.yaml）と長期情報（long_term.yaml）を
        読み込んでキャッシュに格納します。既にキャッシュに存在する場合は何もしません。

        Args:
            character_id: 読み込むキャラクターのID

        Raises:
            CharacterNotFoundError: キャラクターディレクトリやファイルが存在しない場合
            InvalidCharacterDataError: YAMLファイルの形式が不正な場合
        """
        # 既にキャッシュにある場合は何もしない
        if (
            character_id in self._immutable_cache
            and character_id in self._long_term_cache
        ):
            return

        character_dir_path = self._get_character_dir_path(character_id)
        immutable_file_path = os.path.join(character_dir_path, "immutable.yaml")
        long_term_file_path = os.path.join(character_dir_path, "long_term.yaml")

        try:
            # 不変情報の読み込み
            raw_immutable_data = load_yaml(immutable_file_path)
            immutable_data = ImmutableCharacterData(**raw_immutable_data)
            self._immutable_cache[character_id] = immutable_data

            # 長期情報の読み込み
            raw_long_term_data = load_yaml(long_term_file_path)
            long_term_data = LongTermCharacterData(**raw_long_term_data)
            self._long_term_cache[character_id] = long_term_data

        except FileNotFoundError as e:
            raise CharacterNotFoundError(character_id) from e
        except (yaml.YAMLError, ValidationError) as e:
            raise InvalidCharacterDataError(character_id, e) from e
        except Exception as e:
            # その他予期せぬエラー
            raise CharacterManagerError(
                f"Unexpected error loading character data for ID: {character_id}: {e}"
            ) from e

    def get_immutable_context(self, character_id: str) -> ImmutableCharacterData:
        """
        キャラクターの不変情報を取得する

        キャッシュに存在しない場合は、load_character_dataを呼び出して読み込みます。

        Args:
            character_id: 取得するキャラクターのID

        Returns:
            キャラクターの不変情報（ImmutableCharacterDataインスタンス）

        Raises:
            CharacterNotFoundError: キャラクターが見つからない場合
            InvalidCharacterDataError: キャラクターデータが不正な場合
        """
        if character_id not in self._immutable_cache:
            self.load_character_data(character_id)
        return self._immutable_cache[character_id]

    def get_long_term_context(self, character_id: str) -> LongTermCharacterData:
        """
        キャラクターの長期情報を取得する

        キャッシュに存在しない場合は、load_character_dataを呼び出して読み込みます。

        Args:
            character_id: 取得するキャラクターのID

        Returns:
            キャラクターの長期情報（LongTermCharacterDataインスタンス）

        Raises:
            CharacterNotFoundError: キャラクターが見つからない場合
            InvalidCharacterDataError: キャラクターデータが不正な場合
        """
        if character_id not in self._long_term_cache:
            self.load_character_data(character_id)
        return self._long_term_cache[character_id]

    def update_long_term_context(
        self, character_id: str, new_long_term_data: LongTermCharacterData
    ) -> None:
        """
        キャラクターの長期情報を更新する

        注: このメソッドの本格的な実装はタスク5.2で行われます。
        現時点では、インメモリのキャッシュだけを更新します。

        Args:
            character_id: 更新するキャラクターのID
            new_long_term_data: 新しい長期情報
        """
        # タスク5.2で本格実装予定
        self._long_term_cache[character_id] = new_long_term_data
