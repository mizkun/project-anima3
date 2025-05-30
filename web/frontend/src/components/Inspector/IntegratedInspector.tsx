import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Movie as MovieIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { SceneTab } from './tabs/SceneTab';
import { CharacterTab } from './tabs/CharacterTab';
import { SettingsTab } from './tabs/SettingsTab';
import { SimulationTab } from './tabs/SimulationTab';

interface IntegratedInspectorProps {
  width: number;
  onWidthChange: (width: number) => void;
  isCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inspector-tabpanel-${index}`}
      aria-labelledby={`inspector-tab-${index}`}
      {...other}
      className="h-full overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {value === index && (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// タブのアクセシビリティ属性
const a11yProps = (index: number) => {
  return {
    id: `inspector-tab-${index}`,
    'aria-controls': `inspector-tabpanel-${index}`,
  };
};

export const IntegratedInspector: React.FC<IntegratedInspectorProps> = ({
  width,
  onWidthChange,
  isCollapsed = false,
  onCollapseChange,
}) => {
  const [activeTab, setActiveTab] = useState(0); // シーンタブをデフォルトで開く

  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };

  const handleToggleCollapse = () => {
    onCollapseChange?.(!isCollapsed);
  };

  // 折りたたみ時は最小幅（ボタンのみ表示）
  const displayWidth = isCollapsed ? 28 : width;

  const tabs = [
    { icon: MovieIcon, label: 'シーン', component: SceneTab },
    { icon: PeopleIcon, label: 'キャラ', component: CharacterTab },
    { icon: HistoryIcon, label: '履歴', component: SimulationTab },
    { icon: SettingsIcon, label: '設定', component: SettingsTab },
  ];

  return (
    <>
      {/* 折りたたみボタン（常に表示） - 控えめなスタイル */}
      <motion.div
        className="fixed z-50"
        style={{
          right: isCollapsed ? 16 : width - 24,
          top: 16,
        }}
        animate={{ right: isCollapsed ? 16 : width - 24 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.button
          className="p-1.5 rounded-lg w-8 h-8 flex items-center justify-center text-sm"
          onClick={handleToggleCollapse}
          style={{
            background: 'var(--neo-element)',
            color: 'var(--neo-text)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--neo-border)',
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          }}
          whileTap={{ scale: 0.95 }}
          title={isCollapsed ? "パネルを開く" : "パネルを閉じる"}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--neo-accent)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--neo-element)';
            e.currentTarget.style.color = 'var(--neo-text)';
          }}
        >
          {/* 回転アニメーションを削除し、直接的にアイコンを表示 */}
          {isCollapsed ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </motion.button>
      </motion.div>

      {/* メインパネル */}
      <motion.div
        className="h-screen flex flex-col neo-card-floating overflow-hidden"
        style={{
          width: displayWidth,
          borderRadius: '24px 0 0 24px',
          marginTop: 0,
          marginBottom: 0,
          marginRight: 0,
        }}
        animate={{ width: displayWidth }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="flex flex-col h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* タブヘッダー - カードを削除してシンプルに */}
              <div className="p-4 flex-shrink-0">
                <div className="flex justify-center gap-4">
                  {tabs.map((tab, index) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={index}
                        className={`p-3 rounded-xl transition-all duration-300 ${
                          activeTab === index 
                            ? 'neo-element-pressed' 
                            : 'hover:neo-element-subtle'
                        }`}
                        onClick={() => handleTabChange(index)}
                        style={{
                          color: activeTab === index ? 'var(--neo-accent)' : 'var(--neo-text-secondary)'
                        }}
                        title={tab.label}
                        {...a11yProps(index)}
                      >
                        <IconComponent 
                          className={activeTab === index ? 'w-6 h-6' : 'w-5 h-5'} 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* タブコンテンツ - カードを削除して直接表示 */}
              <div className="flex-1 overflow-hidden">
                {tabs.map((tab, index) => {
                  const ComponentToRender = tab.component;
                  return (
                    <TabPanel key={index} value={activeTab} index={index}>
                      <ComponentToRender />
                    </TabPanel>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}; 