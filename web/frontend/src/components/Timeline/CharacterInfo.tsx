import React from 'react'
import { Avatar, Box, Typography } from '@mui/material'
import { Person } from '@mui/icons-material'

interface CharacterInfoProps {
  characterId: string
  characterName?: string
  className?: string
}

export const CharacterInfo: React.FC<CharacterInfoProps> = ({
  characterId,
  characterName,
  className = ""
}) => {
  const getCharacterColor = (id: string) => {
    const colors = [
      'primary.main',
      'secondary.main', 
      'success.main',
      'warning.main',
      'error.main',
      'info.main'
    ]
    const hash = id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  const displayName = characterName || characterId

  return (
    <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar 
        sx={{ 
          width: 40, 
          height: 40, 
          bgcolor: getCharacterColor(characterId),
          fontSize: '1rem'
        }}
      >
        {displayName.charAt(0).toUpperCase()}
      </Avatar>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'medium',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayName}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 0.5,
          mt: 0.5,
          p: 0.5,
          bgcolor: 'action.hover',
          borderRadius: 1
        }}>
          <Person sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            {characterId}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
} 