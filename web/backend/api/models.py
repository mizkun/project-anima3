"""
API用のPydanticモデル定義
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from enum import Enum


class SimulationStatus(str, Enum):
    """シミュレーション状態"""

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

    character_name: str
    llm_provider: LLMProvider
    model_name: str
    max_steps: Optional[int] = None


class SimulationStartRequest(BaseModel):
    """シミュレーション開始リクエスト"""

    config: SimulationConfig


class SimulationResponse(BaseModel):
    """シミュレーション応答"""

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


class SimulationState(BaseModel):
    """シミュレーション状態"""

    status: SimulationStatus
    current_step: int
    total_steps: Optional[int]
    character_name: str
    timeline: List[TimelineEntry]
    config: SimulationConfig


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


class WebSocketMessage(BaseModel):
    """WebSocketメッセージ"""

    type: str
    data: Dict[str, Any]
    timestamp: str


class ErrorResponse(BaseModel):
    """エラー応答"""

    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
