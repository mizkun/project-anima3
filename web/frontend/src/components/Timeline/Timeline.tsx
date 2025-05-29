import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { TurnItem } from './TurnItem'
import { InterventionItem } from './InterventionItem'
import { LoadingTurn } from './LoadingTurn'
import { Users, ChevronDown, ChevronUp, File } from 'lucide-react'

interface TimelineProps {
  simulationId?: string
  className?: string
  onInspectionPanelToggle?: () => void
  inspectionPanelOpen?: boolean
}

export const Timeline: React.FC<TimelineProps> = ({ 
  className, 
  onInspectionPanelToggle,
  inspectionPanelOpen = false
}) => {
  const { timeline, status } = useSimulationStore()
  const { isLoading } = useSimulationControls()
  const timelineRef = useRef<HTMLDivElement>(null)
  
  // 全ターン開閉の状態管理
  const [isGlobalExpanded, setIsGlobalExpanded] = useState<boolean | undefined>(undefined)
  
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

  // 全ターン開閉のトグル
  const toggleAllTurns = () => {
    setIsGlobalExpanded(prev => prev === true ? false : true)
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* ヘッダー部分 - 常に表示 */}
      <motion.div 
        className="neo-element-subtle p-6 m-4 mb-0 rounded-t-2xl flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <motion.h2 
            className="text-xl font-bold"
            style={{ color: 'var(--neo-text)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {turns.length > 0 ? `タイムライン (${turns.length}ターン)` : 'タイムライン'}
          </motion.h2>
          <div className="flex items-center gap-3">
            {/* 全て開く/閉じるボタン（ターンがある場合のみ表示） */}
            {turns.length > 0 && (
              <motion.button
                className="neo-button flex items-center gap-2 px-4 py-2"
                onClick={toggleAllTurns}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.div
                  animate={{ rotate: isGlobalExpanded === true ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isGlobalExpanded === true ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </motion.div>
                <span className="text-sm font-medium">
                  {isGlobalExpanded === true ? '全て閉じる' : '全て開く'}
                </span>
              </motion.button>
            )}
            
            {/* インスペクションパネル開くボタン（パネルが閉じている時のみ表示） */}
            {!inspectionPanelOpen && onInspectionPanelToggle && (
              <motion.button
                className="neo-button flex items-center gap-2 px-4 py-2"
                onClick={onInspectionPanelToggle}
                title="ファイル編集パネルを開く"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <File className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">File Edit</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* タイムライン内容 - スクロール可能エリア */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto mx-4 mb-4 neo-scrollbar"
        style={{ 
          borderRadius: '0 0 24px 24px',
          background: 'var(--neo-bg)'
        }}
      >
        {turns.length === 0 ? (
          <motion.div 
            className="neo-element-pressed p-12 m-4 rounded-2xl text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Users className="h-16 w-16 mx-auto mb-6" style={{ color: 'var(--neo-text-secondary)' }} />
              <p className="text-xl mb-3 font-semibold" style={{ color: 'var(--neo-text-secondary)' }}>
                シミュレーションを開始してください
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--neo-text-secondary)' }}>
                ターンが進行するとここに表示されます
              </p>
              
              {/* 空の状態でもFile Editボタンを表示 */}
              {!inspectionPanelOpen && onInspectionPanelToggle && (
                <motion.button
                  className="neo-button-primary flex items-center gap-2 px-6 py-3 mx-auto"
                  onClick={onInspectionPanelToggle}
                  title="ファイル編集パネルを開く"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <File className="h-4 w-4" />
                  <span className="font-medium">ファイル編集を開始</span>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <div className="p-4 space-y-4">
            <AnimatePresence>
              {/* 処理中の表示を最上部に */}
              {isProcessing && (
                <motion.div
                  key="loading-turn"
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="neo-card-floating neo-pulse"
                >
                  <LoadingTurn turnNumber={timeline.length + 1} />
                </motion.div>
              )}
              
              {turns.map((turn, index) => (
                <motion.div
                  key={`${turn.step}-${turn.action_type}-${index}`}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                  className="neo-card-subtle"
                  whileHover={{ scale: 1.02 }}
                >
                  {turn.is_intervention ? (
                    <InterventionItem 
                      intervention={turn} 
                      turnNumber={turn.step}
                    />
                  ) : (
                    <TurnItem 
                      turn={turn} 
                      isLatest={index === 0 && !isProcessing}
                      turnNumber={turn.step}
                      isGlobalExpanded={isGlobalExpanded}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
} 