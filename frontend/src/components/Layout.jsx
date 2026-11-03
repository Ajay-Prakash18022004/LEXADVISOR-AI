import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import UploadModal from './UploadModal';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="bg-surface text-on-surface min-h-screen font-body-md text-body-md antialiased flex flex-col">
      {/* Persistent / Responsive Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Fixed Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Main Content Area: shifted right on desktop to clear 72-unit sidebar, pt-20 to clear fixed header */}
      <div className="pl-0 lg:pl-72 flex-1 flex flex-col">
        <main className="w-full pt-20 bg-background min-h-screen flex-1">
          {children}
        </main>
      </div>

      {/* Global Ingestion / Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}

