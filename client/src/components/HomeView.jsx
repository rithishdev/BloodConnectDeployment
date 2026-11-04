import React, { useState } from 'react';

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

const COMPATIBILITY_DATA = {
  'O-': {
    canGiveTo: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['O-'],
    type: 'Universal Donor',
    description: 'Can give to all 8 blood groups. Essential for acute trauma transfusions.'
  },
  'O+': {
    canGiveTo: ['O+', 'A+', 'B+', 'AB+'],
    canReceiveFrom: ['O+', 'O-'],
    type: 'Most Common Red Blood Cell Type',
    description: 'Can donate to any Rh-positive recipient (over 80% of population).'
  },
  'A-': {
    canGiveTo: ['A-', 'A+', 'AB-', 'AB+'],
    canReceiveFrom: ['A-', 'O-'],
    type: 'Rare Negative Blood Type',
    description: 'Can donate red blood cells to A and AB patients of both Rh factors.'
  },
  'A+': {
    canGiveTo: ['A+', 'AB+'],
    canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
    type: 'Common Positive Blood Type',
    description: 'Vital blood type for oncology, emergency room, and surgical procedures.'
  },
  'B-': {
    canGiveTo: ['B-', 'B+', 'AB-', 'AB+'],
    canReceiveFrom: ['B-', 'O-'],
    type: 'Rare Donor Type (< 2% Population)',
    description: 'High clinical demand due to scarcity in blood banking reserves.'
  },
  'B+': {
    canGiveTo: ['B+', 'AB+'],
    canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
    type: 'Essential Positive Type',
    description: 'High utilization rate across critical trauma departments in Tamil Nadu.'
  },
  'AB-': {
    canGiveTo: ['AB-', 'AB+'],
    canReceiveFrom: ['AB-', 'A-', 'B-', 'O-'],
    type: 'Rarest Blood Type (< 1% Population)',
    description: 'Universal plasma donor and highly specialized transfusion profile.'
  },
  'AB+': {
    canGiveTo: ['AB+'],
    canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    type: 'Universal Recipient',
    description: 'Can receive red blood cells from every blood group in emergency surgeries.'
  }
};

export default function HomeView({
  analytics,
  onOpenRegister,
  onOpenRequest,
  onNavigateTab,
  onSearchDonors
}) {
  const [quickGroup, setQuickGroup] = useState('');
  const [quickCity, setQuickCity] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('O-');

  const summary = analytics?.summary || {
    totalDonors: 1420,
    availableDonors: 1180,
    totalRequests: 8,
    criticalRequests: 2,
    fulfilledRequests: 5,
    totalHospitals: 38
  };

  // Critical shortage alert cards with high contrast pale-red backgrounds and dark red text
  const criticalPatients = [
    {
      patient: 'Kavitha Murugesan',
      bloodType: 'O-',
      units: 3,
      hospital: 'Rajiv Gandhi Government General Hospital, Chennai',
      city: 'Chennai',
      urgency: 'CRITICAL',
      reason: 'Trauma emergency'
    },
    {
      patient: 'Deepa Natarajan',
      bloodType: 'AB-',
      units: 2,
      hospital: 'Meenakshi Mission Hospital, Madurai',
      city: 'Madurai',
      urgency: 'CRITICAL',
      reason: 'Obstetric emergency'
    },
    {
      patient: 'Sanjay Krishnan',
      bloodType: 'B+',
      units: 2,
      hospital: 'PSG Hospitals, Coimbatore',
      city: 'Coimbatore',
      urgency: 'URGENT',
      reason: 'Thalassemia treatment'
    },
    {
      patient: 'Subramaniam Chandran',
      bloodType: 'A+',
      units: 2,
      hospital: 'Kauvery Hospital, Tiruchirappalli',
      city: 'Tiruchirappalli',
      urgency: 'STANDARD',
      reason: 'Elective cardiac care'
    }
  ];

  const handleSearch = () => {
    if (onSearchDonors) {
      onSearchDonors({
        bloodGroup: quickGroup || 'ALL',
        city: quickCity || 'ALL'
      });
    } else {
      sessionStorage.setItem(
        'bc_donor_search_filter',
        JSON.stringify({ bloodGroup: quickGroup || 'ALL', city: quickCity || 'ALL' })
      );
      onNavigateTab('search');
    }
  };

  const compat = COMPATIBILITY_DATA[selectedGroup] || COMPATIBILITY_DATA['O-'];

  return (
    <div className="space-y-12 pb-16 bg-[#F8F3E8] min-h-screen">
      {/* ─── HERO SECTION (Cream & Light Ocean Blue) ───────────────────── */}
      <section className="bg-gradient-to-b from-[#EAF5F6] via-[#DCEEF2] to-[#F8F3E8] border-b border-[#D8E2DF] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines & Search */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="flex items-center space-x-3 justify-center lg:justify-start">
                <img
                  src="/assets/logo.png"
                  alt="BloodConnect Official Logo"
                  className="w-12 h-12 rounded-2xl object-contain shadow-md border border-[#D8E2DF] bg-white p-1"
                />
                <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#FFFDF7] border border-[#D8E2DF] text-[#1F616F] text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] mr-2 animate-pulse"></span>
                  Live Regional Blood Grid · Tamil Nadu
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#233746] tracking-tight leading-tight">
                Every Drop Counts.{' '}
                <span className="text-[#237B8C]">Every Life Matters.</span>
              </h1>

              <p className="text-[#526675] text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                BloodConnect links verified donors, patients, and trauma hospitals across Tamil Nadu in seconds — so critical blood reaches the bedside before the golden hour ends.
              </p>

              {/* SEARCH BOX: Blood Group & District */}
              <div className="bg-[#FFFEFA] p-4 rounded-2xl border border-[#D8E2DF] shadow-md max-w-xl mx-auto lg:mx-0">
                <div className="text-left text-xs font-bold text-[#233746] mb-2 uppercase tracking-wide flex items-center">
                  <i className="fa-solid fa-magnifying-glass text-[#237B8C] mr-2"></i>
                  Find Matching Donors in Your District
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#526675] mb-1">Blood Group</label>
                    <select
                      value={quickGroup}
                      onChange={(e) => setQuickGroup(e.target.value)}
                      className="w-full bg-[#FFFDF7] text-[#233746] text-xs font-semibold rounded-xl px-3 py-2.5 border border-[#D8E2DF] focus:outline-none focus:border-[#237B8C]"
                    >
                      <option value="">All Groups</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#526675] mb-1">District (Tamil Nadu)</label>
                    <select
                      value={quickCity}
                      onChange={(e) => setQuickCity(e.target.value)}
                      className="w-full bg-[#FFFDF7] text-[#233746] text-xs font-semibold rounded-xl px-3 py-2.5 border border-[#D8E2DF] focus:outline-none focus:border-[#237B8C]"
                    >
                      <option value="">All Districts</option>
                      {TAMIL_NADU_DISTRICTS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      className="w-full bg-[#237B8C] hover:bg-[#1F616F] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition flex items-center justify-center text-xs active:scale-95"
                    >
                      <i className="fa-solid fa-magnifying-glass mr-1.5"></i> Search Donors
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[#526675] mt-2 text-left">
                  Selecting a group and district filters strictly for that specific combination.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <button
                  onClick={onOpenRequest}
                  className="bg-[#237B8C] hover:bg-[#1F616F] text-white font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm transition flex items-center active:scale-95"
                >
                  <i className="fa-solid fa-hand-holding-medical mr-2"></i> Request Blood Urgently
                </button>
                <button
                  onClick={() => onNavigateTab('available')}
                  className="bg-[#FFFDF7] hover:bg-[#EAF5F6] text-[#233746] font-semibold px-5 py-2.5 rounded-xl text-xs shadow-xs transition border border-[#D8E2DF] flex items-center active:scale-95"
                >
                  <i className="fa-solid fa-box-archive mr-2 text-[#237B8C]"></i> Available Blood Stock
                </button>
                <button
                  onClick={onOpenRegister}
                  className="bg-[#FFFDF7] hover:bg-[#EAF5F6] text-[#233746] font-semibold px-5 py-2.5 rounded-xl text-xs shadow-xs transition border border-[#D8E2DF] flex items-center active:scale-95"
                >
                  <i className="fa-solid fa-heart-pulse mr-2 text-[#16A34A]"></i> Become Donor
                </button>
              </div>
            </div>

            {/* Right Column: CRITICAL PATIENT VISIBILITY CARD (High Contrast) */}
            <div className="lg:col-span-5">
              <div className="bg-[#FFFEFA] border border-[#D8E2DF] p-6 rounded-3xl shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D8E2DF]">
                  <div>
                    <h3 className="font-extrabold text-[#233746] text-base flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] mr-2 animate-ping"></span>
                      Emergency Blood Requests
                    </h3>
                    <p className="text-[11px] text-[#526675]">Active requirements in Tamil Nadu</p>
                  </div>
                  <span className="text-[10px] font-bold bg-[#DCEEF2] text-[#1F616F] px-2.5 py-1 rounded-full">
                    Live Feed
                  </span>
                </div>

                {/* Patient Cards with Clear Visibility & Contrast */}
                <div className="space-y-3">
                  {criticalPatients.map((p, idx) => {
                    const isCritical = p.urgency === 'CRITICAL';
                    const isUrgent = p.urgency === 'URGENT';

                    // Strict user priority styling:
                    // Critical = Pale red card (#FEF2F2), Red badge (#DC2626), Dark red text (#991B1B)
                    // Urgent = Pale orange card (#FFFBEB), Orange badge (#F59E0B), Dark orange text
                    // Standard = Pale yellow card (#FEFCE8), Yellow badge (#EAB308)
                    return (
                      <div
                        key={idx}
                        onClick={() => onNavigateTab('requests')}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isCritical
                            ? 'bg-[#FEF2F2] border-[#FCA5A5] hover:border-[#DC2626]'
                            : isUrgent
                            ? 'bg-[#FFFBEB] border-[#FDE68A] hover:border-[#F59E0B]'
                            : 'bg-[#FEFCE8] border-[#FEF08A] hover:border-[#EAB308]'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Blood Group Block */}
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-xs ${
                              isCritical
                                ? 'bg-[#DC2626] text-white'
                                : isUrgent
                                ? 'bg-[#F59E0B] text-white'
                                : 'bg-[#EAB308] text-white'
                            }`}
                          >
                            {p.bloodType}
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-[#233746]">
                                {p.patient}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isCritical
                                    ? 'bg-[#DC2626] text-white'
                                    : isUrgent
                                    ? 'bg-[#F59E0B] text-white'
                                    : 'bg-[#EAB308] text-slate-900'
                                }`}
                              >
                                {p.urgency}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-[#526675] truncate max-w-[210px] sm:max-w-[240px]">
                              {p.hospital.includes(p.city) ? p.hospital : `${p.hospital}, ${p.city}`}
                            </p>
                            <p className="text-[10px] text-[#526675]">
                              Needed: <span className="font-bold text-[#233746]">{p.units} Units</span> · {p.reason}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateTab('requests');
                            }}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                              isCritical
                                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                                : 'bg-[#237B8C] hover:bg-[#1F616F] text-white'
                            }`}
                          >
                            Respond
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => onNavigateTab('requests')}
                  className="w-full mt-4 bg-[#EAF5F6] hover:bg-[#DCEEF2] text-[#1F616F] font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center border border-[#D8E2DF] active:scale-95"
                >
                  View All Urgent Blood Requests <i className="fa-solid fa-arrow-right ml-2 text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REALTIME STATISTICS STRIP ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFEFA] rounded-3xl p-6 sm:p-8 border border-[#D8E2DF] shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[#D8E2DF]">
            <div className="pt-2 md:pt-0">
              <div className="text-2xl sm:text-4xl font-black text-[#233746]">
                {(summary.totalDonors || 1420).toLocaleString()}+
              </div>
              <div className="text-xs sm:text-sm text-[#526675] font-semibold mt-1">
                Registered Donors
              </div>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-2xl sm:text-4xl font-black text-[#16A34A]">
                {(summary.availableDonors || 1180).toLocaleString()}+
              </div>
              <div className="text-xs sm:text-sm text-[#526675] font-semibold mt-1">
                Available Now
              </div>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-2xl sm:text-4xl font-black text-[#237B8C]">
                {summary.totalHospitals || 38}+
              </div>
              <div className="text-xs sm:text-sm text-[#526675] font-semibold mt-1">
                Partner Hospitals (TN)
              </div>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-2xl sm:text-4xl font-black text-[#233746]">
                100%
              </div>
              <div className="text-xs sm:text-sm text-[#526675] font-semibold mt-1">
                Verified Blood Units
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS / 3-STEP PROCESS ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xs font-bold text-[#237B8C] uppercase tracking-widest mb-1">
            Emergency Workflow
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#233746]">
            How BloodConnect Saves Lives
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#D8E2DF] shadow-xs text-center">
            <div className="w-14 h-14 bg-[#DCEEF2] text-[#1F616F] rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-4">
              1
            </div>
            <h4 className="text-base font-bold text-[#233746] mb-2">Request or Register</h4>
            <p className="text-xs text-[#526675] leading-relaxed">
              Hospitals and patients submit blood requests with required units and priority, while volunteers register their blood group and district.
            </p>
          </div>

          <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#D8E2DF] shadow-xs text-center">
            <div className="w-14 h-14 bg-[#DCEEF2] text-[#1F616F] rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-4">
              2
            </div>
            <h4 className="text-base font-bold text-[#233746] mb-2">District Matching</h4>
            <p className="text-xs text-[#526675] leading-relaxed">
              Our automated system immediately identifies compatible blood stock and verified donors located within the recipient's district.
            </p>
          </div>

          <div className="bg-[#FFFEFA] p-6 rounded-3xl border border-[#D8E2DF] shadow-xs text-center">
            <div className="w-14 h-14 bg-[#DCEEF2] text-[#1F616F] rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-4">
              3
            </div>
            <h4 className="text-base font-bold text-[#233746] mb-2">Donate & Fulfill</h4>
            <p className="text-xs text-[#526675] leading-relaxed">
              Donors donate at the accredited hospital, the status updates to FULFILLED in the database, and the life-saving circle is completed.
            </p>
          </div>
        </div>
      </section>

      {/* ─── BLOOD GROUP COMPATIBILITY GUIDE ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFEFA] p-6 sm:p-8 rounded-3xl border border-[#D8E2DF] shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#233746]">
                Blood Transfusion Compatibility Reference
              </h3>
              <p className="text-xs text-[#526675] mt-1">
                Select your blood group to see clinical compatibility for donors and recipients.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setSelectedGroup(bg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedGroup === bg
                      ? 'bg-[#237B8C] text-white shadow-xs'
                      : 'bg-[#EAF5F6] text-[#233746] hover:bg-[#DCEEF2]'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FFFDF7] p-6 rounded-2xl border border-[#D8E2DF]">
            <div>
              <div className="text-[11px] font-bold text-[#526675] uppercase">Selected Blood Type</div>
              <div className="text-4xl font-black text-[#237B8C] mt-1">{selectedGroup}</div>
              <p className="text-xs font-bold text-[#233746] mt-2">{compat.type}</p>
              <p className="text-xs text-[#526675] mt-1">{compat.description}</p>
            </div>

            <div>
              <div className="text-[11px] font-bold text-[#526675] uppercase mb-2">
                Can Safely Donate Red Blood Cells To ({compat.canGiveTo.length} groups)
              </div>
              <div className="flex flex-wrap gap-2">
                {compat.canGiveTo.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-[#526675] uppercase mb-2">
                Can Safely Receive Red Blood Cells From ({compat.canReceiveFrom.length} groups)
              </div>
              <div className="flex flex-wrap gap-2">
                {compat.canReceiveFrom.map((g) => (
                  <span
                    key={g}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EAF5F6] text-[#1F616F] border border-[#DCEEF2]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
