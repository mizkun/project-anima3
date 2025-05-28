import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, Box, Typography, CircularProgress } from '@mui/material'
import { Brain, Activity, MessageCircle } from 'lucide-react'

interface LoadingTurnProps {
  turnNumber: number
}

export const LoadingTurn: React.FC<LoadingTurnProps> = ({ turnNumber }) => {
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        position: 'relative',
        border: '2px dashed',
        borderColor: 'primary.light',
        bgcolor: 'background.paper'
      }}
    >
      <CardContent>
        {/* ターン番号とローディング状態 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 32, 
                height: 32, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'primary.light',
                borderRadius: 1
              }}
            >
              <CircularProgress size={16} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">ターン {turnNumber}</Typography>
              <Typography variant="caption" color="primary">処理中...</Typography>
            </Box>
          </Box>
          
          <Box 
            sx={{ 
              width: 24, 
              height: 24, 
              position: 'relative',
              bgcolor: 'primary.main',
              borderRadius: '50%'
            }}
          >
            <Box 
              sx={{ 
                position: 'absolute',
                inset: 1,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} 
            />
          </Box>
        </Box>

        {/* 処理段階のインジケーター */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 思考処理 */}
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      bgcolor: 'secondary.light', 
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Brain size={16} color="#9c27b0" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="secondary.main" sx={{ mb: 0.5 }}>
                      思考生成中
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: '#ba68c8',
                            borderRadius: '50%'
                          }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ 
                            duration: 1, 
                            repeat: Infinity, 
                            delay: i * 0.2 
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* 行動処理 */}
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <Card variant="outlined" sx={{ bgcolor: 'grey.50', opacity: 0.6 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      bgcolor: 'success.light', 
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Activity size={16} color="#2e7d32" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ mb: 0.5 }}>
                      行動決定中
                    </Typography>
                    <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, height: 4 }}>
                      <motion.div
                        style={{
                          height: '100%',
                          backgroundColor: '#4caf50',
                          borderRadius: 4
                        }}
                        animate={{ width: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* 発言処理 */}
          <motion.div
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Card variant="outlined" sx={{ bgcolor: 'grey.50', opacity: 0.4 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      bgcolor: 'primary.light', 
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MessageCircle size={16} color="#1976d2" />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ mb: 0.5 }}>
                      発言生成待機中
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 16,
                            bgcolor: 'primary.light',
                            borderRadius: 1,
                            opacity: 0.3
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </CardContent>

      {/* 処理中のオーバーレイ効果 */}
      <Box 
        sx={{ 
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
          animation: 'pulse 2s infinite',
          borderRadius: 1,
          pointerEvents: 'none'
        }} 
      />
    </Card>
  )
} 