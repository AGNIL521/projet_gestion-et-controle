'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import ScenarioSelector from './ScenarioSelector';
import InsightsPanel from './InsightsPanel';
import DataInputPanel from './DataInputPanel';

interface PredictionResponse {
  next_month_revenue_forecast: number;
  confidence_score: number;
  trend: "up" | "down" | "stable";
  alert: string | null;
}

interface StatusResponse {
  current_month_revenue: number;
  target: number;
  performance_gap: number;
}

interface SalesRecord {
  date: string;
  revenue: number;
  units_sold: number;
  region: string;
}

const Dashboard = () => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [history, setHistory] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("growth");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch History
      const histRes = await fetch('http://localhost:8000/api/history');
      const histData = await histRes.json();
      setHistory(histData);

      // 2. Fetch Status
      const statusRes = await fetch('http://localhost:8000/api/current-status');
      const statusData = await statusRes.json();
      setStatus(statusData);

      // 3. Fetch Prediction
      const predRes = await fetch('http://localhost:8000/api/predict');
      const predData = await predRes.json();
      setPrediction(predData);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Scenario Switch
  const handleScenarioChange = async (newScenario: string) => {
    setScenario(newScenario);
    setLoading(true);
    try {
      await fetch(`http://localhost:8000/api/scenario/${newScenario}`, { method: 'POST' });
      await fetchData(); // Refresh all data
    } catch (error) {
      console.error("Failed to switch scenario:", error);
      setLoading(false);
    }
  };

  // Handle Manual Data Update
  const handleManualUpdate = async (revenue: number, target: number) => {
    setLoading(true);
    try {
      await fetch('http://localhost:8000/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_revenue: revenue, target: target }),
      });
      await fetchData(); // Refresh to see impact
    } catch (error) {
      console.error("Failed to update data:", error);
      setLoading(false);
    }
  };

  // Prepare Chart Data
  const chartData = history.map(h => ({
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    revenue: h.revenue,
    target: status?.target || 15000,
  }));

  // Add Forecast Point
  if (prediction && history.length > 0) {
    const lastDate = new Date(history[history.length - 1].date);
    lastDate.setMonth(lastDate.getMonth() + 1);
    
    chartData.push({
        date: 'Forecast',
        revenue: prediction.next_month_revenue_forecast,
        target: status?.target || 15000,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">PerfOptima AI</h1>
          <p className="text-gray-500 mt-1">Intelligent Organizational Control System</p>
        </div>
        <div className="mt-4 md:mt-0 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
          Demo Mode: <span className="text-indigo-600">v2.0 (Live Simulation)</span>
        </div>
      </header>

      {/* Scenario Controller */}
      <section className="mb-8">
        <ScenarioSelector 
            currentScenario={scenario} 
            onSelect={handleScenarioChange} 
            isLoading={loading} 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Main Viz (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Revenue</p>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        ${status?.current_month_revenue.toLocaleString()}
                    </h3>
                </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Gap</p>
                    </div>
                    <h3 className={`text-2xl font-bold ${status && status.performance_gap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {status && status.performance_gap >= 0 ? '+' : ''}{status?.performance_gap}%
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center space-x-3 mb-2">
                         <div className="p-2 bg-orange-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Forecast</p>
                    </div>
                     <h3 className="text-2xl font-bold text-gray-900">
                        ${prediction?.next_month_revenue_forecast.toLocaleString()}
                    </h3>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${prediction && prediction.confidence_score > 0.7 ? 'bg-green-50' : 'bg-red-50'}`}>
                            {prediction && prediction.confidence_score > 0.7 ? (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Risk Score</p>
                    </div>
                     <h3 className={`text-2xl font-bold ${prediction && prediction.confidence_score > 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                        {prediction ? Math.round((1 - prediction.confidence_score) * 100) : 0}/100
                    </h3>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[500px]">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trajectory & Forecast</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" stroke="#9ca3af" tick={{fontSize: 12}} />
                        <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        
                        <Area type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="#4f46e5" strokeWidth={3} name="Revenue" />
                        <Line type="step" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Target" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Right Column: AI Insights (1/3 width) */}
        <div className="space-y-8">
            <InsightsPanel prediction={prediction} scenario={scenario} />
            
            {/* Tech Stack Badge (For the Teacher) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">System Architecture</h4>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Python FastAPI</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Scikit-Learn</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Next.js 14</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Recharts</span>
                </div>
            </div>
        </div>

      </div>

      {/* Manual Data Entry Overlay */}
      <DataInputPanel onUpdate={handleManualUpdate} isLoading={loading} />
    </div>
  );
};

export default Dashboard;
