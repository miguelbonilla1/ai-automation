import { useEffect, useRef } from 'react';

interface UseTaskUpdatesProps {
  onTaskEnhanced: (taskId: string, enhancedTitle: string) => void;
  tasks: Array<{ id: string; enhanced_title: string | null }>;
}

export function useTaskUpdates({ onTaskEnhanced, tasks }: UseTaskUpdatesProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Poll for updates every 2 seconds
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
          const updatedTasks = await response.json();
          
          // Check for tasks that have been enhanced
          updatedTasks.forEach((updatedTask: any) => {
            const currentTask = tasks.find(task => task.id === updatedTask.id);
            if (currentTask && 
                !currentTask.enhanced_title && 
                updatedTask.enhanced_title) {
              onTaskEnhanced(updatedTask.id, updatedTask.enhanced_title);
            }
          });
        }
      } catch (error) {
        console.error('Error polling for task updates:', error);
      }
    }, 2000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onTaskEnhanced, tasks]);

  return intervalRef.current;
}
