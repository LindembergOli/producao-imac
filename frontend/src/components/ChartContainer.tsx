import React from 'react';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
}

const ChartContainer: React.FC<ChartContainerProps> = React.memo(({ title, children }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg dark:shadow-2xl border border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 hover:shadow-xl dark:hover:shadow-2xl">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h3>
      {/* Using 99% width prevents the ResizeObserver loop limit exceeded error common in Recharts */}
      <div className="h-[300px] w-[99%] relative overflow-visible mx-auto">
        {children}
      </div>
    </div>
  );
});

export default ChartContainer;