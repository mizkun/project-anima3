import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CharacterInfo } from './CharacterInfo'
import { ActionDisplay } from './ActionDisplay'
import { NeumorphismCard } from '@/components/ui/neumorphism-card'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import type { TimelineEntry } from '@/types/simulation'

interface TurnItemProps {
  turn: TimelineEntry
  isLatest: boolean
  turnNumber: number
}

export const TurnItem: React.FC<TurnItemProps> = ({ turn, isLatest, turnNumber }) => {
  const [isExpanded, setIsExpanded] = useState(isLatest)

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <NeumorphismCard className={`relative ${isLatest ? 'ring-2 ring-blue-200' : ''}`}>
      {/* ターン番号とタイムスタンプ */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="neumorphism-status w-8 h-8 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-700">{turnNumber}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">ターン {turnNumber}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{formatTimestamp(turn.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="neumorphism-button p-2 rounded-lg"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* キャラクター情報 */}
      <div className="px-4 pb-2">
        <CharacterInfo 
          characterId={turn.character} 
          characterName={turn.character}
        />
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