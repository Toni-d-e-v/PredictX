'use client'

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { MarketsGrid } from '@/components/MarketsGrid'
import { CreateMarketModal } from '@/components/CreateMarketModal'

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">PredictX Markets</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create Market
          </button>
        </div>
        <MarketsGrid />
        <CreateMarketModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
      </div>
    </Layout>
  )
}