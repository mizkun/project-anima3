import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CharacterInfo } from './CharacterInfo'
import { Plus, Minus, Brain, Activity, MessageCircle, MoreHorizontal, Archive, RotateCcw } from 'lucide-react'
import type { TimelineEntry } from '@/types/simulation'
import { useSimulationStore } from '@/stores/simulationStore'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const debugMode = useSimulationStore((state) => state.debugMode)

  // グローバル展開状態の変更を監視
  useEffect(() => {
    if (isGlobalExpanded !== undefined) {
      setIsExpanded(isGlobalExpanded)
    }
  }, [isGlobalExpanded])

  const handleSaveAsMemory = () => {
    // TODO: キャラクターの記憶として保存する機能を実装
    console.log('Save as memory for turn:', turnNumber)
    setMenuOpen(false)
  }

  const handleRevertToTurn = () => {
    // TODO: このターンまで遡って再開する機能を実装
    console.log('Revert to turn:', turnNumber)
    setMenuOpen(false)
  }

  // ターンの内容を解析
  const lines = turn.content.split('\n')
  const thinkLine = lines.find(line => line.startsWith('思考:'))
  const actLine = lines.find(line => line.startsWith('行動:'))
  const talkLine = lines.find(line => line.startsWith('発言:'))
  
  // 発言の内容を取得（空の場合も考慮）
  const talkContent = talkLine ? talkLine.replace('発言: ', '').replace(/^「|」$/g, '').trim() : null
  const hasTalk = talkContent && talkContent.length > 0

  return (
    <motion.div 
      className="neo-card-subtle relative"
      style={{
        margin: '0 0 8px 0',
        padding: '12px',
        background: 'var(--neo-element)',
        ...(isLatest && {
          boxShadow: 'var(--neo-shadow-floating)',
          border: '2px solid var(--neo-accent)',
        })
      }}
      whileHover={{ scale: 1.002 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      layout
    >
      {/* ターン番号とキャラクター名 */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className={`neo-element w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold`}
            whileHover={{ scale: 1.1 }}
            style={{
              background: isLatest ? 'var(--neo-accent)' : 'var(--neo-element)',
              color: isLatest ? 'white' : 'var(--neo-text)',
              boxShadow: isLatest ? 'var(--neo-shadow-floating)' : 'var(--neo-shadow-raised)',
            }}
          >
            {turnNumber}
          </motion.div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--neo-text)' }}>
              {turn.character}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 展開状態のインジケーター */}
          <div className="flex gap-1">
            {thinkLine && (
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ 
                  backgroundColor: isExpanded ? 'var(--neo-accent-light)' : 'var(--neo-text-secondary)' 
                }} 
              />
            )}
            {actLine && (
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ 
                  backgroundColor: isExpanded ? 'var(--neo-success)' : 'var(--neo-text-secondary)' 
                }} 
              />
            )}
            {hasTalk && (
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: 'var(--neo-accent)' }}
              />
            )}
          </div>
          
          <motion.button
            className="neo-button p-1 rounded-lg"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isExpanded ? (
              <Minus className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </motion.button>
          
          <div className="relative">
            <motion.button
              className="neo-button p-1 rounded-lg"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>
            
            {/* カスタムメニュー */}
            {menuOpen && (
              <motion.div
                className="absolute right-0 top-8 z-50 neo-card-floating min-w-48"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ background: 'var(--neo-element)' }}
              >
                <motion.button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={handleSaveAsMemory}
                  whileHover={{ scale: 1.02 }}
                  style={{ color: 'var(--neo-text)' }}
                >
                  <Archive className="w-4 h-4" />
                  記憶として保存
                </motion.button>
                <motion.button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={handleRevertToTurn}
                  whileHover={{ scale: 1.02 }}
                  style={{ color: 'var(--neo-text)' }}
                >
                  <RotateCcw className="w-4 h-4" />
                  このターンまで遡る
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 発言（常時表示） */}
      {hasTalk ? (
        <div className="mt-3 px-1">
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--neo-accent)' }} />
            <div className="text-sm leading-relaxed" style={{ color: 'var(--neo-text)' }}>
              {talkContent}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 px-1">
          <div className="flex items-start gap-2">
            <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--neo-text-secondary)' }} />
            <div className="text-sm leading-relaxed italic" style={{ color: 'var(--neo-text-secondary)' }}>
              （発言なし）
            </div>
          </div>
        </div>
      )}

      {/* 展開可能な思考・行動詳細 */}
      {isExpanded && (
        <motion.div
          className="overflow-hidden mt-4 pt-3 border-t"
          style={{ borderColor: 'var(--neo-text-secondary)' }}
          initial={{ 
            opacity: 0, 
            maxHeight: 0,
            paddingTop: 0,
            marginTop: 0
          }}
          animate={{ 
            opacity: 1, 
            maxHeight: 500,
            paddingTop: 12,
            marginTop: 16
          }}
          exit={{ 
            opacity: 0, 
            maxHeight: 0,
            paddingTop: 0,
            marginTop: 0
          }}
          transition={{ 
            duration: 0.4,
            ease: [0.04, 0.62, 0.23, 0.98],
            opacity: { duration: 0.3, delay: 0.1 },
            maxHeight: { duration: 0.4 }
          }}
        >
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            {/* 思考 */}
            {thinkLine && (
              <motion.div 
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--neo-accent-light)' }} />
                <div className="flex-1">
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--neo-accent-light)' }}>
                    思考
                  </div>
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--neo-text)' }}>
                    {thinkLine.replace('思考: ', '')}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 行動 */}
            {actLine && (
              <motion.div 
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
              >
                <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--neo-success)' }} />
                <div className="flex-1">
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--neo-success)' }}>
                    行動
                  </div>
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--neo-text)' }}>
                    {actLine.replace('行動: ', '')}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
      
      {/* デバッグ情報（デバッグモード時のみ表示） */}
      {debugMode && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: 'var(--neo-text-secondary)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--neo-text-secondary)' }}>
            デバッグ情報
          </div>
          <div className="flex gap-1 flex-wrap">
            <span className="neo-element-subtle px-2 py-1 text-xs rounded" style={{ color: 'var(--neo-text-secondary)' }}>
              Gemini 1.5 Flash
            </span>
            <span className="neo-element-subtle px-2 py-1 text-xs rounded" style={{ color: 'var(--neo-text-secondary)' }}>
              ターン {turnNumber}
            </span>
            <span className="neo-element-subtle px-2 py-1 text-xs rounded" style={{ color: 'var(--neo-text-secondary)' }}>
              Temperature: 0.7
            </span>
          </div>
        </div>
      )}

      {/* メニューを閉じるためのオーバーレイ */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </motion.div>
  )
} 