import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Droplet,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HospitalDashboard({ onOpenRequest }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [updatingGroup, setUpdatingGroup] = useState(null);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hospitals');
      const data = await res.json();
      if (data.success && data.data) {
        setHospitals(data.data);
        if (data.data.length > 0 && !selectedHospitalId) {
          setSelectedHospitalId(data.data[0]._id || data.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const selectedHospital =
    hospitals.find((h) => (h._id || h.id) === selectedHospitalId) || hospitals[0];

  const handleInventoryChange = async (bloodGroup, delta) => {
    if (!selectedHospital) return;
    setUpdatingGroup(bloodGroup);

    try {
      const res = await fetch(`/api/hospitals/${selectedHospital._id || selectedHospital.id}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloodGroup, units: delta })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setHospitals((prev) =>
          prev.map((h) =>
            (h._id || h.id) === (selectedHospital._id || selectedHospital.id) ? { ...h, ...data.data } : h
          )
        );
      }
    } catch (err) {
      console.error('Error updating inventory:', err);
    } finally {
      setUpdatingGroup(null);
    }
  };

  // Calculate total blood units stored
  const totalUnits = selectedHospital?.bloodInventory
    ? Object.values(selectedHospital.bloodInventory).reduce((acc, curr) => acc + (Number(curr) || 0), 0)
    : 0;

  // Count deficit blood types (< 3 units)
  const deficitCount = selectedHospital?.bloodInventory
    ? Object.values(selectedHospital.bloodInventory).filter((v) => Number(v) < 3).length
    : 0;

  return (
    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--red-600)', letterSpacing: '0.05em' }}>
            REGIONAL BLOOD BANK NETWORK
          </div>
          <h1 className="page-title" style={{ marginTop: '2px' }}>
            Hospital Hub & Blood Inventory
          </h1>
          <p className="page-subtitle">
            Manage trauma center reserve units, monitor critical deficits, and trigger instant donor dispatch.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenRequest}>
          <Droplet size={16} fill="#ffffff" />
          <span>Issue Emergency Trauma Request</span>
        </button>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card card-p skeleton" style={{ height: '180px' }} />
          ))}
        </div>
      ) : hospitals.length === 0 ? (
        <div className="card empty-state">
          <Building2 size={48} className="empty-state-icon" />
          <div className="empty-state-title">No Hospitals Configured</div>
          <div className="empty-state-desc">Please initialize or seed hospitals in the Admin section.</div>
        </div>
      ) : (
        <>
          {/* ─── Hospital Selector Carousel/Cards ────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {hospitals.map((h) => {
              const isSelected = (selectedHospital?._id || selectedHospital?.id) === (h._id || h.id);
              return (
                <div
                  key={h._id || h.id}
                  onClick={() => setSelectedHospitalId(h._id || h.id)}
                  className="card card-p-sm"
                  style={{
                    cursor: 'pointer',
                    border: isSelected ? '2px solid var(--red-600)' : '1px solid var(--border)',
                    background: isSelected ? '#ffffff' : 'var(--slate-50)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all var(--t-fast)'
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--r-md)',
                      background: isSelected ? 'var(--red-50)' : 'var(--slate-200)',
                      color: isSelected ? 'var(--red-600)' : 'var(--slate-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Building2 size={22} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--slate-900)' }} className="truncate">
                      {h.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      {h.city} • Hotline: {h.emergencyHotline || h.phone}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Selected Hospital Command Center ────────────────────────── */}
          {selectedHospital && (
            <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Hospital Overview Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                      {selectedHospital.name}
                    </h2>
                    <span className="badge badge-available">
                      <ShieldCheck size={12} />
                      <span>Verified Trauma Facility</span>
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <MapPin size={14} color="var(--red-500)" />
                    <span>{selectedHospital.address}, {selectedHospital.city}</span>
                    <span>•</span>
                    <span>License: <strong>{selectedHospital.licenseNumber || 'Active Regional #4891'}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <a
                    href={`tel:${selectedHospital.emergencyHotline || selectedHospital.phone}`}
                    className="btn btn-navy btn-sm"
                  >
                    <Phone size={14} />
                    <span>Trauma Line: {selectedHospital.emergencyHotline || selectedHospital.phone}</span>
                  </a>
                </div>
              </div>

              {/* Hospital Reserve Overview Metrics */}
              <div className="grid-3">
                <div className="kpi-card kpi-navy">
                  <div className="kpi-top">
                    <div>
                      <div className="kpi-label">Total Cold Units</div>
                      <div className="kpi-value">{totalUnits}</div>
                      <div className="kpi-sub">Units preserved in refrigeration</div>
                    </div>
                    <div className="kpi-icon navy">
                      <Layers size={20} />
                    </div>
                  </div>
                </div>

                <div className="kpi-card kpi-green">
                  <div className="kpi-top">
                    <div>
                      <div className="kpi-label">Ready Status</div>
                      <div className="kpi-value" style={{ color: 'var(--green-600)' }}>
                        {deficitCount === 0 ? 'Full' : 'Active'}
                      </div>
                      <div className="kpi-sub">
                        {8 - deficitCount} of 8 types well stocked
                      </div>
                    </div>
                    <div className="kpi-icon green">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                </div>

                <div className="kpi-card kpi-red">
                  <div className="kpi-top">
                    <div>
                      <div className="kpi-label">Deficit Groups</div>
                      <div className="kpi-value" style={{ color: deficitCount > 0 ? 'var(--red-600)' : 'var(--slate-700)' }}>
                        {deficitCount}
                      </div>
                      <div className="kpi-sub">Groups below 3 units safety threshold</div>
                    </div>
                    <div className="kpi-icon red">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Inventory Stock Cards */}
              <div>
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                    Real-Time Blood Bank Inventory
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    Adjust live stock levels. Cards highlighted in red indicate dangerously low safety reserves (&lt; 3 units).
                  </p>
                </div>

                <div className="grid-4">
                  {BLOOD_GROUPS.map((group) => {
                    const count = selectedHospital.bloodInventory?.[group] ?? 0;
                    const isLow = count < 3;
                    const isBusy = updatingGroup === group;

                    return (
                      <div
                        key={group}
                        style={{
                          background: isLow ? 'var(--red-50)' : 'var(--slate-50)',
                          border: isLow ? '1.5px solid var(--red-400)' : '1px solid var(--border)',
                          borderRadius: 'var(--r-lg)',
                          padding: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: 'var(--shadow-xs)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="blood-pill">{group}</span>
                          {isLow ? (
                            <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                              <AlertTriangle size={10} />
                              <span>DEFICIT</span>
                            </span>
                          ) : (
                            <span className="badge badge-available" style={{ fontSize: '0.65rem' }}>
                              STOCKED
                            </span>
                          )}
                        </div>

                        <div style={{ margin: '16px 0', textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: '2.4rem',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              color: isLow ? 'var(--red-600)' : 'var(--slate-900)',
                              lineHeight: 1
                            }}
                          >
                            {count}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600, marginTop: '6px' }}>
                            {count === 1 ? 'Unit Available' : 'Units Available'}
                          </div>
                        </div>

                        {/* Inventory Adjustment Controls */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, padding: '6px' }}
                            onClick={() => handleInventoryChange(group, -1)}
                            disabled={count <= 0 || isBusy}
                            title="Deduct 1 unit (transfused)"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, padding: '6px' }}
                            onClick={() => handleInventoryChange(group, 1)}
                            disabled={isBusy}
                            title="Add 1 unit (donated)"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
