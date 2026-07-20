import React from 'react';

export default function NotificationCard({ title, date, content, authorName, audience }) {
  return (
    <div className="notification-card">
      <div className="notification-card-header">
        <h4 className="notification-card-title">{title}</h4>
        <span className="badge badge-secondary text-xs">
          {new Date(date).toLocaleDateString()}
        </span>
      </div>
      <p className="notification-card-content">{content}</p>
      <div className="notification-card-footer">
        <span className="notification-card-author">
          {authorName || 'Admin'}
        </span>
        {audience && (
          <span className="badge badge-indigo text-xs uppercase">
            {audience}
          </span>
        )}
      </div>
    </div>
  );
}
