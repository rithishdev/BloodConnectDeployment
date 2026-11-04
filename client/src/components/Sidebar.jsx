import React from 'react';

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',             icon: 'fa-house' },
  { id: 'available', label: 'Find Blood',        icon: 'fa-box-archive' },
  { id: 'search',    label: 'Search Donors',     icon: 'fa-users' },
  { id: 'requests',  label: 'Blood Requests',    icon: 'fa-notes-medical', badge: true },
  { id: 'hospitals', label: 'Hospital Hub',      icon: 'fa-hospital' },
  { id: 'admin',     label: 'Admin Dashboard',   icon: 'fa-chart-line', adminOnly: true },
  { id: 'analytics', label: 'Supply Analytics',  icon: 'fa-chart-pie',  adminOnly: true },
];

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenAuthModal,
  onOpenRegister,
  onOpenRequest,
  pendingCriticalCount = 0,
}) {
  const isAdmin = currentUser?.role === 'admin';

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleNav = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* ── Overlay ───────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-[#233746]/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Sidebar Drawer ────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col
          bg-[#FFFDF7] border-r border-[#D8E2DF] shadow-2xl
          transition-transform duration-300 ease-in-out
          w-[260px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#D8E2DF] bg-[#FFFEFA]">
          <div className="flex items-center space-x-2.5">
            <img
              src="/assets/logo.png"
              alt="BloodConnect"
              className="w-9 h-9 rounded-xl object-contain shadow-xs border border-[#D8E2DF] bg-white p-0.5"
            />
            <div>
              <span className="text-base font-black tracking-tight text-[#233746]">
                Blood<span className="text-[#237B8C]">Connect</span>
              </span>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#526675] -mt-0.5">
                Tamil Nadu · Lifesaving Grid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#526675] hover:text-[#233746] hover:bg-[#EAF5F6] transition"
            aria-label="Close sidebar"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* ── Navigation Items ───────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#526675]">
            Navigation
          </p>

          {visibleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isActive
                    ? 'bg-[#DCEEF2] text-[#1F616F] shadow-sm'
                    : 'text-[#526675] hover:text-[#233746] hover:bg-[#EAF5F6]'
                  }`}
              >
                <span className="flex items-center space-x-3">
                  <i className={`fa-solid ${item.icon} w-4 text-center text-sm ${isActive ? 'text-[#237B8C]' : 'text-[#526675]'}`} />
                  <span>{item.label}</span>
                </span>
                {item.badge && pendingCriticalCount > 0 && (
                  <span className="bg-[#DC2626] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {pendingCriticalCount > 9 ? '9+' : pendingCriticalCount}
                  </span>
                )}
                {isActive && (
                  <i className="fa-solid fa-chevron-right text-[10px] text-[#237B8C]" />
                )}
              </button>
            );
          })}

          {/* ── Action Buttons ─────────────────────────── */}
          <div className="pt-4 space-y-2 border-t border-[#D8E2DF] mt-4">
            <button
              onClick={() => { onOpenRequest(); onClose(); }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold bg-[#237B8C] hover:bg-[#1F616F] text-white shadow transition active:scale-95"
            >
              <i className="fa-solid fa-plus-circle" />
              <span>Request Blood</span>
            </button>
            <button
              onClick={() => { onOpenRegister(); onClose(); }}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold bg-[#EAF5F6] hover:bg-[#DCEEF2] text-[#1F616F] border border-[#D8E2DF] transition active:scale-95"
            >
              <i className="fa-solid fa-heart-pulse text-[#237B8C]" />
              <span>Register as Donor</span>
            </button>
          </div>
        </nav>

        {/* ── Footer: User Info / Auth ────────────────────── */}
        <div className="px-3 py-4 border-t border-[#D8E2DF] bg-[#FFFEFA]">
          {currentUser ? (
            <div className="space-y-2">
              {/* User card */}
              <div className="flex items-center space-x-2.5 px-3 py-2.5 rounded-xl bg-[#EAF5F6] border border-[#D8E2DF]">
                <div className="w-8 h-8 rounded-full bg-[#237B8C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {currentUser.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#233746] truncate">{currentUser.name}</p>
                  <p className="text-[10px] font-semibold uppercase text-[#237B8C]">{currentUser.role}</p>
                </div>
              </div>
              {/* Logout button */}
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FCA5A5]/40 transition"
              >
                <i className="fa-solid fa-arrow-right-from-bracket" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => { onOpenAuthModal('donor', 'login'); onClose(); }}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold text-[#233746] bg-[#FFFEFA] border border-[#D8E2DF] hover:bg-[#EAF5F6] transition"
              >
                <i className="fa-solid fa-user-nurse text-[#237B8C]" />
                <span>Donor Login</span>
              </button>
              <button
                onClick={() => { onOpenAuthModal('admin', 'login'); onClose(); }}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold text-[#233746] bg-[#FFFEFA] border border-[#D8E2DF] hover:bg-[#EAF5F6] transition"
              >
                <i className="fa-solid fa-shield-halved text-[#1F616F]" />
                <span>Admin Login</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
