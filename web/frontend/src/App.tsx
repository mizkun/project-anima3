import React, { useState, useEffect } from 'react'
import { ThemeProvider, CssBaseline, Box } from '@mui/material'
import { motion } from 'framer-motion'
import { theme } from '@/theme/materialTheme'
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.default',
        }}
      >
        {/* メインコンテンツエリア - 2列分割 */}
        <Box sx={{ flex: 1, display: 'flex', height: '100vh' }}>
          {/* 左列: タイムライン + ミニマルコントロール */}
          <motion.div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              marginRight: `${rightMargin}px`,
              transition: 'margin-right 0.3s ease-in-out',
            }}
            variants={slideUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            {/* ミニマルコントロール */}
            <Box sx={{ flexShrink: 0, p: 1 }}>
              <MinimalControls />
            </Box>

            {/* タイムライン */}
            <Box sx={{ flex: 1, overflow: 'hidden', p: 1, pt: 0 }}>
              <Box
                sx={{
                  height: '100%',
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <Timeline className="h-full" />
              </Box>
            </Box>
          </motion.div>

          {/* 右列: 統合インスペクター */}
          <motion.div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              height: '100vh',
              zIndex: 1000,
            }}
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
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default App
