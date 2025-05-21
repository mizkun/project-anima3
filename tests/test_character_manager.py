"""
CharacterManagerのユニットテスト

CharacterManagerクラスの各機能が正しく動作することを確認するテスト
"""

import os
import pytest
from pydantic import ValidationError
import yaml

from core.character_manager import (
    CharacterManager,
    CharacterNotFoundError,
    InvalidCharacterDataError,
)
from core.data_models import ImmutableCharacterData, LongTermCharacterData, GoalData


# フィクスチャ: テスト用CharacterManagerのインスタンス
@pytest.fixture
def character_manager():
    """テスト用のCharacterManagerインスタンスを作成"""
    base_path = os.path.join(os.path.dirname(__file__), "test_data", "characters")
    return CharacterManager(base_path)


# 正常系テスト
def test_load_existing_character_data(character_manager):
    """存在するキャラクターのデータが正しく読み込めることを確認"""
    # 明示的にデータをロード
    character_manager.load_character_data("char_001")
    
    # キャッシュにデータが正しく格納されていることを確認
    assert "char_001" in character_manager._immutable_cache
    assert "char_001" in character_manager._long_term_cache
    
    # データ内容が正しいことを確認
    immutable_data = character_manager._immutable_cache["char_001"]
    assert immutable_data.character_id == "char_001"
    assert immutable_data.name == "テストキャラクター"
    assert immutable_data.age == 25
    
    long_term_data = character_manager._long_term_cache["char_001"]
    assert long_term_data.character_id == "char_001"
    assert len(long_term_data.experiences) == 2
    assert len(long_term_data.goals) == 2
    assert len(long_term_data.memories) == 1


def test_get_immutable_context(character_manager):
    """get_immutable_contextメソッドが正しく動作することを確認"""
    # getメソッド経由でデータを取得
    immutable_data = character_manager.get_immutable_context("char_001")
    
    # 返されたデータが正しい型で正しい内容であることを確認
    assert isinstance(immutable_data, ImmutableCharacterData)
    assert immutable_data.character_id == "char_001"
    assert immutable_data.name == "テストキャラクター"
    assert immutable_data.occupation == "テスト要員"


def test_get_long_term_context(character_manager):
    """get_long_term_contextメソッドが正しく動作することを確認"""
    # getメソッド経由でデータを取得
    long_term_data = character_manager.get_long_term_context("char_001")
    
    # 返されたデータが正しい型で正しい内容であることを確認
    assert isinstance(long_term_data, LongTermCharacterData)
    assert long_term_data.character_id == "char_001"
    assert len(long_term_data.experiences) == 2
    assert long_term_data.goals[0].goal == "すべてのテストを成功させること"
    assert long_term_data.goals[0].importance == 10


def test_caching_behavior(character_manager, monkeypatch):
    """キャッシュ機能が正しく動作することを確認"""
    # まずデータをロード
    character_manager.get_immutable_context("char_001")
    
    # load_yaml関数をモックして、再度呼ばれた場合に例外を発生させる
    def mock_load_yaml(file_path):
        raise AssertionError("キャッシュが効いていれば、この関数は呼ばれないはず")
    
    # load_yaml関数をモックに置き換え
    monkeypatch.setattr("core.character_manager.load_yaml", mock_load_yaml)
    
    # 2回目の呼び出しでも例外が発生しないことを確認（キャッシュから読み込まれる）
    immutable_data = character_manager.get_immutable_context("char_001")
    assert immutable_data.character_id == "char_001"


# 異常系テスト
def test_nonexistent_character(character_manager):
    """存在しないキャラクターIDを指定した場合にCharacterNotFoundErrorが発生することを確認"""
    with pytest.raises(CharacterNotFoundError) as excinfo:
        character_manager.load_character_data("non_existent_char")
    
    assert "non_existent_char" in str(excinfo.value)
    assert excinfo.value.character_id == "non_existent_char"


def test_invalid_yaml_format(character_manager):
    """不正なYAML形式のファイルに対してInvalidCharacterDataErrorが発生することを確認"""
    with pytest.raises(InvalidCharacterDataError) as excinfo:
        character_manager.load_character_data("char_002_invalid_yaml")
    
    assert "char_002_invalid_yaml" in str(excinfo.value)
    assert isinstance(excinfo.value.original_error, yaml.YAMLError)


def test_validation_error(character_manager):
    """Pydanticバリデーションエラーに対してInvalidCharacterDataErrorが発生することを確認"""
    with pytest.raises(InvalidCharacterDataError) as excinfo:
        character_manager.load_character_data("char_003_validation_error")
    
    assert "char_003_validation_error" in str(excinfo.value)
    assert isinstance(excinfo.value.original_error, ValidationError)


def test_update_long_term_context(character_manager):
    """update_long_term_contextメソッドの基本動作を確認"""
    # まず既存のデータをロード
    original_data = character_manager.get_long_term_context("char_001")
    
    # 新しいデータを作成（既存のデータを複製して一部変更）
    new_data = LongTermCharacterData(**original_data.model_dump())
    new_goal = GoalData(goal="新しいテスト手法を開発すること", importance=7)
    new_data.goals.append(new_goal)
    
    # 長期情報を更新
    character_manager.update_long_term_context("char_001", new_data)
    
    # 更新されたデータを取得して確認
    updated_data = character_manager.get_long_term_context("char_001")
    assert len(updated_data.goals) == len(original_data.goals) + 1
    assert updated_data.goals[-1].goal == "新しいテスト手法を開発すること"
    assert updated_data.goals[-1].importance == 7 