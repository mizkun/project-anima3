import React from 'react'
import { motion } from 'framer-motion'
import { NeumorphismCard } from '@/components/ui/neumorphism-card'
import { Loader2, Brain, Activity, MessageCircle } from 'lucide-react'

interface LoadingTurnProps {
  turnNumber: number
}

export const LoadingTurn: React.FC<LoadingTurnProps> = ({ turnNumber }) => {
  return (
    <NeumorphismCard className="relative border-2 border-dashed border-blue-300">
      {/* ターン番号とローディング状態 */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="neumorphism-status w-8 h-8 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">ターン {turnNumber}</h3>
            <p className="text-xs text-blue-600">処理中...</p>
          </div>
        </div>
        
        <div className="neumorphism-status w-6 h-6 relative">
          <div className="absolute inset-1 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* 処理段階のインジケーター */}
      <div className="px-4 pb-4">
        <div className="space-y-3">
          {/* 思考処理 */}
          <motion.div
            className="neumorphism-inset rounded-xl p-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-3">
              <div className="neumorphism-icon p-2">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-purple-700 mb-1">思考生成中</h5>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 行動処理 */}
          <motion.div
            className="neumorphism-inset rounded-xl p-4 opacity-60"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <div className="neumorphism-icon p-2">
                <Activity className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-green-700 mb-1">行動決定中</h5>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <motion.div
                    className="bg-green-500 h-1 rounded-full"
                    animate={{ width: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* 発言処理 */}
          <motion.div
            className="neumorphism-inset rounded-xl p-4 opacity-40"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="flex items-center gap-3">
              <div className="neumorphism-icon p-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-blue-700 mb-1">発言生成待機中</h5>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-blue-300 rounded-full opacity-30"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 処理中のオーバーレイ効果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse rounded-2xl pointer-events-none" />
    </NeumorphismCard>
  )
} 