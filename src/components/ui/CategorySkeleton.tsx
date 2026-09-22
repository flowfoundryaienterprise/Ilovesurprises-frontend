import React from 'react';
import { Skeleton } from './Skeleton';

export interface CategorySkeletonProps {
  className?: string;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`p-2 min-[375px]:p-2.5 sm:p-4 rounded-[16px] sm:rounded-[20px] border border-[#eee7ed] bg-white flex flex-col items-center text-center shadow-[0_4px_16px_rgba(50,31,63,0.03)] select-none ${className}`}
    >
      {/* Category Image Box Skeleton */}
      <div className="w-13 h-13 min-[375px]:w-15 min-[375px]:h-15 sm:w-20 sm:h-20 rounded-[14px] sm:rounded-[16px] overflow-hidden bg-gray-700 skeleton-shimmer mb-1.5 sm:mb-3" />

      {/* Category Title Skeleton */}
      <Skeleton className="h-3 w-14 sm:h-3.5 sm:w-20 rounded-md mb-1 sm:mb-1.5" />

      {/* Category Tagline Skeleton */}
      <Skeleton className="h-2 w-16 sm:h-2.5 sm:w-24 rounded-md" />
    </div>
  );
};

export default CategorySkeleton;
