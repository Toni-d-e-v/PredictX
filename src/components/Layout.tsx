'use client'

import { ConnectButton } from './ConnectButton'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-xl font-bold">PredictX</div>
          <ConnectButton />
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}