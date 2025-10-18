
import React from "react";

// LinkedIn-like loading / skeleton screen
// TailwindCSS required in the host project

export default function LinkedInLoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top nav */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-sm flex items-center justify-center text-white font-bold">
              CU
            </div>
            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="h-8 max-w-md mx-auto bg-gray-200 rounded-full animate-pulse" />
          </div>

          <div className="flex items-center gap-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-12 gap-6">
        {/* Left rail */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </aside>

        {/* Feed */}
        <section className="col-span-12 md:col-span-8 lg:col-span-6">
          {/* Create post skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Multiple posts */}
          {Array.from({ length: 3 }).map((_, i) => (
            <article key={i} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </div>

                  <div className="mt-4 h-48 bg-gray-200 rounded animate-pulse" />

                  <div className="mt-4 flex items-center gap-6">
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Right rail */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse mb-2" />
                    <div className="h-2 w-1/2 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  );
}
