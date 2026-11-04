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
  'Dindigul',
  'Karur',
  'Namakkal',
  'Kanyakumari',
  'Thoothukudi',
  'Sivaganga',
  'Virudhunagar',
  'Cuddalore',
  'Dharmapuri',
  'Krishnagiri',
  'Chengalpattu',
  'Kanchipuram',
  'Tiruvallur',
  'Ranipet',
  'Tirupattur',
  'Tenkasi',
  'Mayiladuthurai',
  'Nagapattinam',
  'The Nilgiris',
  'Perambalur',
  'Ariyalur',
  'Theni',
  'Ramanathapuram',
  'Pudukkottai'
];

export default function DonorSearchView({ onOpenRegister, initialFilters = null }) {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters
  const [filterGroup, setFilterGroup] = useState(() => {
    if (initialFilters?.bloodGroup && initialFilters.bloodGroup !== 'ALL') return initialFilters.bloodGroup;
    try {
      const saved = sessionStorage.getItem('bc_donor_search_filter');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bloodGroup && parsed.bloodGroup !== 'ALL') return parsed.bloodGroup;
      }
    } catch (e) {}
    return 'ALL';
  });

  const [filterCity, setFilterCity] = useState(() => {
    if (initialFilters?.city && initialFilters.city !== 'ALL') return initialFilters.city;
    try {
      const saved = sessionStorage.getItem('bc_donor_search_filter');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.city && parsed.city !== 'ALL') return parsed.city;
      }
    } catch (e) {}
    return 'ALL';
  });

  const [eligibilityFilter, setEligibilityFilter] = useState('AVAILABLE'); // 'ALL', 'AVAILABLE', 'MEDICALLY_CLEARED'
  const [searchTerm, setSearchTerm] = useState('');
  const [contactedToast, setContactedToast] = useState(null);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.bloodGroup) setFilterGroup(initialFilters.bloodGroup);
      if (initialFilters.city) setFilterCity(initialFilters.city);
    }
  }, [initialFilters]);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/donors');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDonors(data.data);
      }
    } catch (err) {
      console.warn('Could not load donors:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const filteredDonors = useMemo(() => {
    return donors.filter((d) => {
      // 1. Strict Blood Group Matching
      if (filterGroup && filterGroup !== 'ALL') {
        if ((d.bloodGroup || '').toUpperCase() !== filterGroup.toUpperCase()) return false;
      }

      // 2. Strict City Matching
      if (filterCity && filterCity !== 'ALL') {
        if ((d.city || '').toLowerCase() !== filterCity.toLowerCase()) return false;
      }

      // 3. Eligibility Filter
      const isNotEligible =
        d.preliminaryEligibilityStatus === 'NOT ELIGIBLE' ||
        d.medicalScreeningStatus === 'NOT_ELIGIBLE' ||
        (d.weightKg && d.weightKg < 50);
      if (eligibilityFilter === 'AVAILABLE') {
        // Exclude donors who failed preliminary screening
        if (isNotEligible) return false;
      } else if (eligibilityFilter === 'MEDICALLY_CLEARED') {
        if (d.medicalScreeningStatus !== 'MEDICALLY_CLEARED') return false;
      }

      // 4. Name or search term filtering
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const nameMatch = d.name && d.name.toLowerCase().includes(term);
        const cityMatch = d.city && d.city.toLowerCase().includes(term);
        const phoneMatch = d.phone && d.phone.includes(term);
        if (!nameMatch && !cityMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [donors, filterGroup, filterCity, eligibilityFilter, searchTerm]);

  const handleContactDonor = (donor) => {
    setContactedToast(`Emergency dispatch request sent to ${donor.name} (${donor.bloodGroup})!`);
    setTimeout(() => setContactedToast(null), 4000);
  };

  const handleResetFilters = () => {
    setFilterGroup('ALL');
    setFilterCity('ALL');
    setEligibilityFilter('AVAILABLE');
    setSearchTerm('');
    sessionStorage.removeItem('bc_donor_search_filter');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8F3E8] min-h-screen">
      {/* Toast Alert */}
      {contactedToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#233746] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-[#D8E2DF]">
          <i className="fa-solid fa-circle-check text-[#16A34A]"></i>
          <span>{contactedToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#233746]">Blood Donors Directory</h1>
          <p className="text-sm text-[#526675] mt-1 font-medium">
            Connect with screened volunteer blood donors across Tamil Nadu districts.
          </p>
        </div>
        <button
          onClick={onOpenRegister}
          className="bg-[#237B8C] hover:bg-[#1F616F] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center active:scale-95"
        >
          <i className="fa-solid fa-heart-pulse mr-2"></i> Register as Donor
        </button>
      </div>

      {/* DONOR SEARCH FILTERS */}
      <div className="bg-[#FFFEFA] p-5 rounded-2xl border border-[#D8E2DF] shadow-sm space-y-4">
        {/* Eligibility View Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#D8E2DF] pb-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setEligibilityFilter('AVAILABLE')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              eligibilityFilter === 'AVAILABLE'
                ? 'bg-[#16A34A] text-white shadow-xs'
                : 'bg-[#FFFDF7] text-[#526675] border border-[#D8E2DF] hover:bg-[#EAF5F6]'
            }`}
          >
            <i className="fa-solid fa-circle-check text-xs"></i>
            <span>Available & Preliminarily Eligible</span>
          </button>

          <button
            type="button"
            onClick={() => setEligibilityFilter('MEDICALLY_CLEARED')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              eligibilityFilter === 'MEDICALLY_CLEARED'
                ? 'bg-[#237B8C] text-white shadow-xs'
                : 'bg-[#FFFDF7] text-[#526675] border border-[#D8E2DF] hover:bg-[#EAF5F6]'
            }`}
          >
            <i className="fa-solid fa-user-shield text-xs"></i>
            <span>Medically Cleared Only</span>
          </button>

          <button
            type="button"
            onClick={() => setEligibilityFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              eligibilityFilter === 'ALL'
                ? 'bg-[#233746] text-white shadow-xs'
                : 'bg-[#FFFDF7] text-[#526675] border border-[#D8E2DF] hover:bg-[#EAF5F6]'
            }`}
          >
            <i className="fa-solid fa-list-check text-xs"></i>
            <span>All Registered Donors</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Blood Group</label>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#233746] rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#237B8C]"
            >
              <option value="ALL">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Tamil Nadu District</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#233746] rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#237B8C]"
            >
              <option value="ALL">All Districts</option>
              {TAMIL_NADU_DISTRICTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Search by Name or Area</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Senthil, Anna Nagar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#233746] rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#237B8C]"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-[#526675] text-xs"></i>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full bg-[#EAF5F6] text-[#1F616F] font-bold py-2 rounded-xl text-sm border border-[#D8E2DF] hover:bg-[#DCEEF2] transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Active Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[#526675] font-semibold">Active Criteria:</span>
          {filterGroup !== 'ALL' && (
            <span className="bg-[#DCEEF2] text-[#1F616F] px-2.5 py-1 rounded-full font-bold flex items-center">
              Group: {filterGroup}
              <button onClick={() => setFilterGroup('ALL')} className="ml-1.5 hover:text-black">×</button>
            </span>
          )}
          {filterCity !== 'ALL' && (
            <span className="bg-[#DCEEF2] text-[#1F616F] px-2.5 py-1 rounded-full font-bold flex items-center">
              District: {filterCity}
              <button onClick={() => setFilterCity('ALL')} className="ml-1.5 hover:text-black">×</button>
            </span>
          )}
          <span className="bg-[#EAF5F6] text-[#233746] px-2.5 py-1 rounded-full font-semibold">
            Showing {filteredDonors.length} matches
          </span>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-12 text-center text-[#526675]">
          <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#237B8C] mb-2"></i>
          <p className="text-sm font-semibold">Loading donors directory...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDonors.length === 0 && (
        <div className="bg-[#FFFEFA] p-12 text-center rounded-3xl border border-[#D8E2DF] shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#FEF2F2] text-[#DC2626] rounded-full flex items-center justify-center mx-auto text-2xl">
            <i className="fa-solid fa-user-slash"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#233746]">No matching donors found</h3>
            <p className="text-xs text-[#526675] mt-1 leading-relaxed">
              No donors with blood group <span className="font-bold text-[#233746]">{filterGroup !== 'ALL' ? filterGroup : 'any'}</span> found in <span className="font-bold text-[#233746]">{filterCity !== 'ALL' ? filterCity : 'the selected district'}</span> matching this criteria.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleResetFilters}
              className="bg-[#EAF5F6] text-[#1F616F] font-bold px-4 py-2 rounded-xl text-xs border border-[#D8E2DF]"
            >
              Clear Filters
            </button>
            <button
              onClick={onOpenRegister}
              className="bg-[#237B8C] text-white font-bold px-4 py-2 rounded-xl text-xs"
            >
              Register as Donor in {filterCity !== 'ALL' ? filterCity : 'Tamil Nadu'}
            </button>
          </div>
        </div>
      )}

      {/* DONOR CARDS GRID */}
      {!loading && filteredDonors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonors.map((donor) => {
            const isCleared = donor.medicalScreeningStatus === 'MEDICALLY_CLEARED';
            const isNotEligible =
              donor.preliminaryEligibilityStatus === 'NOT ELIGIBLE' ||
              donor.medicalScreeningStatus === 'NOT_ELIGIBLE' ||
              (donor.weightKg && donor.weightKg < 50);
            const isPrelimPass = !isNotEligible;

            return (
              <div
                key={donor._id || donor.id}
                className="bg-[#FFFEFA] rounded-2xl border border-[#D8E2DF] p-5 shadow-xs hover:border-[#237B8C] transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Name, Blood Group, Availability */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-[#237B8C] text-white font-black text-xl flex items-center justify-center shadow-xs">
                        {donor.bloodGroup}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#233746]">{donor.name}</h3>
                        <p className="text-xs font-medium text-[#526675]">
                          <i className="fa-solid fa-location-dot text-[#237B8C] mr-1"></i>
                          {donor.city}, Tamil Nadu
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center ${
                        donor.isAvailable && !isNotEligible
                          ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                          : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          donor.isAvailable && !isNotEligible ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                        }`}
                      ></span>
                      {donor.isAvailable && !isNotEligible ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* ─── ELIGIBILITY BADGES ─── */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {isCleared ? (
                      <span className="bg-[#16A34A] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center">
                        <i className="fa-solid fa-certificate mr-1 text-[9px]"></i> Medically Cleared
                      </span>
                    ) : isPrelimPass ? (
                      <span className="bg-[#EAF5F6] text-[#1F616F] border border-[#DCEEF2] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center">
                        <i className="fa-solid fa-clock mr-1 text-[9px] text-[#F59E0B]"></i> Awaiting Medical Screening
                      </span>
                    ) : (
                      <span className="bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center">
                        <i className="fa-solid fa-ban mr-1 text-[9px]"></i> Not Eligible
                      </span>
                    )}

                    {donor.gender && (
                      <span className="bg-[#FFFDF7] border border-[#D8E2DF] text-[#526675] text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {donor.gender}
                      </span>
                    )}

                    {donor.weightKg && (
                      <span className="bg-[#FFFDF7] border border-[#D8E2DF] text-[#526675] text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {donor.weightKg} kg
                      </span>
                    )}
                  </div>

                  {/* Donor Info Details */}
                  <div className="space-y-1.5 text-xs text-[#526675] py-2 border-y border-[#D8E2DF] my-2">
                    {donor.address && (
                      <p className="truncate">
                        <span className="font-semibold text-[#233746]">Area:</span> {donor.address}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-[#233746]">Donation History:</span>{' '}
                      {donor.hasDonatedBefore ? (
                        <span className="text-[#233746] font-medium">
                          Previous donor ({donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : 'Recorded'})
                        </span>
                      ) : (
                        <span className="text-[#16A34A] font-bold">First-time volunteer</span>
                      )}
                    </p>
                    {donor.notes && (
                      <p className="text-[11px] italic text-[#526675] line-clamp-1">
                        "{donor.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2">
                  <button
                    onClick={() => handleContactDonor(donor)}
                    disabled={isNotEligible}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xs active:scale-95 ${
                      isNotEligible
                        ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                        : 'bg-[#237B8C] hover:bg-[#1F616F] text-white'
                    }`}
                  >
                    <i className="fa-solid fa-paper-plane text-xs"></i>
                    <span>{isNotEligible ? 'Donor Ineligible' : 'Send Emergency Dispatch'}</span>
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
