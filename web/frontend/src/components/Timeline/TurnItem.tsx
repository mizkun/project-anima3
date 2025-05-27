import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CharacterInfo } from './CharacterInfo'
import { ActionDisplay } from './ActionDisplay'
import { NeumorphismCard } from '@/components/ui/neumorphism-card'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TimelineEntry } from '@/types/simulation'

interface TurnItemProps {
  turn: TimelineEntry
  isLatest: boolean
  turnNumber: number
}

export const TurnItem: React.FC<TurnItemProps> = ({ turn, isLatest, turnNumber }) => {
  const [isExpanded, setIsExpanded] = useState(isLatest)

  return (
    <NeumorphismCard className={`relative ${isLatest ? 'ring-2 ring-blue-200' : ''}`}>
      {/* ターン番号とキャラクター名のみ */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="neumorphism-status w-8 h-8 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{turnNumber}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">ターン {turnNumber}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{turn.character}</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="neumorphism-button p-2 rounded-lg"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* 展開可能なアクション詳細 */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4">
          <ActionDisplay 
            actionType={turn.action_type}
            content={turn.content}
          />
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