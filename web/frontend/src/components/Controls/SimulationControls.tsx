import React, { useState } from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { SceneSelector } from './SceneSelector'
import { ModelSelector } from './ModelSelector'
import { InterventionPanel } from './InterventionPanel'
import { Play, Square, Pause, SkipForward, Loader2, Settings, Zap, AlertCircle, X, Sparkles } from 'lucide-react'
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

  // 新機能の状態管理
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')
  const [activeTab, setActiveTab] = useState<'controls' | 'settings' | 'intervention'>('controls')
  const [isExecutingTurn, setIsExecutingTurn] = useState(false)



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
      {/* タイトル部分 */}
      <div className="flex items-center gap-3 mb-6 mt-4">
        <div className="neumorphism-icon p-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Project Anima</h1>
        </div>
      </div>

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
              {/* 開始ボタン（未開始・完了・エラー時のみ表示） */}
              {(status === 'not_started' || status === 'completed' || status === 'error') && (
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
                  className="flex items-center gap-2 col-span-2"
                >
                  <Play className="h-4 w-4" />
                  Start
                </NeumorphismButton>
              )}

              {/* シミュレーション開始後のボタン群 */}
              {(status === 'running' || status === 'paused' || status === 'idle') && (
                <>
                  {/* 次ターンボタン */}
                  <NeumorphismButton
                    variant="secondary"
                    onClick={handleExecuteNextTurn}
                    disabled={isAnyLoading}
                    className="flex items-center gap-2"
                  >
                    {isExecutingTurn ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SkipForward className="h-4 w-4" />
                    )}
                    Next
                  </NeumorphismButton>

                  {/* 停止ボタン */}
                  <NeumorphismButton
                    variant="danger"
                    onClick={stopSimulation}
                    disabled={isAnyLoading}
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Stop
                  </NeumorphismButton>
                </>
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