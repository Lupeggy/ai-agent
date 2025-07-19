import Link from "next/link"

export const Footer = () => {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
      <p className="text-sm text-gray-600">&copy; 2024 AI Meetings & Agents. All rights reserved.</p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link href="#" className="text-sm hover:underline underline-offset-4 text-gray-700" prefetch={false}>
          Terms of Service
        </Link>
        <Link href="#" className="text-sm hover:underline underline-offset-4 text-gray-700" prefetch={false}>
          Privacy
        </Link>
      </nav>
    </footer>
  )
}
