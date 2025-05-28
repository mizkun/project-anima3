import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

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
  const [error, setError] = useState<string | null>(null)

  const { saveFile, isLoading, clearError } = useFileManager()

  // エラークリア
  const clearLocalError = useCallback(() => {
    setError(null)
  }, [])

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
      // ファイル情報を設定
      setSelectedFile(file)
      
      // ファイル内容が含まれていない場合は個別に取得
      if (file.content === undefined || file.content === null) {
        // APIから直接ファイル内容を取得
        const response = await fetch(`/api/files/${encodeURIComponent(file.path)}`)
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status}`)
        }
        
        const fileData = await response.json()
        setEditorContent(fileData.content || '')
      } else {
        // ファイル内容が既に含まれている場合はそのまま使用
        setEditorContent(file.content)
      }
      
      setHasUnsavedChanges(false)
      setSaveStatus('idle')
      clearError()
      clearLocalError()
    } catch (err) {
      console.error('Failed to load file:', err)
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    }
  }, [hasUnsavedChanges, clearError, clearLocalError])

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
    <div className={`flex flex-col h-full ${className}`}>
      {/* ファイル選択とアクションバー */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="flex-1">
          <FileSelector
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            className="h-auto"
          />
        </div>
        
        {/* アクションボタン */}
        {selectedFile && (
          <div className="flex items-center gap-2">
            {/* 保存ステータス */}
            {statusDisplay && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-1 text-sm ${statusDisplay.color}`}
              >
                {statusDisplay.icon}
                <span className="hidden sm:inline">{statusDisplay.message}</span>
              </motion.div>
            )}
            
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

      {/* エディターエリア */}
      <div className="flex-1 overflow-hidden">
        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <NeumorphismButton
              variant="secondary"
              size="sm"
              onClick={clearLocalError}
              className="mt-2"
            >
              閉じる
            </NeumorphismButton>
          </div>
        )}

        {/* エディター */}
        {selectedFile ? (
          <div className="h-full flex flex-col">
            <div className="mb-2 flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-300">{selectedFile.name}</span>
              {hasUnsavedChanges && (
                <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded-full">
                  未保存
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <CodeEditor
                value={editorContent}
                onChange={handleEditorChange}
                language={getLanguageFromFile(selectedFile)}
                height="100%"
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="neumorphism-inset rounded-xl p-6">
              <div className="text-center text-gray-400">
                <div className="neumorphism-icon p-4 mx-auto mb-4">
                  <Save className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-300">ファイルエディター</h3>
                <p className="text-sm">
                  ファイルを選択して編集を開始してください
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  <p>Ctrl+S: 保存 | Ctrl+Z: 元に戻す</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 