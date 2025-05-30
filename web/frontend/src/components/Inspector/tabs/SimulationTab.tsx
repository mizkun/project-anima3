import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RefreshCw,
  History,
  Download,
  FileText,
  Clock,
  Users,
  MessageSquare,
  Settings,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface SimulationHistoryItem {
  id: string;
  timestamp: string;
  scene_id: string;
  location: string;
  participants: string[];
  turn_count: number;
  status: 'completed' | 'empty';
  file_path: string;
}

interface SimulationDetail {
  scene_info: {
    scene_id: string;
    location: string;
    time: string;
    situation: string;
    participant_character_ids: string[];
  };
  turns: Array<{
    turn_number: number;
    character_id: string;
    character_name: string;
    think: string;
    act: string;
    talk?: string;
  }>;
  interventions_in_scene: any[];
}

export const SimulationTab: React.FC = () => {
  const [simulationHistory, setSimulationHistory] = useState<SimulationHistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<SimulationHistoryItem | null>(null);
  const [historyDetail, setHistoryDetail] = useState<SimulationDetail | null>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail'>('list');

  // シミュレーション状態を取得
  const fetchSimulationStatus = async () => {
    try {
      const response = await fetch('/api/simulation/status');
      const data = await response.json();
      
      if (response.ok) {
        setCurrentStatus(data);
      } else {
        throw new Error(data.message || 'ステータスの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    }
  };

  // シミュレーション履歴を取得
  const fetchSimulationHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/simulation/history');
      const data = await response.json();
      
      if (response.ok) {
        setSimulationHistory(data.history || []);
      } else {
        throw new Error(data.message || '履歴の取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴詳細を取得
  const fetchHistoryDetail = async (simId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/simulation/history/${simId}`);
      const data = await response.json();
      
      if (response.ok) {
        setHistoryDetail(data);
        setView('detail');
      } else {
        throw new Error(data.message || '詳細の取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴からシミュレーションを再開
  const resumeSimulation = async (simId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/simulation/resume/${simId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setError(`シミュレーション ${simId} の再開機能は開発中です`);
      } else {
        throw new Error(data.message || '再開に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 履歴をエクスポート
  const exportHistory = async (simId: string) => {
    try {
      const response = await fetch(`/api/simulation/history/${simId}`);
      const data = await response.json();
      
      if (response.ok) {
        const exportData = {
          simulation: data,
          exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simulation_${simId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(data.message || 'エクスポートに失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エクスポートに失敗しました');
    }
  };

  // 初期化
  useEffect(() => {
    fetchSimulationStatus();
    fetchSimulationHistory();
  }, []);

  // ステータスの表示色を取得
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" style={{ color: 'var(--neo-success)' }} />;
      case 'empty':
        return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--neo-warning)' }} />;
      default:
        return <History className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />;
    }
  };

  // ステータスの表示テキストを取得
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'empty':
        return '空';
      default:
        return '不明';
    }
  };

  if (isLoading && simulationHistory.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: 'var(--neo-text)' }}>
        <motion.div
          className="w-8 h-8 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ color: 'var(--neo-text)' }}>
      {/* ヘッダー */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--neo-text)' }}>
            シミュレーション履歴
          </h2>
          <motion.button
            className="neo-button p-2"
            onClick={fetchSimulationHistory}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="リロード"
          >
            <motion.div
              animate={{ rotate: isLoading ? 360 : 0 }}
              transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
            >
              <RotateCcw className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
        
        {/* エラー表示 */}
        {error && (
          <motion.div
            className="neo-element-pressed p-3 rounded-lg mt-4"
            style={{ background: 'var(--neo-error)', color: 'white' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-sm">{error}</div>
          </motion.div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* シミュレーション履歴セレクタ */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <select
                className="neo-input w-full"
                value={selectedHistory?.id || ''}
                onChange={(e) => {
                  const selected = simulationHistory.find(h => h.id === e.target.value);
                  setSelectedHistory(selected || null);
                  if (selected) {
                    fetchHistoryDetail(selected.id);
                    setView('detail');
                  } else {
                    setView('list');
                    setHistoryDetail(null);
                  }
                }}
                disabled={isLoading}
              >
                <option value="">履歴を選択...</option>
                {simulationHistory.map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.location} - {run.timestamp} ({run.turn_count}ターン, {getStatusText(run.status)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 詳細エリア */}
        <div className="flex-1 overflow-hidden">
          {view === 'detail' && historyDetail ? (
            <div className="h-full flex flex-col">
              {/* 詳細ヘッダー */}
              <div className="flex-shrink-0 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-medium" style={{ color: 'var(--neo-text)' }}>シミュレーション詳細</h4>
                  
                  {/* アクションボタン */}
                  <div className="flex gap-2">
                    <button
                      className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                      onClick={() => resumeSimulation(selectedHistory?.id || '')}
                      disabled={isLoading}
                    >
                      <Play className="w-4 h-4" />
                      再開
                    </button>
                    <button
                      className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                      onClick={() => exportHistory(selectedHistory?.id || '')}
                    >
                      <Download className="w-4 h-4" />
                      エクスポート
                    </button>
                  </div>
                </div>
              </div>

              {/* 詳細内容 */}
              <div className="flex-1 overflow-y-auto neo-scrollbar p-4">
                <div className="space-y-4">
                  {/* シーン情報 */}
                  <div className="neo-card-flat p-4">
                    <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      シーン情報
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div><strong>シーン:</strong> {historyDetail.scene_info.location}</div>
                      <div><strong>シーンID:</strong> {historyDetail.scene_info.scene_id}</div>
                      <div><strong>時間:</strong> {historyDetail.scene_info.time}</div>
                      <div><strong>状況:</strong> {historyDetail.scene_info.situation}</div>
                      <div><strong>参加キャラクター:</strong> {historyDetail.scene_info.participant_character_ids.join(', ')}</div>
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{historyDetail.turns.length}ターン</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{historyDetail.interventions_in_scene.length}介入</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ターン詳細 */}
                  <div className="neo-card-flat p-4">
                    <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      ターン詳細
                    </h5>
                    <div className="space-y-3 max-h-96 overflow-y-auto neo-scrollbar">
                      {historyDetail.turns.map((turn, index) => (
                        <div key={index} className="neo-element-subtle p-3 rounded-lg">
                          <div className="text-xs font-medium mb-2" style={{ color: 'var(--neo-accent)' }}>
                            ターン {turn.turn_number}: {turn.character_name}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div><strong>思考:</strong> {turn.think.length > 100 ? `${turn.think.substring(0, 100)}...` : turn.think}</div>
                            <div><strong>行動:</strong> {turn.act.length > 100 ? `${turn.act.substring(0, 100)}...` : turn.act}</div>
                            {turn.talk && (
                              <div><strong>発言:</strong> {turn.talk}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center" style={{ color: 'var(--neo-text-secondary)' }}>
                <History className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">履歴を選択してください</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 