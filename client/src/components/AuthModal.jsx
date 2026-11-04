import React, { useState } from 'react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const MIN_WEIGHT_KG = 50;
const REQUIRED_INTERVAL_DAYS = 120;

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

export default function AuthModal({
  isOpen,
  onClose,
  initialRole = 'donor',
  initialMode = 'login',
  onLoginSuccess
}) {
  if (!isOpen) return null;

  const [role, setRole] = useState(initialRole === 'admin' ? 'admin' : 'donor');
  const [mode, setMode] = useState(initialRole === 'admin' ? 'login' : initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: 26,
    gender: 'Male',
    weightKg: 55,
    hasDonatedBefore: false,
    lastDonationDate: '',
    bloodGroup: 'O+',
    city: 'Chennai',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  // Eligibility evaluation
  const weight = Number(formData.weightKg) || 0;
  const isWeightEligible = weight >= MIN_WEIGHT_KG;

  let isIntervalEligible = true;
  let intervalDaysPassed = null;
  const todayStr = new Date().toISOString().split('T')[0];

  if (formData.hasDonatedBefore) {
    if (!formData.lastDonationDate) {
      isIntervalEligible = false;
    } else {
      const prevDate = new Date(formData.lastDonationDate);
      if (!isNaN(prevDate.getTime())) {
        const diffMs = Date.now() - prevDate.getTime();
        intervalDaysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        isIntervalEligible = intervalDaysPassed >= REQUIRED_INTERVAL_DAYS;
      } else {
        isIntervalEligible = false;
      }
    }
  }

  const isOverallEligible = isWeightEligible && isIntervalEligible;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let payload;

      if (mode === 'login') {
        payload = { email: formData.email, password: formData.password, role };
      } else {
        // Eligibility checks
        if (!isWeightEligible) {
          throw new Error("Your current weight is below the application's preliminary donor screening threshold of 50 kg. Please consult a qualified blood-bank professional.");
        }
        if (formData.hasDonatedBefore && !isIntervalEligible) {
          throw new Error('Your previous blood donation was recent. Please wait until the required donation interval has passed before attempting another donation.');
        }

        // Validate 10-digit mobile number
        const digitsOnly = String(formData.phone).replace(/\D/g, '');
        let tenDigits = digitsOnly;
        if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
          tenDigits = digitsOnly.slice(2);
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
          tenDigits = digitsOnly.slice(1);
        }

        if (tenDigits.length !== 10) {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }

        if (!/^[6-9]\d{9}$/.test(tenDigits)) {
          throw new Error('Mobile number must be 10 digits starting with 6, 7, 8, or 9.');
        }

        payload = {
          ...formData,
          phone: tenDigits,
          weightKg: weight,
          minimumWeightThreshold: MIN_WEIGHT_KG,
          requiredDonationIntervalDays: REQUIRED_INTERVAL_DAYS,
          hasDonatedBefore: formData.hasDonatedBefore,
          lastDonationDate: formData.hasDonatedBefore ? formData.lastDonationDate : null,
          preliminaryEligibilityStatus: isOverallEligible ? 'PRELIMINARILY ELIGIBLE' : 'NOT ELIGIBLE',
          medicalScreeningStatus: isOverallEligible ? 'AWAITING_MEDICAL_SCREENING' : 'NOT_ELIGIBLE',
          isAvailable: isOverallEligible,
          availabilityStatus: isOverallEligible ? 'Available' : 'Inactive',
          role: 'donor'
        };
      }

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      setSuccessMsg(data.message || 'Authentication successful!');

      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.token);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#233746]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFEFA] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#D8E2DF]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Official Logo */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#D8E2DF]">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/logo.png"
              alt="BloodConnect Official Logo"
              className="w-12 h-12 rounded-2xl object-contain shadow-md border border-[#D8E2DF] bg-white p-1 flex-shrink-0"
            />
            <div>
              <h3 className="text-xl font-black text-[#233746]">
                {mode === 'login' ? 'Account Sign In' : 'Register New Volunteer Donor'}
              </h3>
              <p className="text-xs text-[#526675] mt-0.5 font-medium">
                Portal: <span className="font-bold text-[#237B8C] uppercase">{role} ACCESS</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#EAF5F6] text-[#526675] hover:text-[#233746] flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Role Selector Tabs: Donor and Admin ONLY */}
        <div className="flex bg-[#EAF5F6] p-1 rounded-2xl gap-1 mb-5 border border-[#D8E2DF]">
          <button
            type="button"
            onClick={() => {
              setRole('donor');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              role === 'donor'
                ? 'bg-[#FFFEFA] text-[#1F616F] shadow-xs'
                : 'text-[#526675] hover:text-[#233746]'
            }`}
          >
            <i className="fa-solid fa-user-nurse text-xs"></i>
            <span>Donor Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setMode('login');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              role === 'admin'
                ? 'bg-[#FFFEFA] text-[#1F616F] shadow-xs'
                : 'text-[#526675] hover:text-[#233746]'
            }`}
          >
            <i className="fa-solid fa-shield-halved text-xs"></i>
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Mode Toggle (Sign In vs Register for Donor) */}
        {role === 'donor' && (
          <div className="flex border-b border-[#D8E2DF] mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`pb-2.5 mr-6 border-b-2 transition ${
                mode === 'login'
                  ? 'border-[#237B8C] text-[#237B8C]'
                  : 'border-transparent text-[#526675] hover:text-[#233746]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`pb-2.5 border-b-2 transition ${
                mode === 'register'
                  ? 'border-[#237B8C] text-[#237B8C]'
                  : 'border-transparent text-[#526675] hover:text-[#233746]'
              }`}
            >
              Register as Donor
            </button>
          </div>
        )}

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-2xl text-xs flex items-center space-x-2">
            <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-[#F0FDF4] text-[#166534] border border-[#86EFAC] rounded-2xl text-xs flex items-center space-x-2">
            <i className="fa-solid fa-circle-check flex-shrink-0"></i>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#233746] mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Senthil Kumar"
                className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#233746] mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
            />
          </div>

          {mode === 'register' && (
            <>
              {/* Gender & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#233746] mb-1">Gender</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {GENDERS.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`py-2 rounded-xl text-xs font-bold transition border ${
                          formData.gender === g
                            ? 'bg-[#237B8C] text-white border-[#237B8C] shadow-xs'
                            : 'bg-[#FFFDF7] text-[#233746] border-[#D8E2DF] hover:bg-[#EAF5F6]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#233746] mb-1">Age (18-65)</label>
                  <input
                    type="number"
                    name="age"
                    min="18"
                    max="65"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full border border-[#D8E2DF] rounded-xl p-2 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                  />
                </div>
              </div>

              {/* Weight Verification */}
              <div className="p-3 bg-[#FFFDF7] border border-[#D8E2DF] rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#233746]">
                    Body Weight (kg) <span className="text-[#DC2626]">*</span>
                  </label>
                  <span className="text-[10px] text-[#526675]">Min: {MIN_WEIGHT_KG} kg</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    name="weightKg"
                    min="30"
                    max="200"
                    value={formData.weightKg}
                    onChange={handleChange}
                    className={`flex-1 border rounded-xl p-2 text-sm bg-white focus:outline-none ${
                      isWeightEligible ? 'border-[#86EFAC]' : 'border-[#FCA5A5]'
                    }`}
                  />
                  <span className={`text-xs font-bold ${isWeightEligible ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                    {isWeightEligible ? '✓ Pass' : '✗ Under 50kg'}
                  </span>
                </div>
                {!isWeightEligible ? (
                  <p className="text-[10px] text-[#DC2626] leading-tight">
                    Your current weight is below the application's preliminary donor screening threshold of 50 kg. Please consult a qualified blood-bank professional.
                  </p>
                ) : (
                  <p className="text-[10px] text-[#16A34A] leading-tight">
                    Weight requirement passed. Please complete the remaining eligibility screening.
                  </p>
                )}
              </div>

              {/* Previous Donation Verification */}
              <div className="p-3 bg-[#FFFDF7] border border-[#D8E2DF] rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-[#233746]">
                  Have you donated blood before?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasDonatedBefore: true })}
                    className={`py-1.5 rounded-xl text-xs font-bold border ${
                      formData.hasDonatedBefore ? 'bg-[#237B8C] text-white border-[#237B8C]' : 'bg-white border-[#D8E2DF]'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hasDonatedBefore: false, lastDonationDate: '' })}
                    className={`py-1.5 rounded-xl text-xs font-bold border ${
                      !formData.hasDonatedBefore ? 'bg-[#237B8C] text-white border-[#237B8C]' : 'bg-white border-[#D8E2DF]'
                    }`}
                  >
                    No (First Time)
                  </button>
                </div>

                {formData.hasDonatedBefore && (
                  <div className="pt-1.5">
                    <label className="block text-xs font-bold text-[#233746] mb-1">
                      Date of last donation (Min {REQUIRED_INTERVAL_DAYS} days ago)
                    </label>
                    <input
                      type="date"
                      name="lastDonationDate"
                      max={todayStr}
                      value={formData.lastDonationDate}
                      onChange={handleChange}
                      className={`w-full border rounded-xl p-2 text-xs bg-white focus:outline-none ${
                        isIntervalEligible ? 'border-[#86EFAC]' : 'border-[#FCA5A5]'
                      }`}
                    />
                    {formData.lastDonationDate && (
                      <p className={`text-[10px] mt-1 ${isIntervalEligible ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                        {isIntervalEligible
                          ? `Donation interval requirement passed (${intervalDaysPassed} days).`
                          : 'Your previous blood donation was recent. Please wait until the required donation interval has passed before attempting another donation.'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#233746] mb-1">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#233746] mb-1">
                    Mobile Number (10 Digits) <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    maxLength={13}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9840123456"
                    className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                  />
                  <span className="text-[10px] text-[#526675] mt-0.5 block">
                    10 digits only
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">Tamil Nadu District</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                >
                  {TAMIL_NADU_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">Address / Landmark</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Anna Nagar, Near Roundtana"
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'register' && !isOverallEligible)}
            className={`w-full font-bold py-3 rounded-2xl transition shadow-xs text-sm active:scale-95 mt-3 ${
              mode === 'login' || isOverallEligible
                ? 'bg-[#237B8C] hover:bg-[#1F616F] text-white disabled:opacity-50'
                : 'bg-[#9CA3AF] text-white cursor-not-allowed opacity-60'
            }`}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : !isOverallEligible ? 'Eligibility Screening Incomplete' : 'Complete Donor Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
