import { Bot, CalendarCheck, Zap } from 'lucide-react'

export const Features = () => {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600">
            Key Features
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900">
            The Future of Productivity is Here
          </h2>
          <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Our platform combines intelligent meeting automation with powerful AI agents to transform the way you work.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
          <div className="grid gap-4 p-6 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <CalendarCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">AI-Powered Meetings</h3>
            </div>
            <p className="text-gray-600">
              Automated scheduling, real-time transcription, and intelligent summaries for every meeting.
            </p>
          </div>
          <div className="grid gap-4 p-6 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Intelligent Agents</h3>
            </div>
            <p className="text-gray-600">
              Deploy autonomous AI agents to handle research, data analysis, and other complex tasks 24/7.
            </p>
          </div>
          <div className="grid gap-4 p-6 rounded-xl bg-gray-50 border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Seamless Integration</h3>
            </div>
            <p className="text-gray-600">
              Connect with your favorite tools and platforms to create a fully automated and unified workflow.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
