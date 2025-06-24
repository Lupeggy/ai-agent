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

export const SignUpView = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const router = useRouter()

  // Real-time validation functions
  const validateName = (value: string) => {
    if (value.length < 2) {
      return "Name must be at least 2 characters long"
    }
    return ""
  }

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address"
    }
    return ""
  }

  const validatePassword = (value: string) => {
    if (value.length < 6) {
      return "Password must be at least 6 characters long"
    }
    if (!/(?=.*[a-zA-Z])/.test(value)) {
      return "Password must contain at least one letter"
    }
    return ""
  }

  const validateConfirmPassword = (value: string, originalPassword: string) => {
    if (value !== originalPassword) {
      return "Passwords do not match"
    }
    return ""
  }

  // Handle input changes with validation
  const handleNameChange = (value: string) => {
    setName(value)
    setFieldErrors(prev => ({ ...prev, name: validateName(value) }))
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setFieldErrors(prev => ({ ...prev, email: validateEmail(value) }))
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const passwordError = validatePassword(value)
    const confirmError = confirmPassword ? validateConfirmPassword(confirmPassword, value) : ""
    setFieldErrors(prev => ({ 
      ...prev, 
      password: passwordError,
      confirmPassword: confirmError 
    }))
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setFieldErrors(prev => ({ 
      ...prev, 
      confirmPassword: validateConfirmPassword(value, password) 
    }))
  }

  const handleSocial = async (provider: "google" | "github") => {
    setIsLoading(true)
    setError("")
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/"
      })
    } catch (error) {
      console.error("Social sign up failed:", error)
      setError("Failed to sign up with " + provider)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    // Validate all fields
    const nameError = validateName(name)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password)
    
    setFieldErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    })
    
    // If any field has errors, don't submit
    if (nameError || emailError || passwordError || confirmPasswordError) {
      setIsLoading(false)
      setError("Please fix the errors above before submitting.")
      return
    }
    
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      })
      
      if (result.data) {
        // Success - redirect to main page
        router.push("/")
      } else if (result.error) {
        if (result.error.message?.includes("already exists")) {
          setError("An account with this email already exists. Please sign in instead.")
        } else {
          setError("Failed to create account. Please try again.")
        }
      }
    } catch (error: any) {
      console.error("Sign up failed:", error)
      if (error.message?.includes("already exists")) {
        setError("An account with this email already exists. Please sign in instead.")
      } else {
        setError("Failed to create account. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-xl rounded-2xl border-0 p-0">
      <CardHeader className="flex flex-col items-center gap-2 pb-2">
        <Image src="/logo.svg" alt="Company Logo" width={56} height={56} className="mb-2 rounded-full shadow" />
        <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Join us by filling in your information below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 justify-center font-semibold"
          type="button"
          onClick={() => handleSocial("google")}
          disabled={isLoading}
        >
          <FcGoogle size={22} /> Continue with Google
        </Button>
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 justify-center font-semibold"
          type="button"
          onClick={() => handleSocial("github")}
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
              id="name"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
            {fieldErrors.name && <div className="text-red-500 text-xs mt-1">{fieldErrors.name}</div>}
          </div>
          <div>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
            {fieldErrors.email && <div className="text-red-500 text-xs mt-1">{fieldErrors.email}</div>}
          </div>
          <div>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
            {fieldErrors.password && <div className="text-red-500 text-xs mt-1">{fieldErrors.password}</div>}
          </div>
          <div>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
            {fieldErrors.confirmPassword && <div className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</div>}
          </div>
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 items-center pb-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link>
        </p>
      </CardFooter>
    </Card>
  )
}