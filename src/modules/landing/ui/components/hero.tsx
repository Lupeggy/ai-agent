"use client"

import Link from "next/link"

export const Hero = () => {
  return (
    <section className="w-full bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center min-h-[85vh]">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-gray-900">
                Supercharge Your Workflow with AI Meetings & Agents
              </h1>
              <p className="max-w-[600px] text-gray-600 md:text-xl">
                Automate your meetings, streamline your tasks, and unlock unprecedented productivity. Let our AI do the heavy lifting for you.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            <p className="relative text-5xl font-bold text-white">Your AI Assistant</p>
          </div>
        </div>
      </div>
    </section>
  )
}
