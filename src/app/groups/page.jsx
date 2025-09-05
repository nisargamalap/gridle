// src/app/groups/page.jsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon } from '../../components/ui/ClientLayout'; 

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(true);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormDescription, setGroupFormDescription] = useState('');
  const [groupJoinCode, setGroupJoinCode] = useState('');
  const [isSubmittingGroupAction, setIsSubmittingGroupAction] = useState(false);
  const [currentGroupToEdit, setCurrentGroupToEdit] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [currentGroupTasks, setCurrentGroupTasks] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState(null);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRefs = useRef({});

  // Fetch groups from API
  const fetchGroups = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setLoading(true);
      
      const response = await fetch('/api/groups');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch groups');
      }
      
      const data = await response.json();
      
      // For each group, fetch the task count separately
      const groupsWithTaskCounts = await Promise.all(
        data.map(async (group) => {
          try {
            const tasksResponse = await fetch(`/api/groups/${group._id}/tasks`);
            if (tasksResponse.ok) {
              const tasks = await tasksResponse.json();
              return {
                ...group,
                tasksCount: tasks.length
              };
            }
            return group;
          } catch (error) {
            console.error(`Error fetching tasks for group ${group._id}:`, error);
            return group;
          }
        })
      );
      
      const transformedGroups = groupsWithTaskCounts.map(group => ({
        id: group._id,
        name: group.name,
        description: group.description,
        members: group.members?.length || 0,
        tasks: group.tasksCount || 0,
        isCurrentUserAdmin: group.user._id === group.user._id,
        shareCode: group.joinCode || 'N/A'
      }));
      
      setGroups(transformedGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert(error.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch group members
  const fetchGroupMembers = async (groupId) => {
    try {
      setMembersLoading(true);
      const response = await fetch(`/api/groups/${groupId}/members`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch group members');
      }
      
      const members = await response.json();
      setCurrentGroupMembers(members);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Error fetching group members:', error);
      alert(error.message || 'Failed to load group members');
    } finally {
      setMembersLoading(false);
    }
  };

  // Fetch group tasks
  const fetchGroupTasks = async (groupId, forceRefresh = false) => {
    try {
      if (forceRefresh) setTasksLoading(true);
      setCurrentGroupId(groupId);
      
      const response = await fetch(`/api/groups/${groupId}/tasks`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch group tasks');
      }
      
      const tasks = await response.json();
      setCurrentGroupTasks(tasks);
      
      // Update the task count in the groups list
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, tasks: tasks.length }
            : group
        )
      );
      
      setShowTasksModal(true);
    } catch (error) {
      console.error('Error fetching group tasks:', error);
      alert(error.message || 'Failed to load group tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  // Open modal for create, join, or edit
  const openGroupModalHandler = (type = 'create', group = null) => {
    setIsCreatingGroup(type === 'create');
    setCurrentGroupToEdit(group || null);
    setGroupFormName(group?.name || '');
    setGroupFormDescription(group?.description || '');
    setGroupJoinCode('');
    setShowGroupModal(true);
  };

  // Handle create / join / edit
  const handleGroupAction = async (e) => {
    e.preventDefault();
    setIsSubmittingGroupAction(true);

    try {
      if (currentGroupToEdit) {
        // Editing group
        if (!groupFormName) { alert('Group name is required'); return; }
        
        const response = await fetch(`/api/groups/${currentGroupToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupFormName,
            description: groupFormDescription,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update group');
        }
        
        const updatedGroup = await response.json();
        setGroups(prev => prev.map(g => g.id === updatedGroup._id ? {
          ...g,
          name: updatedGroup.name,
          description: updatedGroup.description,
          shareCode: updatedGroup.joinCode || 'N/A'
        } : g));
        
        alert(`Group "${updatedGroup.name}" updated!`);
      } else if (isCreatingGroup) {
        // Creating group
        if (!groupFormName) { alert('Group name is required'); return; }
        
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupFormName,
            description: groupFormDescription,
            isPrivate: false,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create group');
        }
        
        const newGroup = await response.json();
        setGroups(prev => [...prev, {
          id: newGroup._id,
          name: newGroup.name,
          description: newGroup.description,
          members: newGroup.members?.length || 1,
          tasks: 0, // Start with 0 tasks
          isCurrentUserAdmin: true,
          shareCode: newGroup.joinCode || 'N/A'
        }]);
        
        alert(`Group "${groupFormName}" created!`);
      } else {
        // Joining group
        if (!groupJoinCode) { alert('Enter join code'); return; }
        
        const response = await fetch('/api/groups/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            joinCode: groupJoinCode,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to join group');
        }
        
        const joinedGroup = await response.json();
        
        // Fetch task count for the joined group
        let taskCount = 0;
        try {
          const tasksResponse = await fetch(`/api/groups/${joinedGroup._id}/tasks`);
          if (tasksResponse.ok) {
            const tasks = await tasksResponse.json();
            taskCount = tasks.length;
          }
        } catch (error) {
          console.error(`Error fetching tasks for joined group ${joinedGroup._id}:`, error);
        }
        
        setGroups(prev => [...prev, {
          id: joinedGroup._id,
          name: joinedGroup.name,
          description: joinedGroup.description,
          members: joinedGroup.members?.length || 0,
          tasks: taskCount,
          isCurrentUserAdmin: false,
          shareCode: joinedGroup.joinCode || 'N/A'
        }]);
        
        alert(`Joined group "${joinedGroup.name}"!`);
      }

      setShowGroupModal(false);
      setGroupFormName('');
      setGroupFormDescription('');
      setGroupJoinCode('');
      setCurrentGroupToEdit(null);
    } catch (error) {
      console.error('Error in group action:', error);
      alert(error.message || 'Failed to complete action');
    } finally {
      setIsSubmittingGroupAction(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId) => {
    setOpenDropdownId(null);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    if (window.confirm(`Are you sure you want to delete "${group.name}"?`)) {
      try {
        const response = await fetch(`/api/groups/${groupId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete group');
        }
        
        setGroups(prev => prev.filter(g => g.id !== groupId));
        alert(`Group "${group.name}" deleted.`);
      } catch (error) {
        console.error('Error deleting group:', error);
        alert(error.message || 'Failed to delete group');
      }
    }
  };

  // Copy share code
  const handleShareGroupCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Group code "${code}" copied to clipboard!`);
  };

  // View members
  const handleViewMembers = (groupId) => {
    setOpenDropdownId(null);
    fetchGroupMembers(groupId);
  };

  // View tasks
  const handleViewTasks = (groupId) => {
    setOpenDropdownId(null);
    fetchGroupTasks(groupId, true);
  };

  // Toggle task completion
  const handleTaskCompletion = async (taskId, completed) => {
    try {
      const wasCompleted = currentGroupTasks.find(task => task._id === taskId)?.status === 'completed';
      
      // Update the local tasks state first for immediate UI feedback
      setCurrentGroupTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, status: completed ? 'completed' : 'todo' }
            : task
        )
      );
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: completed ? 'completed' : 'todo'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }
      
      // Refresh the tasks to ensure we have the latest data
      fetchGroupTasks(currentGroupId, false);
      
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
      
      // Revert the UI changes if the API call failed
      setCurrentGroupTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, status: completed ? 'todo' : 'completed' }
            : task
        )
      );
    }
  };

  // Delete completed tasks
  const handleDeleteCompletedTasks = async () => {
    if (!window.confirm('Are you sure you want to delete all completed tasks?')) return;
    
    try {
      const completedTasks = currentGroupTasks.filter(task => task.status === 'completed');
      
      // Update UI immediately
      setCurrentGroupTasks(prevTasks => prevTasks.filter(task => task.status !== 'completed'));
      
      await Promise.all(
        completedTasks.map(task => 
          fetch(`/api/tasks/${task._id}`, {
            method: 'DELETE',
          })
        )
      );
      
      // Refresh the groups to update the task count
      fetchGroups(true);
      
      alert('Completed tasks deleted successfully');
    } catch (error) {
      console.error('Error deleting tasks:', error);
      alert('Failed to delete completed tasks');
      // Revert UI changes if API call failed
      if (currentGroupId) {
        fetchGroupTasks(currentGroupId, true);
      }
    }
  };

  const toggleDropdown = (groupId) => {
    setOpenDropdownId(openDropdownId === groupId ? null : groupId);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (openDropdownId && dropdownRefs.current[openDropdownId] && !dropdownRefs.current[openDropdownId].contains(event.target)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col space-y-6">
      <input
        type="text"
        placeholder="Search groups..."
        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground mb-6"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="flex-1 overflow-y-auto bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border">
        {filteredGroups.length === 0 ? (
          <p className="text-center text-muted-foreground">No groups found. Click '+' to create or join one!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(group => (
              <div key={group.id} className="p-5 border border-border rounded-xl shadow-sm bg-card flex flex-col justify-between cursor-pointer hover:bg-muted/50 transition-colors relative">
                <div>
                  <h3 className="text-lg font-medium text-foreground flex items-center mb-2">
                    {group.name}
                    {group.isCurrentUserAdmin && (
                      <span className="ml-2 text-primary">
                        <svg className="w-5 h-5 inline-block -mt-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2zm-2 0H4V6h16v4zM4 14h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zm16 4H4v-2h16v2z"/>
                        </svg>
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{group.description}</p>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{group.members} Members</span>
                  <span>{group.tasks} Tasks</span>
                </div>

                {/* Dropdown */}
                <div className="absolute top-2 right-2" ref={el => dropdownRefs.current[group.id] = el}>
                  <button onClick={() => toggleDropdown(group.id)} className="p-2 rounded-full hover:bg-muted">
                    <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"></path>
                    </svg>
                  </button>
                  {openDropdownId === group.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                      <button onClick={() => handleViewMembers(group.id)} className="block w-full text-left px-4 py-2 text-foreground hover:bg-muted transition-colors">
                        View Members
                      </button>
                      <button onClick={() => handleViewTasks(group.id)} className="block w-full text-left px-4 py-2 text-foreground hover:bg-muted transition-colors">
                        View Tasks
                      </button>
                      {group.isCurrentUserAdmin && (
                        <>
                          <button onClick={() => openGroupModalHandler('edit', group)} className="block w-full text-left px-4 py-2 text-foreground hover:bg-muted transition-colors">Edit</button>
                          <button onClick={() => handleDeleteGroup(group.id)} className="block w-full text-left px-4 py-2 text-destructive hover:bg-muted transition-colors">Delete</button>
                        </>
                      )}
                      <button onClick={() => handleShareGroupCode(group.shareCode)} className="block w-full text-left px-4 py-2 text-foreground hover:bg-muted transition-colors">Share Code</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => openGroupModalHandler('create')}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-accent transition-colors duration-200 z-20"
      >
        <PlusIcon />
      </button>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-xl shadow-lg w-full max-w-md border border-border">
            <h3 className="text-2xl font-semibold text-foreground mb-6">
              {currentGroupToEdit ? 'Edit Group' : isCreatingGroup ? 'Create New Group' : 'Join Existing Group'}
            </h3>
            <form onSubmit={handleGroupAction} className="space-y-4">
              {currentGroupToEdit || isCreatingGroup ? (
                <>
                  <input type="text" spellCheck={true} placeholder="Group Name" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={groupFormName} onChange={(e) => setGroupFormName(e.target.value)} required />
                  <input type="text" spellCheck={true} placeholder="Description" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={groupFormDescription} onChange={(e) => setGroupFormDescription(e.target.value)} />
                </>
              ) : (
                <input type="text" placeholder="Enter Group Join Code" className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground" value={groupJoinCode} onChange={(e) => setGroupJoinCode(e.target.value)} required />
              )}

              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setShowGroupModal(false)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-secondary/80 transition-colors" disabled={isSubmittingGroupAction}>Cancel</button>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors flex items-center justify-center" disabled={isSubmittingGroupAction}>
                  {isSubmittingGroupAction ? (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    currentGroupToEdit ? 'Save Changes' : isCreatingGroup ? 'Create Group' : 'Join Group'
                  )}
                </button>
              </div>
            </form>
            {!currentGroupToEdit && (
              <div className="my-4 text-center text-muted-foreground">
                <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="text-primary hover:underline text-sm">
                  {isCreatingGroup ? 'Want to join a group instead?' : 'Want to create a group instead?'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl shadow-lg w-full max-w-md border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Group Members</h3>
            
            {membersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {currentGroupMembers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No members found</p>
                ) : (
                  <ul className="space-y-2">
                    {currentGroupMembers.map((member, index) => (
                      <li key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium mr-3">
                            {member.user?.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-foreground">{member.user?.name || 'Unknown User'}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          member.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowMembersModal(false)} 
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Modal */}
      {showTasksModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl shadow-lg w-full max-w-md border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Group Tasks</h3>
            
            {tasksLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {currentGroupTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No tasks found</p>
                ) : (
                  <>
                    {/* Active Tasks */}
                    <div className="mb-4">
                      <h4 className="text-lg font-medium text-foreground mb-2">Active Tasks</h4>
                      <ul className="space-y-2">
                        {currentGroupTasks
                          .filter(task => task.status !== 'completed')
                          .map((task, index) => (
                            <li key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={task.status === "completed"}
                                  onChange={(e) => handleTaskCompletion(task._id, e.target.checked)}
                                  className="w-4 h-4 accent-primary mr-3 cursor-pointer"
                                />
                                <span className={`text-foreground ${task.status === "completed" ? 'line-through' : ''}`}>
                                  {task.title}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                task.priority === 'high' 
                                  ? 'bg-red-100 text-red-800' 
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {task.priority}
                              </span>
                            </li>
                          ))
                        }
                      </ul>
                    </div>

                    {/* Completed Tasks */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-medium text-foreground">Completed Tasks</h4>
                        <button 
                          onClick={handleDeleteCompletedTasks}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete All Completed
                        </button>
                      </div>
                      <ul className="space-y-2">
                        {currentGroupTasks
                          .filter(task => task.status === 'completed')
                          .map((task, index) => (
                            <li key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={(e) => handleTaskCompletion(task._id, false)}
                                  className="w-4 h-4 accent-primary mr-3 cursor-pointer"
                                />
                                <span className="line-through text-muted-foreground">
                                  {task.title}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Completed
                              </span>
                            </li>
                          ))
                        }
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowTasksModal(false)} 
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-accent transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupsPage;