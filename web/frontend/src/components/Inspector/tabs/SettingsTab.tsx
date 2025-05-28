import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { PromptTab } from './PromptTab';
import { useSimulationStore } from '@/stores/simulationStore';

interface SimulationSettings {
  temperature: number;
  maxTokens: number;
  llmProvider: string;
  modelName: string;
  logLevel: string;
  debugMode: boolean;
}

const defaultSettings: SimulationSettings = {
  temperature: 0.7,
  maxTokens: 1000,
  llmProvider: 'gemini',
  modelName: 'gemini-1.5-flash',
  logLevel: 'INFO',
  debugMode: false,
};

const geminiModels = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
];

const openaiModels = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
];

export const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SimulationSettings>(defaultSettings);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const simulationStore = useSimulationStore();

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('simulationSettings');
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsedSettings });
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    };

    loadSettings();
  }, []);

  // 設定の保存
  const handleSaveSettings = async () => {
    try {
      localStorage.setItem('simulationSettings', JSON.stringify(settings));
      setSaveMessage('設定を保存しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      setSaveMessage('設定の保存に失敗しました');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // 設定値の更新
  const updateSetting = <K extends keyof SimulationSettings>(
    key: K,
    value: SimulationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // デバッグモードの場合はシミュレーションストアも更新
    if (key === 'debugMode') {
      simulationStore.setDebugMode(value as boolean);
    }
  };

  // プロバイダー変更時のモデル自動選択
  const handleProviderChange = (provider: string) => {
    updateSetting('llmProvider', provider);
    if (provider === 'gemini') {
      updateSetting('modelName', geminiModels[0]);
    } else if (provider === 'openai') {
      updateSetting('modelName', openaiModels[0]);
    }
  };

  const availableModels = settings.llmProvider === 'gemini' ? geminiModels : openaiModels;

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        設定
      </Typography>

      {/* シミュレーション設定 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">シミュレーション設定</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* ログ出力レベル */}
            <FormControl fullWidth>
              <InputLabel>ログ出力レベル</InputLabel>
              <Select
                value={settings.logLevel}
                onChange={(e) => updateSetting('logLevel', e.target.value)}
                label="ログ出力レベル"
              >
                <MenuItem value="DEBUG">DEBUG（詳細）</MenuItem>
                <MenuItem value="INFO">INFO（標準）</MenuItem>
                <MenuItem value="WARNING">WARNING（警告のみ）</MenuItem>
                <MenuItem value="ERROR">ERROR（エラーのみ）</MenuItem>
              </Select>
            </FormControl>

            {/* Temperature */}
            <Box>
              <Typography gutterBottom>
                Temperature: {settings.temperature}
              </Typography>
              <Slider
                value={settings.temperature}
                onChange={(_, value) => updateSetting('temperature', value as number)}
                min={0}
                max={2}
                step={0.1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 0.7, label: '0.7' },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* 最大トークン数 */}
            <Box>
              <Typography gutterBottom>
                最大トークン数: {settings.maxTokens}
              </Typography>
              <Slider
                value={settings.maxTokens}
                onChange={(_, value) => updateSetting('maxTokens', value as number)}
                min={100}
                max={4000}
                step={100}
                marks={[
                  { value: 100, label: '100' },
                  { value: 1000, label: '1000' },
                  { value: 2000, label: '2000' },
                  { value: 4000, label: '4000' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* デバッグモード */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.debugMode}
                    onChange={(e) => updateSetting('debugMode', e.target.checked)}
                  />
                }
                label="デバッグモード（詳細ログを表示）"
              />
            </Box>

            {/* LLMプロバイダー */}
            <FormControl fullWidth>
              <InputLabel>LLMプロバイダー</InputLabel>
              <Select
                value={settings.llmProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                label="LLMプロバイダー"
              >
                <MenuItem value="gemini">Gemini</MenuItem>
                <MenuItem value="openai">OpenAI</MenuItem>
              </Select>
            </FormControl>

            {/* モデル選択 */}
            <FormControl fullWidth>
              <InputLabel>モデル</InputLabel>
              <Select
                value={settings.modelName}
                onChange={(e) => updateSetting('modelName', e.target.value)}
                label="モデル"
              >
                {availableModels.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 保存ボタン */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
              >
                設定を保存
              </Button>
            </Box>

            {/* 保存メッセージ */}
            {saveMessage && (
              <Alert severity={saveMessage.includes('失敗') ? 'error' : 'success'}>
                {saveMessage}
              </Alert>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 2 }} />

      {/* プロンプト編集 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">プロンプト編集</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <PromptTab />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}; 