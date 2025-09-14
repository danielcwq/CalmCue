'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, Coffee, Zap } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  time: Date;
  type: 'meeting' | 'deadline' | 'break' | 'exercise' | 'social';
  stressLevel: 'low' | 'medium' | 'high';
  duration?: number; // minutes
  impact: string;
}

const eventIcons = {
  meeting: Calendar,
  deadline: AlertTriangle,
  break: Coffee,
  exercise: Zap,
  social: Coffee
};

export default function UpcomingEvents() {
  const [events,] = useState<Event[]>([ // setEvents removed as it's unused
    {
      id: '1',
      title: 'Team Standup',
      time: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      type: 'meeting',
      stressLevel: 'low',
      duration: 15,
      impact: 'Routine check-in'
    },
    {
      id: '2',
      title: 'Project Presentation',
      time: new Date(Date.now() + 90 * 60 * 1000), // 90 minutes from now
      type: 'meeting',
      stressLevel: 'high',
      duration: 60,
      impact: 'High stakes presentation'
    },
    {
      id: '3',
      title: 'Coffee Break',
      time: new Date(Date.now() + 120 * 60 * 1000), // 2 hours from now
      type: 'break',
      stressLevel: 'low',
      duration: 15,
      impact: 'Mood booster'
    },
    {
      id: '4',
      title: 'Deadline: Report Submission',
      time: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      type: 'deadline',
      stressLevel: 'high',
      impact: 'Critical deadline'
    }
  ]);

  const fetchUpcomingEvents = async () => {
    // API call placeholder - commented out for now
    /*
    try {
      const response = await fetch('/api/events/upcoming');
      const data = await response.json();
      setEvents(data.map((event: any) => ({
        ...event,
        time: new Date(event.time)
      })));
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
    */

    // For now, we'll use the static data defined above
    // In a real implementation, this would fetch from calendar APIs, task management systems, etc.
  };

  useEffect(() => {
    fetchUpcomingEvents();
    
    // Refresh events every 5 minutes
    const interval = setInterval(fetchUpcomingEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStressLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'text-blue-600';
      case 'deadline': return 'text-red-600';
      case 'break': return 'text-green-600';
      case 'exercise': return 'text-purple-600';
      case 'social': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeUntil = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const upcomingEvents = events
    .filter(event => event.time > new Date())
    .sort((a, b) => a.time.getTime() - b.time.getTime())
    .slice(0, 6); // Show next 6 events

  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <CardTitle>Upcoming Events</CardTitle>
        </div>
        <CardDescription>
          Next events that may impact your mood
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming events</p>
            </div>
          ) : (
            upcomingEvents.map((event) => {
              const IconComponent = eventIcons[event.type];
              return (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-1.5 rounded ${getTypeColor(event.type)} bg-opacity-10`}>
                    <IconComponent className={`h-4 w-4 ${getTypeColor(event.type)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium truncate">{event.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimeUntil(event.time)}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">{event.impact}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={getStressLevelColor(event.stressLevel)}
                        >
                          {event.stressLevel} stress
                        </Badge>
                        {event.duration && (
                          <span className="text-xs text-muted-foreground">
                            {event.duration}min
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {event.time.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {upcomingEvents.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-3 border-t mt-3">
            Showing next {upcomingEvents.length} events
          </div>
        )}
      </CardContent>
    </Card>
  );
}