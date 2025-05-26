from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import os
import json
from pathlib import Path
from datetime import datetime

router = APIRouter(prefix="/files", tags=["files"])

# プロジェクトルートディレクトリ
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent


class FileContent(BaseModel):
    content: str


class CreateFileRequest(BaseModel):
    path: str
    content: str


class FileInfo(BaseModel):
    name: str
    path: str
    content: str
    last_modified: str


class FileListResponse(BaseModel):
    files: List[FileInfo]


@router.get("", response_model=FileListResponse)
async def list_files(
    directory: str = Query(..., description="Directory path to list files from")
):
    """指定されたディレクトリ内のファイル一覧を取得"""
    try:
        # セキュリティ: 許可されたディレクトリのみアクセス可能
        allowed_dirs = ["data/prompts", "data/characters"]
        if directory not in allowed_dirs:
            raise HTTPException(
                status_code=403, detail="Access to this directory is not allowed"
            )

        dir_path = PROJECT_ROOT / directory
        if not dir_path.exists():
            return FileListResponse(files=[])

        files = []
        for file_path in dir_path.rglob("*"):
            if file_path.is_file() and not file_path.name.startswith("."):
                # ファイル拡張子をチェック（テキストファイルのみ）
                allowed_extensions = {".md", ".txt", ".yaml", ".yml", ".json"}
                if file_path.suffix.lower() in allowed_extensions:
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()

                        stat = file_path.stat()
                        last_modified = datetime.fromtimestamp(
                            stat.st_mtime
                        ).isoformat()

                        relative_path = str(file_path.relative_to(PROJECT_ROOT))
                        files.append(
                            FileInfo(
                                name=file_path.name,
                                path=relative_path,
                                content=content,
                                last_modified=last_modified,
                            )
                        )
                    except Exception as e:
                        # ファイル読み込みエラーは無視して続行
                        continue

        return FileListResponse(files=files)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/{file_path:path}", response_model=FileInfo)
async def get_file(file_path: str):
    """指定されたファイルの内容を取得"""
    try:
        # セキュリティチェック
        if ".." in file_path or file_path.startswith("/"):
            raise HTTPException(status_code=403, detail="Invalid file path")

        full_path = PROJECT_ROOT / file_path
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        if not full_path.is_file():
            raise HTTPException(status_code=400, detail="Path is not a file")

        # 許可されたディレクトリ内かチェック
        allowed_dirs = ["data/prompts", "data/characters"]
        if not any(file_path.startswith(allowed_dir) for allowed_dir in allowed_dirs):
            raise HTTPException(
                status_code=403, detail="Access to this file is not allowed"
            )

        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()

        stat = full_path.stat()
        last_modified = datetime.fromtimestamp(stat.st_mtime).isoformat()

        return FileInfo(
            name=full_path.name,
            path=file_path,
            content=content,
            last_modified=last_modified,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")


@router.put("/{file_path:path}")
async def update_file(file_path: str, file_content: FileContent):
    """指定されたファイルの内容を更新"""
    try:
        # セキュリティチェック
        if ".." in file_path or file_path.startswith("/"):
            raise HTTPException(status_code=403, detail="Invalid file path")

        # 許可されたディレクトリ内かチェック
        allowed_dirs = ["data/prompts", "data/characters"]
        if not any(file_path.startswith(allowed_dir) for allowed_dir in allowed_dirs):
            raise HTTPException(
                status_code=403, detail="Access to this file is not allowed"
            )

        full_path = PROJECT_ROOT / file_path

        # ディレクトリが存在しない場合は作成
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # ファイルを保存
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(file_content.content)

        return {"message": "File updated successfully", "path": file_path}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update file: {str(e)}")


@router.post("")
async def create_file(request: CreateFileRequest):
    """新しいファイルを作成"""
    try:
        # セキュリティチェック
        if ".." in request.path or request.path.startswith("/"):
            raise HTTPException(status_code=403, detail="Invalid file path")

        # 許可されたディレクトリ内かチェック
        allowed_dirs = ["data/prompts", "data/characters"]
        if not any(
            request.path.startswith(allowed_dir) for allowed_dir in allowed_dirs
        ):
            raise HTTPException(
                status_code=403, detail="Access to this directory is not allowed"
            )

        full_path = PROJECT_ROOT / request.path

        # ファイルが既に存在する場合はエラー
        if full_path.exists():
            raise HTTPException(status_code=409, detail="File already exists")

        # ディレクトリが存在しない場合は作成
        full_path.parent.mkdir(parents=True, exist_ok=True)

        # ファイルを作成
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(request.content)

        return {"message": "File created successfully", "path": request.path}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create file: {str(e)}")


@router.delete("/{file_path:path}")
async def delete_file(file_path: str):
    """指定されたファイルを削除"""
    try:
        # セキュリティチェック
        if ".." in file_path or file_path.startswith("/"):
            raise HTTPException(status_code=403, detail="Invalid file path")

        # 許可されたディレクトリ内かチェック
        allowed_dirs = ["data/prompts", "data/characters"]
        if not any(file_path.startswith(allowed_dir) for allowed_dir in allowed_dirs):
            raise HTTPException(
                status_code=403, detail="Access to this file is not allowed"
            )

        full_path = PROJECT_ROOT / file_path

        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        if not full_path.is_file():
            raise HTTPException(status_code=400, detail="Path is not a file")

        # ファイルを削除
        full_path.unlink()

        return {"message": "File deleted successfully", "path": file_path}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
