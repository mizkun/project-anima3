/**
 * WebSocket 通信フック
 */
import { useEffect, useRef, useCallback } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import type { WebSocketMessage } from '../types/simulation';

const WS_URL = 'ws://localhost:8000/ws';
const RECONNECT_INTERVAL = 3000; // 3秒
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000; // 30秒

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManuallyClosedRef = useRef(false);

  const { setUIState, handleWebSocketMessage } = useSimulationStore();

  // WebSocket接続
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket接続が確立されました');
        setUIState({ isConnected: true, error: null });
        reconnectAttemptsRef.current = 0;

        // Ping送信を開始
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString(),
            }));
          }
        }, PING_INTERVAL);

        // 更新通知を購読
        ws.send(JSON.stringify({
          type: 'subscribe_updates',
          timestamp: new Date().toISOString(),
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocketメッセージ受信:', message);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocketメッセージパースエラー:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket接続が閉じられました:', event.code, event.reason);
        setUIState({ isConnected: false });

        // Ping送信を停止
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // 手動で閉じられた場合は再接続しない
        if (isManuallyClosedRef.current) {
          isManuallyClosedRef.current = false;
          return;
        }

        // 自動再接続
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`WebSocket再接続試行 ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        } else {
          console.error('WebSocket再接続の最大試行回数に達しました');
          setUIState({ 
            error: 'サーバーとの接続が失われました。ページを再読み込みしてください。' 
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocketエラー:', error);
        setUIState({ 
          error: 'WebSocket接続エラーが発生しました' 
        });
      };

    } catch (error) {
      console.error('WebSocket接続失敗:', error);
      setUIState({ 
        isConnected: false,
        error: 'WebSocket接続に失敗しました' 
      });
    }
  }, [setUIState, handleWebSocketMessage]);

  // WebSocket切断
  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setUIState({ isConnected: false });
  }, [setUIState]);

  // メッセージ送信
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageWithTimestamp: WebSocketMessage = {
        ...message,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(messageWithTimestamp));
      return true;
    } else {
      console.warn('WebSocket接続が確立されていません');
      return false;
    }
  }, []);

  // 状態取得リクエスト
  const requestStatus = useCallback(() => {
    return sendMessage({
      type: 'get_status',
      data: {},
    });
  }, [sendMessage]);

  // 手動再接続
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // 接続状態取得
  const getConnectionState = useCallback(() => {
    return wsRef.current?.readyState || WebSocket.CLOSED;
  }, []);

  // 接続状態の文字列表現
  const getConnectionStateString = useCallback(() => {
    const state = getConnectionState();
    switch (state) {
      case WebSocket.CONNECTING:
        return '接続中';
      case WebSocket.OPEN:
        return '接続済み';
      case WebSocket.CLOSING:
        return '切断中';
      case WebSocket.CLOSED:
        return '切断済み';
      default:
        return '不明';
    }
  }, [getConnectionState]);

  // コンポーネントマウント時に接続
  useEffect(() => {
    connect();

    // クリーンアップ
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // ページ離脱時の処理
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [disconnect]);

  return {
    // 接続制御
    connect,
    disconnect,
    reconnect,
    
    // メッセージ送信
    sendMessage,
    requestStatus,
    
    // 状態取得
    getConnectionState,
    getConnectionStateString,
    
    // 接続状態
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}; 