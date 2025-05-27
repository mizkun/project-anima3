import { useEffect, useRef, useCallback, useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import type { WebSocketMessage, TimelineEntry } from '@/types/simulation'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

// WebSocket接続状態の型定義
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed'

export const useWebSocket = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const store = useSimulationStore()

  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000 // 1秒
  const maxReconnectDelay = 30000 // 30秒

  // 再接続遅延時間を計算（指数バックオフ + ジッター）
  const getReconnectDelay = useCallback((attempt: number) => {
    const exponentialDelay = Math.min(baseReconnectDelay * Math.pow(2, attempt), maxReconnectDelay)
    const jitter = Math.random() * 1000 // 0-1秒のランダムな遅延
    return exponentialDelay + jitter
  }, [])

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
          const errorMessage = message.data.message || 'WebSocket error occurred'
          store.setError(errorMessage)
          setLastError(errorMessage)
          break

        case 'simulation_complete':
          store.setStatus('completed')
          store.setEndTime(new Date().toISOString())
          if (message.data.timeline) {
            store.updateTimeline(message.data.timeline)
          }
          break

        case 'simulation_reset':
          store.setStatus('idle')
          store.setCurrentTurn(0)
          store.updateTimeline([])
          store.clearError()
          setLastError(null)
          console.log('Simulation state reset')
          break

        case 'simulation_started':
          store.setStatus('running')
          store.setStartTime(new Date().toISOString())
          console.log('Simulation started')
          break

        case 'simulation_stopped':
          store.setStatus('idle')
          store.setEndTime(new Date().toISOString())
          console.log('Simulation stopped')
          break

        case 'turn_completed':
          if (message.data.timeline_entry) {
            store.addTimelineEntry(message.data.timeline_entry as TimelineEntry)
          }
          if (message.data.turn_number) {
            store.setCurrentTurn(message.data.turn_number)
          }
          console.log('Turn completed:', message.data.turn_number)
          break

        default:
          console.warn('Unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
      setLastError('メッセージの解析に失敗しました')
    }
  }, [store])

  const syncSimulationState = useCallback(async () => {
    try {
      const response = await fetch('/api/simulation/status')
      if (response.ok) {
        const state = await response.json()
        store.setStatus(state.status)
        if (state.current_step !== undefined) {
          store.setCurrentTurn(state.current_step)
        }
        if (state.timeline) {
          store.updateTimeline(state.timeline)
        }
        console.log('Simulation state synced:', state.status)
        setLastError(null) // 同期成功時はエラーをクリア
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.warn('Failed to sync simulation state:', error)
      setLastError('状態の同期に失敗しました')
    }
  }, [store])

  const cleanupConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      // イベントリスナーを削除してから閉じる
      wsRef.current.onopen = null
      wsRef.current.onmessage = null
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      
      if (wsRef.current.readyState === WebSocket.OPEN || 
          wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close()
      }
      wsRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    
    // 既に接続中または接続済みの場合は何もしない
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    setConnectionState('connecting')
    cleanupConnection()

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      // 接続タイムアウトを設定
      const connectTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close()
          setLastError('接続がタイムアウトしました')
        }
      }, 10000) // 10秒でタイムアウト

      ws.onopen = () => {
        clearTimeout(connectTimeout)
        if (!mountedRef.current) return
        
        console.log('WebSocket connected')
        setConnectionState('connected')
        setReconnectAttempts(0)
        setLastError(null)
        
        // 接続時に状態を同期
        syncSimulationState()
      }

      ws.onmessage = handleMessage

      ws.onclose = (event) => {
        clearTimeout(connectTimeout)
        if (!mountedRef.current) return
        
        console.log('WebSocket disconnected:', event.code, event.reason)
        setConnectionState('disconnected')
        
        // 正常な切断（1000）以外は再接続を試行
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          setConnectionState('reconnecting')
          const delay = getReconnectDelay(reconnectAttempts)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, delay)
          
          console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionState('failed')
          setLastError('最大再接続回数に達しました')
        }
      }

      ws.onerror = (error) => {
        clearTimeout(connectTimeout)
        if (!mountedRef.current) return
        
        console.error('WebSocket error:', error)
        setLastError('WebSocket接続エラーが発生しました')
      }
    } catch (error) {
      if (!mountedRef.current) return
      console.error('Failed to create WebSocket connection:', error)
      setConnectionState('failed')
      setLastError('WebSocket接続の作成に失敗しました')
    }
  }, [handleMessage, reconnectAttempts, syncSimulationState, cleanupConnection, getReconnectDelay])

  const disconnect = useCallback(() => {
    setConnectionState('disconnected')
    setReconnectAttempts(0)
    setLastError(null)
    cleanupConnection()
  }, [cleanupConnection])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        setLastError('メッセージの送信に失敗しました')
        return false
      }
    } else {
      console.warn('WebSocket is not connected')
      setLastError('WebSocketが接続されていません')
      return false
    }
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    setTimeout(() => {
      if (mountedRef.current) {
        connect()
      }
    }, 100)
  }, [disconnect, connect])

  // 初回接続
  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      cleanupConnection()
    }
  }, []) // 空の依存配列で初回のみ実行

  // ページの可視性変更時の処理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!mountedRef.current) return
      
      if (document.visibilityState === 'visible') {
        // ページが表示されたときに接続状態をチェック
        if (connectionState === 'disconnected' || connectionState === 'failed') {
          console.log('Page became visible, attempting to reconnect...')
          reconnect()
        } else if (connectionState === 'connected') {
          // 接続済みの場合は状態を同期
          syncSimulationState()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connectionState, reconnect, syncSimulationState])

  const getConnectionStateString = useCallback(() => {
    switch (connectionState) {
      case 'connected':
        return '接続済み'
      case 'connecting':
        return '接続中...'
      case 'reconnecting':
        return `再接続中... (${reconnectAttempts}/${maxReconnectAttempts})`
      case 'failed':
        return '接続失敗'
      case 'disconnected':
      default:
        return '切断'
    }
  }, [connectionState, reconnectAttempts])

  return {
    connected: connectionState === 'connected',
    connectionState,
    reconnectAttempts,
    lastError,
    connect,
    disconnect,
    sendMessage,
    getConnectionStateString,
    reconnect,
  }
} 