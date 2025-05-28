import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CharacterInfo } from './CharacterInfo'
import { NeumorphismCard } from '@/components/ui/neumorphism-card'
import { ChevronDown, ChevronUp, Brain, Activity, MessageCircle } from 'lucide-react'
import type { TimelineEntry } from '@/types/simulation'

interface TurnItemProps {
  turn: TimelineEntry
  isLatest: boolean
  turnNumber: number
  isGlobalExpanded?: boolean
}

export const TurnItem: React.FC<TurnItemProps> = ({ 
  turn, 
  isLatest, 
  turnNumber, 
  isGlobalExpanded 
}) => {
  // デフォルトで発言のみ表示（閉じた状態）
  const [isExpanded, setIsExpanded] = useState(false)

  // グローバル展開状態の変更を監視
  useEffect(() => {
    if (isGlobalExpanded !== undefined) {
      setIsExpanded(isGlobalExpanded)
    }
  }, [isGlobalExpanded])

  // ターンの内容を解析
  const lines = turn.content.split('\n')
  const thinkLine = lines.find(line => line.startsWith('思考:'))
  const actLine = lines.find(line => line.startsWith('行動:'))
  const talkLine = lines.find(line => line.startsWith('発言:'))

  return (
    <NeumorphismCard className={`relative ${isLatest ? 'ring-2 ring-blue-200' : ''}`}>
      {/* ターン番号とキャラクター名 */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="neumorphism-status w-8 h-8 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{turnNumber}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{turn.character}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 展開状態のインジケーター */}
          <div className="flex gap-1">
            {thinkLine && (
              <div className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-purple-400' : 'bg-gray-300'}`} />
            )}
            {actLine && (
              <div className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-green-400' : 'bg-gray-300'}`} />
            )}
            {talkLine && (
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            )}
          </div>
          
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </div>

      {/* 発言（常時表示） */}
      {talkLine && (
        <div className="px-4 pb-2">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {talkLine.replace('発言: ', '').replace(/^「|」$/g, '')}
            </p>
          </div>
        </div>
      )}

      {/* 展開可能な思考・行動詳細 */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
          {/* 思考 */}
          {thinkLine && (
            <div className="flex items-start gap-3">
              <Brain className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">思考</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {thinkLine.replace('思考: ', '')}
                </p>
              </div>
            </div>
          )}

          {/* 行動 */}
          {actLine && (
            <div className="flex items-start gap-3">
              <Activity className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">行動</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {actLine.replace('行動: ', '')}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 最新ターンのインジケーター */}
      {isLatest && (
        <div className="absolute -right-2 -top-2">
          <div className="neumorphism-status w-6 h-6 relative">
            <div className="absolute inset-1 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </NeumorphismCard>
  )
} 