"""
InformationUpdaterクラスのユニットテスト
"""

import unittest
from unittest import mock
from typing import List, Dict, Any

import pytest

from core.information_updater import InformationUpdater
from core.data_models import (
    SceneLogData,
    SceneInfoData,
    TurnData,
    InterventionData,
    SceneUpdateDetails,
    RevelationDetails,
)


class TestInformationUpdater(unittest.TestCase):
    """InformationUpdaterクラスのテスト"""

    def setUp(self):
        """テスト前の準備"""
        # CharacterManagerのモックを作成
        self.mock_character_manager = mock.MagicMock()

        # InformationUpdaterのインスタンスを作成
        self.updater = InformationUpdater(self.mock_character_manager)

        # テスト用の場面情報を作成
        self.scene_info = SceneInfoData(
            scene_id="test_scene_001",
            location="テスト場所",
            time="テスト時間",
            situation="テスト状況の説明",
            participant_character_ids=["char_001", "char_002"],
        )

        # テスト用の場面ログデータを作成
        self.scene_log_data = SceneLogData(
            scene_info=self.scene_info, interventions_in_scene=[], turns=[]
        )

    def test_record_turn_to_short_term_log_first_turn(self):
        """1ターン目の記録が正しく行われること"""
        # 1ターン目の記録
        self.updater.record_turn_to_short_term_log(
            self.scene_log_data,
            "char_001",
            "アリス",
            "何を話そうか考えている",
            "静かに微笑む",
            "こんにちは、ボブ",
        )

        # 検証
        self.assertEqual(len(self.scene_log_data.turns), 1)
        turn = self.scene_log_data.turns[0]
        self.assertEqual(turn.turn_number, 1)
        self.assertEqual(turn.character_id, "char_001")
        self.assertEqual(turn.character_name, "アリス")
        self.assertEqual(turn.think, "何を話そうか考えている")
        self.assertEqual(turn.act, "静かに微笑む")
        self.assertEqual(turn.talk, "こんにちは、ボブ")

    def test_record_turn_to_short_term_log_multiple_turns(self):
        """複数ターンの記録が正しく行われること"""
        # 1ターン目の記録
        self.updater.record_turn_to_short_term_log(
            self.scene_log_data,
            "char_001",
            "アリス",
            "何を話そうか考えている",
            "静かに微笑む",
            "こんにちは、ボブ",
        )

        # 2ターン目の記録
        self.updater.record_turn_to_short_term_log(
            self.scene_log_data,
            "char_002",
            "ボブ",
            "アリスに何と返そうか",
            "帽子を取る",
            "やあ、アリス。いい天気だね",
        )

        # 検証
        self.assertEqual(len(self.scene_log_data.turns), 2)

        # 1ターン目の検証
        turn1 = self.scene_log_data.turns[0]
        self.assertEqual(turn1.turn_number, 1)
        self.assertEqual(turn1.character_name, "アリス")

        # 2ターン目の検証
        turn2 = self.scene_log_data.turns[1]
        self.assertEqual(turn2.turn_number, 2)
        self.assertEqual(turn2.character_name, "ボブ")
        self.assertEqual(turn2.talk, "やあ、アリス。いい天気だね")

    def test_record_turn_with_null_act_and_talk(self):
        """行動と発言がNoneの場合も正しく記録されること"""
        self.updater.record_turn_to_short_term_log(
            self.scene_log_data,
            "char_001",
            "アリス",
            "静かに考えている",
            None,  # 行動なし
            None,  # 発言なし
        )

        # 検証
        self.assertEqual(len(self.scene_log_data.turns), 1)
        turn = self.scene_log_data.turns[0]
        self.assertEqual(turn.think, "静かに考えている")
        self.assertIsNone(turn.act)
        self.assertIsNone(turn.talk)

    def test_record_turn_to_none_scene_log(self):
        """Noneの場面ログデータにターンを記録しようとするとValueErrorが発生すること"""
        with self.assertRaises(ValueError):
            self.updater.record_turn_to_short_term_log(
                None,  # Noneの場面ログデータ
                "char_001",
                "アリス",
                "思考",
                "行動",
                "発言",
            )

    def test_record_intervention_to_log(self):
        """介入情報が正しく記録されること"""
        # 場面状況更新の介入を作成
        scene_update = SceneUpdateDetails(
            description="天気が変わる", updated_situation_element="急に雨が降り始めた"
        )

        intervention = InterventionData(
            applied_before_turn_number=2,
            intervention_type="SCENE_SITUATION_UPDATE",
            intervention=scene_update,
        )

        # 介入を記録
        self.updater.record_intervention_to_log(self.scene_log_data, intervention)

        # 検証
        self.assertEqual(len(self.scene_log_data.interventions_in_scene), 1)
        recorded_intervention = self.scene_log_data.interventions_in_scene[0]
        self.assertEqual(
            recorded_intervention.intervention_type, "SCENE_SITUATION_UPDATE"
        )
        self.assertEqual(recorded_intervention.applied_before_turn_number, 2)
        self.assertEqual(recorded_intervention.intervention.description, "天気が変わる")

    def test_record_multiple_interventions(self):
        """複数の介入情報が正しく記録されること"""
        # 場面状況更新の介入
        scene_update = SceneUpdateDetails(
            description="天気が変わる", updated_situation_element="急に雨が降り始めた"
        )

        intervention1 = InterventionData(
            applied_before_turn_number=2,
            intervention_type="SCENE_SITUATION_UPDATE",
            intervention=scene_update,
        )

        # 天啓付与の介入
        revelation = RevelationDetails(
            description="キャラクターに重要な情報を与える",
            revelation_content="秘密の手紙の在処を思い出した",
        )

        intervention2 = InterventionData(
            applied_before_turn_number=3,
            intervention_type="REVELATION",
            intervention=revelation,
            target_character_id="char_001",
        )

        # 介入を記録
        self.updater.record_intervention_to_log(self.scene_log_data, intervention1)
        self.updater.record_intervention_to_log(self.scene_log_data, intervention2)

        # 検証
        self.assertEqual(len(self.scene_log_data.interventions_in_scene), 2)
        self.assertEqual(
            self.scene_log_data.interventions_in_scene[0].intervention_type,
            "SCENE_SITUATION_UPDATE",
        )
        self.assertEqual(
            self.scene_log_data.interventions_in_scene[1].intervention_type,
            "REVELATION",
        )
        self.assertEqual(
            self.scene_log_data.interventions_in_scene[1].target_character_id,
            "char_001",
        )

    def test_record_intervention_to_none_scene_log(self):
        """Noneの場面ログデータに介入を記録しようとするとValueErrorが発生すること"""
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="TEST",
            intervention=SceneUpdateDetails(
                description="テスト介入", updated_situation_element="テスト要素"
            ),
        )

        with self.assertRaises(ValueError):
            self.updater.record_intervention_to_log(None, intervention)

    def test_trigger_long_term_update_dummy_implementation(self):
        """長期情報更新トリガーメソッドが例外を発生させずに実行できること（雛形実装の確認）"""
        mock_llm_adapter = mock.MagicMock()

        # 例外が発生しないことを確認
        try:
            self.updater.trigger_long_term_update(
                "char_001", mock_llm_adapter, self.scene_log_data
            )
        except Exception as e:
            self.fail(f"trigger_long_term_updateが例外を発生させました: {e}")


if __name__ == "__main__":
    pytest.main(["-v", "test_information_updater.py"])
