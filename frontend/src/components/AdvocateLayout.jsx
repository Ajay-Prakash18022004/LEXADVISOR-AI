import React, { useState } from 'react';
import AdvocateSidebar from './AdvocateSidebar';
import AdvocateHeader from './AdvocateHeader';

export default function AdvocateLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface font-body-md text-body-md text-on-surface antialiased">
      <AdvocateSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <AdvocateHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-space-md lg:p-space-xl max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
