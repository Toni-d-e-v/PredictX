import React, { useState } from 'react';
import { simulateContract, writeContract } from '@wagmi/core';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract';
import { config } from '@/config/wagmi';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateMarketModal({ isOpen, onClose }: CreateMarketModalProps) {
  const [description, setDescription] = useState('');
  const [endDateTime, setEndDateTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  // Calculate duration in seconds from now until the selected end date/time
  const calculateDuration = () => {
    const selectedDate = new Date(endDateTime);
    const now = new Date();
    const durationMs = selectedDate.getTime() - now.getTime();
    return Math.floor(durationMs / 1000); // Convert to seconds
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    const duration = calculateDuration();
    
    if (duration <= 0) {
      setError('End time must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { request } = await simulateContract(config, {
        abi: CONTRACT_ABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'createMarket',
        args: [description, BigInt(duration)],
        account: address as `0x${string}`,
      });

      if (!request) {
        throw new Error('Failed to simulate contract call');
      }

      const hash = await writeContract(config, request);
      console.log('Transaction Hash:', hash);
      onClose();
      
    } catch (err) {
      console.error('Error creating market:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the market');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Set minimum datetime to now
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create New Market</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="What is the market about?"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 font-medium">End Date and Time</label>
            <input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              min={minDateTime}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isConnected}
            >
              {isLoading ? 'Creating...' : 'Create Market'}
            </button>
          </div>

          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default CreateMarketModal;