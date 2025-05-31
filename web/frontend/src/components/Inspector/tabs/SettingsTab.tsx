import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Palette,
  RotateCcw,
  Download,
  Upload,
  Edit,
  FileText
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsTabProps {
  onSettingsChange?: (settings: any) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onSettingsChange }) => {
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    theme: theme,
  });

  const [promptContent, setPromptContent] = useState('');
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  // テーマが外部から変更された場合に同期
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme }));
  }, [theme]);

  // プロンプト読み込み
  const loadPrompt = async () => {
    setIsPromptLoading(true);
    setPromptError(null);
    try {
      const response = await fetch('/api/files/data/prompts/think_generate.txt');
      if (response.ok) {
        const data = await response.json();
        setPromptContent(data.content);
      } else {
        throw new Error('プロンプトファイルの読み込みに失敗しました');
      }
    } catch (error) {
      setPromptError(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setIsPromptLoading(false);
    }
  };

  // プロンプト保存
  const savePrompt = async () => {
    setIsPromptLoading(true);
    setPromptError(null);
    try {
      const response = await fetch('/api/files/data/prompts/think_generate.txt', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: promptContent,
        }),
      });
      
      if (!response.ok) {
        throw new Error('プロンプトファイルの保存に失敗しました');
      }
    } catch (error) {
      setPromptError(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setIsPromptLoading(false);
    }
  };

  useEffect(() => {
    loadPrompt();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const newSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // LocalStorageに保存（テーマ以外）
    if (key !== 'theme') {
      localStorage.setItem(key, String(value));
    }
    
    onSettingsChange?.(newSettings);
  };

  const ToggleSwitch: React.FC<{ 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    label: string;
    icon: React.ReactNode;
  }> = ({ checked, onChange, label, icon }) => (
    <motion.div
      className="flex items-center justify-between p-3 neo-card-subtle rounded-lg"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm" style={{ color: 'var(--neo-text)' }}>{label}</span>
      </div>
      <motion.button
        className="relative w-12 h-6 rounded-full transition-colors duration-200"
        style={{
          backgroundColor: checked ? 'var(--neo-accent)' : 'var(--neo-text-secondary)',
        }}
        onClick={() => onChange(!checked)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
          animate={{ x: checked ? 24 : 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </motion.button>
    </motion.div>
  );

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'light' as const,
    };
    setSettings(defaultSettings);
    
    // テーマをライトモードに戻す
    setTheme('light');
    
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
          if (key === 'theme') {
            setTheme(value as 'light' | 'dark' | 'system');
          } else {
            localStorage.setItem(key, String(value));
          }
        });
        
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
            
            <div className="neo-card-subtle space-y-4">
              <div>
                <div className="text-sm mb-3" style={{ color: 'var(--neo-text-secondary)' }}>
                  アプリケーションのテーマを選択
                </div>
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
                </div>
              </div>
            </div>
          </div>

          {/* プロンプト編集 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
              <FileText className="w-5 h-5" />
              メインプロンプト設定
            </h3>
            
            <div className="neo-card-subtle space-y-4">
              <div className="text-sm mb-3" style={{ color: 'var(--neo-text-secondary)' }}>
                キャラクターの思考生成に使用するメインプロンプトを編集できます
              </div>
              
              {promptError && (
                <div className="text-sm p-2 rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  {promptError}
                </div>
              )}
              
              <div className="space-y-2">
                <textarea
                  className="w-full p-3 text-sm border rounded-lg neo-input"
                  style={{
                    background: 'var(--neo-element)',
                    borderColor: 'var(--neo-text-secondary)',
                    color: 'var(--neo-text)',
                    minHeight: '200px',
                    fontFamily: 'monospace',
                  }}
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="プロンプトを読み込み中..."
                  disabled={isPromptLoading}
                />
                
                <div className="flex gap-2 justify-end">
                  <motion.button
                    className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                    onClick={loadPrompt}
                    disabled={isPromptLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title="リロード"
                  >
                    <RotateCcw className="w-4 h-4" />
                    リロード
                  </motion.button>
                  <motion.button
                    className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                    onClick={savePrompt}
                    disabled={isPromptLoading || !promptContent.trim()}
                    style={{
                      ...(promptContent.trim() && !isPromptLoading && {
                        background: 'var(--neo-accent)',
                        color: 'white',
                      })
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit className="w-4 h-4" />
                    {isPromptLoading ? '保存中...' : '保存'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* 設定の管理 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
              <Download className="w-5 h-5" />
              設定の管理
            </h3>
            
            <div className="neo-card-subtle space-y-4">
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
                style={{
                  background: 'var(--neo-error)',
                  color: 'white',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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