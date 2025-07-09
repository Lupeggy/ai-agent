"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { GeneratedAvatar } from "@/components/generated-avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const DashboardUserButton = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession()
        if (session?.data?.user) {
          setUser(session.data.user)
        }
      } catch (error) {
        console.error("Failed to get session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      setUser(null)
      router.push("/sign-in")
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <Button 
        variant="ghost" 
        className="w-full justify-start gap-2" 
        onClick={() => router.push("/sign-in")}
      >
        <User size={18} />
        <span>Sign in</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full p-2 justify-start gap-2">
          <GeneratedAvatar 
            seed={user.email || user.name || "User"} 
            className="h-8 w-8" 
            variant="botttsNeutral"
          />
          <div className="flex flex-col items-start text-left overflow-hidden">
            <span className="font-medium text-sm truncate max-w-[120px]">
              {user.name || "User"}
            </span>
            {user.email && (
              <span className="text-xs text-gray-500 truncate max-w-[120px]">
                {user.email}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/billing")}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>Billing</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}