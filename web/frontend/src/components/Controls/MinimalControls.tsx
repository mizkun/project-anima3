import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  TextField,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  SkipNext,
  ExpandMore,
  Close,
} from '@mui/icons-material';
import { useSimulationControls } from '../../hooks/useSimulationControls';
import { useSimulationStore } from '../../stores/simulationStore';

interface MinimalControlsProps {
  // onSettingsClickプロパティを削除
}

interface Scene {
  id: string;
  name: string;
}

interface Character {
  id: string;
  name: string;
}

export const MinimalControls: React.FC<MinimalControlsProps> = () => {
  const { status, isLoading } = useSimulationStore();
  const { startSimulation, stopSimulation, executeNextTurn } = useSimulationControls();
  
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  
  // 介入機能の状態
  const [isInterventionOpen, setIsInterventionOpen] = useState(false);
  const [interventionType, setInterventionType] = useState<'global' | 'character'>('global');
  const [interventionContent, setInterventionContent] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');

  // シーン一覧の取得
  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const response = await fetch('/api/simulation/scenes');
        if (response.ok) {
          const scenesData = await response.json();
          console.log('Scenes response:', scenesData);
          
          if (scenesData && scenesData.scenes && Array.isArray(scenesData.scenes)) {
            setScenes(scenesData.scenes);
            if (scenesData.scenes.length > 0 && !selectedSceneId) {
              setSelectedSceneId(scenesData.scenes[0].id);
            }
          } else {
            console.warn('Unexpected scenes response format:', scenesData);
            setScenes([]);
          }
        }
      } catch (error) {
        console.error('シーン一覧の取得に失敗しました:', error);
        setScenes([]);
      }
    };

    fetchScenes();
  }, [selectedSceneId]);

  // キャラクター一覧の取得
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const { characters } = useSimulationStore.getState();
        if (characters && Array.isArray(characters) && characters.length > 0) {
          setAvailableCharacters(characters);
        } else {
          // シミュレーション状態からキャラクター情報を取得
          const response = await fetch('/api/simulation/status');
          if (response.ok) {
            const statusData = await response.json();
            if (statusData.current_scene && statusData.current_scene.participant_character_ids) {
              const characterPromises = statusData.current_scene.participant_character_ids.map(async (id: string) => {
                try {
                  const charResponse = await fetch(`/api/files/data/characters/${id}.yaml`);
                  if (charResponse.ok) {
                    const charText = await charResponse.text();
                    // YAMLパースは簡易的に行う（実際のプロジェクトではyamlライブラリを使用）
                    const nameMatch = charText.match(/name:\s*(.+)/);
                    return {
                      id,
                      name: nameMatch ? nameMatch[1].trim() : id
                    };
                  }
                } catch (error) {
                  console.error(`キャラクター ${id} の取得に失敗:`, error);
                }
                return { id, name: id };
              });
              
              const resolvedCharacters = await Promise.all(characterPromises);
              setAvailableCharacters(resolvedCharacters.filter(Boolean));
            }
          }
        }
      } catch (error) {
        console.error('キャラクター一覧の取得に失敗しました:', error);
        setAvailableCharacters([]);
      }
    };

    if (interventionType === 'character') {
      fetchCharacters();
    }
  }, [interventionType]);

  const handleNextTurn = async () => {
    try {
      await executeNextTurn();
    } catch (error) {
      console.error('次のターンの実行に失敗しました:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopSimulation();
    } catch (error) {
      console.error('シミュレーションの停止に失敗しました:', error);
    }
  };

  const handleSceneChange = (sceneId: string) => {
    setSelectedSceneId(sceneId);
  };

  const handleIntervention = async () => {
    if (!interventionContent.trim()) return;

    try {
      // フロントエンドの介入タイプをバックエンドの形式に変換
      const backendInterventionType = interventionType === 'global' ? 'update_situation' : 'give_revelation';
      
      const interventionData = {
        type: backendInterventionType,
        content: interventionContent.trim(),
        ...(interventionType === 'character' && selectedCharacterId && {
          character_id: selectedCharacterId
        })
      };

      console.log('Sending intervention:', interventionData);

      const response = await fetch('/api/simulation/intervention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interventionData),
      });

      if (response.ok) {
        setInterventionContent('');
        setIsInterventionOpen(false);
        
        // 介入後にシミュレーション状態を更新
        const statusResponse = await fetch('/api/simulation/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          useSimulationStore.getState().updateFromBackend(statusData);
        }
      } else {
        const errorData = await response.json();
        console.error('介入の実行に失敗しました:', errorData);
      }
    } catch (error) {
      console.error('介入の実行に失敗しました:', error);
    }
  };

  const handleStart = async () => {
    if (!selectedSceneId) return;

    try {
      // ローカルストレージから設定を読み込み
      const savedSettings = localStorage.getItem('simulationSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {
        maxTurns: 10,
        temperature: 0.7,
        maxTokens: 1000,
        llmProvider: 'gemini',
        modelName: 'gemini-1.5-flash',
      };

      await startSimulation({
        scene_id: selectedSceneId,
        max_turns: settings.maxTurns,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        llm_provider: settings.llmProvider as 'gemini' | 'openai',
        model_name: settings.modelName,
      });
    } catch (error) {
      console.error('シミュレーション開始に失敗しました:', error);
    }
  };

  const isRunning = status === 'running' || status === 'idle';

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
        mb: 2,
      }}
    >
      {/* メインコントロール */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
        {/* 左側のコントロールボタン */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleStart}
            disabled={isRunning || !selectedSceneId || isLoading}
            sx={{ minWidth: 100 }}
          >
            Start
          </Button>

          <Button
            variant="outlined"
            startIcon={<Stop />}
            onClick={handleStop}
            disabled={!isRunning || isLoading}
            sx={{ minWidth: 100 }}
          >
            Stop
          </Button>

          <Button
            variant="outlined"
            startIcon={<SkipNext />}
            onClick={handleNextTurn}
            disabled={!isRunning || isLoading}
            sx={{ minWidth: 120 }}
          >
            Next Turn
          </Button>

          <Button
            variant="outlined"
            startIcon={<ExpandMore />}
            onClick={() => setIsInterventionOpen(!isInterventionOpen)}
            disabled={isLoading}
            sx={{ minWidth: 130 }}
          >
            Intervention
          </Button>
        </Box>

        {/* 中央のシーン選択 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            シーン
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedSceneId}
              onChange={(e) => handleSceneChange(e.target.value)}
              displayEmpty
              disabled={isRunning || isLoading}
            >
              {Array.isArray(scenes) && scenes.map((scene) => (
                <MenuItem key={scene.id} value={scene.id}>
                  {scene.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* 介入パネル */}
      <Collapse in={isInterventionOpen}>
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          backgroundColor: 'background.default', 
          borderRadius: 1,
          border: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>介入タイプ</InputLabel>
                <Select
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value as 'global' | 'character')}
                  label="介入タイプ"
                >
                  <MenuItem value="global">全体向け</MenuItem>
                  <MenuItem value="character">キャラクター向け</MenuItem>
                </Select>
              </FormControl>

              {interventionType === 'character' && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>キャラクター</InputLabel>
                  <Select
                    value={selectedCharacterId}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    label="キャラクター"
                  >
                    {Array.isArray(availableCharacters) && availableCharacters.map((character) => (
                      <MenuItem key={character.id} value={character.id}>
                        {character.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <IconButton
              onClick={() => setIsInterventionOpen(false)}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            value={interventionContent}
            onChange={(e) => setInterventionContent(e.target.value)}
            placeholder="介入内容を入力してください..."
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleIntervention}
            disabled={!interventionContent.trim() || isLoading}
          >
            介入実行
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}; 