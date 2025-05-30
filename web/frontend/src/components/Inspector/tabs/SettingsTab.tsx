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
  Save,
} from '@mui/icons-material';
import { PromptTab } from './PromptTab';
import { useSimulationStore } from '@/stores/simulationStore';
import { motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Palette,
  RotateCcw,
  Monitor,
  Volume2,
  Bell,
  Eye,
  Zap,
  Download,
  Upload
} from 'lucide-react';

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

interface SettingsTabProps {
  onSettingsChange?: (settings: any) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'light',
    compactMode: localStorage.getItem('compactMode') === 'true',
    showThinking: localStorage.getItem('showThinking') === 'true',
    autoExpand: localStorage.getItem('autoExpand') === 'true',
    soundEffects: localStorage.getItem('soundEffects') === 'true',
    notifications: localStorage.getItem('notifications') === 'true',
  });

  const handleThemeChange = (theme: string) => {
    setSettings(prev => ({ ...prev, theme }));
    localStorage.setItem('theme', theme);
    
    // ダークモード切り替え
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    onSettingsChange?.({ ...settings, theme });
  };

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(key, value.toString());
    onSettingsChange?.(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      compactMode: false,
      showThinking: false,
      autoExpand: false,
      soundEffects: true,
      notifications: true,
    };
    setSettings(defaultSettings);
    
    // LocalStorageをクリア
    Object.keys(defaultSettings).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // ダークモード解除
    document.documentElement.classList.remove('dark');
    
    onSettingsChange?.(defaultSettings);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anima-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        
        // LocalStorageに保存
        Object.entries(importedSettings).forEach(([key, value]) => {
          localStorage.setItem(key, String(value));
        });
        
        // テーマ適用
        if (importedSettings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        onSettingsChange?.(importedSettings);
      } catch (error) {
        console.error('設定ファイルの読み込みに失敗しました:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-direction-column overflow-hidden" style={{ color: 'var(--neo-text)' }}>
      <div className="neo-scrollbar flex-1 overflow-y-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
              <Palette className="w-5 h-5" />
              表示設定
            </h3>
            
            {/* テーマ設定 */}
            <div className="neo-card-subtle mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neo-text)' }}>
                  テーマ
                </label>
                <div className="flex gap-2">
                  <motion.button
                    className="neo-button flex items-center gap-2 px-4 py-2"
                    onClick={() => handleThemeChange('light')}
                    style={{
                      ...(settings.theme === 'light' && {
                        background: 'var(--neo-accent)',
                        color: 'white',
                        boxShadow: 'var(--neo-shadow-floating)',
                      })
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sun className="w-4 h-4" />
                    ライト
                  </motion.button>
                  <motion.button
                    className="neo-button flex items-center gap-2 px-4 py-2"
                    onClick={() => handleThemeChange('dark')}
                    style={{
                      ...(settings.theme === 'dark' && {
                        background: 'var(--neo-accent)',
                        color: 'white',
                        boxShadow: 'var(--neo-shadow-floating)',
                      })
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Moon className="w-4 h-4" />
                    ダーク
                  </motion.button>
                  <motion.button
                    className="neo-button flex items-center gap-2 px-4 py-2"
                    onClick={() => handleThemeChange('system')}
                    style={{
                      ...(settings.theme === 'system' && {
                        background: 'var(--neo-accent)',
                        color: 'white',
                        boxShadow: 'var(--neo-shadow-floating)',
                      })
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Monitor className="w-4 h-4" />
                    システム
                  </motion.button>
                </div>
              </div>

              {/* コンパクトモード */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--neo-text)' }}>コンパクトモード</span>
                </div>
                <motion.button
                  className="neo-button w-12 h-6 rounded-full p-1"
                  onClick={() => handleSettingChange('compactMode', !settings.compactMode)}
                  style={{
                    ...(settings.compactMode && {
                      background: 'var(--neo-accent)',
                      boxShadow: 'var(--neo-shadow-floating)',
                    })
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{
                      x: settings.compactMode ? 20 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.button>
              </div>
            </div>
          </div>

          {/* タイムライン設定 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
              <Eye className="w-5 h-5" />
              タイムライン設定
            </h3>
            
            <div className="neo-card-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--neo-text)' }}>思考を常時表示</span>
                </div>
                <motion.button
                  className="neo-button w-12 h-6 rounded-full p-1"
                  onClick={() => handleSettingChange('showThinking', !settings.showThinking)}
                  style={{
                    ...(settings.showThinking && {
                      background: 'var(--neo-accent)',
                      boxShadow: 'var(--neo-shadow-floating)',
                    })
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{
                      x: settings.showThinking ? 20 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--neo-text)' }}>自動展開</span>
                </div>
                <motion.button
                  className="neo-button w-12 h-6 rounded-full p-1"
                  onClick={() => handleSettingChange('autoExpand', !settings.autoExpand)}
                  style={{
                    ...(settings.autoExpand && {
                      background: 'var(--neo-accent)',
                      boxShadow: 'var(--neo-shadow-floating)',
                    })
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{
                      x: settings.autoExpand ? 20 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.button>
              </div>
            </div>
          </div>

          {/* 通知設定 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
              <Bell className="w-5 h-5" />
              通知設定
            </h3>
            
            <div className="neo-card-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--neo-text)' }}>サウンドエフェクト</span>
                </div>
                <motion.button
                  className="neo-button w-12 h-6 rounded-full p-1"
                  onClick={() => handleSettingChange('soundEffects', !settings.soundEffects)}
                  style={{
                    ...(settings.soundEffects && {
                      background: 'var(--neo-accent)',
                      boxShadow: 'var(--neo-shadow-floating)',
                    })
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{
                      x: settings.soundEffects ? 20 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--neo-text)' }}>デスクトップ通知</span>
                </div>
                <motion.button
                  className="neo-button w-12 h-6 rounded-full p-1"
                  onClick={() => handleSettingChange('notifications', !settings.notifications)}
                  style={{
                    ...(settings.notifications && {
                      background: 'var(--neo-accent)',
                      boxShadow: 'var(--neo-shadow-floating)',
                    })
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{
                      x: settings.notifications ? 20 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </motion.button>
              </div>
            </div>
          </div>

          {/* 設定の管理 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
              <Save className="w-5 h-5" />
              設定の管理
            </h3>
            
            <div className="neo-card-subtle space-y-3">
              <div className="flex gap-2">
                <motion.button
                  className="neo-button flex items-center gap-2 px-4 py-2 flex-1"
                  onClick={exportSettings}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  エクスポート
                </motion.button>
                <motion.label
                  className="neo-button flex items-center gap-2 px-4 py-2 flex-1 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload className="w-4 h-4" />
                  インポート
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </motion.label>
              </div>
              
              <motion.button
                className="neo-button flex items-center gap-2 px-4 py-2 w-full"
                onClick={resetSettings}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ color: 'var(--neo-error)' }}
              >
                <RotateCcw className="w-4 h-4" />
                設定をリセット
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 