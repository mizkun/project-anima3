from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, Response
import json
import zipfile
import io
import os
from datetime import datetime
from typing import Dict, Any, List
import yaml
from web.backend.services.engine_wrapper import EngineWrapper

router = APIRouter()


@router.get("/simulation")
async def export_simulation():
    """現在のシミュレーション結果をJSON形式でエクスポート"""
    try:
        # シミュレーション状態を取得
        engine = EngineWrapper()
        status = engine.get_status()

        # エクスポート用データを構築
        export_data = {
            "export_info": {
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "type": "simulation_result",
            },
            "simulation": {
                "status": status["status"],
                "current_step": status["current_step"],
                "total_steps": status["total_steps"],
                "character_name": status["character_name"],
                "scene_name": status["scene_name"],
                "config": status["config"],
            },
            "timeline": status["timeline"],
        }

        return JSONResponse(
            content=export_data,
            headers={
                "Content-Disposition": f"attachment; filename=simulation_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"エクスポートに失敗しました: {str(e)}"
        )


@router.get("/project")
async def export_project():
    """プロジェクト全体をZIP形式でエクスポート"""
    try:
        # ZIPファイルをメモリ上に作成
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            # データディレクトリの内容を追加
            data_dirs = ["data/characters", "data/scenes", "data/prompts"]

            for data_dir in data_dirs:
                if os.path.exists(data_dir):
                    for root, dirs, files in os.walk(data_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, ".")
                            zip_file.write(file_path, arcname)

            # 設定ファイルを追加
            config_files = ["data/immutable.yaml", "data/long_term.yaml"]
            for config_file in config_files:
                if os.path.exists(config_file):
                    zip_file.write(config_file, config_file)

            # エクスポート情報を追加
            export_info = {
                "export_info": {
                    "timestamp": datetime.now().isoformat(),
                    "version": "1.0.0",
                    "type": "project_backup",
                },
                "project_name": "Project Anima",
                "description": "Complete project backup including characters, scenes, and prompts",
            }

            zip_file.writestr(
                "export_info.json",
                json.dumps(export_info, indent=2, ensure_ascii=False),
            )

        zip_buffer.seek(0)

        return Response(
            content=zip_buffer.getvalue(),
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=project_anima_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            },
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"プロジェクトエクスポートに失敗しました: {str(e)}"
        )


@router.get("/timeline/{format}")
async def export_timeline(format: str):
    """タイムラインを指定された形式でエクスポート"""
    try:
        engine = EngineWrapper()
        status = engine.get_status()
        timeline = status["timeline"]

        if format.lower() == "json":
            export_data = {
                "export_info": {
                    "timestamp": datetime.now().isoformat(),
                    "version": "1.0.0",
                    "type": "timeline_export",
                    "format": "json",
                },
                "scene_info": {
                    "scene_name": status["scene_name"],
                    "character_name": status["character_name"],
                },
                "timeline": timeline,
            }

            return JSONResponse(
                content=export_data,
                headers={
                    "Content-Disposition": f"attachment; filename=timeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                },
            )

        elif format.lower() == "txt":
            # テキスト形式でエクスポート
            text_content = f"Project Anima - Timeline Export\n"
            text_content += (
                f"Export Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            )
            text_content += f"Scene: {status['scene_name']}\n"
            text_content += f"Character: {status['character_name']}\n"
            text_content += "=" * 50 + "\n\n"

            for entry in timeline:
                text_content += f"Step {entry['step']} - {entry['character']}\n"
                text_content += f"Time: {entry['timestamp']}\n"

                if "metadata" in entry:
                    metadata = entry["metadata"]
                    if "think" in metadata and metadata["think"]:
                        text_content += f"思考: {metadata['think']}\n"
                    if "act" in metadata and metadata["act"]:
                        text_content += f"行動: {metadata['act']}\n"
                    if "talk" in metadata and metadata["talk"]:
                        text_content += f"発言: {metadata['talk']}\n"

                text_content += "-" * 30 + "\n\n"

            return Response(
                content=text_content.encode("utf-8"),
                media_type="text/plain; charset=utf-8",
                headers={
                    "Content-Disposition": f"attachment; filename=timeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
                },
            )

        else:
            raise HTTPException(
                status_code=400, detail=f"サポートされていない形式です: {format}"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"タイムラインエクスポートに失敗しました: {str(e)}"
        )


@router.get("/formats")
async def get_export_formats():
    """利用可能なエクスポート形式の一覧を取得"""
    return {
        "simulation": {
            "formats": ["json"],
            "description": "現在のシミュレーション結果をエクスポート",
        },
        "project": {
            "formats": ["zip"],
            "description": "プロジェクト全体をバックアップ",
        },
        "timeline": {
            "formats": ["json", "txt"],
            "description": "タイムラインを指定形式でエクスポート",
        },
    }
