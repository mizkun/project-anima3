import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

interface SimulationHistoryItem {
  id: string;
  timestamp: string;
  scene_id: string;
  location: string;
  participants: string[];
  turn_count: number;
  status: 'completed' | 'empty';
  file_path: string;
}

interface SimulationDetail {
  scene_info: {
    scene_id: string;
    location: string;
    time: string;
    situation: string;
    participant_character_ids: string[];
  };
  turns: Array<{
    turn_number: number;
    character_id: string;
    character_name: string;
    think: string;
    act: string;
    talk?: string;
  }>;
  interventions_in_scene: any[];
}

export const SimulationTab: React.FC = () => {
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<SimulationHistoryItem | null>(null);
  const [historyDetail, setHistoryDetail] = useState<SimulationDetail | null>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  // シミュレーション状態を取得
  const fetchSimulationStatus = async () => {
    try {
      const response = await fetch('/api/simulation/status');
      const data = await response.json();
      
      if (response.ok) {
        setCurrentStatus(data);
      } else {
        throw new Error(data.message || 'ステータスの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  // シミュレーション履歴を取得
  const fetchSimulationHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/simulation/history');
      const data = await response.json();
      
      if (response.ok) {
        setSimulationHistory(data.history || []);
      } else {
        throw new Error(data.message || '履歴の取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴詳細を取得
  const fetchHistoryDetail = async (simId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/simulation/history/${simId}`);
      const data = await response.json();
      
      if (response.ok) {
        setHistoryDetail(data);
        setView('detail');
      } else {
        throw new Error(data.message || '詳細の取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴からシミュレーションを再開
  const resumeSimulation = async (simId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/simulation/resume/${simId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setError(`シミュレーション ${simId} の再開機能は開発中です`);
      } else {
        throw new Error(data.message || '再開に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴をエクスポート
  const exportHistory = async (simId: string) => {
    try {
      const response = await fetch(`/api/simulation/history/${simId}`);
      const data = await response.json();
      
      if (response.ok) {
        const exportData = {
          simulation: data,
          exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulation_${simId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(data.message || 'エクスポートに失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    }
  };

  // 初期化
  useEffect(() => {
    fetchSimulationStatus();
    fetchSimulationHistory();
  }, []);

  // ステータスの表示色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'empty':
        return 'warning';
      default:
        return 'default';
    }
  };

  // ステータスの表示テキストを取得
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'empty':
        return '空';
      default:
        return '不明';
    }
  };

  if (isLoading && simulationHistory.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        シミュレーション履歴
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
        {/* 左側：履歴一覧 */}
        <Box sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">履歴一覧</Typography>
            <IconButton size="small" onClick={fetchSimulationHistory} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {simulationHistory.length === 0 ? (
              <ListItem>
                <ListItemText primary="履歴がありません" />
              </ListItem>
            ) : (
              simulationHistory.map((run) => (
                <ListItem key={run.id} disablePadding>
                  <ListItemButton
                    selected={selectedHistory?.id === run.id}
                    onClick={() => {
                      setSelectedHistory(run);
                      fetchHistoryDetail(run.id);
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">{run.location}</Typography>
                          <Chip 
                            label={getStatusText(run.status)} 
                            color={getStatusColor(run.status) as any}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {run.timestamp}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {run.turn_count}ターン実行
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Box>

        {/* 右側：詳細・エクスポートエリア */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {view === 'detail' && historyDetail ? (
            // 選択された履歴の詳細
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={() => setView('list')} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">シミュレーション詳細</Typography>
              </Box>

              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="body2" gutterBottom>
                    <strong>シーン:</strong> {historyDetail.scene_info.location}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>シーンID:</strong> {historyDetail.scene_info.scene_id}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>時間:</strong> {historyDetail.scene_info.time}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>状況:</strong> {historyDetail.scene_info.situation}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>参加キャラクター:</strong> {historyDetail.scene_info.participant_character_ids.join(', ')}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>ターン数:</strong> {historyDetail.turns.length}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>介入数:</strong> {historyDetail.interventions_in_scene.length}
                  </Typography>
                </CardContent>
              </Card>

              {/* ターン詳細 */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    ターン詳細
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {historyDetail.turns.map((turn, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="caption" color="primary">
                          ターン {turn.turn_number}: {turn.character_name}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>思考:</strong> {turn.think.substring(0, 100)}...
                        </Typography>
                        <Typography variant="body2">
                          <strong>行動:</strong> {turn.act.substring(0, 100)}...
                        </Typography>
                        {turn.talk && (
                          <Typography variant="body2">
                            <strong>発言:</strong> {turn.talk}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* アクションボタン */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<PlayIcon />}
                  onClick={() => resumeSimulation(selectedHistory?.id || '')}
                  disabled={isLoading}
                  size="small"
                  variant="outlined"
                >
                  再開
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => exportHistory(selectedHistory?.id || '')}
                  size="small"
                  variant="outlined"
                >
                  エクスポート
                </Button>
              </Box>
            </Box>
          ) : (
            // 履歴が選択されていない場合
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                履歴を選択してください
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}; 