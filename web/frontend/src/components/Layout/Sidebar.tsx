/**
 * サイドバーコンポーネント
 */
import React, { useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useSimulation } from '../../hooks/useSimulation';

export const Sidebar: React.FC = () => {
  const { 
    controlPanel, 
    availableCharacters, 
    simulation,
    setControlPanelState 
  } = useSimulationStore();
  
  const { 
    startSimulation, 
    stopSimulation, 
    executeNextTurn, 
    updateLLMModel 
  } = useSimulation();

  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isExecutingTurn, setIsExecutingTurn] = useState(false);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);

  const handleStartSimulation = async () => {
    if (!controlPanel.selectedCharacter) {
      alert('キャラクターを選択してください');
      return;
    }

    setIsStarting(true);
    try {
      await startSimulation({
        character_name: controlPanel.selectedCharacter,
        llm_provider: controlPanel.selectedLLMProvider,
        model_name: controlPanel.selectedModel,
        max_steps: controlPanel.maxSteps,
      });
    } catch (error) {
      console.error('シミュレーション開始エラー:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSimulation = async () => {
    setIsStopping(true);
    try {
      await stopSimulation();
    } catch (error) {
      console.error('シミュレーション停止エラー:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleExecuteNextTurn = async () => {
    setIsExecutingTurn(true);
    try {
      await executeNextTurn();
    } catch (error) {
      console.error('ターン実行エラー:', error);
    } finally {
      setIsExecutingTurn(false);
    }
  };

  const handleUpdateLLMModel = async () => {
    setIsUpdatingModel(true);
    try {
      await updateLLMModel(controlPanel.selectedLLMProvider, controlPanel.selectedModel);
    } catch (error) {
      console.error('LLMモデル更新エラー:', error);
    } finally {
      setIsUpdatingModel(false);
    }
  };

  const isSimulationRunning = simulation.status === 'running';
  const isSimulationIdle = simulation.status === 'idle';

  return (
    <aside className="w-80 bg-white border-r border-secondary-200 flex flex-col">
      {/* コントロールパネルヘッダー */}
      <div className="p-4 border-b border-secondary-200">
        <h2 className="text-lg font-semibold text-secondary-900">
          コントロールパネル
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* キャラクター選択 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            キャラクター
          </label>
          <select
            value={controlPanel.selectedCharacter}
            onChange={(e) => setControlPanelState({ selectedCharacter: e.target.value })}
            disabled={isSimulationRunning}
            className="input w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">キャラクターを選択...</option>
            {availableCharacters.map((character) => (
              <option key={character} value={character}>
                {character}
              </option>
            ))}
          </select>
        </div>

        {/* LLMプロバイダー選択 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            LLMプロバイダー
          </label>
          <select
            value={controlPanel.selectedLLMProvider}
            onChange={(e) => setControlPanelState({ 
              selectedLLMProvider: e.target.value as 'openai' | 'gemini',
              selectedModel: e.target.value === 'openai' ? 'gpt-4o' : 'gemini-1.5-flash-latest'
            })}
            className="input w-full"
          >
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        {/* モデル選択 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            モデル
          </label>
          <select
            value={controlPanel.selectedModel}
            onChange={(e) => setControlPanelState({ selectedModel: e.target.value })}
            className="input w-full"
          >
            {controlPanel.selectedLLMProvider === 'gemini' ? (
              <>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
              </>
            ) : (
              <>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </>
            )}
          </select>
        </div>

        {/* 最大ステップ数 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary-700">
            最大ステップ数 (オプション)
          </label>
          <input
            type="number"
            value={controlPanel.maxSteps || ''}
            onChange={(e) => setControlPanelState({ 
              maxSteps: e.target.value ? parseInt(e.target.value) : undefined 
            })}
            placeholder="無制限"
            min="1"
            max="1000"
            disabled={isSimulationRunning}
            className="input w-full disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* 実行中のモデル更新 */}
        {isSimulationRunning && (
          <div className="space-y-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900">
              実行中の設定変更
            </h3>
            <button
              onClick={handleUpdateLLMModel}
              disabled={isUpdatingModel}
              className="btn-secondary w-full disabled:opacity-50"
            >
              {isUpdatingModel ? 'モデル更新中...' : 'LLMモデルを更新'}
            </button>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-3">
          {isSimulationIdle ? (
            <button
              onClick={handleStartSimulation}
              disabled={isStarting || !controlPanel.selectedCharacter}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isStarting ? 'シミュレーション開始中...' : 'シミュレーション開始'}
            </button>
          ) : (
            <>
              <button
                onClick={handleExecuteNextTurn}
                disabled={isExecutingTurn || !isSimulationRunning}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isExecutingTurn ? 'ターン実行中...' : '次のターンを実行'}
              </button>
              <button
                onClick={handleStopSimulation}
                disabled={isStopping}
                className="btn-outline w-full disabled:opacity-50"
              >
                {isStopping ? 'シミュレーション停止中...' : 'シミュレーション停止'}
              </button>
            </>
          )}
        </div>

        {/* 現在の設定表示 */}
        <div className="space-y-3 p-3 bg-secondary-50 border border-secondary-200 rounded-md">
          <h3 className="text-sm font-medium text-secondary-900">
            現在の設定
          </h3>
          <div className="space-y-1 text-xs text-secondary-600">
            <div>キャラクター: {simulation.character_name || '未選択'}</div>
            <div>プロバイダー: {simulation.config.llm_provider}</div>
            <div>モデル: {simulation.config.model_name}</div>
            {simulation.config.max_steps && (
              <div>最大ステップ: {simulation.config.max_steps}</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}; 