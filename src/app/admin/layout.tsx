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
        <SideNav /> {/* Sidebar on the left */}
        <div className="flex-1 ml-64 p-6 overflow-auto"> {/* Main content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
