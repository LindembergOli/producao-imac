import React from 'react';
import { LucideProps } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  unit: string;
  icon?: React.ReactElement<LucideProps>;
  color?: string;
  enableWrap?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = React.memo(({ title, value, unit, icon, color, enableWrap }) => {
  // Convert hex color to RGB for gradient effects
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result && result[1] && result[2] && result[3]) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      };
    }
    return { r: 217, g: 155, b: 97 }; // Default color
  };

  const safeColor = color || '#D99B61'; // Default color if undefined
  const rgb = hexToRgb(safeColor);

  return (
    <div
      className="relative bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg dark:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl overflow-hidden h-full group"
    >
      {/* Gradient overlay - only visible in dark mode */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-10"
        style={{
          background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 0%, transparent 60%)`
        }}
      />

      {/* Glow effect on hover - only visible in dark mode */}
      <div
        className="absolute inset-0 opacity-0 dark:group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at top left, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) 0%, transparent 50%)`
        }}
      />

      <div className="relative p-4 flex items-center gap-4 h-full">
        {icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md dark:shadow-lg transition-all duration-300 group-hover:scale-110"
            style={{
              backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
              color: safeColor
            }}
          >
            {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
          </div>
        )}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 leading-tight">
            {title}
          </p>
          <div className="flex items-baseline gap-1 flex-wrap">
            <p
              className={`text-sm sm:text-base lg:text-lg font-extrabold leading-snug ${enableWrap ? 'break-words' : 'whitespace-nowrap truncate'}`}
              style={{ color: safeColor }}
              title={value}
            >
              {value}
            </p>
            {unit && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
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