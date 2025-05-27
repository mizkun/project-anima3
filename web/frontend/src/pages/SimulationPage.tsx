/**
 * シミュレーションページコンポーネント
 */
import React from 'react'
import { SimulationControls } from '../components/Controls/SimulationControls'
import { Timeline } from '../components/Timeline/Timeline'
import { DebugPanel } from '../components/Debug/DebugPanel'

export const SimulationPage: React.FC = () => {
  return (
    <div className="simulation-page">
      <div className="simulation-content">
        <div className="simulation-main">
          <SimulationControls />
          <Timeline />
        </div>
        <div className="simulation-sidebar">
          <DebugPanel />
        </div>
      </div>
    </div>
  )
} 