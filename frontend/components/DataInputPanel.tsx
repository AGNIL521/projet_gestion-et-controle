'use client';

import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';

interface DataInputProps {
  onUpdate: (revenue: number, target: number) => Promise<void>;
  isLoading: boolean;
}

const DataInputPanel: React.FC<DataInputProps> = ({ onUpdate, isLoading }) => {
  const [revenue, setRevenue] = useState<string>('15000');
  const [target, setTarget] = useState<string>('15000');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(Number(revenue), Number(target));
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-yellow-500 text-white p-4 rounded-full shadow-lg hover:bg-yellow-600 transition-all z-50 flex items-center gap-2"    
      >
        <Settings className="w-6 h-6" />
        <span className="font-medium">Adjust Data</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manual Data Entry</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Month Revenue ($)
            </label>
            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. 12500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Revenue ($)
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. 15000"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : (
                <>
                  <Save className="w-5 h-5" />
                  Apply Changes
                </>
              )}
            </button>
          </div>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            This will update the latest data point and recalibrate the AI forecast.
          </p>
        </form>
      </div>
    </div>
  );
};

export default DataInputPanel;
