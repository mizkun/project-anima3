"""
データモデルのユニットテスト

このモジュールでは、project_anima/core/data_models.pyで定義されたPydanticモデルのテストを行います。
"""

import pytest
from pydantic import ValidationError

from project_anima.core.data_models import (
    ImmutableCharacterData,
    ExperienceData,
    GoalData,
    MemoryData,
    LongTermCharacterData,
    SceneInfoData,
    InterventionDetailData,
    InterventionData,
    TurnData,
    SceneLogData,
)


class TestImmutableCharacterData:
    """ImmutableCharacterDataクラスのテスト"""

    def test_normal_initialization(self):
        """正常なインスタンス化のテスト"""
        data = {
            "character_id": "c001",
            "name": "アリス",
            "base_personality": "好奇心旺盛"
        }
        character = ImmutableCharacterData(**data)
        assert character.character_id == "c001"
        assert character.name == "アリス"
        assert character.base_personality == "好奇心旺盛"
        assert character.age is None
        assert character.occupation is None

    def test_with_optional_fields(self):
        """オプショナルフィールドを含むインスタンス化のテスト"""
        data = {
            "character_id": "c002",
            "name": "ボブ",
            "base_personality": "冷静沈着",
            "age": 25,
            "occupation": "エンジニア"
        }
        character = ImmutableCharacterData(**data)
        assert character.character_id == "c002"
        assert character.name == "ボブ"
        assert character.base_personality == "冷静沈着"
        assert character.age == 25
        assert character.occupation == "エンジニア"

    def test_missing_required_field(self):
        """必須フィールド欠損時のエラーテスト"""
        data = {
            "name": "アリス",
            "base_personality": "好奇心旺盛"
        }
        with pytest.raises(ValidationError) as excinfo:
            ImmutableCharacterData(**data)
        # バリデーションエラーに character_id の欠損に関するメッセージが含まれるか検証
        assert "character_id" in str(excinfo.value)


class TestExperienceData:
    """ExperienceDataクラスのテスト"""

    def test_normal_initialization(self):
        """正常なインスタンス化のテスト"""
        data = {
            "event": "初めて友達と出会った",
            "importance": 8
        }
        experience = ExperienceData(**data)
        assert experience.event == "初めて友達と出会った"
        assert experience.importance == 8

    def test_importance_out_of_range(self):
        """importanceフィールドが範囲外の場合のエラーテスト"""
        data = {
            "event": "テストイベント",
            "importance": 11
        }
        with pytest.raises(ValidationError) as excinfo:
            ExperienceData(**data)
        assert "importance" in str(excinfo.value)
        assert "less than or equal to 10" in str(excinfo.value) or "10以下" in str(excinfo.value)


class TestLongTermCharacterData:
    """LongTermCharacterDataクラスのテスト"""

    def test_normal_initialization(self):
        """正常なインスタンス化のテスト"""
        data = {
            "character_id": "c001",
            "experiences": [
                {
                    "event": "初めて友達と出会った",
                    "importance": 8
                }
            ],
            "goals": [
                {
                    "goal": "世界一の小説家になる",
                    "importance": 9
                }
            ],
            "memories": [
                {
                    "memory": "誕生日にケーキをもらった",
                    "scene_id_of_memory": "S001",
                    "related_character_ids": ["c002"]
                }
            ]
        }
        long_term_data = LongTermCharacterData(**data)
        assert long_term_data.character_id == "c001"
        assert len(long_term_data.experiences) == 1
        assert long_term_data.experiences[0].event == "初めて友達と出会った"
        assert len(long_term_data.goals) == 1
        assert long_term_data.goals[0].goal == "世界一の小説家になる"
        assert len(long_term_data.memories) == 1
        assert long_term_data.memories[0].memory == "誕生日にケーキをもらった"
        assert long_term_data.memories[0].related_character_ids == ["c002"]

    def test_empty_lists(self):
        """空のリストを含むインスタンス化のテスト"""
        data = {
            "character_id": "c001"
        }
        long_term_data = LongTermCharacterData(**data)
        assert long_term_data.character_id == "c001"
        assert len(long_term_data.experiences) == 0
        assert len(long_term_data.goals) == 0
        assert len(long_term_data.memories) == 0


class TestSceneLogData:
    """SceneLogDataクラスのテスト"""

    def test_normal_initialization(self):
        """正常なインスタンス化のテスト"""
        data = {
            "scene_info": {
                "scene_id": "S001",
                "location": "学校の教室",
                "time": "放課後",
                "situation": "夕日が差し込み、生徒はほとんど帰宅している。窓際の席でAとBが話している。",
                "participant_character_ids": ["c001", "c002"]
            },
            "interventions_in_scene": [
                {
                    "applied_before_turn_number": 2,
                    "intervention_type": "SCENE_SITUATION_UPDATE",
                    "details": {
                        "description": "ユーザーが場面の状況を「突然雨が降ってきた」と更新しました。",
                        "updated_situation_element": "突然雨が降ってきた"
                    }
                }
            ],
            "turns": [
                {
                    "turn_number": 1,
                    "character_id": "c001",
                    "character_name": "アリス",
                    "think": "Bは何か悩んでいるようだ...",
                    "act": "Bの方を向く",
                    "talk": "「どうしたんだい、元気ないね？」"
                }
            ]
        }
        scene_log = SceneLogData(**data)
        assert scene_log.scene_info.scene_id == "S001"
        assert scene_log.scene_info.location == "学校の教室"
        assert len(scene_log.interventions_in_scene) == 1
        assert scene_log.interventions_in_scene[0].intervention_type == "SCENE_SITUATION_UPDATE"
        assert len(scene_log.turns) == 1
        assert scene_log.turns[0].character_id == "c001"
        assert scene_log.turns[0].think == "Bは何か悩んでいるようだ..."

    def test_empty_interventions_and_turns(self):
        """介入とターンが空の場合のインスタンス化テスト"""
        data = {
            "scene_info": {
                "scene_id": "S002",
                "situation": "テスト用の場面",
                "participant_character_ids": ["c001", "c002"]
            }
        }
        scene_log = SceneLogData(**data)
        assert scene_log.scene_info.scene_id == "S002"
        assert len(scene_log.interventions_in_scene) == 0
        assert len(scene_log.turns) == 0 