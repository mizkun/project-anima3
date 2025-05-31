import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const AnimationTest: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [count, setCount] = useState(0)

  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">アニメーションテスト</h2>
      
      {/* 基本的なモーションテスト */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基本モーション</h3>
        <motion.div
          className="w-24 h-24 bg-blue-500 rounded-lg"
          whileHover={{ scale: 1.1, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      </div>

      {/* AnimatePresenceテスト */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">AnimatePresence</h3>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          {isVisible ? '隠す' : '表示'}
        </button>
        
        <AnimatePresence>
          {isVisible && (
            <motion.div
              className="w-32 h-32 bg-red-500 rounded-lg"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* カウンターアニメーション */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">レイアウトアニメーション</h3>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg"
        >
          カウント追加: {count}
        </button>
        
        <div className="space-y-2">
          <AnimatePresence>
            {Array.from({ length: count }, (_, i) => (
              <motion.div
                key={i}
                className="p-4 bg-yellow-400 rounded-lg"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                layout
                transition={{ duration: 0.3 }}
              >
                アイテム {i + 1}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 