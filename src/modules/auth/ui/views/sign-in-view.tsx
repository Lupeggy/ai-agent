"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import Image from "next/image"
import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export const SignInView = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })
      
      if (result.data) {
        // Success - redirect to main page
        router.push("/")
      } else if (result.error) {
        // Handle specific auth errors
        if (result.error.message?.includes("Invalid")) {
          setError("Invalid email or password. Please check your credentials.")
        } else if (result.error.message?.includes("not found")) {
          setError("No account found with this email address.")
        } else {
          setError("Invalid email or password.")
        }
      }
    } catch (error: any) {
      console.error("Sign in failed:", error)
      if (error.message?.includes("Invalid")) {
        setError("Invalid email or password. Please check your credentials.")
      } else if (error.message?.includes("not found")) {
        setError("No account found with this email address.")
      } else {
        setError("Failed to sign in. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-xl rounded-2xl border-0 p-0">
      <CardHeader className="flex flex-col items-center gap-2 pb-2">
        <Image src="/logo.svg" alt="Company Logo" width={56} height={56} className="mb-2 rounded-full shadow" />
        <CardTitle className="text-2xl font-bold text-center">Sign in to Your Account</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Welcome back! Please sign in to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 justify-center font-semibold"
          type="button"
          onClick={() => {
            authClient.signIn.social({
                provider: "google",
            })
          }}
          disabled={isLoading}
        >
          <FcGoogle size={22} /> Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 justify-center font-semibold"
          type="button"
          onClick={() => {
            authClient.signIn.social({
                provider: "github",
            })
          }}
          disabled={isLoading}
        >
          <FaGithub size={20} /> Continue with GitHub
        </Button>
        <div className="flex items-center gap-2 py-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or continue with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <div>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 items-center pb-4">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-primary hover:underline">Sign up</Link>
        </p>
      </CardFooter>
    </Card>
  )
}