import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Update as UpdateIcon,
  PersonAdd as PersonAddIcon,
  AutoStories as AutoStoriesIcon,
} from '@mui/icons-material';
import { useSimulationStore } from '@/stores/simulationStore';

interface InterventionType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  backendType: string; // バックエンドで期待される介入タイプ
}

interface InterventionTabProps {
  onIntervention?: (type: string, content: string) => void;
  disabled?: boolean;
}

const INTERVENTION_TYPES: InterventionType[] = [
  {
    id: 'global_intervention',
    name: '全体向け介入',
    description: '状況や環境の変化を追加',
    icon: <UpdateIcon />,
    placeholder: '例: 突然雨が降り始めた、新しいキャラクターが現れた',
    backendType: 'update_situation'
  },
  {
    id: 'character_intervention',
    name: 'キャラクター向け介入',
    description: '特定キャラクターに情報や気づきを与える',
    icon: <PsychologyIcon />,
    placeholder: '例: 燐子は芽依の本当の気持ちに気づく',
    backendType: 'give_revelation'
  }
];

export const InterventionTab: React.FC<InterventionTabProps> = ({
  onIntervention,
  disabled = false
}) => {
  const [selectedType, setSelectedType] = useState<string>(INTERVENTION_TYPES[0].id);
  const [content, setContent] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string>('stopped');

  const selectedTypeData = INTERVENTION_TYPES.find(type => type.id === selectedType);
  const isCharacterIntervention = selectedType === 'character_intervention';
  const needsCharacterSelection = isCharacterIntervention;

  // シミュレーション状態を定期的に確認
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/simulation/status');
        const data = await response.json();
        setSimulationStatus(data.status);
        
        // 参加キャラクターの情報も取得
        if (data.current_scene && data.current_scene.participant_character_ids) {
          setAvailableCharacters(data.current_scene.participant_character_ids);
          if (data.current_scene.participant_character_ids.length > 0 && !selectedCharacter) {
            setSelectedCharacter(data.current_scene.participant_character_ids[0]);
          }
        }
      } catch (error) {
        console.error('シミュレーション状態の取得に失敗:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000); // 2秒ごとに状態確認

    return () => clearInterval(interval);
  }, [selectedCharacter]);

  const isSimulationRunning = simulationStatus === 'running' || simulationStatus === 'idle';

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting || !isSimulationRunning) return;
    
    // キャラクター向け介入の場合はキャラクターが選択されている必要がある
    if (needsCharacterSelection && !selectedCharacter) {
      setError(`${selectedTypeData?.name}にはキャラクターの選択が必要です`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      let finalContent = content.trim();
      
      // キャラクター向け介入の場合はキャラクターIDを含める
      if (needsCharacterSelection && selectedCharacter) {
        finalContent = `${selectedCharacter} ${finalContent}`;
      }

      if (onIntervention) {
        await onIntervention(selectedTypeData?.backendType || selectedType, finalContent);
        setContent('');
      } else {
        // デフォルトの介入処理（APIコール）
        const response = await fetch('/api/simulation/intervention', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            type: selectedTypeData?.backendType || selectedType, 
            content: finalContent
          }),
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || '介入の実行に失敗しました');
        }
        
        setContent('');
      }
    } catch (error) {
      console.error('介入の実行に失敗しました:', error);
      setError(error instanceof Error ? error.message : '介入の実行に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      <Typography variant="h6" gutterBottom>
        ユーザー介入
      </Typography>

      {/* シミュレーション状態の表示 */}
      {!isSimulationRunning && (
        <Alert severity="warning">
          シミュレーションが実行されていません。介入を行うには、まずシミュレーションを開始してください。
        </Alert>
      )}

      {/* 介入タイプ選択 */}
      <FormControl fullWidth>
        <InputLabel>介入タイプ</InputLabel>
        <Select
          value={selectedType}
          label="介入タイプ"
          onChange={(e) => setSelectedType(e.target.value)}
          disabled={disabled || !isSimulationRunning}
        >
          {INTERVENTION_TYPES.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {type.icon}
                <Box>
                  <Typography variant="body2">{type.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* キャラクター選択（キャラクター向け介入の場合） */}
      {needsCharacterSelection && (
        <FormControl fullWidth>
          <InputLabel>対象キャラクター</InputLabel>
          <Select
            value={selectedCharacter}
            label="対象キャラクター"
            onChange={(e) => setSelectedCharacter(e.target.value)}
            disabled={disabled || !isSimulationRunning}
          >
            {availableCharacters.map((characterId) => (
              <MenuItem key={characterId} value={characterId}>
                {characterId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* 介入内容入力 */}
      <TextField
        label="介入内容"
        multiline
        rows={4}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={selectedTypeData?.placeholder || '介入内容を入力してください...'}
        disabled={disabled || isSubmitting || !isSimulationRunning}
        fullWidth
        helperText={`Ctrl+Enter で送信 | ${content.length}/500文字`}
        error={content.length > 500}
      />

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 実行ボタン */}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={disabled || isSubmitting || !content.trim() || content.length > 500 || !isSimulationRunning}
        startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
        fullWidth
      >
        {isSubmitting ? '実行中...' : '介入実行'}
      </Button>

      {/* 使用方法のヒント */}
      <Card variant="outlined" sx={{ mt: 'auto' }}>
        <CardContent sx={{ py: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            使用方法
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • シミュレーション実行中に物語に介入できます<br/>
            • 全体向け介入: 状況や環境の変化を追加<br/>
            • キャラクター向け介入: 特定キャラクターに情報や気づきを与える
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}; 