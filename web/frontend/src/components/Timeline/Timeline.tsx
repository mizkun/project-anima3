import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { TurnItem } from './TurnItem'
import { InterventionItem } from './InterventionItem'
import { LoadingTurn } from './LoadingTurn'
import { Users, Maximize2, Minimize2, File } from 'lucide-react'

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
      {/* ヘッダー削除 - コントロールボタンのみ残す */}
      {turns.length > 0 && (
        <div 
          className="p-4 pb-2 flex justify-end"
          style={{ background: 'var(--neo-bg)' }}
        >
          <button
            className="neo-button flex items-center gap-2 px-3 py-1 text-sm"
            onClick={toggleAllTurns}
            title={isGlobalExpanded === true ? '全て閉じる' : '全て開く'}
          >
            <motion.div
              animate={{ rotate: isGlobalExpanded === true ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isGlobalExpanded === true ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </motion.div>
          </button>
        </div>
      )}

      {/* タイムライン内容 - スクロール可能エリア */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto neo-scrollbar"
        style={{ background: 'var(--neo-bg)' }}
      >
        {turns.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-6" style={{ color: 'var(--neo-text-secondary)' }} />
            <p className="text-xl mb-3 font-semibold" style={{ color: 'var(--neo-text-secondary)' }}>
              シミュレーションを開始してください
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--neo-text-secondary)' }}>
              ターンが進行するとここに表示されます
            </p>
            
            {/* 空の状態でもFile Editボタンを表示 */}
            {!inspectionPanelOpen && onInspectionPanelToggle && (
              <button
                className="flex items-center gap-2 px-6 py-3 mx-auto"
                onClick={onInspectionPanelToggle}
                style={{
                  background: 'var(--neo-accent)',
                  color: 'white',
                  boxShadow: 'var(--neo-shadow-floating)',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="ファイル編集パネルを開く"
              >
                <File className="h-4 w-4" />
                <span className="font-medium">ファイル編集を開始</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {/* 処理中の表示を最上部に */}
              {isProcessing && (
                <motion.div
                  key="loading-turn"
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
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