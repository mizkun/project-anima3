import React from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { Play, Square, Pause, SkipForward, Loader2 } from 'lucide-react'
import type { SimulationStatus } from '@/types/simulation'

export const SimulationControls: React.FC = () => {
  const {
    status,
    isLoading,
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    executeNextTurn
  } = useSimulationControls()

  const getStatusColor = (status: SimulationStatus) => {
    switch (status) {
      case 'running':
        return 'text-green-600'
      case 'paused':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      case 'completed':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = (status: SimulationStatus) => {
    switch (status) {
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

  return (
    <div className="space-y-4">
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
          
          {isLoading && (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          )}
        </div>
      </div>

      {/* 制御ボタン */}
      <div className="grid grid-cols-2 gap-3">
        {/* 開始/再開ボタン */}
        {(status === 'idle' || status === 'completed' || status === 'error') && (
          <NeumorphismButton
            variant="primary"
            onClick={() => startSimulation()}
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            再開
          </NeumorphismButton>
        )}

        {/* 停止ボタン */}
        {(status === 'running' || status === 'paused') && (
          <NeumorphismButton
            variant="danger"
            onClick={stopSimulation}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            停止
          </NeumorphismButton>
        )}

        {/* 次ターンボタン */}
        {status === 'paused' && (
          <NeumorphismButton
            variant="secondary"
            onClick={executeNextTurn}
            disabled={isLoading}
            className="flex items-center gap-2 col-span-2"
          >
            <SkipForward className="h-4 w-4" />
            次ターン実行
          </NeumorphismButton>
        )}
      </div>
    </div>
  )
} 