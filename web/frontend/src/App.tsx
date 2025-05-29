import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Timeline } from '@/components/Timeline/Timeline'
import { MinimalControls } from '@/components/Controls/MinimalControls'
import { IntegratedInspector } from '@/components/Inspector/IntegratedInspector'
import { useSimulationStore } from "@/stores/simulationStore"
import { fadeIn, slideUp } from "@/lib/animations"

function App() {
  const [inspectionPanelWidth, setInspectionPanelWidth] = useState(400)
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false)
  const simulationStore = useSimulationStore()

  // 画面サイズに応じてパネルの初期状態を調整
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth
      
      // パネル幅を画面サイズに応じて調整（画面幅の35-45%程度）
      const idealWidth = Math.floor(screenWidth * 0.4)
      const maxWidth = Math.min(600, screenWidth * 0.45)
      const minWidth = 350
      
      const newWidth = Math.max(minWidth, Math.min(maxWidth, idealWidth))
      
      if (Math.abs(inspectionPanelWidth - newWidth) > 20) {
        setInspectionPanelWidth(newWidth)
      }
    }

    // 初期化時に適切な幅を設定
    const screenWidth = window.innerWidth
    const idealWidth = Math.floor(screenWidth * 0.4)
    const maxWidth = Math.min(600, screenWidth * 0.45)
    const minWidth = 350
    const initialWidth = Math.max(minWidth, Math.min(maxWidth, idealWidth))
    setInspectionPanelWidth(initialWidth)

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleInspectionPanelWidthChange = (newWidth: number) => {
    setInspectionPanelWidth(newWidth)
  }

  // 折りたたみ状態に応じたマージンを計算
  const rightMargin = isInspectorCollapsed ? 28 : inspectionPanelWidth

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--neo-bg)' }}>
      {/* ヘッダーバー（オプション） */}
      <motion.header 
        className="neo-element-subtle px-6 py-4 mx-4 mt-4 rounded-lg"
        variants={fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--neo-text)' }}>
              Project Anima
            </h1>
            <p className="text-sm" style={{ color: 'var(--neo-text-secondary)' }}>
              AI Character Simulation Platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.div 
              className="neo-element w-3 h-3 rounded-full"
              animate={{ 
                backgroundColor: simulationStore.status === 'running' ? 'var(--neo-success)' : 'var(--neo-text-secondary)'
              }}
              transition={{ duration: 0.3 }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--neo-text-secondary)' }}>
              {simulationStore.status === 'running' ? 'Running' : 'Idle'}
            </span>
          </div>
        </div>
      </motion.header>

      {/* メインコンテンツエリア - 2列分割 */}
      <div className="flex-1 flex" style={{ height: 'calc(100vh - 100px)' }}>
        {/* 左列: タイムライン + ミニマルコントロール */}
        <motion.div
          className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
          style={{ marginRight: `${rightMargin}px` }}
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          {/* ミニマルコントロール */}
          <div className="flex-shrink-0 p-4">
            <motion.div 
              className="neo-card-floating"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <MinimalControls />
            </motion.div>
          </div>

          {/* タイムライン */}
          <div className="flex-1 overflow-hidden px-4 pb-4">
            <motion.div
              className="neo-card-floating h-full overflow-hidden"
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Timeline className="h-full" />
            </motion.div>
          </div>
        </motion.div>

        {/* 右列: 統合インスペクター */}
        <motion.div
          className="fixed right-0 top-0 h-full z-40"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <IntegratedInspector
            width={inspectionPanelWidth}
            onWidthChange={handleInspectionPanelWidthChange}
            isCollapsed={isInspectorCollapsed}
            onCollapseChange={setIsInspectorCollapsed}
          />
        </motion.div>
      </div>
    </div>
  )
}

export default App
