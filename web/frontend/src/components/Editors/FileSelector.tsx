import React, { useState, useEffect } from 'react'
import { NeumorphismCard, NeumorphismCardContent, NeumorphismCardHeader, NeumorphismCardTitle } from '@/components/ui/neumorphism-card'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { useFileManager } from '@/hooks/useFileManager'
import { File, Folder, Plus, Trash2, RefreshCw } from 'lucide-react'
import type { FileInfo } from '@/types/simulation'

interface FileSelectorProps {
  onFileSelect: (file: FileInfo) => void
  selectedFile: FileInfo | null
  className?: string
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  onFileSelect,
  selectedFile,
  className
}) => {
  const [selectedDirectory, setSelectedDirectory] = useState<string>('data/prompts')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  
  const {
    files,
    isLoading,
    error,
    loadFiles,
    createFile,
    deleteFile,
    clearError
  } = useFileManager()

  // 利用可能なディレクトリ
  const directories = [
    { path: 'data/prompts', label: 'プロンプトテンプレート', icon: File },
    { path: 'data/characters', label: 'キャラクター設定', icon: Folder },
  ]

  // 初期ロード
  useEffect(() => {
    loadFiles(selectedDirectory)
  }, [selectedDirectory, loadFiles])

  // ディレクトリ変更
  const handleDirectoryChange = (directory: string) => {
    setSelectedDirectory(directory)
    clearError()
  }

  // ファイル選択
  const handleFileSelect = (file: FileInfo) => {
    onFileSelect(file)
  }

  // ファイル作成
  const handleCreateFile = async () => {
    if (!newFileName.trim()) return

    try {
      const filePath = `${selectedDirectory}/${newFileName}`
      const defaultContent = getDefaultContent(newFileName)
      await createFile(filePath, defaultContent)
      setNewFileName('')
      setShowCreateDialog(false)
    } catch (err) {
      console.error('Failed to create file:', err)
    }
  }

  // ファイル削除
  const handleDeleteFile = async (file: FileInfo) => {
    if (window.confirm(`ファイル "${file.name}" を削除しますか？`)) {
      try {
        await deleteFile(file.path)
      } catch (err) {
        console.error('Failed to delete file:', err)
      }
    }
  }

  // ファイル拡張子に基づくデフォルトコンテンツ
  const getDefaultContent = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'yaml':
      case 'yml':
        return `# ${fileName}
# 作成日: ${new Date().toISOString()}

# ここに設定を記述してください
`
      case 'md':
        return `# ${fileName}

作成日: ${new Date().toLocaleDateString()}

## 概要

ここにプロンプトテンプレートを記述してください。

## 使用方法

1. 
2. 
3. 
`
      case 'txt':
        return `${fileName}

作成日: ${new Date().toLocaleDateString()}

ここにテキストを記述してください。
`
      default:
        return ''
    }
  }

  // ファイルアイコンの取得
  const getFileIcon = (fileName: string) => {
    return <File className="h-4 w-4" />
  }

  return (
    <NeumorphismCard className={className}>
      <NeumorphismCardHeader>
        <NeumorphismCardTitle className="flex items-center justify-between">
          <span>ファイル選択</span>
          <div className="flex gap-2">
            <NeumorphismButton
              variant="secondary"
              size="sm"
              onClick={() => loadFiles(selectedDirectory)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </NeumorphismButton>
            <NeumorphismButton
              variant="primary"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </NeumorphismButton>
          </div>
        </NeumorphismCardTitle>
      </NeumorphismCardHeader>
      
      <NeumorphismCardContent>
        {/* ディレクトリ選択 */}
        <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-300 mb-2">
             ディレクトリ
           </label>
          <div className="grid grid-cols-1 gap-2">
            {directories.map((dir) => (
              <NeumorphismButton
                key={dir.path}
                variant={selectedDirectory === dir.path ? 'primary' : 'secondary'}
                onClick={() => handleDirectoryChange(dir.path)}
                className="justify-start"
              >
                <dir.icon className="h-4 w-4 mr-2" />
                {dir.label}
              </NeumorphismButton>
            ))}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
            <NeumorphismButton
              variant="secondary"
              size="sm"
              onClick={clearError}
              className="mt-2"
            >
              閉じる
            </NeumorphismButton>
          </div>
        )}

        {/* ファイル一覧 */}
        <div className="space-y-2">
                     <label className="block text-sm font-medium text-gray-300">
             ファイル一覧
           </label>
          
          {isLoading ? (
            <div className="neumorphism-inset rounded-xl p-4">
                               <div className="flex items-center gap-3 text-gray-400">
                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-400"></div>
                   <span className="text-sm">読み込み中...</span>
                 </div>
            </div>
          ) : files.length === 0 ? (
            <div className="neumorphism-inset rounded-xl p-4">
                             <p className="text-sm text-gray-400 text-center">
                 ファイルが見つかりません
               </p>
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <div
                  key={file.path}
                  className={`neumorphism-inset rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                    selectedFile?.path === file.path
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.name)}
                                             <span className="text-sm font-medium text-gray-300">
                         {file.name}
                       </span>
                    </div>
                    <NeumorphismButton
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </NeumorphismButton>
                  </div>
                  {file.last_modified && (
                                         <p className="text-xs text-gray-400 mt-1">
                       更新: {new Date(file.last_modified).toLocaleString()}
                     </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ファイル作成ダイアログ */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <NeumorphismCard className="w-96 max-w-full mx-4">
              <NeumorphismCardHeader>
                <NeumorphismCardTitle>新しいファイルを作成</NeumorphismCardTitle>
              </NeumorphismCardHeader>
              <NeumorphismCardContent>
                <div className="space-y-4">
                  <div>
                                         <label className="block text-sm font-medium text-gray-300 mb-2">
                       ファイル名
                     </label>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="例: new_prompt.md"
                                             className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <NeumorphismButton
                      variant="primary"
                      onClick={handleCreateFile}
                      disabled={!newFileName.trim()}
                    >
                      作成
                    </NeumorphismButton>
                    <NeumorphismButton
                      variant="secondary"
                      onClick={() => {
                        setShowCreateDialog(false)
                        setNewFileName('')
                      }}
                    >
                      キャンセル
                    </NeumorphismButton>
                  </div>
                </div>
              </NeumorphismCardContent>
            </NeumorphismCard>
          </div>
        )}
      </NeumorphismCardContent>
    </NeumorphismCard>
  )
} 