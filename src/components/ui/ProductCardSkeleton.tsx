import React from 'react';
import { Skeleton } from './Skeleton';

export interface ProductCardSkeletonProps {
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[16px] sm:rounded-[20px] bg-white border border-[#eee7ed] p-2.5 sm:p-3.5 flex flex-col justify-between shadow-[0_2px_10px_rgba(50,31,63,0.03)] overflow-hidden max-w-full select-none ${className}`}
    >
      {/* Product Image Skeleton (Exact aspect-square with 12px/14px radius) */}
      <div className="relative w-full max-w-full aspect-square rounded-[12px] sm:rounded-[14px] overflow-hidden bg-gray-700 skeleton-shimmer mb-2 sm:mb-2.5 flex items-center justify-center isolate" />

      {/* Product Information Skeleton */}
      <div className="px-0.5 sm:px-1 pt-1 sm:pt-1.5 flex flex-col flex-1 justify-between">
        <div>
          {/* Rating & Category Row Skeleton */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16 rounded-full" />
            <Skeleton className="h-2.5 sm:h-3 w-8 sm:w-10 rounded-full" />
          </div>

          {/* Product Title Skeleton (2 Lines matching min-height) */}
          <div className="min-h-[1.9rem] sm:min-h-[2.1rem] space-y-1 sm:space-y-1.5 mb-1">
            <Skeleton className="h-3 sm:h-3.5 w-full rounded-md" />
            <Skeleton className="h-3 sm:h-3.5 w-3/4 rounded-md" />
          </div>
        </div>

        {/* Price & Quick ADD Button Row Skeleton */}
        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-[#f5edf2] flex items-center justify-between gap-1">
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <Skeleton className="h-3.5 sm:h-4 w-10 sm:w-14 rounded-md" />
            <Skeleton className="h-2 sm:h-2.5 w-7 sm:w-9 rounded-md" />
          </div>

          {/* ADD Button Placeholder */}
          <Skeleton className="h-[28px] sm:h-[34px] w-12 sm:w-16 rounded-[8px] sm:rounded-[10px]" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
