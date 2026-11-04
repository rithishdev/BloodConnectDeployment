import React, { useState, useEffect, useMemo } from 'react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const TAMIL_NADU_DISTRICTS = [
  'Chennai',
  'Coimbatore',
  'Madurai',
  'Tiruchirappalli',
  'Salem',
  'Erode',
  'Tiruppur',
  'Thanjavur',
  'Vellore',
  'Tirunelveli',
  'Dindigul'
];

export default function AvailableBloodView({ onOpenRequest, onOpenRegister, onNavigateHospitals }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterCity, setFilterCity] = useState('ALL');

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHospitals(data.data);
      }
    } catch (err) {
      console.warn('Hospital fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const cities = useMemo(() => {
    const set = new Set();
    hospitals.forEach((h) => {
      if (h.city) set.add(h.city);
    });
    return Array.from(set).sort();
  }, [hospitals]);

  // Expand hospital blood inventory into individual blood inventory cards
  const inventoryCards = useMemo(() => {
    const list = [];
    hospitals.forEach((h) => {
      const inv = h.bloodInventory || {};
      BLOOD_GROUPS.forEach((bg) => {
        const units = inv[bg] !== undefined ? inv[bg] : 0;
        let status = 'Available';
        let urgency = 'Normal';
        if (units <= 2) {
          status = 'Critical Shortage';
          urgency = 'Critical';
        } else if (units <= 5) {
          status = 'Low Stock';
          urgency = 'Warning';
        }

        list.push({
          id: `${h._id}_${bg}`,
          bloodType: bg,
          units,
          hospital: h.name,
          city: h.city || 'Chennai',
          phone: h.phone || h.emergencyHotline || '+91 44 2530 5000',
          status,
          urgency
        });
      });
    });
    return list;
  }, [hospitals]);

  const filteredItems = useMemo(() => {
    return inventoryCards.filter((item) => {
      if (filterGroup !== 'ALL' && item.bloodType !== filterGroup) return false;
      if (filterCity !== 'ALL' && item.city !== filterCity) return false;
      return true;
    });
  }, [inventoryCards, filterGroup, filterCity]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8F3E8] min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#233746]">Available Blood Stock Inventory</h1>
          <p className="text-sm text-[#526675] mt-1 font-medium">
            Live blood stock verified across accredited hospital blood banks in Tamil Nadu.
          </p>
        </div>
        <button
          onClick={onOpenRequest}
          className="bg-[#237B8C] hover:bg-[#1F616F] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center active:scale-95"
        >
          <i className="fa-solid fa-plus-circle mr-2"></i> Post Emergency Request
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#FFFEFA] p-5 rounded-2xl border border-[#D8E2DF] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Blood Group</label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#233746] rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#237B8C]"
            >
              <option value="ALL">All Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">District</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
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

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterGroup('ALL');
                setFilterCity('ALL');
              }}
              className="w-full bg-[#EAF5F6] hover:bg-[#DCEEF2] text-[#1F616F] font-bold py-2 rounded-xl text-sm border border-[#D8E2DF] transition flex items-center justify-center active:scale-95"
            >
              <i className="fa-solid fa-rotate-left mr-2 text-xs"></i> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center text-[#526675]">
          <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#237B8C] mb-2"></i>
          <p className="text-sm font-semibold">Fetching hospital inventory...</p>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => {
            const isCritical = item.urgency === 'Critical';
            const isLow = item.urgency === 'Warning';

            return (
              <div
                key={item.id}
                className="bg-[#FFFEFA] rounded-2xl border border-[#D8E2DF] p-5 shadow-xs hover:border-[#237B8C] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#237B8C] text-white font-black text-xl flex items-center justify-center shadow-xs">
                      {item.bloodType}
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
                          : isLow
                          ? 'bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]'
                          : 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="mb-2">
                    <span className="text-2xl font-black text-[#233746]">{item.units}</span>
                    <span className="text-xs font-semibold text-[#526675] ml-1.5">Units in Stock</span>
                  </div>

                  <h3 className="font-bold text-xs text-[#233746] truncate mb-0.5">{item.hospital}</h3>
                  <p className="text-[11px] text-[#526675]">
                    <i className="fa-solid fa-location-dot text-[#237B8C] mr-1"></i>
                    {item.city}, Tamil Nadu
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D8E2DF] mt-3">
                  <button
                    onClick={onOpenRequest}
                    className="w-full bg-[#EAF5F6] hover:bg-[#DCEEF2] text-[#1F616F] font-bold py-1.5 rounded-xl text-xs transition border border-[#D8E2DF]"
                  >
                    Request from Hospital
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
