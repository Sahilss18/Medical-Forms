import React from 'react';
import { Check, Circle, AlertCircle } from 'lucide-react';
import { TimelineEvent } from '@/types';
import { formatDateTime } from '@/utils/helpers';
import { cn } from '@/utils/helpers';

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className }) => {
  const getIcon = (status: string) => {
    if (status === 'approved') {
      return <Check className="h-5 w-5 text-green-600" />;
    } else if (status === 'rejected' || status === 'clarification_requested') {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    return <Circle className="h-5 w-5 text-blue-600" />;
  };

  const getLineColor = (index: number) => {
    if (index === 0) return 'bg-blue-600';
    return 'bg-gray-300';
  };

  return (
    <div className={cn('flow-root', className)}>
      <ul className="-mb-8">
        {events.map((event, index) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {index !== events.length - 1 && (
                <span
                  className={cn(
                    'absolute top-5 left-5 -ml-px h-full w-0.5',
                    getLineColor(index)
                  )}
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div>
                  <div className="relative px-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-gray-300">
                      {getIcon(event.status)}
                    </div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {event.title}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>{event.description}</p>
                    {event.actor && (
                      <p className="mt-1 text-xs text-gray-500">
                        By: {event.actor.name} ({event.actor.role})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
