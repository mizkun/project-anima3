import React, { useState, useEffect } from 'react'
import { NeumorphismButton } from '@/components/ui/neumorphism-button'
import { ChevronDown, MapPin } from 'lucide-react'

interface Scene {
  id: string
  name: string
  description: string
  file_path: string
}

interface SceneSelectorProps {
  selectedScene: string | null
  onSceneSelect: (sceneId: string) => void
  disabled?: boolean
}

export const SceneSelector: React.FC<SceneSelectorProps> = ({
  selectedScene,
  onSceneSelect,
  disabled = false
}) => {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchScenes()
  }, [])

  const fetchScenes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/simulation/scenes')
      if (response.ok) {
        const data = await response.json()
        const scenesData = data.scenes || []
        const formattedScenes = scenesData.map((scene: any) => ({
          id: scene.scene_id || scene.id,
          name: scene.location || scene.name,
          description: scene.situation || scene.description,
          file_path: scene.file_path || ''
        }))
        setScenes(formattedScenes)
      } else {
        console.error('シーン一覧の取得に失敗しました')
      }
    } catch (error) {
      console.error('シーン一覧の取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedSceneData = scenes.find(scene => scene.id === selectedScene)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">シーン選択</label>
      
      <div className="relative">
        <NeumorphismButton
          variant="secondary"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span className="text-sm">
              {selectedSceneData ? selectedSceneData.name : 'シーンを選択'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </NeumorphismButton>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-10">
            <div className="neumorphism-card rounded-xl p-2 max-h-60 overflow-y-auto">
              {scenes.length === 0 ? (
                <div className="p-3 text-center text-gray-400 text-sm">
                  {isLoading ? '読み込み中...' : 'シーンが見つかりません'}
                </div>
              ) : (
                scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      onSceneSelect(scene.id)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-gray-700/50 ${
                      selectedScene === scene.id ? 'bg-blue-600/20 border border-blue-500/30' : ''
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-200">{scene.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{scene.description}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedSceneData && (
        <div className="neumorphism-inset rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">選択中のシーン</div>
          <div className="text-sm text-gray-200 font-medium">{selectedSceneData.name}</div>
          <div className="text-xs text-gray-400 mt-1">{selectedSceneData.description}</div>
        </div>
      )}
    </div>
  )
} 