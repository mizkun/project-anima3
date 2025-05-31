import { useState, useCallback } from 'react'
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
  
  const error = error_message

  // 状態同期用のヘルパー関数
  const syncState = useCallback(async () => {
    try {
      console.log('状態同期を開始します...')
      const response = await fetch('/api/simulation/status')
      const data = await response.json()
      
      console.log('バックエンドから取得した状態:', data)
      
      if (response.ok && data.success !== false) {
        // ストアの状態を直接更新（依存配列の問題を避けるため）
        const store = useSimulationStore.getState()
        console.log('現在のフロントエンド状態:', store.status)
        console.log('新しい状態に更新:', data.status)
        
        store.setStatus(data.status)
        if (data.current_turn !== undefined) {
          store.setCurrentTurn(data.current_turn)
        }
        if (data.timeline) {
          store.updateTimeline(data.timeline)
        }
        
        console.log('状態同期完了')
      }
    } catch (err) {
      console.error('状態同期エラー:', err)
    }
  }, []) // 依存配列を空にして、関数の再作成を防ぐ

  // API呼び出し用のヘルパー関数
  const apiCall = useCallback(async (endpoint: string, method: string = 'POST', body?: any) => {
    setIsLoading(true)
    storeClearError()
    
    try {
      console.log(`API呼び出し開始: ${method} ${endpoint}`, body)
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const responseData = await response.json()
      console.log(`API応答 (${endpoint}):`, responseData)

      if (!response.ok) {
        throw new Error(responseData.detail || responseData.message || `HTTP ${response.status}`)
      }

      if (responseData.success === false) {
        throw new Error(responseData.message || 'API呼び出しが失敗しました')
      }

      // API呼び出し成功後、状態を同期
      await syncState()

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
  }, [setError, storeClearError]) // syncStateを依存配列から削除

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

      console.log('=== Step 1: シミュレーション開始API呼び出し ===')
      // シミュレーション開始API呼び出し（configでラップ）
      const result = await apiCall('/simulation/start', 'POST', { config: finalConfig })
      
      console.log('=== Step 2: シミュレーション開始完了 ===', result)
      
      // 状態を確認
      const currentState = useSimulationStore.getState()
      console.log('現在の状態 (start後):', currentState.status)
      
      // シミュレーション開始後、自動的に最初のターンを実行
      console.log('=== Step 3: 最初のターンを自動実行開始 ===')
      await apiCall('/simulation/next-turn', 'POST')
      console.log('=== Step 4: 最初のターン実行完了 ===')
      
      // 最終状態を確認
      const finalState = useSimulationStore.getState()
      console.log('最終状態 (next-turn後):', finalState.status)
      
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
  }, [storeClearError])

  return {
    status,
    isLoading,
    error: error || null,
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