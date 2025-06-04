import React, { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

export interface CollapsibleCardProps {
  children: ReactNode;
  title: string | ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function CollapsibleCard({ 
  children, 
  title, 
  defaultExpanded = false,
  icon,
  className = ''
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle className="text-lg font-medium">
              {typeof title === 'string' ? title : title}
            </CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
} 