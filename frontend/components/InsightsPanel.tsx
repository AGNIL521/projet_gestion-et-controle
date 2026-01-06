'use client';

import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface InsightsProps {
  prediction: {
    next_month_revenue_forecast: number;
    confidence_score: number;
    trend: string;
    alert: string | null;
  } | null;
  scenario: string;
}

const getRecommendation = (scenario: string, trend: string) => {
  if (scenario === 'growth') return "Aggressive expansion recommended. Increase inventory levels by 15% to prevent stockouts during this uptrend.";
  if (scenario === 'decline') return "Cost-optimization protocol initiated. Review overheads and freeze non-essential hiring immediately.";
  if (scenario === 'seasonal') return "Peak season approaching. Align marketing spend with historical high-points. Prepare temporary staffing.";
  if (scenario === 'volatile') return "High uncertainty detected. Shift to just-in-time procurement to minimize risk exposure. Preserve cash flow.";
  return "Maintain current operational parameters. Monitor daily KPIs for shifts.";
};

const InsightsPanel: React.FC<InsightsProps> = ({ prediction, scenario }) => {
  if (!prediction) return null;

  const recommendation = getRecommendation(scenario, prediction.trend);

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-800 text-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm">
            <Lightbulb className="w-6 h-6 text-yellow-300" />
            </div>
            <h3 className="text-xl font-bold tracking-wide">AI Strategic Insights</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded text-indigo-200">
            {scenario} Mode
        </span>
      </div>

      <div className="space-y-6">
        {/* Core Analysis */}
        <div className="space-y-2">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">Market Trajectory</p>
          <div className="flex items-start space-x-3">
             {prediction.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-400 mt-1" />}
             {prediction.trend === 'down' && <TrendingDown className="w-5 h-5 text-red-400 mt-1" />}
             {prediction.trend === 'stable' && <div className="w-5 h-5 bg-gray-500 rounded-full mt-1 opacity-50" />}
             
             <p className="text-sm leading-relaxed text-gray-100">
               {prediction.trend === 'up' && "The predictive model indicates a strong positive momentum. Historical patterns suggest this growth is sustainable in the short term."}
               {prediction.trend === 'down' && "Revenue is trending downwards. The model has detected a consistent decline that deviates from the target baseline."}
               {prediction.trend === 'stable' && "Market performance is stable with no significant volatility. Revenue is tracking close to the moving average."}
             </p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-indigo-200 text-xs font-semibold uppercase">Confidence Level</span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${prediction.confidence_score > 0.8 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
              {(prediction.confidence_score * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${prediction.confidence_score > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${prediction.confidence_score * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Actionable Advice */}
        {prediction.alert && (
          <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="space-y-1">
              <span className="text-red-200 text-xs font-bold uppercase">Critical Alert</span>
              <p className="text-sm text-red-100">{prediction.alert}</p>
            </div>
          </div>
        )}
        
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <span className="text-indigo-300 text-xs font-bold uppercase block mb-1">Strategic Recommendation</span>
            <p className="text-sm text-indigo-100 italic">
               "{recommendation}"
            </p>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
