import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import type { Case } from "@shared/schema";

interface CalendarComponentProps {
  cases: Case[];
}

export default function CalendarComponent({ cases }: CalendarComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCasesForDay = (day: Date) => {
    return cases.filter(case_ => 
      case_.hearingDate && 
      format(new Date(case_.hearingDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
  };

  const getCaseColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-legal-emerald text-white';
      case 'under_review':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-legal-blue text-white';
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            Hearing Calendar
          </CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium text-gray-900 min-w-[150px] text-center">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button className="bg-legal-blue hover:bg-blue-700 text-white">
                Month
              </Button>
              <Button variant="outline">
                Week
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {days.map(day => {
            const dayCases = getCasesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border border-gray-100 hover:bg-gray-50 transition-colors ${
                  isDayToday ? 'bg-blue-50 border-legal-blue' : ''
                }`}
              >
                <div className={`text-right text-sm mb-2 ${
                  isDayToday 
                    ? 'font-medium text-legal-blue' 
                    : isCurrentMonth 
                      ? 'text-gray-600' 
                      : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayCases.slice(0, 2).map(case_ => (
                    <Badge
                      key={case_._id}
                      className={`text-xs px-2 py-1 rounded text-center block truncate ${getCaseColor(case_.status)}`}
                    >
                      {case_.title}
                    </Badge>
                  ))}
                  {dayCases.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{dayCases.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-legal-blue rounded"></div>
              <span className="text-gray-600">Active Cases</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-legal-emerald rounded"></div>
              <span className="text-gray-600">Approved Cases</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Pending Review</span>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Calendar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
