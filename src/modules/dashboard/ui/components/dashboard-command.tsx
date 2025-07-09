"use client"

import { useState, useEffect, Dispatch, SetStateAction } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command"

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const SEARCH_PAGES = [
  {
    title: "Meetings",
    href: "/dashboard/meetings",
    category: "Navigation"
  },
  {
    title: "Agents",
    href: "/dashboard/agents",
    category: "Navigation"
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    category: "Account"
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    category: "Account"
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    category: "Account"
  },
  {
    title: "Upgrades",
    href: "/dashboard/upgrades",
    category: "Account"
  }
]

export const DashboardCommand = ({open, setOpen}: Props) => {
  const router = useRouter()
  const [search, setSearch] = useState("")
  
  // Setup keyboard shortcut (CMD+K or CTRL+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, setOpen])
  
  const filteredPages = search.length > 0
    ? SEARCH_PAGES.filter(page => 
        page.title.toLowerCase().includes(search.toLowerCase()))
    : SEARCH_PAGES
  
  const navigateTo = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {filteredPages
            .filter(page => page.category === "Navigation")
            .map(page => (
              <CommandItem 
                key={page.href}
                onSelect={() => navigateTo(page.href)}
              >
                {page.title}
              </CommandItem>
            ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Account">
          {filteredPages
            .filter(page => page.category === "Account")
            .map(page => (
              <CommandItem 
                key={page.href}
                onSelect={() => navigateTo(page.href)}
              >
                {page.title}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}