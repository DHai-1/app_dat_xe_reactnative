import { env } from '@/config/env';
import { createStompClient, locationSignalLost, stompBrokerUrl, validLocationUpdate, type DriverLocationUpdate } from '@datxe/shared';
import { useEffect, useState } from 'react';

export function useLiveDriverLocation(rideId: number, enabled: boolean, refresh: () => unknown, driverAssigned: boolean) {
  const [sample, setSample] = useState<DriverLocationUpdate | null>(null);
  const [received, setReceived] = useState<number | null>(null);
  const [started, setStarted] = useState(Date.now);
  const [now, setNow] = useState(Date.now);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!enabled || !Number.isInteger(rideId) || rideId <= 0) return;
    let latestTimestamp = 0;
    const reset = setTimeout(() => { setSample(null); setReceived(null); setStarted(Date.now()); }, 0);
    const socket = createStompClient(stompBrokerUrl(env.apiUrl), 'CUSTOMER');
    const unsubscribe = socket.subscribe(`/user/queue/rides/${rideId}/location`, message => {
      try {
        const update: unknown = JSON.parse(message.body);
        if (!validLocationUpdate(update) || Date.parse(update.timestamp) <= latestTimestamp) return;
        latestTimestamp = Date.parse(update.timestamp); setSample(update); setReceived(Date.now()); setNow(Date.now());
      } catch { /* malformed/stale frames never replace a valid location */ }
    });
    const notifications = socket.subscribe('/user/queue/trip', message => { try { const event = JSON.parse(message.body); if (event.payload?.rideId === rideId) refresh(); } catch {} });
    const connection = socket.onConnection(value => { setConnected(value); if (value) refresh(); });
    socket.connect();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(reset); clearInterval(timer); unsubscribe(); notifications(); connection(); void socket.disconnect(); };
  }, [rideId, enabled, refresh, driverAssigned]);
  return { sample, connected, signalLost: enabled && locationSignalLost(received, started, now, env.locationStaleMs) };
}
