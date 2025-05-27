import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { TurnItem } from './TurnItem'
import { LoadingTurn } from './LoadingTurn'
import { Users } from 'lucide-react'

interface TimelineProps {
  simulationId?: string
  className?: string
}

export const Timeline: React.FC<TimelineProps> = ({ className }) => {
  const { timeline, status } = useSimulationStore()
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // タイムラインデータをそのまま使用
  const turns = timeline
  
  const isLoading = false
  const isProcessing = status === 'running'

  // 新しいターンが追加されたときに自動スクロール
  useEffect(() => {
    if (timelineRef.current && turns.length > 0) {
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.scrollTop = timelineRef.current.scrollHeight
        }
      }, 100)
    }
  }, [turns.length])

  return (
    <div className={`timeline-infinite-scroll ${className}`}>
      {/* タイムライン内容 - 無限スクロール風 */}
      <div 
        ref={timelineRef}
        className="timeline-scroll-container"
      >
        {isLoading && turns.length === 0 ? (
          <div className="timeline-empty-state">
            <div className="neumorphism-inset rounded-xl p-6">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-blue-400"></div>
                <span>タイムラインを読み込み中...</span>
              </div>
            </div>
          </div>
        ) : turns.length === 0 ? (
          <div className="timeline-empty-state">
            <div className="neumorphism-inset rounded-xl p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">シミュレーションを開始してください</p>
              <p className="text-sm text-gray-500">ターンが進行するとここに表示されます</p>
            </div>
          </div>
        ) : (
          <div className="timeline-content">
            <AnimatePresence>
              {turns.map((turn, index) => (
                <motion.div
                  key={`${turn.step}-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
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
                    isLatest={index === turns.length - 1}
                    turnNumber={turn.step}
                  />
                </motion.div>
              ))}
              
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="timeline-item"
                >
                  <LoadingTurn turnNumber={turns.length + 1} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
} 