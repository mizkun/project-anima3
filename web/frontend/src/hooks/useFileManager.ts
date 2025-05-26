import { useState, useCallback } from 'react'
import type { FileInfo } from '@/types/simulation'

interface UseFileManagerReturn {
  files: FileInfo[]
  currentFile: FileInfo | null
  isLoading: boolean
  error: string | null
  loadFiles: (directory: string) => Promise<void>
  loadFile: (filePath: string) => Promise<void>
  saveFile: (filePath: string, content: string) => Promise<void>
  createFile: (filePath: string, content: string) => Promise<void>
  deleteFile: (filePath: string) => Promise<void>
  setCurrentFile: (file: FileInfo | null) => void
  clearError: () => void
}

export const useFileManager = (): UseFileManagerReturn => {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API呼び出し用のヘルパー関数
  const apiCall = useCallback(async (endpoint: string, method: string = 'GET', body?: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ディレクトリ内のファイル一覧を取得
  const loadFiles = useCallback(async (directory: string) => {
    try {
      const response = await apiCall(`/files?directory=${encodeURIComponent(directory)}`)
      setFiles(response.files || [])
    } catch (err) {
      console.error('Failed to load files:', err)
    }
  }, [apiCall])

  // 特定のファイルを読み込み
  const loadFile = useCallback(async (filePath: string) => {
    try {
      const response = await apiCall(`/files/${encodeURIComponent(filePath)}`)
      const fileInfo: FileInfo = {
        name: response.name,
        path: response.path,
        content: response.content,
        last_modified: response.last_modified
      }
      setCurrentFile(fileInfo)
    } catch (err) {
      console.error('Failed to load file:', err)
    }
  }, [apiCall])

  // ファイルを保存
  const saveFile = useCallback(async (filePath: string, content: string) => {
    try {
      await apiCall(`/files/${encodeURIComponent(filePath)}`, 'PUT', { content })
      
      // 現在のファイルが保存されたファイルの場合、内容を更新
      if (currentFile && currentFile.path === filePath) {
        setCurrentFile({
          ...currentFile,
          content,
          last_modified: new Date().toISOString()
        })
      }
      
      // ファイル一覧も更新
      setFiles(prev => prev.map(file => 
        file.path === filePath 
          ? { ...file, content, last_modified: new Date().toISOString() }
          : file
      ))
    } catch (err) {
      console.error('Failed to save file:', err)
      throw err
    }
  }, [apiCall, currentFile])

  // 新しいファイルを作成
  const createFile = useCallback(async (filePath: string, content: string) => {
    try {
      await apiCall('/files', 'POST', { path: filePath, content })
      
      const newFile: FileInfo = {
        name: filePath.split('/').pop() || '',
        path: filePath,
        content,
        last_modified: new Date().toISOString()
      }
      
      setFiles(prev => [...prev, newFile])
    } catch (err) {
      console.error('Failed to create file:', err)
      throw err
    }
  }, [apiCall])

  // ファイルを削除
  const deleteFile = useCallback(async (filePath: string) => {
    try {
      await apiCall(`/files/${encodeURIComponent(filePath)}`, 'DELETE')
      
      // 現在のファイルが削除されたファイルの場合、クリア
      if (currentFile && currentFile.path === filePath) {
        setCurrentFile(null)
      }
      
      // ファイル一覧から削除
      setFiles(prev => prev.filter(file => file.path !== filePath))
    } catch (err) {
      console.error('Failed to delete file:', err)
      throw err
    }
  }, [apiCall, currentFile])

  // エラークリア
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    files,
    currentFile,
    isLoading,
    error,
    loadFiles,
    loadFile,
    saveFile,
    createFile,
    deleteFile,
    setCurrentFile,
    clearError
  }
} 