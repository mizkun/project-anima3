import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { 
  Play,
  Square,
  SkipForward,
  Sparkles,
  X,
  ChevronDown,
  Zap,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationControls } from '@/hooks/useSimulationControls';

interface MinimalControlsProps {
  // onSettingsClickプロパティを削除
}

interface Scene {
  id: string;
  name: string;
}

interface Character {
  id: string;
  name: string;
}

export const MinimalControls: React.FC<MinimalControlsProps> = () => {
  const { status, isLoading } = useSimulationStore();
  const { startSimulation, stopSimulation, executeNextTurn } = useSimulationControls();
  
  // 状態変更を監視
  useEffect(() => {
    console.log('=== MinimalControls 状態変更 ===', { 
      status, 
      isLoading,
      timestamp: new Date().toISOString(),
      storeState: useSimulationStore.getState()
    });
  }, [status, isLoading]);
  
  // 定期的にバックエンド状態をチェック（デバッグ用）
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/simulation/status');
        const data = await response.json();
        console.log('=== バックエンド状態チェック ===', {
          backendStatus: data.status,
          frontendStatus: status,
          statusMatch: data.status === status,
          timestamp: new Date().toISOString()
        });
        
        // 状態が不一致の場合は同期
        if (data.status !== status) {
          console.log('状態不一致を検出、同期を実行します');
          useSimulationStore.getState().updateFromBackend(data);
        }
      } catch (error) {
        console.error('バックエンド状態チェックエラー:', error);
      }
    }, 3000); // 3秒ごと
    
    return () => clearInterval(intervalId);
  }, [status]);
  
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  
  // 介入機能の状態
  const [isInterventionOpen, setIsInterventionOpen] = useState(false);
  const [interventionType, setInterventionType] = useState<'global' | 'character'>('global');
  const [interventionText, setInterventionText] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');

  // シーン一覧の取得
  useEffect(() => {
    const fetchScenes = async () => {
      try {
        const response = await fetch('/api/simulation/scenes');
        if (response.ok) {
          const scenesData = await response.json();
          console.log('Scenes response:', scenesData);
          
          if (scenesData && scenesData.scenes && Array.isArray(scenesData.scenes)) {
            setScenes(scenesData.scenes);
            if (scenesData.scenes.length > 0 && !selectedSceneId) {
              setSelectedSceneId(scenesData.scenes[0].id);
            }
          } else {
            console.warn('Unexpected scenes response format:', scenesData);
            setScenes([]);
          }
        }
      } catch (error) {
        console.error('シーン一覧の取得に失敗しました:', error);
        setScenes([]);
      }
    };

    fetchScenes();
  }, [selectedSceneId]);

  // キャラクター一覧の取得
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const { characters } = useSimulationStore.getState();
        if (characters && Array.isArray(characters) && characters.length > 0) {
          setAvailableCharacters(characters);
        } else {
          // シミュレーション状態からキャラクター情報を取得
          const response = await fetch('/api/simulation/status');
          if (response.ok) {
            const statusData = await response.json();
            if (statusData.current_scene && statusData.current_scene.participant_character_ids) {
              const characterPromises = statusData.current_scene.participant_character_ids.map(async (id: string) => {
                try {
                  // キャラクターファイルは {character_id}/immutable.yaml の構造になっている
                  const charResponse = await fetch(`/api/files/data/characters/${id}/immutable.yaml`);
                  if (charResponse.ok) {
                    const charData = await charResponse.json();
                    // APIレスポンスのcontentフィールドからYAMLコンテンツを取得
                    const charText = charData.content;
                    // YAMLパースは簡易的に行う（実際のプロジェクトではyamlライブラリを使用）
                    const nameMatch = charText.match(/name:\s*"?([^"\n]+)"?/);
                    return {
                      id,
                      name: nameMatch ? nameMatch[1].trim() : id
                    };
                  }
                } catch (error) {
                  console.error(`キャラクター ${id} の取得に失敗:`, error);
                }
                return { id, name: id };
              });
              
              const resolvedCharacters = await Promise.all(characterPromises);
              setAvailableCharacters(resolvedCharacters.filter(Boolean));
            }
          }
        }
      } catch (error) {
        console.error('キャラクター一覧の取得に失敗しました:', error);
        setAvailableCharacters([]);
      }
    };

    if (interventionType === 'character') {
      fetchCharacters();
    }
  }, [interventionType]);

  const handleNextTurn = async () => {
    try {
      await executeNextTurn();
    } catch (error) {
      console.error('次のターンの実行に失敗しました:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stopSimulation();
    } catch (error) {
      console.error('シミュレーションの停止に失敗しました:', error);
    }
  };

  const handleSceneChange = (sceneId: string) => {
    setSelectedSceneId(sceneId);
  };

  const handleIntervention = async () => {
    if (!interventionText.trim()) return;

    try {
      // フロントエンドの介入タイプをバックエンドの形式に変換
      const backendInterventionType = interventionType === 'global' ? 'update_situation' : 'give_revelation';
      
      const interventionData = {
        type: backendInterventionType,
        content: interventionText.trim(),
        ...(interventionType === 'character' && selectedCharacterId && {
          target_character: selectedCharacterId
        })
      };

      console.log('Sending intervention:', interventionData);

      const response = await fetch('/api/simulation/intervention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interventionData),
      });

      if (response.ok) {
        setInterventionText('');
        setIsInterventionOpen(false);
        
        // 介入後にシミュレーション状態を更新
        const statusResponse = await fetch('/api/simulation/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          useSimulationStore.getState().updateFromBackend(statusData);
        }
      } else {
        const errorData = await response.json();
        console.error('介入の実行に失敗しました:', errorData);
      }
    } catch (error) {
      console.error('介入の実行に失敗しました:', error);
    }
  };

  const handleStart = async () => {
    console.log('=== Startボタンがクリックされました ===', { 
      selectedSceneId, 
      status, 
      isLoading,
      timestamp: new Date().toISOString()
    });
    
    if (!selectedSceneId) {
      console.warn('シーンが選択されていません');
      return;
    }

    try {
      // エラー状態の場合は先に停止してリセット
      if (status === 'error') {
        console.log('エラー状態を検出、シミュレーションを停止してリセットします');
        await stopSimulation();
        // 少し待ってから開始
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // ローカルストレージから設定を読み込み
      const savedSettings = localStorage.getItem('simulationSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {
        maxTurns: 10,
        temperature: 0.7,
        maxTokens: 1000,
        llmProvider: 'gemini',
        modelName: 'gemini-1.5-flash',
      };

      console.log('シミュレーション設定:', settings);

      const startParams = {
        scene_id: selectedSceneId,
        max_turns: settings.maxTurns,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        llm_provider: settings.llmProvider as 'gemini' | 'openai',
        model_name: settings.modelName,
      };

      console.log('シミュレーション開始パラメータ:', startParams);
      console.log('startSimulation関数を呼び出します...');
      
      await startSimulation(startParams);
      console.log('=== シミュレーションが正常に開始されました ===');
      
    } catch (error) {
      console.error('=== シミュレーション開始エラー ===:', error);
      // エラー時は状態をリセット
      try {
        await stopSimulation();
      } catch (stopError) {
        console.error('停止処理でもエラーが発生:', stopError);
      }
    }
  };

  const handleSubmitIntervention = async () => {
    if (!interventionText.trim()) return

    try {
      await handleIntervention()
      setInterventionText('')
      setIsInterventionOpen(false)
    } catch (error) {
      console.error('Failed to submit intervention:', error)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* メインコントロール */}
      <div 
        className="w-full p-4"
        style={{
          background: 'transparent',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* シーン選択 - コンパクト */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative" style={{ minWidth: '200px', maxWidth: '300px' }}>
            <select
              className="neo-input px-3 py-1.5 text-sm appearance-none cursor-pointer"
              value={selectedSceneId}
              onChange={(e) => handleSceneChange(e.target.value)}
              disabled={status === 'running' || status === 'idle'}
              style={{
                paddingRight: '32px',
                opacity: (status === 'running' || status === 'idle') ? 0.6 : 1,
                cursor: (status === 'running' || status === 'idle') ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">Select Scene</option>
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.name}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
            </div>
          </div>

          {/* メインコントロールボタン - 横並び */}
          <div className="flex gap-2 items-center flex-1">
            {(() => {
              const isSimulationActive = status === 'running' || status === 'idle';
              console.log('=== ボタン表示判定 ===', { 
                status, 
                isSimulationActive, 
                condition: !isSimulationActive,
                statusType: typeof status,
                buttonToShow: !isSimulationActive ? 'Start' : 'Stop',
                timestamp: new Date().toISOString()
              });
              return !isSimulationActive ? (
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
                  onClick={handleStart}
                  disabled={!selectedSceneId || isLoading}
                  style={{
                    color: 'white',
                    background: 'var(--neo-accent)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                    cursor: (!selectedSceneId || isLoading) ? 'not-allowed' : 'pointer',
                    opacity: (!selectedSceneId || isLoading) ? 0.6 : 1,
                  }}
                >
                  <Play className="w-4 h-4" />
                  Start
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
                  onClick={handleStop}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              );
            })()}

            {status === 'idle' && (
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
                onClick={handleNextTurn}
                style={{
                  background: 'var(--neo-accent)',
                  color: 'white',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                }}
              >
                <SkipForward className="w-4 h-4" />
                Next Turn
              </button>
            )}

            {(status === 'running' || status === 'idle') && (
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
                onClick={() => setIsInterventionOpen(prev => !prev)}
                style={{
                  background: isInterventionOpen ? 'var(--neo-accent)' : 'rgba(255, 255, 255, 0.9)',
                  color: isInterventionOpen ? 'white' : 'var(--neo-accent)',
                  border: `1px solid var(--neo-accent)`,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Zap className="w-4 h-4" />
                Intervene
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 介入パネル - ニューモーフィズムスタイル */}
      <AnimatePresence mode="wait">
        {isInterventionOpen && (
          <motion.div
            className="overflow-hidden"
            initial={{ 
              opacity: 0, 
              maxHeight: 0,
              marginTop: 0 
            }}
            animate={{ 
              opacity: 1, 
              maxHeight: 500,
              marginTop: 0 
            }}
            exit={{ 
              opacity: 0, 
              maxHeight: 0,
              marginTop: 0 
            }}
            transition={{ 
              duration: 0.4,
              ease: [0.04, 0.62, 0.23, 0.98],
              opacity: { duration: 0.3 },
              maxHeight: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }
            }}
          >
            <div
              className="p-4"
              style={{
                background: 'var(--neo-background)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(0, 0, 0, 0.04)',
              }}
            >
              {/* 介入パネルヘッダー */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: 'var(--neo-accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--neo-text)' }}>Intervention</span>
                </div>
                <button
                  className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setIsInterventionOpen(false)}
                  style={{ color: 'var(--neo-text-secondary)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 介入タイプ選択 */}
              <div className="flex gap-2 items-center mb-3">
                <div className="relative">
                  <select
                    className="neo-input px-3 py-2 text-sm appearance-none cursor-pointer"
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value as 'global' | 'character')}
                    style={{
                      paddingRight: '32px',
                      minWidth: '120px',
                    }}
                  >
                    <option value="global">Global</option>
                    <option value="character">Character</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                  </div>
                </div>

                {interventionType === 'character' && (
                  <div className="relative">
                    <select
                      className="neo-input px-3 py-2 text-sm appearance-none cursor-pointer"
                      value={selectedCharacterId}
                      onChange={(e) => setSelectedCharacterId(e.target.value)}
                      style={{
                        paddingRight: '32px',
                        minWidth: '140px',
                      }}
                    >
                      <option value="">Select Character</option>
                      {Array.isArray(availableCharacters) && availableCharacters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* 介入テキスト入力 */}
              <textarea
                className="neo-input w-full p-3 resize-none mb-3 text-sm"
                rows={3}
                value={interventionText}
                onChange={(e) => setInterventionText(e.target.value)}
                placeholder={
                  interventionType === 'global' 
                    ? "Describe environmental changes (e.g., 'It starts raining')"
                    : "Provide character insights (e.g., 'Alice remembers something')"
                }
              />

              {/* アクションボタン */}
              <div className="flex justify-end gap-2">
                <button
                  className="px-3 py-2 text-sm rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    setInterventionText('');
                    setSelectedCharacterId('');
                  }}
                  style={{ color: 'var(--neo-text-secondary)' }}
                >
                  Clear
                </button>
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
                  onClick={handleSubmitIntervention}
                  disabled={!interventionText.trim() || (interventionType === 'character' && !selectedCharacterId)}
                  style={{
                    ...(interventionText.trim() && (interventionType !== 'character' || selectedCharacterId) ? {
                      background: 'var(--neo-accent)',
                      color: 'white',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                    } : {
                      background: 'var(--neo-element)',
                      color: 'var(--neo-text-secondary)',
                      border: '1px solid var(--neo-border)',
                    }),
                    opacity: !interventionText.trim() || (interventionType === 'character' && !selectedCharacterId) ? 0.6 : 1,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Execute
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 