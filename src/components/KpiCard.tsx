import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  unit: string;
  icon?: React.ReactElement;
  color: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, icon, color }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {icon && (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${color}15`, color: color }}>
          {React.cloneElement(icon, { size: 24, strokeWidth: 2 })}
        </div>
      )}
      <div className="flex flex-col justify-center">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
        <div className="flex items-baseline space-x-1">
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
            {unit && <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">{unit}</p>}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;