'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function MainLayout({ children, userRole = 'student' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#0a0f2c]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} userRole={userRole} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navigation */}
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide bg-[#0a0f2c]">
          <div className="p-6 md:p-8 min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
