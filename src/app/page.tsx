"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Home() {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // If user is logged in, show success message
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl rounded-2xl border-0 p-0">
          <CardHeader className="flex flex-col items-center gap-2 pb-2">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              ✅ You're Signed In!
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-center">
            <div className="space-y-2">
              <p className="text-lg">Welcome back, <strong>{user.name || user.email}</strong>!</p>
              <p className="text-gray-600">You are successfully authenticated.</p>
            </div>
            
            <div className="space-y-2 text-left">
              <h3 className="font-semibold">Your Information:</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.name || "Not provided"}</p>
              <p><strong>User ID:</strong> {user.id}</p>
            </div>

            <Button onClick={handleSignOut} variant="outline" className="mt-4">
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If not logged in, redirect to sign-in page
  router.push("/sign-in")
  return null
}
