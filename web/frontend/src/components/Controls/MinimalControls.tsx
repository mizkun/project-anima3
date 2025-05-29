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
        {/* シーン選択とキャラクター表示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neo-text-secondary)' }}>
              参加キャラクター
            </label>
            <div 
              className="neo-element-subtle p-2 rounded text-xs"
              style={{ minHeight: '32px', display: 'flex', alignItems: 'center' }}
            >
              {availableCharacters.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {availableCharacters.map((character) => (
                    <span
                      key={character.id}
                      className="neo-element-subtle px-2 py-0.5 rounded text-xs"
                      style={{ 
                        background: 'var(--neo-accent)', 
                        color: 'white',
                        fontSize: '0.7rem'
                      }}
                    >
                      {character.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--neo-text-secondary)' }}>
                  シーンを選択してください
                </span>
              )}
            </div>
          </div>
        </div>

        {/* コントロールボタン */}
        <div className="flex gap-2 flex-wrap">
          {status === 'idle' ? (
            <motion.button
              className="neo-button neo-button-primary flex items-center gap-2 px-3 py-2 text-sm"
              onClick={handleStart}
              disabled={!selectedSceneId || availableCharacters.length === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                opacity: !selectedSceneId || availableCharacters.length === 0 ? 0.6 : 1,
                cursor: !selectedSceneId || availableCharacters.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <Play className="w-4 h-4" />
              開始
            </motion.button>
          ) : (
            <motion.button
              className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
              onClick={handleStop}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ color: 'var(--neo-error)' }}
            >
              <Square className="w-4 h-4" />
              停止
            </motion.button>
          )}

          {status === 'running' && (
            <motion.button
              className="neo-button neo-button-primary flex items-center gap-2 px-3 py-2 text-sm"
              onClick={handleNextTurn}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
            </motion.button>
          )}

          <motion.button
            className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
            onClick={() => setIsInterventionOpen(!isInterventionOpen)}
            disabled={status !== 'running'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              opacity: status !== 'running' ? 0.6 : 1,
              cursor: status !== 'running' ? 'not-allowed' : 'pointer',
            }}
          >
            <Sparkles className="w-4 h-4" />
            介入
          </motion.button>
        </div>

        {/* ステータス表示 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: status === 'running' ? 'var(--neo-success)' : 'var(--neo-text-secondary)'
              }}
              transition={{ duration: 0.3 }}
            />
            <span style={{ color: 'var(--neo-text-secondary)' }}>
              {status === 'running' ? '実行中' : status === 'idle' ? '待機中' : '停止中'}
            </span>
          </div>
        </div>
      </div>

      {/* 介入パネル */}
      <AnimatePresence>
        {isInterventionOpen && (
          <motion.div
            className="neo-element-pressed mt-6 p-4"
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
                    <ExpandMore className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
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
                      <ExpandMore className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                className="neo-button p-2 rounded-full"
                onClick={() => setIsInterventionOpen(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Close className="w-4 h-4" />
              </motion.button>
            </div>

            <textarea
              className="neo-input w-full p-4 resize-none"
              rows={3}
              value={interventionContent}
              onChange={(e) => setInterventionContent(e.target.value)}
              placeholder="介入内容を入力してください..."
              style={{ marginBottom: '16px' }}
            />

            <motion.button
              className={`neo-button-primary px-6 py-3 ${!interventionContent.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleIntervention}
              disabled={!interventionContent.trim() || isLoading}
              whileHover={interventionContent.trim() && !isLoading ? { scale: 1.05 } : {}}
              whileTap={interventionContent.trim() && !isLoading ? { scale: 0.95 } : {}}
            >
              <span className="font-medium">介入実行</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 