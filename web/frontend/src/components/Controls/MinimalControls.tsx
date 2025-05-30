import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import {
  PlayArrow as PlayArrowIcon,
  Stop,
  SkipNext,
  ExpandMore,
  Close,
} from '@mui/icons-material';
import { 
  Play,
  Square,
  SkipForward,
  Sparkles,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationControls } from '../../hooks/useSimulationControls';

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
  
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  
  // 介入機能の状態
  const [isInterventionOpen, setIsInterventionOpen] = useState(false);
  const [interventionType, setInterventionType] = useState<'global' | 'character'>('global');
  const [interventionContent, setInterventionContent] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');

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
                  const charResponse = await fetch(`/api/files/data/characters/${id}.yaml`);
                  if (charResponse.ok) {
                    const charText = await charResponse.text();
                    // YAMLパースは簡易的に行う（実際のプロジェクトではyamlライブラリを使用）
                    const nameMatch = charText.match(/name:\s*(.+)/);
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
    if (!interventionContent.trim()) return;

    try {
      // フロントエンドの介入タイプをバックエンドの形式に変換
      const backendInterventionType = interventionType === 'global' ? 'update_situation' : 'give_revelation';
      
      const interventionData = {
        type: backendInterventionType,
        content: interventionContent.trim(),
        ...(interventionType === 'character' && selectedCharacterId && {
          character_id: selectedCharacterId
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
        setInterventionContent('');
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
    if (!selectedSceneId) return;

    try {
      // ローカルストレージから設定を読み込み
      const savedSettings = localStorage.getItem('simulationSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : {
        maxTurns: 10,
        temperature: 0.7,
        maxTokens: 1000,
        llmProvider: 'gemini',
        modelName: 'gemini-1.5-flash',
      };

      await startSimulation({
        scene_id: selectedSceneId,
        max_turns: settings.maxTurns,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        llm_provider: settings.llmProvider as 'gemini' | 'openai',
        model_name: settings.modelName,
      });
    } catch (error) {
      console.error('シミュレーション開始に失敗しました:', error);
    }
  };

  const isRunning = status === 'running' || status === 'idle';

  return (
    <div className="w-full" style={{ color: 'var(--neo-text)' }}>
      <div className="space-y-3">
        {/* シーン選択 */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neo-text-secondary)' }}>
            シーン
          </label>
          <div className="neo-input-container">
            <select
              className="neo-input w-full text-sm"
              value={selectedSceneId || ''}
              onChange={(e) => handleSceneChange(e.target.value)}
              style={{
                background: 'var(--neo-element)',
                color: 'var(--neo-text)',
                padding: '8px 12px',
                fontSize: '0.875rem',
              }}
            >
              <option value="">シーンを選択</option>
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="flex gap-2 flex-wrap">
          {status === 'not_started' ? (
            <button
              className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
              onClick={handleStart}
              disabled={!selectedSceneId}
              style={{
                ...(selectedSceneId && {
                  background: 'var(--neo-accent)',
                  color: 'white',
                  boxShadow: 'var(--neo-shadow-floating)',
                }),
                opacity: !selectedSceneId ? 0.6 : 1,
                cursor: !selectedSceneId ? 'not-allowed' : 'pointer',
              }}
            >
              <Play className="w-4 h-4" />
              開始
            </button>
          ) : (
            <button
              className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
              onClick={handleStop}
              style={{ color: 'var(--neo-error)' }}
            >
              <Square className="w-4 h-4" />
              停止
            </button>
          )}

          {(status === 'running' || status === 'idle') && (
            <button
              className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
              onClick={handleNextTurn}
              disabled={isLoading}
              style={{
                background: 'var(--neo-accent)',
                color: 'white',
                boxShadow: 'var(--neo-shadow-floating)',
              }}
            >
              {isLoading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <SkipForward className="w-4 h-4" />
              )}
              次ターン
            </button>
          )}

          {(status === 'running' || status === 'idle') && (
            <button
              className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
              onClick={() => setIsInterventionOpen(!isInterventionOpen)}
            >
              <Sparkles className="w-4 h-4" />
              介入
            </button>
          )}
        </div>

        {/* ステータス表示 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: status === 'running' ? 'var(--neo-success)' : 
                                status === 'idle' ? 'var(--neo-warning)' : 'var(--neo-text-secondary)'
              }}
              transition={{ duration: 0.3 }}
            />
            <span style={{ color: 'var(--neo-text-secondary)' }}>
              {status === 'running' ? '実行中' : status === 'idle' ? '待機中' : status === 'not_started' ? '未開始' : '停止中'}
            </span>
            <span style={{ color: 'var(--neo-text-secondary)', fontSize: '0.6rem' }}>
              (status: {status})
            </span>
          </div>
        </div>
      </div>

      {/* 介入パネル */}
      <AnimatePresence>
        {isInterventionOpen && (
          <motion.div
            className="neo-element-pressed mt-6 p-4 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4 items-center flex-1">
                <div className="relative">
                  <select
                    className="neo-input px-3 py-2 min-w-[120px] appearance-none cursor-pointer"
                    value={interventionType}
                    onChange={(e) => setInterventionType(e.target.value as 'global' | 'character')}
                  >
                    <option value="global">全体向け</option>
                    <option value="character">キャラクター向け</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                  </div>
                </div>

                {interventionType === 'character' && (
                  <div className="relative">
                    <select
                      className="neo-input px-3 py-2 min-w-[150px] appearance-none cursor-pointer"
                      value={selectedCharacterId}
                      onChange={(e) => setSelectedCharacterId(e.target.value)}
                    >
                      <option value="">キャラクターを選択</option>
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

              <div>
                <button
                  className="neo-button p-2 rounded-full"
                  onClick={() => setIsInterventionOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              className="neo-input w-full p-4 resize-none mb-4"
              rows={3}
              value={interventionContent}
              onChange={(e) => setInterventionContent(e.target.value)}
              placeholder={
                interventionType === 'global' 
                  ? "状況や環境の変化を入力してください（例：突然雨が降り始めた）"
                  : "キャラクターへの情報や気づきを入力してください（例：○○は××に気づく）"
              }
            />

            <div className="flex justify-end gap-2">
              <button
                className="neo-button px-4 py-2 text-sm"
                onClick={() => {
                  setInterventionContent('');
                  setSelectedCharacterId('');
                }}
              >
                クリア
              </button>
              <button
                className="neo-button px-4 py-2 text-sm"
                onClick={handleIntervention}
                disabled={!interventionContent.trim() || (interventionType === 'character' && !selectedCharacterId)}
                style={{
                  ...(interventionContent.trim() && (interventionType !== 'character' || selectedCharacterId) && {
                    background: 'var(--neo-accent)',
                    color: 'white',
                    boxShadow: 'var(--neo-shadow-floating)',
                  }),
                  opacity: !interventionContent.trim() || (interventionType === 'character' && !selectedCharacterId) ? 0.6 : 1,
                }}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                介入実行
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 