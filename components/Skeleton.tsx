import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const baseStyles = 'skeleton';
  
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%'),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

// Pre-built skeleton layouts for common use cases
export const StatCardSkeleton: React.FC = () => (
  <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="text" width="60%" height={12} />
      <Skeleton variant="circular" width={20} height={20} />
    </div>
    <div className="space-y-2">
      <Skeleton variant="rounded" width="80%" height={40} />
      <Skeleton variant="text" width="50%" height={10} />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton variant="rounded" width={200} height={24} />
        <Skeleton variant="text" width={150} height={12} />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={60} height={28} />
        <Skeleton variant="rounded" width={60} height={28} />
        <Skeleton variant="rounded" width={60} height={28} />
      </div>
    </div>
    <div className="flex items-end justify-between gap-4 h-64 pt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton 
            variant="rounded" 
            width="100%" 
            height={`${Math.random() * 60 + 40}%`} 
          />
          <Skeleton variant="text" width="80%" height={10} />
        </div>
      ))}
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <div className="flex items-center gap-4 p-4 border-b border-slate-800/50">
    <Skeleton variant="circular" width={40} height={40} />
    {Array.from({ length: columns - 1 }).map((_, i) => (
      <div key={i} className="flex-1">
        <Skeleton variant="text" width={`${Math.random() * 40 + 40}%`} height={14} />
      </div>
    ))}
  </div>
);

export const PlayerCardSkeleton: React.FC = () => (
  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
    <div className="flex gap-2">
      <Skeleton variant="rounded" width="33%" height={24} />
      <Skeleton variant="rounded" width="33%" height={24} />
      <Skeleton variant="rounded" width="33%" height={24} />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto space-y-8 animate-in">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <Skeleton variant="rounded" width={150} height={32} />
      <Skeleton variant="text" width={120} height={14} />
    </div>
    
    {/* Stats grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Main content */}
    <div className="grid lg:grid-cols-12 gap-6 md:gap-8">
      <div className="lg:col-span-8 space-y-6">
        <ChartSkeleton />
        
        {/* Roadmap skeleton */}
        <div className="p-6 rounded-[2.5rem] bg-slate-900/50 border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <Skeleton variant="rounded" width={140} height={18} />
            <Skeleton variant="rounded" width={80} height={24} />
          </div>
          <div className="flex justify-between gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="circular" width={40} height={40} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 space-y-6">
          <Skeleton variant="rounded" width="60%" height={18} />
          <div className="space-y-4">
            <Skeleton variant="rounded" width="100%" height={100} />
            <Skeleton variant="rounded" width="100%" height={40} />
          </div>
        </div>
        
        <div className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 space-y-4">
          <Skeleton variant="rounded" width="50%" height={18} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="text" width="40%" height={12} />
                <Skeleton variant="text" width="15%" height={12} />
              </div>
              <Skeleton variant="rounded" width="100%" height={6} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;
