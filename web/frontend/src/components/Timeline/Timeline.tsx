import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { TurnItem } from './TurnItem'
import { InterventionItem } from './InterventionItem'
import { LoadingTurn } from './LoadingTurn'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
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
    <div className={`timeline-infinite-scroll ${className}`}>
      {/* ヘッダー部分 - 常に表示 */}
      <div className="timeline-header p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {turns.length > 0 ? `タイムライン (${turns.length}ターン)` : 'タイムライン'}
          </h2>
          <div className="flex items-center gap-2">
            {/* 全て開く/閉じるボタン（ターンがある場合のみ表示） */}
            {turns.length > 0 && (
              <NeumorphismButton
                variant="secondary"
                size="sm"
                onClick={toggleAllTurns}
                className="flex items-center gap-2"
              >
                {isGlobalExpanded === true ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    全て閉じる
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    全て開く
                  </>
                )}
              </NeumorphismButton>
            )}
            
            {/* インスペクションパネル開くボタン（パネルが閉じている時のみ表示） */}
            {!inspectionPanelOpen && onInspectionPanelToggle && (
              <NeumorphismButton
                variant="secondary"
                size="sm"
                onClick={onInspectionPanelToggle}
                className="flex items-center gap-2"
                title="ファイル編集パネルを開く"
              >
                <File className="h-4 w-4" />
                <span className="hidden sm:inline">File Edit</span>
              </NeumorphismButton>
            )}
          </div>
        </div>
      </div>

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
              {/* 空の状態でもFile Editボタンを表示 */}
              {!inspectionPanelOpen && onInspectionPanelToggle && (
                <div className="mt-6">
                  <NeumorphismButton
                    variant="primary"
                    onClick={onInspectionPanelToggle}
                    className="flex items-center gap-2"
                    title="ファイル編集パネルを開く"
                  >
                    <File className="h-4 w-4" />
                    ファイル編集を開始
                  </NeumorphismButton>
                </div>
              )}
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
                  key={`${turn.step}-${turn.action_type}-${index}`}
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