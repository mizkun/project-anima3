"""
InformationUpdaterクラスのユニットテスト
"""

import unittest
from unittest import mock
from typing import List, Dict, Any

import pytest

from src.project_anima.core.information_updater import InformationUpdater
from src.project_anima.core.data_models import (
    SceneLogData,
    SceneInfoData,
    TurnData,
    InterventionData,
    SceneUpdateDetails,
    RevelationDetails,
    LongTermCharacterData,
    ExperienceData,
    GoalData,
    MemoryData,
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

        # Mockオブジェクトの戻り値を設定
        mock_update_proposal = {
            "new_experiences": [{"event": "テスト経験", "importance": 8}],
            "updated_goals": [{"goal": "テスト目標", "importance": 9}],
        }
        mock_llm_adapter.update_character_long_term_info.return_value = (
            mock_update_proposal
        )

        # 適切なモックオブジェクトを準備
        mock_long_term_data = LongTermCharacterData(
            character_id="char_001", experiences=[], goals=[], memories=[]
        )
        self.mock_character_manager.get_long_term_context.return_value = (
            mock_long_term_data
        )

        # 例外が発生しないことを確認
        try:
            result = self.updater.trigger_long_term_update(
                "char_001", mock_llm_adapter, self.scene_log_data
            )
            # 返り値も確認
            self.assertEqual(result, mock_update_proposal)
        except Exception as e:
            self.fail(f"trigger_long_term_updateが例外を発生させました: {e}")

    def test_apply_update_proposal(self):
        """_apply_update_proposalメソッドが更新提案を正しく適用すること"""
        # 現在の長期情報を準備
        current_data = LongTermCharacterData(
            character_id="test_char",
            experiences=[
                ExperienceData(event="既存の経験1", importance=7),
                ExperienceData(event="既存の経験2", importance=5),
            ],
            goals=[
                GoalData(goal="既存の目標1", importance=8),
                GoalData(goal="既存の目標2", importance=6),
            ],
            memories=[
                MemoryData(
                    memory="既存の記憶1",
                    scene_id_of_memory="scene_001",
                    related_character_ids=["char_001"],
                )
            ],
        )

        # LLMからの更新提案を模擬
        update_proposal = {
            "new_experiences": [
                {"event": "新しい経験1", "importance": 9},
                {"event": "新しい経験2", "importance": 6},
            ],
            "updated_goals": [
                {"goal": "既存の目標1", "importance": 10},  # 既存の目標の重要度を更新
                {"goal": "新しい目標1", "importance": 7},  # 新しい目標を追加
            ],
            "new_memories": [
                {
                    "memory": "新しい記憶1",
                    "scene_id_of_memory": "scene_002",
                    "related_character_ids": ["char_002", "char_003"],
                }
            ],
        }

        # 更新提案を適用
        updated_data = self.updater._apply_update_proposal(
            "test_char", current_data, update_proposal
        )

        # 結果を検証
        # 経験の検証
        self.assertEqual(len(updated_data.experiences), 4)  # 既存2つ + 新規2つ
        new_exp_events = [exp.event for exp in updated_data.experiences]
        self.assertIn("既存の経験1", new_exp_events)
        self.assertIn("既存の経験2", new_exp_events)
        self.assertIn("新しい経験1", new_exp_events)
        self.assertIn("新しい経験2", new_exp_events)

        # 目標の検証
        self.assertEqual(len(updated_data.goals), 3)  # 既存2つ + 新規1つ、既存1つは更新

        # 既存の目標1の重要度が更新されていることを確認
        updated_goal1 = next(g for g in updated_data.goals if g.goal == "既存の目標1")
        self.assertEqual(updated_goal1.importance, 10)  # 重要度が8から10に更新

        # 新しい目標が追加されていることを確認
        new_goal = next(g for g in updated_data.goals if g.goal == "新しい目標1")
        self.assertEqual(new_goal.importance, 7)

        # 記憶の検証
        self.assertEqual(len(updated_data.memories), 2)  # 既存1つ + 新規1つ
        new_memory = updated_data.memories[1]  # 2番目が新しい記憶
        self.assertEqual(new_memory.memory, "新しい記憶1")
        self.assertEqual(new_memory.scene_id_of_memory, "scene_002")
        self.assertEqual(new_memory.related_character_ids, ["char_002", "char_003"])

    def test_apply_update_proposal_empty_updates(self):
        """空の更新提案が正しく処理されること"""
        # 現在の長期情報を準備
        current_data = LongTermCharacterData(
            character_id="test_char",
            experiences=[ExperienceData(event="既存の経験", importance=7)],
            goals=[GoalData(goal="既存の目標", importance=8)],
            memories=[],
        )

        # 空の更新提案
        empty_update = {}

        # 更新提案を適用
        updated_data = self.updater._apply_update_proposal(
            "test_char", current_data, empty_update
        )

        # 何も変更されていないことを確認
        self.assertEqual(len(updated_data.experiences), 1)
        self.assertEqual(updated_data.experiences[0].event, "既存の経験")
        self.assertEqual(len(updated_data.goals), 1)
        self.assertEqual(updated_data.goals[0].goal, "既存の目標")
        self.assertEqual(len(updated_data.memories), 0)

    def test_trigger_long_term_update_integration(self):
        """trigger_long_term_updateメソッドの統合テスト"""
        # モックの準備
        mock_llm_adapter = mock.MagicMock()
        mock_context_builder = mock.MagicMock()

        # LLMの応答をモックで設定
        mock_llm_adapter.update_character_long_term_info.return_value = {
            "new_experiences": [
                {"event": "テスト中に新たな気づきを得た", "importance": 8}
            ],
            "updated_goals": [{"goal": "テストをもっと効率的に行う", "importance": 9}],
        }

        # 既存のキャラクター情報を準備
        mock_long_term_data = LongTermCharacterData(
            character_id="test_char", experiences=[], goals=[], memories=[]
        )

        # CharacterManagerのモックが既存データを返すように設定
        self.mock_character_manager.get_long_term_context.return_value = (
            mock_long_term_data
        )

        # ContextBuilderのモックがコンテキストを返すように設定
        mock_context_builder.build_context_for_long_term_update.return_value = {
            "character_name": "テストキャラクター",
            "existing_long_term_context_str": "既存の長期情報",
            "recent_significant_events_or_thoughts_str": "重要な出来事",
        }

        # 長期情報更新を実行
        result = self.updater.trigger_long_term_update(
            "test_char",
            mock_llm_adapter,
            self.scene_log_data,
            mock_context_builder,
            "test_prompt_path",
        )

        # 各モックが正しく呼ばれたことを確認
        mock_context_builder.build_context_for_long_term_update.assert_called_once_with(
            "test_char", self.scene_log_data
        )

        mock_llm_adapter.update_character_long_term_info.assert_called_once_with(
            "test_char",
            {
                "character_name": "テストキャラクター",
                "existing_long_term_context_str": "既存の長期情報",
                "recent_significant_events_or_thoughts_str": "重要な出来事",
            },
            "test_prompt_path",
        )

        self.mock_character_manager.get_long_term_context.assert_called_once_with(
            "test_char"
        )
        self.mock_character_manager.update_long_term_context.assert_called_once()

        # 結果が正しく返されることを確認
        self.assertEqual(
            result, mock_llm_adapter.update_character_long_term_info.return_value
        )


if __name__ == "__main__":
    pytest.main(["-v", "test_information_updater.py"])
