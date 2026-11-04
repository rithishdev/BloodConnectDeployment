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

export default function EmergencyRequestModal({ isOpen, onClose, onRequestCreated }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O-',
    unitsRequired: 2,
    hospitalName: 'Rajiv Gandhi Government General Hospital',
    hospitalAddress: 'EVR Periyar Salai, Park Town',
    city: 'Chennai',
    urgency: 'CRITICAL',
    requesterName: '',
    requesterPhone: '',
    requesterEmail: '',
    doctorName: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      // Validate Indian phone number
      const rawPhone = String(formData.requesterPhone).replace(/[\s\-\(\)]/g, '');
      const indianPhoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(rawPhone)) {
        throw new Error('Please enter a valid 10-digit Indian contact number (e.g. +91 98765 43210).');
      }

      let cleanPhone = rawPhone;
      if (!cleanPhone.startsWith('+91')) {
        if (cleanPhone.startsWith('91') && cleanPhone.length === 12) cleanPhone = '+' + cleanPhone;
        else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) cleanPhone = '+91 ' + cleanPhone.slice(1);
        else if (cleanPhone.length === 10) cleanPhone = '+91 ' + cleanPhone;
      }

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requesterPhone: cleanPhone
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit blood request.');
      }

      setSuccess(true);
      if (onRequestCreated) onRequestCreated(data.data);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
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
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#D8E2DF]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center text-lg flex-shrink-0">
              <i className="fa-solid fa-notes-medical"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-[#233746]">
                Submit Blood Request
              </h3>
              <p className="text-xs text-[#526675] font-medium mt-0.5">
                Broadcast requirement to nearby registered donors across Tamil Nadu
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
              Request Logged in Live Grid!
            </h4>
            <p className="text-xs text-[#526675] max-w-sm mx-auto leading-relaxed">
              Your blood request is stored in the database. Active donors in your district have been notified.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-2xl text-xs flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Patient Name */}
            <div>
              <label className="block text-xs font-bold text-[#233746] mb-1">
                Patient Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kavitha Murugesan"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
              />
            </div>

            {/* Blood Group & Units */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Required Blood Group <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] font-bold focus:outline-none focus:border-[#237B8C]"
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
                  Units Required <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formData.unitsRequired}
                  onChange={(e) => setFormData({ ...formData, unitsRequired: Number(e.target.value) })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>
            </div>

            {/* Urgency Priority */}
            <div>
              <label className="block text-xs font-bold text-[#233746] mb-1.5">
                Priority Level <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CRITICAL', label: 'Critical', bg: 'bg-[#FEF2F2]', border: 'border-[#DC2626]', text: 'text-[#DC2626]' },
                  { id: 'URGENT', label: 'Urgent', bg: 'bg-[#FFFBEB]', border: 'border-[#F59E0B]', text: 'text-[#F59E0B]' },
                  { id: 'STANDARD', label: 'Standard', bg: 'bg-[#FEFCE8]', border: 'border-[#EAB308]', text: 'text-[#EAB308]' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency: item.id })}
                    className={`py-2 rounded-xl text-xs font-black transition border ${
                      formData.urgency === item.id
                        ? `${item.bg} ${item.border} ${item.text} ring-2 ring-offset-1`
                        : 'bg-[#FFFDF7] border-[#D8E2DF] text-[#526675]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hospital & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Hospital Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajiv Gandhi Govt Hospital"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  District (Tamil Nadu) <span className="text-[#DC2626]">*</span>
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
            </div>

            {/* Requester Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Contact Person <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Murugesan (Relative)"
                  value={formData.requesterName}
                  onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#233746] mb-1">
                  Contact Mobile <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98409 11010"
                  value={formData.requesterPhone}
                  onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                  className="w-full border border-[#D8E2DF] rounded-xl p-2.5 text-sm bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
                />
              </div>
            </div>

            {/* Clinical Reason / Notes */}
            <div>
              <label className="block text-xs font-bold text-[#233746] mb-1">
                Clinical Reason / Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Acute surgical transfusion in Emergency OT..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-[#D8E2DF] rounded-xl p-2 text-xs bg-[#FFFDF7] text-[#233746] focus:outline-none focus:border-[#237B8C]"
              />
            </div>

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
                disabled={submitting}
                className="bg-[#237B8C] hover:bg-[#1F616F] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm active:scale-95 disabled:opacity-50 flex items-center"
              >
                <i className="fa-solid fa-paper-plane mr-2 text-white"></i>
                <span>{submitting ? 'Submitting to Live Grid...' : 'Submit Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
