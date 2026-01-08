'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Legend 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Moon, Sun, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ScenarioSelector from './ScenarioSelector';
import InsightsPanel from './InsightsPanel';
import DataInputPanel from './DataInputPanel';
import DataUploadButton from './DataUploadButton';
import { PredictionResponse, StatusResponse, SalesRecord } from '../types';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [history, setHistory] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("growth");
  const [modelType, setModelType] = useState("linear");
  const [darkMode, setDarkMode] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      const predRes = await fetch(`http://localhost:8000/api/predict?model_type=${modelType}`);
      const predData = await predRes.json();
      setPrediction(predData);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [modelType]);

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

  // Handle PDF Export
  const handleExportPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) {
        alert('Error: Dashboard element not found');
        return;
    }

    try {
      console.log('Starting PDF export...');
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true, // Handle external images if any
        logging: true, // Help debug issues
        backgroundColor: darkMode ? '#111827' : '#f9fafb', // Match background color
      });

      console.log('Canvas generated, creating PDF...');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 landscape width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('perfoptima-report.pdf');
      console.log('PDF saved successfully');
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert(`PDF Export Failed: ${error instanceof Error ? error.message : String(error)}`);
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
    <div id="dashboard-content" className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">PerfOptima AI</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Intelligent Organizational Control System</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
             <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
              Demo Mode: <span className="text-indigo-600 dark:text-indigo-400">v2.0 (Live Simulation)</span>
            </div>
            
            <button 
              onClick={handleExportPDF}
              className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Export Report"
            >
              <Download className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <DataUploadButton onUploadSuccess={fetchData} isLoading={loading} />
            <button 
                onClick={onLogout}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-sm font-medium transition-colors"
            >
                Sign Out
            </button>
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
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Revenue</p>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${status?.current_month_revenue.toLocaleString()}
                    </h3>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Gap</p>
                    </div>
                    <h3 className={`text-2xl font-bold ${status && status.performance_gap >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {status && status.performance_gap >= 0 ? '+' : ''}{status?.performance_gap}%
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
                    <div className="flex items-center space-x-3 mb-2">
                         <div className="p-2 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Forecast</p>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${prediction?.next_month_revenue_forecast.toLocaleString()}
                    </h3>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between transition-colors">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${prediction && prediction.confidence_score > 0.7 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
                            {prediction && prediction.confidence_score > 0.7 ? (
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Risk Score</p>
                    </div>
                     <h3 className={`text-2xl font-bold ${prediction && prediction.confidence_score > 0.7 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {prediction ? Math.round((1 - prediction.confidence_score) * 100) : 0}/100
                    </h3>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-[500px] transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Revenue Trajectory & Forecast</h3>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">AI Model:</span>
                        <select 
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value)}
                            className="text-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-indigo-300 p-1 text-gray-900 dark:text-white"
                        >
                            <option value="linear">Linear Regression (Standard)</option>
                            <option value="polynomial">Polynomial AI (Curved Trends)</option>
                            <option value="polynomial_high">Complex AI (High Sensitivity)</option>
                        </select>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#374151" : "#f3f4f6"} />
                        <XAxis dataKey="date" stroke={darkMode ? "#9ca3af" : "#9ca3af"} tick={{fontSize: 12}} />
                        <YAxis stroke={darkMode ? "#9ca3af" : "#9ca3af"} tick={{fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', color: darkMode ? '#fff' : '#000' }}
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-4">System Architecture</h4>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium">Python FastAPI</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium">Scikit-Learn</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium">Next.js 14</span>
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full font-medium">Recharts</span>
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
