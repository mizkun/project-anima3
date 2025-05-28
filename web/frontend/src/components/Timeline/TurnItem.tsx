import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CharacterInfo } from './CharacterInfo'
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  IconButton,
  Collapse,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { ChevronDown, ChevronUp, Brain, Activity, MessageCircle, MoreHorizontal, Archive, RotateCcw } from 'lucide-react'
import type { TimelineEntry } from '@/types/simulation'
import { useSimulationStore } from '@/stores/simulationStore'

interface TurnItemProps {
  turn: TimelineEntry
  isLatest: boolean
  turnNumber: number
  isGlobalExpanded?: boolean
}

export const TurnItem: React.FC<TurnItemProps> = ({ 
  turn, 
  isLatest, 
  turnNumber, 
  isGlobalExpanded 
}) => {
  // デフォルトで発言のみ表示（閉じた状態）
  const [isExpanded, setIsExpanded] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const debugMode = useSimulationStore((state) => state.debugMode)

  // グローバル展開状態の変更を監視
  useEffect(() => {
    if (isGlobalExpanded !== undefined) {
      setIsExpanded(isGlobalExpanded)
    }
  }, [isGlobalExpanded])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleSaveAsMemory = () => {
    // TODO: キャラクターの記憶として保存する機能を実装
    console.log('Save as memory for turn:', turnNumber)
    handleMenuClose()
  }

  const handleRevertToTurn = () => {
    // TODO: このターンまで遡って再開する機能を実装
    console.log('Revert to turn:', turnNumber)
    handleMenuClose()
  }

  // ターンの内容を解析
  const lines = turn.content.split('\n')
  const thinkLine = lines.find(line => line.startsWith('思考:'))
  const actLine = lines.find(line => line.startsWith('行動:'))
  const talkLine = lines.find(line => line.startsWith('発言:'))
  
  // 発言の内容を取得（空の場合も考慮）
  const talkContent = talkLine ? talkLine.replace('発言: ', '').replace(/^「|」$/g, '').trim() : null
  const hasTalk = talkContent && talkContent.length > 0

  return (
    <Card 
      variant="outlined"
      sx={{ 
        width: '100%',
        position: 'relative',
        ...(isLatest && {
          borderColor: 'primary.main',
          borderWidth: 2,
          boxShadow: 2
        })
      }}
    >
      {/* ターン番号とキャラクター名 */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          p: 2,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover'
          }
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={turnNumber}
            size="small"
            color={isLatest ? "primary" : "default"}
            sx={{ 
              width: 32, 
              height: 32,
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          />
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">{turn.character}</Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 展開状態のインジケーター */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {thinkLine && (
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: isExpanded ? 'secondary.main' : 'grey.400' 
                }} 
              />
            )}
            {actLine && (
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: isExpanded ? 'success.main' : 'grey.400' 
                }} 
              />
            )}
            {hasTalk && (
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main' 
                }} 
              />
            )}
          </Box>
          
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}>
            {isExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </IconButton>
          
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreHorizontal size={16} />
          </IconButton>
        </Box>
      </Box>

      {/* 発言（常時表示） */}
      {hasTalk ? (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <MessageCircle size={16} color="#1976d2" style={{ marginTop: 4, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
              {talkContent}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <MessageCircle size={16} color="#9e9e9e" style={{ marginTop: 4, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ lineHeight: 1.5, color: 'text.secondary', fontStyle: 'italic' }}>
              （発言なし）
            </Typography>
          </Box>
        </Box>
      )}

      {/* 展開可能な思考・行動詳細 */}
      <Collapse in={isExpanded}>
        <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 思考 */}
            {thinkLine && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Brain size={16} color="#9c27b0" style={{ marginTop: 4, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" fontWeight="bold" color="secondary.main" sx={{ display: 'block', mb: 0.5 }}>
                    思考
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {thinkLine.replace('思考: ', '')}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* 行動 */}
            {actLine && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Activity size={16} color="#2e7d32" style={{ marginTop: 4, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" fontWeight="bold" color="success.main" sx={{ display: 'block', mb: 0.5 }}>
                    行動
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                    {actLine.replace('行動: ', '')}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
        
        {/* デバッグ情報（デバッグモード時のみ表示） */}
        {debugMode && (
          <Box sx={{ px: 2, pb: 2, borderTop: 1, borderColor: 'divider', pt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              デバッグ情報
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label="Gemini 1.5 Flash" 
                size="small" 
                variant="outlined" 
                color="info"
              />
              <Chip 
                label={`ターン ${turnNumber}`} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label="Temperature: 0.7" 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Box>
        )}
      </Collapse>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleSaveAsMemory}>
          <ListItemIcon>
            <Archive />
          </ListItemIcon>
          <ListItemText>キャラクターの記憶として保存</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleRevertToTurn}>
          <ListItemIcon>
            <RotateCcw />
          </ListItemIcon>
          <ListItemText>このターンまで遡って再開</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  )
} 