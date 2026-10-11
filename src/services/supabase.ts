import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

// Supabase Connection Credentials
// Note: When URL includes '/rest/v1/', strip it to get the standard Supabase Project Origin
const rawUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://nirptvwydntzsqyvpsoa.supabase.co/rest/v1/';
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const SUPABASE_ANON_KEY =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcnB0dnd5ZG50enNxeXZwc29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTMyMjcsImV4cCI6MjEwNzEyOTIyN30.UWWn5r0K26POXO7_FzfHDI_PDT79OfoPXDiz_JMFM9M';

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_6v4rLranxaVxbFUbVODKOg_NfoG0jsf';

// Service Role Key: Digunakan khusus untuk operasi server-side / admin backend dengan bypass RLS
export const SUPABASE_SERVICE_ROLE_KEY =
  import.meta.env?.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcnB0dnd5ZG50enNxeXZwc29hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTU1MzIyNywiZXhwIjoyMTA3MTI5MjI3fQ.JwV06qXzaBafpSEU6ccCy7aMYYrZ2ixoYqkwGhOujcc';

export const SUPABASE_SECRET_KEY =
  import.meta.env?.SUPABASE_SECRET_KEY ||
  'sb_secret_K6l7ulout5nloA3JhCTclg_4_QN4CxX';

/**
 * 1. Client-Side Supabase Client (Public & Anon)
 * Digunakan untuk operasi publik di browser, autentikasi voter/juri, dan Realtime Subscriptions
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Server-Side / Admin Client Factory
 * Gunakan hanya jika dijalankan di Node.js / backend route yang aman
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * 2. Supabase Real-Time Broadcast & Subscription Service
 * Menyediakan kanal sinkronisasi live real-time antar perangkat dan jendela browser
 */
const CHANNEL_NAME = 'simpel_digital_realtime_v1';
let realtimeChannel: RealtimeChannel | null = null;
const listeners = new Set<(event: string, payload?: any) => void>();

export const initSupabaseRealtime = (): RealtimeChannel => {
  if (realtimeChannel) {
    return realtimeChannel;
  }

  try {
    realtimeChannel = supabase.channel(CHANNEL_NAME, {
      config: {
        broadcast: {
          self: false, // Jangan kirim kembali ke jendela/tab pengirim
        },
      },
    });

    // A. Dengarkan Realtime Broadcast antar browser/device
    realtimeChannel.on('broadcast', { event: 'data_changed' }, (payload) => {
      const type = payload?.payload?.type || 'remote_update';
      listeners.forEach((callback) => {
        try {
          callback(type, payload?.payload);
        } catch (err) {
          console.warn('[Supabase Realtime] Listener error:', err);
        }
      });
    });

    // B. Dengarkan Postgres CDC (Change Data Capture) jika tabel database ada
    realtimeChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        listeners.forEach((callback) => {
          try {
            callback(`postgres_${payload.table}_${payload.eventType}`, payload);
          } catch (err) {
            console.warn('[Supabase Realtime] Postgres CDC listener error:', err);
          }
        });
      }
    );

    // Subscribe ke kanal
    realtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Connected to Supabase Realtime
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('[Supabase Realtime] Channel subscription error');
      }
    });

    return realtimeChannel;
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize channel:', err);
    return null as unknown as RealtimeChannel;
  }
};

/**
 * Mengirimkan sinyal pembaruan data secara Real-Time ke semua klien / perangkat lain
 */
export const broadcastRealtimeChange = async (type: string, data?: any): Promise<void> => {
  try {
    if (!realtimeChannel) {
      initSupabaseRealtime();
    }
    if (realtimeChannel) {
      await realtimeChannel.send({
        type: 'broadcast',
        event: 'data_changed',
        payload: {
          type,
          data,
          timestamp: Date.now(),
        },
      });
    }
  } catch (err) {
    console.warn('[Supabase Realtime] Send broadcast failed:', err);
  }
};

/**
 * Mendaftarkan callback untuk menerima event perubahan data secara live dari Supabase
 */
export const subscribeToRealtimeChanges = (callback: (type: string, payload?: any) => void): (() => void) => {
  listeners.add(callback);
  if (!realtimeChannel) {
    initSupabaseRealtime();
  }

  return () => {
    listeners.delete(callback);
  };
};
