/**
 * シミュレーションページコンポーネント
 */
import React from 'react'
import { SimulationControls } from '../components/Controls/SimulationControls'
import { Timeline } from '../components/Timeline/Timeline'
import { DebugPanel } from '../components/Debug/DebugPanel'
import { AnimationTest } from '../components/Test/AnimationTest'

export const SimulationPage: React.FC = () => {
  // アニメーションテストを表示するかどうか（デバッグ用）
  const showAnimationTest = window.location.search.includes('test=animation')

  return (
    <div className="simulation-page">
      {showAnimationTest ? (
        <AnimationTest />
      ) : (
        <div className="simulation-content">
          <div className="simulation-main">
            <SimulationControls />
            <Timeline />
          </div>
          <div className="simulation-sidebar">
            <DebugPanel />
          </div>
        </div>
      )}
    </div>
  )
} 