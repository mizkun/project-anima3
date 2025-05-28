"""
API用のPydanticモデル定義
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from enum import Enum


class SimulationStatus(str, Enum):
    """シミュレーション状態"""

    NOT_STARTED = "not_started"
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"


class LLMProvider(str, Enum):
    """LLMプロバイダー"""

    OPENAI = "openai"
    GEMINI = "gemini"


class SimulationConfig(BaseModel):
    """シミュレーション設定"""

    character_name: Optional[str] = ""
    scene_id: Optional[str] = None
    llm_provider: LLMProvider
    model_name: str
    max_steps: Optional[int] = None
    max_turns: Optional[int] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    characters_dir: Optional[str] = "data/characters"
    immutable_config_path: Optional[str] = "data/immutable.yaml"
    long_term_config_path: Optional[str] = "data/long_term.yaml"


class SimulationStartRequest(BaseModel):
    """シミュレーション開始リクエスト"""

    config: SimulationConfig


class SimulationResponse(BaseModel):
    """シミュレーション応答"""

    success: bool
    status: SimulationStatus
    message: str
    data: Optional[Dict[str, Any]] = None


class TimelineEntry(BaseModel):
    """タイムラインエントリ"""

    step: int
    timestamp: str
    character: str
    action_type: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    is_intervention: bool = False  # 介入記録かどうか


class SimulationState(BaseModel):
    """シミュレーション状態"""

    status: SimulationStatus
    current_step: int
    total_steps: Optional[int]
    character_name: str
    scene_name: Optional[str] = None
    timeline: List[TimelineEntry]
    config: SimulationConfig
    current_scene: Optional[Dict[str, Any]] = None


class InterventionRequest(BaseModel):
    """介入リクエスト"""

    intervention_type: str
    content: str
    metadata: Optional[Dict[str, Any]] = None


class FileContent(BaseModel):
    """ファイル内容"""

    path: str
    content: str
    encoding: str = "utf-8"


class FileUpdateRequest(BaseModel):
    """ファイル更新リクエスト"""

    path: str
    content: str


class ErrorResponse(BaseModel):
    """エラー応答"""

    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class InterventionRecord(BaseModel):
    """介入記録"""

    intervention_type: str
    content: str
    target_character: Optional[str] = None
    timestamp: str
    step: int
