/**
 * ヘッダーコンポーネント
 */
import React from 'react';
import { useSimulationStore } from '../../stores/simulationStore';

export const Header: React.FC = () => {
  const { status, current_turn, max_turns, config, isLoading, error_message } = useSimulationStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-50';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-secondary-600 bg-secondary-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started':
        return '未開始';
      case 'idle':
        return 'アイドル';
      case 'running':
        return '実行中';
      case 'paused':
        return '一時停止';
      case 'completed':
        return '完了';
      case 'error':
        return 'エラー';
      default:
        return status;
    }
  };

  return (
    <header className="bg-white border-b border-secondary-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* ロゴとタイトル */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PA</span>
            </div>
            <h1 className="text-xl font-semibold text-secondary-900">
              Project Anima
            </h1>
          </div>
          <div className="text-sm text-secondary-500">
            Web UI
          </div>
        </div>

        {/* ステータス表示 */}
        <div className="flex items-center space-x-4">
          {/* シミュレーション状態 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-secondary-600">状態:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          </div>

          {/* 現在のターン */}
          {status !== 'not_started' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600">ターン:</span>
              <span className="text-sm font-medium text-secondary-900">
                {current_turn} / {max_turns}
              </span>
            </div>
          )}

          {/* キャラクター名 */}
          {config.character_name && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary-600">キャラクター:</span>
              <span className="text-sm font-medium text-secondary-900">
                {config.character_name}
              </span>
            </div>
          )}

          {/* ローディング表示 */}
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span className="text-sm text-secondary-600">処理中...</span>
            </div>
          )}
        </div>
      </div>

      {/* エラー表示 */}
      {error_message && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error_message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => useSimulationStore.getState().clearError()}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}; 