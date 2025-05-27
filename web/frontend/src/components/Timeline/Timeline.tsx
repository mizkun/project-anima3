import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { TurnItem } from './TurnItem'
import { LoadingTurn } from './LoadingTurn'
import { Users } from 'lucide-react'

interface TimelineProps {
  simulationId?: string
  className?: string
}

export const Timeline: React.FC<TimelineProps> = ({ className }) => {
  const { timeline, status } = useSimulationStore()
  const { isLoading } = useSimulationControls()
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // タイムラインデータを逆順にして新しいターンを上部に表示
  const turns = [...timeline].reverse()
  
  // ターン実行中またはシミュレーション実行中の判定
  // status が 'running' の場合、または isLoading が true の場合にローディング表示
  const isProcessing = status === 'running' || isLoading
  
  console.log('Timeline状態:', { status, isLoading, isProcessing, timelineLength: timeline.length })
  console.log('Timeline turns:', turns)

  // 新しいターンが追加されたときに上部にスクロール
  useEffect(() => {
    if (timelineRef.current && timeline.length > 0) {
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.scrollTop = 0
        }
      }, 100)
    }
  }, [timeline.length])

  return (
    <div className={`timeline-infinite-scroll ${className}`}>
      {/* タイムライン内容 - 無限スクロール風 */}
      <div 
        ref={timelineRef}
        className="timeline-scroll-container"
      >
        {turns.length === 0 ? (
          <div className="timeline-empty-state">
            <div className="neumorphism-inset rounded-xl p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 dark:text-gray-500 text-lg mb-2">シミュレーションを開始してください</p>
              <p className="text-sm text-gray-500 dark:text-gray-600">ターンが進行するとここに表示されます</p>
            </div>
          </div>
        ) : (
          <div className="timeline-content">
            <AnimatePresence>
              {/* 処理中の表示を最上部に */}
              {isProcessing && (
                <motion.div
                  key="loading-turn"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="timeline-item"
                >
                  <LoadingTurn turnNumber={timeline.length + 1} />
                </motion.div>
              )}
              
              {turns.map((turn, index) => (
                <motion.div
                  key={`${turn.step}-${index}`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                  className="timeline-item"
                >
                  <TurnItem 
                    turn={turn} 
                    isLatest={index === 0}
                    turnNumber={turn.step}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
} 