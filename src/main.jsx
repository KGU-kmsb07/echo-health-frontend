import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const isNativeAndroid = window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.() === "android";

if (isNativeAndroid && "serviceWorker" in navigator) {
  const cacheResetKey = "echo-health-native-cache-reset-v2";

  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .then(() => ("caches" in window ? caches.keys() : Promise.resolve([])))
    .then(keys => Promise.all(keys.map(key => caches.delete(key))))
    .then(() => {
      if (!sessionStorage.getItem(cacheResetKey)) {
        sessionStorage.setItem(cacheResetKey, "true");
        window.location.reload();
      }
    })
    .catch(error => console.warn("Native cache reset failed", error));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
