import { useCallback } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import type { TimelineEntry } from '@/types/simulation'

interface UseTimelineReturn {
  turns: TimelineEntry[]
  isLoading: boolean
  currentTurn: number
  isProcessing: boolean
  error: string | null
  addTurn: (turn: TimelineEntry) => void
  clearTimeline: () => void
  setProcessing: (processing: boolean) => void
}

export const useTimeline = (simulationId?: string): UseTimelineReturn => {
  const store = useSimulationStore()

  // ターンを追加
  const addTurn = useCallback((turn: TimelineEntry) => {
    store.addTimelineEntry(turn)
  }, [store])

  // タイムラインをクリア
  const clearTimeline = useCallback(() => {
    store.updateTimeline([])
    store.setCurrentTurn(0)
    store.clearError()
  }, [store])

  // 処理状態を設定
  const setProcessing = useCallback((processing: boolean) => {
    // 処理状態はstatusで管理
    if (processing) {
      store.setStatus('running')
    } else {
      store.setStatus('idle')
    }
  }, [store])

  return {
    turns: store.timeline,
    isLoading: false, // ローディング状態は別途管理
    currentTurn: store.current_turn,
    isProcessing: store.status === 'running',
    error: store.error_message || null,
    addTurn,
    clearTimeline,
    setProcessing
  }
} 