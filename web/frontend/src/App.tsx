import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  NeumorphismCard, 
  NeumorphismCardContent, 
  NeumorphismCardDescription, 
  NeumorphismCardHeader, 
  NeumorphismCardTitle 
} from "@/components/ui/neumorphism-card"
import { NeumorphismButton } from "@/components/ui/neumorphism-button"
import { HamburgerMenu } from "@/components/ui/HamburgerMenu"
import { Timeline } from "@/components/Timeline/Timeline"
import { SimulationControls } from "@/components/Controls/SimulationControls"
import { InspectionPanel } from "@/components/Layout/InspectionPanel"
import { useSimulationStore } from "@/stores/simulationStore"
import { fadeIn, slideUp } from "@/lib/animations"
import { Sparkles, Clock, File } from "lucide-react"

function App() {
  const [inspectionPanelOpen, setInspectionPanelOpen] = useState(false)
  const [inspectionPanelWidth, setInspectionPanelWidth] = useState(350)
  const simulationStore = useSimulationStore()

  // 画面サイズに応じてパネルの初期状態を調整
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth
      
      // 小画面では自動的にパネルを閉じる
      if (screenWidth < 1024) {
        setInspectionPanelOpen(false)
      }
      
      // パネル幅を画面サイズに応じて調整（画面幅の25-30%程度）
      const idealWidth = Math.floor(screenWidth * 0.28)
      const maxWidth = Math.min(500, screenWidth * 0.35)
      const minWidth = 300
      
      const newWidth = Math.max(minWidth, Math.min(maxWidth, idealWidth))
      
      if (Math.abs(inspectionPanelWidth - newWidth) > 20) {
        setInspectionPanelWidth(newWidth)
      }
    }

    // 初期化時に適切な幅を設定
    const screenWidth = window.innerWidth
    const idealWidth = Math.floor(screenWidth * 0.28)
    const maxWidth = Math.min(500, screenWidth * 0.35)
    const minWidth = 300
    const initialWidth = Math.max(minWidth, Math.min(maxWidth, idealWidth))
    setInspectionPanelWidth(initialWidth)

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleInspectionPanelToggle = () => {
    setInspectionPanelOpen(!inspectionPanelOpen)
  }

  const handleInspectionPanelWidthChange = (width: number) => {
    setInspectionPanelWidth(width)
  }

  // シーン名を取得（デフォルトは「シーン」）
  const sceneName = simulationStore.scene_name || "シーン"

  return (
    <div className="min-h-screen flex flex-col">
      {/* メインコンテンツエリア - 3列分割 */}
      <div className="flex-1 flex relative">
        {/* 左列: Control Panel */}
        <motion.div
          className="left-panel"
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <NeumorphismCard className="control-panel-left h-full">
            <NeumorphismCardContent className="flex-1 overflow-hidden">
              <SimulationControls />
            </NeumorphismCardContent>
          </NeumorphismCard>
        </motion.div>

        {/* 中央列: Timeline */}
        <motion.div
          className="center-panel"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          style={{
            marginRight: inspectionPanelOpen ? `${inspectionPanelWidth}px` : '0px'
          }}
        >
          <NeumorphismCard className="center-panel-card h-full">
            {/* タイムラインコンテンツ */}
            <NeumorphismCardContent className="flex-1 overflow-hidden p-0">
              <Timeline 
                className="h-full" 
                onInspectionPanelToggle={handleInspectionPanelToggle}
                inspectionPanelOpen={inspectionPanelOpen}
              />
            </NeumorphismCardContent>
          </NeumorphismCard>
        </motion.div>

        {/* 右列: Inspection Panel */}
        <motion.div
          className="right-panel-container"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <InspectionPanel
            isOpen={inspectionPanelOpen}
            onToggle={handleInspectionPanelToggle}
            width={inspectionPanelWidth}
            onWidthChange={handleInspectionPanelWidthChange}
            minWidth={300}
            maxWidth={Math.min(500, window.innerWidth * 0.35)}
          />
        </motion.div>

        {/* 左下に設定ボタン */}
        <motion.div
          className="fixed bottom-6 left-6 z-50"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <HamburgerMenu />
        </motion.div>
      </div>
    </div>
  )
}

export default App
