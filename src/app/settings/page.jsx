// src/app/settings/page.jsx
"use client";

import React, { useState, useEffect } from 'react';

const SettingsPage = () => {
  // State for user data
  const [userData, setUserData] = useState({
    name: '',
    email: '',
  });
  
  // State for settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [popupNotifications, setPopupNotifications] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState('1 hour before');
  const [aiPrioritization, setAiPrioritization] = useState(true);
  const [aiReminderIntensity, setAiReminderIntensity] = useState('Medium');
  const [grammarAutocorrection, setGrammarAutocorrection] = useState(true);
  
  // State for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State for Google Calendar integration
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/profile');
        
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.name || '',
            email: data.email || ''
          });
          
          // Load preferences if they exist
          if (data.preferences) {
            if (data.preferences.notifications) {
              setEmailNotifications(data.preferences.notifications.email ?? true);
              setPopupNotifications(data.preferences.notifications.push ?? true);
              setReminderFrequency(data.preferences.notifications.frequency || '1 hour before');
            }
            
            setAiPrioritization(data.preferences.aiPrioritization ?? true);
            setAiReminderIntensity(data.preferences.aiReminderIntensity || 'Medium');
            setGrammarAutocorrection(data.preferences.grammarAutocorrection ?? true);
          }
          
          // Check Google Calendar connection status
          setIsGoogleConnected(data.googleId ? true : false);
        } else {
          setMessage({ type: 'error', text: 'Failed to load user data' });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setMessage({ type: 'error', text: 'Failed to load user data' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle user profile updates
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully! Reloading...' });
        
        // Update the user data in localStorage to reflect changes on dashboard
        const updatedUser = await response.json();
        if (typeof window !== 'undefined') {
          const currentUserData = JSON.parse(localStorage.getItem('userData') || '{}');
          localStorage.setItem('userData', JSON.stringify({
            ...currentUserData,
            name: updatedUser.name
          }));
          
          // Dispatch a custom event to notify other components about the user data change
          window.dispatchEvent(new CustomEvent('userDataChanged', {
            detail: { name: updatedUser.name }
          }));
        }
        
        // Reload the page after a short delay to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Clear the message after 3 seconds
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Error changing password' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle settings save
const handleSaveSettings = async () => {
  setIsSaving(true);
  setMessage({ type: '', text: '' });

  try {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notifications: {
          email: emailNotifications,
          push: popupNotifications,
          frequency: reminderFrequency,
        },
        aiPrioritization,
        aiReminderIntensity,
        grammarAutocorrection,
      }),
    });

    // small delay so "Saving..." is visible
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (response.ok) {
      setMessage({ type: 'success', text: 'Settings saved successfully! Reloading...' });

      // DO NOT reset isSaving here → keep "Saving..." until reload
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      const errorData = await response.json();
      setMessage({ type: 'error', text: errorData.message || 'Failed to save settings' });
      setIsSaving(false); // only reset if error
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    setMessage({ type: 'error', text: 'Error saving settings' });
    setIsSaving(false); // only reset if error
  }
};

  // Handle Google Calendar connection
  const handleGoogleCalendarConnect = async () => {
    if (isGoogleConnected) {
      // Disconnect logic
      try {
        const response = await fetch('/api/integrations/google-calendar', {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsGoogleConnected(false);
          setMessage({ type: 'success', text: 'Google Calendar disconnected successfully! Reloading...' });
          
          // Reload the page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage({ type: 'error', text: 'Failed to disconnect Google Calendar' });
        }
      } catch (error) {
        console.error('Error disconnecting Google Calendar:', error);
        setMessage({ type: 'error', text: 'Error disconnecting Google Calendar' });
      }
    } else {
      // Connect logic - redirect to OAuth flow
      try {
        const response = await fetch('/api/integrations/google-calendar/connect');
        const data = await response.json();
        
        if (data.url) {
          // Redirect to Google OAuth URL
          window.location.href = data.url;
        } else {
          setMessage({ type: 'error', text: 'Failed to get Google OAuth URL' });
        }
      } catch (error) {
        console.error('Error connecting to Google Calendar:', error);
        setMessage({ type: 'error', text: 'Error connecting to Google Calendar' });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col space-y-6 p-6">
      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-6">Profile Settings</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={userData.email}
              readOnly
              className="w-full p-3 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed directly here.
            </p>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-6">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-muted-foreground mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-muted-foreground mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground"
              required
              minLength="8"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted-foreground mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-6">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="email-notifications" className="text-foreground font-medium">
              Email Notifications
            </label>
            <input
              type="checkbox"
              id="email-notifications"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="popup-notifications" className="text-foreground font-medium">
              In-App Popups
            </label>
            <input
              type="checkbox"
              id="popup-notifications"
              checked={popupNotifications}
              onChange={(e) => setPopupNotifications(e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="reminder-frequency" className="block text-sm font-medium text-muted-foreground mb-1">
              Reminder Frequency
            </label>
            <select
              id="reminder-frequency"
              value={reminderFrequency}
              onChange={(e) => setReminderFrequency(e.target.value)}
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground"
            >
              <option value="15 minutes before">15 minutes before</option>
              <option value="1 hour before">1 hour before</option>
              <option value="Daily Summary">Daily Summary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-6">Integrations</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 3h-3V1h-2v2H8V1H6v2H3c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H3V9h18v12zm0-14H3V5h18v2zM7 11h10v2H7zm0 4h10v2H7z" />
              </svg>
              Google Calendar
            </span>
            <button
              onClick={handleGoogleCalendarConnect}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isGoogleConnected
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/80'
                  : 'bg-primary text-primary-foreground hover:bg-accent'
              }`}
            >
              {isGoogleConnected ? 'Disconnect' : 'Connect Account'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Preferences */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border border-border">
        <h3 className="text-xl font-semibold text-foreground mb-6">AI Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="ai-prioritization" className="text-foreground font-medium">
              Enable AI Prioritization
            </label>
            <input
              type="checkbox"
              id="ai-prioritization"
              checked={aiPrioritization}
              onChange={(e) => setAiPrioritization(e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="ai-reminder-intensity" className="block text-sm font-medium text-muted-foreground mb-1">
              AI Reminder Intensity
            </label>
            <select
              id="ai-reminder-intensity"
              value={aiReminderIntensity}
              onChange={(e) => setAiReminderIntensity(e.target.value)}
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none bg-input text-foreground"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="grammar-autocorrection" className="text-foreground font-medium">
              Grammar Autocorrection
            </label>
            <input
              type="checkbox"
              id="grammar-autocorrection"
              checked={grammarAutocorrection}
              onChange={(e) => setGrammarAutocorrection(e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary rounded focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors duration-200 shadow-md disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;