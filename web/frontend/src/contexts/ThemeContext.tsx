import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

const applyTheme = (theme: Theme) => {
  // 既存のすべてのテーマクラスを削除
  document.documentElement.classList.remove('light', 'dark')
  
  if (theme === 'system') {
    // システムテーマを確認
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.add('light')
    }
  } else {
    // 明示的なテーマを適用
    document.documentElement.classList.add(theme)
  }
  
  console.log(`Theme applied: ${theme}, HTML classes:`, document.documentElement.className)
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // ローカルストレージから初期テーマを取得、デフォルトはライト
    const savedTheme = localStorage.getItem('theme') as Theme
    console.log('Initial theme from localStorage:', savedTheme)
    return savedTheme || 'light'
  })

  const setTheme = (newTheme: Theme) => {
    console.log(`Setting theme to: ${newTheme}`)
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    // ライト ↔ ダークの切り替え（systemは無視）
    if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  // コンポーネントマウント時にテーマを強制適用
  useEffect(() => {
    console.log('ThemeProvider mounted, applying theme:', theme)
    applyTheme(theme)
  }, [])

  // テーマが変更された時の処理
  useEffect(() => {
    console.log('Theme changed to:', theme)
    applyTheme(theme)
  }, [theme])

  // システムテーマの変更を監視
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        console.log('System theme changed')
        applyTheme('system')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
} 