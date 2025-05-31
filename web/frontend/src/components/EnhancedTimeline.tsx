import React from 'react';
import { Timeline } from './Timeline/Timeline';

interface EnhancedTimelineProps {
  // Timeline と同じprops
}

const EnhancedTimeline: React.FC<EnhancedTimelineProps> = (props) => {
  return (
    <div className="h-full">
      <Timeline {...props} />
    </div>
  );
};

export default EnhancedTimeline; 