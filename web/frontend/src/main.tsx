import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'

// 開発環境でのAPIテストユーティリティ
if (import.meta.env.DEV) {
  import('./utils/api-test')
}

createRoot(document.getElementById('root')!).render(
  // StrictModeを一時的に無効化してアニメーション問題をデバッグ
  // <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  // </StrictMode>,
)
