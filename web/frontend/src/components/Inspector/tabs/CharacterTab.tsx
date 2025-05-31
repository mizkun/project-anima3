import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Code,
  User,
  Brain,
  Archive,
  Target,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Users,
  X,
  RotateCcw,
} from 'lucide-react';

interface CharacterData {
  character_id: string;
  name?: string;
  age?: number;
  occupation?: string;
  base_personality?: string;
  speech_pattern?: string;
  appearance?: string;
  experiences?: Array<{ event: string; importance: number }>;
  goals?: Array<{ goal: string; importance: number }>;
  memories?: Array<{ memory: string; scene_id_of_memory: string; related_character_ids: string[] }>;
}

interface Character {
  character_id: string;
  immutablePath: string;
  longTermPath: string;
  immutableContent?: string;
  longTermContent?: string;
  data: CharacterData;
}

// YAMLコンテンツをパースする関数
const parseCharacterYaml = (immutableContent: string, longTermContent: string): CharacterData => {
  const data: CharacterData = { character_id: '' };
  
  // immutable.yamlをパース
  if (immutableContent) {
    const immutableLines = immutableContent.split('\n');
    for (const line of immutableLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('character_id:')) {
        data.character_id = trimmed.replace('character_id:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('name:')) {
        data.name = trimmed.replace('name:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('age:')) {
        data.age = parseInt(trimmed.replace('age:', '').trim());
      } else if (trimmed.startsWith('occupation:')) {
        data.occupation = trimmed.replace('occupation:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('base_personality:')) {
        data.base_personality = trimmed.replace('base_personality:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('speech_pattern:')) {
        data.speech_pattern = trimmed.replace('speech_pattern:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('appearance:')) {
        data.appearance = trimmed.replace('appearance:', '').trim().replace(/['"]/g, '');
      }
    }
  }
  
  // long_term.yamlをパース（改善版）
  if (longTermContent) {
    data.experiences = [];
    data.goals = [];
    data.memories = [];
    
    const longTermLines = longTermContent.split('\n');
    let currentSection = '';
    let currentItem: any = {};
    
    for (const line of longTermLines) {
      const trimmed = line.trim();
      if (trimmed === 'experiences:') {
        currentSection = 'experiences';
      } else if (trimmed === 'goals:') {
        currentSection = 'goals';
      } else if (trimmed === 'memories:') {
        currentSection = 'memories';
      } else if (trimmed.startsWith('- event:')) {
        if (currentItem.event) {
          data.experiences?.push(currentItem);
        }
        currentItem = { event: trimmed.replace('- event:', '').trim(), importance: 5 };
      } else if (trimmed.startsWith('- goal:')) {
        if (currentItem.goal) {
          data.goals?.push(currentItem);
        }
        currentItem = { goal: trimmed.replace('- goal:', '').trim(), importance: 5 };
      } else if (trimmed.startsWith('- memory:')) {
        if (currentItem.memory) {
          data.memories?.push(currentItem);
        }
        currentItem = { memory: trimmed.replace('- memory:', '').trim(), scene_id_of_memory: '', related_character_ids: [] };
      } else if (trimmed.startsWith('importance:')) {
        currentItem.importance = parseInt(trimmed.replace('importance:', '').trim()) || 5;
      } else if (trimmed.startsWith('scene_id_of_memory:')) {
        currentItem.scene_id_of_memory = trimmed.replace('scene_id_of_memory:', '').trim();
      } else if (trimmed.startsWith('related_character_ids:')) {
        // related_character_idsの処理を改善
        const value = trimmed.replace('related_character_ids:', '').trim();
        if (value === '[]' || value === '') {
          currentItem.related_character_ids = [];
        } else {
          currentItem.related_character_ids = [];
        }
      } else if (trimmed.startsWith('- ') && currentSection === 'memories' && currentItem.related_character_ids !== undefined) {
        // related_character_idsの配列要素
        const charId = trimmed.replace('- ', '').trim().replace(/['"]/g, '');
        if (charId) {
          currentItem.related_character_ids.push(charId);
        }
      }
    }
    
    // 最後のアイテムを追加
    if (currentSection === 'experiences' && currentItem.event) {
      data.experiences.push(currentItem);
    } else if (currentSection === 'goals' && currentItem.goal) {
      data.goals.push(currentItem);
    } else if (currentSection === 'memories' && currentItem.memory) {
      data.memories.push(currentItem);
    }
  }
  
  return data;
};

// CharacterDataからYAMLコンテンツを生成する関数
const generateImmutableYaml = (data: CharacterData): string => {
  let yaml = '';
  yaml += `character_id: "${data.character_id}"\n`;
  if (data.name) yaml += `name: "${data.name}"\n`;
  if (data.age) yaml += `age: ${data.age}\n`;
  if (data.occupation) yaml += `occupation: "${data.occupation}"\n`;
  if (data.base_personality) yaml += `base_personality: "${data.base_personality}"\n`;
  if (data.speech_pattern) yaml += `speech_pattern: "${data.speech_pattern}"\n`;
  if (data.appearance) yaml += `appearance: "${data.appearance}"\n`;
  return yaml;
};

const generateLongTermYaml = (data: CharacterData): string => {
  let yaml = `character_id: ${data.character_id}\n`;
  
  yaml += 'experiences:\n';
  data.experiences?.forEach(exp => {
    yaml += `- event: ${exp.event}\n`;
    yaml += `  importance: ${exp.importance}\n`;
  });
  
  yaml += 'goals:\n';
  data.goals?.forEach(goal => {
    yaml += `- goal: ${goal.goal}\n`;
    yaml += `  importance: ${goal.importance}\n`;
  });
  
  yaml += 'memories:\n';
  data.memories?.forEach(memory => {
    yaml += `- memory: ${memory.memory}\n`;
    yaml += `  scene_id_of_memory: ${memory.scene_id_of_memory}\n`;
    yaml += `  related_character_ids:\n`;
    if (memory.related_character_ids && memory.related_character_ids.length > 0) {
      memory.related_character_ids.forEach(id => {
        yaml += `  - ${id}\n`;
      });
    } else {
      yaml += `  []\n`;
    }
  });
  
  return yaml;
};

export const CharacterTab: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [editData, setEditData] = useState<CharacterData>({ character_id: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showYamlDialog, setShowYamlDialog] = useState(false);
  const [yamlContent, setYamlContent] = useState<string>('');
  const [yamlType, setYamlType] = useState<'immutable' | 'longterm'>('immutable');
  const [activeTab, setActiveTab] = useState(0);
  const [characterEditTab, setCharacterEditTab] = useState<'view' | 'edit'>('view');

  // 選択されたキャラクターのデータを取得
  const selectedCharacterData = characters.find(c => c.character_id === selectedCharacter);

  // キャラクター一覧を取得
  const fetchCharacters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/files?directory=data/characters');
      const data = await response.json();
      
      if (response.ok && data.files) {
        // キャラクターごとにグループ化
        const characterMap = new Map<string, Character>();
        
        data.files.forEach((file: any) => {
          const pathParts = file.path.split('/');
          if (pathParts.length >= 3) {
            const characterId = pathParts[2];
            const fileName = pathParts[3];
            
            if (!characterMap.has(characterId)) {
              characterMap.set(characterId, {
                character_id: characterId,
                immutablePath: '',
                longTermPath: '',
                data: { character_id: characterId }
              });
            }
            
            const character = characterMap.get(characterId)!;
            if (fileName === 'immutable.yaml') {
              character.immutablePath = file.path;
              character.immutableContent = file.content;
            } else if (fileName === 'long_term.yaml') {
              character.longTermPath = file.path;
              character.longTermContent = file.content;
            }
          }
        });
        
        // データをパースして設定
        const characterList = Array.from(characterMap.values()).map(char => ({
          ...char,
          data: parseCharacterYaml(char.immutableContent || '', char.longTermContent || '')
        }));
        
        setCharacters(characterList);
      } else {
        throw new Error(data.message || 'キャラクターファイルの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 初期化
  useEffect(() => {
    fetchCharacters();
  }, []);

  // ファイル選択ハンドラー
  const handleFileSelect = (filePath: string) => {
    setSelectedCharacter(filePath);
  };

  // キャラクター選択ハンドラー
  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
    const character = characters.find(c => c.character_id === characterId);
    if (character) {
      setEditData(character.data);
    }
    setIsEditing(false);
    setActiveTab(0);
  };

  // 編集開始ハンドラー
  const handleStartEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  // 編集キャンセルハンドラー
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    if (selectedCharacter) {
      const character = characters.find(c => c.character_id === selectedCharacter);
      if (character) {
        setEditData(character.data);
      }
    }
  };

  // キャラクターデータを保存
  const saveCharacterData = async () => {
    if (!selectedCharacter) return;
    
    const character = characters.find(c => c.character_id === selectedCharacter);
    if (!character) return;
    
    setIsSaving(true);
    setError(null);
    try {
      // immutable.yamlを保存
      const immutableYaml = generateImmutableYaml(editData);
      const immutableResponse = await fetch(`/api/files/${encodeURIComponent(character.immutablePath)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: immutableYaml }),
      });
      
      if (!immutableResponse.ok) {
        throw new Error('immutable.yamlの保存に失敗しました');
      }

      // long_term.yamlを保存
      const longTermYaml = generateLongTermYaml(editData);
      const longTermResponse = await fetch(`/api/files/${encodeURIComponent(character.longTermPath)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: longTermYaml }),
      });
      
      if (!longTermResponse.ok) {
        throw new Error('long_term.yamlの保存に失敗しました');
      }

      setIsEditing(false);
      await fetchCharacters();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 新規キャラクター作成
  const createNewCharacter = async () => {
    const characterId = prompt('新しいキャラクターIDを入力してください:');
    if (!characterId) return;
    
    const templateData: CharacterData = {
      character_id: characterId,
      name: 'キャラクター名',
      age: 16,
      occupation: '職業・役職',
      base_personality: '基本的な性格を記述してください',
      speech_pattern: '話し方の特徴を記述してください',
      appearance: '外見の特徴を記述してください',
      experiences: [
        { event: '重要な経験1', importance: 8 },
        { event: '重要な経験2', importance: 6 }
      ],
      goals: [
        { goal: '目標1', importance: 9 },
        { goal: '目標2', importance: 7 }
      ],
      memories: [
        { memory: '重要な記憶1', scene_id_of_memory: 'scene_001', related_character_ids: [] }
      ]
    };
    
    const immutablePath = `data/characters/${characterId}/immutable.yaml`;
    const longTermPath = `data/characters/${characterId}/long_term.yaml`;
    
    setIsSaving(true);
    setError(null);
    try {
      // immutable.yamlを作成
      const immutableYaml = generateImmutableYaml(templateData);
      const immutableResponse = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          path: immutablePath,
          content: immutableYaml 
        }),
      });
      
      if (!immutableResponse.ok) {
        throw new Error('immutable.yamlの作成に失敗しました');
      }

      // long_term.yamlを作成
      const longTermYaml = generateLongTermYaml(templateData);
      const longTermResponse = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          path: longTermPath,
          content: longTermYaml 
        }),
      });
      
      if (!longTermResponse.ok) {
        throw new Error('long_term.yamlの作成に失敗しました');
      }

      await fetchCharacters();
      setSelectedCharacter(characterId);
      setEditData(templateData);
      setIsEditing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 経験追加
  const handleAddExperience = () => {
    const newExperience = { event: '新しい経験', importance: 5 };
    setEditData(prev => ({
      ...prev,
      experiences: [...(prev.experiences || []), newExperience]
    }));
  };

  // 目標追加
  const handleAddGoal = () => {
    const newGoal = { goal: '新しい目標', importance: 5 };
    setEditData(prev => ({
      ...prev,
      goals: [...(prev.goals || []), newGoal]
    }));
  };

  // 記憶追加
  const handleAddMemory = () => {
    const newMemory = { memory: '新しい記憶', scene_id_of_memory: '', related_character_ids: [] };
    setEditData(prev => ({
      ...prev,
      memories: [...(prev.memories || []), newMemory]
    }));
  };

  // YAML表示
  const handleShowYaml = (type: 'immutable' | 'longterm') => {
    setYamlType(type);
    if (type === 'immutable') {
      setYamlContent(generateImmutableYaml(editData));
    } else {
      setYamlContent(generateLongTermYaml(editData));
    }
    setShowYamlDialog(true);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ color: 'var(--neo-text)' }}>
      {/* ヘッダー */}
      <div className="flex-shrink-0 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--neo-text)' }}>
            キャラクター選択
          </h2>
          <div className="flex gap-2">
            <motion.button
              className="neo-button p-2"
              onClick={fetchCharacters}
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
            <motion.button
              className="neo-button p-2"
              onClick={createNewCharacter}
              disabled={isSaving}
              style={{
                background: 'var(--neo-accent)',
                color: 'white',
                boxShadow: 'var(--neo-shadow-floating)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="新規作成"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* キャラクターセレクタ */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <select
                className="neo-input w-full"
                value={selectedCharacter || ''}
                onChange={(e) => handleCharacterSelect(e.target.value)}
                disabled={isLoading}
              >
                <option value="">キャラクターを選択...</option>
                {characters.map((character) => (
                  <option key={character.character_id} value={character.character_id}>
                    {character.data.name || character.character_id} {character.data.occupation ? `(${character.data.occupation})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 編集エリア */}
        <div className="flex-1 overflow-hidden">
          {selectedCharacter ? (
            <div className="h-full flex flex-col">
              {/* 編集ヘッダー */}
              <div className="flex-shrink-0 p-4" style={{ borderColor: 'var(--neo-text-secondary)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium">{editData.name || editData.character_id}</h4>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <motion.button
                          className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                          onClick={handleCancelEdit}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          title="キャンセル"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                          onClick={saveCharacterData}
                          disabled={isSaving}
                          style={{
                            background: 'var(--neo-accent)',
                            color: 'white',
                            boxShadow: 'var(--neo-shadow-floating)',
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          title="保存"
                        >
                          {isSaving ? (
                            <motion.div
                              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                          onClick={() => handleShowYaml('immutable')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          title="YAML表示"
                        >
                          <Code className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                          onClick={handleStartEdit}
                          style={{
                            background: 'var(--neo-accent)',
                            color: 'white',
                            boxShadow: 'var(--neo-shadow-floating)',
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          title="編集"
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* タブ切り替え */}
              <div className="flex-shrink-0" style={{ borderColor: 'var(--neo-text-secondary)' }}>
                <div className="flex">
                  <motion.button
                    className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                      activeTab === 0 
                        ? 'border-blue-500 text-blue-500' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(0)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User className="w-4 h-4 inline mr-1" />
                    基本情報
                  </motion.button>
                  <motion.button
                    className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                      activeTab === 1 
                        ? 'border-blue-500 text-blue-500' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab(1)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Brain className="w-4 h-4 inline mr-1" />
                    記憶・経験
                  </motion.button>
                </div>
              </div>

              {/* 編集フォーム */}
              <div className="flex-1 overflow-y-auto neo-scrollbar p-3">
                <AnimatePresence mode="wait">
                  {activeTab === 0 && (
                    <motion.div
                      key="basic"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* 基本情報フォーム */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">キャラクターID</label>
                            {isEditing ? (
                              <input
                                type="text"
                                className="neo-input w-full text-sm py-2"
                                value={editData.character_id || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, character_id: e.target.value }))}
                                placeholder="character_001"
                              />
                            ) : (
                              <div className="neo-element-subtle p-2 rounded-lg text-sm">
                                {editData.character_id || '未設定'}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium mb-1">名前</label>
                            {isEditing ? (
                              <input
                                type="text"
                                className="neo-input w-full text-sm py-2"
                                value={editData.name || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="キャラクター名"
                              />
                            ) : (
                              <div className="neo-element-subtle p-2 rounded-lg text-sm">
                                {editData.name || '未設定'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">年齢</label>
                            {isEditing ? (
                              <input
                                type="number"
                                className="neo-input w-full text-sm py-2"
                                value={editData.age || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                                placeholder="16"
                              />
                            ) : (
                              <div className="neo-element-subtle p-2 rounded-lg text-sm">
                                {editData.age || '未設定'}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium mb-1">職業・役職</label>
                            {isEditing ? (
                              <input
                                type="text"
                                className="neo-input w-full text-sm py-2"
                                value={editData.occupation || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, occupation: e.target.value }))}
                                placeholder="高校生"
                              />
                            ) : (
                              <div className="neo-element-subtle p-2 rounded-lg text-sm">
                                {editData.occupation || '未設定'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">基本性格</label>
                          {isEditing ? (
                            <textarea
                              className="neo-input w-full text-sm py-2"
                              rows={3}
                              value={editData.base_personality || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, base_personality: e.target.value }))}
                              placeholder="キャラクターの基本的な性格を説明してください..."
                            />
                          ) : (
                            <div className="neo-element-subtle p-2 rounded-lg text-sm">
                              {editData.base_personality || '未設定'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">話し方</label>
                          {isEditing ? (
                            <textarea
                              className="neo-input w-full text-sm py-2"
                              rows={2}
                              value={editData.speech_pattern || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, speech_pattern: e.target.value }))}
                              placeholder="話し方の特徴を説明してください..."
                            />
                          ) : (
                            <div className="neo-element-subtle p-2 rounded-lg text-sm">
                              {editData.speech_pattern || '未設定'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium mb-1">外見</label>
                          {isEditing ? (
                            <textarea
                              className="neo-input w-full text-sm py-2"
                              rows={3}
                              value={editData.appearance || ''}
                              onChange={(e) => setEditData(prev => ({ ...prev, appearance: e.target.value }))}
                              placeholder="外見の特徴を説明してください..."
                            />
                          ) : (
                            <div className="neo-element-subtle p-2 rounded-lg text-sm">
                              {editData.appearance || '未設定'}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 1 && (
                    <motion.div
                      key="memory"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* 経験セクション */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium flex items-center gap-1">
                            <Archive className="w-3 h-3" />
                            経験
                          </h5>
                          {isEditing && (
                            <motion.button
                              className="neo-button flex items-center gap-1 px-2 py-1 text-xs"
                              onClick={handleAddExperience}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Plus className="w-3 h-3" />
                              追加
                            </motion.button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {(editData.experiences || []).map((exp, index) => (
                            <div key={index} className="neo-element-subtle p-2 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      className="neo-input w-full mb-1 text-sm py-1"
                                      value={exp.event}
                                      onChange={(e) => {
                                        const newExperiences = [...(editData.experiences || [])];
                                        newExperiences[index] = { ...exp, event: e.target.value };
                                        setEditData(prev => ({ ...prev, experiences: newExperiences }));
                                      }}
                                      placeholder="経験内容"
                                    />
                                  ) : (
                                    <div className="text-xs mb-1">{exp.event}</div>
                                  )}
                                  <div className="text-xs" style={{ color: 'var(--neo-text-secondary)' }}>
                                    重要度: {exp.importance}/10
                                  </div>
                                </div>
                                {isEditing && (
                                  <motion.button
                                    className="text-red-500 hover:text-red-700 p-1"
                                    onClick={() => {
                                      const newExperiences = (editData.experiences || []).filter((_, i) => i !== index);
                                      setEditData(prev => ({ ...prev, experiences: newExperiences }));
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 目標セクション */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            目標
                          </h5>
                          {isEditing && (
                            <motion.button
                              className="neo-button flex items-center gap-1 px-2 py-1 text-xs"
                              onClick={handleAddGoal}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Plus className="w-3 h-3" />
                              追加
                            </motion.button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {(editData.goals || []).map((goal, index) => (
                            <div key={index} className="neo-element-subtle p-2 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      className="neo-input w-full mb-1 text-sm py-1"
                                      value={goal.goal}
                                      onChange={(e) => {
                                        const newGoals = [...(editData.goals || [])];
                                        newGoals[index] = { ...goal, goal: e.target.value };
                                        setEditData(prev => ({ ...prev, goals: newGoals }));
                                      }}
                                      placeholder="目標内容"
                                    />
                                  ) : (
                                    <div className="text-xs mb-1">{goal.goal}</div>
                                  )}
                                  <div className="text-xs" style={{ color: 'var(--neo-text-secondary)' }}>
                                    重要度: {goal.importance}/10
                                  </div>
                                </div>
                                {isEditing && (
                                  <motion.button
                                    className="text-red-500 hover:text-red-700 p-1"
                                    onClick={() => {
                                      const newGoals = (editData.goals || []).filter((_, i) => i !== index);
                                      setEditData(prev => ({ ...prev, goals: newGoals }));
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 記憶セクション */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            記憶
                          </h5>
                          {isEditing && (
                            <motion.button
                              className="neo-button flex items-center gap-1 px-2 py-1 text-xs"
                              onClick={handleAddMemory}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Plus className="w-3 h-3" />
                              追加
                            </motion.button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {(editData.memories || []).map((memory, index) => (
                            <div key={index} className="neo-element-subtle p-2 rounded-lg">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {isEditing ? (
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        className="neo-input w-full text-sm py-1"
                                        value={memory.memory}
                                        onChange={(e) => {
                                          const newMemories = [...(editData.memories || [])];
                                          newMemories[index] = { ...memory, memory: e.target.value };
                                          setEditData(prev => ({ ...prev, memories: newMemories }));
                                        }}
                                        placeholder="記憶内容"
                                      />
                                      <input
                                        type="text"
                                        className="neo-input w-full text-sm py-1"
                                        value={memory.scene_id_of_memory}
                                        onChange={(e) => {
                                          const newMemories = [...(editData.memories || [])];
                                          newMemories[index] = { ...memory, scene_id_of_memory: e.target.value };
                                          setEditData(prev => ({ ...prev, memories: newMemories }));
                                        }}
                                        placeholder="シーンID"
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-xs mb-1">{memory.memory}</div>
                                      <div className="text-xs" style={{ color: 'var(--neo-text-secondary)' }}>
                                        シーン: {memory.scene_id_of_memory}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {isEditing && (
                                  <motion.button
                                    className="text-red-500 hover:text-red-700 p-1"
                                    onClick={() => {
                                      const newMemories = (editData.memories || []).filter((_, i) => i !== index);
                                      setEditData(prev => ({ ...prev, memories: newMemories }));
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center" style={{ color: 'var(--neo-text-secondary)' }}>
                <User className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm">キャラクターを選択してください</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YAML表示ダイアログ */}
      <AnimatePresence>
        {showYamlDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowYamlDialog(false)}
          >
            <motion.div
              className="neo-card-floating p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{yamlType === 'immutable' ? 'Immutable' : 'Long-term'} YAML</h3>
                <motion.button
                  className="neo-button p-2 rounded-full"
                  onClick={() => setShowYamlDialog(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
              </div>
              <div className="neo-element-pressed p-4 rounded-lg overflow-y-auto max-h-96">
                <pre className="text-sm font-mono whitespace-pre-wrap" style={{ color: 'var(--neo-text)' }}>
                  {yamlContent}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 