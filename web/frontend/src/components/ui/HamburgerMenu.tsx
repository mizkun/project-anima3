import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Settings, Info } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { NeumorphismButton } from './neumorphism-button'

export const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const menuItems = [
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? 'ライトモード' : 'ダークモード',
      onClick: () => {
        toggleTheme()
        setIsOpen(false)
      },
      variant: 'primary' as const
    },
    {
      icon: Settings,
      label: '設定',
      onClick: () => {
        console.log('設定を開く')
        setIsOpen(false)
      },
      variant: 'secondary' as const
    },
    {
      icon: Info,
      label: 'について',
      onClick: () => {
        console.log('アバウトを開く')
        setIsOpen(false)
      },
      variant: 'secondary' as const
    }
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* 設定ボタン */}
      <NeumorphismButton
        variant="secondary"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 w-12 h-12"
        aria-label="設定を開く"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Settings className="h-5 w-5" />
        </motion.div>
      </NeumorphismButton>

      {/* メニューオーバーレイ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* メニューパネル */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 mb-2 w-64 z-50"
            >
              <div className="neumorphism-card rounded-2xl p-4 space-y-2">
                {/* メニューヘッダー */}
                <div className="px-3 py-2 border-b border-gray-600/30 dark:border-gray-600/30 border-gray-300/30">
                  <h3 className="text-sm font-semibold text-gray-300 dark:text-gray-300 text-gray-700">
                    設定
                  </h3>
                </div>

                {/* メニューアイテム */}
                <div className="space-y-1">
                  {menuItems.map((item, index) => {
                    const IconComponent = item.icon
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <NeumorphismButton
                          variant={item.variant}
                          onClick={item.onClick}
                          className="w-full justify-start gap-3 h-12"
                        >
                          <IconComponent className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NeumorphismButton>
                      </motion.div>
                    )
                  })}
                </div>

                {/* フッター */}
                <div className="px-3 py-2 border-t border-gray-600/30 dark:border-gray-600/30 border-gray-300/30 mt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-gray-600">
                    Project Anima v1.0.0
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
} 