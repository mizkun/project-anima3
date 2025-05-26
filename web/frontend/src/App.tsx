import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fadeIn, slideUp } from "@/lib/animations"
import { Play, Settings, BarChart3 } from "lucide-react"

function App() {
  return (
    <div className="min-h-screen bg-background">
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
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Project Anima
          </h1>
          <p className="text-xl text-muted-foreground">
            Web UI for AI Character Simulation
          </p>
        </motion.header>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                シミュレーション実行
              </CardTitle>
              <CardDescription>
                AIキャラクターのシミュレーションを開始・制御します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                シミュレーション開始
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                設定管理
              </CardTitle>
              <CardDescription>
                プロンプトテンプレートやモデル設定を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                設定を開く
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                結果表示
              </CardTitle>
              <CardDescription>
                シミュレーション結果とタイムラインを表示します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                結果を見る
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="text-center"
          variants={slideUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.6 }}
        >
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>ステータス</CardTitle>
              <CardDescription>
                現在のシステム状態
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span>システム準備完了</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default App
