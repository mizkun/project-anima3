"""
SimulationEngineのテスト

このモジュールは、Project Animaのシミュレーションエンジンをテストします。
"""

import os
import unittest
import shutil
from unittest import mock
from typing import Dict, List, Any, Optional

import pytest

from src.project_anima.core.simulation_engine import (
    SimulationEngine,
    SimulationEngineError,
    SceneNotLoadedError,
)
from src.project_anima.core.data_models import (
    SceneInfoData,
    SceneLogData,
    TurnData,
    InterventionData,
    SceneUpdateDetails,
    ImmutableCharacterData,
    RevelationDetails,
    GenericInterventionDetails,
)


class TestSimulationEngine(unittest.TestCase):
    """SimulationEngineクラスのテスト"""

    def setUp(self):
        """テスト前の準備"""
        # 各コンポーネントのモックを作成
        self.mock_character_manager = self._create_mock_character_manager()
        self.mock_scene_manager = self._create_mock_scene_manager()
        self.mock_context_builder = self._create_mock_context_builder()
        self.mock_llm_adapter = self._create_mock_llm_adapter()
        self.mock_information_updater = self._create_mock_information_updater()

        # パッチャーを作成（メソッド内でインポートされるクラスをモック化）
        self.character_manager_patcher = mock.patch(
            "src.project_anima.core.character_manager.CharacterManager",
            return_value=self.mock_character_manager,
        )
        self.scene_manager_patcher = mock.patch(
            "src.project_anima.core.scene_manager.SceneManager",
            return_value=self.mock_scene_manager,
        )
        self.context_builder_patcher = mock.patch(
            "src.project_anima.core.context_builder.ContextBuilder",
            return_value=self.mock_context_builder,
        )
        self.llm_adapter_patcher = mock.patch(
            "src.project_anima.core.llm_adapter.LLMAdapter",
            return_value=self.mock_llm_adapter,
        )
        self.information_updater_patcher = mock.patch(
            "src.project_anima.core.information_updater.InformationUpdater",
            return_value=self.mock_information_updater,
        )

        # パッチを適用
        self.character_manager_patcher.start()
        self.scene_manager_patcher.start()
        self.context_builder_patcher.start()
        self.llm_adapter_patcher.start()
        self.information_updater_patcher.start()

        # テスト用のSimulationEngineインスタンスを作成
        self.scene_file_path = "test_scenes/test_scene.yaml"
        self.characters_base_path = "test_characters"
        self.engine = SimulationEngine(
            scene_file_path=self.scene_file_path,
            characters_base_path=self.characters_base_path,
        )

    def tearDown(self):
        """テスト後のクリーンアップ"""
        # パッチを解除
        self.character_manager_patcher.stop()
        self.scene_manager_patcher.stop()
        self.context_builder_patcher.stop()
        self.llm_adapter_patcher.stop()
        self.information_updater_patcher.stop()

    def _create_mock_character_manager(self):
        """CharacterManagerのモックを作成"""
        mock_cm = mock.MagicMock()

        # get_immutable_contextのモック
        mock_immutable_data_alice = ImmutableCharacterData(
            character_id="char_001", name="アリス", base_personality="明るく社交的"
        )
        mock_immutable_data_bob = ImmutableCharacterData(
            character_id="char_002", name="ボブ", base_personality="冷静で論理的"
        )

        def mock_get_immutable_context(character_id):
            if character_id == "char_001":
                return mock_immutable_data_alice
            elif character_id == "char_002":
                return mock_immutable_data_bob
            else:
                from src.project_anima.core.character_manager import (
                    CharacterNotFoundError,
                )

                raise CharacterNotFoundError(character_id)

        mock_cm.get_immutable_context.side_effect = mock_get_immutable_context

        return mock_cm

    def _create_mock_scene_manager(self):
        """SceneManagerのモックを作成"""
        mock_sm = mock.MagicMock()

        # テスト用の場面情報
        self.test_scene_info = SceneInfoData(
            scene_id="test_scene_001",
            location="テスト場所",
            time="テスト時間",
            situation="テスト状況の説明",
            participant_character_ids=["char_001", "char_002"],
        )

        # get_current_scene_infoのモック
        mock_sm.get_current_scene_info.return_value = self.test_scene_info

        return mock_sm

    def _create_mock_context_builder(self):
        """ContextBuilderのモックを作成"""
        mock_cb = mock.MagicMock()

        # build_context_for_characterのモック
        mock_cb.build_context_for_character.return_value = {
            "character_name": "テストキャラクター",
            "immutable_context": "テストの不変情報",
            "long_term_context": "テストの長期情報",
            "scene_context": "テストの場面情報",
            "short_term_context": "テストの短期情報",
        }

        return mock_cb

    def _create_mock_llm_adapter(self):
        """LLMAdapterのモックを作成"""
        mock_llm = mock.MagicMock()

        # generate_character_thoughtのモック
        mock_llm.generate_character_thought.return_value = {
            "think": "テストの思考",
            "act": "テストの行動",
            "talk": "テストの発言",
        }

        return mock_llm

    def _create_mock_information_updater(self):
        """InformationUpdaterのモックを作成"""
        mock_iu = mock.MagicMock()
        return mock_iu

    def test_initialization(self):
        """初期化が正しく行われること"""
        self.assertEqual(self.engine.scene_file_path, self.scene_file_path)
        self.assertEqual(self.engine.characters_base_path, self.characters_base_path)
        self.assertIsNone(self.engine._current_scene_log)
        self.assertEqual(self.engine._current_turn_index, 0)

    def test_start_simulation_success(self):
        """シミュレーションが正常に開始・実行されること"""
        # シミュレーションを開始（明示的に最大ターン数を指定）
        self.engine.start_simulation(max_turns=2)  # 明示的に最大ターン数を2に制限

        # 各コンポーネントの呼び出しを検証
        self.mock_scene_manager.load_scene_from_file.assert_called_once_with(
            self.scene_file_path
        )
        self.mock_scene_manager.get_current_scene_info.assert_called()

        # ターンが正常に実行されたことを検証
        # 注: 実際の呼び出し回数はシミュレーションエンジンの実装に依存する可能性があるため、
        # 厳密な回数ではなく、少なくとも1回以上呼び出されていることを確認
        self.assertGreaterEqual(
            self.mock_context_builder.build_context_for_character.call_count, 1
        )
        self.assertGreaterEqual(
            self.mock_information_updater.record_turn_to_short_term_log.call_count, 1
        )

    def test_start_simulation_no_participants(self):
        """参加者がいない場合、シミュレーションが早期終了すること"""
        # 参加者が空のシーン情報を設定
        empty_scene_info = SceneInfoData(
            scene_id="empty_scene",
            location="テスト場所",
            time="テスト時間",
            situation="テスト状況の説明",
            participant_character_ids=[],
        )
        self.mock_scene_manager.get_current_scene_info.return_value = empty_scene_info

        # シミュレーションを開始
        self.engine.start_simulation()

        # ターンが実行されていないことを検証
        self.mock_context_builder.build_context_for_character.assert_not_called()
        self.mock_information_updater.record_turn_to_short_term_log.assert_not_called()

    def test_start_simulation_scene_load_error(self):
        """場面ロードエラーが適切に処理されること"""
        # 場面ロードでエラーを発生させる
        from src.project_anima.core.scene_manager import SceneFileNotFoundError

        self.mock_scene_manager.load_scene_from_file.side_effect = (
            SceneFileNotFoundError("テストエラー")
        )

        # シミュレーション開始時にエラーが発生することを検証
        with self.assertRaises(SimulationEngineError):
            self.engine.start_simulation()

        # ターンが実行されていないことを検証
        self.mock_context_builder.build_context_for_character.assert_not_called()
        self.mock_information_updater.record_turn_to_short_term_log.assert_not_called()

    def test_next_turn_character_not_found(self):
        """存在しないキャラクターのターンが適切に処理されること"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 存在しないキャラクターIDを指定
        nonexistent_character_id = "nonexistent_char"

        # CharacterNotFoundErrorを発生させる準備
        from src.project_anima.core.character_manager import CharacterNotFoundError

        # next_turnを実行
        self.engine.next_turn(nonexistent_character_id)

        # エラーが発生しても、情報更新は行われることを検証
        self.mock_information_updater.record_turn_to_short_term_log.assert_called_once()
        # キャラクター名はIDがそのまま使用されていることを検証
        args, kwargs = (
            self.mock_information_updater.record_turn_to_short_term_log.call_args
        )
        self.assertEqual(args[1], nonexistent_character_id)  # character_id
        self.assertEqual(args[2], nonexistent_character_id)  # character_name

    def test_next_turn_scene_not_loaded(self):
        """場面がロードされていない状態でnext_turnを呼び出すとエラーになること"""
        # _current_scene_logがNoneの状態
        self.engine._current_scene_log = None

        # next_turnを呼び出すとSceneNotLoadedErrorが発生することを検証
        with self.assertRaises(SceneNotLoadedError):
            self.engine.next_turn("char_001")

    def test_process_user_intervention(self):
        """基本的なユーザー介入機能のテスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # テスト用の介入データ
        intervention = InterventionData(
            applied_before_turn_number=2,
            intervention_type="SCENE_SITUATION_UPDATE",
            intervention=SceneUpdateDetails(
                description="テスト介入", updated_situation_element="テスト要素"
            ),
        )

        # process_user_interventionを実行
        self.engine.process_user_intervention(intervention)

        # 介入情報がログに記録されたことを検証
        self.mock_information_updater.record_intervention_to_log.assert_called_once_with(
            self.engine._current_scene_log, intervention
        )

    def test_process_user_intervention_scene_update(self):
        """場面状況更新の介入処理テスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 元の状況を保存
        original_situation = self.engine._current_scene_log.scene_info.situation

        # 場面状況更新の介入データ
        new_situation = "新しい場面状況です。テスト用。"
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="SCENE_SITUATION_UPDATE",
            intervention=SceneUpdateDetails(
                description="場面状況を更新", updated_situation_element=new_situation
            ),
        )

        # 介入処理を実行
        self.engine.process_user_intervention(intervention)

        # SceneManagerのupdate_scene_situationが呼ばれたことを確認
        self.mock_scene_manager.update_scene_situation.assert_called_once_with(
            new_situation
        )

        # 場面ログの状況も更新されていることを確認
        self.assertEqual(
            self.engine._current_scene_log.scene_info.situation, new_situation
        )
        self.assertNotEqual(
            self.engine._current_scene_log.scene_info.situation, original_situation
        )

    def test_process_user_intervention_revelation(self):
        """天啓付与の介入処理テスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 天啓の介入データ
        target_character = "char_001"
        revelation_content = "これは秘密の情報です。あなただけが知っています。"
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="REVELATION",
            target_character_id=target_character,
            intervention=RevelationDetails(
                description="キャラクターに天啓を与える",
                revelation_content=revelation_content,
            ),
        )

        # 介入処理を実行
        self.engine.process_user_intervention(intervention)

        # 天啓情報が保存されていることを確認
        self.assertIn(target_character, self.engine._pending_revelations)
        self.assertIn(
            revelation_content, self.engine._pending_revelations[target_character]
        )

    def test_process_user_intervention_revelation_applied_in_next_turn(self):
        """天啓情報が次のターンのコンテクストに反映されることを確認するテスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 天啓の介入データ
        target_character = "char_001"
        revelation_content = "これは秘密の情報です。あなただけが知っています。"
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="REVELATION",
            target_character_id=target_character,
            intervention=RevelationDetails(
                description="キャラクターに天啓を与える",
                revelation_content=revelation_content,
            ),
        )

        # 介入処理を実行して天啓情報を設定
        self.engine.process_user_intervention(intervention)

        # 次のターンを実行
        self.engine.next_turn(target_character)

        # build_context_for_characterが適切な引数で呼ばれたことを確認
        # 特に、previous_scene_summaryに天啓情報が含まれていることを確認
        args, kwargs = self.mock_context_builder.build_context_for_character.call_args
        self.assertEqual(args[0], target_character)  # 第1引数: character_id
        self.assertIsNotNone(args[2])  # 第3引数: previous_scene_summary
        self.assertIn(revelation_content, args[2])  # 天啓内容が含まれている

        # 天啓情報がクリアされていることを確認
        self.assertEqual(len(self.engine._pending_revelations[target_character]), 0)

    def test_process_user_intervention_add_character(self):
        """キャラクター追加の介入処理テスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # キャラクター追加の介入データ
        new_character = "new_char_003"
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="ADD_CHARACTER_TO_SCENE",
            intervention=GenericInterventionDetails(
                description="新しいキャラクターを場面に追加",
                extra_data={"character_id_to_add": new_character},
            ),
        )

        # 介入処理を実行
        self.engine.process_user_intervention(intervention)

        # SceneManagerのadd_character_to_sceneが呼ばれたことを確認
        self.mock_scene_manager.add_character_to_scene.assert_called_once_with(
            new_character
        )

    def test_process_user_intervention_remove_character(self):
        """キャラクター削除の介入処理テスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # キャラクター削除の介入データ
        character_to_remove = "char_001"
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="REMOVE_CHARACTER_FROM_SCENE",
            intervention=GenericInterventionDetails(
                description="キャラクターを場面から削除",
                extra_data={"character_id_to_remove": character_to_remove},
            ),
        )

        # 介入処理を実行
        self.engine.process_user_intervention(intervention)

        # SceneManagerのremove_character_from_sceneが呼ばれたことを確認
        self.mock_scene_manager.remove_character_from_scene.assert_called_once_with(
            character_to_remove
        )

    def test_process_user_intervention_end_scene(self):
        """場面終了の介入処理テスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 場面終了の介入データ
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="END_SCENE",
            intervention=GenericInterventionDetails(
                description="場面を終了する", extra_data={}
            ),
        )

        # 介入処理を実行
        self.engine.process_user_intervention(intervention)

        # 場面終了フラグが設定されていることを確認
        self.assertTrue(self.engine._end_scene_requested)

    def test_process_user_intervention_unknown_type(self):
        """未定義の介入タイプの処理テスト"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 未定義の介入タイプ
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="UNKNOWN_TYPE",
            intervention=GenericInterventionDetails(
                description="未定義の介入タイプ", extra_data={}
            ),
        )

        # ログ出力を確認するためにloggerをモック化
        with mock.patch(
            "src.project_anima.core.simulation_engine.logger"
        ) as mock_logger:
            # 介入処理を実行
            self.engine.process_user_intervention(intervention)

            # 警告ログが出力されることを確認
            mock_logger.warning.assert_called_once()
            self.assertIn("未定義の介入タイプです", mock_logger.warning.call_args[0][0])

    def test_process_user_intervention_scene_not_loaded(self):
        """場面がロードされていない状態での介入処理テスト"""
        # 場面ログをNoneに設定
        self.engine._current_scene_log = None

        # テスト用の介入データ
        intervention = InterventionData(
            applied_before_turn_number=1,
            intervention_type="SCENE_SITUATION_UPDATE",
            intervention=SceneUpdateDetails(
                description="テスト介入", updated_situation_element="テスト要素"
            ),
        )

        # SceneNotLoadedErrorが発生することを確認
        with self.assertRaises(SceneNotLoadedError):
            self.engine.process_user_intervention(intervention)

    def test_determine_next_character(self):
        """次のキャラクターが正しく決定されること"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 1人目のキャラクター
        self.engine._current_turn_index = 0
        character_id = self.engine._determine_next_character()
        self.assertEqual(character_id, "char_001")

        # 2人目のキャラクター
        self.engine._current_turn_index = 1
        character_id = self.engine._determine_next_character()
        self.assertEqual(character_id, "char_002")

        # インデックスが範囲外の場合
        self.engine._current_turn_index = 2
        character_id = self.engine._determine_next_character()
        self.assertIsNone(character_id)

    @mock.patch("src.project_anima.core.simulation_engine.datetime")
    @mock.patch("src.project_anima.core.simulation_engine.save_json")
    def test_save_scene_log_success(self, mock_save_json, mock_datetime):
        """場面ログが正常に保存されること"""
        # 固定のタイムスタンプを設定
        mock_datetime.datetime.now.return_value.strftime.return_value = (
            "20240101_120000"
        )

        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # テスト用のログディレクトリ
        test_log_dir = os.path.join("logs", "sim_20240101_120000")

        # 念のためテスト用ディレクトリを事前にクリーンアップ
        if os.path.exists(test_log_dir):
            shutil.rmtree(test_log_dir)

        try:
            # _save_scene_logを実行
            self.engine._save_scene_log()

            # save_jsonが正しく呼び出されたことを検証
            expected_file_path = os.path.join(
                test_log_dir, f"scene_{self.test_scene_info.scene_id}.json"
            )
            mock_save_json.assert_called_once()

            # 引数を検証
            args, kwargs = mock_save_json.call_args
            self.assertEqual(args[0], self.engine._current_scene_log.model_dump())
            self.assertEqual(args[1], expected_file_path)
            self.assertEqual(kwargs["indent"], 2)

        finally:
            # テスト後にテスト用ディレクトリを削除
            if os.path.exists(test_log_dir):
                shutil.rmtree(test_log_dir)

    def test_save_scene_log_no_data(self):
        """保存すべき場面ログがない場合、警告が出力されること"""
        # 場面ログをNoneに設定
        self.engine._current_scene_log = None

        # _save_scene_logを実行
        with mock.patch(
            "src.project_anima.core.simulation_engine.logger"
        ) as mock_logger:
            self.engine._save_scene_log()

            # 警告ログが出力されたことを検証
            mock_logger.warning.assert_called_once_with(
                "保存すべき場面ログが存在しません。"
            )

    @mock.patch("src.project_anima.core.simulation_engine.save_json")
    def test_save_scene_log_permission_error(self, mock_save_json):
        """ファイル書き込み権限エラーが適切に処理されること"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # save_jsonでPermissionErrorを発生させる
        mock_save_json.side_effect = PermissionError("テスト権限エラー")

        # _save_scene_logを実行
        with mock.patch(
            "src.project_anima.core.simulation_engine.logger"
        ) as mock_logger:
            self.engine._save_scene_log()

            # エラーログが出力されたことを検証
            mock_logger.error.assert_called_once()
            self.assertIn("書き込み権限がありません", mock_logger.error.call_args[0][0])

    @mock.patch("src.project_anima.core.simulation_engine.save_json")
    def test_save_scene_log_generic_error(self, mock_save_json):
        """_save_scene_logのその他一般的なエラーが処理されること"""
        # エラーを発生させる
        mock_save_json.side_effect = Exception("一般的なエラー")

        # 場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # エラーが出ても例外にならず処理が続くことを検証
        try:
            self.engine._save_scene_log()
        except Exception:
            self.fail("_save_scene_logがエラーを適切に処理できていません")

    def test_update_character_long_term_info_success(self):
        """update_character_long_term_infoが正常に動作すること"""
        # 場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # InformationUpdaterのtrigger_long_term_updateの戻り値を設定
        update_proposal = {
            "new_experiences": [{"event": "テスト経験", "importance": 8}],
            "updated_goals": [{"goal": "テスト目標", "importance": 9}],
        }
        self.mock_information_updater.trigger_long_term_update.return_value = (
            update_proposal
        )

        # 長期情報更新を実行
        result = self.engine.update_character_long_term_info("char_001")

        # InformationUpdaterが正しく呼び出されることを検証
        self.mock_information_updater.trigger_long_term_update.assert_called_once_with(
            "char_001",
            self.mock_llm_adapter,
            self.engine._current_scene_log,
            self.mock_context_builder,
            os.path.join(self.engine.prompts_dir_path, "long_term_update.txt"),
        )

        # 戻り値が正しいことを検証
        self.assertEqual(result, update_proposal)

    def test_update_character_long_term_info_scene_not_loaded(self):
        """場面がロードされていない状態でupdate_character_long_term_infoを呼び出すとエラーになること"""
        # _current_scene_logがNoneの状態
        self.engine._current_scene_log = None

        # エラーが発生することを検証
        with self.assertRaises(SceneNotLoadedError):
            self.engine.update_character_long_term_info("char_001")

        # InformationUpdaterが呼び出されないことを検証
        self.mock_information_updater.trigger_long_term_update.assert_not_called()

    def test_update_character_long_term_info_character_not_in_scene(self):
        """場面に参加していないキャラクターの長期情報更新を試みるとエラーになること"""
        # 場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # 存在しないキャラクターIDを指定
        nonexistent_character_id = "nonexistent_char"

        # エラーが発生することを検証
        with self.assertRaises(ValueError):
            self.engine.update_character_long_term_info(nonexistent_character_id)

        # InformationUpdaterが呼び出されないことを検証
        self.mock_information_updater.trigger_long_term_update.assert_not_called()

    def test_update_character_long_term_info_error_handling(self):
        """update_character_long_term_infoのエラーハンドリングが適切に行われること"""
        # 場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # InformationUpdaterでエラーを発生させる
        self.mock_information_updater.trigger_long_term_update.side_effect = Exception(
            "テストエラー"
        )

        # エラーがNoneとして処理されることを検証
        result = self.engine.update_character_long_term_info("char_001")
        self.assertIsNone(result)

        # InformationUpdaterが呼び出されたことを検証
        self.mock_information_updater.trigger_long_term_update.assert_called_once()


if __name__ == "__main__":
    pytest.main(["-v", "test_simulation_engine.py"])
