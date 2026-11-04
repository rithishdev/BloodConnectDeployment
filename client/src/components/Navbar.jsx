import React from 'react';

export default function Navbar({
  onToggleSidebar,
  setActiveTab,
  onOpenRequest,
  currentUser,
  onLogout,
  isConnected,
  pendingCriticalCount = 0,
  unreadCount = 0,
  showNotifDropdown = false,
  notifications = [],
  onToggleNotif,
  onMarkAllRead,
  onViewRequest,
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#FFFDF7] border-b border-[#D8E2DF] shadow-sm">
      <div className="max-w-full px-3 sm:px-5">
        <div className="flex items-center justify-between h-14">

          {/* ── Left: Hamburger + Logo ──────────────────── */}
          <div className="flex items-center space-x-3">
            {/* Hamburger – opens sidebar */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-[#233746] hover:bg-[#EAF5F6] border border-[#D8E2DF] transition"
              aria-label="Open navigation menu"
            >
              <i className="fa-solid fa-bars text-sm" />
            </button>

            {/* Logo / brand (click → home) */}
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => setActiveTab('home')}
            >
              <img
                src="/assets/logo.png"
                alt="BloodConnect"
                className="w-8 h-8 rounded-xl object-contain shadow-xs border border-[#D8E2DF] bg-white p-0.5"
              />
              <div className="hidden sm:block">
                <span className="text-base font-black tracking-tight text-[#233746]">
                  Blood<span className="text-[#237B8C]">Connect</span>
                </span>
                <span className="ml-2 hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#DCEEF2] text-[#1F616F] uppercase">
                  TN Grid
                </span>
              </div>
            </div>
          </div>

          {/* ── Right: Status + Bell + User + Request btn ── */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">

            {/* Live indicator */}
            {isConnected && (
              <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold bg-[#EAF5F6] text-[#1F616F] border border-[#DCEEF2]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5 animate-pulse" />
                Live
              </span>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={onToggleNotif}
                className="relative p-2 rounded-xl text-[#526675] hover:text-[#233746] hover:bg-[#EAF5F6] transition"
                aria-label="Notifications"
              >
                <i className="fa-solid fa-bell text-sm" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#DC2626] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFEFA] rounded-2xl shadow-xl border border-[#D8E2DF] z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 bg-[#233746] text-white flex justify-between items-center">
                    <span className="text-xs font-bold flex items-center">
                      <i className="fa-solid fa-bell text-[#38A3B8] mr-2" />
                      Network Broadcasts
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllRead}
                        className="text-[11px] text-[#B8DFE6] hover:text-white underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#D8E2DF]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#526675]">
                        No active notifications.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => n.data && onViewRequest && onViewRequest(n.data)}
                          className={`p-3 text-xs hover:bg-[#EAF5F6] transition cursor-pointer ${!n.read ? 'bg-[#FEF2F2]' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-[#233746]">{n.title}</span>
                            <span className="text-[10px] text-[#526675]">{n.time}</span>
                          </div>
                          <p className="text-[#526675] text-[11px] line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Request Blood — always visible */}
            <button
              onClick={onOpenRequest}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#237B8C] hover:bg-[#1F616F] text-white transition shadow-sm active:scale-95"
            >
              <i className="fa-solid fa-plus-circle mr-1.5" />
              <span className="hidden sm:inline">Request Blood</span>
              <span className="sm:hidden">+</span>
            </button>

            {/* Logged-in user info + logout */}
            {currentUser && (
              <div className="flex items-center space-x-1.5 pl-1.5 border-l border-[#D8E2DF]">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#233746] truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] font-semibold text-[#237B8C] uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-[#526675] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition"
                  title="Sign Out"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
