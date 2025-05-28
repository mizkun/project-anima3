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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  People as PeopleIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
} from '@mui/icons-material';

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
      
      const response = await fetch(`/api/files/${encodeURIComponent(selectedFile)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: yamlContent }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsEditing(false);
        // ファイル一覧を更新してパースされたデータも最新にする
        await fetchSceneFiles();
      } else {
        throw new Error(data.message || 'ファイルの保存に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 新規ファイル作成
  const createNewFile = async () => {
    const fileName = prompt('新しいシーンファイル名を入力してください（.yamlは自動で追加されます）:');
    if (!fileName) return;
    
    const fullFileName = fileName.endsWith('.yaml') ? fileName : `${fileName}.yaml`;
    const filePath = `data/scenes/${fullFileName}`;
    
    // シーンファイルのテンプレートデータ
    const templateData = {
      scene_id: `${fileName.replace('.yaml', '')}_001`,
      location: '場所を記述してください',
      time: '時間を記述してください',
      situation: '状況を詳しく記述してください',
      participant_character_ids: [],
    };
    
    const template = generateYamlContent(templateData);

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          path: filePath,
          content: template 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await fetchSceneFiles();
        setSelectedFile(filePath);
        setEditData(templateData);
        setYamlContent(template);
        setIsEditing(true);
      } else {
        throw new Error(data.message || 'ファイルの作成に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 初期化
  useEffect(() => {
    fetchSceneFiles();
    fetchCharacters();
  }, []);

  // ファイル選択ハンドラー
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    const selectedScene = sceneFiles.find(f => f.path === filePath);
    if (selectedScene) {
      setEditData({
        scene_id: selectedScene.scene_id || '',
        location: selectedScene.location || '',
        time: selectedScene.time || '',
        situation: selectedScene.situation || '',
        participant_character_ids: selectedScene.participant_character_ids || [],
      });
      setYamlContent(selectedScene.content || '');
    }
    setIsEditing(false);
  };

  // 編集開始ハンドラー
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 編集キャンセルハンドラー
  const handleCancelEdit = () => {
    setIsEditing(false);
    const selectedScene = sceneFiles.find(f => f.path === selectedFile);
    if (selectedScene) {
      setEditData({
        scene_id: selectedScene.scene_id || '',
        location: selectedScene.location || '',
        time: selectedScene.time || '',
        situation: selectedScene.situation || '',
        participant_character_ids: selectedScene.participant_character_ids || [],
      });
    }
  };

  // キャラクターID追加
  const handleAddCharacter = () => {
    if (selectedCharacterId.trim()) {
      // 重複チェック
      const currentIds = editData.participant_character_ids || [];
      if (!currentIds.includes(selectedCharacterId)) {
        setEditData(prev => ({
          ...prev,
          participant_character_ids: [...currentIds, selectedCharacterId]
        }));
      }
      setSelectedCharacterId('');
    }
  };

  // キャラクターID削除
  const handleRemoveCharacter = (index: number) => {
    setEditData(prev => ({
      ...prev,
      participant_character_ids: prev.participant_character_ids?.filter((_, i) => i !== index) || []
    }));
  };

  // YAML表示
  const handleShowYaml = () => {
    setYamlContent(generateYamlContent(editData));
    setShowYamlDialog(true);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">シーン管理</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={createNewFile}
              disabled={isSaving}
              size="small"
              variant="outlined"
            >
              新規作成
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchSceneFiles}
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
        {/* ファイル一覧 */}
        <Box sx={{ width: '25%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          {isLoading && sceneFiles.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {sceneFiles.map((file) => (
                <ListItem key={file.path} disablePadding>
                  <ListItemButton
                    selected={selectedFile === file.path}
                    onClick={() => handleFileSelect(file.path)}
                    sx={{ py: 0.5 }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                        {file.scene_id || file.name}
                      </Typography>
                      {file.location && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {file.location}
                        </Typography>
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* シーン編集エリア */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedFile ? (
            <>
              {/* 編集ツールバー */}
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {!isEditing ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleStartEdit}
                      size="small"
                      variant="outlined"
                    >
                      編集
                    </Button>
                  ) : (
                    <>
                      <Button
                        startIcon={<SaveIcon />}
                        onClick={saveSceneData}
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
                <IconButton
                  onClick={handleShowYaml}
                  size="small"
                  title="YAML表示"
                >
                  <CodeIcon />
                </IconButton>
              </Box>

              {/* シーン編集フォーム */}
              <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* シーンID */}
                  <TextField
                    label="シーンID"
                    value={editData.scene_id || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, scene_id: e.target.value }))}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                  />

                  {/* 場所 */}
                  <TextField
                    label="場所"
                    value={editData.location || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />

                  {/* 時間 */}
                  <TextField
                    label="時間"
                    value={editData.time || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, time: e.target.value }))}
                    disabled={!isEditing}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />

                  {/* 状況 */}
                  <TextField
                    label="状況"
                    value={editData.situation || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, situation: e.target.value }))}
                    disabled={!isEditing}
                    fullWidth
                    multiline
                    rows={4}
                    size="small"
                  />

                  {/* 参加キャラクター */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      参加キャラクター
                    </Typography>
                    
                    {/* キャラクターリスト */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {editData.participant_character_ids?.map((charId, index) => {
                        const character = characters.find(c => c.character_id === charId);
                        const displayName = character ? (character.name || charId) : charId;
                        
                        return (
                          <Chip
                            key={index}
                            label={displayName}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={isEditing ? () => handleRemoveCharacter(index) : undefined}
                            deleteIcon={<DeleteIcon />}
                          />
                        );
                      })}
                    </Box>

                    {/* キャラクター追加 */}
                    {isEditing && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="character-select-label">キャラクターを選択</InputLabel>
                          <Select
                            labelId="character-select-label"
                            id="character-select"
                            value={selectedCharacterId}
                            label="キャラクター"
                            onChange={(e) => setSelectedCharacterId(e.target.value)}
                          >
                            {characters.map((character) => (
                              <MenuItem key={character.character_id} value={character.character_id}>
                                {character.name || character.character_id}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button
                          onClick={handleAddCharacter}
                          disabled={!selectedCharacterId.trim()}
                          size="small"
                          variant="outlined"
                        >
                          追加
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                編集するシーンファイルを選択してください
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
        <DialogTitle>YAML表示</DialogTitle>
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
              const parsedData = parseYamlContent(yamlContent);
              setEditData(parsedData);
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