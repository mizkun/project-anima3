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
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface PromptFile {
  name: string;
  path: string;
  content?: string;
  last_modified?: string;
}

export const PromptTab: React.FC = () => {
  const [promptFiles, setPromptFiles] = useState<PromptFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // プロンプトファイル一覧を取得
  const fetchPromptFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/files?directory=data/prompts');
      const data = await response.json();
      
      if (response.ok && data.files) {
        // APIレスポンスから必要な情報のみを抽出
        const files = data.files.map((file: any) => ({
          name: file.name,
          path: file.path,
        }));
        setPromptFiles(files);
      } else {
        throw new Error(data.message || 'プロンプトファイルの取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ファイル内容を取得
  const fetchFileContent = async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(filePath)}`);
      const data = await response.json();
      
      if (response.ok && data.content !== undefined) {
        setFileContent(data.content);
        setIsEditing(false);
      } else {
        throw new Error(data.message || 'ファイル内容の取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ファイル内容を保存
  const saveFileContent = async () => {
    if (!selectedFile) return;
    
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(selectedFile)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsEditing(false);
        // ファイル一覧を更新
        await fetchPromptFiles();
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
    const fileName = prompt('新しいプロンプトファイル名を入力してください（.txtは自動で追加されます）:');
    if (!fileName) return;
    
    const fullFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
    const filePath = `data/prompts/${fullFileName}`;
    
    // プロンプトファイルのテンプレート
    const template = `# ${fileName} プロンプト

このプロンプトの説明をここに記述してください。

## 使用方法
このプロンプトの使用方法や目的を記述してください。

## パラメータ
- {{parameter1}}: パラメータの説明
- {{parameter2}}: パラメータの説明

## プロンプト内容
ここにプロンプトの内容を記述してください。
`;

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
        await fetchPromptFiles();
        setSelectedFile(filePath);
        setFileContent(template);
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
    fetchPromptFiles();
  }, []);

  // ファイル選択ハンドラー
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    fetchFileContent(filePath);
  };

  // 編集開始ハンドラー
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 編集キャンセルハンドラー
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedFile) {
      fetchFileContent(selectedFile);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">プロンプト管理</Typography>
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
              onClick={fetchPromptFiles}
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
        <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          {isLoading && promptFiles.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {promptFiles.map((file) => (
                <ListItem key={file.path} disablePadding>
                  <ListItemButton
                    selected={selectedFile === file.path}
                    onClick={() => handleFileSelect(file.path)}
                  >
                    <ListItemText
                      primary={file.name}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* ファイル編集エリア */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedFile ? (
            <>
              {/* 編集ツールバー */}
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
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
                      onClick={saveFileContent}
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

              {/* ファイル内容表示/編集 */}
              <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <TextField
                    multiline
                    fullWidth
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                    sx={{
                      '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        height: '100%',
                        alignItems: 'flex-start',
                      },
                      '& .MuiInputBase-input': {
                        height: '100% !important',
                        overflow: 'auto !important',
                      },
                    }}
                    placeholder="プロンプトファイルの内容がここに表示されます..."
                  />
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                編集するプロンプトファイルを選択してください
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}; 