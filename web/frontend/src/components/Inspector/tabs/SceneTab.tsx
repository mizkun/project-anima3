import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit,
  Save,
  RefreshCw,
  Plus,
  MapPin,
  Clock,
  Users,
  Trash2,
  Code,
  FileText,
  Search,
} from 'lucide-react';

interface SceneFile {
  name: string;
  path: string;
  content?: string;
  last_modified?: string;
  // パースされたYAMLデータ
  scene_id?: string;
  location?: string;
  time?: string;
  situation?: string;
  participant_character_ids?: string[];
}

interface Character {
  character_id: string;
  name?: string;
}

// YAMLコンテンツをパースする簡易関数
const parseYamlContent = (content: string): Partial<SceneFile> => {
  try {
    const lines = content.split('\n');
    const parsed: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('scene_id:')) {
        parsed.scene_id = trimmed.replace('scene_id:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('location:')) {
        parsed.location = trimmed.replace('location:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('time:')) {
        parsed.time = trimmed.replace('time:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('situation:')) {
        parsed.situation = trimmed.replace('situation:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('- "') && parsed.participant_character_ids) {
        parsed.participant_character_ids.push(trimmed.replace(/- ['"]/g, '').replace(/['"]/g, ''));
      } else if (trimmed === 'participant_character_ids:') {
        parsed.participant_character_ids = [];
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('YAML parsing error:', error);
    return {};
  }
};

// パースされたデータからYAMLコンテンツを生成する関数
const generateYamlContent = (sceneData: Partial<SceneFile>): string => {
  let yaml = '';
  
  if (sceneData.scene_id) {
    yaml += `scene_id: "${sceneData.scene_id}"\n`;
  }
  if (sceneData.location) {
    yaml += `location: "${sceneData.location}"\n`;
  }
  if (sceneData.time) {
    yaml += `time: "${sceneData.time}"\n`;
  }
  if (sceneData.situation) {
    yaml += `situation: "${sceneData.situation}"\n`;
  }
  if (sceneData.participant_character_ids && sceneData.participant_character_ids.length > 0) {
    yaml += 'participant_character_ids:\n';
    sceneData.participant_character_ids.forEach(id => {
      yaml += `  - "${id}"\n`;
    });
  }
  
  return yaml;
};

export const SceneTab: React.FC = () => {
  const [sceneFiles, setSceneFiles] = useState<SceneFile[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showYamlDialog, setShowYamlDialog] = useState(false);
  const [yamlContent, setYamlContent] = useState<string>('');
  
  // 編集用の状態
  const [editData, setEditData] = useState<Partial<SceneFile>>({});
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');

  // シーンファイル一覧を取得
  const fetchSceneFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/files?directory=data/scenes');
      const data = await response.json();
      
      if (response.ok && data.files) {
        // APIレスポンスからファイル情報を抽出し、YAMLコンテンツをパース
        const files = data.files.map((file: any) => {
          const parsedData = file.content ? parseYamlContent(file.content) : {};
          return {
            name: file.name,
            path: file.path,
            content: file.content,
            last_modified: file.last_modified,
            ...parsedData,
          };
        });
        setSceneFiles(files);
      } else {
        throw new Error(data.message || 'シーンファイルの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // キャラクター一覧を取得
  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/files?directory=data/characters');
      const data = await response.json();
      
      if (response.ok && data.files) {
        // キャラクターごとにグループ化
        const characterMap = new Map<string, Character>();
        
        data.files.forEach((file: any) => {
          const pathParts = file.path.split('/');
          if (pathParts.length >= 3 && pathParts[3] === 'immutable.yaml') {
            const characterId = pathParts[2];
            
            // immutable.yamlからキャラクター名を抽出
            let characterName = characterId;
            if (file.content) {
              const nameMatch = file.content.match(/name:\s*["']?([^"'\n]+)["']?/);
              if (nameMatch) {
                characterName = nameMatch[1].trim();
              }
            }
            
            characterMap.set(characterId, {
              character_id: characterId,
              name: characterName
            });
          }
        });
        
        setCharacters(Array.from(characterMap.values()));
      }
    } catch (err) {
      console.error('キャラクター一覧の取得に失敗しました:', err);
    }
  };

  // ファイル内容を保存
  const saveSceneData = async () => {
    if (!selectedFile) return;
    
    setIsSaving(true);
    setError(null);
    try {
      const yamlContent = generateYamlContent(editData);
      
      const response = await fetch(`/api/files/${selectedFile}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: yamlContent,
      });

      if (response.ok) {
        setIsEditing(false);
        await fetchSceneFiles(); // ファイル一覧を再取得
      } else {
        const data = await response.json();
        throw new Error(data.message || '保存に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 新しいファイルを作成
  const createNewFile = async () => {
    const fileName = prompt('新しいシーンファイル名を入力してください（.yamlは自動で付加されます）:');
    if (!fileName) return;
    
    const fullFileName = fileName.endsWith('.yaml') ? fileName : `${fileName}.yaml`;
    
    setIsSaving(true);
    setError(null);
    try {
      const defaultContent = `scene_id: "${fileName.replace('.yaml', '')}"
location: ""
time: ""
situation: ""
participant_character_ids: []
`;

      const response = await fetch(`/api/files/data/scenes/${fullFileName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: defaultContent,
      });

      if (response.ok) {
        await fetchSceneFiles();
        setSelectedFile(`data/scenes/${fullFileName}`);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'ファイル作成に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイル作成中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ファイル選択時の処理
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    setIsEditing(false);
    setError(null);
    
    const file = sceneFiles.find(f => f.path === filePath);
    if (file) {
      setEditData({
        scene_id: file.scene_id,
        location: file.location,
        time: file.time,
        situation: file.situation,
        participant_character_ids: file.participant_character_ids ? [...file.participant_character_ids] : [],
      });
    }
  };

  // 編集開始
  const handleStartEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    
    // 元のデータに戻す
    const file = sceneFiles.find(f => f.path === selectedFile);
    if (file) {
      setEditData({
        scene_id: file.scene_id,
        location: file.location,
        time: file.time,
        situation: file.situation,
        participant_character_ids: file.participant_character_ids ? [...file.participant_character_ids] : [],
      });
    }
  };

  // キャラクター追加
  const handleAddCharacter = () => {
    if (!selectedCharacterId.trim()) return;
    
    const currentIds = editData.participant_character_ids || [];
    if (!currentIds.includes(selectedCharacterId)) {
      setEditData({
        ...editData,
        participant_character_ids: [...currentIds, selectedCharacterId],
      });
    }
    setSelectedCharacterId('');
  };

  // キャラクター削除
  const handleRemoveCharacter = (index: number) => {
    const currentIds = editData.participant_character_ids || [];
    const newIds = currentIds.filter((_, i) => i !== index);
    setEditData({
      ...editData,
      participant_character_ids: newIds,
    });
  };

  // YAML表示
  const handleShowYaml = () => {
    const content = generateYamlContent(editData);
    setYamlContent(content);
    setShowYamlDialog(true);
  };

  // 初期化
  useEffect(() => {
    fetchSceneFiles();
    fetchCharacters();
  }, []);

  const selectedFileData = sceneFiles.find(f => f.path === selectedFile);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ color: 'var(--neo-text)' }}>
      {/* ヘッダー */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--neo-text-secondary)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            シーン設定
          </h3>
          <div className="flex gap-2">
            <motion.button
              className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
              onClick={fetchSceneFiles}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="更新"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
              onClick={createNewFile}
              disabled={isSaving}
              style={{
                background: 'var(--neo-accent)',
                color: 'white',
                boxShadow: 'var(--neo-shadow-floating)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title="新規作成"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        
        {/* エラー表示 */}
        {error && (
          <motion.div
            className="neo-element-pressed p-3 rounded-lg mb-4"
            style={{ background: 'var(--neo-error)', color: 'white' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-sm">{error}</div>
          </motion.div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ファイル一覧 */}
        <div className="w-1/3 border-r overflow-hidden" style={{ borderColor: 'var(--neo-text-secondary)' }}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto neo-scrollbar">
              {isLoading ? (
                <div className="p-4 text-center">
                  <motion.div
                    className="w-6 h-6 border-2 border-current border-t-transparent rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="text-sm mt-2" style={{ color: 'var(--neo-text-secondary)' }}>
                    読み込み中...
                  </div>
                </div>
              ) : sceneFiles.length === 0 ? (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--neo-text-secondary)' }}>
                  シーンファイルがありません
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {sceneFiles.map((file) => (
                    <motion.button
                      key={file.path}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedFile === file.path ? 'neo-button-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => handleFileSelect(file.path)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--neo-text-secondary)' }}>
                        {file.scene_id || 'ID未設定'}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 編集エリア */}
        <div className="flex-1 overflow-hidden">
          {selectedFileData ? (
            <div className="h-full flex flex-col">
              {/* 編集ヘッダー */}
              <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'var(--neo-text-secondary)' }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium">{selectedFileData.name}</h4>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <motion.button
                          className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                          onClick={handleCancelEdit}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          キャンセル
                        </motion.button>
                        <motion.button
                          className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                          onClick={saveSceneData}
                          disabled={isSaving}
                          style={{
                            background: 'var(--neo-accent)',
                            color: 'white',
                            boxShadow: 'var(--neo-shadow-floating)',
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
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
                          保存
                        </motion.button>
                      </>
                    ) : (
                      <>
                        <motion.button
                          className="neo-button flex items-center gap-2 px-3 py-2 text-sm"
                          onClick={handleShowYaml}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Code className="w-4 h-4" />
                          YAML表示
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
                        >
                          <Edit className="w-4 h-4" />
                          編集
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 編集フォーム */}
              <div className="flex-1 overflow-y-auto neo-scrollbar p-4">
                <div className="space-y-6">
                  {/* シーンID */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      シーンID
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="neo-input w-full"
                        value={editData.scene_id || ''}
                        onChange={(e) => setEditData({ ...editData, scene_id: e.target.value })}
                        placeholder="scene_001"
                      />
                    ) : (
                      <div className="neo-element-subtle p-3 rounded-lg">
                        {selectedFileData.scene_id || '未設定'}
                      </div>
                    )}
                  </div>

                  {/* 場所 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      場所
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="neo-input w-full"
                        value={editData.location || ''}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        placeholder="学校の屋上"
                      />
                    ) : (
                      <div className="neo-element-subtle p-3 rounded-lg">
                        {selectedFileData.location || '未設定'}
                      </div>
                    )}
                  </div>

                  {/* 時間 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      時間
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="neo-input w-full"
                        value={editData.time || ''}
                        onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                        placeholder="放課後の夕方"
                      />
                    ) : (
                      <div className="neo-element-subtle p-3 rounded-lg">
                        {selectedFileData.time || '未設定'}
                      </div>
                    )}
                  </div>

                  {/* 状況 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      状況
                    </label>
                    {isEditing ? (
                      <textarea
                        className="neo-input w-full"
                        rows={4}
                        value={editData.situation || ''}
                        onChange={(e) => setEditData({ ...editData, situation: e.target.value })}
                        placeholder="シーンの状況を説明してください..."
                      />
                    ) : (
                      <div className="neo-element-subtle p-3 rounded-lg">
                        {selectedFileData.situation || '未設定'}
                      </div>
                    )}
                  </div>

                  {/* 参加キャラクター */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      参加キャラクター
                    </label>
                    
                    {/* キャラクター一覧表示 */}
                    <div className="neo-element-subtle p-3 rounded-lg mb-3">
                      {(editData.participant_character_ids || []).length === 0 ? (
                        <div className="text-sm" style={{ color: 'var(--neo-text-secondary)' }}>
                          参加キャラクターはいません
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(editData.participant_character_ids || []).map((characterId, index) => {
                            const character = characters.find(c => c.character_id === characterId);
                            return (
                              <div
                                key={index}
                                className="neo-element flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                              >
                                <span>{character?.name || characterId}</span>
                                {isEditing && (
                                  <motion.button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveCharacter(index)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </motion.button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* キャラクター追加フォーム */}
                    {isEditing && (
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <select
                            className="neo-input w-full appearance-none cursor-pointer"
                            value={selectedCharacterId}
                            onChange={(e) => setSelectedCharacterId(e.target.value)}
                          >
                            <option value="">キャラクターを選択</option>
                            {characters.map((character) => (
                              <option key={character.character_id} value={character.character_id}>
                                {character.name || character.character_id}
                              </option>
                            ))}
                          </select>
                        </div>
                        <motion.button
                          className="neo-button neo-button-primary px-4 py-2"
                          onClick={handleAddCharacter}
                          disabled={!selectedCharacterId.trim()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          追加
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center" style={{ color: 'var(--neo-text-secondary)' }}>
                編集するシーンファイルを選択してください
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
                <h3 className="text-lg font-semibold">YAML コンテンツ</h3>
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