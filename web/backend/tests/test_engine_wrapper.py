"""
EngineWrapperのテスト
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
from pathlib import Path

import sys

project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from web.backend.services.engine_wrapper import EngineWrapper, EngineWrapperError
from web.backend.api.models import SimulationConfig, LLMProvider, SimulationStatus


class TestEngineWrapper:
    """EngineWrapperのテストクラス"""

    def setup_method(self):
        """各テストメソッドの前に実行される"""
        self.wrapper = EngineWrapper()

    def test_initialization(self):
        """初期化のテスト"""
        assert self.wrapper.status == SimulationStatus.NOT_STARTED
        assert self.wrapper.engine is None
        assert self.wrapper.current_config is None
        assert len(self.wrapper.websocket_callbacks) == 0

    def test_get_available_characters(self):
        """利用可能なキャラクター一覧取得のテスト"""
        characters = self.wrapper.get_available_characters()
        assert isinstance(characters, list)
        # 実際のキャラクターディレクトリが存在する場合のテスト
        # 存在しない場合は空のリストが返される

    def test_get_available_scenes(self):
        """利用可能なシーン一覧取得のテスト"""
        scenes = self.wrapper.get_available_scenes()
        assert isinstance(scenes, list)
        # 実際のシーンディレクトリが存在する場合のテスト
        # 存在しない場合は空のリストが返される

    @pytest.mark.asyncio
    async def test_start_simulation_without_scene_file(self):
        """存在しないシーンファイルでのシミュレーション開始テスト"""
        config = SimulationConfig(
            character_name="nonexistent_character",
            llm_provider=LLMProvider.GEMINI,
            model_name="gemini-1.5-flash-latest",
        )

        result = await self.wrapper.start_simulation(config)

        assert result["success"] is False
        assert "シーンファイルが見つかりません" in result["message"]
        assert self.wrapper.status == SimulationStatus.ERROR

    @pytest.mark.asyncio
    async def test_execute_next_turn_without_simulation(self):
        """シミュレーション未開始でのターン実行テスト"""
        result = await self.wrapper.execute_next_turn()

        assert result["success"] is False
        assert "シミュレーションが実行されていません" in result["message"]

    @pytest.mark.asyncio
    async def test_stop_simulation_when_idle(self):
        """アイドル状態でのシミュレーション停止テスト"""
        result = await self.wrapper.stop_simulation()

        assert result["success"] is True
        assert self.wrapper.status == SimulationStatus.NOT_STARTED

    def test_get_simulation_state_when_idle(self):
        """未開始状態でのシミュレーション状態取得テスト"""
        state = self.wrapper.get_simulation_state()

        assert state.status == SimulationStatus.NOT_STARTED
        assert state.current_step == 0
        assert state.character_name == ""
        assert len(state.timeline) == 0

    @pytest.mark.asyncio
    async def test_process_intervention_without_simulation(self):
        """シミュレーション未開始での介入テスト"""
        result = await self.wrapper.process_intervention(
            "update_situation", "テスト介入"
        )

        assert result["success"] is False
        assert "シミュレーションが実行されていません" in result["message"]

    @pytest.mark.asyncio
    async def test_update_llm_model_without_simulation(self):
        """シミュレーション未開始でのLLMモデル更新テスト"""
        result = await self.wrapper.update_llm_model(
            LLMProvider.GEMINI, "gemini-1.5-pro"
        )

        assert result["success"] is False
        assert "シミュレーションが実行されていません" in result["message"]

    def test_add_websocket_callback(self):
        """WebSocketコールバック追加のテスト"""
        callback = Mock()
        self.wrapper.add_websocket_callback(callback)

        assert len(self.wrapper.websocket_callbacks) == 1
        assert callback in self.wrapper.websocket_callbacks


if __name__ == "__main__":
    pytest.main([__file__])
