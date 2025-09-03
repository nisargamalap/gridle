// src/app/admin/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import UserManagement from './components/UserManagement';
import GroupManagement from './components/GroupManagement';
import TaskManagement from './components/TaskManagement';
import NoteManagement from './components/NoteManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const AdminPanelPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/signin');
      return;
    }
    
    if (session.user.role !== 'admin') {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="text-center text-muted-foreground p-8 bg-card rounded-xl shadow-md border border-border">
        <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
        <p className="text-muted-foreground">You do not have administrative privileges to view this page.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col space-y-6 p-6">
      <h2 className="text-3xl font-bold text-foreground mb-4">System Administration</h2>

      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'groups' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('groups')}
        >
          Group Management
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'tasks' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('tasks')}
        >
          Task Management
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'notes' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('notes')}
        >
          Note Management
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'analytics' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Render the active tab component */}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'groups' && <GroupManagement />}
      {activeTab === 'tasks' && <TaskManagement />}
      {activeTab === 'notes' && <NoteManagement />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
    </div>
  );
};

export default AdminPanelPage;