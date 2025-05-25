"""
Project Anima Web UI - FastAPIバックエンド

既存のSimulationEngineをWeb UI経由で操作するためのFastAPIサーバー
"""

import logging
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.simulation import router as simulation_router
from .websocket.manager import manager, websocket_callback
from .services.engine_wrapper import engine_wrapper

# ロギング設定
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# FastAPIアプリケーションの初期化
app = FastAPI(
    title="Project Anima Web UI API",
    description="Project Animaのシミュレーションを制御するWeb API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS設定（開発環境用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],  # Reactアプリのデフォルトポート
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターを追加
app.include_router(simulation_router)


@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の処理"""
    logger.info("Project Anima Web UI APIを起動しています...")

    # EngineWrapperにWebSocketコールバックを登録
    engine_wrapper.add_websocket_callback(websocket_callback)

    logger.info("Project Anima Web UI APIが起動しました")


@app.on_event("shutdown")
async def shutdown_event():
    """アプリケーション終了時の処理"""
    logger.info("Project Anima Web UI APIを終了しています...")

    # 実行中のシミュレーションがあれば停止
    if engine_wrapper.status.value != "idle":
        await engine_wrapper.stop_simulation()
        logger.info("実行中のシミュレーションを停止しました")

    logger.info("Project Anima Web UI APIが終了しました")


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "Project Anima Web UI API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/health")
async def health_check():
    """ヘルスチェックエンドポイント"""
    return {
        "status": "healthy",
        "simulation_status": engine_wrapper.status.value,
        "websocket_connections": manager.get_connection_count(),
        "timestamp": datetime.now().isoformat(),
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocketエンドポイント"""
    client_id = None
    try:
        # クエリパラメータからクライアントIDを取得（オプション）
        client_id = websocket.query_params.get("client_id")

        # 接続を受け入れ
        await manager.connect(websocket, client_id)

        # メッセージループ
        while True:
            try:
                # クライアントからのメッセージを受信
                data = await websocket.receive_text()
                message = json.loads(data)

                message_type = message.get("type")

                if message_type == "ping":
                    # Pingメッセージの処理
                    await manager.handle_ping(websocket)

                elif message_type == "get_status":
                    # 現在の状態を送信
                    state = engine_wrapper.get_simulation_state()
                    await manager.send_personal_message(
                        websocket,
                        {
                            "type": "status_update",
                            "data": state.dict(),
                            "timestamp": datetime.now().isoformat(),
                        },
                    )

                elif message_type == "subscribe_updates":
                    # 更新通知の購読（特に何もしない、接続していれば自動的に通知される）
                    await manager.send_personal_message(
                        websocket,
                        {
                            "type": "subscription_confirmed",
                            "data": {"message": "更新通知を購読しました"},
                            "timestamp": datetime.now().isoformat(),
                        },
                    )

                else:
                    # 未知のメッセージタイプ
                    await manager.send_personal_message(
                        websocket,
                        {
                            "type": "error",
                            "data": {
                                "message": f"未知のメッセージタイプ: {message_type}"
                            },
                            "timestamp": datetime.now().isoformat(),
                        },
                    )

            except json.JSONDecodeError:
                # JSONパースエラー
                await manager.send_personal_message(
                    websocket,
                    {
                        "type": "error",
                        "data": {"message": "無効なJSONフォーマットです"},
                        "timestamp": datetime.now().isoformat(),
                    },
                )

            except Exception as e:
                logger.error(f"WebSocketメッセージ処理エラー: {e}")
                await manager.send_personal_message(
                    websocket,
                    {
                        "type": "error",
                        "data": {"message": f"メッセージ処理エラー: {str(e)}"},
                        "timestamp": datetime.now().isoformat(),
                    },
                )

    except WebSocketDisconnect:
        # 正常な切断
        logger.info(f"WebSocket接続が切断されました: {client_id or 'unknown'}")

    except Exception as e:
        # 予期しないエラー
        logger.error(f"WebSocketエラー: {e}")

    finally:
        # 接続をクリーンアップ
        manager.disconnect(websocket)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """グローバル例外ハンドラー"""
    logger.error(f"予期しないエラーが発生しました: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "内部サーバーエラー",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn

    # 開発用サーバーの起動
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
