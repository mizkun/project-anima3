import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  Palette,
  RotateCcw,
  Download,
  Upload,
  Edit,
  FileText,
  X,
  ChevronDown
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsTabProps {
  onSettingsChange?: (settings: any) => void;
}

// ポップアップコンポーネント
const PromptEditModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<'think_generate' | 'long_term_update'>('think_generate');
  const [promptContent, setPromptContent] = useState('');
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const promptOptions = [
    { value: 'think_generate', label: '思考生成プロンプト', fileName: 'think_generate.txt' },
    { value: 'long_term_update', label: '長期記憶更新プロンプト', fileName: 'long_term_update.txt' }
  ];

  // プロンプト読み込み
  const loadPrompt = async (promptType: 'think_generate' | 'long_term_update') => {
    setIsPromptLoading(true);
    setPromptError(null);
    try {
      const fileName = promptOptions.find(opt => opt.value === promptType)?.fileName;
      const response = await fetch(`/api/files/data/prompts/${fileName}`);
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
      const fileName = promptOptions.find(opt => opt.value === selectedPrompt)?.fileName;
      const response = await fetch(`/api/files/data/prompts/${fileName}`, {
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

  // プロンプト変更時の読み込み
  useEffect(() => {
    if (isOpen) {
      loadPrompt(selectedPrompt);
    }
  }, [selectedPrompt, isOpen]);

  // プロンプト選択変更
  const handlePromptChange = (promptType: 'think_generate' | 'long_term_update') => {
    setSelectedPrompt(promptType);
    setIsDropdownOpen(false);
  };

  const selectedOption = promptOptions.find(opt => opt.value === selectedPrompt);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="neo-card w-full max-w-4xl max-h-[90vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--neo-text-secondary)' }}>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" style={{ color: 'var(--neo-accent)' }} />
                <h2 className="text-xl font-semibold" style={{ color: 'var(--neo-text)' }}>プロンプト編集</h2>
              </div>
              <motion.button
                className="neo-button p-2"
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* コンテンツ */}
            <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
              {/* プロンプト選択 */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neo-text-secondary)' }}>
                  編集するプロンプト
                </label>
                <div className="relative">
                  <motion.button
                    className="neo-button w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span style={{ color: 'var(--neo-text)' }}>
                      {selectedOption?.label}
                    </span>
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--neo-text-secondary)' }}
                    />
                  </motion.button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        className="absolute top-full left-0 right-0 mt-1 neo-card border z-10"
                        style={{ borderColor: 'var(--neo-text-secondary)' }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {promptOptions.map((option) => (
                          <motion.button
                            key={option.value}
                            className="w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors"
                            style={{
                              color: 'var(--neo-text)',
                              backgroundColor: selectedPrompt === option.value ? 'var(--neo-accent)' : 'transparent',
                            }}
                            onClick={() => handlePromptChange(option.value as 'think_generate' | 'long_term_update')}
                            whileHover={{ backgroundColor: 'var(--neo-element)' }}
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* エラー表示 */}
              {promptError && (
                <motion.div
                  className="text-sm p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {promptError}
                </motion.div>
              )}

              {/* テキストエリア */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neo-text-secondary)' }}>
                  プロンプト内容
                </label>
                <textarea
                  className="flex-1 p-4 text-sm border rounded-lg neo-input resize-none"
                  style={{
                    background: 'var(--neo-element)',
                    borderColor: 'var(--neo-text-secondary)',
                    color: 'var(--neo-text)',
                    fontFamily: 'monospace',
                    minHeight: '400px',
                  }}
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="プロンプトを読み込み中..."
                  disabled={isPromptLoading}
                />
              </div>

              {/* アクションボタン */}
              <div className="flex gap-3 justify-end pt-4 border-t" style={{ borderColor: 'var(--neo-text-secondary)' }}>
                <motion.button
                  className="neo-button flex items-center gap-2 px-4 py-2"
                  onClick={() => loadPrompt(selectedPrompt)}
                  disabled={isPromptLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="リロード"
                >
                  <RotateCcw className="w-4 h-4" />
                  リロード
                </motion.button>
                <motion.button
                  className="neo-button flex items-center gap-2 px-6 py-2"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SettingsTab: React.FC<SettingsTabProps> = ({ onSettingsChange }) => {
  const { theme, setTheme } = useTheme();
  
  const [settings, setSettings] = useState({
    theme: theme,
  });

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

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
    <>
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
              
              <div className="space-y-4">
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
                プロンプト設定
              </h3>
              
              <div className="space-y-4">
                <div className="text-sm mb-3" style={{ color: 'var(--neo-text-secondary)' }}>
                  キャラクターの思考生成や長期記憶更新に使用するプロンプトを編集できます
                </div>
                
                <motion.button
                  className="neo-button flex items-center gap-2 px-4 py-3 w-full"
                  onClick={() => setIsPromptModalOpen(true)}
                  style={{
                    background: 'var(--neo-accent)',
                    color: 'white',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit className="w-5 h-5" />
                  プロンプトを編集
                </motion.button>
              </div>
            </div>

            {/* 設定の管理 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--neo-text)' }}>
                <Download className="w-5 h-5" />
                設定の管理
              </h3>
              
              <div className="space-y-4">
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

      {/* プロンプト編集モーダル */}
      <PromptEditModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
      />
    </>
  );
}; 