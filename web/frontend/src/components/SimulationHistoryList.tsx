import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getSimulationHistories,
  resumeSimulation,
  pauseSimulation,
  deleteSimulationHistory,
  type SimulationHistoryEntry
} from '../api/sceneApi';

interface SimulationHistoryListProps {
  onSimulationSelect: (simulationId: string) => void;
  refreshTrigger: number;
}

const SimulationHistoryList: React.FC<SimulationHistoryListProps> = ({
  onSimulationSelect,
  refreshTrigger
}) => {
  const [histories, setHistories] = useState<SimulationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSimulation, setExpandedSimulation] = useState<string | null>(null);

  // シミュレーション履歴を取得
  const fetchHistories = async () => {
    try {
      const response = await getSimulationHistories();
      if (response.success) {
        setHistories(response.histories);
      }
    } catch (error) {
      console.error('シミュレーション履歴取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistories();
  }, [refreshTrigger]);

  // シミュレーション再開
  const handleResumeSimulation = async (simulationId: string) => {
    try {
      const response = await resumeSimulation(simulationId);
      if (response.success) {
        onSimulationSelect(simulationId);
        fetchHistories(); // 履歴を更新
      }
    } catch (error) {
      console.error('シミュレーション再開エラー:', error);
    }
  };

  // シミュレーション一時停止
  const handlePauseSimulation = async (simulationId: string) => {
    try {
      await pauseSimulation(simulationId);
      fetchHistories(); // 履歴を更新
    } catch (error) {
      console.error('シミュレーション一時停止エラー:', error);
    }
  };

  // シミュレーション削除
  const handleDeleteSimulation = async (simulationId: string) => {
    if (window.confirm('このシミュレーション履歴を削除しますか？')) {
      try {
        await deleteSimulationHistory(simulationId);
        fetchHistories(); // 履歴を更新
      } catch (error) {
        console.error('シミュレーション削除エラー:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '実行中';
      case 'paused': return '一時停止';
      case 'completed': return '完了';
      case 'archived': return 'アーカイブ';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (histories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>シミュレーション履歴がありません</p>
        <p className="text-sm mt-1">新しいシミュレーションを開始してみましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {histories.map((history) => (
          <motion.div
            key={history.simulationId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* ヘッダー部分 */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedSimulation(
                expandedSimulation === history.simulationId ? null : history.simulationId
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{history.simulationName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                      {getStatusText(history.status)}
                    </span>
                    {history.isActive && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        アクティブ
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {history.thumbnailDescription}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400 mt-2">
                    <span>ターン数: {history.turnCount}</span>
                    <span>最終アクセス: {new Date(history.lastAccessedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedSimulation === history.simulationId ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              </div>
            </div>

            {/* 展開部分 */}
            <AnimatePresence>
              {expandedSimulation === history.simulationId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-gray-200"
                >
                  <div className="p-4 bg-gray-50">
                    {/* シミュレーション詳細 */}
                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">場所:</span>
                        <span className="ml-2 text-gray-600">{history.simulationSettings.location}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">時間:</span>
                        <span className="ml-2 text-gray-600">{history.simulationSettings.time}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">状況:</span>
                        <span className="ml-2 text-gray-600">{history.simulationSettings.situation}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">参加キャラクター:</span>
                        <span className="ml-2 text-gray-600">
                          {history.simulationSettings.participant_character_ids.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResumeSimulation(history.simulationId)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        再開
                      </button>
                      {history.status === 'active' && (
                        <button
                          onClick={() => handlePauseSimulation(history.simulationId)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition-colors"
                        >
                          一時停止
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSimulation(history.simulationId)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SimulationHistoryList; 