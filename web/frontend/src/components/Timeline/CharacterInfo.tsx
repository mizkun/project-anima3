import React from 'react'
import { User } from 'lucide-react'

interface CharacterInfoProps {
  characterId: string
  characterName?: string
}

export const CharacterInfo: React.FC<CharacterInfoProps> = ({ 
  characterId, 
  characterName 
}) => {
  // キャラクター名の表示（IDから名前を生成、または提供された名前を使用）
  const displayName = characterName || characterId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  // キャラクターIDから色を生成（一貫した色付けのため）
  const getCharacterColor = (id: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
    ]
    const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // アバター用の初期文字を取得
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex items-center gap-3">
      {/* キャラクターアバター */}
      <div className={`neumorphism-icon w-10 h-10 flex items-center justify-center ${getCharacterColor(characterId)}`}>
        <span className="text-sm font-bold">
          {getInitials(displayName)}
        </span>
      </div>
      
      {/* キャラクター情報 */}
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{displayName}</h4>
        <p className="text-xs text-gray-500">ID: {characterId}</p>
      </div>
      
      {/* キャラクターアイコン */}
      <div className="neumorphism-icon p-2">
        <User className="h-4 w-4 text-gray-600" />
      </div>
    </div>
  )
} 