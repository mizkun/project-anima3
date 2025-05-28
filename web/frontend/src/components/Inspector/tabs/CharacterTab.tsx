import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
  Memory as MemoryIcon,
  Flag as TargetIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showYamlDialog, setShowYamlDialog] = useState(false);
  const [yamlContent, setYamlContent] = useState<string>('');
  const [yamlType, setYamlType] = useState<'immutable' | 'longterm'>('immutable');
  
  // 編集用の状態
  const [editData, setEditData] = useState<CharacterData>({ character_id: '' });

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

  // 編集開始ハンドラー
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 編集キャンセルハンドラー
  const handleCancelEdit = () => {
    setIsEditing(false);
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

  // キャラクター選択ハンドラー
  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
    const character = characters.find(c => c.character_id === characterId);
    if (character) {
      setEditData(character.data);
    }
    setIsEditing(false);
  };

  // 経験追加
  const handleAddExperience = () => {
    setEditData(prev => ({
      ...prev,
      experiences: [...(prev.experiences || []), { event: '', importance: 5 }]
    }));
  };

  // 目標追加
  const handleAddGoal = () => {
    setEditData(prev => ({
      ...prev,
      goals: [...(prev.goals || []), { goal: '', importance: 5 }]
    }));
  };

  // 記憶追加
  const handleAddMemory = () => {
    setEditData(prev => ({
      ...prev,
      memories: [...(prev.memories || []), { memory: '', scene_id_of_memory: '', related_character_ids: [] }]
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">キャラクター管理</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={createNewCharacter}
              disabled={isSaving}
              size="small"
              variant="outlined"
            >
              新規作成
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchCharacters}
              disabled={isLoading}
              size="small"
            >
              更新
            </Button>
          </Box>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* キャラクター一覧 */}
        <Box sx={{ width: '25%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          {isLoading && characters.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {characters.map((character) => (
                <ListItem key={character.character_id} disablePadding>
                  <ListItemButton
                    selected={selectedCharacter === character.character_id}
                    onClick={() => handleCharacterSelect(character.character_id)}
                    sx={{ py: 0.5 }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                        {character.data.name || character.character_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {character.character_id}
                      </Typography>
                      {character.data.occupation && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {character.data.occupation}
                        </Typography>
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* キャラクター編集エリア */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedCharacter ? (
            <>
              {/* 編集ツールバー */}
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!isEditing ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                      size="small"
                      variant="outlined"
                    >
                      編集
                    </Button>
                  ) : (
                    <>
                      <Button
                        startIcon={<SaveIcon />}
                        onClick={saveCharacterData}
                        disabled={isSaving}
                        size="small"
                        variant="contained"
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        size="small"
                      >
                        キャンセル
                      </Button>
                    </>
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    onClick={() => handleShowYaml('immutable')}
                    size="small"
                    title="Immutable YAML表示"
                  >
                    <PersonIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleShowYaml('longterm')}
                    size="small"
                    title="Long-term YAML表示"
                  >
                    <PsychologyIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* キャラクター編集フォーム */}
              <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* 基本情報 */}
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        基本情報
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="キャラクターID"
                          value={editData.character_id || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, character_id: e.target.value }))}
                          disabled={!isEditing}
                          fullWidth
                          size="small"
                        />
                        
                        <TextField
                          label="名前"
                          value={editData.name || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          fullWidth
                          size="small"
                        />
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            label="年齢"
                            type="number"
                            value={editData.age || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                            disabled={!isEditing}
                            size="small"
                            sx={{ width: '120px' }}
                          />
                          
                          <TextField
                            label="職業・役職"
                            value={editData.occupation || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, occupation: e.target.value }))}
                            disabled={!isEditing}
                            fullWidth
                            size="small"
                          />
                        </Box>
                        
                        <TextField
                          label="基本性格"
                          value={editData.base_personality || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, base_personality: e.target.value }))}
                          disabled={!isEditing}
                          fullWidth
                          multiline
                          rows={3}
                          size="small"
                        />
                        
                        <TextField
                          label="話し方"
                          value={editData.speech_pattern || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, speech_pattern: e.target.value }))}
                          disabled={!isEditing}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                        />
                        
                        <TextField
                          label="外見"
                          value={editData.appearance || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, appearance: e.target.value }))}
                          disabled={!isEditing}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>

                  {/* 経験 */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        <MemoryIcon sx={{ mr: 1 }} />
                        経験 ({editData.experiences?.length || 0})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {editData.experiences?.map((exp, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <TextField
                              label="経験"
                              value={exp.event}
                              onChange={(e) => {
                                const newExperiences = [...(editData.experiences || [])];
                                newExperiences[index].event = e.target.value;
                                setEditData(prev => ({ ...prev, experiences: newExperiences }));
                              }}
                              disabled={!isEditing}
                              fullWidth
                              multiline
                              rows={2}
                              size="small"
                            />
                            <TextField
                              label="重要度"
                              type="number"
                              value={exp.importance}
                              onChange={(e) => {
                                const newExperiences = [...(editData.experiences || [])];
                                newExperiences[index].importance = parseInt(e.target.value) || 5;
                                setEditData(prev => ({ ...prev, experiences: newExperiences }));
                              }}
                              disabled={!isEditing}
                              size="small"
                              sx={{ width: '100px' }}
                              inputProps={{ min: 1, max: 10 }}
                            />
                            {isEditing && (
                              <IconButton
                                onClick={() => {
                                  const newExperiences = editData.experiences?.filter((_, i) => i !== index) || [];
                                  setEditData(prev => ({ ...prev, experiences: newExperiences }));
                                }}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                        {isEditing && (
                          <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddExperience}
                            size="small"
                            variant="outlined"
                          >
                            経験を追加
                          </Button>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* 目標 */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        <TargetIcon sx={{ mr: 1 }} />
                        目標 ({editData.goals?.length || 0})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {editData.goals?.map((goal, index) => (
                          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <TextField
                              label="目標"
                              value={goal.goal}
                              onChange={(e) => {
                                const newGoals = [...(editData.goals || [])];
                                newGoals[index].goal = e.target.value;
                                setEditData(prev => ({ ...prev, goals: newGoals }));
                              }}
                              disabled={!isEditing}
                              fullWidth
                              multiline
                              rows={2}
                              size="small"
                            />
                            <TextField
                              label="重要度"
                              type="number"
                              value={goal.importance}
                              onChange={(e) => {
                                const newGoals = [...(editData.goals || [])];
                                newGoals[index].importance = parseInt(e.target.value) || 5;
                                setEditData(prev => ({ ...prev, goals: newGoals }));
                              }}
                              disabled={!isEditing}
                              size="small"
                              sx={{ width: '100px' }}
                              inputProps={{ min: 1, max: 10 }}
                            />
                            {isEditing && (
                              <IconButton
                                onClick={() => {
                                  const newGoals = editData.goals?.filter((_, i) => i !== index) || [];
                                  setEditData(prev => ({ ...prev, goals: newGoals }));
                                }}
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                        {isEditing && (
                          <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddGoal}
                            size="small"
                            variant="outlined"
                          >
                            目標を追加
                          </Button>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>

                  {/* 記憶 */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                        <PsychologyIcon sx={{ mr: 1 }} />
                        記憶 ({editData.memories?.length || 0})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {editData.memories?.map((memory, index) => (
                          <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <TextField
                              label="記憶"
                              value={memory.memory}
                              onChange={(e) => {
                                const newMemories = [...(editData.memories || [])];
                                newMemories[index].memory = e.target.value;
                                setEditData(prev => ({ ...prev, memories: newMemories }));
                              }}
                              disabled={!isEditing}
                              fullWidth
                              multiline
                              rows={3}
                              size="small"
                            />
                            <TextField
                              label="シーンID"
                              value={memory.scene_id_of_memory}
                              onChange={(e) => {
                                const newMemories = [...(editData.memories || [])];
                                newMemories[index].scene_id_of_memory = e.target.value;
                                setEditData(prev => ({ ...prev, memories: newMemories }));
                              }}
                              disabled={!isEditing}
                              fullWidth
                              size="small"
                            />
                            {isEditing && (
                              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton
                                  onClick={() => {
                                    const newMemories = editData.memories?.filter((_, i) => i !== index) || [];
                                    setEditData(prev => ({ ...prev, memories: newMemories }));
                                  }}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                        ))}
                        {isEditing && (
                          <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddMemory}
                            size="small"
                            variant="outlined"
                          >
                            記憶を追加
                          </Button>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                編集するキャラクターを選択してください
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* YAML表示ダイアログ */}
      <Dialog
        open={showYamlDialog}
        onClose={() => setShowYamlDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {yamlType === 'immutable' ? 'Immutable YAML' : 'Long-term YAML'}
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            value={yamlContent}
            onChange={(e) => setYamlContent(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
            rows={15}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowYamlDialog(false)}>
            閉じる
          </Button>
          <Button
            onClick={() => {
              // YAMLから編集データを更新する処理は複雑なので、今回は省略
              setShowYamlDialog(false);
            }}
            variant="contained"
          >
            適用
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 