"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="flex items-center text-blue-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">My Agents</h1>
      
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-xl mb-4">This is the agents page</p>
        <p className="text-gray-500">Your agents will appear here</p>
      </div>
    </div>
  );
}
