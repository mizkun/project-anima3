import React from 'react'
import { motion } from 'framer-motion'
import { 
  Zap,
  Brain,
  UserPlus,
  Settings
} from 'lucide-react'
import type { TimelineEntry } from '@/types/simulation'

interface InterventionItemProps {
  intervention: TimelineEntry
  turnNumber: number
}

export const InterventionItem: React.FC<InterventionItemProps> = ({ 
  intervention, 
  turnNumber 
}) => {
  // 介入タイプに応じたアイコンと色を取得
  const getInterventionIcon = (interventionType: string) => {
    switch (interventionType) {
      case '全体向け介入':
        return <Zap className="w-4 h-4" />
      case 'キャラクター向け介入':
        return <Brain className="w-4 h-4" />
      case 'キャラクター追加':
        return <UserPlus className="w-4 h-4" />
      case 'キャラクター削除':
        return <UserPlus className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  const getInterventionColor = (interventionType: string) => {
    switch (interventionType) {
      case '全体向け介入':
        return 'var(--neo-warning)'
      case 'キャラクター向け介入':
        return 'var(--neo-accent-light)'
      case 'キャラクター追加':
        return 'var(--neo-success)'
      case 'キャラクター削除':
        return 'var(--neo-error)'
      default:
        return 'var(--neo-text-secondary)'
    }
  }

  const interventionType = intervention.metadata?.intervention_type || '介入'
  const targetCharacter = intervention.metadata?.target_character
  const iconColor = getInterventionColor(interventionType)

  return (
    <motion.div 
      className="neo-card-subtle relative border-l-4"
      style={{
        margin: '0 0 8px 0',
        padding: '12px',
        background: 'var(--neo-element)',
        borderLeftColor: iconColor,
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.005 }}
    >
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="neo-element w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ 
              background: iconColor,
              color: 'white'
            }}
            whileHover={{ scale: 1.1 }}
          >
            {getInterventionIcon(interventionType)}
          </motion.div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--neo-text)' }}>
              ユーザー介入
            </div>
            <div className="text-xs" style={{ color: iconColor }}>
              ターン {turnNumber}
            </div>
          </div>
        </div>

        <motion.div
          className="neo-element-subtle px-2 py-1 rounded-md text-xs font-medium"
          style={{ 
            color: iconColor,
            background: `${iconColor}20`
          }}
          whileHover={{ scale: 1.05 }}
        >
          {interventionType}
        </motion.div>
      </div>

      {/* ターゲットキャラクター表示 */}
      {targetCharacter && (
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium" style={{ color: 'var(--neo-text-secondary)' }}>
              対象:
            </div>
            <div 
              className="neo-element-subtle px-2 py-1 rounded text-xs"
              style={{ color: 'var(--neo-text)' }}
            >
              {targetCharacter}
            </div>
          </div>
        </div>
      )}

      {/* 介入内容 */}
      <div className="text-sm leading-relaxed" style={{ color: 'var(--neo-text)' }}>
        {intervention.content}
      </div>

      {/* 介入効果のインジケーター */}
      <motion.div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{ background: iconColor }}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7]
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