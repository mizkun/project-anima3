import React, { useState, useEffect } from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { useFileManager } from '@/hooks/useFileManager'
import { File, Folder, Plus, ChevronDown, RefreshCw } from 'lucide-react'
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
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false)
  const [isFileOpen, setIsFileOpen] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  
  const {
    files,
    isLoading,
    error,
    loadFiles,
    createFile,
    clearError
  } = useFileManager()

  // 利用可能なディレクトリ
  const directories = [
    { path: 'data/prompts', label: 'プロンプト', icon: File },
    { path: 'data/characters', label: 'キャラクター', icon: Folder },
  ]

  // 初期ロード
  useEffect(() => {
    loadFiles(selectedDirectory)
  }, [selectedDirectory, loadFiles])

  // ディレクトリ変更
  const handleDirectoryChange = (directory: string) => {
    setSelectedDirectory(directory)
    setIsDirectoryOpen(false)
    clearError()
  }

  // ファイル選択
  const handleFileSelect = (file: FileInfo) => {
    onFileSelect(file)
    setIsFileOpen(false)
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

  // ファイル拡張子に基づくデフォルトコンテンツ
  const getDefaultContent = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'yaml':
      case 'yml':
        return `# ${fileName}\n# 作成日: ${new Date().toISOString()}\n\n# ここに設定を記述してください\n`
      case 'md':
        return `# ${fileName}\n\n作成日: ${new Date().toLocaleDateString()}\n\n## 概要\n\nここにプロンプトテンプレートを記述してください。\n`
      case 'txt':
        return `${fileName}\n\n作成日: ${new Date().toLocaleDateString()}\n\nここにテキストを記述してください。\n`
      default:
        return ''
    }
  }

  const currentDirectory = directories.find(d => d.path === selectedDirectory)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* ディレクトリ選択 */}
      <div className="relative">
        <NeumorphismButton
          variant="secondary"
          onClick={() => setIsDirectoryOpen(!isDirectoryOpen)}
          className="flex items-center gap-2"
        >
          {currentDirectory && <currentDirectory.icon className="h-4 w-4" />}
          <span className="hidden sm:inline">{currentDirectory?.label}</span>
          <ChevronDown className="h-4 w-4" />
        </NeumorphismButton>
        
        {isDirectoryOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[150px]">
            {directories.map((dir) => (
              <button
                key={dir.path}
                onClick={() => handleDirectoryChange(dir.path)}
                className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-gray-300 first:rounded-t-lg last:rounded-b-lg"
              >
                <dir.icon className="h-4 w-4" />
                {dir.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ファイル選択 */}
      <div className="relative flex-1">
        <NeumorphismButton
          variant="secondary"
          onClick={() => setIsFileOpen(!isFileOpen)}
          className="w-full flex items-center justify-between"
          disabled={isLoading}
        >
          <span className="truncate">
            {selectedFile ? selectedFile.name : 'ファイルを選択'}
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </NeumorphismButton>
        
        {isFileOpen && (
          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 w-full max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-2 text-gray-400 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-blue-400"></div>
                読み込み中...
              </div>
            ) : files.length === 0 ? (
              <div className="px-3 py-2 text-gray-400">
                ファイルが見つかりません
              </div>
            ) : (
              files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleFileSelect(file)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-gray-300 first:rounded-t-lg last:rounded-b-lg ${
                    selectedFile?.path === file.path ? 'bg-blue-600/20' : ''
                  }`}
                >
                  <File className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <NeumorphismButton
        variant="secondary"
        size="sm"
        onClick={() => loadFiles(selectedDirectory)}
        disabled={isLoading}
        title="更新"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      </NeumorphismButton>

      <NeumorphismButton
        variant="primary"
        size="sm"
        onClick={() => setShowCreateDialog(true)}
        title="新規作成"
      >
        <Plus className="h-4 w-4" />
      </NeumorphismButton>

      {/* エラー表示 */}
      {error && (
        <div className="absolute top-full left-0 mt-1 bg-red-900/20 border border-red-800/30 rounded-lg p-3 z-10">
          <p className="text-sm text-red-400">{error}</p>
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

      {/* ファイル作成ダイアログ */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-medium text-gray-200 mb-4">新しいファイルを作成</h3>
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
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-200"
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
          </div>
        </div>
      )}
    </div>
  )
} 