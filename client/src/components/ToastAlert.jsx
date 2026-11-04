import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, ArrowRight, Droplet } from 'lucide-react';

export default function ToastAlert({ notifications = [], onDismiss, onViewRequest }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="toast-stack">
      {notifications.map((notif) => {
        const isCritical = notif.type === 'critical' || notif.type === 'emergency' || notif.urgency === 'CRITICAL';
        const isSuccess = notif.type === 'success';

        return (
          <div key={notif.id} className="toast">
            <div className={`toast-icon ${isCritical ? 'critical' : isSuccess ? 'success' : 'info'}`}>
              {isCritical ? (
                <AlertCircle size={18} />
              ) : isSuccess ? (
                <CheckCircle2 size={18} />
              ) : (
                <Droplet size={18} />
              )}
            </div>

            <div className="toast-body">
              <div className={`toast-label ${isCritical ? 'critical' : isSuccess ? 'success' : 'info'}`}>
                {notif.title || 'Live Emergency Alert'}
              </div>

              <div className="toast-msg">{notif.message}</div>

              {notif.data && (
                <div className="toast-sub">
                  {notif.data.hospitalName ? `${notif.data.hospitalName} • ` : ''}
                  {notif.data.city ? notif.data.city : ''}
                </div>
              )}

              {notif.requestId && onViewRequest && (
                <button
                  onClick={() => {
                    onViewRequest({ _id: notif.requestId, ...notif.data });
                    onDismiss(notif.id);
                  }}
                  style={{
                    marginTop: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--red-600)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <span>Match Donors & View Details</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>

            <button className="toast-close" onClick={() => onDismiss(notif.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
