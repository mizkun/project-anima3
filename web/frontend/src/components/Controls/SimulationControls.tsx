import React, { useState } from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { SceneSelector } from './SceneSelector'
import { InterventionPanel } from './InterventionPanel'
import { Play, Square, Pause, SkipForward, Loader2, AlertCircle, X, Sparkles } from 'lucide-react'
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
  const [selectedScene, setSelectedScene] = useState<string | null>('school_rooftop_001')
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')
  const [isExecutingTurn, setIsExecutingTurn] = useState(false)

  // 新機能のハンドラー
  const handleSceneSelect = (sceneId: string) => {
    setSelectedScene(sceneId)
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

  // 実行中かどうかの判定
  const isRunning = status === 'running' || status === 'paused' || status === 'idle'

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

      {/* 制御ボタン */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* 開始ボタン（未開始・完了・エラー時のみ表示） */}
          {(status === 'not_started' || status === 'completed' || status === 'error') && (
            <NeumorphismButton
              variant="primary"
              onClick={() => startSimulation({
                character_name: 'default',
                scene_id: selectedScene || 'school_rooftop_001',
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
          {isRunning && (
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

      {/* シーン選択 */}
      <div className="space-y-4">
        <SceneSelector
          selectedScene={selectedScene}
          onSceneSelect={handleSceneSelect}
          disabled={isRunning || isAnyLoading}
        />
      </div>

      {/* 介入パネル */}
      <div className="space-y-4">
        <InterventionPanel
          onIntervention={handleIntervention}
          disabled={!isRunning || isAnyLoading}
        />
      </div>
    </div>
  )
} 