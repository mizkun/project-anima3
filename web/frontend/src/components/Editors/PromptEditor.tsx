import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface PromptEditorProps {
  open: boolean;
  onClose: () => void;
  filePath: string | null;
  onSave?: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  open,
  onClose,
  filePath,
  onSave,
}) => {
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ファイル内容を取得
  const fetchFileContent = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (response.ok && data.content !== undefined) {
        setContent(data.content);
        setOriginalContent(data.content);
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
    if (!filePath) return;
    
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOriginalContent(content);
        onSave?.();
        onClose();
      } else {
        throw new Error(data.message || 'ファイルの保存に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // ダイアログが開かれた時にファイル内容を読み込み
  useEffect(() => {
    if (open && filePath) {
      fetchFileContent(filePath);
    }
  }, [open, filePath]);

  // ダイアログが閉じられた時にリセット
  useEffect(() => {
    if (!open) {
      setContent('');
      setOriginalContent('');
      setError(null);
    }
  }, [open]);

  // 変更があるかチェック
  const hasChanges = content !== originalContent;

  // 閉じる時の確認
  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm('変更が保存されていません。閉じてもよろしいですか？');
      if (!confirmed) return;
    }
    onClose();
  };

  // ファイル名を取得
  const fileName = filePath ? filePath.split('/').pop() || '' : '';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: '800px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="div" sx={{ flex: 1 }}>
          プロンプト編集: {fileName}
        </Typography>
        {hasChanges && (
          <Typography variant="body2" color="warning.main">
            未保存の変更があります
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* エラー表示 */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* エディター */}
        <Box sx={{ flex: 1, p: 2, overflow: 'hidden' }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <TextField
              multiline
              fullWidth
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="outlined"
              placeholder="プロンプトの内容を入力してください..."
              sx={{
                height: '100%',
                '& .MuiInputBase-root': {
                  height: '100%',
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  alignItems: 'flex-start',
                },
                '& .MuiInputBase-input': {
                  height: '100% !important',
                  overflow: 'auto !important',
                  resize: 'none',
                },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          startIcon={<CloseIcon />}
          disabled={isSaving}
        >
          閉じる
        </Button>
        <Button
          onClick={saveFileContent}
          startIcon={<SaveIcon />}
          variant="contained"
          disabled={isSaving || isLoading || !hasChanges}
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 