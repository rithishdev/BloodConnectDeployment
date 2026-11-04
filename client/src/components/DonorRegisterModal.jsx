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

export default function DonorRegisterModal({ isOpen, onClose, onDonorRegistered }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    age: 25,
    weightKg: 55,
    hasDonatedBefore: false,
    lastDonationDate: '',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: '',
    emergencyRadiusKm: 25,
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Dynamic eligibility screening calculations
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
    setSubmitting(true);
    setErrorMsg('');

    try {
      // Weight check
      if (!isWeightEligible) {
        throw new Error("Your current weight is below the application's preliminary donor screening threshold of 50 kg. Please consult a qualified blood-bank professional.");
      }

      // Interval check
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

      const payload = {
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
        state: 'Tamil Nadu'
      };

      const res = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to register donor in the database.');
      }

      setSuccess(true);
      if (onDonorRegistered) onDonorRegistered(data.data);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
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
                Volunteer Donor Registration
              </h3>
              <p className="text-xs text-[#526675] font-medium mt-0.5">
                Join the Tamil Nadu emergency blood dispatch grid
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

        {success ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center text-3xl mx-auto shadow-xs">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h4 className="text-xl font-black text-[#233746]">
              Registration Saved to Live Grid!
            </h4>
            <p className="text-xs text-[#526675] max-w-sm mx-auto leading-relaxed">
              Thank you for volunteering. Your profile is now stored permanently in the MongoDB network database and active for proximity matches in Tamil Nadu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-2xl text-xs flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ─── PRELIMINARY SCREENING STATUS BANNER ─── */}
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                isOverallEligible
                  ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
                  : 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <i className={`fa-solid ${isOverallEligible ? 'fa-circle-check' : 'fa-triangle-exclamation'} text-sm`}></i>
                <div>
                  <span className="font-bold uppercase tracking-wide">
                    {isOverallEligible ? 'Preliminary Screening Passed' : 'Preliminary Screening Attention'}
                  </span>
                  <p className="text-[11px] opacity-90">
                    {isOverallEligible
                      ? 'Status: Awaiting Medical Screening by blood-bank staff'
                      : 'Weight or donation interval does not meet preliminary criteria'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                isOverallEligible ? 'bg-[#16A34A] text-white' : 'bg-[#DC2626] text-white'
              }`}>
                {isOverallEligible ? 'Eligible' : 'Not Eligible'}
              </span>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#233746] mb-1">
                Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Karthik Raman"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
              />
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1.5">
                  Gender <span className="text-[#DC2626]">*</span>
                </label>
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
                <label className="block text-xs font-bold text-[#233746] mb-1.5">
                  Age (18 - 65)
                </label>
                <input
                  type="number"
                  min="18"
                  max="65"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>
            </div>

            {/* ─── DONOR ELIGIBILITY SCREENING: WEIGHT ─── */}
            <div className="p-3.5 bg-[#FFFDF7] border border-[#D8E2DF] rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-[#233746]">
                  Body Weight (in kg) <span className="text-[#DC2626]">*</span>
                </label>
                <span className="text-[10px] font-semibold text-[#526675]">
                  Minimum threshold: {MIN_WEIGHT_KG} kg
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="30"
                    max="200"
                    step="0.5"
                    required
                    placeholder="e.g. 58"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 text-sm bg-white text-[#233746] focus:outline-none ${
                      isWeightEligible ? 'border-[#86EFAC]' : 'border-[#FCA5A5]'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#526675] font-bold">kg</span>
                </div>
                <div className="text-xs font-bold flex items-center">
                  {isWeightEligible ? (
                    <span className="text-[#16A34A] flex items-center">
                      <i className="fa-solid fa-check-circle mr-1"></i> Pass
                    </span>
                  ) : (
                    <span className="text-[#DC2626] flex items-center">
                      <i className="fa-solid fa-circle-xmark mr-1"></i> Under 50 kg
                    </span>
                  )}
                </div>
              </div>

              {/* Weight Feedback Message */}
              {!isWeightEligible ? (
                <p className="text-[11px] text-[#DC2626] font-medium leading-tight">
                  Your current weight is below the application's preliminary donor screening threshold of 50 kg. Please consult a qualified blood-bank professional.
                </p>
              ) : (
                <p className="text-[11px] text-[#16A34A] font-medium leading-tight">
                  Weight requirement passed. Please complete the remaining eligibility screening.
                </p>
              )}
            </div>

            {/* ─── DONOR ELIGIBILITY SCREENING: LAST DONATION ─── */}
            <div className="p-3.5 bg-[#FFFDF7] border border-[#D8E2DF] rounded-2xl space-y-2.5">
              <label className="block text-xs font-bold text-[#233746]">
                Have you donated blood before? <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasDonatedBefore: true })}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    formData.hasDonatedBefore
                      ? 'bg-[#237B8C] text-white border-[#237B8C] shadow-xs'
                      : 'bg-white text-[#233746] border-[#D8E2DF] hover:bg-[#EAF5F6]'
                  }`}
                >
                  Yes, I have donated before
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hasDonatedBefore: false, lastDonationDate: '' })}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    !formData.hasDonatedBefore
                      ? 'bg-[#237B8C] text-white border-[#237B8C] shadow-xs'
                      : 'bg-white text-[#233746] border-[#D8E2DF] hover:bg-[#EAF5F6]'
                  }`}
                >
                  No, I am a first-time donor
                </button>
              </div>

              {/* Date of last blood donation if YES */}
              {formData.hasDonatedBefore && (
                <div className="pt-2 border-t border-[#D8E2DF] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-[#233746]">
                      Date of your last blood donation <span className="text-[#DC2626]">*</span>
                    </label>
                    <span className="text-[10px] text-[#526675]">
                      Min interval: {REQUIRED_INTERVAL_DAYS} days
                    </span>
                  </div>
                  <input
                    type="date"
                    max={todayStr}
                    required={formData.hasDonatedBefore}
                    value={formData.lastDonationDate}
                    onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                    className={`w-full border rounded-xl p-2.5 text-sm bg-white text-[#233746] focus:outline-none ${
                      isIntervalEligible ? 'border-[#86EFAC]' : 'border-[#FCA5A5]'
                    }`}
                  />

                  {formData.lastDonationDate && (
                    <>
                      {isIntervalEligible ? (
                        <p className="text-[11px] text-[#16A34A] font-medium leading-tight">
                          Donation interval requirement passed ({intervalDaysPassed} days since last donation). You may proceed to the remaining screening steps.
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#DC2626] font-medium leading-tight">
                          Your previous blood donation was recent ({intervalDaysPassed || 0} of {REQUIRED_INTERVAL_DAYS} required days). Please wait until the required donation interval has passed before attempting another donation.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Blood Group Chips */}
            <div>
              <label className="block text-xs font-bold text-[#233746] mb-1.5">
                Blood Group <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    type="button"
                    key={bg}
                    onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                    className={`py-2 rounded-xl text-xs font-black transition border ${
                      formData.bloodGroup === bg
                        ? 'bg-[#237B8C] text-white border-[#237B8C] shadow-xs'
                        : 'bg-[#FFFDF7] text-[#233746] border-[#D8E2DF] hover:bg-[#EAF5F6]'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Mobile Number (10 Digits) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={13}
                  placeholder="e.g. 9840123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
                <span className="text-[10px] text-[#526675] mt-0.5 block">
                  Must be exactly 10 digits
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="donor@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>
            </div>

            {/* District & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Tamil Nadu District <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                >
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Locality / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. T. Nagar, Near Bus Stand"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>
            </div>

            {/* Volunteer Notes */}
            <div>
              <label className="block text-xs font-bold text-[#233746] mb-1">
                Volunteer Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Available on weekends, can reach Coimbatore GH within 20 mins..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-[#D8E2DF] rounded-xl p-2 text-xs bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#526675] hover:bg-[#EAF5F6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !isOverallEligible}
                className={`font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm active:scale-95 flex items-center ${
                  isOverallEligible
                    ? 'bg-[#237B8C] hover:bg-[#1F616F] text-white disabled:opacity-50'
                    : 'bg-[#9CA3AF] text-white cursor-not-allowed opacity-60'
                }`}
              >
                <i className="fa-solid fa-heart mr-2 text-white"></i>
                <span>
                  {submitting
                    ? 'Saving to Database...'
                    : !isOverallEligible
                    ? 'Preliminary Screening Incomplete'
                    : 'Complete Registration'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
