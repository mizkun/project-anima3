import { useState, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
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
  const [status, setStatus] = useState<SimulationStatus>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<Partial<SimulationConfig>>({
    max_turns: 10,
    llm_provider: 'openai',
    model_name: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    characters_dir: 'data/characters',
    immutable_config_path: 'data/immutable.yaml',
    long_term_config_path: 'data/long_term.yaml'
  })

  // WebSocket接続
  const { connected, sendMessage } = useWebSocket()

  // API呼び出し用のヘルパー関数
  const apiCall = useCallback(async (endpoint: string, method: string = 'POST', body?: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // シミュレーション開始
  const startSimulation = useCallback(async (newConfig?: Partial<SimulationConfig>) => {
    try {
      const finalConfig = { ...config, ...newConfig }
      setConfig(finalConfig)
      
      await apiCall('/simulations/start', 'POST', { config: finalConfig })
      setStatus('running')
      
      // WebSocketでリアルタイム更新を開始
      if (connected) {
        sendMessage({ type: 'subscribe_simulation_updates' })
      }
    } catch (err) {
      setStatus('error')
    }
  }, [config, apiCall, connected, sendMessage])

  // シミュレーション停止
  const stopSimulation = useCallback(async () => {
    try {
      await apiCall('/simulations/stop', 'POST')
      setStatus('idle')
    } catch (err) {
      setStatus('error')
    }
  }, [apiCall])

  // シミュレーション一時停止
  const pauseSimulation = useCallback(async () => {
    try {
      await apiCall('/simulations/pause', 'POST')
      setStatus('paused')
    } catch (err) {
      setStatus('error')
    }
  }, [apiCall])

  // シミュレーション再開
  const resumeSimulation = useCallback(async () => {
    try {
      await apiCall('/simulations/resume', 'POST')
      setStatus('running')
    } catch (err) {
      setStatus('error')
    }
  }, [apiCall])

  // 次ターン実行
  const executeNextTurn = useCallback(async () => {
    try {
      await apiCall('/simulations/next-turn', 'POST')
    } catch (err) {
      // エラーは既にsetErrorで設定済み
    }
  }, [apiCall])

  // 設定更新
  const updateConfig = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // エラークリア
  const clearError = useCallback(() => {
    setError(null)
  }, [])

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
    clearError
  }
} 