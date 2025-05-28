"""
シミュレーション制御用のAPIエンドポイント
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse

from web.backend.services.engine_wrapper import engine_wrapper
from web.backend.api.models import (
    SimulationStartRequest,
    SimulationResponse,
    SimulationState,
    InterventionRequest,
    LLMProvider,
    ErrorResponse,
    SimulationStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["simulation"])


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
        logger.info(f"シミュレーション開始リクエスト: {request.config}")
        result = await engine_wrapper.start_simulation(request.config)

        if result["success"]:
            return SimulationResponse(
                success=True,
                status=result["status"],
                message=result["message"],
                data={"config": request.config.dict()},
            )
        else:
            # エラーの場合もstatusを含める
            status = result.get("status", "error")
            return SimulationResponse(
                success=False,
                status=status,
                message=result["message"],
            )

    except Exception as e:
        logger.error(f"シミュレーション開始エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/next-turn", response_model=SimulationResponse)
async def execute_next_turn():
    """次のターンを実行"""
    try:
        result = await engine_wrapper.execute_next_turn()

        if result["success"]:
            return SimulationResponse(
                success=True,
                status=engine_wrapper.status,
                message=result["message"],
                data=result.get("turn_data"),
            )
        else:
            return SimulationResponse(
                success=False,
                status=engine_wrapper.status,
                message=result["message"],
            )

    except Exception as e:
        logger.error(f"ターン実行エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop", response_model=SimulationResponse)
async def stop_simulation():
    """シミュレーションを停止"""
    try:
        result = await engine_wrapper.stop_simulation()

        return SimulationResponse(
            success=True, status=result["status"], message=result["message"]
        )

    except Exception as e:
        logger.error(f"シミュレーション停止エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset", response_model=SimulationResponse)
async def reset_simulation():
    """シミュレーション状態を強制的にリセット"""
    try:
        result = await engine_wrapper.reset_simulation()

        return SimulationResponse(
            success=True, status=result["status"], message=result["message"]
        )

    except Exception as e:
        logger.error(f"シミュレーションリセットエラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/intervention", response_model=SimulationResponse)
async def process_intervention(request: dict):
    """介入を処理"""
    try:
        intervention_type = request.get("type")
        content = request.get("content")

        if not intervention_type or not content:
            raise HTTPException(status_code=400, detail="type and content are required")

        result = await engine_wrapper.process_intervention(intervention_type, content)

        if result["success"]:
            return SimulationResponse(
                success=True,
                status=engine_wrapper.status,
                message=result["message"],
                data={"type": intervention_type, "content": content},
            )
        else:
            return SimulationResponse(
                success=False,
                status=engine_wrapper.status,
                message=result["message"],
            )

    except Exception as e:
        logger.error(f"介入処理エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/model", response_model=SimulationResponse)
async def update_llm_model(request: dict):
    """LLMモデルを更新"""
    try:
        provider = request.get("provider")
        model = request.get("model")

        if not provider or not model:
            raise HTTPException(
                status_code=400, detail="provider and model are required"
            )

        result = await engine_wrapper.update_llm_model(provider, model)

        if result["success"]:
            return SimulationResponse(
                success=True,
                status=engine_wrapper.status,
                message=result["message"],
                data={"provider": provider, "model": model},
            )
        else:
            return SimulationResponse(
                success=False,
                status=engine_wrapper.status,
                message=result["message"],
            )

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


@router.get("/scenes")
async def get_available_scenes():
    """利用可能なシーン一覧を取得"""
    try:
        scenes = engine_wrapper.get_available_scenes()
        return {"scenes": scenes}
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


@router.get("/test-response", response_model=SimulationResponse)
async def test_response():
    """テスト用のレスポンス"""
    return SimulationResponse(
        success=True,
        status=SimulationStatus.IDLE,
        message="テストレスポンス",
        data={"test": "data"},
    )
