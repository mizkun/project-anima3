import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { PromptEditor } from '../../Editors/PromptEditor';

interface PromptFile {
  name: string;
  path: string;
  content?: string;
  last_modified?: string;
}

export const PromptTab: React.FC = () => {
  const [promptFiles, setPromptFiles] = useState<PromptFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

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

  // ファイル選択ハンドラー
  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  // 編集開始ハンドラー
  const handleStartEdit = (filePath: string) => {
    setSelectedFile(filePath);
    setShowEditor(true);
  };

  // エディター保存後のハンドラー
  const handleEditorSave = () => {
    fetchPromptFiles();
  };

  useEffect(() => {
    fetchPromptFiles();
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">プロンプト管理</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchPromptFiles}
              disabled={isLoading}
              size="small"
              title="更新"
            >
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

      {/* ファイル一覧 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading && promptFiles.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : promptFiles.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
            <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              プロンプトファイルがありません
            </Typography>
          </Box>
        ) : (
          <List dense>
            {promptFiles.map((file) => (
              <ListItem 
                key={file.path} 
                disablePadding
                secondaryAction={
                  <Tooltip title="編集">
                    <IconButton
                      edge="end"
                      onClick={() => handleStartEdit(file.path)}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemButton
                  selected={selectedFile === file.path}
                  onClick={() => handleFileSelect(file.path)}
                  sx={{ pr: 6 }} // アイコンボタンのスペースを確保
                >
                  <ListItemText
                    primary={file.name}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondary={`パス: ${file.path}`}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* プロンプトエディター */}
      <PromptEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        filePath={selectedFile}
        onSave={handleEditorSave}
      />
    </Box>
  );
}; 