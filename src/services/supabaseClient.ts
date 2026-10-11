/**
 * Supabase Client & CRUD Helpers untuk Aplikasi Penilaian Lomba Digital ("aplikasilomba")
 * 
 * Modul ini terpisah dan modular, siap digunakan di komponen mana pun tanpa mengganggu
 * logika penyimpanan atau alur yang sudah berjalan di aplikasi.
 */
import { createClient } from '@supabase/supabase-js';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAdmin } from './supabase';
import { NilaiSubmission, Peserta, VoteRecord, MataLomba } from '../types';

// Re-export client utama
export { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, getSupabaseAdmin };

/**
 * Google OAuth Login Function via Supabase
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('[Supabase OAuth] Error signing in with Google:', error.message);
    throw error;
  }

  return data;
}

export async function signOutFromSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('[Supabase OAuth] Error signing out:', error.message);
  }
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => {
    subscription?.unsubscribe();
  };
}

/**
 * ==============================================================================
 * CONTOH IMPLEMENTASI OPERASI DASAR DATABASE (SELECT, INSERT, UPDATE, DELETE)
 * Disesuaikan khusus untuk modul perlombaan di S-IMPEL DIGITAL / aplikasilomba
 * ==============================================================================
 */

/**
 * 1. CONTOH OPERASI SELECT: Mengambil daftar peserta perlombaan dari tabel 'peserta'
 * @param mataLombaId (Opsional) Filter berdasarkan cabang lomba
 */
export async function getPesertaFromSupabase(mataLombaId?: string): Promise<{ data: Peserta[] | null; error: any }> {
  try {
    let query = supabase
      .from('peserta')
      .select('*')
      .order('nomorUrut', { ascending: true });

    if (mataLombaId) {
      query = query.eq('mataLombaId', mataLombaId);
    }

    const { data, error } = await query;
    return { data: data as Peserta[], error };
  } catch (err) {
    console.warn('[Supabase SELECT] Gagal mengambil peserta:', err);
    return { data: null, error: err };
  }
}

/**
 * 2. CONTOH OPERASI INSERT: Menyimpan lembar nilai juri baru ke tabel 'submissions'
 * @param submission Data formulir penilaian dari dewan juri
 */
export async function insertSubmissionToSupabase(
  submission: Partial<NilaiSubmission>
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .insert([
        {
          id: submission.id || `sub_${Date.now()}`,
          mataLombaId: submission.mataLombaId,
          pesertaId: submission.pesertaId,
          juriId: submission.juriId,
          juriNama: submission.juriNama,
          waktuPengerjaanDetik: submission.waktuPengerjaanDetik || 0,
          totalNilai: submission.totalNilai || 0,
          totalPengurangan: submission.totalPengurangan || 0,
          nilaiKriteria: submission.nilaiKriteria || [],
          pelanggaranList: submission.pelanggaranList || [],
          catatanJuri: submission.catatanJuri || '',
          tandaTanganUrl: submission.tandaTanganUrl || '',
          paktaIntegritasDisetujui: submission.paktaIntegritasDisetujui ?? true,
          status: submission.status || 'pending',
          createdAt: submission.createdAt || new Date().toISOString(),
        },
      ])
      .select();

    return { data, error };
  } catch (err) {
    console.warn('[Supabase INSERT] Gagal menyimpan submission:', err);
    return { data: null, error: err };
  }
}

/**
 * 3. CONTOH OPERASI UPDATE: Memperbarui status persetujuan nilai (Admin Approval)
 * @param submissionId ID submission yang disetujui / ditolak
 * @param status 'approved' atau 'rejected'
 * @param adminName Nama admin yang menyetujui
 */
export async function updateSubmissionStatusInSupabase(
  submissionId: string,
  status: 'approved' | 'rejected',
  adminName: string
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status,
        approvedAt: new Date().toISOString(),
        approvedBy: adminName,
      })
      .eq('id', submissionId)
      .select();

    return { data, error };
  } catch (err) {
    console.warn('[Supabase UPDATE] Gagal memperbarui status submission:', err);
    return { data: null, error: err };
  }
}

/**
 * 4. CONTOH OPERASI INSERT: Menyimpan rekaman voting baru dari voter berbayar
 * @param voteRecord Data transaksi vote
 */
export async function insertVoteToSupabase(
  voteRecord: Partial<VoteRecord>
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase
      .from('vote_records')
      .insert([
        {
          id: voteRecord.id || `vr_${Date.now()}`,
          votingCategoryId: voteRecord.votingCategoryId,
          voterId: voteRecord.voterId,
          pesertaId: voteRecord.pesertaId,
          jumlahVote: voteRecord.jumlahVote || 1,
          createdAt: voteRecord.createdAt || new Date().toISOString(),
        },
      ])
      .select();

    return { data, error };
  } catch (err) {
    console.warn('[Supabase INSERT] Gagal menyimpan vote:', err);
    return { data: null, error: err };
  }
}

/**
 * 5. CONTOH OPERASI REALTIME SUBSCRIPTION PER TABEL:
 * Mendengarkan pembaruan langsung pada tabel 'submissions' saat juri menilai
 * @param onUpdate Callback fungsi yang dieksekusi saat ada data masuk / terupdate
 */
export function subscribeToSubmissionsTable(onUpdate: (payload: any) => void) {
  const channel = supabase
    .channel('submissions_realtime_feed')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'submissions' },
      (payload) => {
        onUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export default supabase;
