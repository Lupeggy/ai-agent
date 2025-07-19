import Link from 'next/link'

export const Cta = () => {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32">
      <div className="container mx-auto grid items-center justify-center gap-4 px-4 text-center md:px-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-gray-900">
            Ready to Revolutionize Your Workflow?
          </h2>
          <p className="mx-auto max-w-[600px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Sign up today and experience the power of AI automation. No credit card required.
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-2">
          <Link
            href="/sign-up"
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow-lg transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>
    </section>
  )
}
