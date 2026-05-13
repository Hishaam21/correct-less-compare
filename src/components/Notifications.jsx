import React from 'react'

export default function Notifications({ notifications = [], alerts = [], onRemoveAlert }) {
  if (notifications.length === 0 && alerts.length === 0) {
    return null
  }

  return (
    <section className="card notification-card">
      <div className="notification-header">
        <h2>In-App Alerts</h2>
        <p className="card-subtitle">Track price drops and see active alerts in one place.</p>
      </div>

      {notifications.length > 0 ? (
        <div className="notification-list">
          {notifications.map((note, idx) => (
            <div key={`notif-${idx}`} className="notification-item">
              <strong>{note.title}</strong>
              <p>{note.message}</p>
            </div>
          ))}
        </div>
      ) : null}

      {alerts.length > 0 ? (
        <div className="alert-list">
          <h3>Active price alerts</h3>
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item">
              <div>
                <strong>{alert.name}</strong>
                <span>• {alert.store}</span>
              </div>
              <div>
                <span>Target: R{Number(alert.targetPrice).toFixed(2)}</span>
                {onRemoveAlert ? (
                  <button className="alert-remove" onClick={() => onRemoveAlert(alert.id)}>
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
