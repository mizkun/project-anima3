import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Settings, Info, Bug, Cpu } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { NeumorphismButton } from './neumorphism-button'
import { DebugPanel } from '@/components/Debug/DebugPanel'
import { ModelSelector } from '@/components/Controls/ModelSelector'

export const HamburgerMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDebugOpen, setIsDebugOpen] = useState(false)
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)

  // モデル選択の状態管理
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash')

  const handleModelChange = (provider: string, model: string) => {
    setSelectedProvider(provider)
    setSelectedModel(model)
  }

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
        setIsModelSelectorOpen(false)
      }
    }

    if (isOpen || isModelSelectorOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, isModelSelectorOpen])

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
      icon: Cpu,
      label: 'モデル設定',
      onClick: () => {
        setIsModelSelectorOpen(true)
        setIsOpen(false)
      },
      variant: 'secondary' as const
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

  // 開発環境でのみDebugアイテムを追加
  if (import.meta.env.DEV) {
    menuItems.push({
      icon: Bug,
      label: 'デバッグ',
      onClick: () => {
        setIsDebugOpen(!isDebugOpen)
        setIsOpen(false)
      },
      variant: 'secondary' as const
    })
  }

  return (
    <>
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

      {/* モデル選択パネル */}
      <AnimatePresence>
        {isModelSelectorOpen && (
          <>
            {/* 背景オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsModelSelectorOpen(false)}
            />

            {/* モデル選択パネル */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="neumorphism-card rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    モデル設定
                  </h3>
                  <NeumorphismButton
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsModelSelectorOpen(false)}
                    className="w-8 h-8"
                  >
                    <Settings className="h-4 w-4" />
                  </NeumorphismButton>
                </div>
                
                <ModelSelector
                  selectedProvider={selectedProvider}
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  disabled={false}
                />

                <div className="mt-6 flex justify-end">
                  <NeumorphismButton
                    variant="primary"
                    onClick={() => setIsModelSelectorOpen(false)}
                  >
                    完了
                  </NeumorphismButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DebugPanel */}
      {import.meta.env.DEV && isDebugOpen && (
        <DebugPanel onClose={() => setIsDebugOpen(false)} />
      )}
    </>
  )
} 