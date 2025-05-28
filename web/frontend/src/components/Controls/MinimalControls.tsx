import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
} from '@mui/icons-material';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSimulationControls } from '@/hooks/useSimulationControls';

interface MinimalControlsProps {
  // onSettingsClickプロパティを削除
}

interface Scene {
  id: string;
  name: string;
}

export const MinimalControls: React.FC<MinimalControlsProps> = () => {
  const simulationStore = useSimulationStore();
  const {
    status,
    isLoading,
    executeNextTurn,
    stopSimulation,
    startSimulation,
  } = useSimulationControls();

  const [availableScenes, setAvailableScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<string>('');

  // シーン一覧を取得
  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const response = await fetch('/api/simulation/scenes');
        const data = await response.json();
        if (response.ok && data.scenes) {
          setAvailableScenes(data.scenes);
          // 最初のシーンをデフォルトに設定
          if (data.scenes.length > 0 && !selectedScene) {
            setSelectedScene(data.scenes[0].id);
          }
        }
      } catch (error) {
        console.error('シーン一覧の取得に失敗:', error);
      }
    };

    fetchScenes();
  }, []);

  const handleNextTurn = async () => {
    try {
      await executeNextTurn();
    } catch (error) {
      console.error('次ターン実行エラー:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopSimulation();
    } catch (error) {
      console.error('停止エラー:', error);
    }
  };

  const handleReset = async () => {
    try {
      simulationStore.resetSimulation();
    } catch (error) {
      console.error('リセットエラー:', error);
    }
  };

  const handleSceneChange = (sceneId: string) => {
    setSelectedScene(sceneId);
    // シミュレーションが開始されていない場合のみシーンを変更
    if (status === 'not_started' || status === 'completed' || status === 'error') {
      // 新しいシーンでシミュレーションを開始する準備
      // 実際の開始は別途Startボタンで行う
    }
  };

  // ステータスに応じた色とテキストを取得
  const getStatusInfo = () => {
    switch (status) {
      case 'running':
        return { color: 'success', text: '実行中' };
      case 'idle':
        return { color: 'primary', text: '待機中' };
      case 'paused':
        return { color: 'warning', text: '一時停止' };
      case 'completed':
        return { color: 'info', text: '完了' };
      case 'error':
        return { color: 'error', text: 'エラー' };
      case 'not_started':
        return { color: 'default', text: '未開始' };
      default:
        return { color: 'default', text: '不明' };
    }
  };

  const statusInfo = getStatusInfo();
  const isRunning = status === 'running' || status === 'idle' || status === 'paused';
  const canExecuteNext = (status === 'idle' || status === 'running') && !isLoading;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        minHeight: '80px',
        maxHeight: '120px',
      }}
    >
      {/* シミュレーション制御ボタン */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {!isRunning ? (
          <Tooltip title="シミュレーションを開始">
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={() => startSimulation({
                character_name: 'default',
                scene_id: selectedScene,
                llm_provider: 'gemini',
                model_name: 'gemini-1.5-flash',
                max_steps: 10,
                max_turns: 10,
                temperature: 0.7,
                max_tokens: 1000
              })}
              disabled={isLoading || !selectedScene}
              size="small"
            >
              Start
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="次のターンを実行">
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={handleNextTurn}
              disabled={!canExecuteNext}
              size="small"
            >
              Next
            </Button>
          </Tooltip>
        )}

        <Tooltip title="シミュレーションを停止">
          <span>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Stop />}
              onClick={handleStop}
              disabled={!isRunning || isLoading}
              size="small"
            >
              Stop
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="シミュレーションをリセット">
          <span>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Refresh />}
              onClick={handleReset}
              disabled={isLoading}
              size="small"
            >
              Reset
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* シーン選択 */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="scene-select-label">シーン</InputLabel>
        <Select
          labelId="scene-select-label"
          value={selectedScene}
          label="シーン"
          onChange={(e) => handleSceneChange(e.target.value)}
          disabled={isRunning || isLoading}
        >
          {availableScenes.map((scene) => (
            <MenuItem key={scene.id} value={scene.id}>
              {scene.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* ステータス表示 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          label={statusInfo.text}
          color={statusInfo.color as any}
          size="small"
          variant="outlined"
        />
      </Box>
    </Box>
  );
}; 