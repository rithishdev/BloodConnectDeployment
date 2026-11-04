import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

import HomeView from './components/HomeView';
import AvailableBloodView from './components/AvailableBloodView';
import DonorSearchView from './components/DonorSearchView';
import BloodRequestView from './components/BloodRequestView';
import HospitalsView from './components/HospitalsView';
import AdminDashboard from './components/AdminDashboard';
import AnalyticsView from './components/AnalyticsView';

import AuthModal from './components/AuthModal';
import DonorRegisterModal from './components/DonorRegisterModal';
import EmergencyRequestModal from './components/EmergencyRequestModal';
import ToastAlert from './components/ToastAlert';
import { playEmergencyAlertSound } from './utils/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [criticalRequests, setCriticalRequests] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [donorSearchFilters, setDonorSearchFilters] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bc_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('bc_token') || null;
  });

  // Auth Modal State (Only 'donor' and 'admin')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('donor');
  const [authModalMode, setAuthModalMode] = useState('login');

  // Real-time floating toasts (auto-dismissed)
  const [toasts, setToasts] = useState([]);

  // Notification history for bell dropdown
  const [notifications, setNotifications] = useState([
    {
      id: 'init_welcome',
      type: 'info',
      title: 'BloodConnect Emergency Network',
      message: 'System live and listening for emergency hospital requests in Tamil Nadu.',
      time: 'Just now',
      read: false
    }
  ]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [selectedRequestToView, setSelectedRequestToView] = useState(null);

  // Fetch platform analytics and critical requests from backend
  const loadGlobalData = async () => {
    try {
      const [analyticsRes, requestsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/requests?urgency=CRITICAL&status=PENDING')
      ]);

      const analyticsData = await analyticsRes.json();
      const requestsData = await requestsRes.json();

      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }
      if (requestsData.success) {
        setCriticalRequests(requestsData.data || []);
      }
    } catch (err) {
      console.warn('Backend API sync notice:', err.message);
    }
  };

  const pushNotification = (notif) => {
    const formatted = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      ...notif
    };

    setNotifications((prev) => [formatted, ...prev.slice(0, 24)]);
    setToasts((prev) => [formatted, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== formatted.id));
    }, 7000);
  };

  const handleLogin = (user, jwtToken) => {
    setCurrentUser(user);
    setToken(jwtToken);
    localStorage.setItem('bc_user', JSON.stringify(user));
    localStorage.setItem('bc_token', jwtToken);

    pushNotification({
      type: 'success',
      title: `Welcome, ${user.name}!`,
      message: `Signed in as ${user.role.toUpperCase()}`
    });

    if (user.role === 'admin') setActiveTab('admin');
    else setActiveTab('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('bc_user');
    localStorage.removeItem('bc_token');
    setActiveTab('home');

    pushNotification({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been logged out of BloodConnect.'
    });
  };

  const handleOpenAuthModal = (role = 'donor', mode = 'login') => {
    setAuthModalRole(role === 'admin' ? 'admin' : 'donor');
    setAuthModalMode(role === 'admin' ? 'login' : mode);
    setIsAuthModalOpen(true);
  };

  // Connected to Homepage search: strict filter handover
  const handleSearchDonorsFromHome = ({ bloodGroup, city }) => {
    setDonorSearchFilters({
      bloodGroup: bloodGroup || 'ALL',
      city: city || 'ALL'
    });
    sessionStorage.setItem(
      'bc_donor_search_filter',
      JSON.stringify({ bloodGroup: bloodGroup || 'ALL', city: city || 'ALL' })
    );
    setActiveTab('search');
  };

  useEffect(() => {
    loadGlobalData();

    // WebSocket Connection
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10
    });

    socket.on('connect', () => {
      setIsSocketConnected(true);
      socket.emit('subscribe-emergency-feed');
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Real-time events
    socket.on('emergency-request-created', (data) => {
      playEmergencyAlertSound();
      pushNotification({
        type: 'critical',
        title: `🚨 ${data.urgency || 'CRITICAL'} BLOOD ALERT`,
        message: `${data.patientName} requires ${data.unitsRequired} units of ${data.bloodGroup} at ${data.hospitalName}`,
        requestId: data.id || data._id,
        data: data
      });
      loadGlobalData();
    });

    socket.on('request-status-updated', (data) => {
      pushNotification({
        type: data.status === 'FULFILLED' ? 'success' : 'info',
        title: `Status: ${data.status}`,
        message: `Blood request for ${data.patientName} marked as ${data.status}`,
        data: data
      });
      loadGlobalData();
    });

    socket.on('donor-registered', (data) => {
      pushNotification({
        type: 'success',
        title: 'New Volunteer Donor Registered',
        message: `${data.name} (${data.bloodGroup}) registered in ${data.city}`,
        data: data
      });
      loadGlobalData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleViewRequestDetails = (req) => {
    setSelectedRequestToView(req);
    setActiveTab('requests');
    setShowNotifDropdown(false);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="min-h-screen bg-[#F8F3E8] text-[#233746]"
      onClick={() => showNotifDropdown && setShowNotifDropdown(false)}
    >
      {/* ─── COLLAPSIBLE LEFT SIDEBAR ──────────────────────────────────── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenRegister={() => { setIsRegisterOpen(true); setSidebarOpen(false); }}
        onOpenRequest={() => { setIsRequestOpen(true); setSidebarOpen(false); }}
        pendingCriticalCount={criticalRequests.length}
      />

      {/* ─── INNER FLEX COLUMN (header + main + footer) ─────────────────── */}
      <div className="flex flex-col min-h-screen">
        {/* ─── COMPACT TOP HEADER ───────────────────────────────────────── */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          setActiveTab={setActiveTab}
          onOpenRequest={() => setIsRequestOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          isConnected={isSocketConnected}
          pendingCriticalCount={criticalRequests.length}
          notifications={notifications}
          unreadCount={unreadNotifCount}
          showNotifDropdown={showNotifDropdown}
          onToggleNotif={(e) => {
            e.stopPropagation();
            setShowNotifDropdown((prev) => !prev);
          }}
          onMarkAllRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
          onViewRequest={handleViewRequestDetails}
        />

      {/* ─── MAIN CONTENT CONTAINER FOR DYNAMIC VIEWS ─────────────────── */}
      <main className="flex-grow w-full">
        {activeTab === 'home' && (
          <HomeView
            analytics={analytics}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenRequest={() => setIsRequestOpen(true)}
            onNavigateTab={setActiveTab}
            onSearchDonors={handleSearchDonorsFromHome}
            onViewRequest={handleViewRequestDetails}
          />
        )}

        {activeTab === 'available' && (
          <AvailableBloodView
            onOpenRequest={() => setIsRequestOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onNavigateHospitals={() => setActiveTab('hospitals')}
          />
        )}

        {activeTab === 'search' && (
          <DonorSearchView
            onOpenRegister={() => setIsRegisterOpen(true)}
            initialFilters={donorSearchFilters}
          />
        )}

        {activeTab === 'requests' && (
          <BloodRequestView
            onOpenRequest={() => setIsRequestOpen(true)}
            selectedRequestToView={selectedRequestToView}
            onClearSelectedRequest={() => setSelectedRequestToView(null)}
          />
        )}

        {activeTab === 'hospitals' && (
          <HospitalsView
            onOpenRequest={() => setIsRequestOpen(true)}
            userRole={currentUser?.role}
            onOpenAddHospital={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            token={token}
            onLogin={handleLogin}
            onRefreshData={loadGlobalData}
            onOpenAuthModal={handleOpenAuthModal}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* ─── SIMPLIFIED FOOTER (Brand + Copyright only) ───────────────── */}
      <Footer />

      {/* Unified Role-Based Auth Modal (Donor and Admin only) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialRole={authModalRole}
        initialMode={authModalMode}
        onLoginSuccess={handleLogin}
      />

      {/* Register Donor Modal */}
      <DonorRegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onDonorRegistered={loadGlobalData}
      />

      {/* Emergency Request Modal */}
      <EmergencyRequestModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        onRequestCreated={loadGlobalData}
      />

        {/* Real-time floating alerts */}
        <ToastAlert
          notifications={toasts}
          onDismiss={handleDismissToast}
          onViewRequest={handleViewRequestDetails}
        />
      </div>{/* end inner flex flex-col */}
    </div>
  );
}
