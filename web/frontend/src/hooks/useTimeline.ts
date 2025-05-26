import { useState, useEffect, useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
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
  const [turns, setTurns] = useState<TimelineEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentTurn, setCurrentTurn] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // WebSocket接続
  const { 
    isConnected, 
    sendMessage, 
    lastMessage 
  } = useWebSocket(`ws://localhost:8000/ws${simulationId ? `?simulation_id=${simulationId}` : ''}`)

  // WebSocketメッセージの処理
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage)
        
        switch (message.type) {
          case 'turn_started':
            setIsProcessing(true)
            setCurrentTurn(message.data.turn_number)
            break
            
          case 'turn_completed':
            setIsProcessing(false)
            if (message.data.turn) {
              addTurn(message.data.turn)
            }
            break
            
          case 'simulation_started':
            clearTimeline()
            setIsProcessing(true)
            break
            
          case 'simulation_ended':
            setIsProcessing(false)
            break
            
          case 'error':
            setError(message.data.message)
            setIsProcessing(false)
            break
            
          default:
            console.log('Unknown message type:', message.type)
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }
  }, [lastMessage])

  // ターンを追加
  const addTurn = useCallback((turn: TimelineEntry) => {
    setTurns(prev => [...prev, turn])
    setCurrentTurn(prev => prev + 1)
  }, [])

  // タイムラインをクリア
  const clearTimeline = useCallback(() => {
    setTurns([])
    setCurrentTurn(0)
    setError(null)
  }, [])

  // 処理状態を設定
  const setProcessing = useCallback((processing: boolean) => {
    setIsProcessing(processing)
  }, [])

  // 初期データの読み込み
  useEffect(() => {
    if (simulationId && isConnected) {
      setIsLoading(true)
      
      // 既存のタイムラインデータを取得
      fetch(`/api/simulations/${simulationId}/timeline`)
        .then(response => response.json())
        .then(data => {
          if (data.turns) {
            setTurns(data.turns)
            setCurrentTurn(data.turns.length)
          }
        })
        .catch(err => {
          console.error('Failed to load timeline:', err)
          setError('タイムラインの読み込みに失敗しました')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [simulationId, isConnected])

  return {
    turns,
    isLoading,
    currentTurn,
    isProcessing,
    error,
    addTurn,
    clearTimeline,
    setProcessing
  }
} 