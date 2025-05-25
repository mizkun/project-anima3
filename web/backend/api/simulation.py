"""
シミュレーション制御用のAPIエンドポイント
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from ..services.engine_wrapper import engine_wrapper
from .models import (
    SimulationStartRequest,
    SimulationResponse,
    SimulationState,
    InterventionRequest,
    LLMProvider,
    ErrorResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/simulation", tags=["simulation"])


@router.get("/status", response_model=SimulationState)
async def get_simulation_status():
    """現在のシミュレーション状態を取得"""
    try:
        state = engine_wrapper.get_simulation_state()
        return state
    except Exception as e:
        logger.error(f"シミュレーション状態取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start", response_model=SimulationResponse)
async def start_simulation(request: SimulationStartRequest):
    """シミュレーションを開始"""
    try:
        result = await engine_wrapper.start_simulation(request.config)

        if result["success"]:
            return SimulationResponse(
                status=result["status"],
                message=result["message"],
                data={"config": request.config.dict()},
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"シミュレーション開始エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/next", response_model=SimulationResponse)
async def execute_next_turn():
    """次のターンを実行"""
    try:
        result = await engine_wrapper.execute_next_turn()

        if result["success"]:
            return SimulationResponse(
                status=engine_wrapper.status,
                message=result["message"],
                data=result.get("turn_data"),
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"ターン実行エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop", response_model=SimulationResponse)
async def stop_simulation():
    """シミュレーションを停止"""
    try:
        result = await engine_wrapper.stop_simulation()

        return SimulationResponse(status=result["status"], message=result["message"])

    except Exception as e:
        logger.error(f"シミュレーション停止エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/intervene", response_model=SimulationResponse)
async def process_intervention(request: InterventionRequest):
    """介入を処理"""
    try:
        result = await engine_wrapper.process_intervention(
            request.intervention_type, request.content, request.metadata
        )

        if result["success"]:
            return SimulationResponse(
                status=engine_wrapper.status, message=result["message"]
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"介入処理エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/llm-model", response_model=SimulationResponse)
async def update_llm_model(llm_provider: LLMProvider, model_name: str):
    """LLMモデルを更新"""
    try:
        result = await engine_wrapper.update_llm_model(llm_provider, model_name)

        if result["success"]:
            return SimulationResponse(
                status=engine_wrapper.status,
                message=result["message"],
                data={"llm_provider": llm_provider, "model_name": model_name},
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])

    except Exception as e:
        logger.error(f"LLMモデル更新エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/characters", response_model=List[str])
async def get_available_characters():
    """利用可能なキャラクター一覧を取得"""
    try:
        characters = engine_wrapper.get_available_characters()
        return characters
    except Exception as e:
        logger.error(f"キャラクター一覧取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenes", response_model=List[str])
async def get_available_scenes():
    """利用可能なシーン一覧を取得"""
    try:
        scenes = engine_wrapper.get_available_scenes()
        return scenes
    except Exception as e:
        logger.error(f"シーン一覧取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "simulation_status": engine_wrapper.status,
        "timestamp": "2024-01-01T00:00:00Z",  # 実際のタイムスタンプに置き換え
    }
