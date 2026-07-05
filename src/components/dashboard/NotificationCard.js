import React from 'react';

export default function NotificationCard({ title, date, content, authorName, audience }) {
  return (
    <div className="notification-card">
      <div className="notification-card-header">
        <h4 className="notification-card-title">{title}</h4>
        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
          {new Date(date).toLocaleDateString()}
        </span>
      </div>
      <p className="notification-card-content">
        {content}
      </p>
      <div className="notification-card-footer">
        <span className="notification-card-author">
          By: Admin ({authorName})
        </span>
        <span className="badge badge-indigo" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
          Audience: {audience}
        </span>
      </div>
    </div>
  );
}
