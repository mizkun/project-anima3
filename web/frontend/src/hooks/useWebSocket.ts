import { useEffect, useRef, useCallback, useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import type { WebSocketMessage, TimelineEntry } from '@/types/simulation'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const store = useSimulationStore()

  const maxReconnectAttempts = 5
  const reconnectDelay = 1000 // 1秒

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      switch (message.type) {
        case 'status_update':
          if (message.data.status) {
            store.setStatus(message.data.status)
          }
          if (message.data.current_turn !== undefined) {
            store.setCurrentTurn(message.data.current_turn)
          }
          break

        case 'timeline_update':
          if (message.data.entry) {
            store.addTimelineEntry(message.data.entry as TimelineEntry)
          } else if (message.data.timeline) {
            store.updateTimeline(message.data.timeline)
          }
          break

        case 'error':
          store.setError(message.data.message || 'WebSocket error occurred')
          break

        case 'simulation_complete':
          store.setStatus('completed')
          store.setEndTime(new Date().toISOString())
          if (message.data.timeline) {
            store.updateTimeline(message.data.timeline)
          }
          break

        default:
          console.warn('Unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }, [store])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
        setReconnectAttempts(0)
      }

      ws.onmessage = handleMessage

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setConnected(false)
        
        // 自動再接続（最大試行回数まで）
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, reconnectDelay * Math.pow(2, reconnectAttempts)) // 指数バックオフ
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnected(false)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnected(false)
    }
  }, [handleMessage, reconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setConnected(false)
    setReconnectAttempts(0)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    } else {
      console.warn('WebSocket is not connected')
      return false
    }
  }, [])

  // 自動接続とクリーンアップ
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, []) // connectとdisconnectは依存関係から除外（無限ループ防止）

  // ページの可視性変更時の処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ページが非表示になったら接続を維持（必要に応じて切断）
      } else {
        // ページが表示されたら再接続を試行
        if (!connected && reconnectAttempts < maxReconnectAttempts) {
          connect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connected, reconnectAttempts, connect])

  return {
    connected,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
  }
} 