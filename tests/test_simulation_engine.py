"""
SimulationEngineクラスのユニットテスト
"""

import os
import unittest
import shutil
from unittest import mock
from typing import Dict, List, Any, Optional

import pytest

from core.simulation_engine import (
    SimulationEngine,
    SimulationEngineError,
    SceneNotLoadedError,
)
from core.data_models import (
    SceneInfoData,
    SceneLogData,
    TurnData,
    InterventionData,
    SceneUpdateDetails,
    ImmutableCharacterData,
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
            "core.character_manager.CharacterManager",
            return_value=self.mock_character_manager,
        )
        self.scene_manager_patcher = mock.patch(
            "core.scene_manager.SceneManager", return_value=self.mock_scene_manager
        )
        self.context_builder_patcher = mock.patch(
            "core.context_builder.ContextBuilder",
            return_value=self.mock_context_builder,
        )
        self.llm_adapter_patcher = mock.patch(
            "core.llm_adapter.LLMAdapter", return_value=self.mock_llm_adapter
        )
        self.information_updater_patcher = mock.patch(
            "core.information_updater.InformationUpdater",
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
                from core.character_manager import CharacterNotFoundError

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
        # シミュレーションを開始
        self.engine.start_simulation()

        # 各コンポーネントの呼び出しを検証
        self.mock_scene_manager.load_scene_from_file.assert_called_once_with(
            self.scene_file_path
        )
        self.mock_scene_manager.get_current_scene_info.assert_called()

        # 参加キャラクター数（2名）分のターンが実行されたことを検証
        self.assertEqual(
            self.mock_context_builder.build_context_for_character.call_count, 2
        )
        self.assertEqual(
            self.mock_information_updater.record_turn_to_short_term_log.call_count, 2
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
        from core.scene_manager import SceneFileNotFoundError

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
        from core.character_manager import CharacterNotFoundError

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
        """ユーザー介入処理の基本機能が動作すること"""
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

    @mock.patch("core.simulation_engine.datetime")
    @mock.patch("core.simulation_engine.save_json")
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
        with mock.patch("core.simulation_engine.logger") as mock_logger:
            self.engine._save_scene_log()

            # 警告ログが出力されたことを検証
            mock_logger.warning.assert_called_once_with(
                "保存すべき場面ログが存在しません。"
            )

    @mock.patch("core.simulation_engine.save_json")
    def test_save_scene_log_permission_error(self, mock_save_json):
        """ファイル書き込み権限エラーが適切に処理されること"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # save_jsonでPermissionErrorを発生させる
        mock_save_json.side_effect = PermissionError("テスト権限エラー")

        # _save_scene_logを実行
        with mock.patch("core.simulation_engine.logger") as mock_logger:
            self.engine._save_scene_log()

            # エラーログが出力されたことを検証
            mock_logger.error.assert_called_once()
            self.assertIn("書き込み権限がありません", mock_logger.error.call_args[0][0])

    @mock.patch("core.simulation_engine.save_json")
    def test_save_scene_log_generic_error(self, mock_save_json):
        """その他のエラーが適切に処理されること"""
        # 事前に場面ログを初期化
        self.engine._current_scene_log = SceneLogData(
            scene_info=self.test_scene_info, interventions_in_scene=[], turns=[]
        )

        # save_jsonで一般的な例外を発生させる
        mock_save_json.side_effect = Exception("テスト一般エラー")

        # _save_scene_logを実行
        with mock.patch("core.simulation_engine.logger") as mock_logger:
            self.engine._save_scene_log()

            # エラーログが出力されたことを検証
            mock_logger.error.assert_called_once()
            self.assertIn(
                "予期せぬエラーが発生しました", mock_logger.error.call_args[0][0]
            )


if __name__ == "__main__":
    pytest.main(["-v", "test_simulation_engine.py"])
