"""
シミュレーション制御用のAPIエンドポイント
"""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import os
import json
from datetime import datetime
import glob

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
        target_character = request.get("target_character")

        if not intervention_type or not content:
            raise HTTPException(status_code=400, detail="type and content are required")

        # target_characterが指定されている場合はメタデータに含める
        metadata = {}
        if target_character:
            metadata["target_character"] = target_character

        result = await engine_wrapper.process_intervention(
            intervention_type, content, metadata
        )

        if result["success"]:
            return SimulationResponse(
                success=True,
                status=engine_wrapper.status,
                message=result["message"],
                data={
                    "type": intervention_type,
                    "content": content,
                    "target_character": target_character,
                },
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


@router.get("/history")
async def get_simulation_history():
    """シミュレーション履歴を取得"""
    try:
        logs_dir = "logs"
        if not os.path.exists(logs_dir):
            return {"history": []}

        history = []

        # logsディレクトリ内のsim_*ディレクトリを取得
        sim_dirs = glob.glob(os.path.join(logs_dir, "sim_*"))
        sim_dirs.sort(reverse=True)  # 新しい順にソート

        for sim_dir in sim_dirs:
            if not os.path.isdir(sim_dir):
                continue

            sim_id = os.path.basename(sim_dir)

            # ディレクトリ内のJSONファイルを探す
            json_files = glob.glob(os.path.join(sim_dir, "*.json"))

            if not json_files:
                continue

            # 最初のJSONファイルを読み込んで情報を取得
            try:
                with open(json_files[0], "r", encoding="utf-8") as f:
                    data = json.load(f)

                scene_info = data.get("scene_info", {})
                turns = data.get("turns", [])

                # タイムスタンプをパース
                timestamp_str = sim_id.replace("sim_", "")
                try:
                    timestamp = datetime.strptime(timestamp_str, "%Y%m%d_%H%M%S")
                    formatted_timestamp = timestamp.strftime("%Y-%m-%d %H:%M:%S")
                except:
                    formatted_timestamp = timestamp_str

                history_item = {
                    "id": sim_id,
                    "timestamp": formatted_timestamp,
                    "scene_id": scene_info.get("scene_id", "unknown"),
                    "location": scene_info.get("location", "不明"),
                    "participants": [
                        turn.get("character_name", "不明")
                        for turn in turns
                        if turn.get("character_name")
                    ],
                    "turn_count": len(turns),
                    "status": "completed" if turns else "empty",
                    "file_path": json_files[0],
                }

                # 参加者の重複を除去
                history_item["participants"] = list(set(history_item["participants"]))

                history.append(history_item)

            except Exception as e:
                logger.warning(f"履歴ファイル読み込みエラー {json_files[0]}: {e}")
                continue

        return {"history": history}

    except Exception as e:
        logger.error(f"履歴取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{sim_id}")
async def get_simulation_detail(sim_id: str):
    """特定のシミュレーション履歴の詳細を取得"""
    try:
        logs_dir = "logs"
        sim_dir = os.path.join(logs_dir, sim_id)

        if not os.path.exists(sim_dir):
            raise HTTPException(
                status_code=404, detail="シミュレーションが見つかりません"
            )

        # JSONファイルを探す
        json_files = glob.glob(os.path.join(sim_dir, "*.json"))
        if not json_files:
            raise HTTPException(
                status_code=404, detail="シミュレーションデータが見つかりません"
            )

        # 最初のJSONファイルを読み込み
        with open(json_files[0], "r", encoding="utf-8") as f:
            simulation_data = json.load(f)

        return simulation_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"履歴詳細取得エラー: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/resume/{sim_id}")
async def resume_simulation(sim_id: str):
    """履歴からシミュレーションを再開"""
    try:
        # 現在は模擬的な実装
        # 実際の実装では、履歴データを読み込んでシミュレーションエンジンに設定する
        return {
            "success": True,
            "message": f"シミュレーション {sim_id} の再開機能は開発中です",
            "sim_id": sim_id,
        }

    except Exception as e:
        logger.error(f"シミュレーション再開エラー: {e}")
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
