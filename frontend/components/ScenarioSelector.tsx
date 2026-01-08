'use client';

import React from 'react';
import { RefreshCcw } from 'lucide-react';

interface ScenarioSelectorProps {
  currentScenario: string;
  onSelect: (scenario: string) => void;
  isLoading: boolean;
}

const scenarios = [
  { id: 'growth', label: 'Steady Growth', desc: 'Positive trend with minor noise' },
  { id: 'decline', label: 'Market Decline', desc: 'Downward trend requiring intervention' },
  { id: 'seasonal', label: 'Seasonal Peaks', desc: 'High variance due to holidays' },
  { id: 'volatile', label: 'High Volatility', desc: 'Unpredictable market conditions' },
];

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ currentScenario, onSelect, isLoading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Scenario Simulation</h3>
        {isLoading && <RefreshCcw className="w-4 h-4 text-indigo-500 animate-spin" />}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            disabled={isLoading}
            className={`text-left p-4 rounded-lg border transition-all duration-200 hover:shadow-md
              ${currentScenario === s.id 
                ? 'bg-indigo-50 dark:bg-indigo-900 border-indigo-500' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500'
              }
            `}
          >
            <div className={`font-semibold ${currentScenario === s.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {s.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScenarioSelector;
