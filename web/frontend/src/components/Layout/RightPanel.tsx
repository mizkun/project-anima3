import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SimulationHistoryList from '../SimulationHistoryList';

interface RightPanelProps {
  onSimulationSelect?: (simulationId: string) => void;
}

type TabType = 'characters' | 'history' | 'settings';

const RightPanel: React.FC<RightPanelProps> = ({ onSimulationSelect }) => {
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs = [
    { id: 'characters' as const, label: 'キャラクター', icon: '👥' },
    { id: 'history' as const, label: '履歴', icon: '📚' },
    { id: 'settings' as const, label: '設定', icon: '⚙️' },
  ];

  const handleSimulationSelect = (simulationId: string) => {
    onSimulationSelect?.(simulationId);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* タブヘッダー */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTab === 'characters' && (
            <div className="h-full p-4">
              <h3 className="text-lg font-semibold mb-4">キャラクター設定</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">参加キャラクター</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        A
                      </div>
                      <span className="text-sm">Alice</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                        B
                      </div>
                      <span className="text-sm">Bob</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">キャラクター詳細</h4>
                  <p className="text-sm text-gray-600">
                    キャラクターの詳細設定や性格調整はここで行います。
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="h-full overflow-auto p-4">
              <SimulationHistoryList
                onSimulationSelect={handleSimulationSelect}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="h-full p-4">
              <h3 className="text-lg font-semibold mb-4">設定</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">シミュレーション設定</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LLMモデル
                      </label>
                      <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                        <option>GPT-4</option>
                        <option>GPT-3.5-turbo</option>
                        <option>Gemini Pro</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最大ターン数
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">表示設定</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">デバッグ情報を表示</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">自動スクロール</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RightPanel; 