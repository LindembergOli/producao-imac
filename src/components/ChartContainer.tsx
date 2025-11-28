import React from 'react';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h3>
      {/* Using 99% width prevents the ResizeObserver loop limit exceeded error common in Recharts */}
      <div className="h-[300px] w-[99%] relative overflow-hidden mx-auto">
         {children}
      </div>
    </div>
  );
};

export default ChartContainer;