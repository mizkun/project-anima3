import React, { useState } from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { Send, MessageSquare, Users, Lightbulb, AlertTriangle } from 'lucide-react'

interface InterventionType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  placeholder: string
}

interface InterventionPanelProps {
  onIntervention: (type: string, content: string) => void
  disabled?: boolean
}

const INTERVENTION_TYPES: InterventionType[] = [
  {
    id: 'situation_update',
    name: '状況更新',
    description: '現在の状況に新しい要素を追加',
    icon: <AlertTriangle className="h-4 w-4" />,
    placeholder: '例: 突然雨が降り始めた'
  },
  {
    id: 'divine_revelation',
    name: '天啓付与',
    description: 'キャラクターに新しい情報や気づきを与える',
    icon: <Lightbulb className="h-4 w-4" />,
    placeholder: '例: 燐子は芽依の本当の気持ちに気づく'
  },
  {
    id: 'character_action',
    name: 'キャラクター操作',
    description: '特定のキャラクターに行動を指示',
    icon: <Users className="h-4 w-4" />,
    placeholder: '例: 新しいキャラクター「田中先生」が現れる'
  },
  {
    id: 'narrative_direction',
    name: '物語誘導',
    description: 'ストーリーの方向性を調整',
    icon: <MessageSquare className="h-4 w-4" />,
    placeholder: '例: 会話をより感情的な方向に導く'
  }
]

export const InterventionPanel: React.FC<InterventionPanelProps> = ({
  onIntervention,
  disabled = false
}) => {
  const [selectedType, setSelectedType] = useState<string>(INTERVENTION_TYPES[0].id)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedTypeData = INTERVENTION_TYPES.find(type => type.id === selectedType)

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onIntervention(selectedType, content.trim())
      setContent('')
    } catch (error) {
      console.error('介入の実行に失敗しました:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">介入タイプ</label>
        <div className="grid grid-cols-2 gap-2">
          {INTERVENTION_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              disabled={disabled}
              className={`p-3 rounded-lg text-left transition-colors ${
                selectedType === type.id
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-gray-700/30 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="text-blue-400">{type.icon}</div>
                <span className="text-sm font-medium text-gray-200">{type.name}</span>
              </div>
              <div className="text-xs text-gray-400">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">介入内容</label>
        <div className="neumorphism-inset rounded-lg p-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={selectedTypeData?.placeholder || '介入内容を入力してください...'}
            disabled={disabled || isSubmitting}
            className="w-full h-24 bg-transparent border-none outline-none resize-none text-sm text-gray-200 placeholder-gray-500 p-3"
          />
        </div>
        <div className="text-xs text-gray-500 text-right">
          Ctrl+Enter で送信 | {content.length}/500文字
        </div>
      </div>

      <NeumorphismButton
        variant="primary"
        onClick={handleSubmit}
        disabled={disabled || isSubmitting || !content.trim() || content.length > 500}
        className="w-full flex items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" />
        {isSubmitting ? '実行中...' : '介入実行'}
      </NeumorphismButton>

      {selectedTypeData && (
        <div className="neumorphism-inset rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-blue-400">{selectedTypeData.icon}</div>
            <span className="text-sm font-medium text-gray-200">{selectedTypeData.name}</span>
          </div>
          <div className="text-xs text-gray-400">{selectedTypeData.description}</div>
        </div>
      )}
    </div>
  )
} 