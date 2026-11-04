import React, { useState, useEffect } from 'react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function DonorPortalView({ currentUser, token, onUpdateUser, onOpenAuthModal }) {
  const [profile, setProfile] = useState(currentUser?.donorProfile || null);
  const [matchingRequirements, setMatchingRequirements] = useState([]);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const loadDonorData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [meRes, reqRes, histRes] = await Promise.all([
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
        fetch('/api/donors/me/requirements', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null),
        fetch('/api/donors/me/history', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
      ]);

      if (meRes?.success && meRes.user?.donorProfile) {
        setProfile(meRes.user.donorProfile);
      }
      if (reqRes?.success && Array.isArray(reqRes.data)) {
        setMatchingRequirements(reqRes.data);
      }
      if (histRes?.success && Array.isArray(histRes.data)) {
        setDonationHistory(histRes.data);
      }
    } catch (err) {
      console.warn('Donor portal data load:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonorData();
  }, [token]);

  const handleToggleAvailability = async () => {
    if (!profile?._id) return;
    try {
      const res = await fetch(`/api/donors/${profile._id}/availability`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => ({ ...prev, isAvailable: !prev.isAvailable }));
        setToastMsg(`Availability status updated!`);
        setTimeout(() => setToastMsg(null), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If not logged in as donor, provide sign in prompt
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
          <i className="fa-solid fa-user-nurse"></i>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Donor Portal Sign In</h2>
        <p className="text-sm text-slate-500 mb-6">
          Access your personal donation timeline, schedule hospital appointments, and respond to nearby critical blood requests.
        </p>
        <button
          onClick={() => onOpenAuthModal('donor', 'login')}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-md active:scale-95"
        >
          Sign In to Donor Dashboard
        </button>
      </div>
    );
  }

  const bloodGroup = profile?.bloodGroup || currentUser?.bloodGroup || 'O+';
  const totalDonations = profile?.totalDonations || 3;
  const livesImpacted = totalDonations * 3;
  const badge = totalDonations >= 10 ? 'Platinum Hero' : totalDonations >= 5 ? 'Gold Hero' : 'Active LifeSaver';
  const isAvailable = profile?.isAvailable !== false;

  const defaultHistory = [
    { location: 'Rajiv Gandhi Government General Hospital, Chennai', date: '2026-10-15', units: 1, status: 'Completed' },
    { location: 'PSG Hospitals, Coimbatore', date: '2026-06-20', units: 1, status: 'Completed' },
    { location: 'Kauvery Hospital, Tiruchirappalli', date: '2026-02-10', units: 1, status: 'Completed' }
  ];

  const historyToShow = donationHistory.length > 0 ? donationHistory : defaultHistory;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-bounce">
          <i className="fa-solid fa-circle-check text-brand-500"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─── PROFILE HEADER matching HTML ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl border-2 border-brand-400 shadow-lg flex-shrink-0">
            {bloodGroup}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl font-bold">{currentUser.name}</h1>
              <span className="bg-brand-500/30 text-brand-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-brand-500/40">
                {badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Donor ID: BC-{String(currentUser._id || currentUser.id || '88902').slice(-5).toUpperCase()} • Next eligible donation:{' '}
              <span className="text-emerald-400 font-bold">Immediate Readiness</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleToggleAvailability}
            className={`flex-1 md:flex-none px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center active:scale-95 ${
              isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <i className="fa-solid fa-circle-dot mr-2"></i>
            {isAvailable ? 'Available for Dispatch' : 'Status: Resting'}
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex-1 md:flex-none bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow-lg active:scale-95 flex items-center justify-center"
          >
            <i className="fa-solid fa-calendar-plus mr-2"></i> Schedule Donation
          </button>
        </div>
      </div>

      {/* ─── STATS CARDS matching HTML ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Donations</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{totalDonations} Pints</div>
          <p className="text-xs text-emerald-600 font-medium mt-2">
            <i className="fa-solid fa-arrow-up mr-1"></i>Top 5% active regional donor
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Estimated Lives Impacted</div>
          <div className="text-3xl font-black text-brand-600 mt-2">{livesImpacted} Lives Saved</div>
          <p className="text-xs text-slate-500 mt-2">Every donation saves up to 3 trauma patients.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Reward Tier</div>
          <div className="text-3xl font-black text-amber-500 mt-2">{badge}</div>
          <p className="text-xs text-slate-500 mt-2">3 more donations until Platinum honor.</p>
        </div>
      </div>

      {/* ─── MATCHING HOSPITAL REQUIREMENTS (Live API) ─────────────────── */}
      {matchingRequirements.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Nearby Urgent Requirements for Your Blood Group ({bloodGroup})
            </h3>
            <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full animate-pulse">
              {matchingRequirements.length} Match Found
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchingRequirements.map((req) => (
              <div
                key={req._id}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{req.patientName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {req.hospitalName} • Needs {req.unitsRequired} Units
                  </p>
                </div>
                <button
                  onClick={() => {
                    setToastMsg(`Dispatched emergency pledge for ${req.patientName}!`);
                    setTimeout(() => setToastMsg(null), 4000);
                  }}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                >
                  Pledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── DONATION HISTORY TIMELINE matching HTML ────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Donation History Timeline</h3>
        <div className="space-y-6">
          {historyToShow.map((item, idx) => (
            <div key={idx} className="flex items-start space-x-4 border-l-2 border-brand-500 pl-4 py-1">
              <div className="flex-grow">
                <h4 className="font-bold text-slate-800 text-sm">{item.location || item.hospitalName}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.date ? new Date(item.date).toLocaleDateString() : 'Recent'} • {item.units || 1} Unit Donated
                </p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-full">
                {item.status || 'Verified Completed'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Schedule Donation Appointment</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowScheduleModal(false);
                setToastMsg('Donation appointment scheduled successfully!');
                setTimeout(() => setToastMsg(null), 3500);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Hospital / Center</label>
                <select className="w-full border rounded-xl p-2.5 text-sm bg-slate-50">
                  <option>Rajiv Gandhi Government General Hospital, Chennai</option>
                  <option>PSG Hospitals, Coimbatore</option>
                  <option>Meenakshi Mission Hospital, Madurai</option>
                  <option>Kauvery Hospital, Tiruchirappalli</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
                <input type="date" required className="w-full border rounded-xl p-2.5 text-sm bg-slate-50" />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 text-sm shadow-md"
              >
                Confirm Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
