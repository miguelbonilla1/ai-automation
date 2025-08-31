'use client';

import { useState, useEffect } from 'react';
import { useTaskUpdates } from '@/hooks/useTaskUpdates';

type Task = {
  id: string;
  title: string;
  enhanced_title: string | null;
  completed: boolean;
  created_at: string;
};

interface TaskListProps {
  initialTasks: Task[];
}

export default function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Handle real-time task updates
  useTaskUpdates({
    onTaskEnhanced: (taskId: string, enhancedTitle: string) => {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, enhanced_title: enhancedTitle }
            : task
        )
      );
    },
    tasks
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (response.ok) {
      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      setNewTaskTitle(''); // Reset form
    }
  }

  async function toggleTask(id: string, completed: boolean) {
    const response = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, completed }),
    });

    if (response.ok) {
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, completed } : task
        )
      );
    }
  }

  async function editTask(id: string, title: string) {
    if (!title.trim()) return;
    
    const response = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, title: title.trim() }),
    });

    if (response.ok) {
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, title: title.trim() } : task
        )
      );
      setEditingId(null);
      setEditTitle('');
    }
  }

  async function deleteTask(id: string) {
    const response = await fetch('/api/tasks', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  }

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.enhanced_title || task.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="min-h-screen bg-red-900 flex items-center justify-center p-4">
      <div className="bg-red-100 rounded-lg shadow-xl w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-red-900">Tasks</h1>
          <button className="text-red-600 hover:text-red-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>

                 {/* Add Task Form */}
         <form onSubmit={addTask} className="flex gap-2">
           <input
             type="text"
             value={newTaskTitle}
             onChange={(e) => setNewTaskTitle(e.target.value)}
             placeholder="Add a new task..."
             className="flex-1 px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
             required
           />
           <button
             type="submit"
             className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
           >
             Add
           </button>
         </form>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border-l-4 ${
                task.completed ? 'border-green-500 opacity-75' : 'border-red-500'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTask(task.id, !task.completed)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-red-400 hover:border-red-600'
                }`}
              >
                {task.completed && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                {editingId === task.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          editTask(task.id, editTitle);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => editTask(task.id, editTitle)}
                      className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      className={`font-medium ${
                        task.completed ? 'line-through text-gray-600' : 'text-gray-900'
                      }`}
                    >
                      {task.enhanced_title || task.title}
                    </div>
                    {task.enhanced_title && (
                      <div className="text-xs text-gray-500 mt-1">
                        Original: {task.title}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {editingId !== task.id && (
                <div className="flex gap-1">
                  <button
                    onClick={() => startEditing(task)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No tasks yet. Add one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
