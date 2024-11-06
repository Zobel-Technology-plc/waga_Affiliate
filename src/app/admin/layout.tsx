// File: admin/layout.tsx

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css'; // Import Font Awesome styles
config.autoAddCss = false;

import React from 'react';
import SideNav from './sidenav/page';
import AdminHeader from './header/page';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen">
      <AdminHeader /> {/* Header at the top */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with fixed width, hidden on small screens */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <SideNav />
        </div>
        {/* Main content area fills the rest of the space */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
