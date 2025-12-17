import React from 'react';
import { LucideProps } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  unit: string;
  icon?: React.ReactElement<LucideProps>;
  color: string;
  enableWrap?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = React.memo(({ title, value, unit, icon, color, enableWrap }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden h-full">
      <div className="p-4 flex items-center gap-4 h-full">
        {icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 leading-tight">
            {title}
          </p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p className={`text-sm sm:text-base lg:text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-snug ${enableWrap ? 'break-words' : 'whitespace-nowrap truncate'}`} title={value}>
              {value}
            </p>
            {unit && (
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {unit}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

KpiCard.displayName = 'KpiCard';

export default KpiCard;