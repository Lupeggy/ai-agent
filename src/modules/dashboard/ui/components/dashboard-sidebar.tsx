"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BotIcon, Video, ArrowUpCircle } from "lucide-react"
import { DashboardUserButton } from "./dashboard-user-button"
import { useSidebar } from "@/components/ui/sidebar"

const mainNav = [
  { label: "Meetings", href: "/dashboard/meetings", icon: <Video size={20} /> },
  { label: "Agents", href: "/agents", icon: <BotIcon size={20} /> },
]

const secondaryNav = [
  { label: "Upgrades", href: "/upgrades", icon: <ArrowUpCircle size={20} /> },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isOpen } = useSidebar()
  
  // Update backdrop visibility when sidebar state changes
  useEffect(() => {
    const backdrop = document.getElementById('sidebar-backdrop')
    if (backdrop) {
      if (isOpen) {
        backdrop.classList.remove('hidden')
      } else {
        backdrop.classList.add('hidden')
      }
    }
  }, [isOpen])

  return (
    <aside className={cn(
      "fixed top-0 left-0 z-40 h-screen w-64 flex flex-col bg-white border-r py-8 px-4 shadow-sm transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo Section */}
      <div className="mb-10 flex items-center gap-2 px-2">
        <div className="rounded-full bg-blue-600 text-white w-9 h-9 flex items-center justify-center font-bold text-xl">
          <span>🤖</span>
        </div>
        <span className="font-semibold text-blue-700 text-2xl tracking-tight">ai-agent</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col gap-1 mb-8">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 transition",
              pathname === item.href && "bg-blue-100 text-blue-700 font-semibold"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t my-4" />

      {/* Secondary Navigation */}
      <nav className="flex flex-col gap-1 mb-auto">
        {secondaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 transition",
              pathname === item.href && "bg-blue-100 text-blue-700 font-semibold"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* Divider before user button */}
      <div className="border-t my-4" />
      
      {/* User Button */}
      <div className="mt-auto">
        <DashboardUserButton />
      </div>
    </aside>
  )
}