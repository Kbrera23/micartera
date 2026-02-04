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
    <div 
      className="min-h-screen bg-background flex w-full flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 5rem)' : 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        minHeight: '-webkit-fill-available',
      }}
    >
      <div className="flex flex-1 w-full">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar currentSection={currentSection} onSectionChange={onSectionChange} />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch">
          <div className="container max-w-5xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <BottomNav currentSection={currentSection} onSectionChange={onSectionChange} />
      )}
    </div>
  );
};
