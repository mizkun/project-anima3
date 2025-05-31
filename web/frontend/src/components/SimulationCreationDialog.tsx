import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createNewSimulation, getAvailableCharacters, type SimulationCreationData } from '../api/sceneApi';

interface SimulationCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationCreated: (simulationId: string) => void;
}

const SimulationCreationDialog: React.FC<SimulationCreationDialogProps> = ({
  isOpen,
  onClose,
  onSimulationCreated,
}) => {
  const [formData, setFormData] = useState<SimulationCreationData>({
    simulationName: '',
    location: '',
    time: '',
    situation: '',
    participantCharacterIds: [], // 空の配列に変更
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);
  const [characterError, setCharacterError] = useState<string | null>(null);

  // キャラクター一覧を取得
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const characters = await getAvailableCharacters();
        setAvailableCharacters(characters);
        // デフォルトで最初の2キャラクターを選択
        if (characters.length >= 2) {
          setFormData(prev => ({
            ...prev,
            participantCharacterIds: [characters[0], characters[1]]
          }));
        }
      } catch (error) {
        setCharacterError('キャラクター一覧の取得に失敗しました');
        console.error('キャラクター取得エラー:', error);
      }
    };

    if (isOpen) {
      fetchCharacters();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.participantCharacterIds.length === 0) {
      setError('最低1つのキャラクターを選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('シミュレーション作成開始:', formData);
      const response = await createNewSimulation(formData);
      console.log('API レスポンス:', response);
      
      if (response.success && response.simulationId) {
        console.log('シミュレーション作成成功:', response.simulationId);
        onSimulationCreated(response.simulationId);
        onClose();
        // フォームをリセット
        setFormData({
          simulationName: '',
          location: '',
          time: '',
          situation: '',
          participantCharacterIds: [],
        });
      } else {
        console.error('シミュレーション作成失敗:', response);
        setError('シミュレーションの作成に失敗しました');
      }
    } catch (error) {
      console.error('シミュレーション作成エラー:', error);
      setError('シミュレーション作成中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SimulationCreationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCharacterToggle = (characterId: string) => {
    setFormData(prev => ({
      ...prev,
      participantCharacterIds: prev.participantCharacterIds.includes(characterId)
        ? prev.participantCharacterIds.filter(id => id !== characterId)
        : [...prev.participantCharacterIds, characterId]
    }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto
                   shadow-[20px_20px_40px_rgba(0,0,0,0.4),-20px_-20px_40px_rgba(255,255,255,0.05)]
                   border border-gray-700/50"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          background: 'linear-gradient(145deg, #374151, #1f2937)',
        }}
      >
        <h2 className="text-xl font-bold mb-6 text-white">🚀 新しいシミュレーションを開始</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              シミュレーション名
            </label>
            <input
              type="text"
              value={formData.simulationName}
              onChange={(e) => handleInputChange('simulationName', e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-xl border border-gray-600
                         shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                         placeholder-gray-400 transition-all duration-200"
              placeholder="例: 夕暮れの公園での会話"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              場所
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-xl border border-gray-600
                         shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                         placeholder-gray-400 transition-all duration-200"
              placeholder="例: 学校の屋上"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              時間
            </label>
            <input
              type="text"
              value={formData.time}
              onChange={(e) => handleInputChange('time', e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-xl border border-gray-600
                         shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                         placeholder-gray-400 transition-all duration-200"
              placeholder="例: 夕方6時頃"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              状況設定
            </label>
            <textarea
              value={formData.situation}
              onChange={(e) => handleInputChange('situation', e.target.value)}
              className="w-full p-3 bg-gray-700 text-white rounded-xl border border-gray-600
                         shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                         placeholder-gray-400 transition-all duration-200 h-24 resize-none"
              placeholder="例: 放課後の静かなひととき。二人は重要な話をしようとしている。"
              required
            />
          </div>

          {/* キャラクター選択セクション */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              🎭 参加キャラクター ({formData.participantCharacterIds.length}人選択中)
            </label>
            {characterError ? (
              <div className="bg-red-900/50 border border-red-700/50 rounded-xl p-3 mb-3">
                <p className="text-red-300 text-sm">❌ {characterError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                {availableCharacters.map((characterId) => {
                  const isSelected = formData.participantCharacterIds.includes(characterId);
                  return (
                    <motion.button
                      key={characterId}
                      type="button"
                      onClick={() => handleCharacterToggle(characterId)}
                      className={`p-3 rounded-xl border transition-all duration-200 text-sm font-medium
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]' 
                          : 'bg-gray-700 border-gray-600 text-gray-300 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.1)] hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]'
                        }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSelected ? '✓ ' : ''}
                      {characterId}
                    </motion.button>
                  );
                })}
              </div>
            )}
            {formData.participantCharacterIds.length === 0 && (
              <p className="text-yellow-400 text-xs mt-2">⚠️ 最低1つのキャラクターを選択してください</p>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700/50 rounded-xl p-3
                           shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]">
              <p className="text-red-300 text-sm">❌ {error}</p>
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-xl
                         shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.1)]
                         hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]
                         transition-all duration-200 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl
                         shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.1)]
                         hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.3),inset_-6px_-6px_12px_rgba(255,255,255,0.1)]
                         hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
              disabled={isLoading || formData.participantCharacterIds.length === 0}
            >
              {isLoading ? '🔄 作成中...' : '🚀 シミュレーション開始'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SimulationCreationDialog; 