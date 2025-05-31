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

  // テーマに応じたアイコンとラベルを取得
  const getThemeIcon = () => {
    if (theme === 'light') return Sun
    if (theme === 'dark') return Moon
    return Sun // systemの場合のデフォルト
  }

  const getThemeLabel = () => {
    if (theme === 'light') return 'ダークモード'
    if (theme === 'dark') return 'ライトモード'
    return 'ダークモード' // systemの場合のデフォルト
  }

  const menuItems = [
    {
      icon: getThemeIcon(),
      label: getThemeLabel(),
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
          size="md"
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
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute top-full right-0 mt-2 w-64 z-50"
                style={{
                  background: 'var(--neo-surface)',
                  boxShadow: 'var(--neo-shadow-floating)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                }}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200/10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">PA</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--neo-text)' }}>
                        Project Anima
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--neo-text-secondary)' }}>
                        設定とツール
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {menuItems.map((item, index) => {
                      const IconComponent = item.icon
                      return (
                        <motion.button
                          key={index}
                          onClick={item.onClick}
                          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                          style={{
                            background: item.variant === 'primary' ? 'var(--neo-accent)' : 'transparent',
                            color: item.variant === 'primary' ? 'white' : 'var(--neo-text)',
                          }}
                          whileHover={{
                            scale: 1.02,
                            backgroundColor: item.variant === 'primary' 
                              ? 'var(--neo-accent-light)' 
                              : 'rgba(255, 255, 255, 0.05)'
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* モデル選択ダイアログ */}
      <AnimatePresence>
        {isModelSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModelSelectorOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--neo-surface)',
                boxShadow: 'var(--neo-shadow-floating)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--neo-text)' }}>
                  モデル設定
                </h3>
                <NeumorphismButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModelSelectorOpen(false)}
                  className="w-8 h-8"
                >
                  ✕
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* デバッグパネル */}
      <AnimatePresence>
        {isDebugOpen && (
          <DebugPanel onClose={() => setIsDebugOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
} 