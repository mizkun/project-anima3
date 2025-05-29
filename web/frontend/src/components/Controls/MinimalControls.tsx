import React, { useState, useEffect } from 'react';
import {
  PlayArrow,
  Stop,
  SkipNext,
  ExpandMore,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulationControls } from '../../hooks/useSimulationControls';
import { useSimulationStore } from '../../stores/simulationStore';

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
    <motion.div
      className="neo-element p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* メインコントロール */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* 左側のコントロールボタン */}
        <div className="flex gap-3">
          <motion.button
            className={`neo-button-primary flex items-center gap-2 px-6 py-3 ${isRunning || !selectedSceneId || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleStart}
            disabled={isRunning || !selectedSceneId || isLoading}
            whileHover={!isRunning && selectedSceneId && !isLoading ? { scale: 1.05 } : {}}
            whileTap={!isRunning && selectedSceneId && !isLoading ? { scale: 0.95 } : {}}
          >
            <PlayArrow className="w-4 h-4" />
            <span className="font-medium">Start</span>
          </motion.button>

          <motion.button
            className={`neo-button flex items-center gap-2 px-6 py-3 ${!isRunning || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleStop}
            disabled={!isRunning || isLoading}
            whileHover={isRunning && !isLoading ? { scale: 1.05 } : {}}
            whileTap={isRunning && !isLoading ? { scale: 0.95 } : {}}
          >
            <Stop className="w-4 h-4" />
            <span className="font-medium">Stop</span>
          </motion.button>

          <motion.button
            className={`neo-button flex items-center gap-2 px-6 py-3 ${!isRunning || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNextTurn}
            disabled={!isRunning || isLoading}
            whileHover={isRunning && !isLoading ? { scale: 1.05 } : {}}
            whileTap={isRunning && !isLoading ? { scale: 0.95 } : {}}
          >
            <SkipNext className="w-4 h-4" />
            <span className="font-medium">Next Turn</span>
          </motion.button>

          <motion.button
            className={`neo-button flex items-center gap-2 px-6 py-3 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setIsInterventionOpen(!isInterventionOpen)}
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.05 } : {}}
            whileTap={!isLoading ? { scale: 0.95 } : {}}
          >
            <motion.div
              animate={{ rotate: isInterventionOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ExpandMore className="w-4 h-4" />
            </motion.div>
            <span className="font-medium">Intervention</span>
          </motion.button>
        </div>

        {/* 中央のシーン選択 */}
        <div className="flex items-center gap-3 flex-1">
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--neo-text)' }}>
            シーン
          </span>
          <div className="relative">
            <select
              className="neo-input px-4 py-2 min-w-[200px] appearance-none cursor-pointer"
              value={selectedSceneId}
              onChange={(e) => handleSceneChange(e.target.value)}
              disabled={isRunning || isLoading}
            >
              <option value="">シーンを選択してください</option>
              {Array.isArray(scenes) && scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.id}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <ExpandMore className="w-4 h-4" style={{ color: 'var(--neo-text-secondary)' }} />
            </div>
          </div>
        </div>

        {/* ステータスインジケーター */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-3 h-3 rounded-full"
            animate={{
              backgroundColor: isRunning ? 'var(--neo-success)' : 'var(--neo-text-secondary)',
              scale: isRunning ? [1, 1.2, 1] : 1
            }}
            transition={{
              scale: { repeat: isRunning ? Infinity : 0, duration: 1.5 }
            }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--neo-text-secondary)' }}>
            {status === 'running' ? 'Running' : status === 'idle' ? 'Ready' : 'Stopped'}
          </span>
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
    </motion.div>
  );
}; 