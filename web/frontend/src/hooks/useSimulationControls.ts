import { useState, useCallback, useEffect } from 'react'
import { usePolling } from './usePolling'
import { useSimulationStore } from '@/stores/simulationStore'
import type { SimulationConfig, SimulationStatus } from '@/types/simulation'

interface UseSimulationControlsReturn {
  status: SimulationStatus
  isLoading: boolean
  error: string | null
  config: Partial<SimulationConfig>
  startSimulation: (config?: Partial<SimulationConfig>) => Promise<void>
  stopSimulation: () => Promise<void>
  pauseSimulation: () => Promise<void>
  resumeSimulation: () => Promise<void>
  executeNextTurn: () => Promise<void>
  updateConfig: (newConfig: Partial<SimulationConfig>) => void
  clearError: () => void
}

export const useSimulationControls = (): UseSimulationControlsReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [pollingError, setPollingError] = useState<string | null>(null)
  
  // グローバルストアから状態を取得
  const store = useSimulationStore()
  const { 
    status, 
    error_message, 
    config,
    setStatus,
    setError,
    clearError: storeClearError,
    setConfig,
    setCurrentTurn,
    updateTimeline,
  } = store
  
  const error = error_message || pollingError

  // HTTPポーリングを使用
  const { fetchStatus, restartPolling } = usePolling({
    interval: 2000, // 2秒間隔
    enabled: true,
    onError: (err) => {
      setPollingError(err.message)
    }
  })

  // API呼び出し用のヘルパー関数
  const apiCall = useCallback(async (endpoint: string, method: string = 'POST', body?: any) => {
    setIsLoading(true)
    storeClearError()
    setPollingError(null)
    
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || `HTTP ${response.status}`)
      }

      if (responseData.success === false) {
        throw new Error(responseData.message || 'API呼び出しが失敗しました')
      }

      // API呼び出し成功後、状態を即座に更新
      await fetchStatus()

      return responseData
    } catch (err) {
      let errorMessage = '不明なエラーが発生しました'
      
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        // オブジェクトエラーの場合、詳細を表示
        errorMessage = JSON.stringify(err)
      }
      
      console.error('API呼び出しエラー詳細:', err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [setError, storeClearError, fetchStatus])

  // シミュレーション開始
  const startSimulation = useCallback(async (newConfig?: Partial<SimulationConfig>) => {
    if (isLoading) {
      console.log('シミュレーション開始処理が既に実行中です')
      return
    }

    try {
      // 設定を更新
      const finalConfig = { ...config, ...newConfig }
      setConfig(finalConfig)

      // シミュレーション開始API呼び出し（configでラップ）
      const result = await apiCall('/simulation/start', 'POST', { config: finalConfig })
      
      console.log('シミュレーションを開始しました:', result)
    } catch (err) {
      console.error('シミュレーション開始エラー:', err)
    }
  }, [isLoading, config, setConfig, apiCall])

  // シミュレーション停止
  const stopSimulation = useCallback(async () => {
    try {
      const result = await apiCall('/simulation/stop', 'POST')
      console.log('シミュレーションを停止しました:', result)
    } catch (err) {
      console.error('シミュレーション停止エラー:', err)
    }
  }, [apiCall])

  // シミュレーション一時停止
  const pauseSimulation = useCallback(async () => {
    try {
      // 一時停止は状態をローカルで変更（バックエンドAPIがない場合）
      setStatus('paused')
      console.log('シミュレーションを一時停止しました')
    } catch (err) {
      console.error('シミュレーション一時停止エラー:', err)
    }
  }, [setStatus])

  // シミュレーション再開
  const resumeSimulation = useCallback(async () => {
    try {
      // 再開は状態をローカルで変更（バックエンドAPIがない場合）
      setStatus('running')
      console.log('シミュレーションを再開しました')
    } catch (err) {
      console.error('シミュレーション再開エラー:', err)
    }
  }, [setStatus])

  // 次ターン実行
  const executeNextTurn = useCallback(async () => {
    try {
      console.log('次ターン実行開始: 現在の状態=', status)
      const result = await apiCall('/simulation/next-turn', 'POST')
      console.log('次ターンを実行しました:', result)
    } catch (err) {
      console.error('次ターン実行エラー:', err)
    }
  }, [apiCall, status])

  // 設定更新
  const updateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig({ ...config, ...newConfig })
  }, [config, setConfig])

  // エラークリア
  const clearError = useCallback(() => {
    storeClearError()
    setPollingError(null)
  }, [storeClearError])

  return {
    status,
    isLoading,
    error,
    config,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    executeNextTurn,
    updateConfig,
    clearError,
  }
} 