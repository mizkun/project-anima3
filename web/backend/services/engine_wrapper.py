"""
SimulationEngineラッパーサービス

既存のSimulationEngineをWeb API経由で操作するためのラッパーサービス
"""

import os
import sys
import logging
import asyncio
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from pathlib import Path

# Project Animaのコアモジュールをインポートするためのパス設定
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root / "src"))

from project_anima.core.simulation_engine import SimulationEngine, SceneNotLoadedError
from project_anima.core.data_models import InterventionData
from web.backend.api.models import (
    SimulationStatus,
    SimulationConfig,
    TimelineEntry,
    SimulationState,
    LLMProvider,
)

logger = logging.getLogger(__name__)


class EngineWrapperError(Exception):
    """EngineWrapper固有のエラー"""

    pass


class EngineWrapper:
    """
    SimulationEngineのラッパークラス

    Web UIからの操作を受け付け、既存のSimulationEngineに橋渡しする
    """

    def __init__(self):
        """EngineWrapperを初期化"""
        self.engine: Optional[SimulationEngine] = None
        self.status = SimulationStatus.NOT_STARTED
        self.current_config: Optional[SimulationConfig] = None

        # プロジェクトのパス設定
        self.project_root = project_root
        self.characters_dir = self.project_root / "data" / "characters"
        self.prompts_dir = self.project_root / "data" / "prompts"
        self.scenes_dir = self.project_root / "data" / "scenes"
        self.log_dir = self.project_root / "logs"

        logger.info("EngineWrapperを初期化しました")

    def get_available_characters(self) -> List[str]:
        """利用可能なキャラクター一覧を取得"""
        try:
            characters = []
            if self.characters_dir.exists():
                for char_dir in self.characters_dir.iterdir():
                    if char_dir.is_dir() and (char_dir / "immutable.yaml").exists():
                        characters.append(char_dir.name)
            return sorted(characters)
        except Exception as e:
            logger.error(f"キャラクター一覧取得エラー: {e}")
            return []

    def get_available_scenes(self) -> List[Dict[str, str]]:
        """利用可能なシーン一覧を取得"""
        try:
            import yaml

            scenes = []
            if self.scenes_dir.exists():
                for scene_file in self.scenes_dir.glob("*.yaml"):
                    try:
                        with open(scene_file, "r", encoding="utf-8") as f:
                            scene_data = yaml.safe_load(f)

                        scene_info = {
                            "id": scene_file.stem,
                            "name": scene_data.get(
                                "scene_id", scene_file.stem
                            ),  # scene_idを名前として使用
                            "description": scene_data.get(
                                "situation", "説明なし"
                            ),  # situationを説明として使用
                            "file_path": str(scene_file),
                            "location": scene_data.get(
                                "location", ""
                            ),  # locationは別途保持
                        }
                        scenes.append(scene_info)
                    except Exception as e:
                        logger.warning(
                            f"シーンファイル読み込みエラー {scene_file}: {e}"
                        )
                        # エラーがあってもファイル名だけは返す
                        scenes.append(
                            {
                                "id": scene_file.stem,
                                "name": scene_file.stem,  # ファイル名をシーンIDとして使用
                                "description": "読み込みエラー",
                                "file_path": str(scene_file),
                                "location": "",
                            }
                        )

            return sorted(scenes, key=lambda x: x["name"])
        except Exception as e:
            logger.error(f"シーン一覧取得エラー: {e}")
            return []

    async def start_simulation(self, config: SimulationConfig) -> Dict[str, Any]:
        """シミュレーションを開始"""
        try:
            # 重複実行防止：既にエンジンが存在する場合は何もしない
            if self.engine is not None:
                logger.warning("シミュレーションは既に開始されています")
                return {
                    "success": True,
                    "message": "シミュレーションは既に開始されています",
                    "status": self.status,
                }

            # 既に実行中の場合は何もしない
            if self.status == SimulationStatus.RUNNING:
                logger.warning(f"シミュレーションは既に実行中です")
                return {
                    "success": True,
                    "message": "シミュレーションは既に実行中です",
                    "status": self.status,
                }

            # 必要に応じてリセット
            if self.status not in [SimulationStatus.NOT_STARTED, SimulationStatus.IDLE]:
                logger.info(
                    f"シミュレーションが{self.status}状態のため、リセットします"
                )
                await self.reset_simulation()

            # 利用可能なシーンファイルを取得
            available_scenes = self.get_available_scenes()
            if not available_scenes:
                raise EngineWrapperError("利用可能なシーンファイルがありません")

            # シーンファイルを選択（設定で指定されていればそれを使用、なければデフォルト）
            scene_id = getattr(config, "scene_id", None) or available_scenes[0]["id"]
            scene_file_path = self.scenes_dir / f"{scene_id}.yaml"

            if not scene_file_path.exists():
                raise EngineWrapperError(
                    f"シーンファイルが見つかりません: {scene_file_path}"
                )

            # LLMモデル名を構築
            if config.llm_provider == LLMProvider.OPENAI:
                llm_model = config.model_name
            elif config.llm_provider == LLMProvider.GEMINI:
                llm_model = config.model_name
            else:
                raise EngineWrapperError(
                    f"サポートされていないLLMプロバイダー: {config.llm_provider}"
                )

            # SimulationEngineを初期化
            self.engine = SimulationEngine(
                scene_file_path=str(scene_file_path),
                characters_dir=str(self.characters_dir),
                prompts_dir=str(self.prompts_dir),
                log_dir=str(self.log_dir),
                llm_model=llm_model,
                debug=False,
            )

            # シミュレーションセットアップ
            if not self.engine.start_simulation_setup():
                raise EngineWrapperError("シミュレーションのセットアップに失敗しました")

            # 手動制御のため、セットアップ後はIDLE状態にする
            self.status = SimulationStatus.IDLE
            self.current_config = config

            logger.info(
                f"シミュレーションを開始しました: {config.character_name}, 状態: {self.status}"
            )

            return {
                "success": True,
                "message": "シミュレーションを開始しました",
                "status": self.status,
            }

        except Exception as e:
            self.status = SimulationStatus.ERROR
            error_msg = f"シミュレーション開始エラー: {str(e)}"
            logger.error(error_msg)

            return {"success": False, "message": error_msg, "status": self.status}

    async def execute_next_turn(self) -> Dict[str, Any]:
        """次のターンを実行"""
        try:
            logger.info(
                f"execute_next_turn開始: engine={self.engine is not None}, status={self.status}"
            )

            if not self.engine:
                raise EngineWrapperError(
                    "シミュレーションエンジンが初期化されていません"
                )

            if self.status not in [SimulationStatus.IDLE, SimulationStatus.RUNNING]:
                raise EngineWrapperError(
                    f"シミュレーションが実行可能な状態ではありません: {self.status}"
                )

            logger.info(f"ターン実行開始: 現在の状態={self.status}")

            # ターン実行中はRUNNING状態にする
            self.status = SimulationStatus.RUNNING

            # ターンを実行
            if self.engine.execute_one_turn():
                # ターン実行後は一時停止状態にする（手動制御のため）
                self.status = SimulationStatus.IDLE

                # 最新のターンデータを取得
                turn_data = self.engine._current_scene_log.turns[-1]

                return {
                    "success": True,
                    "message": "ターンを実行しました",
                    "turn_data": {
                        "turn_number": turn_data.turn_number,
                        "character_name": turn_data.character_name,
                        "think": turn_data.think,
                        "act": turn_data.act,
                        "talk": turn_data.talk,
                    },
                }
            else:
                # シミュレーション終了
                self.status = SimulationStatus.COMPLETED

                return {
                    "success": True,
                    "message": "シミュレーションが完了しました",
                    "status": self.status,
                }

        except Exception as e:
            self.status = SimulationStatus.ERROR
            error_msg = f"ターン実行エラー: {str(e)}"
            logger.error(error_msg)

            return {"success": False, "message": error_msg}

    def get_simulation_state(self) -> SimulationState:
        """現在のシミュレーション状態を取得"""
        try:
            if not self.engine or not self.current_config:
                return SimulationState(
                    status=self.status,
                    current_step=0,
                    total_steps=None,
                    character_name="",
                    scene_name=None,
                    timeline=[],
                    config=SimulationConfig(
                        character_name="",
                        llm_provider=LLMProvider.GEMINI,
                        model_name="gemini-1.5-flash",
                        max_steps=10,
                        max_turns=10,
                        temperature=0.7,
                        max_tokens=1000,
                        characters_dir="data/characters",
                        immutable_config_path="data/immutable.yaml",
                        long_term_config_path="data/long_term.yaml",
                    ),
                )

            # エンジンから状態を取得
            engine_status = self.engine.get_simulation_status()

            # シーン名を取得
            scene_name = None
            if hasattr(self.engine, "_current_scene") and self.engine._current_scene:
                # SceneInfoDataからlocationを取得してシーン名として使用
                scene_name = getattr(self.engine._current_scene, "location", None)

            # シーン名が取得できない場合は、シーンファイル名から推測
            if not scene_name and hasattr(self.engine, "scene_file_path"):
                scene_file_path = Path(self.engine.scene_file_path)
                scene_name = scene_file_path.stem

            # タイムラインを構築
            timeline = []
            current_scene = None

            # エンジンが存在し、シーンログがある場合
            if (
                self.engine
                and hasattr(self.engine, "_current_scene_log")
                and self.engine._current_scene_log
            ):
                # タイムライン情報を構築
                if self.engine._current_scene_log.turns:
                    for turn in self.engine._current_scene_log.turns:
                        timeline.append(
                            TimelineEntry(
                                step=turn.turn_number,
                                timestamp=datetime.now().isoformat(),  # 実際のタイムスタンプがない場合
                                character=turn.character_name,
                                action_type="turn",
                                content=f"思考: {turn.think}\n行動: {turn.act}\n発言: {turn.talk}",
                                metadata={
                                    "think": turn.think,
                                    "act": turn.act,
                                    "talk": turn.talk,
                                },
                                is_intervention=False,
                            )
                        )

                # 介入記録をタイムラインに追加
                if hasattr(self, "_intervention_timeline"):
                    logger.info(
                        f"介入タイムライン件数: {len(self._intervention_timeline)}"
                    )
                    for intervention in self._intervention_timeline:
                        timeline.append(
                            TimelineEntry(
                                step=intervention["step"],
                                timestamp=intervention["timestamp"],
                                character=intervention.get("target_character")
                                or "システム",
                                action_type="intervention",
                                content=f"[{intervention['intervention_type']}] {intervention['content']}",
                                metadata={
                                    "intervention_type": intervention[
                                        "intervention_type"
                                    ],
                                    "target_character": intervention.get(
                                        "target_character"
                                    ),
                                },
                                is_intervention=True,
                            )
                        )
                else:
                    logger.info("介入タイムラインが存在しません")

                # ステップ順にソート
                timeline.sort(key=lambda x: (x.step, 0 if not x.is_intervention else 1))

                # 現在のシーン情報を構築
                scene_info = self.engine._current_scene_log.scene_info
                current_scene = {
                    "scene_id": scene_info.scene_id,
                    "scene_name": scene_info.location
                    or scene_info.scene_id,  # locationをscene_nameとして使用
                    "participant_character_ids": scene_info.participant_character_ids,
                    "situation": scene_info.situation,
                    "location": scene_info.location,
                    "time": scene_info.time,
                }

            return SimulationState(
                status=self.status,
                current_step=engine_status.get("turns_completed", 0),
                total_steps=None,  # 無制限
                character_name=self.current_config.character_name,
                scene_name=scene_name,
                timeline=timeline,
                config=self.current_config,
                current_scene=current_scene,  # 現在のシーン情報を追加
            )

        except Exception as e:
            logger.error(f"シミュレーション状態取得エラー: {e}")
            return SimulationState(
                status=SimulationStatus.ERROR,
                current_step=0,
                total_steps=None,
                character_name="",
                scene_name=None,
                timeline=[],
                config=SimulationConfig(
                    character_name="",
                    llm_provider=LLMProvider.GEMINI,
                    model_name="gemini-1.5-flash",
                ),
            )

    async def process_intervention(
        self,
        intervention_type: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """介入を処理"""
        try:
            # シミュレーションが実行中またはアイドル状態でない場合はエラー
            if not self.engine or self.status not in [
                SimulationStatus.RUNNING,
                SimulationStatus.IDLE,
            ]:
                raise EngineWrapperError("シミュレーションが実行されていません")

            # 介入コマンドを構築
            if intervention_type == "update_situation":
                command = f"update_situation {content}"
                intervention_display_type = "全体向け介入"
                target_character = None
            elif intervention_type == "give_revelation":
                # metadataからtarget_characterを取得
                target_character = (
                    metadata.get("target_character") if metadata else None
                )
                if not target_character:
                    raise EngineWrapperError(
                        "キャラクター向け介入にはtarget_characterが必要です"
                    )

                # コマンドを正しく構築（キャラクターID + スペース + 内容）
                command = f"give_revelation {target_character} {content}"
                intervention_display_type = "キャラクター向け介入"
            elif intervention_type == "add_character":
                command = f"add_character {content}"
                intervention_display_type = "キャラクター追加"
                target_character = None
            elif intervention_type == "remove_character":
                command = f"remove_character {content}"
                intervention_display_type = "キャラクター削除"
                target_character = content
            elif intervention_type == "end_scene":
                command = "end_scene"
                intervention_display_type = "シーン終了"
                target_character = None
            else:
                raise EngineWrapperError(
                    f"サポートされていない介入タイプ: {intervention_type}"
                )

            # 介入を実行
            success, message = self.engine.process_intervention_command(command)

            if success:
                # 介入記録をタイムラインに追加
                self._add_intervention_to_timeline(
                    intervention_display_type, content, target_character
                )

                return {"success": True, "message": message}
            else:
                return {"success": False, "message": message}

        except Exception as e:
            error_msg = f"介入処理エラー: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}

    def _add_intervention_to_timeline(
        self,
        intervention_type: str,
        content: str,
        target_character: Optional[str] = None,
    ):
        """介入記録をタイムラインに追加"""
        try:
            if not hasattr(self, "_intervention_timeline"):
                self._intervention_timeline = []
                logger.info("介入タイムラインを初期化しました")

            # 現在のステップ数を取得
            current_step = 0
            if (
                self.engine
                and hasattr(self.engine, "_current_scene_log")
                and self.engine._current_scene_log
            ):
                current_step = len(self.engine._current_scene_log.turns)
                logger.info(f"現在のステップ数: {current_step}")

            # 介入記録を作成
            intervention_record = {
                "step": current_step,
                "timestamp": datetime.now().isoformat(),
                "intervention_type": intervention_type,
                "content": content,
                "target_character": target_character,
                "is_intervention": True,
            }

            self._intervention_timeline.append(intervention_record)
            logger.info(f"介入記録をタイムラインに追加: {intervention_record}")
            logger.info(
                f"現在の介入タイムライン件数: {len(self._intervention_timeline)}"
            )

        except Exception as e:
            logger.error(f"介入記録の追加に失敗: {e}")

    async def stop_simulation(self) -> Dict[str, Any]:
        """シミュレーションを停止"""
        try:
            logger.info(
                f"シミュレーション停止要求: 現在のステータス={self.status}, エンジン存在={self.engine is not None}"
            )

            # エンジンが存在し、実行中またはアイドル状態の場合は履歴を保存
            if self.engine and self.status in [
                SimulationStatus.RUNNING,
                SimulationStatus.IDLE,
            ]:
                logger.info(
                    f"シミュレーション停止処理開始: 現在のステータス={self.status}"
                )

                # シーンログの存在確認
                if (
                    hasattr(self.engine, "_current_scene_log")
                    and self.engine._current_scene_log
                ):
                    turn_count = len(self.engine._current_scene_log.turns)
                    logger.info(f"保存対象のシーンログ: ターン数={turn_count}")
                else:
                    logger.warning("シーンログが存在しません")

                # 履歴保存のためにend_simulationを呼び出し
                try:
                    self.engine.end_simulation()
                    logger.info("シミュレーション履歴の保存が完了しました")
                except Exception as e:
                    logger.error(f"履歴保存中にエラーが発生しました: {e}")
                    # エラーが発生しても停止処理は続行
            else:
                logger.info(
                    f"履歴保存をスキップ: エンジン存在={self.engine is not None}, ステータス={self.status}"
                )

            # 状態をリセット
            self.status = SimulationStatus.NOT_STARTED
            self.engine = None
            self.current_config = None

            # 介入タイムラインもクリア
            if hasattr(self, "_intervention_timeline"):
                self._intervention_timeline = []

            logger.info("シミュレーション停止処理が完了しました")

            return {
                "success": True,
                "message": "シミュレーションを停止しました",
                "status": self.status,
            }

        except Exception as e:
            error_msg = f"シミュレーション停止エラー: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}

    async def reset_simulation(self) -> Dict[str, Any]:
        """シミュレーション状態を強制的にリセット"""
        try:
            # エンジンが存在し、実行中またはアイドル状態の場合は履歴を保存
            if self.engine and self.status in [
                SimulationStatus.RUNNING,
                SimulationStatus.IDLE,
            ]:
                logger.info(
                    f"シミュレーションリセット処理開始: 現在のステータス={self.status}"
                )

                # 履歴保存のためにend_simulationを呼び出し
                try:
                    self.engine.end_simulation()
                    logger.info("シミュレーション履歴の保存が完了しました")
                except Exception as e:
                    logger.warning(
                        f"履歴保存時にエラーが発生しましたが、リセットを続行します: {e}"
                    )

            # 状態を強制的にリセット
            self.status = SimulationStatus.NOT_STARTED
            self.engine = None
            self.current_config = None

            # 介入タイムラインもクリア
            if hasattr(self, "_intervention_timeline"):
                self._intervention_timeline = []

            logger.info("シミュレーション状態を強制的にリセットしました")

            return {
                "success": True,
                "message": "シミュレーション状態をリセットしました",
                "status": self.status,
            }

        except Exception as e:
            error_msg = f"シミュレーションリセットエラー: {str(e)}"
            logger.error(error_msg)
            # エラーが発生してもリセットは実行
            self.status = SimulationStatus.NOT_STARTED
            self.engine = None
            self.current_config = None
            # 介入タイムラインもクリア
            if hasattr(self, "_intervention_timeline"):
                self._intervention_timeline = []
            return {"success": False, "message": error_msg}

    async def update_llm_model(
        self, llm_provider: LLMProvider, model_name: str
    ) -> Dict[str, Any]:
        """LLMモデルを更新"""
        try:
            if not self.engine or not self.current_config:
                raise EngineWrapperError("シミュレーションが実行されていません")

            # LLMアダプターのモデルを更新
            if llm_provider == LLMProvider.OPENAI:
                new_model = model_name
            elif llm_provider == LLMProvider.GEMINI:
                new_model = model_name
            else:
                raise EngineWrapperError(
                    f"サポートされていないLLMプロバイダー: {llm_provider}"
                )

            # エンジンのLLMアダプターを更新
            self.engine.llm_adapter.model_name = new_model

            # 設定を更新
            self.current_config.llm_provider = llm_provider
            self.current_config.model_name = model_name

            return {
                "success": True,
                "message": f"LLMモデルを {llm_provider}:{model_name} に更新しました",
            }

        except Exception as e:
            error_msg = f"LLMモデル更新エラー: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "message": error_msg}


# グローバルインスタンス
engine_wrapper = EngineWrapper()
