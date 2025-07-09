"use client"

import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";

import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";

interface Props {
    children: React.ReactNode;
}

// Internal component that has access to sidebar context
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { closeSidebar } = useSidebar();
  
  // Set up click handler for backdrop
  useEffect(() => {
    const backdrop = document.getElementById('sidebar-backdrop');
    if (backdrop) {
      const handleBackdropClick = () => closeSidebar();
      backdrop.addEventListener('click', handleBackdropClick);
      return () => backdrop.removeEventListener('click', handleBackdropClick);
    }
  }, [closeSidebar]);
  
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar with backdrop overlay */}
      <div className="relative z-40">
        <DashboardSidebar />
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity z-30 hidden" 
          id="sidebar-backdrop"
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-muted p-4 lg:p-6 xl:p-8 transition-all duration-300 w-full">
        <DashboardNavbar />
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children }: Props) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}