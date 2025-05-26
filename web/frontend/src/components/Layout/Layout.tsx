/**
 * レイアウトコンポーネント
 */
import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-secondary-50">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
      </div>
    </div>
  );
}; 