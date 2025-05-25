/**
 * シミュレーションページコンポーネント
 */
import React, { useEffect } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { useSimulation } from '../hooks/useSimulation';
import { useWebSocket } from '../hooks/useWebSocket';

export const SimulationPage: React.FC = () => {
  const { simulation, ui } = useSimulationStore();
  const { loadInitialData } = useSimulation();
  const { isConnected } = useWebSocket();

  // 初期データ読み込み
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'turn':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'intervention':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-secondary-50 border-secondary-200 text-secondary-800';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* タイムラインヘッダー */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">
            シミュレーションタイムライン
          </h1>
          <div className="flex items-center space-x-4 text-sm text-secondary-600">
            {simulation.timeline.length > 0 && (
              <span>
                {simulation.timeline.length} エントリー
              </span>
            )}
            {ui.lastUpdate && (
              <span>
                最終更新: {formatTimestamp(ui.lastUpdate)}
              </span>
            )}
          </div>
        </div>
        
        {/* 接続状態の警告 */}
        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-yellow-800">
                サーバーとの接続が切断されています。リアルタイム更新が無効になっています。
              </span>
            </div>
          </div>
        )}
      </div>

      {/* タイムライン */}
      <div className="flex-1 overflow-hidden">
        {simulation.timeline.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                タイムラインは空です
              </h3>
              <p className="text-secondary-600 mb-4">
                シミュレーションを開始すると、ここにタイムラインが表示されます。
              </p>
              {simulation.status === 'idle' && (
                <p className="text-sm text-secondary-500">
                  左のコントロールパネルからキャラクターを選択してシミュレーションを開始してください。
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="space-y-4">
              {simulation.timeline.map((entry, index) => (
                <div
                  key={`${entry.step}-${index}`}
                  className={`card ${getActionTypeColor(entry.action_type)} animate-slide-up`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-sm font-medium">
                          {entry.step}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {entry.character}
                        </h3>
                        <p className="text-sm opacity-75">
                          {entry.action_type === 'turn' && 'ターン実行'}
                          {entry.action_type === 'intervention' && '介入'}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm opacity-75">
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {entry.action_type === 'turn' && entry.metadata && (
                      <>
                        {entry.metadata.think && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">思考:</h4>
                            <p className="text-sm bg-white bg-opacity-50 p-2 rounded">
                              {entry.metadata.think}
                            </p>
                          </div>
                        )}
                        {entry.metadata.act && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">行動:</h4>
                            <p className="text-sm bg-white bg-opacity-50 p-2 rounded">
                              {entry.metadata.act}
                            </p>
                          </div>
                        )}
                        {entry.metadata.talk && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">発言:</h4>
                            <p className="text-sm bg-white bg-opacity-50 p-2 rounded">
                              {entry.metadata.talk}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {entry.action_type === 'intervention' && (
                      <div>
                        <p className="text-sm bg-white bg-opacity-50 p-2 rounded">
                          {entry.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 