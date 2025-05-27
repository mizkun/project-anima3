import React, { useState } from 'react'
import { useSimulationStore } from '@/stores/simulationStore'
import { useSimulationControls } from '@/hooks/useSimulationControls'

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [apiTestResult, setApiTestResult] = useState<any>(null)
  
  // ストアの状態を取得
  const store = useSimulationStore()
  const controls = useSimulationControls()

  // 直接API呼び出しテスト
  const testDirectAPI = async () => {
    try {
      const response = await fetch('/api/simulation/status')
      const data = await response.json()
      setApiTestResult({ success: true, data })
    } catch (error) {
      setApiTestResult({ success: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700"
        >
          🐛 Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto bg-gray-900 text-white p-4 rounded-lg shadow-xl z-50 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-purple-400">🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* ストア状態 */}
        <div>
          <h4 className="font-semibold text-blue-400 mb-2">📦 Store State</h4>
          <div className="bg-gray-800 p-2 rounded">
            <div>Status: <span className="text-yellow-300">{store.status}</span></div>
            <div>Initialized: <span className="text-yellow-300">{store.isInitialized ? 'Yes' : 'No'}</span></div>
            <div>Loading: <span className="text-yellow-300">{store.isLoading ? 'Yes' : 'No'}</span></div>
            <div>Current Turn: <span className="text-yellow-300">{store.current_turn}</span></div>
            <div>Last Sync: <span className="text-yellow-300">{store.lastSyncTime || 'Never'}</span></div>
          </div>
        </div>

        {/* Controls状態 */}
        <div>
          <h4 className="font-semibold text-green-400 mb-2">🎮 Controls State</h4>
          <div className="bg-gray-800 p-2 rounded">
            <div>Loading: <span className="text-yellow-300">{controls.isLoading ? 'Yes' : 'No'}</span></div>
            <div>Error: <span className="text-yellow-300">{controls.error || 'None'}</span></div>
          </div>
        </div>

        {/* API テスト */}
        <div>
          <h4 className="font-semibold text-red-400 mb-2">🔧 API Test</h4>
          <button
            onClick={testDirectAPI}
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 mb-2"
          >
            Test Direct API
          </button>
          {apiTestResult && (
            <div className="bg-gray-800 p-2 rounded">
              <div>Success: <span className="text-yellow-300">{apiTestResult.success ? 'Yes' : 'No'}</span></div>
              <div className="mt-1 text-xs text-gray-300">
                {apiTestResult.success 
                  ? JSON.stringify(apiTestResult.data, null, 2)
                  : apiTestResult.error
                }
              </div>
            </div>
          )}
        </div>

        {/* アクション */}
        <div>
          <h4 className="font-semibold text-pink-400 mb-2">⚡ Actions</h4>
          <div className="space-y-1">
            <button
              onClick={() => store.markSynced()}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 w-full"
            >
              Mark Synced
            </button>
            <button
              onClick={() => console.log('Store:', store)}
              className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 w-full"
            >
              Log Store to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 