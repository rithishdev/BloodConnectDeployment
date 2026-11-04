import React from 'react';
import { AlertTriangle, Clock, ArrowRight, MapPin } from 'lucide-react';

export default function EmergencyBanner({ criticalRequests = [], onViewRequest }) {
  if (!criticalRequests || criticalRequests.length === 0) return null;

  const active = criticalRequests[0];

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #b91c1c 100%)',
        color: '#ffffff',
        padding: '8px 24px',
        boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        zIndex: 60,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flexWrap: 'wrap' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: 'var(--r-full)',
            padding: '3px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.05em'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ffffff',
              display: 'inline-block'
            }}
            className="anim-pulse-ring"
          />
          CRITICAL ALERT
        </div>

        <div style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>
            Patient <strong>{active.patientName}</strong> requires
          </span>
          <span
            style={{
              background: '#ffffff',
              color: 'var(--red-700)',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--r-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem'
            }}
          >
            {active.unitsRequired} units of {active.bloodGroup}
          </span>
          <span>
            at <strong>{active.hospitalName}</strong> ({active.city || 'Emergency Trauma Center'})
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', opacity: 0.9 }}>
          <Clock size={13} />
          <span>Active now</span>
        </div>

        <button
          onClick={() => onViewRequest(active)}
          className="btn btn-xs"
          style={{
            background: '#ffffff',
            color: 'var(--red-700)',
            fontWeight: 700,
            border: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          <span>Respond & View</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
