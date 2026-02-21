import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaArrowUp, FaArrowDown, FaMinus, FaTrophy, FaChartLine } from 'react-icons/fa';

const PerformanceGraph = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'monthly'

  // Handle both old format (array) and new format (object)
  const normalizedData = useMemo(() => {
    if (!data) return null;
    
    // New format: object with individualAttempts, monthlyTrends, statistics
    if (data.individualAttempts || data.monthlyTrends) {
      return {
        individualAttempts: data.individualAttempts || [],
        monthlyTrends: data.monthlyTrends || [],
        statistics: data.statistics || {}
      };
    }
    
    // Old format: array of monthly trends
    if (Array.isArray(data) && data.length > 0) {
      return {
        individualAttempts: [],
        monthlyTrends: data,
        statistics: {
          totalAttempts: data.reduce((sum, item) => sum + (item.examsCount || 0), 0),
          avgPercentage: data.length > 0 
            ? data.reduce((sum, item) => sum + (item.percentage || 0), 0) / data.length 
            : 0,
          bestScore: data.length > 0 ? Math.max(...data.map(d => d.percentage || 0)) : 0,
          recentScore: data.length > 0 ? data[data.length - 1]?.percentage || 0 : 0
        }
      };
    }
    
    return null;
  }, [data]);

  if (!normalizedData || 
      (normalizedData.individualAttempts.length === 0 && normalizedData.monthlyTrends.length === 0)) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
        <FaChartLine className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">No performance data available</p>
        <p className="text-xs mt-1">Complete tests to see your performance trends</p>
      </div>
    );
  }

  const individualAttempts = normalizedData.individualAttempts || [];
  const monthlyTrends = normalizedData.monthlyTrends || [];
  const statistics = normalizedData.statistics || {};

  // Use individual attempts for detailed view, monthly for trend view
  const displayData = viewMode === 'individual' ? individualAttempts : monthlyTrends;
  const isIndividual = viewMode === 'individual';

  // Prepare data for graph
  const percentages = displayData.map(d => d.percentage);
  const maxPercentage = Math.max(...percentages, 100);
  const minPercentage = Math.min(...percentages, 0);
  const range = maxPercentage - minPercentage || 100;
  const padding = 40;
  const graphHeight = 280;
  const graphWidth = Math.max(600, displayData.length * 60);

  // Calculate points for line graph
  const points = displayData.map((item, index) => {
    const x = padding + (displayData.length > 1 
      ? (index / (displayData.length - 1)) * (graphWidth - padding * 2)
      : (graphWidth - padding * 2) / 2);
    const normalizedPercentage = range > 0 ? (item.percentage - minPercentage) / range : 0.5;
    const y = padding + graphHeight - (normalizedPercentage * graphHeight);
    return { 
      x, 
      y, 
      ...item,
      index 
    };
  });

  // Create smooth path for line
  const createSmoothPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (next) {
        // Use quadratic bezier for smooth curves
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) * 0.5;
        const cp2y = curr.y;
        path += ` Q ${cp1x} ${cp1y}, ${(curr.x + cp2x) / 2} ${(curr.y + cp2y) / 2}`;
      } else {
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  const pathData = createSmoothPath(points);

  // Format date labels
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isIndividual) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      const [year, month] = dateStr.split('-');
      return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
    }
  };

  // Calculate trend indicators
  const getTrendIndicator = (index) => {
    if (index === 0) return null;
    const current = displayData[index].percentage;
    const previous = displayData[index - 1].percentage;
    const diff = current - previous;
    
    if (Math.abs(diff) < 0.1) {
      return <FaMinus className="w-3 h-3 text-slate-400" />;
    } else if (diff > 0) {
      return <FaArrowUp className="w-3 h-3 text-green-500" />;
    } else {
      return <FaArrowDown className="w-3 h-3 text-red-500" />;
    }
  };

  // Get color based on percentage
  const getColor = (percentage) => {
    if (percentage >= 80) return '#10b981'; // green
    if (percentage >= 60) return '#3b82f6'; // blue
    if (percentage >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div className="w-full">
      {/* Header with Statistics */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-semibold text-slate-700">Performance Overview</h3>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Total Tests:</span>
              <span className="font-semibold text-slate-900">{statistics.totalAttempts || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Average:</span>
              <span className="font-semibold text-sky-600">{statistics.avgPercentage?.toFixed(1) || 0}%</span>
            </div>
            {statistics.bestScore > 0 && (
              <div className="flex items-center gap-2">
                <FaTrophy className="text-amber-500" />
                <span className="text-slate-500">Best:</span>
                <span className="font-semibold text-amber-600">{statistics.bestScore.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'individual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tests
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              viewMode === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Graph Container */}
      <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 p-6">
        <div className="overflow-x-auto">
          <svg
            width={graphWidth}
            height={graphHeight + padding * 2}
            className="w-full"
            viewBox={`0 0 ${graphWidth} ${graphHeight + padding * 2}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((value) => {
              if (value < minPercentage || value > maxPercentage) return null;
              const normalizedValue = range > 0 ? (value - minPercentage) / range : 0.5;
              const y = padding + graphHeight - (normalizedValue * graphHeight);
              return (
                <g key={value}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={graphWidth - padding}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-slate-500"
                    fontSize="11"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            {/* Area gradient under curve */}
            {points.length > 1 && (
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            )}

            {/* Area under curve */}
            {points.length > 1 && (
              <path
                d={`${pathData} L ${points[points.length - 1].x} ${padding + graphHeight} L ${points[0].x} ${padding + graphHeight} Z`}
                fill="url(#areaGradient)"
              />
            )}

            {/* Main performance line */}
            {points.length > 0 && (
              <motion.path
                d={pathData}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            )}

            {/* Data points with hover effects */}
            {points.map((point, index) => {
              const color = getColor(point.percentage);
              const isHovered = hoveredIndex === index;
              
              return (
                <g key={index}>
                  {/* Hover line */}
                  {isHovered && (
                    <line
                      x1={point.x}
                      y1={padding}
                      x2={point.x}
                      y2={padding + graphHeight}
                      stroke={color}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      opacity="0.5"
                    />
                  )}
                  
                  {/* Point circle */}
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 6 : 4}
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  />
                  
                  {/* Hover tooltip */}
                  {isHovered && (
                    <g>
                      <rect
                        x={point.x - 60}
                        y={point.y - 70}
                        width="120"
                        height="60"
                        rx="8"
                        fill="white"
                        stroke={color}
                        strokeWidth="2"
                        filter="url(#shadow)"
                      />
                      <text
                        x={point.x}
                        y={point.y - 50}
                        textAnchor="middle"
                        className="text-xs font-semibold fill-slate-900"
                        fontSize="11"
                      >
                        {point.testTitle || formatDate(point.date || point.month)}
                      </text>
                      <text
                        x={point.x}
                        y={point.y - 35}
                        textAnchor="middle"
                        className="text-sm font-bold"
                        fill={color}
                        fontSize="14"
                      >
                        {point.percentage.toFixed(1)}%
                      </text>
                      {isIndividual && (
                        <text
                          x={point.x}
                          y={point.y - 20}
                          textAnchor="middle"
                          className="text-xs fill-slate-600"
                          fontSize="10"
                        >
                          {point.marksObtained}/{point.marksPossible} marks
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Shadow filter for tooltip */}
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
              </filter>
            </defs>
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-4 px-2">
          {displayData.map((item, index) => {
            const trend = getTrendIndicator(index);
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1"
                style={{ flex: 1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex items-center gap-1">
                  {trend}
                  <span className="text-xs text-slate-600 font-medium">
                    {isIndividual ? formatDate(item.date || item.submittedAt) : formatDate(item.month)}
                  </span>
                </div>
                {isIndividual && (
                  <span className="text-xs text-slate-500">
                    {item.percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Performance List */}
      {isIndividual && individualAttempts.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Tests</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {individualAttempts.slice(0, 5).map((attempt, index) => {
              const color = getColor(attempt.percentage);
              const trend = index > 0 ? getTrendIndicator(index) : null;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {attempt.testTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {attempt.date ? new Date(attempt.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {trend && <div className="text-slate-400">{trend}</div>}
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color }}>
                        {attempt.percentage.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">
                        {attempt.marksObtained}/{attempt.marksPossible}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceGraph;
