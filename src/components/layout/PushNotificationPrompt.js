'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { savePushSubscriptionAction } from '@/app/actions';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Only run on client, and only if notifications/service workers are supported
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    const checkSubscription = async () => {
      // If already granted or denied, don't show the prompt
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        return;
      }

      // Check if they dismissed it recently (e.g., within 7 days)
      const dismissedAt = localStorage.getItem('push_prompt_dismissed_at');
      if (dismissedAt) {
        const dismissDate = new Date(dismissedAt);
        const daysSinceDismiss = (new Date() - dismissDate) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
          return; // Don't show it again until 7 days pass
        }
      }

      // Otherwise, show the prompt
      setShowPrompt(true);
    };

    checkSubscription();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('push_prompt_dismissed_at', new Date().toISOString());
    setShowPrompt(false);
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register the service worker if not already registered
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready; // Wait for it to be active

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Send to backend
        const result = await savePushSubscriptionAction(JSON.parse(JSON.stringify(subscription)));
        if (result.success) {
          setShowPrompt(false);
        } else {
          console.error("Failed to save push subscription on server:", result.error);
        }
      } else {
        // Denied
        setShowPrompt(false);
      }
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] shadow-md p-4 flex items-center justify-between rounded-lg mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-[var(--text-color)] text-sm">Enable instant notifications</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Get alerts for published results, broadcasts, and new assignments even when the app is closed.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubscribe}
          disabled={isSubscribing}
          className="px-4 py-1.5 bg-[var(--primary-color)] text-white text-sm font-medium rounded-md hover:bg-blue-600 transition disabled:opacity-50"
        >
          {isSubscribing ? 'Enabling...' : 'Enable'}
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] rounded-md transition"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
