import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulationControls } from '@/hooks/useSimulationControls'
import { TurnItem } from './TurnItem'
import { InterventionItem } from './InterventionItem'
import { LoadingTurn } from './LoadingTurn'
import { Users, Maximize2, Minimize2, File, RefreshCw } from 'lucide-react'

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
  
  // リフレッシュ機能の状態
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // タイムラインデータを逆順にして新しいターンを上部に表示
  const turns = [...timeline].reverse()
  
  // ターン実行中またはシミュレーション実行中の判定
  // status が 'running' の場合、または isLoading が true の場合にローディング表示
  const isProcessing = status === 'running' || isLoading
  
  console.log('Timeline状態:', { status, isLoading, isProcessing, timelineLength: timeline.length })
  console.log('Timeline turns:', turns)
  console.log('Framer Motion Debug: AnimatePresence rendered', { turnsCount: turns.length, isProcessing })

  // 手動リフレッシュ機能
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      console.log('手動タイムラインリフレッシュ開始...')
      const response = await fetch('/api/simulation/status')
      const data = await response.json()
      
      if (response.ok && data.timeline) {
        const store = useSimulationStore.getState()
        store.updateTimeline(data.timeline)
        console.log('タイムラインリフレッシュ完了:', data.timeline.length, '件のエントリ')
      }
    } catch (error) {
      console.error('タイムラインリフレッシュエラー:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 新しいターンが追加されたときに上部にスクロール
  useEffect(() => {
    if (timelineRef.current && timeline.length > 0) {
      // アニメーションと合わせてスクロールのタイミングを調整
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }
      }, 50) // より短い遅延で滑らかなスクロール
    }
  }, [timeline.length])

  // 全ターン開閉のトグル
  const toggleAllTurns = () => {
    setIsGlobalExpanded(prev => prev === true ? false : true)
    console.log('Framer Motion Debug: Toggle all turns', { newState: isGlobalExpanded === true ? false : true })
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* タイムライン内容 - スクロール可能エリア */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-y-auto neo-scrollbar relative"
        style={{ 
          background: 'var(--neo-bg)',
          ...(isProcessing && {
            opacity: 0.9,
          })
        }}
      >
        {/* ローディングオーバーレイ */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{
                background: 'rgba(240, 240, 243, 0.7)',
                backdropFilter: 'blur(2px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onAnimationStart={() => console.log('Framer Motion Debug: Loading animation started')}
              onAnimationComplete={() => console.log('Framer Motion Debug: Loading animation completed')}
            >
              <motion.div
                className="flex flex-col items-center gap-3 p-6 rounded-xl"
                style={{
                  background: 'var(--neo-element)',
                  boxShadow: 'var(--neo-shadow-floating)',
                }}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
              >
                <motion.div
                  className="w-8 h-8 border-2 border-current border-t-transparent rounded-full"
                  style={{ color: 'var(--neo-accent)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  onAnimationStart={() => console.log('Framer Motion Debug: Spinner animation started')}
                />
                <div className="text-sm font-medium" style={{ color: 'var(--neo-text)' }}>
                  Processing Next Turn...
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 全部開くボタンとリフレッシュボタン - 固定位置（右上） */}
        {turns.length > 0 && (
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            {/* リフレッシュボタン */}
            <button
              className="neo-button flex items-center gap-1 px-2 py-1 text-xs"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="タイムラインを更新"
              style={{
                minWidth: '32px',
                fontSize: '0.75rem',
                background: 'var(--neo-element)',
                boxShadow: 'var(--neo-shadow-raised)',
                opacity: isRefreshing ? 0.6 : 1,
              }}
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <RefreshCw className="h-3 w-3" />
              </motion.div>
            </button>

            {/* 全開閉ボタン */}
            <button
              className="neo-button flex items-center gap-1 px-2 py-1 text-xs"
              onClick={toggleAllTurns}
              title={isGlobalExpanded === true ? 'Collapse All' : 'Expand All'}
              style={{
                minWidth: '32px',
                fontSize: '0.75rem',
                background: 'var(--neo-element)',
                boxShadow: 'var(--neo-shadow-raised)',
              }}
            >
              <motion.div
                animate={{ rotate: isGlobalExpanded === true ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                onAnimationStart={() => console.log('Framer Motion Debug: Button rotation started')}
                onAnimationComplete={() => console.log('Framer Motion Debug: Button rotation completed')}
              >
                {isGlobalExpanded === true ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </motion.div>
            </button>
          </div>
        )}

        {turns.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-6" style={{ color: 'var(--neo-text-secondary)' }} />
            <p className="text-xl mb-3 font-semibold" style={{ color: 'var(--neo-text-secondary)' }}>
              シミュレーションを開始してください
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--neo-text-secondary)' }}>
              ターンが進行するとここに表示されます
            </p>
            
            {/* 空の状態でもFile Editボタンを表示 - 控えめなスタイル */}
            {!inspectionPanelOpen && onInspectionPanelToggle && (
              <button
                className="flex items-center gap-1.5 px-3 py-2 mx-auto text-sm"
                onClick={onInspectionPanelToggle}
                style={{
                  background: 'var(--neo-element)',
                  color: 'var(--neo-text)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid var(--neo-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--neo-accent)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--neo-element)';
                  e.currentTarget.style.color = 'var(--neo-text)';
                }}
                title="ファイル編集パネルを開く"
              >
                <File className="h-3.5 w-3.5" />
                <span>ファイル編集</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence mode="wait">
              {/* 処理中の表示を最上部に */}
              {isProcessing && (
                <motion.div
                  key="loading-turn"
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: [0.04, 0.62, 0.23, 0.98] 
                  }}
                  layout
                  onAnimationStart={() => console.log('Framer Motion Debug: Loading turn animation started')}
                  onAnimationComplete={() => console.log('Framer Motion Debug: Loading turn animation completed')}
                >
                  <LoadingTurn turnNumber={timeline.length + 1} />
                </motion.div>
              )}
              
              {turns.map((turn, index) => {
                // より一意なキーを生成
                const uniqueKey = `turn-${turn.step}-${turn.character}-${turn.action_type}-${turn.timestamp || index}`
                
                console.log('Framer Motion Debug: Rendering turn motion.div', { uniqueKey, index })
                
                return (
                  <motion.div
                    key={uniqueKey}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ 
                      duration: 0.3,
                      delay: index === 0 ? 0.1 : 0, // 最新のターンは少し遅らせて滑らかに
                      ease: [0.25, 0.46, 0.45, 0.94] // よりスムーズなイージング
                    }}
                    layout
                    layoutDependency={timeline.length} // timeline.lengthが変わった時のみレイアウトアニメーション
                    onAnimationStart={() => console.log('Framer Motion Debug: Turn animation started', uniqueKey)}
                    onAnimationComplete={() => console.log('Framer Motion Debug: Turn animation completed', uniqueKey)}
                    style={{
                      // アニメーション中の滑らかさを保つため、transform-originを設定
                      transformOrigin: 'top center'
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
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
} 