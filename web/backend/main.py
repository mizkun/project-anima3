"""
Project Anima Web UI - FastAPIバックエンド

既存のSimulationEngineをWeb UI経由で操作するためのFastAPIサーバー
"""

import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from web.backend.api.simulation import router as simulation_router
from web.backend.api.files import router as files_router
from web.backend.services.engine_wrapper import engine_wrapper

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
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
    ],  # Reactアプリのデフォルトポート
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターを追加
app.include_router(simulation_router)
app.include_router(files_router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の処理"""
    logger.info("Project Anima Web UI APIを起動しています...")
    logger.info("Project Anima Web UI APIが起動しました")


@app.on_event("shutdown")
async def shutdown_event():
    """アプリケーション終了時の処理"""
    logger.info("Project Anima Web UI APIを終了しています...")

    # 実行中のシミュレーションがあれば停止
    if engine_wrapper.status.value not in ["not_started", "idle"]:
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
        "timestamp": datetime.now().isoformat(),
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP例外ハンドラー"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "error": exc.detail},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """グローバル例外ハンドラー"""
    logger.error(f"予期しないエラーが発生しました: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "内部サーバーエラーが発生しました",
            "error": str(exc),
            "timestamp": datetime.now().isoformat(),
        },
    )


if __name__ == "__main__":
    import uvicorn

    # 開発用サーバーの起動
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
