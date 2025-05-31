import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Palette,
  RotateCcw,
  Monitor,
  Download,
  Upload
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsTabProps {
  onSettingsChange?: (settings: any) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onSettingsChange }) => {
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    theme: theme,
    compactMode: localStorage.getItem('compactMode') === 'true',
  });

  // テーマが外部から変更された場合に同期
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme }));
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    const newSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(key, value.toString());
    onSettingsChange?.(newSettings);
  };

  // 改善されたトグルスイッチコンポーネント
  const ToggleSwitch: React.FC<{ 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    label: string;
    icon: React.ReactNode;
  }> = ({ checked, onChange, label, icon }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm" style={{ color: 'var(--neo-text)' }}>{label}</span>
      </div>
      <motion.button
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
        onClick={() => onChange(!checked)}
        style={{
          backgroundColor: checked ? 'var(--neo-accent)' : 'var(--neo-shadow-dark)',
          boxShadow: checked ? 'var(--neo-shadow-floating)' : 'var(--neo-shadow-subtle)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out"
          animate={{
            x: checked ? 20 : 4,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </motion.button>
    </div>
  );

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'light' as const,
      compactMode: false,
    };
    setSettings(defaultSettings);
    
    // LocalStorageをクリア
    Object.keys(defaultSettings).forEach(key => {
      if (key !== 'theme') {
        localStorage.removeItem(key);
      }
    });
    
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
              <ToggleSwitch
                checked={settings.compactMode}
                onChange={(checked) => handleSettingChange('compactMode', checked)}
                label="コンパクトモード"
                icon={<RotateCcw className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />}
              />
            </div>
          </div>

          {/* タイムライン設定 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
              <Monitor className="w-5 h-5" />
              機能開発状況
            </h3>
            
            <div className="neo-card-subtle space-y-4">
              <div className="text-sm" style={{ color: 'var(--neo-text-secondary)' }}>
                タイムライン関連の設定機能や通知機能は現在開発中です。
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