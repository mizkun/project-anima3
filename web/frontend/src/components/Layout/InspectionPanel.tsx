import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { NeumorphismCard, NeumorphismCardContent } from '@/components/ui/neumorphism-card'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { EditorContainer } from '@/components/Editors/EditorContainer'
import { File, Settings, User, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface InspectionPanelProps {
  isOpen: boolean
  onToggle: () => void
  width: number
  onWidthChange: (width: number) => void
  minWidth?: number
  maxWidth?: number
}

type TabType = 'file-edit' | 'settings' | 'character'

interface Tab {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<{ className?: string }>
}

const tabs: Tab[] = [
  {
    id: 'file-edit',
    label: 'File Edit',
    icon: File,
    component: EditorContainer
  },
  // 将来的な拡張用
  // {
  //   id: 'settings',
  //   label: 'Settings',
  //   icon: Settings,
  //   component: SettingsPanel
  // },
  // {
  //   id: 'character',
  //   label: 'Character',
  //   icon: User,
  //   component: CharacterPanel
  // }
]

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  isOpen,
  onToggle,
  width,
  onWidthChange,
  minWidth = 300,
  maxWidth = 800
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('file-edit')
  const [isResizing, setIsResizing] = useState(false)

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component || EditorContainer

  // リサイズハンドラー
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)

    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX))
      onWidthChange(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (!isOpen) {
    return null
  }

  return (
    <motion.div
      className="inspection-panel"
      style={{ width }}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* リサイズハンドル */}
      <div
        className={`resize-handle ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleMouseDown}
      />

      {/* 既存のCSSクラスを活用したパネル構造 */}
      <div className="inspection-panel-card">
        {/* タブヘッダー */}
        <div className="inspection-tab-header">
          <div className="flex items-center flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inspection-tab-button ${
                  activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                }`}
              >
                <div className="neumorphism-icon p-1">
                  <tab.icon className="h-4 w-4" />
                </div>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <NeumorphismButton
            variant="secondary"
            size="sm"
            onClick={onToggle}
            className="inspection-panel-close"
            title="インスペクションパネルを閉じる"
          >
            <X className="h-4 w-4" />
          </NeumorphismButton>
        </div>

        {/* タブコンテンツ - 残りの高さを全て使用 */}
        <div className="flex-1 p-4 overflow-hidden">
          <ActiveComponent className="h-full" />
        </div>
      </div>
    </motion.div>
  )
} 