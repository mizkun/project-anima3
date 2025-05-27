import React, { useState } from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { usePolling } from '@/hooks/usePolling'
import { SceneSelector } from './SceneSelector'
import { ModelSelector } from './ModelSelector'
import { InterventionPanel } from './InterventionPanel'
import { Play, Square, Pause, SkipForward, Loader2, Settings, Zap, AlertCircle, X } from 'lucide-react'
import type { SimulationStatus } from '@/types/simulation'

export const SimulationControls: React.FC = () => {
  const {
    status,
    isLoading,
    error,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    executeNextTurn,
    clearError,
  } = useSimulationControls()

  // ポーリング状態の監視
  const { isPolling } = usePolling()

  // 新機能の状態管理
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')
  const [activeTab, setActiveTab] = useState<'controls' | 'settings' | 'intervention'>('controls')
  const [isExecutingTurn, setIsExecutingTurn] = useState(false)

  const getStatusColor = (status: SimulationStatus) => {
    switch (status) {
      case 'running':
        return 'text-green-400'
      case 'paused':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      case 'completed':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusText = (status: SimulationStatus) => {
    switch (status) {
      case 'not_started':
        return '未開始'
      case 'idle':
        return '待機中'
      case 'running':
        return '実行中'
      case 'paused':
        return '一時停止'
      case 'error':
        return 'エラー'
      case 'completed':
        return '完了'
      default:
        return '待機中'
    }
  }

  // 新機能のハンドラー
  const handleSceneSelect = (sceneId: string) => {
    setSelectedScene(sceneId)
  }

  const handleModelChange = (provider: string, model: string) => {
    setSelectedProvider(provider)
    setSelectedModel(model)
  }

  const handleIntervention = async (type: string, content: string) => {
    try {
      const response = await fetch('/api/simulation/intervention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, content }),
      })

      const result = await response.json()

      if (!response.ok || result.success === false) {
        throw new Error(result.message || '介入の実行に失敗しました')
      }
    } catch (error) {
      console.error('介入エラー:', error)
      throw error
    }
  }

  // 次ターン実行（改善版）
  const handleExecuteNextTurn = async () => {
    setIsExecutingTurn(true)
    try {
      await executeNextTurn()
    } finally {
      setIsExecutingTurn(false)
    }
  }

  // 総合的なローディング状態
  const isAnyLoading = isLoading || isExecutingTurn

  return (
    <div className="space-y-4">
      {/* エラー表示 */}
      {error && (
        <div className="neumorphism-inset rounded-xl p-4 border border-red-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">エラーが発生しました</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ステータス表示 */}
      <div className="neumorphism-inset rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`neumorphism-status w-3 h-3 relative`}>
              <div className={`absolute inset-0.5 rounded-full ${
                status === 'running' ? 'bg-green-500 animate-pulse' :
                status === 'paused' ? 'bg-yellow-500' :
                status === 'error' ? 'bg-red-500' :
                status === 'completed' ? 'bg-blue-500' :
                'bg-gray-400'
              }`}></div>
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* ポーリング状態表示 */}
            {isPolling && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">同期中</span>
              </div>
            )}
            
            {/* ローディング表示 */}
            {isAnyLoading && (
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="neumorphism-inset rounded-xl p-2 flex gap-1">
        <button
          onClick={() => setActiveTab('controls')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'controls'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Play className="h-4 w-4 mx-auto" />
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Settings className="h-4 w-4 mx-auto" />
        </button>
        <button
          onClick={() => setActiveTab('intervention')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'intervention'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Zap className="h-4 w-4 mx-auto" />
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="min-h-[300px]">
        {activeTab === 'controls' && (
          <div className="space-y-4">
            {/* 制御ボタン */}
            <div className="grid grid-cols-2 gap-3">
              {/* 開始/再開ボタン */}
              {(status === 'not_started' || status === 'idle' || status === 'completed' || status === 'error') && (
                <NeumorphismButton
                  variant="primary"
                  onClick={() => startSimulation({
                    character_name: 'default',
                    llm_provider: selectedProvider as any,
                    model_name: selectedModel,
                    max_steps: 10,
                    max_turns: 10,
                    temperature: 0.7,
                    max_tokens: 1000
                  })}
                  disabled={isAnyLoading}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  開始
                </NeumorphismButton>
              )}

              {/* 一時停止ボタン */}
              {status === 'running' && (
                <NeumorphismButton
                  variant="warning"
                  onClick={pauseSimulation}
                  disabled={isAnyLoading}
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  一時停止
                </NeumorphismButton>
              )}

              {/* 再開ボタン */}
              {status === 'paused' && (
                <NeumorphismButton
                  variant="primary"
                  onClick={resumeSimulation}
                  disabled={isAnyLoading}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  再開
                </NeumorphismButton>
              )}

              {/* 停止ボタン */}
              {(status === 'running' || status === 'paused' || status === 'idle') && (
                <NeumorphismButton
                  variant="danger"
                  onClick={stopSimulation}
                  disabled={isAnyLoading}
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  停止
                </NeumorphismButton>
              )}

              {/* 次ターンボタン */}
              {(status === 'running' || status === 'paused' || status === 'idle') && (
                <NeumorphismButton
                  variant="secondary"
                  onClick={handleExecuteNextTurn}
                  disabled={isAnyLoading}
                  className="flex items-center gap-2 col-span-2"
                >
                  {isExecutingTurn ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SkipForward className="h-4 w-4" />
                  )}
                  次ターン実行
                </NeumorphismButton>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <SceneSelector
              selectedScene={selectedScene}
              onSceneSelect={handleSceneSelect}
              disabled={status === 'running' || isAnyLoading}
            />
            <ModelSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              disabled={status === 'running' || isAnyLoading}
            />
          </div>
        )}

        {activeTab === 'intervention' && (
          <InterventionPanel
            onIntervention={handleIntervention}
            disabled={status !== 'running' && status !== 'paused' || isAnyLoading}
          />
        )}
      </div>
    </div>
  )
} 