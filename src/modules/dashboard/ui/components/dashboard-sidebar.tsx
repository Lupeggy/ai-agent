"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BotIcon, Video, ArrowUpCircle } from "lucide-react"

const mainNav = [
  { label: "Meetings", href: "/dashboard/meetings", icon: <Video size={20} /> },
  { label: "Agents", href: "/dashboard/agents", icon: <BotIcon size={20} /> },
]

const secondaryNav = [
  { label: "Upgrades", href: "/dashboard/upgrades", icon: <ArrowUpCircle size={20} /> },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r min-h-screen py-8 px-4 shadow-sm">
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
      <nav className="flex flex-col gap-1">
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
    </aside>
  )
}