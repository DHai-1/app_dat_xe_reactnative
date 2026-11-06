import { useCallback, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { driverRealtime } from '@/lib/realtime';
import { useSessionStore } from '@/lib/store';
import { getChatMessages, getChatRide, markChatRead, sendChatMessage, uploadChatImage } from '../api';
import { createChatSession } from '../session';

export function useDriverChat(rideId: number, userId: number) {
  const client = useQueryClient();
  const [draft, setDraft] = useState('');
  const [picking, setPicking] = useState(false);
  const [pickerError, setPickerError] = useState('');
  const [session] = useState(() => {
    const requireAccount = () => {
      if (useSessionStore.getState().user?.id !== userId) throw new Error('Phiên đăng nhập đã thay đổi.');
    };
    return createChatSession({
      ride: () => { requireAccount(); return getChatRide(rideId); },
      messages: options => { requireAccount(); return getChatMessages(rideId, options); },
      send: body => { requireAccount(); return sendChatMessage(rideId, body); },
      upload: file => { requireAccount(); return uploadChatImage(rideId, file); },
      read: id => { requireAccount(); return markChatRead(rideId, id); },
      onRead: () => {
        void client.invalidateQueries({ queryKey: ['driver', 'activeRide'] });
        void client.invalidateQueries({ queryKey: ['driver', 'ride', rideId] });
      },
    });
  });
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  useFocusEffect(useCallback(() => {
    let active = AppState.currentState === 'active';
    const refresh = () => { if (active) void session.refresh(); };
    session.setVisible(active);
    refresh();
    const timer = setInterval(refresh, 5000);
    const appState = AppState.addEventListener('change', value => {
      active = value === 'active';
      session.setVisible(active);
      refresh();
    });
    const unsubscribe = driverRealtime.subscribe('/user/queue/trip', message => {
      try {
        const event = JSON.parse(message.body);
        if (Number(event.payload?.rideId) === rideId) {
          if (event.type === 'CHAT_READ') session.receivedReadReceipt(Number(event.payload.upToMessageId));
          refresh();
        }
      } catch { /* Polling recovers malformed/missed frames. */ }
    });
    return () => { session.setVisible(false); clearInterval(timer); appState.remove(); unsubscribe(); };
  }, [session, rideId]));
  const sendText = () => { if (session.send(draft)) setDraft(''); };
  const sendImage = async () => {
    if (picking) return;
    setPicking(true);
    setPickerError('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
      const image = result.assets?.[0];
      if (!result.canceled && image && session.send(draft, { uri: image.uri, fileName: image.fileName, mimeType: image.mimeType })) setDraft('');
    } catch (error) { setPickerError(error instanceof Error ? error.message : 'Không mở được thư viện ảnh.'); }
    finally { setPicking(false); }
  };
  return { ...state, session, draft, setDraft, picking, pickerError, sendText, sendImage };
}
