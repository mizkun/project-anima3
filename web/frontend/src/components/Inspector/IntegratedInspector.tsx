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
    { icon: PeopleIcon, label: 'キャラクター', component: CharacterTab },
    { icon: HistoryIcon, label: '履歴', component: SimulationTab },
    { icon: SettingsIcon, label: '設定', component: SettingsTab },
  ];

  return (
    <>
      {/* 折りたたみボタン（常に表示） */}
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
          className="neo-button-primary p-2 rounded-full w-10 h-10 flex items-center justify-center"
          onClick={handleToggleCollapse}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isCollapsed ? "パネルを開く" : "パネルを閉じる"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {isCollapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </motion.div>
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
              {/* タブヘッダー */}
              <div className="neo-element-subtle p-2 m-4 mb-0 rounded-t-2xl flex-shrink-0">
                <div className="grid grid-cols-4 gap-1">
                  {tabs.map((tab, index) => {
                    const IconComponent = tab.icon;
                    return (
                      <motion.button
                        key={index}
                        className={`neo-button flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${
                          activeTab === index ? 'neo-element-pressed' : ''
                        }`}
                        onClick={() => handleTabChange(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          color: activeTab === index ? 'var(--neo-accent)' : 'var(--neo-text-secondary)'
                        }}
                        {...a11yProps(index)}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs font-medium">{tab.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* タブコンテンツ */}
              <div className="flex-1 overflow-hidden mx-4 mb-4">
                <div 
                  className="neo-element-pressed rounded-b-2xl h-full overflow-hidden"
                  style={{ padding: '0' }}
                >
                  {tabs.map((tab, index) => {
                    const ComponentToRender = tab.component;
                    return (
                      <TabPanel key={index} value={activeTab} index={index}>
                        <ComponentToRender />
                      </TabPanel>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}; 