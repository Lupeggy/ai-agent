"use client"

import { useState } from "react"
import { PanelLeftIcon, PanelRightIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

import { DashboardCommand } from "./dashboard-command"

export const DashboardNavbar = () => {
  const { isOpen, toggleSidebar } = useSidebar()
  const [commandOpen, setCommandOpen] = useState(false)
  
  return (
    <div className="w-full mb-6">
      {/* Command palette dialog */}
      <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />
      
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Sidebar toggle button - visible on all devices */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleSidebar}
          >
            {isOpen 
              ? <PanelRightIcon className="h-4 w-4" /> 
              : <PanelLeftIcon className="h-4 w-4" />}
          </Button>
          
          {/* Search button with keyboard shortcut - moved to left side and wider */}
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 w-full md:w-80" 
            onClick={() => setCommandOpen(true)}
          >
            <SearchIcon className="h-4 w-4" />
            <span className="text-sm text-muted-foreground text-left flex-grow">Search...</span>
            <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
        
        {/* Dashboard title - right-aligned */}
        <h1 className="font-medium text-lg hidden sm:inline-block">Dashboard</h1>
      </nav>
    </div>
  )
}