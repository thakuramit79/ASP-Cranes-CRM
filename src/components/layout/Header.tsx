import React, { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications, markNotificationAsRead } from '../../services/notificationService';
import { Notification } from '../../types/notification';
import { Badge } from '../common/Badge';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);
  
  const fetchNotifications = async () => {
    if (user) {
      const userNotifications = await getUserNotifications(user.id);
      setNotifications(userNotifications);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      fetchNotifications();
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        {/* Logo removed */}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 rounded-full relative"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <Badge variant="error" className="absolute -top-1 -right-1">
                {unreadCount}
              </Badge>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No notifications</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left p-2 rounded-md hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-gray-500 mt-1">
                            {notification.message}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-100 rounded-full"
          title="Logout"
        >
          <LogOut className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </header>
  );
}