import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { 
  Chat as ChatIcon, 
  Psychology as ThinkIcon, 
  DirectionsRun as ActionIcon,
  Info as InfoIcon 
} from '@mui/icons-material'

interface ActionDisplayProps {
  action: {
    type: 'speak' | 'think' | 'action' | 'system'
    content: string
    character?: string
  }
}

export const ActionDisplay: React.FC<ActionDisplayProps> = ({ action }) => {
  const getActionIcon = () => {
    switch (action.type) {
      case 'speak':
        return <ChatIcon sx={{ fontSize: '1.25rem', color: 'primary.main' }} />
      case 'think':
        return <ThinkIcon sx={{ fontSize: '1.25rem', color: 'secondary.main' }} />
      case 'action':
        return <ActionIcon sx={{ fontSize: '1.25rem', color: 'success.main' }} />
      case 'system':
        return <InfoIcon sx={{ fontSize: '1.25rem', color: 'info.main' }} />
      default:
        return <InfoIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />
    }
  }

  const getActionColor = () => {
    switch (action.type) {
      case 'speak':
        return 'primary'
      case 'think':
        return 'secondary'
      case 'action':
        return 'success'
      case 'system':
        return 'info'
      default:
        return 'default'
    }
  }

  const getActionLabel = () => {
    switch (action.type) {
      case 'speak':
        return '発言'
      case 'think':
        return '思考'
      case 'action':
        return '行動'
      case 'system':
        return 'システム'
      default:
        return '不明'
    }
  }

  return (
    <Box sx={{ 
      p: 2, 
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {getActionIcon()}
        <Chip 
          label={getActionLabel()} 
          color={getActionColor() as any}
          size="small"
          variant="outlined"
        />
        {action.character && (
          <Typography variant="caption" color="text.secondary">
            by {action.character}
          </Typography>
        )}
      </Box>
      
      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
        {action.content}
      </Typography>
    </Box>
  )
} 