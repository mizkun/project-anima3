import { motion } from "framer-motion"
import { useState } from "react"
import { 
  NeumorphismCard, 
  NeumorphismCardContent, 
  NeumorphismCardDescription, 
  NeumorphismCardHeader, 
  NeumorphismCardTitle 
} from "@/components/ui/neumorphism-card"
import { HamburgerMenu } from "@/components/ui/HamburgerMenu"
import { Timeline } from "@/components/Timeline/Timeline"
import { SimulationControls } from "@/components/Controls/SimulationControls"
import { EditorContainer } from "@/components/Editors/EditorContainer"
import { DebugPanel } from "@/components/Debug/DebugPanel"
import { fadeIn, slideUp } from "@/lib/animations"
import { Play, Edit, Sparkles, Clock } from "lucide-react"

function App() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'editor'>('timeline')

  return (
    <div className="min-h-screen flex flex-col">
      {/* メインコンテンツエリア - 左右分割 */}
      <div className="flex-1 flex relative">
        {/* 左側: Control Panel */}
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

        {/* 右側: Timeline & File Edit タブ */}
        <motion.div
          className="right-panel"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <NeumorphismCard className="right-panel-card h-full">
            {/* タブヘッダー */}
            <div className="tab-header">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`tab-button ${activeTab === 'timeline' ? 'tab-active' : 'tab-inactive'}`}
              >
                <div className="neumorphism-icon p-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`tab-button ${activeTab === 'editor' ? 'tab-active' : 'tab-inactive'}`}
              >
                <div className="neumorphism-icon p-2">
                  <Edit className="h-4 w-4 text-purple-400" />
                </div>
                File Edit
              </button>
            </div>

            {/* タブコンテンツ */}
            <NeumorphismCardContent className="flex-1 overflow-hidden p-0">
              {activeTab === 'timeline' ? (
                <Timeline className="h-full" />
              ) : (
                <div className="h-full p-6">
                  <EditorContainer />
                </div>
              )}
            </NeumorphismCardContent>
          </NeumorphismCard>
        </motion.div>

        {/* 左下に設定ボタン */}
        <motion.div
          className="fixed bottom-6 left-6 z-50"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <HamburgerMenu />
        </motion.div>
      </div>

      {/* 開発環境でのみデバッグパネルを表示 */}
      {import.meta.env.DEV && <DebugPanel />}
    </div>
  )
}

export default App
