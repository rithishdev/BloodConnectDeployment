import React, { useState, useEffect } from 'react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientPortalView({ currentUser, token, onOpenAuthModal, onOpenEmergencyModal }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospitalName: '',
    hospitalCity: '',
    urgency: 'CRITICAL',
    notes: ''
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/requests', { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (err) {
      console.warn('Patient requests load:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        patientName: formData.patientName,
        bloodGroup: formData.bloodGroup,
        unitsRequired: Number(formData.unitsRequired),
        hospitalName: formData.hospitalName,
        hospitalAddress: formData.hospitalCity,
        city: formData.hospitalCity,
        urgency: formData.urgency,
        notes: formData.notes
      };

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setToastMsg('Patient emergency request broadcasted across the network!');
        setFormData({
          patientName: '',
          bloodGroup: 'O+',
          unitsRequired: 2,
          hospitalName: '',
          hospitalCity: '',
          urgency: 'CRITICAL',
          notes: ''
        });
        fetchRequests();
      } else {
        setToastMsg(data.message || 'Error submitting request');
      }
    } catch (err) {
      setToastMsg('Error connecting to backend server');
    } finally {
      setSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const activeRequest = requests[0] || {
    _id: 'REQ-99023',
    patientName: 'Robert Johnson',
    bloodGroup: 'O-',
    unitsRequired: 4,
    status: 'PENDING',
    urgency: 'CRITICAL',
    hospitalName: 'Mercy General Hospital'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-bounce">
          <i className="fa-solid fa-circle-check text-brand-500"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Patient Emergency Portal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit clinical blood requirements directly for instant regional hospital and donor dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CREATE NEW REQUEST FORM matching HTML */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Patient Emergency Request Form</h2>
          <p className="text-xs text-slate-500 mb-6">Submit requirement for hospital dispatch approval.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  required
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Units Needed</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formData.unitsRequired}
                  onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Name</label>
              <input
                type="text"
                required
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                placeholder="e.g. Central City Trauma Center"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Location / City</label>
              <input
                type="text"
                required
                value={formData.hospitalCity}
                onChange={(e) => setFormData({ ...formData, hospitalCity: e.target.value })}
                placeholder="e.g. Chicago, IL"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Priority</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="CRITICAL">Critical (Immediate Surgery)</option>
                <option value="URGENT">Urgent (Within 6 hours)</option>
                <option value="STANDARD">Normal / Scheduled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Clinical Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Acute trauma transfusion"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-sm transition shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Broadcasting...' : 'Broadcast Request to Network'}
            </button>
          </form>
        </div>

        {/* LIVE TRACKER FOR CURRENT REQUESTS matching HTML */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Live Request Status Tracking</h3>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-0.5 rounded">
                    {String(activeRequest._id || activeRequest.id).slice(-8).toUpperCase()}
                  </span>
                  <h4 className="font-bold text-slate-900 text-base mt-1.5">
                    {activeRequest.patientName} ({activeRequest.bloodGroup})
                  </h4>
                </div>
                <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  {activeRequest.status === 'FULFILLED' ? 'Completed' : 'In Progress'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-3 border-y border-slate-200">
                <div>
                  <div className="text-slate-400 font-medium">Needed</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {activeRequest.unitsRequired || 4} Units
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">Pledged</div>
                  <div className="font-bold text-brand-600 text-sm mt-0.5">
                    {activeRequest.status === 'FULFILLED' ? activeRequest.unitsRequired : 2} Units
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-medium">ETA</div>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5">
                    {activeRequest.status === 'FULFILLED' ? 'Delivered' : '35 Mins'}
                  </div>
                </div>
              </div>

              {/* STATUS TIMELINE STEPS matching HTML */}
              <div className="flex items-center justify-between text-xs font-medium pt-2">
                <div className="text-center text-emerald-600">
                  <i className="fa-solid fa-circle-check text-base"></i>
                  <br />
                  <span className="font-semibold">Submitted</span>
                </div>
                <div className="h-0.5 flex-1 bg-emerald-500 mx-2"></div>
                <div className="text-center text-emerald-600">
                  <i className="fa-solid fa-circle-check text-base"></i>
                  <br />
                  <span className="font-semibold">Verified</span>
                </div>
                <div className="h-0.5 flex-1 bg-brand-500 mx-2"></div>
                <div className="text-center text-brand-600 font-bold">
                  <i className="fa-solid fa-truck-medical text-base animate-bounce"></i>
                  <br />
                  <span>Dispatching</span>
                </div>
                <div className="h-0.5 flex-1 bg-slate-300 mx-2"></div>
                <div className={`text-center ${activeRequest.status === 'FULFILLED' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <i className="fa-solid fa-circle-check text-base"></i>
                  <br />
                  <span>Fulfilled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm">Previous Requisitions</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Group</th>
                    <th className="p-3">Units</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.slice(0, 5).map((r) => (
                    <tr key={r._id || r.id}>
                      <td className="p-3 font-semibold text-slate-900">{r.patientName}</td>
                      <td className="p-3 font-bold text-brand-600">{r.bloodGroup}</td>
                      <td className="p-3">{r.unitsRequired || 1} Units</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
