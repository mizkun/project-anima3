/**
 * メインコンテンツコンポーネント
 */
import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="flex-1 bg-secondary-50 overflow-hidden">
      <div className="h-full p-6">
        {children}
      </div>
    </main>
  );
}; 