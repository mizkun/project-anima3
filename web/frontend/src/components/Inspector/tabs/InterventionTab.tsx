import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Brain,
  Zap,
  UserPlus,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';

interface InterventionType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  placeholder: string;
  backendType: string; // バックエンドで期待される介入タイプ
}

interface InterventionTabProps {
  onIntervention?: (type: string, content: string) => void;
  disabled?: boolean;
}

const INTERVENTION_TYPES: InterventionType[] = [
  {
    id: 'global_intervention',
    name: '全体向け介入',
    description: '状況や環境の変化を追加',
    icon: <Zap className="w-4 h-4" />,
    placeholder: '例: 突然雨が降り始めた、新しいキャラクターが現れた',
    backendType: 'update_situation'
  },
  {
    id: 'character_intervention',
    name: 'キャラクター向け介入',
    description: '特定キャラクターに情報や気づきを与える',
    icon: <Brain className="w-4 h-4" />,
    placeholder: '例: 燐子は芽依の本当の気持ちに気づく',
    backendType: 'give_revelation'
  }
];

export const InterventionTab: React.FC<InterventionTabProps> = ({
  onIntervention,
  disabled = false
}) => {
  const [selectedType, setSelectedType] = useState<string>(INTERVENTION_TYPES[0].id);
  const [content, setContent] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string>('stopped');

  const selectedTypeData = INTERVENTION_TYPES.find(type => type.id === selectedType);
  const isCharacterIntervention = selectedType === 'character_intervention';
  const needsCharacterSelection = isCharacterIntervention;

  // シミュレーション状態を初回のみ取得
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/simulation/status');
        const data = await response.json();
        setSimulationStatus(data.status);
      } catch (error) {
        console.error('ステータス取得エラー:', error);
        setSimulationStatus('stopped');
      }
    };

    checkStatus();
  }, []);

  // 利用可能キャラクターの取得
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/files?directory=data/characters');
        const data = await response.json();
        if (data.success && data.files) {
          const characters = data.files
            .filter((file: any) => file.name.endsWith('.yaml'))
            .map((file: any) => file.name.replace('.yaml', ''));
          setAvailableCharacters(characters);
          if (characters.length > 0 && !selectedCharacter) {
            setSelectedCharacter(characters[0]);
          }
        }
      } catch (error) {
        console.error('キャラクター一覧の取得に失敗しました:', error);
      }
    };

    fetchCharacters();
  }, [selectedCharacter]);

  const isSimulationRunning = simulationStatus === 'running' || simulationStatus === 'waiting_for_intervention' || simulationStatus === 'idle';

  const handleSubmit = async () => {
    console.log('=== 介入送信開始 ===');
    console.log('シミュレーション状態:', simulationStatus);
    console.log('選択されたタイプ:', selectedType);
    console.log('入力内容:', content);
    console.log('選択されたキャラクター:', selectedCharacter);
    console.log('キャラクター選択が必要?:', needsCharacterSelection);
    
    if (!content.trim()) {
      setError('介入内容を入力してください');
      return;
    }

    if (needsCharacterSelection && !selectedCharacter) {
      setError('対象キャラクターを選択してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedTypeData = INTERVENTION_TYPES.find(type => type.id === selectedType);
      const interventionData = {
        type: selectedTypeData?.backendType || 'update_situation',
        content: content.trim(),
        ...(needsCharacterSelection && { target_character: selectedCharacter })
      };

      console.log('送信するデータ:', interventionData);

      const response = await fetch('/api/simulation/intervention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interventionData),
      });

      console.log('レスポンス状態:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('レスポンス内容:', result);

      if (!response.ok || result.success === false) {
        throw new Error(result.message || '介入の実行に失敗しました');
      }

      console.log('介入送信成功!');
      setSuccess('介入を実行しました');
      setContent('');
      
      // タイムラインをリフレッシュ
      try {
        console.log('タイムラインをリフレッシュ中...');
        const statusResponse = await fetch('/api/simulation/status');
        const statusData = await statusResponse.json();
        
        if (statusResponse.ok && statusData.timeline) {
          const store = useSimulationStore.getState();
          store.updateTimeline(statusData.timeline);
          console.log('タイムラインリフレッシュ完了:', statusData.timeline.length, '件のエントリ');
        }
      } catch (refreshError) {
        console.error('タイムラインリフレッシュエラー:', refreshError);
      }
      
      // 親コンポーネントのコールバックを呼び出し
      if (onIntervention) {
        onIntervention(selectedTypeData?.backendType || 'update_situation', content.trim());
      }

      // 成功メッセージを3秒後に消去
      setTimeout(() => setSuccess(null), 3000);

    } catch (error: any) {
      console.error('=== 介入エラー ===', error);
      setError(error.message || '介入の実行に失敗しました');
    } finally {
      setIsSubmitting(false);
      console.log('=== 介入送信終了 ===');
    }
  };

  const canSubmit = content.trim() && !isSubmitting && isSimulationRunning && (!needsCharacterSelection || selectedCharacter);

  return (
    <div className="h-full flex flex-col p-4" style={{ color: 'var(--neo-text)' }}>
      <div className="flex-1 overflow-y-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--neo-text)' }}>
            ユーザー介入
          </h3>

          {/* シミュレーション状態の表示 */}
          {!isSimulationRunning && (
            <div className="neo-card-subtle p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: 'var(--neo-warning)' }} />
                <div>
                  <div className="font-medium text-sm mb-1" style={{ color: 'var(--neo-warning)' }}>
                    シミュレーション停止中
                  </div>
                  <div className="text-sm" style={{ color: 'var(--neo-text-secondary)' }}>
                    介入を行うには、まずシミュレーションを開始してください。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 介入タイプ選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neo-text)' }}>
              介入タイプ
            </label>
            <div className="space-y-2">
              {INTERVENTION_TYPES.map((type) => (
                <motion.button
                  key={type.id}
                  className={`w-full neo-card-subtle text-left p-3 rounded-lg transition-all ${
                    selectedType === type.id ? 'ring-2 ring-blue-400' : ''
                  }`}
                  onClick={() => setSelectedType(type.id)}
                  disabled={disabled || !isSimulationRunning}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: selectedType === type.id ? 'var(--neo-accent)20' : 'var(--neo-element)',
                    opacity: disabled || !isSimulationRunning ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="neo-element p-2 rounded"
                      style={{ background: 'var(--neo-accent)', color: 'white' }}
                    >
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm" style={{ color: 'var(--neo-text)' }}>
                        {type.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--neo-text-secondary)' }}>
                        {type.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* キャラクター選択（キャラクター向け介入の場合） */}
          {needsCharacterSelection && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neo-text)' }}>
                対象キャラクター
              </label>
              <div className="neo-input-container">
                <select
                  className="neo-input w-full"
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  disabled={disabled || !isSimulationRunning}
                  style={{
                    background: 'var(--neo-element)',
                    color: 'var(--neo-text)',
                    border: 'none',
                    outline: 'none',
                  }}
                >
                  <option value="">キャラクターを選択</option>
                  {availableCharacters.map((character) => (
                    <option key={character} value={character}>
                      {character}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 介入内容入力 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--neo-text)' }}>
              介入内容
            </label>
            <textarea
              className="neo-input w-full resize-none"
              rows={4}
              placeholder={selectedTypeData?.placeholder || '介入内容を入力してください'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={disabled || !isSimulationRunning}
              style={{
                background: 'var(--neo-element)',
                color: 'var(--neo-text)',
                border: 'none',
                outline: 'none',
              }}
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <motion.div 
              className="neo-card-subtle p-3 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'var(--neo-error)' }} />
                <div className="text-sm" style={{ color: 'var(--neo-error)' }}>
                  {error}
                </div>
              </div>
            </motion.div>
          )}

          {/* 成功メッセージ */}
          {success && (
            <motion.div 
              className="neo-card-subtle p-3 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5" style={{ color: 'var(--neo-success)' }} />
                <div className="text-sm" style={{ color: 'var(--neo-success)' }}>
                  {success}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* 送信ボタン */}
      <div className="pt-4">
        <motion.button
          className={`neo-button w-full flex items-center justify-center gap-2 py-3 ${
            canSubmit ? 'neo-button-primary' : ''
          }`}
          onClick={handleSubmit}
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : undefined}
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
          style={{
            opacity: canSubmit ? 1 : 0.6,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmitting ? (
            <motion.div
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isSubmitting ? '送信中...' : '介入を実行'}
        </motion.button>
      </div>
    </div>
  );
}; 