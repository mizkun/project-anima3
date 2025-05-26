import { motion } from "framer-motion"
import { NeumorphismButton } from "@/components/ui/neumorphism-button"
import { 
  NeumorphismCard, 
  NeumorphismCardContent, 
  NeumorphismCardDescription, 
  NeumorphismCardHeader, 
  NeumorphismCardTitle 
} from "@/components/ui/neumorphism-card"
import { Timeline } from "@/components/Timeline/Timeline"
import { SimulationControls } from "@/components/Controls/SimulationControls"
import { fadeIn, slideUp } from "@/lib/animations"
import { Play, Settings, BarChart3 } from "lucide-react"

function App() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(145deg, #f0f0f3, #e6e6e9)' }}>
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={fadeIn}
        initial="initial"
        animate="animate"
      >
        <motion.header
          className="text-center mb-12"
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <div className="neumorphism-inset rounded-3xl p-8 mb-8 inline-block">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Project Anima
            </h1>
            <p className="text-xl text-gray-600">
              Web UI for AI Character Simulation
            </p>
          </div>
        </motion.header>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <NeumorphismCard>
            <NeumorphismCardHeader>
              <NeumorphismCardTitle className="flex items-center gap-3">
                <div className="neumorphism-icon p-3">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                シミュレーション実行
              </NeumorphismCardTitle>
              <NeumorphismCardDescription>
                AIキャラクターのシミュレーションを開始・制御します
              </NeumorphismCardDescription>
            </NeumorphismCardHeader>
            <NeumorphismCardContent>
              <SimulationControls />
            </NeumorphismCardContent>
          </NeumorphismCard>

          <NeumorphismCard>
            <NeumorphismCardHeader>
              <NeumorphismCardTitle className="flex items-center gap-3">
                <div className="neumorphism-icon p-3">
                  <Settings className="h-6 w-6 text-gray-600" />
                </div>
                設定管理
              </NeumorphismCardTitle>
              <NeumorphismCardDescription>
                プロンプトテンプレートやモデル設定を管理します
              </NeumorphismCardDescription>
            </NeumorphismCardHeader>
            <NeumorphismCardContent>
              <NeumorphismButton variant="secondary" className="w-full">
                設定を開く
              </NeumorphismButton>
            </NeumorphismCardContent>
          </NeumorphismCard>

          <NeumorphismCard>
            <NeumorphismCardHeader>
              <NeumorphismCardTitle className="flex items-center gap-3">
                <div className="neumorphism-icon p-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                結果表示
              </NeumorphismCardTitle>
              <NeumorphismCardDescription>
                シミュレーション結果とタイムラインを表示します
              </NeumorphismCardDescription>
            </NeumorphismCardHeader>
            <NeumorphismCardContent>
              <NeumorphismButton variant="success" className="w-full">
                結果を見る
              </NeumorphismButton>
            </NeumorphismCardContent>
          </NeumorphismCard>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          {/* タイムライン表示 */}
          <div className="lg:col-span-1">
            <Timeline className="h-96" />
          </div>

          {/* システムステータス */}
          <div className="lg:col-span-1">
            <NeumorphismCard className="h-96">
              <NeumorphismCardHeader>
                <NeumorphismCardTitle className="text-center">
                  システムステータス
                </NeumorphismCardTitle>
                <NeumorphismCardDescription className="text-center">
                  現在のシステム状態
                </NeumorphismCardDescription>
              </NeumorphismCardHeader>
              <NeumorphismCardContent>
                <div className="flex items-center justify-center gap-3">
                  <div className="neumorphism-status w-4 h-4 relative">
                    <div className="absolute inset-1 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-green-600 font-semibold">システム準備完了</span>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="neumorphism-inset rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">CPU使用率</div>
                    <div className="text-lg font-bold text-gray-700">12%</div>
                  </div>
                  <div className="neumorphism-inset rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">メモリ使用率</div>
                    <div className="text-lg font-bold text-gray-700">34%</div>
                  </div>
                </div>
              </NeumorphismCardContent>
            </NeumorphismCard>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default App
