import React, { useState, useEffect, useMemo } from 'react';

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HospitalsView({ onOpenRequest, userRole, onOpenAddHospital }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState(null);
  const [phoneToast, setPhoneToast] = useState(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHospitals(data.data);
      }
    } catch (err) {
      console.warn('Hospitals fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const cities = useMemo(() => {
    const set = new Set();
    hospitals.forEach((h) => {
      if (h.city) set.add(h.city);
    });
    return Array.from(set).sort();
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      if (selectedCity !== 'ALL' && h.city !== selectedCity) return false;
      if (selectedGroup !== 'ALL') {
        const inv = h.bloodInventory || {};
        if ((inv[selectedGroup] || 0) <= 0) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = h.name && h.name.toLowerCase().includes(term);
        const matchCity = h.city && h.city.toLowerCase().includes(term);
        if (!matchName && !matchCity) return false;
      }
      return true;
    });
  }, [hospitals, selectedCity, selectedGroup, searchTerm]);

  const handleCall = (h) => {
    setPhoneToast(`Connecting to ${h.name} blood bank: ${h.phone || h.emergencyHotline || '+91 44 2530 5000'}`);
    setTimeout(() => setPhoneToast(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8F3E8] min-h-screen">
      {/* Toast Alert */}
      {phoneToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#233746] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-[#D8E2DF]">
          <i className="fa-solid fa-phone-volume text-[#38A3B8]"></i>
          <span>{phoneToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#233746]">Partner Hospital Network</h1>
          <p className="text-sm text-[#526675] mt-1 font-medium">
            Accredited trauma centers and government blood banks across Tamil Nadu.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onOpenRequest}
            className="bg-[#237B8C] hover:bg-[#1F616F] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center active:scale-95"
          >
            <i className="fa-solid fa-plus-circle mr-2"></i> Request Blood
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFEFA] p-5 rounded-2xl border border-[#D8E2DF] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Search Hospital</label>
            <input
              type="text"
              placeholder="e.g. Rajiv Gandhi, PSG, Kauvery..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#233746] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#237B8C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Filter District</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#233746] rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#237B8C]"
            >
              <option value="ALL">All Districts</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Blood Group In Stock</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#233746] rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#237B8C]"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg === 'ALL' ? 'Any Blood Type' : bg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center text-[#526675]">
          <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#237B8C] mb-2"></i>
          <p className="text-sm font-semibold">Loading partner hospitals...</p>
        </div>
      )}

      {/* Hospitals Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((h) => {
            const inv = h.bloodInventory || {};
            const totalUnits = Object.values(inv).reduce((a, b) => a + Number(b || 0), 0);

            return (
              <div
                key={h._id || h.id}
                className="bg-[#FFFEFA] rounded-2xl border border-[#D8E2DF] p-6 shadow-xs hover:border-[#237B8C] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF5F6] text-[#237B8C] flex items-center justify-center text-xl flex-shrink-0">
                      <i className="fa-solid fa-hospital"></i>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
                      <i className="fa-solid fa-certificate mr-1 text-[9px]"></i> Accredited
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-[#233746] mb-1">{h.name}</h3>
                  <p className="text-xs text-[#526675] mb-3">
                    <i className="fa-solid fa-location-dot text-[#237B8C] mr-1"></i>
                    {h.address || h.city}, Tamil Nadu
                  </p>

                  {/* Quick Mini Inventory Grid */}
                  <div className="bg-[#FFFDF7] p-3 rounded-xl border border-[#D8E2DF] mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#526675] mb-2 flex justify-between">
                      <span>Reserve Stock</span>
                      <span className="text-[#237B8C]">{totalUnits} Total Units</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {['A+', 'B+', 'O+', 'AB+'].map((bg) => (
                        <div key={bg} className="bg-[#FFFEFA] p-1.5 rounded-lg border border-[#D8E2DF]">
                          <span className="block text-[10px] font-bold text-[#526675]">{bg}</span>
                          <span className="text-xs font-black text-[#233746]">{inv[bg] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#D8E2DF]">
                  <button
                    onClick={() => handleCall(h)}
                    className="w-full bg-[#EAF5F6] hover:bg-[#DCEEF2] text-[#1F616F] font-bold py-2 rounded-xl text-xs transition border border-[#D8E2DF] flex items-center justify-center active:scale-95"
                  >
                    <i className="fa-solid fa-phone mr-1.5 text-[#237B8C]"></i>
                    {h.phone || h.emergencyHotline || '+91 44 2530 5000'}
                  </button>

                  <button
                    onClick={() => setSelectedHospitalForModal(h)}
                    className="w-full bg-[#FFFDF7] hover:bg-[#EAF5F6] text-[#233746] font-semibold py-1.5 rounded-xl text-xs transition border border-[#D8E2DF]"
                  >
                    View All 8 Blood Group Units
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Breakdown Modal */}
      {selectedHospitalForModal && (
        <div
          className="fixed inset-0 bg-[#233746]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedHospitalForModal(null)}
        >
          <div
            className="bg-[#FFFEFA] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D8E2DF]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#D8E2DF]">
              <div>
                <h3 className="text-base font-bold text-[#233746]">
                  {selectedHospitalForModal.name}
                </h3>
                <p className="text-xs text-[#526675]">Live Blood Bank Reserves</p>
              </div>
              <button
                onClick={() => setSelectedHospitalForModal(null)}
                className="w-7 h-7 rounded-full bg-[#EAF5F6] text-[#526675] hover:text-[#233746] flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => {
                const count = (selectedHospitalForModal.bloodInventory || {})[bg] || 0;
                return (
                  <div
                    key={bg}
                    className={`p-2.5 rounded-xl text-center border ${
                      count <= 2
                        ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                        : count <= 5
                        ? 'bg-[#FFFBEB] border-[#FDE68A]'
                        : 'bg-[#F0FDF4] border-[#BBF7D0]'
                    }`}
                  >
                    <span className="block text-xs font-black text-[#233746]">{bg}</span>
                    <span
                      className={`text-base font-black ${
                        count <= 2 ? 'text-[#DC2626]' : count <= 5 ? 'text-[#F59E0B]' : 'text-[#16A34A]'
                      }`}
                    >
                      {count}
                    </span>
                    <span className="block text-[9px] text-[#526675]">Units</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setSelectedHospitalForModal(null);
                onOpenRequest();
              }}
              className="w-full bg-[#237B8C] hover:bg-[#1F616F] text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Post Request to this Hospital
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
