import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { NeumorphismCard, NeumorphismCardContent, NeumorphismCardHeader, NeumorphismCardTitle } from '@/components/ui/neumorphism-card'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { FileSelector } from './FileSelector'
import { CodeEditor } from './CodeEditor'
import { useFileManager } from '@/hooks/useFileManager'
import { Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'
import type { FileInfo } from '@/types/simulation'

interface EditorContainerProps {
  className?: string
}

export const EditorContainer: React.FC<EditorContainerProps> = ({ className }) => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const { loadFile, saveFile, isLoading, error, clearError } = useFileManager()

  // ファイル選択時の処理
  const handleFileSelect = useCallback(async (file: FileInfo) => {
    // 未保存の変更がある場合の確認
    if (hasUnsavedChanges) {
      const shouldContinue = window.confirm(
        '未保存の変更があります。このまま続行しますか？変更は失われます。'
      )
      if (!shouldContinue) return
    }

    try {
      await loadFile(file.path)
      setSelectedFile(file)
      setEditorContent(file.content || '')
      setHasUnsavedChanges(false)
      setSaveStatus('idle')
      clearError()
    } catch (err) {
      console.error('Failed to load file:', err)
    }
  }, [hasUnsavedChanges, loadFile, clearError])

  // エディター内容変更時の処理
  const handleEditorChange = useCallback((content: string) => {
    setEditorContent(content)
    setHasUnsavedChanges(selectedFile ? content !== selectedFile.content : false)
    setSaveStatus('idle')
  }, [selectedFile])

  // ファイル保存
  const handleSave = useCallback(async () => {
    if (!selectedFile || !hasUnsavedChanges) return

    setSaveStatus('saving')
    try {
      await saveFile(selectedFile.path, editorContent)
      setHasUnsavedChanges(false)
      setSaveStatus('saved')
      
      // 保存成功メッセージを3秒後に消す
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (err) {
      setSaveStatus('error')
      console.error('Failed to save file:', err)
    }
  }, [selectedFile, hasUnsavedChanges, editorContent, saveFile])

  // 変更を元に戻す
  const handleRevert = useCallback(() => {
    if (!selectedFile || !hasUnsavedChanges) return

    const shouldRevert = window.confirm(
      '変更を元に戻しますか？未保存の変更は失われます。'
    )
    
    if (shouldRevert) {
      setEditorContent(selectedFile.content || '')
      setHasUnsavedChanges(false)
      setSaveStatus('idle')
    }
  }, [selectedFile, hasUnsavedChanges])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S (Windows) または Cmd+S (Mac) で保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      
      // Ctrl+Z (Windows) または Cmd+Z (Mac) で元に戻す
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleRevert()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, handleRevert])

  // ファイル拡張子から言語を判定
  const getLanguageFromFile = (file: FileInfo | null): string => {
    if (!file) return 'plaintext'
    
    const ext = file.name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'yaml':
      case 'yml':
        return 'yaml'
      case 'md':
        return 'markdown'
      case 'json':
        return 'json'
      case 'txt':
        return 'plaintext'
      default:
        return 'plaintext'
    }
  }

  // 保存ステータスのアイコンとメッセージ
  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />,
          message: '保存中...',
          color: 'text-blue-600'
        }
      case 'saved':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          message: '保存完了',
          color: 'text-green-600'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          message: '保存エラー',
          color: 'text-red-600'
        }
      default:
        return null
    }
  }

  const statusDisplay = getSaveStatusDisplay()

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* ファイル選択パネル */}
      <div className="lg:col-span-1">
        <FileSelector
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          className="h-full"
        />
      </div>

      {/* エディターパネル */}
      <div className="lg:col-span-2">
        <NeumorphismCard className="h-full">
          <NeumorphismCardHeader>
            <NeumorphismCardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>
                  {selectedFile ? selectedFile.name : 'ファイルを選択してください'}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    未保存
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* 保存ステータス */}
                {statusDisplay && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-1 text-sm ${statusDisplay.color}`}
                  >
                    {statusDisplay.icon}
                    <span>{statusDisplay.message}</span>
                  </motion.div>
                )}
                
                {/* アクションボタン */}
                {selectedFile && (
                  <div className="flex gap-2">
                    <NeumorphismButton
                      variant="secondary"
                      size="sm"
                      onClick={handleRevert}
                      disabled={!hasUnsavedChanges || isLoading}
                      title="変更を元に戻す (Ctrl+Z)"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </NeumorphismButton>
                    <NeumorphismButton
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges || isLoading}
                      title="保存 (Ctrl+S)"
                    >
                      <Save className="h-4 w-4" />
                    </NeumorphismButton>
                  </div>
                )}
              </div>
            </NeumorphismCardTitle>
          </NeumorphismCardHeader>
          
          <NeumorphismCardContent className="p-0">
            {/* エラー表示 */}
            {error && (
                             <div className="m-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg">
                                 <div className="flex items-center gap-2">
                   <AlertCircle className="h-4 w-4 text-red-400" />
                   <p className="text-sm text-red-400">{error}</p>
                 </div>
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

            {/* エディター */}
            {selectedFile ? (
              <CodeEditor
                value={editorContent}
                onChange={handleEditorChange}
                language={getLanguageFromFile(selectedFile)}
                height="600px"
                className="m-4"
              />
            ) : (
              <div className="flex items-center justify-center h-96 m-4">
                <div className="neumorphism-inset rounded-xl p-8">
                                     <div className="text-center text-gray-400">
                     <div className="neumorphism-icon p-4 mx-auto mb-4">
                       <Save className="h-8 w-8 text-gray-500" />
                     </div>
                     <h3 className="text-lg font-medium mb-2 text-gray-300">ファイルエディター</h3>
                     <p className="text-sm">
                       左側のパネルからファイルを選択して編集を開始してください
                     </p>
                     <div className="mt-4 text-xs text-gray-500">
                       <p>ショートカット:</p>
                       <p>Ctrl+S: 保存</p>
                       <p>Ctrl+Z: 元に戻す</p>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </NeumorphismCardContent>
        </NeumorphismCard>
      </div>
    </div>
  )
} 