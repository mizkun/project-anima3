import { useEffect, useRef, useCallback } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'

interface PollingOptions {
  interval?: number // ポーリング間隔（ミリ秒）
  enabled?: boolean // ポーリングの有効/無効
  onError?: (error: Error) => void // エラーハンドラー
}

export const usePolling = (options: PollingOptions = {}) => {
  const {
    interval = 2000, // デフォルト2秒間隔
    enabled = true,
    onError
  } = options

  const { updateFromBackend } = useSimulationStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  const fetchStatus = useCallback(async () => {
    if (isPollingRef.current) return // 重複実行防止

    isPollingRef.current = true
    try {
      const response = await fetch('/api/simulation/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success !== false) {
        // ストアの状態を更新
        updateFromBackend(data)
      } else {
        throw new Error(data.message || 'ステータス取得に失敗しました')
      }
    } catch (error) {
      console.warn('ポーリングエラー:', error)
      if (onError) {
        onError(error as Error)
      }
    } finally {
      isPollingRef.current = false
    }
  }, [updateFromBackend, onError])

  const startPolling = useCallback(() => {
    if (intervalRef.current) return // 既に開始済み

    // 初回実行
    fetchStatus()

    // 定期実行を開始
    intervalRef.current = setInterval(fetchStatus, interval)
  }, [fetchStatus, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const restartPolling = useCallback(() => {
    stopPolling()
    if (enabled) {
      startPolling()
    }
  }, [stopPolling, startPolling, enabled])

  // ポーリングの開始/停止制御
  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, startPolling, stopPolling])

  // ページの可視性に応じてポーリングを制御
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (enabled) {
        startPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, startPolling, stopPolling])

  return {
    fetchStatus,
    startPolling,
    stopPolling,
    restartPolling,
    isPolling: intervalRef.current !== null
  }
} 