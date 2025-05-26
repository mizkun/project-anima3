import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimeline } from '@/hooks/useTimeline'
import { TurnItem } from './TurnItem'
import { LoadingTurn } from './LoadingTurn'
import { NeumorphismCard, NeumorphismCardHeader, NeumorphismCardTitle } from '@/components/ui/neumorphism-card'
import { Clock, Users } from 'lucide-react'

interface TimelineProps {
  simulationId?: string
  className?: string
}

export const Timeline: React.FC<TimelineProps> = ({ simulationId, className }) => {
  const { turns, isLoading, currentTurn, isProcessing } = useTimeline(simulationId)
  const timelineRef = useRef<HTMLDivElement>(null)

  // 新しいターンが追加されたときに自動スクロール
  useEffect(() => {
    if (timelineRef.current && turns.length > 0) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [turns.length])

  return (
    <NeumorphismCard className={`h-full flex flex-col ${className}`}>
      <NeumorphismCardHeader className="flex-shrink-0">
        <NeumorphismCardTitle className="flex items-center gap-3">
          <div className="neumorphism-icon p-3">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          シミュレーションタイムライン
          {turns.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-auto">
              {turns.length} ターン
            </span>
          )}
        </NeumorphismCardTitle>
      </NeumorphismCardHeader>

      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto p-6 pt-0 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      >
        {isLoading && turns.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="neumorphism-inset rounded-xl p-6">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                <span>タイムラインを読み込み中...</span>
              </div>
            </div>
          </div>
        ) : turns.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="neumorphism-inset rounded-xl p-6 text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">シミュレーションを開始してください</p>
              <p className="text-sm text-gray-500 mt-1">ターンが進行するとここに表示されます</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {turns.map((turn, index) => (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <TurnItem 
                  turn={turn} 
                  isLatest={index === turns.length - 1}
                  turnNumber={index + 1}
                />
              </motion.div>
            ))}
            
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <LoadingTurn turnNumber={turns.length + 1} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </NeumorphismCard>
  )
} 