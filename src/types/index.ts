export type UserRole = 'super_admin' | 'shadow_admin' | 'juri' | 'voter' | 'publik';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  assignedMataLombaIds?: string[]; // for Juri
  voteBalance?: number; // for Voter
  createdAt: string;
}

export type KriteriaInputType = 'checkbox' | 'number';

export interface KriteriaPenilaian {
  id: string;
  mataLombaId: string;
  nama: string;
  deskripsi: string;
  tipe: KriteriaInputType;
  nilaiMaksimal: number; // e.g. 10 or 100
  bobotPersen?: number;
}

export interface MataLomba {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  lokasi: string;
  jadwal: string;
  durasiMaksimalMenit: number;
  durasiTargetDetik: number; // reference duration
  kriteriaList: KriteriaPenilaian[];
  assignedJuriIds: string[]; // multi-juri support (can be > 4)
  icon?: string;
}

export interface Peserta {
  id: string;
  nomorUrut: number;
  nomorDada: string;
  nama: string;
  asalInstansi: string;
  mataLombaId: string;
  kategori?: string;
  kontak?: string;
  fotoUrl?: string;
}

export interface PelanggaranEntry {
  id: string;
  nama: string;
  poinPengurangan: number; // positive number to deduct
}

export interface ItemNilaiKriteria {
  kriteriaId: string;
  nilai: number; // 0 to maxScore
  checkedIndices?: number[]; // for checkbox mode, array of 1-based indices checked
}

export interface NilaiSubmission {
  id: string;
  mataLombaId: string;
  pesertaId: string;
  juriId: string;
  juriNama: string;
  waktuPengerjaanDetik: number; // stopwatch / duration in seconds
  nilaiKriteria: ItemNilaiKriteria[];
  pelanggaranList: PelanggaranEntry[];
  totalPengurangan: number;
  totalNilai: number; // SUM(kriteria) - totalPengurangan
  catatanJuri?: string;
  tandaTanganUrl: string; // digital signature canvas data URL
  paktaIntegritasDisetujui: boolean;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface RankingParticipant {
  peserta: Peserta;
  mataLomba: MataLomba;
  submissions: NilaiSubmission[];
  jumlahJuriMenilai: number;
  rataRataNilai: number;
  rataRataWaktuDetik: number;
  rank: number;
  predikatJuara?: string; // Juara 1, Juara 2, Juara 3, Harapan 1, Harapan 2, Harapan 3
  isApprovedComplete: boolean;
}

export interface VotingCategory {
  id: string;
  nama: string;
  deskripsi: string;
  hargaPerVote: number; // e.g. 5000 (IDR)
  mataLombaId?: string;
  isActive: boolean;
}

export interface TopupRequest {
  id: string;
  voterId: string;
  voterNama: string;
  jumlahVote: number;
  hargaTotal: number;
  metode: 'DANA_QRIS';
  nomorDanaTujuan: string; // 081314420312
  buktiTransferUrl: string;
  pengirimNama: string;
  pengirimNomorHp?: string;
  status: 'pending' | 'approved' | 'rejected';
  catatanAdmin?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface VoteRecord {
  id: string;
  votingCategoryId: string;
  voterId: string;
  pesertaId: string;
  jumlahVote: number;
  createdAt: string;
}

export interface EventConfig {
  judulKegiatan: string;
  subJudul: string;
  deskripsi: string;
  tempat: string;
  tanggalWaktu: string;
  penyelenggara: string;
  logoUrl: string;
  backgroundUrl: string;
  backgroundColor: string; // hex
  primaryColor: string; // hex
  secondaryColor: string; // hex
  videoTeaserUrl: string;
  bgmAudioUrl: string;
  bgmEnabled: boolean;
  bgmVolume: number;
  peraturanLomba: string[];
  nomorDanaAdmin: string; // Default: 081314420312
  namaAkunDana: string; // S-IMPEL DIGITAL
  qrisImageUrl?: string; // QRIS DANA Image URL
  // Toggle controls for Super Admin:
  votingClosed: boolean;
  danaTransferDisabled: boolean;
  autoApproveWebhookEnabled: boolean;
}
