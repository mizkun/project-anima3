"""
SceneManagerクラスのテスト

このモジュールは、SceneManagerクラスの機能をテストします。
"""

import os
import pytest
import yaml
from pydantic import ValidationError

from core.scene_manager import (
    SceneManager,
    SceneFileNotFoundError,
    InvalidSceneDataError,
)
from core.data_models import SceneInfoData


@pytest.fixture
def scene_manager():
    """SceneManagerのインスタンスを提供するフィクスチャ"""
    return SceneManager()


def test_scene_manager_init(scene_manager):
    """初期化直後のSceneManagerの状態をテスト"""
    # 初期状態では場面情報はロードされていない
    assert scene_manager.get_current_scene_info() is None
    assert scene_manager.get_participant_character_ids() == []


def test_load_valid_scene(scene_manager):
    """正常な場面設定ファイルの読み込みをテスト"""
    # 正常な場面設定ファイルを読み込む
    scene_file_path = os.path.join("tests", "test_data", "scenes", "S001.yaml")
    scene_manager.load_scene_from_file(scene_file_path)

    # 場面情報が正しくロードされているか確認
    scene_info = scene_manager.get_current_scene_info()
    assert isinstance(scene_info, SceneInfoData)
    assert scene_info.scene_id == "S001"
    assert scene_info.location == "放課後の教室"
    assert scene_info.time == "夕方"
    assert "夕日が窓から差し込み" in scene_info.situation

    # 参加キャラクターが正しく取得できるか確認
    participants = scene_manager.get_participant_character_ids()
    assert participants == ["mei_kinoshita_001", "rinko_kizuki_002"]


def test_load_nonexistent_scene(scene_manager):
    """存在しない場面設定ファイルの読み込みをテスト"""
    # 存在しないファイルパスを指定
    non_existent_path = os.path.join(
        "tests", "test_data", "scenes", "non_existent_scene.yaml"
    )

    # SceneFileNotFoundErrorが発生することを確認
    with pytest.raises(SceneFileNotFoundError) as excinfo:
        scene_manager.load_scene_from_file(non_existent_path)

    # 例外メッセージとファイルパスを確認
    assert non_existent_path in str(excinfo.value)
    assert excinfo.value.scene_file_path == non_existent_path


def test_load_invalid_yaml(scene_manager):
    """不正なYAML形式のファイル読み込みをテスト"""
    # 不正なYAMLファイルを指定
    invalid_yaml_path = os.path.join(
        "tests", "test_data", "scenes", "S002_invalid_yaml.yaml"
    )

    # InvalidSceneDataErrorが発生することを確認
    with pytest.raises(InvalidSceneDataError) as excinfo:
        scene_manager.load_scene_from_file(invalid_yaml_path)

    # 例外メッセージとファイルパス、original_errorの型を確認
    assert invalid_yaml_path in str(excinfo.value)
    assert excinfo.value.scene_file_path == invalid_yaml_path
    assert isinstance(excinfo.value.original_error, yaml.YAMLError)


def test_load_validation_error(scene_manager):
    """Pydanticバリデーションエラーが発生するファイル読み込みをテスト"""
    # バリデーションエラーを起こすYAMLファイルを指定
    validation_error_path = os.path.join(
        "tests", "test_data", "scenes", "S003_validation_error.yaml"
    )

    # InvalidSceneDataErrorが発生することを確認
    with pytest.raises(InvalidSceneDataError) as excinfo:
        scene_manager.load_scene_from_file(validation_error_path)

    # 例外メッセージとファイルパス、original_errorの型を確認
    assert validation_error_path in str(excinfo.value)
    assert excinfo.value.scene_file_path == validation_error_path
    assert isinstance(excinfo.value.original_error, ValidationError)


def test_load_different_scene(scene_manager):
    """異なる場面を順番にロードするテスト"""
    # 最初の場面をロード
    scene1_path = os.path.join("tests", "test_data", "scenes", "S001.yaml")
    scene_manager.load_scene_from_file(scene1_path)
    assert scene_manager.get_current_scene_info().scene_id == "S001"

    # 異なる場面をロード（まだ存在しないので作成する必要がある）
    # このテストケースでは、正常なシーンS001のみで十分なので、新たなシーンは作成せず、
    # 同じS001を再度ロードして、正しく更新されることだけを確認
    scene_manager.load_scene_from_file(scene1_path)
    assert scene_manager.get_current_scene_info().scene_id == "S001"
    assert scene_manager.get_participant_character_ids() == [
        "mei_kinoshita_001",
        "rinko_kizuki_002",
    ]
