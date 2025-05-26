import React, { useRef } from 'react'
import Editor from '@monaco-editor/react'
import { NeumorphismCard } from '@/components/ui/neumorphism-card'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
  height?: string
  className?: string
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = '400px',
  className
}) => {
  const editorRef = useRef<any>(null)

  // エディターがマウントされた時の処理
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // カスタムダークテーマの設定
    monaco.editor.defineTheme('neumorphism-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: 'a78bfa' },
        { token: 'variable', foreground: 'e5e5e5' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#e5e5e5',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editor.selectionBackground': '#374151',
        'editor.inactiveSelectionBackground': '#2a2a2a',
        'editorCursor.foreground': '#60a5fa',
        'editorLineNumber.foreground': '#6b7280',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editorIndentGuide.background': '#374151',
        'editorIndentGuide.activeBackground': '#4b5563',
        'editorWhitespace.foreground': '#374151',
        'editorRuler.foreground': '#374151',
        'scrollbarSlider.background': '#4a4a4a',
        'scrollbarSlider.hoverBackground': '#5a5a5a',
        'scrollbarSlider.activeBackground': '#6a6a6a',
      }
    })

    // ダークテーマを適用
    monaco.editor.setTheme('neumorphism-dark')

    // エディターの設定
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      lineHeight: 1.6,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      mouseWheelScrollSensitivity: 0.5,
      fastScrollSensitivity: 5,
      readOnly,
    })
  }

  // 値の変更処理
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && !readOnly) {
      onChange(value)
    }
  }

  // 言語に応じた設定
  const getLanguageConfig = (lang: string) => {
    switch (lang) {
      case 'yaml':
        return {
          language: 'yaml',
          options: {
            tabSize: 2,
            insertSpaces: true,
          }
        }
      case 'markdown':
        return {
          language: 'markdown',
          options: {
            wordWrap: 'on' as const,
            lineNumbers: 'off' as const,
          }
        }
      case 'json':
        return {
          language: 'json',
          options: {
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
          }
        }
      default:
        return {
          language: 'plaintext',
          options: {}
        }
    }
  }

  const config = getLanguageConfig(language)

  return (
    <NeumorphismCard className={`overflow-hidden ${className}`}>
      <div className="neumorphism-inset rounded-xl p-1">
        <Editor
          height={height}
          language={config.language}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            ...config.options,
            readOnly,
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="neumorphism-inset rounded-xl p-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                  <span>エディターを読み込み中...</span>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </NeumorphismCard>
  )
} 