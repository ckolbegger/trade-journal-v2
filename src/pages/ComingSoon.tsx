interface ComingSoonProps {
  page: string
}

export function ComingSoon({ page }: ComingSoonProps) {
  return (
    <div className="text-center px-5 py-15 flex flex-col items-center justify-center min-h-[calc(100vh-140px)]">
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400 text-2xl">
        🚧
      </div>

      <h2 className="text-2xl font-semibold mb-3 text-gray-900">
        {page} Coming Soon
      </h2>

      <p className="text-base text-gray-600 mb-8 leading-relaxed max-w-[280px]">
        This feature is under development and will be available in a future update.
      </p>
    </div>
  )
}