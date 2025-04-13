'use client';

import { useState, useEffect } from 'react';
import {
  subscribeUser,
  unsubscribeUser,
  sendNotification,
} from '@/app/actions';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    const sub = await registration.pushManager.getSubscription();
    console.log(sub);
    setSubscription(sub);
  }

  async function subscribeToPush() {
    setIsLoading(true);
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });
    setSubscription(sub);
    const serializedSub = JSON.parse(JSON.stringify(sub));
    await subscribeUser(serializedSub);
    setIsLoading(false);
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser();
  }

  async function sendTestNotification() {
    if (subscription) {
      setIsLoadingMsg(true);
      const res = await sendNotification(message);
      if (res.success) {
        setMessage('');
        setIsLoadingMsg(false);
      } else {
        alert('Failed to send notification');
        setIsLoadingMsg(false);
      }
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  return (
    <div>
      <h3 className="text-center text-4xl text-sky-400 mt-15 ">
        Push Notifications
      </h3>
      {subscription ? (
        <>
          <div className="  ">
            <button
              className="bg-red-600 p-1.5 text-lg rounded-full text-white hover:bg-red-700 transition cursor-pointer ml-24 mt-2 mb-2 "
              onClick={unsubscribeFromPush}>
              Unsubscribe
            </button>
            <br />
            <form action="">
              <input
                type="text"
                className="bg-orange-50 text-black p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-2"
                placeholder="Enter notification message"
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
              {isLoadingMsg ? (
                <button
                  className="bg-blue-400 p-1.5 text-lg rounded-xl text-white  cursor-not-allowed  "
                  disabled
                  onClick={sendTestNotification}>
                  Send...
                </button>
              ) : (
                <button
                  className="bg-blue-700 p-1.5 text-lg rounded-xl text-white hover:bg-blue-800 transition cursor-pointer  "
                  onClick={sendTestNotification}>
                  Send
                </button>
              )}
            </form>
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 items-center mt-2 ">
            <p className="text-2xl text font-serif">
              Subscribe to get notifications
            </p>
            {isLoading ? (
              <button
                className="bg-red-500 p-1.5 text-lg rounded-full text-white  cursor-not-allowed "
                disabled
                onClick={subscribeToPush}>
                Subscribing...
              </button>
            ) : (
              <button
                className="bg-red-600 p-1.5 text-lg rounded-full text-white hover:bg-red-700 transition cursor-pointer "
                onClick={subscribeToPush}>
                Subscribe
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if it's already running as a standalone app
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) setIsInstalled(true);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt as any;
    promptEvent.prompt();
    const result = await promptEvent.userChoice;
    if (result.outcome === 'accepted') {
      console.log('PWA setup accepted');
    } else {
      console.log('PWA setup dismissed');
    }
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || isInstalled) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
      Install App
    </button>
  );
}

export default function NotificationPage() {
  return (
    <div>
      <PushNotificationManager />
      <PWAInstallButton />
    </div>
  );
}
