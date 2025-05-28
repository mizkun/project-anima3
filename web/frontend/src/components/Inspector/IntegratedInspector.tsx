import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Movie as MovieIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  TouchApp as TouchAppIcon,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { PromptTab } from './tabs/PromptTab';
import { SceneTab } from './tabs/SceneTab';
import { CharacterTab } from './tabs/CharacterTab';
import { SimulationTab } from './tabs/SimulationTab';
import { InterventionTab } from './tabs/InterventionTab';

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
      style={{ height: '100%', overflow: 'hidden' }}
    >
      {value === index && (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      )}
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
  const [activeTab, setActiveTab] = useState(3); // プロンプトタブをデフォルトで開く

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleToggleCollapse = () => {
    onCollapseChange?.(!isCollapsed);
  };

  // 折りたたみ時は最小幅（ボタンのみ表示）
  const displayWidth = isCollapsed ? 28 : width;

  return (
    <>
      {/* 折りたたみボタン（常に表示） */}
      <Box
        sx={{
          position: 'fixed',
          right: isCollapsed ? 4 : width - 24,
          top: 12,
          zIndex: 1001,
          transition: 'right 0.3s ease-in-out',
        }}
      >
        <Tooltip title={isCollapsed ? "パネルを開く" : "パネルを閉じる"}>
          <IconButton
            onClick={handleToggleCollapse}
            sx={{
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 1,
              width: 20,
              height: 20,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            size="small"
          >
            {isCollapsed ? (
              <ChevronLeft sx={{ fontSize: 14 }} />
            ) : (
              <ChevronRight sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* メインパネル */}
      <Paper
        sx={{
          width: displayWidth,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          borderRadius: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease-in-out',
          overflow: 'hidden',
        }}
      >
        {!isCollapsed && (
          <>
            {/* タブヘッダー */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                aria-label="統合インスペクタータブ"
              >
                <Tab
                  icon={<MovieIcon />}
                  label="シーン"
                  {...a11yProps(0)}
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<PeopleIcon />}
                  label="キャラクター"
                  {...a11yProps(1)}
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<SettingsIcon />}
                  label="シミュレーション"
                  {...a11yProps(2)}
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<EditIcon />}
                  label="プロンプト"
                  {...a11yProps(3)}
                  sx={{ minHeight: 64 }}
                />
                <Tab
                  icon={<TouchAppIcon />}
                  label="介入"
                  {...a11yProps(4)}
                  sx={{ minHeight: 64 }}
                />
              </Tabs>
            </Box>

            {/* タブコンテンツ */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <TabPanel value={activeTab} index={0}>
                <SceneTab />
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <CharacterTab />
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <SimulationTab />
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <PromptTab />
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                <InterventionTab />
              </TabPanel>
            </Box>
          </>
        )}
      </Paper>
    </>
  );
}; 