import React, { useState, useEffect } from 'react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodRequestView({
  onOpenRequest,
  selectedRequestToView = null,
  onClearSelectedRequest = () => {}
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUrgency, setFilterUrgency] = useState('ALL');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);
  const [fulfillingId, setFulfillingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (err) {
      console.warn('Requests fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFulfill = async (req) => {
    const reqId = req._id || req.id;
    if (!reqId || req.status === 'FULFILLED') return;

    setFulfillingId(reqId);
    try {
      const token = localStorage.getItem('bc_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/requests/${reqId}/fulfill`, {
        method: 'PATCH',
        headers
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Immediate UI state update with confirmed database record
        setRequests((prev) =>
          prev.map((r) =>
            String(r._id || r.id) === String(reqId)
              ? {
                  ...r,
                  status: 'FULFILLED',
                  fulfilledAt: new Date(),
                  ...(data.data || {})
                }
              : r
          )
        );
        setToastMsg(`Blood request for ${req.patientName} has been successfully recorded as FULFILLED!`);
      } else {
        setToastMsg(data.message || 'Could not fulfill request.');
      }
    } catch (err) {
      setToastMsg('Failed to update request status in the database.');
    } finally {
      setFulfillingId(null);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterUrgency !== 'ALL' && (r.urgency || '').toUpperCase() !== filterUrgency) return false;
    if (filterGroup !== 'ALL' && r.bloodGroup !== filterGroup) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8F3E8] min-h-screen">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#233746] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center space-x-2 border border-[#D8E2DF] animate-bounce">
          <i className="fa-solid fa-circle-check text-[#16A34A] text-sm"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#233746]">Emergency Blood Requests</h1>
          <p className="text-sm text-[#526675] mt-1 font-medium">
            Active patient blood requirements submitted by hospitals across Tamil Nadu.
          </p>
        </div>
        <button
          onClick={onOpenRequest}
          className="bg-[#237B8C] hover:bg-[#1F616F] text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm transition flex items-center active:scale-95"
        >
          <i className="fa-solid fa-pen-to-square mr-2"></i> Submit Blood Request
        </button>
      </div>

      {/* Quick Filters */}
      <div className="bg-[#FFFEFA] p-4 rounded-2xl border border-[#D8E2DF] shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-[#526675] uppercase tracking-wider mr-2">
          Filter Priority:
        </span>
        {['ALL', 'CRITICAL', 'URGENT', 'STANDARD'].map((u) => (
          <button
            key={u}
            onClick={() => setFilterUrgency(u)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterUrgency === u
                ? 'bg-[#233746] text-white shadow-xs'
                : 'bg-[#EAF5F6] text-[#233746] hover:bg-[#DCEEF2]'
            }`}
          >
            {u}
          </button>
        ))}

        <div className="ml-auto flex items-center space-x-2">
          <span className="text-xs font-bold text-[#526675] uppercase">Blood Group:</span>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="bg-[#FFFDF7] border border-[#D8E2DF] rounded-xl px-3 py-1.5 text-xs font-bold text-[#233746] focus:outline-none focus:border-[#237B8C]"
          >
            <option value="ALL">All Groups</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center text-[#526675]">
          <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#237B8C] mb-2"></i>
          <p className="text-sm font-semibold">Loading emergency requests from live grid...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredRequests.length === 0 && (
        <div className="bg-[#FFFEFA] p-12 text-center rounded-3xl border border-[#D8E2DF] shadow-xs max-w-lg mx-auto">
          <i className="fa-solid fa-notes-medical text-4xl text-[#B8DFE6] mb-3"></i>
          <h3 className="text-base font-bold text-[#233746]">No matching blood requests</h3>
          <p className="text-xs text-[#526675] mt-1">There are currently no active requests matching your selected filters.</p>
        </div>
      )}

      {/* REQUEST CARDS LIST */}
      {!loading && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const reqId = req._id || req.id;
            const needed = req.unitsRequired || req.units || 1;
            const isFulfilled = req.status === 'FULFILLED';
            const urgency = (req.urgency || 'STANDARD').toUpperCase();

            // Card background based on fulfillment or priority:
            // FULFILLED: Pale green (#F0FDF4)
            // CRITICAL: Pale red (#FEF2F2)
            // URGENT: Pale orange (#FFFBEB)
            // STANDARD: Pale yellow (#FEFCE8)
            const cardBg = isFulfilled
              ? 'bg-[#F0FDF4] border-[#86EFAC]'
              : urgency === 'CRITICAL'
              ? 'bg-[#FEF2F2] border-[#FCA5A5]'
              : urgency === 'URGENT'
              ? 'bg-[#FFFBEB] border-[#FDE68A]'
              : 'bg-[#FEFCE8] border-[#FEF08A]';

            const bloodBoxBg = isFulfilled
              ? 'bg-[#16A34A]'
              : urgency === 'CRITICAL'
              ? 'bg-[#DC2626]'
              : urgency === 'URGENT'
              ? 'bg-[#F59E0B]'
              : 'bg-[#EAB308]';

            return (
              <div
                key={reqId}
                className={`rounded-3xl border p-6 shadow-xs transition ${cardBg}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left Side: Blood Box & Patient Details */}
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-16 h-16 rounded-2xl ${bloodBoxBg} text-white font-black text-2xl flex items-center justify-center shadow-xs flex-shrink-0`}
                    >
                      <span>{req.bloodGroup}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-[#233746]">
                          {req.patientName}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                            urgency === 'CRITICAL'
                              ? 'bg-[#DC2626] text-white'
                              : urgency === 'URGENT'
                              ? 'bg-[#F59E0B] text-white'
                              : 'bg-[#EAB308] text-slate-900'
                          }`}
                        >
                          {urgency} PRIORITY
                        </span>

                        {/* Fulfillment Status Badge */}
                        {isFulfilled ? (
                          <span className="text-xs font-black bg-[#16A34A] text-white px-3 py-0.5 rounded-full flex items-center">
                            <i className="fa-solid fa-check mr-1.5"></i> FULFILLED
                          </span>
                        ) : (
                          <span className="text-xs bg-[#FFFEFA] text-[#526675] font-bold px-2 py-0.5 rounded-full border border-[#D8E2DF]">
                            {req.status || 'PENDING'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#233746] font-semibold">
                        <i className="fa-solid fa-hospital text-[#237B8C] mr-1.5"></i>
                        {req.hospitalName || 'General Hospital'}, {req.city || 'Tamil Nadu'}
                      </p>

                      <p className="text-xs text-[#526675]">
                        Reason:{' '}
                        <span className="font-semibold text-[#233746]">
                          {req.notes || 'Emergency surgical transfusion'}
                        </span>{' '}
                        • Contact:{' '}
                        <span className="font-bold text-[#237B8C]">
                          {req.requesterPhone || req.contactNumber || '+91 98409 11010'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Units & Donate / Fulfill Action */}
                  <div className="md:w-64 space-y-3 flex-shrink-0">
                    <div className="bg-[#FFFEFA]/80 p-3 rounded-2xl border border-[#D8E2DF]">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-[#526675]">Required Units:</span>
                        <span className="text-[#233746]">{needed} Units</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#526675]">Status:</span>
                        <span className={isFulfilled ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                          {isFulfilled ? 'Donation Received' : 'Awaiting Donor'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFulfill(req)}
                      disabled={isFulfilled || fulfillingId === reqId}
                      className={`w-full font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-xs flex items-center justify-center active:scale-95 ${
                        isFulfilled
                          ? 'bg-[#16A34A] text-white cursor-default opacity-95'
                          : fulfillingId === reqId
                          ? 'bg-[#526675] text-white cursor-wait'
                          : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          isFulfilled
                            ? 'fa-circle-check'
                            : fulfillingId === reqId
                            ? 'fa-circle-notch fa-spin'
                            : 'fa-hand-holding-heart'
                        } mr-2`}
                      ></i>
                      {isFulfilled
                        ? 'Donated / Fulfilled'
                        : fulfillingId === reqId
                        ? 'Saving in DB...'
                        : 'Donate / Fulfill Now'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
