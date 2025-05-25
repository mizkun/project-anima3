"""
WebSocket接続管理とメッセージ配信

リアルタイム通信のためのWebSocket接続を管理し、
クライアントへのメッセージ配信を行う
"""

import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket接続を管理するクラス"""

    def __init__(self):
        """ConnectionManagerを初期化"""
        self.active_connections: Set[WebSocket] = set()
        self.connection_info: Dict[WebSocket, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket, client_id: str = None):
        """新しいWebSocket接続を受け入れる"""
        await websocket.accept()
        self.active_connections.add(websocket)

        # 接続情報を保存
        self.connection_info[websocket] = {
            "client_id": client_id or f"client_{len(self.active_connections)}",
            "connected_at": datetime.now().isoformat(),
            "last_ping": datetime.now().isoformat(),
        }

        logger.info(
            f"WebSocket接続を受け入れました: {self.connection_info[websocket]['client_id']}"
        )

        # 接続確認メッセージを送信
        await self.send_personal_message(
            websocket,
            {
                "type": "connection_established",
                "data": {
                    "client_id": self.connection_info[websocket]["client_id"],
                    "server_time": datetime.now().isoformat(),
                },
                "timestamp": datetime.now().isoformat(),
            },
        )

    def disconnect(self, websocket: WebSocket):
        """WebSocket接続を切断する"""
        if websocket in self.active_connections:
            client_info = self.connection_info.get(websocket, {})
            client_id = client_info.get("client_id", "unknown")

            self.active_connections.remove(websocket)
            if websocket in self.connection_info:
                del self.connection_info[websocket]

            logger.info(f"WebSocket接続を切断しました: {client_id}")

    async def send_personal_message(
        self, websocket: WebSocket, message: Dict[str, Any]
    ):
        """特定のWebSocket接続にメッセージを送信"""
        try:
            if websocket in self.active_connections:
                await websocket.send_text(json.dumps(message, ensure_ascii=False))
        except Exception as e:
            logger.error(f"個人メッセージ送信エラー: {e}")
            # 接続が切れている場合は削除
            self.disconnect(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """全ての接続にメッセージをブロードキャスト"""
        if not self.active_connections:
            logger.debug("ブロードキャスト対象の接続がありません")
            return

        message_text = json.dumps(message, ensure_ascii=False)
        disconnected_connections = []

        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message_text)
            except Exception as e:
                logger.error(f"ブロードキャストエラー: {e}")
                disconnected_connections.append(connection)

        # 切断された接続を削除
        for connection in disconnected_connections:
            self.disconnect(connection)

        logger.debug(
            f"メッセージをブロードキャストしました: {len(self.active_connections)}接続"
        )

    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        """特定のクライアントIDにメッセージを送信"""
        target_websocket = None
        for websocket, info in self.connection_info.items():
            if info.get("client_id") == client_id:
                target_websocket = websocket
                break

        if target_websocket:
            await self.send_personal_message(target_websocket, message)
        else:
            logger.warning(f"クライアントID '{client_id}' が見つかりません")

    def get_connection_count(self) -> int:
        """アクティブな接続数を取得"""
        return len(self.active_connections)

    def get_connection_info(self) -> List[Dict[str, Any]]:
        """全ての接続情報を取得"""
        return [
            {
                "client_id": info["client_id"],
                "connected_at": info["connected_at"],
                "last_ping": info["last_ping"],
            }
            for info in self.connection_info.values()
        ]

    async def handle_ping(self, websocket: WebSocket):
        """Pingメッセージを処理"""
        if websocket in self.connection_info:
            self.connection_info[websocket]["last_ping"] = datetime.now().isoformat()

            await self.send_personal_message(
                websocket,
                {
                    "type": "pong",
                    "data": {"server_time": datetime.now().isoformat()},
                    "timestamp": datetime.now().isoformat(),
                },
            )


# グローバルインスタンス
manager = ConnectionManager()


async def websocket_callback(message: Dict[str, Any]):
    """
    EngineWrapperからのコールバック関数

    シミュレーションの状態変更をWebSocketクライアントに通知する
    """
    await manager.broadcast(message)
