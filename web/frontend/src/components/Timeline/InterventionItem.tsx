import React from 'react'
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Chip
} from '@mui/material'
import { 
  Update as UpdateIcon,
  Psychology as PsychologyIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
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
        return <UpdateIcon sx={{ fontSize: 16 }} />
      case 'キャラクター向け介入':
        return <PsychologyIcon sx={{ fontSize: 16 }} />
      case 'キャラクター追加':
        return <PersonAddIcon sx={{ fontSize: 16 }} />
      case 'キャラクター削除':
        return <PersonAddIcon sx={{ fontSize: 16 }} />
      default:
        return <SettingsIcon sx={{ fontSize: 16 }} />
    }
  }

  const getInterventionColor = (interventionType: string) => {
    switch (interventionType) {
      case '全体向け介入':
        return 'warning'
      case 'キャラクター向け介入':
        return 'secondary'
      case 'キャラクター追加':
        return 'success'
      case 'キャラクター削除':
        return 'error'
      default:
        return 'default'
    }
  }

  const interventionType = intervention.metadata?.intervention_type || '介入'
  const targetCharacter = intervention.metadata?.target_character

  return (
    <Card 
      variant="outlined"
      sx={{ 
        width: '100%',
        position: 'relative',
        borderColor: 'warning.main',
        borderStyle: 'dashed',
        bgcolor: 'warning.50',
        '&:hover': {
          bgcolor: 'warning.100'
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* 介入アイコンとタイプ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
            <Chip
              icon={getInterventionIcon(interventionType)}
              label="介入"
              size="small"
              color={getInterventionColor(interventionType) as any}
              variant="filled"
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            />
          </Box>

          {/* 介入内容 */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="warning.dark">
                {interventionType}
              </Typography>
              {targetCharacter && (
                <Chip 
                  label={targetCharacter} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
            
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              {intervention.content.replace(/^\[.*?\]\s*/, '')} {/* [介入タイプ]プレフィックスを除去 */}
            </Typography>

            {/* タイムスタンプ */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {new Date(intervention.timestamp).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
} 