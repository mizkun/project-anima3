"""
ContextBuilderクラスのユニットテスト

このモジュールは、core/context_builder.pyのContextBuilderクラスをテストします。
"""

import os
import pytest
from unittest.mock import MagicMock, patch

from core.context_builder import ContextBuilder
from core.data_models import (
    ImmutableCharacterData,
    LongTermCharacterData,
    SceneInfoData,
    TurnData,
    ExperienceData,
    GoalData,
    MemoryData,
)


@pytest.fixture
def mock_character_manager():
    """CharacterManagerのモックを作成するフィクスチャ"""
    mock = MagicMock()

    # サンプルの不変情報
    immutable_data = ImmutableCharacterData(
        character_id="test_char_1",
        name="テスト太郎",
        age=25,
        occupation="学生",
        base_personality="明るく社交的、好奇心旺盛",
    )

    # サンプルの長期情報
    long_term_data = LongTermCharacterData(
        character_id="test_char_1",
        experiences=[
            ExperienceData(event="大学入学", importance=8),
            ExperienceData(event="海外旅行", importance=7),
        ],
        goals=[
            GoalData(goal="卒業論文を完成させる", importance=9),
            GoalData(goal="友人との関係を深める", importance=6),
        ],
        memories=[
            MemoryData(
                memory="友人と喫茶店で会話",
                scene_id_of_memory="scene_001",
                related_character_ids=["test_char_2"],
            )
        ],
    )

    # モックメソッドの戻り値を設定
    mock.get_immutable_context.return_value = immutable_data
    mock.get_long_term_context.return_value = long_term_data

    return mock


@pytest.fixture
def mock_scene_manager():
    """SceneManagerのモックを作成するフィクスチャ"""
    mock = MagicMock()

    # サンプルの場面情報
    scene_data = SceneInfoData(
        scene_id="test_scene_001",
        location="大学の教室",
        time="午後3時",
        situation="授業終了後、空いている教室で友人と会話している。",
        participant_character_ids=["test_char_1", "test_char_2"],
    )

    # モックメソッドの戻り値を設定
    mock.get_current_scene_info.return_value = scene_data

    return mock


@pytest.fixture
def sample_turn_data():
    """サンプルの短期ログ（ターンデータ）を作成するフィクスチャ"""
    return [
        TurnData(
            turn_number=1,
            character_id="test_char_2",
            character_name="テスト花子",
            think="テスト太郎に今日の予定を聞いてみよう",
            act="テスト太郎の方を向いて微笑む",
            talk="今日この後、予定ある？",
        ),
    ]


def test_context_builder_initialization(mock_character_manager, mock_scene_manager):
    """ContextBuilderの初期化をテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    assert context_builder.character_manager == mock_character_manager
    assert context_builder.scene_manager == mock_scene_manager


def test_format_immutable_context(mock_character_manager, mock_scene_manager):
    """_format_immutable_contextメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)
    immutable_data = mock_character_manager.get_immutable_context("test_char_1")

    formatted_context = context_builder._format_immutable_context(immutable_data)

    assert "【キャラクター基本情報】" in formatted_context
    assert "名前: テスト太郎" in formatted_context
    assert "年齢: 25" in formatted_context
    assert "職業: 学生" in formatted_context
    assert "性格: 明るく社交的、好奇心旺盛" in formatted_context


def test_format_long_term_context(mock_character_manager, mock_scene_manager):
    """_format_long_term_contextメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)
    long_term_data = mock_character_manager.get_long_term_context("test_char_1")

    formatted_context = context_builder._format_long_term_context(long_term_data)

    assert "【経験と記憶】" in formatted_context
    assert "- 経験:" in formatted_context
    assert "大学入学" in formatted_context
    assert "- 目標:" in formatted_context
    assert "卒業論文を完成させる" in formatted_context
    assert "- 記憶:" in formatted_context
    assert "友人と喫茶店で会話" in formatted_context


def test_format_scene_context(mock_character_manager, mock_scene_manager):
    """_format_scene_contextメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)
    scene_data = mock_scene_manager.get_current_scene_info()

    formatted_context = context_builder._format_scene_context(scene_data)

    assert "【現在の場面情報】" in formatted_context
    assert "場所: 大学の教室" in formatted_context
    assert "時間: 午後3時" in formatted_context
    assert "状況: 授業終了後、空いている教室で友人と会話している。" in formatted_context
    assert "参加者:" in formatted_context
    assert "テスト太郎" in formatted_context  # CharacterManagerから名前を取得


def test_format_short_term_context(
    mock_character_manager, mock_scene_manager, sample_turn_data
):
    """_format_short_term_contextメソッドをテスト"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    formatted_context = context_builder._format_short_term_context(sample_turn_data)

    assert "【会話履歴】" in formatted_context
    assert "ターン1: テスト花子" in formatted_context
    assert "思考: テスト太郎に今日の予定を聞いてみよう" in formatted_context
    assert "行動: テスト太郎の方を向いて微笑む" in formatted_context
    assert "発言: 今日この後、予定ある？" in formatted_context

    # 空のターンデータの場合のテスト
    formatted_empty_context = context_builder._format_short_term_context([])
    assert "まだ会話は始まっていません" in formatted_empty_context


def test_build_context_for_character(
    mock_character_manager, mock_scene_manager, sample_turn_data
):
    """build_context_for_characterメソッドをテスト（辞書型の返り値を確認）"""
    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    context_dict = context_builder.build_context_for_character(
        "test_char_1", sample_turn_data, "前の場面では友人たちと昼食をとった。"
    )

    # 返り値が辞書型であることを確認
    assert isinstance(context_dict, dict)

    # 必要なキーが全て含まれていることを確認
    expected_keys = [
        "immutable_context",
        "long_term_context",
        "scene_context",
        "short_term_context",
        "previous_scene_context",
        "full_context",
    ]
    for key in expected_keys:
        assert key in context_dict

    # 各コンテクストの内容を確認
    assert "【キャラクター基本情報】" in context_dict["immutable_context"]
    assert "【経験と記憶】" in context_dict["long_term_context"]
    assert "【現在の場面情報】" in context_dict["scene_context"]
    assert "【前の場面のサマリー】" in context_dict["previous_scene_context"]
    assert "【会話履歴】" in context_dict["short_term_context"]

    # full_contextに全ての情報が含まれていることを確認
    full_context = context_dict["full_context"]
    assert "【キャラクター基本情報】" in full_context
    assert "【経験と記憶】" in full_context
    assert "【現在の場面情報】" in full_context
    assert "【前の場面のサマリー】" in full_context
    assert "前の場面では友人たちと昼食をとった。" in full_context
    assert "【会話履歴】" in full_context

    # 前の場面のサマリーがない場合
    context_dict_without_summary = context_builder.build_context_for_character(
        "test_char_1", sample_turn_data
    )

    # previous_scene_contextキーがないことを確認
    assert "previous_scene_context" not in context_dict_without_summary
    # full_contextに前の場面のサマリーが含まれていないことを確認
    assert "【前の場面のサマリー】" not in context_dict_without_summary["full_context"]


def test_build_context_with_no_scene_loaded(mock_character_manager, sample_turn_data):
    """シーンがロードされていない状態でのbuild_context_for_characterテスト"""
    # SceneManagerのモックを作成し、get_current_scene_infoがNoneを返すように設定
    mock_scene_manager = MagicMock()
    mock_scene_manager.get_current_scene_info.return_value = None

    context_builder = ContextBuilder(mock_character_manager, mock_scene_manager)

    # シーンがロードされていない場合は例外がスローされるはず
    with pytest.raises(ValueError, match="No scene is currently loaded."):
        context_builder.build_context_for_character("test_char_1", sample_turn_data)
