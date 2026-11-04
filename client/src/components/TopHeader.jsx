import React from 'react';

const PAGE_TITLES = {
  home: 'Dashboard & Emergency Overview',
  available: 'Available Blood Stock Inventory',
  search: 'Registered Donors Directory',
  requests: 'Emergency Blood Requests',
  hospitals: 'Partner Hospital Network',
  'donor-portal': 'Donor Profile & Donation History',
  'patient-portal': 'Patient Request & Dispatch Tracker',
  admin: 'Hospital Administration Hub',
  analytics: 'National Supply & Demand Analytics'
};

export default function TopHeader({
  activeTab,
  onToggleMobileMenu,
  onOpenAuthModal,
  currentUser,
  onLogout,
  isConnected,
  pendingCriticalCount = 0,
  notifications = [],
  unreadCount = 0,
  showNotifDropdown = false,
  onToggleNotif,
  onMarkAllRead,
  onViewRequest
}) {
  const title = PAGE_TITLES[activeTab] || 'Dashboard';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 flex justify-between items-center shadow-sm">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
          aria-label="Toggle navigation menu"
        >
          <i className="fa-solid fa-bars text-sm"></i>
        </button>
        <div className="flex items-center space-x-2.5">
          <span className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {title}
          </span>
          {isConnected && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Grid Live
            </span>
          )}
        </div>
      </div>

      {/* Right side: Notifications & Account */}
      <div className="flex items-center space-x-3">
        {/* Critical alert pill if any */}
        {pendingCriticalCount > 0 && (
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
            <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
            {pendingCriticalCount} Critical
          </span>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={onToggleNotif}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Emergency alerts"
          >
            <i className="fa-solid fa-bell text-sm"></i>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden anim-fade"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-bell text-brand-500"></i>
                  <span className="text-xs font-bold">Network Alerts</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[11px] text-slate-300 hover:text-white underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No active emergency alerts.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => n.data && onViewRequest && onViewRequest(n.data)}
                      className={`p-3 text-xs hover:bg-slate-50 transition cursor-pointer ${
                        !n.read ? 'bg-red-50/50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <span className="font-bold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Sign In */}
        {currentUser ? (
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-semibold text-brand-600 uppercase">
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl border border-red-200 transition flex items-center"
              title="Sign Out"
            >
              <i className="fa-solid fa-arrow-right-from-bracket sm:mr-1.5"></i>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onOpenAuthModal('donor', 'login')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl border border-slate-200 transition flex items-center"
          >
            <i className="fa-solid fa-user-gear mr-1.5 text-slate-500"></i>
            <span>Account</span>
          </button>
        )}
      </div>
    </header>
  );
}
