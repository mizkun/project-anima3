import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Activity, MessageCircle, Loader2 } from 'lucide-react'

interface LoadingTurnProps {
  turnNumber: number
}

export const LoadingTurn: React.FC<LoadingTurnProps> = ({ turnNumber }) => {
  return (
    <motion.div 
      className="neo-card-subtle relative"
      style={{
        margin: '0 0 8px 0',
        padding: '12px',
        background: 'var(--neo-element)',
        border: '2px dashed var(--neo-accent)',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ターン番号とローディング状態 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="neo-element w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--neo-accent)', color: 'white' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-4 h-4" />
          </motion.div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--neo-text)' }}>
              ターン {turnNumber}
            </div>
            <div className="text-xs" style={{ color: 'var(--neo-accent)' }}>
              処理中...
            </div>
          </div>
        </div>
        
        <motion.div 
          className="w-6 h-6 rounded-full"
          style={{ background: 'var(--neo-accent)' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* 処理段階のインジケーター */}
      <div className="space-y-3">
        {/* 思考処理 */}
        <motion.div
          className="neo-card-subtle"
          style={{ 
            padding: '8px', 
            background: 'var(--neo-surface)',
            opacity: 0.8
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="neo-element-subtle p-1 rounded flex items-center justify-center"
              style={{ background: 'var(--neo-accent-light)' }}
            >
              <Brain className="w-3 h-3" style={{ color: 'white' }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--neo-accent-light)' }}>
                思考生成中
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--neo-accent-light)' }}
                    animate={{ scale: [1, 1.5, 1] }}
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
          className="neo-card-subtle"
          style={{ 
            padding: '8px', 
            background: 'var(--neo-surface)',
            opacity: 0.6
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="neo-element-subtle p-1 rounded flex items-center justify-center"
              style={{ background: 'var(--neo-success)' }}
            >
              <Activity className="w-3 h-3" style={{ color: 'white' }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--neo-success)' }}>
                行動生成中
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--neo-success)' }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      delay: i * 0.2 + 0.5
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 発言処理 */}
        <motion.div
          className="neo-card-subtle"
          style={{ 
            padding: '8px', 
            background: 'var(--neo-surface)',
            opacity: 0.4
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="neo-element-subtle p-1 rounded flex items-center justify-center"
              style={{ background: 'var(--neo-accent)' }}
            >
              <MessageCircle className="w-3 h-3" style={{ color: 'white' }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--neo-accent)' }}>
                発言生成中
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--neo-accent)' }}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      delay: i * 0.2 + 1
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 光沢エフェクト */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
} 