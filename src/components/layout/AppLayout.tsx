import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export const AppLayout = ({ children, currentSection, onSectionChange }: AppLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar currentSection={currentSection} onSectionChange={onSectionChange} />
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
        <div className="container max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <BottomNav currentSection={currentSection} onSectionChange={onSectionChange} />
      )}
    </div>
  );
};
