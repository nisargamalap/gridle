// src/app/tasks/page.jsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon } from '../../components/ui/ClientLayout'; 
import { HiMicrophone } from 'react-icons/hi';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeView, setActiveView] = useState('List');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentTaskToEdit, setCurrentTaskToEdit] = useState(null);
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDueDate, setTaskFormDueDate] = useState('');
  const [taskFormPriority, setTaskFormPriority] = useState('Medium');
  const [taskFormCategory, setTaskFormCategory] = useState('');
  const [taskFormDescription, setTaskFormDescription] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRefs = useRef({});

  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [showMoveToProjectModal, setShowMoveToProjectModal] = useState(false);
  const [selectedTaskForAction, setSelectedTaskForAction] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState('');

  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tasks');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        alert(error.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Fetch groups and projects for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch groups
        const groupsResponse = await fetch('/api/groups');
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          setGroups(groupsData);
        }

        // Fetch projects (you'll need to create this API endpoint)
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }
      } catch (error) {
        console.error('Error fetching additional data:', error);
      }
    };

    fetchData();
  }, []);

  const getPriorityColorClasses = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-muted/30 text-muted-foreground';
    }
  };

  const handleToggleTaskStatus = async (taskId) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update task status');
      }
      
      const updatedTask = await response.json();
      setTasks(prevTasks => prevTasks.map(t => t._id === updatedTask._id ? updatedTask : t));
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(error.message || 'Failed to update task status');
    }
  };

  const openTaskModal = (task = null) => {
    if (task) {
      setIsEditingTask(true);
      setCurrentTaskToEdit(task);
      setTaskFormTitle(task.title);
      setTaskFormDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setTaskFormPriority(task.priority || 'Medium');
      setTaskFormCategory(task.category || '');
      setTaskFormDescription(task.description || '');
    } else {
      setIsEditingTask(false);
      setCurrentTaskToEdit(null);
      setTaskFormTitle('');
      setTaskFormDueDate('');
      setTaskFormPriority('Medium');
      setTaskFormCategory('');
      setTaskFormDescription('');
    }
    setShowTaskModal(true);
    setOpenDropdownId(null);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    
    if (!taskFormTitle) {
      alert('Task title is required.');
      return;
    }
    
    setIsSavingTask(true);
    
    try {
      if (isEditingTask && currentTaskToEdit) {
        // Update existing task
        const response = await fetch(`/api/tasks/${currentTaskToEdit._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: taskFormTitle,
            description: taskFormDescription,
            dueDate: taskFormDueDate,
            priority: taskFormPriority,
            category: taskFormCategory,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update task');
        }
        
        const updatedTask = await response.json();
        setTasks(prevTasks => prevTasks.map(t => t._id === updatedTask._id ? updatedTask : t));
        alert('Task updated successfully!');
      } else {
        // Create new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: taskFormTitle,
            description: taskFormDescription,
            dueDate: taskFormDueDate,
            priority: taskFormPriority,
            category: taskFormCategory,
            status: 'pending',
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create task');
        }
        
        const newTask = await response.json();
        setTasks(prevTasks => [...prevTasks, newTask]);
        alert('Task created successfully!');
      }
      setShowTaskModal(false);
    } catch (error) {
      console.error('Error saving task:', error);
      alert(error.message || 'Failed to save task');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    setOpenDropdownId(null);
    const taskToDelete = tasks.find(t => t._id === taskId);
    
    if (!taskToDelete) {
      alert('Task not found');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete task "${taskToDelete.title}"?`)) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete task');
        }
        
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        alert(`Task "${taskToDelete.title}" deleted successfully.`);
      } catch (error) {
        console.error('Error deleting task:', error);
        alert(error.message || 'Failed to delete task');
      }
    }
  };

  const toggleDropdown = (taskId) => {
    setOpenDropdownId(openDropdownId === taskId ? null : taskId);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownId && dropdownRefs.current[openDropdownId] && !dropdownRefs.current[openDropdownId].contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  const handleOpenAddToGroupModal = (task) => {
    setOpenDropdownId(null);
    setSelectedTaskForAction(task);
    setShowAddToGroupModal(true);
    setSelectedTargetId('');
  };

  const handleAddToGroup = async (e) => {
  e.preventDefault();
  if (!selectedTargetId) {
    alert('Please select a group.');
    return;
  }

  try {
    const response = await fetch(`/api/tasks/${selectedTaskForAction._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group: selectedTargetId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add task to group');
    }

    const updatedTask = await response.json();
    setTasks(prev =>
      prev.map(t => (t._id === updatedTask._id ? updatedTask : t))
    );

    alert(`Task "${selectedTaskForAction.title}" added to group successfully!`);
    setShowAddToGroupModal(false);
    setSelectedTaskForAction(null);
    setSelectedTargetId('');
  } catch (error) {
    console.error('Error adding task to group:', error);
    alert(error.message || 'Failed to add task to group');
  }
};


  const handleOpenMoveToProjectModal = (task) => {
    setOpenDropdownId(null);
    setSelectedTaskForAction(task);
    setShowMoveToProjectModal(true);
    setSelectedTargetId('');
  };

  const handleMoveToProject = async (e) => {
    e.preventDefault();
    if (!selectedTargetId) {
      alert('Please select a project.');
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${selectedTaskForAction._id}/project`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedTargetId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to move task to project');
      }
      
      const updatedTask = await response.json();
      setTasks(prevTasks => prevTasks.map(t => t._id === updatedTask._id ? updatedTask : t));
      alert(`Task "${selectedTaskForAction.title}" moved to project successfully!`);
      setShowMoveToProjectModal(false);
      setSelectedTaskForAction(null);
      setSelectedTargetId('');
    } catch (error) {
      console.error('Error moving task to project:', error);
      alert(error.message || 'Failed to move task to project');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    const matchesFilter = activeFilter === 'All' ||
                          (activeFilter === 'Pending' && task.status === 'pending') ||
                          (activeFilter === 'Completed' && task.status === 'completed');
    return matchesSearch && matchesFilter;
  });

  // Kanban View Implementation
  const renderKanbanView = () => {
    const columns = [
      { id: "pending", title: "Pending", tasks: filteredTasks.filter(task => task.status === "pending") },
      { id: "completed", title: "Completed", tasks: filteredTasks.filter(task => task.status === "completed") }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {columns.map(column => (
          <div key={column.id} className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">{column.title} ({column.tasks.length})</h3>
            <div className="space-y-3">
              {column.tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tasks</p>
              ) : (
                column.tasks.map(task => (
                  <div
                    key={task._id}
                    className="p-3 border border-border rounded-lg bg-card shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'} | {task.priority}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() => handleToggleTaskStatus(task._id)}
                        className="form-checkbox h-5 w-5 text-primary rounded border-border focus:ring-primary mt-1"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColorClasses(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button
                        onClick={() => openTaskModal(task)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Calendar View Implementation
  const renderCalendarView = () => {
    // Group tasks by date
    const tasksByDate = {};
    filteredTasks.forEach(task => {
      const date = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date";
      if (!tasksByDate[date]) tasksByDate[date] = [];
      tasksByDate[date].push(task);
    });

    return (
      <div className="h-full overflow-y-auto">
        {Object.keys(tasksByDate).length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No tasks with due dates</p>
        ) : (
          Object.entries(tasksByDate).map(([date, dateTasks]) => (
            <div key={date} className="mb-6">
              <h3 className="font-semibold text-lg mb-2">{date === "No Date" ? "No Due Date" : date}</h3>
              <div className="space-y-2">
                {dateTasks.map(task => (
                  <div
                    key={task._id}
                    className="p-3 border border-border rounded-lg bg-card shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Priority: {task.priority} | {task.category}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() => handleToggleTaskStatus(task._id)}
                        className="form-checkbox h-5 w-5 text-primary rounded border-border focus:ring-primary mt-1"
                      />
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColorClasses(task.priority)}`}>
                        {task.status}
                      </span>
                      <button
                        onClick={() => openTaskModal(task)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderTasks = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (activeView === 'List') {
      return (
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-muted-foreground">No tasks found matching your criteria.</p>
          ) : (
            filteredTasks.map(task => (
              <div key={task._id} className="flex items-center p-4 border border-border rounded-lg shadow-sm bg-card">
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => handleToggleTaskStatus(task._id)}
                  className="form-checkbox h-5 w-5 text-primary rounded border-border focus:ring-primary"
                />
                <div className="ml-4 flex-1">
                  <p className={`text-lg font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'} | Category: {task.category || 'Uncategorized'}
                    {task.project && ` | Project: ${task.project.name}`}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColorClasses(task.priority)}`}>
                  {task.priority}
                </span>

                <div className="relative ml-4" ref={el => dropdownRefs.current[task._id] = el}>
                  <button onClick={() => toggleDropdown(task._id)} className="p-2 rounded-full hover:bg-muted">
                    <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                  </button>
                  {openDropdownId === task._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                      <button onClick={() => openTaskModal(task)} className="block w-full text-left px-4 py-2 text-foreground hover:bg-muted transition-colors">
                        Edit Task
                      </button>
                      <button onClick={() => handleDeleteTask(task._id)} className="block w-full text-left px-4 py-2 text-destructive hover:bg-muted transition-colors">
                        Delete Task
                      </button>
                      {/* <button onClick={() => handleOpenMoveToProjectModal(task)} className="block w-full text-left px-4 py-2 text-foreground hover:bg-muted transition-colors">
                        Move to Project
                      </button> */}
                      <button onClick={() => handleOpenAddToGroupModal(task)} className="block w-full text-left px-4 py-2 text-foreground hover:bg-muted transition-colors">
                        Add to Group
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      );
    } else if (activeView === 'Kanban') {
      return renderKanbanView();
    } else if (activeView === 'Calendar') {
      return renderCalendarView();
    }
    return null;
  };

  return (
    <div className="relative h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Search tasks..."
          className="flex-grow p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex space-x-2">
          {['All', 'Pending', 'Completed'].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors
                ${activeFilter === filter ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`
              }
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          {['List', 'Kanban', 'Calendar'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors
                ${activeView === view ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`
              }
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border relative">
        {renderTasks()}
      </div>

      <button
        onClick={() => openTaskModal()}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-accent transition-colors duration-200 z-20"
      >
        <PlusIcon />
      </button>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md border border-border">
            <h3 className="text-2xl font-semibold text-foreground mb-6">{isEditingTask ? 'Edit Task' : 'Add New Task'}</h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <input type="text" placeholder="Task Title" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={taskFormTitle} onChange={(e) => setTaskFormTitle(e.target.value)} required />
              <input type="date" placeholder="Due Date" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={taskFormDueDate} onChange={(e) => setTaskFormDueDate(e.target.value)} />
              <select className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={taskFormPriority} onChange={(e) => setTaskFormPriority(e.target.value)}>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
              <input type="text" placeholder="Category (e.g., Work, Personal)" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={taskFormCategory} onChange={(e) => setTaskFormCategory(e.target.value)} />
              <textarea placeholder="Description (optional)" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground h-20" value={taskFormDescription} onChange={(e) => setTaskFormDescription(e.target.value)} />
              
              <button type="button" className="flex items-center text-primary hover:underline text-sm"><HiMicrophone className="mr-1" /> Voice Input for Title (AI)</button>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setShowTaskModal(false)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-secondary/80 transition-colors" disabled={isSavingTask}>Cancel</button>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors flex items-center justify-center" disabled={isSavingTask}>
                  {isSavingTask ? (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    isEditingTask ? 'Save Changes' : 'Add Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddToGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md border border-border">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Add "{selectedTaskForAction?.title}" to Group</h3>
            <form onSubmit={handleAddToGroup} className="space-y-4">
              <label htmlFor="select-group" className="block text-sm font-medium text-muted-foreground mb-2">Select Group:</label>
              <select id="select-group" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)} required>
                <option value="">-- Choose a group --</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2 mt-6">
               <button
  type="button"
  onClick={() => { setShowAddToGroupModal(false); setSelectedTaskForAction(null); setSelectedTargetId(''); }}
  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
>
  Cancel
</button>

                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors">Add to Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMoveToProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md border border-border">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Move "{selectedTaskForAction?.title}" to Project</h3>
            <form onSubmit={handleMoveToProject} className="space-y-4">
              <label htmlFor="select-project" className="block text-sm font-medium text-muted-foreground mb-2">Select Project:</label>
              <select id="select-project" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={selectedTargetId} onChange={(e) => setSelectedTargetId(e.target.value)} required>
                <option value="">-- Choose a project --</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>{project.name}</option>
                ))}
              </select>
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => { setShowMoveToProjectModal(false); setSelectedTaskForAction(null); setSelectedTargetId(''); }} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-secondary/80 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors">Move Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;