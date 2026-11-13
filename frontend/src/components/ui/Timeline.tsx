'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock, Circle } from 'lucide-react';

interface TimelineItem {
  title: string;
  description?: string;
  date?: string;
  status: 'completed' | 'current' | 'pending';
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export default function Timeline({ items, className }: TimelineProps) {
  const getStatusIcon = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
            <Check className="h-4 w-4 text-white" />
          </div>
        );
      case 'current':
        return (
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center shadow-md animate-pulse-slow ring-4 ring-primary-100">
            <Clock className="h-4 w-4 text-white" />
          </div>
        );
      case 'pending':
        return (
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Circle className="h-4 w-4 text-gray-400" />
          </div>
        );
    }
  };

  const getTextColor = (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-700';
      case 'current':
        return 'text-primary-700 font-semibold';
      case 'pending':
        return 'text-gray-400';
    }
  };

  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => (
        <div key={index} className="relative flex gap-4">
          {/* Line connector */}
          {index < items.length - 1 && (
            <div
              className={cn(
                'absolute left-4 top-8 w-0.5 h-full -translate-x-1/2',
                item.status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'
              )}
            />
          )}

          {/* Icon */}
          <div className="relative z-10 flex-shrink-0">
            {item.icon || getStatusIcon(item.status)}
          </div>

          {/* Content */}
          <div className="pb-8 flex-1 min-w-0">
            <p className={cn('text-sm', getTextColor(item.status))}>
              {item.title}
            </p>
            {item.description && (
              <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
            )}
            {item.date && (
              <p className="mt-1 text-xs text-gray-400">{item.date}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
