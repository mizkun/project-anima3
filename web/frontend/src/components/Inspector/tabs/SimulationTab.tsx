import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

interface SimulationSettings {
  maxTurns: number;
  temperature: number;
  maxTokens: number;
  llmProvider: string;
  modelName: string;
}

interface SimulationRun {
  id: string;
  timestamp: string;
  sceneId: string;
  sceneName: string;
  turnCount: number;
  status: 'completed' | 'interrupted' | 'running';
  settings: SimulationSettings;
}

export const SimulationTab: React.FC = () => {
  const [settings, setSettings] = useState<SimulationSettings>({
    maxTurns: 10,
    temperature: 0.7,
    maxTokens: 1000,
    llmProvider: 'gemini',
    modelName: 'gemini-1.5-flash',
  });
  const [simulationHistory, setSimulationHistory] = useState<SimulationRun[]>([]);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

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

  // シミュレーション履歴を取得（模擬データ）
  const fetchSimulationHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 実際のAPIが実装されるまでは模擬データを使用
      const mockHistory: SimulationRun[] = [
        {
          id: 'run_001',
          timestamp: '2024-01-15T14:30:00Z',
          sceneId: 'library_study_room',
          sceneName: '図書館の勉強室',
          turnCount: 10,
          status: 'completed',
          settings: {
            maxTurns: 10,
            temperature: 0.7,
            maxTokens: 1000,
            llmProvider: 'gemini',
            modelName: 'gemini-1.5-flash',
          },
        },
        {
          id: 'run_002',
          timestamp: '2024-01-15T13:20:00Z',
          sceneId: 'school_rooftop',
          sceneName: '学校の屋上',
          turnCount: 8,
          status: 'interrupted',
          settings: {
            maxTurns: 15,
            temperature: 0.8,
            maxTokens: 1200,
            llmProvider: 'gemini',
            modelName: 'gemini-1.5-flash',
          },
        },
      ];
      
      setSimulationHistory(mockHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // シミュレーション設定を保存
  const saveSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 設定をローカルストレージに保存（実際のAPIが実装されるまで）
      localStorage.setItem('simulationSettings', JSON.stringify(settings));
      
      // 成功メッセージを表示するため、一時的にエラーをクリア
      setTimeout(() => {
        setError(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴からシミュレーションを再開
  const resumeSimulation = async (runId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // 実際のAPIが実装されるまでは模擬的な処理
      console.log(`シミュレーション ${runId} を再開します`);
      
      // 成功メッセージ
      setError('シミュレーションの再開機能は開発中です');
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴をエクスポート
  const exportHistory = async (runId: string) => {
    try {
      const run = simulationHistory.find(r => r.id === runId);
      if (!run) return;

      const exportData = {
        run,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation_${runId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    }
  };

  const handleExportSimulation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/export/simulation');
      if (!response.ok) {
        throw new Error('エクスポートに失敗しました');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'シミュレーション結果をエクスポートしました' });
    } catch (error) {
      setMessage({ type: 'error', text: `エクスポートエラー: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/export/project');
      if (!response.ok) {
        throw new Error('プロジェクトエクスポートに失敗しました');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_anima_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: 'プロジェクト全体をエクスポートしました' });
    } catch (error) {
      setMessage({ type: 'error', text: `エクスポートエラー: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTimeline = async (format: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/export/timeline/${format}`);
      if (!response.ok) {
        throw new Error('タイムラインエクスポートに失敗しました');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage({ type: 'success', text: `タイムラインを${format.toUpperCase()}形式でエクスポートしました` });
    } catch (error) {
      setMessage({ type: 'error', text: `エクスポートエラー: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoading(false);
    }
  };

  // 初期化
  useEffect(() => {
    fetchSimulationStatus();
    fetchSimulationHistory();
    
    // ローカルストレージから設定を読み込み
    const savedSettings = localStorage.getItem('simulationSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error('設定の読み込みに失敗しました:', err);
      }
    }
  }, []);

  // 設定変更ハンドラー
  const handleSettingChange = (key: keyof SimulationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // ステータスの表示色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'interrupted': return 'warning';
      default: return 'default';
    }
  };

  // ステータスの表示テキストを取得
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'running': return '実行中';
      case 'interrupted': return '中断';
      default: return '不明';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">シミュレーション管理</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchSimulationStatus();
                fetchSimulationHistory();
              }}
              disabled={isLoading}
              size="small"
            >
              更新
            </Button>
          </Box>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert severity={message.type as 'success' | 'error'} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 現在のステータス */}
        {currentStatus && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              現在のステータス
            </Typography>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    状態: <Chip 
                      label={getStatusText(currentStatus.status)} 
                      color={getStatusColor(currentStatus.status) as any}
                      size="small"
                    />
                  </Typography>
                  {currentStatus.current_turn && (
                    <Typography variant="body2">
                      ターン: {currentStatus.current_turn}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 履歴一覧 */}
          <Box sx={{ width: '50%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2">実行履歴</Typography>
            </Box>
            
            {isLoading && simulationHistory.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List dense>
                {simulationHistory.map((run) => (
                  <ListItem key={run.id} disablePadding>
                    <ListItemButton
                      selected={selectedRun === run.id}
                      onClick={() => setSelectedRun(run.id)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">{run.sceneName}</Typography>
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
                              {new Date(run.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {run.turnCount}ターン実行
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* 詳細・設定エリア */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {selectedRun ? (
              // 選択された履歴の詳細
              <Box sx={{ p: 2 }}>
                {(() => {
                  const run = simulationHistory.find(r => r.id === selectedRun);
                  if (!run) return null;

                  return (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        実行詳細
                      </Typography>
                      
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="body2" gutterBottom>
                            <strong>シーン:</strong> {run.sceneName}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>実行日時:</strong> {new Date(run.timestamp).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>ターン数:</strong> {run.turnCount}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>ステータス:</strong> 
                            <Chip 
                              label={getStatusText(run.status)} 
                              color={getStatusColor(run.status) as any}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                        </CardContent>
                      </Card>

                      <Typography variant="subtitle2" gutterBottom>
                        実行時設定
                      </Typography>
                      
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="body2" gutterBottom>
                            <strong>最大ターン数:</strong> {run.settings.maxTurns}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>Temperature:</strong> {run.settings.temperature}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>最大トークン数:</strong> {run.settings.maxTokens}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>LLMプロバイダー:</strong> {run.settings.llmProvider}
                          </Typography>
                          <Typography variant="body2" gutterBottom>
                            <strong>モデル:</strong> {run.settings.modelName}
                          </Typography>
                        </CardContent>
                      </Card>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          startIcon={<PlayIcon />}
                          onClick={() => resumeSimulation(run.id)}
                          disabled={isLoading || run.status === 'running'}
                          size="small"
                          variant="outlined"
                        >
                          再開
                        </Button>
                        <Button
                          startIcon={<DownloadIcon />}
                          onClick={() => exportHistory(run.id)}
                          size="small"
                          variant="outlined"
                        >
                          エクスポート
                        </Button>
                      </Box>
                    </>
                  );
                })()}
              </Box>
            ) : (
              // シミュレーション設定
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  シミュレーション設定
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    最大ターン数: {settings.maxTurns}
                  </Typography>
                  <Slider
                    value={settings.maxTurns}
                    onChange={(_, value) => handleSettingChange('maxTurns', value)}
                    min={1}
                    max={50}
                    step={1}
                    marks={[
                      { value: 1, label: '1' },
                      { value: 10, label: '10' },
                      { value: 25, label: '25' },
                      { value: 50, label: '50' },
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Temperature: {settings.temperature}
                  </Typography>
                  <Slider
                    value={settings.temperature}
                    onChange={(_, value) => handleSettingChange('temperature', value)}
                    min={0}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 0.5, label: '0.5' },
                      { value: 1, label: '1' },
                      { value: 1.5, label: '1.5' },
                      { value: 2, label: '2' },
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    最大トークン数: {settings.maxTokens}
                  </Typography>
                  <Slider
                    value={settings.maxTokens}
                    onChange={(_, value) => handleSettingChange('maxTokens', value)}
                    min={100}
                    max={4000}
                    step={100}
                    marks={[
                      { value: 100, label: '100' },
                      { value: 1000, label: '1K' },
                      { value: 2000, label: '2K' },
                      { value: 4000, label: '4K' },
                    ]}
                  />
                </Box>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>LLMプロバイダー</InputLabel>
                  <Select
                    value={settings.llmProvider}
                    label="LLMプロバイダー"
                    onChange={(e) => handleSettingChange('llmProvider', e.target.value)}
                  >
                    <MenuItem value="gemini">Gemini</MenuItem>
                    <MenuItem value="openai">OpenAI</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>モデル</InputLabel>
                  <Select
                    value={settings.modelName}
                    label="モデル"
                    onChange={(e) => handleSettingChange('modelName', e.target.value)}
                  >
                    {settings.llmProvider === 'gemini' ? (
                      <>
                        <MenuItem value="gemini-1.5-flash">Gemini 1.5 Flash</MenuItem>
                        <MenuItem value="gemini-1.5-pro">Gemini 1.5 Pro</MenuItem>
                      </>
                    ) : (
                      <>
                        <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                        <MenuItem value="gpt-4">GPT-4</MenuItem>
                        <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>

                <Button
                  startIcon={<SettingsIcon />}
                  onClick={saveSettings}
                  disabled={isLoading}
                  variant="contained"
                  fullWidth
                >
                  {isLoading ? '保存中...' : '設定を保存'}
                </Button>

                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <DownloadIcon sx={{ mr: 1 }} />
                      エクスポート
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportSimulation}
                        disabled={isLoading}
                        fullWidth
                      >
                        シミュレーション結果をエクスポート (JSON)
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportProject}
                        disabled={isLoading}
                        fullWidth
                      >
                        プロジェクト全体をバックアップ (ZIP)
                      </Button>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleExportTimeline('json')}
                          disabled={isLoading}
                          sx={{ flex: 1 }}
                        >
                          タイムライン (JSON)
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleExportTimeline('txt')}
                          disabled={isLoading}
                          sx={{ flex: 1 }}
                        >
                          タイムライン (TXT)
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}; 