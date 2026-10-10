import {
  EventConfig,
  KriteriaPenilaian,
  MataLomba,
  NilaiSubmission,
  Peserta,
  RankingParticipant,
  TopupRequest,
  User,
  VoteRecord,
  VotingCategory
} from '../types';

const STORAGE_KEYS = {
  USERS: 'simpel_users_v2',
  MATA_LOMBA: 'simpel_matalomba_v2',
  PESERTA: 'simpel_peserta_v2',
  SUBMISSIONS: 'simpel_submissions_v2',
  VOTING_CATEGORIES: 'simpel_voting_cat_v2',
  TOPUP_REQUESTS: 'simpel_topup_req_v2',
  VOTE_RECORDS: 'simpel_vote_records_v2',
  EVENT_CONFIG: 'simpel_event_config_v2',
  CURRENT_USER: 'simpel_current_user_v2',
};

// Default seed data
const DEFAULT_EVENT_CONFIG: EventConfig = {
  judulKegiatan: 'FESTIVAL PRESTASI & KOMPETISI AKBAR NUSANTARA 2026',
  subJudul: 'S-IMPEL DIGITAL: Sistem Penilaian Digital Terintegrasi & Voting Berbayar',
  deskripsi: 'Ajang bergengsi kejuaraan orasi, karya cipta seni, dan inovasi teknologi nasional dengan transparansi penilaian dewan juri secara real-time dan voting juara terfavorit masyarakat.',
  tempat: 'Auditorium Utama Graha Cendekia & Arena Digital Nusantara',
  tanggalWaktu: 'Sabtu - Minggu, 24 - 25 Oktober 2026 | 08:00 WIB s.d Selesai',
  penyelenggara: 'Komite Tetap S-IMPEL DIGITAL & Badan Pembina Prestasi Generasi Emas',
  logoUrl: '',
  backgroundUrl: '',
  backgroundColor: '#fefce8',
  primaryColor: '#b45309',
  secondaryColor: '#b91c1c',
  videoTeaserUrl: '',
  bgmAudioUrl: '',
  bgmEnabled: true,
  bgmVolume: 0.35,
  peraturanLomba: [
    'Peserta wajib hadir di ruang perlombaan maksimal 15 menit sebelum nomor urut dipanggil oleh panitia.',
    'Pencatatan waktu penyelesaian lomba dilakukan langsung oleh Dewan Juri dan menjadi penentu tie-breaker (kejuaraan jika nilai sama).',
    'Setiap bentuk kecurangan, pelanggaran batas durasi, atau pelanggaran atribut akan dikenakan pengurangan poin/penalti langsung pada lembar penilaian.',
    'Penilaian dewan juri bersifat independen, mutlak, dan disahkan melalui tanda tangan digital serta pakta integritas resmi.',
    'Voting kategori terfavorit dibuka untuk umum melalui sistem voucher berbayar resmi via QRIS DANA (081314420312).'
  ],
  nomorDanaAdmin: '081314420312',
  namaAkunDana: 'S-IMPEL DIGITAL (081314420312)',
  votingClosed: false,
  danaTransferDisabled: false,
  autoApproveWebhookEnabled: false,
};

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_superadmin',
    username: 'Usseradmin',
    password: '123#',
    name: 'Administrator Utama (Super Admin)',
    role: 'super_admin',
    phone: '081314420312',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_shadowadmin',
    username: 'coadmin',
    password: 'coadmin123',
    name: 'Budi Santoso (Admin Bayangan/Co-Admin)',
    role: 'shadow_admin',
    phone: '081298765432',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_juri1',
    username: 'juri1',
    password: 'juri123',
    name: 'Prof. Dr. Hendra Wijaya, M.Sn',
    role: 'juri',
    phone: '081234567890',
    assignedMataLombaIds: ['ml_01', 'ml_02', 'ml_03'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_juri2',
    username: 'juri2',
    password: 'juri234',
    name: 'Dra. Hj. Siti Aminah, M.Pd',
    role: 'juri',
    phone: '081234567891',
    assignedMataLombaIds: ['ml_01', 'ml_02'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_juri3',
    username: 'juri3',
    password: 'juri345',
    name: 'Dr. Ahmad Fauzi, S.Kom, M.T',
    role: 'juri',
    phone: '081234567892',
    assignedMataLombaIds: ['ml_01', 'ml_03'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_juri4',
    username: 'juri4',
    password: 'juri456',
    name: 'Rina Kusuma Dewi, S.Sn, M.A',
    role: 'juri',
    phone: '081234567893',
    assignedMataLombaIds: ['ml_01', 'ml_02'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_juri5',
    username: 'juri5',
    password: 'juri567',
    name: 'Drs. Bambang Sutrisno, M.Hum',
    role: 'juri',
    phone: '081234567894',
    assignedMataLombaIds: ['ml_01', 'ml_03'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_voter1',
    username: 'voter1',
    password: 'voter123',
    name: 'Andi Pratama Wijaya',
    role: 'voter',
    phone: '081388990011',
    voteBalance: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_voter2',
    username: 'voter2',
    password: 'voter234',
    name: 'Dewi Lestari Putri',
    role: 'voter',
    phone: '081399887766',
    voteBalance: 5,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_MATA_LOMBA: MataLomba[] = [
  {
    id: 'ml_01',
    kode: 'ORASI-01',
    nama: 'Pidato Kebangsaan & Orasi Ilmiah',
    kategori: 'Public Speaking & Retorika',
    deskripsi: 'Kompetisi orasi gagasan kebangsaan dengan penekanan substansi, ketegasan vokal, gestur tubuh, dan kepatuhan durasi pengerjaan.',
    lokasi: 'Panggung Utama Hall A',
    jadwal: 'Sabtu, 24 Okt 2026 - 09:00 WIB',
    durasiMaksimalMenit: 10,
    durasiTargetDetik: 420, // 7 menit
    assignedJuriIds: ['usr_juri1', 'usr_juri2', 'usr_juri3', 'usr_juri4', 'usr_juri5'],
    icon: 'Mic',
    kriteriaList: [
      {
        id: 'crit_1_1',
        mataLombaId: 'ml_01',
        nama: 'Kesesuaian Gagasan & Argumen',
        deskripsi: 'Kedalaman gagasan ilmiah, data pendukung, dan orisinalitas solusi pemikiran.',
        tipe: 'checkbox',
        nilaiMaksimal: 10,
      },
      {
        id: 'crit_1_2',
        mataLombaId: 'ml_01',
        nama: 'Artikulasi, Diksi & Olah Vokal',
        deskripsi: 'Kejelasan pengucapan kata, kekuatan nada, tempo ritmis, dan kehangatan suara.',
        tipe: 'checkbox',
        nilaiMaksimal: 10,
      },
      {
        id: 'crit_1_3',
        mataLombaId: 'ml_01',
        nama: 'Gestur, Ekspresi & Penguasaan Panggung',
        deskripsi: 'Kontak mata dengan dewan juri, keselarasan gerak tubuh, etika, dan karisma.',
        tipe: 'number',
        nilaiMaksimal: 25,
      },
      {
        id: 'crit_1_4',
        mataLombaId: 'ml_01',
        nama: 'Daya Tarik & Pesan Moral',
        deskripsi: 'Pengaruh resonansi emosional audiens dan ketepatan kesimpulan akhir pidato.',
        tipe: 'checkbox',
        nilaiMaksimal: 10,
      },
    ],
  },
  {
    id: 'ml_02',
    kode: 'SASTRA-02',
    nama: 'Cipta & Baca Puisi Tradisional',
    kategori: 'Seni Pertunjukan & Sastra',
    deskripsi: 'Penampilan pembacaan puisi bertema warisan leluhur nusantara dengan eksplorasi penghayatan batin dan musikalitas kata.',
    lokasi: 'Teater Tertutup Gedung B',
    jadwal: 'Sabtu, 24 Okt 2026 - 13:30 WIB',
    durasiMaksimalMenit: 7,
    durasiTargetDetik: 300, // 5 menit
    assignedJuriIds: ['usr_juri1', 'usr_juri2', 'usr_juri4'],
    icon: 'Feather',
    kriteriaList: [
      {
        id: 'crit_2_1',
        mataLombaId: 'ml_02',
        nama: 'Penghayatan & Penjiwaan Rasa',
        deskripsi: 'Kekuatan menangkap ruh bait puisi dan kedalaman emosionalitas ekspresi.',
        tipe: 'checkbox',
        nilaiMaksimal: 10,
      },
      {
        id: 'crit_2_2',
        mataLombaId: 'ml_02',
        nama: 'Musikalitas Kata & Dinamika Vokal',
        deskripsi: 'Variasi intonasi nada, ritme jeda, desah, dan volume pernafasan.',
        tipe: 'number',
        nilaiMaksimal: 25,
      },
      {
        id: 'crit_2_3',
        mataLombaId: 'ml_02',
        nama: 'Kreativitas Interpretasi Teks',
        deskripsi: 'Keunikan sudut pandang pembawaan dan orisinalitas nuansa panggung.',
        tipe: 'checkbox',
        nilaiMaksimal: 10,
      },
    ],
  },
  {
    id: 'ml_03',
    kode: 'TEKNO-03',
    nama: 'Inovasi Teknologi Tepat Guna',
    kategori: 'Sains & Rekayasa Terapan',
    deskripsi: 'Presentasi dan unjuk kerja alat prototype atau perangkat lunak aplikatif pemecah persoalan masyarakat pedesaan / perkotaan.',
    lokasi: 'Exhibition Hall C Lt. 2',
    jadwal: 'Minggu, 25 Okt 2026 - 09:30 WIB',
    durasiMaksimalMenit: 15,
    durasiTargetDetik: 600, // 10 menit
    assignedJuriIds: ['usr_juri1', 'usr_juri3', 'usr_juri5'],
    icon: 'Cpu',
    kriteriaList: [
      {
        id: 'crit_3_1',
        mataLombaId: 'ml_03',
        nama: 'Tingkat Kebaruan (Novelty) & Orisinalitas',
        deskripsi: 'Kekuatan inovasi rekayasa dan perbedaan nyata dari teknologi yang telah ada.',
        tipe: 'number',
        nilaiMaksimal: 30,
      },
      {
        id: 'crit_3_2',
        mataLombaId: 'ml_03',
        nama: 'Kesiapan Operasional Prototype',
        deskripsi: 'Kelayakan uji coba langsung di depan dewan juri dan efisiensi konsumsi daya.',
        tipe: 'number',
        nilaiMaksimal: 30,
      },
      {
        id: 'crit_3_3',
        mataLombaId: 'ml_03',
        nama: 'Kelayakan Ekonomi & Skalabilitas',
        deskripsi: 'Kemudahan replikasi, keterjangkauan biaya produksi, dan manfaat komersial.',
        tipe: 'checkbox',
        nilaiMaksimal: 10,
      },
    ],
  },
];

const DEFAULT_PESERTA: Peserta[] = [
  {
    id: 'pst_01',
    nomorUrut: 1,
    nomorDada: 'OR-01',
    nama: 'Muhammad Fajar Alfian',
    asalInstansi: 'SMA Negeri 1 Garuda Perkasa Jakarta',
    mataLombaId: 'ml_01',
    kategori: 'Tingkat Nasional',
    kontak: '081211112222',
  },
  {
    id: 'pst_02',
    nomorUrut: 2,
    nomorDada: 'OR-02',
    nama: 'Anindya Putri Rahayu',
    asalInstansi: 'Universitas Indonesia Emas',
    mataLombaId: 'ml_01',
    kategori: 'Tingkat Nasional',
    kontak: '081233334444',
  },
  {
    id: 'pst_03',
    nomorUrut: 3,
    nomorDada: 'OR-03',
    nama: 'Bagus Tri Wicaksono',
    asalInstansi: 'Institut Teknologi Mahardika Bandung',
    mataLombaId: 'ml_01',
    kategori: 'Tingkat Nasional',
    kontak: '081255556666',
  },
  {
    id: 'pst_04',
    nomorUrut: 4,
    nomorDada: 'OR-04',
    nama: 'Clara Shinta Maharani',
    asalInstansi: 'SMA Unggulan Bintang Cemerlang Surabaya',
    mataLombaId: 'ml_01',
    kategori: 'Tingkat Nasional',
    kontak: '081277778888',
  },
  {
    id: 'pst_05',
    nomorUrut: 1,
    nomorDada: 'ST-01',
    nama: 'Darmawan Surya Kusuma',
    asalInstansi: 'Sanggar Sastra Nusantara Yogyakarta',
    mataLombaId: 'ml_02',
    kategori: 'Umum',
    kontak: '081299990000',
  },
  {
    id: 'pst_06',
    nomorUrut: 2,
    nomorDada: 'ST-02',
    nama: 'Eka Novitasari Utami',
    asalInstansi: 'Komunitas Puisi Harmoni Solo',
    mataLombaId: 'ml_02',
    kategori: 'Umum',
    kontak: '081311223344',
  },
  {
    id: 'pst_07',
    nomorUrut: 1,
    nomorDada: 'TK-01',
    nama: 'Fikri Haikal & Tim Rekayasa',
    asalInstansi: 'Politeknik Rekayasa Mandiri Malang',
    mataLombaId: 'ml_03',
    kategori: 'Perguruan Tinggi',
    kontak: '081355667788',
  },
];

const DEFAULT_SUBMISSIONS: NilaiSubmission[] = [
  // Fajar Alfian (pst_01) by juri1
  {
    id: 'sub_01_juri1',
    mataLombaId: 'ml_01',
    pesertaId: 'pst_01',
    juriId: 'usr_juri1',
    juriNama: 'Prof. Dr. Hendra Wijaya, M.Sn',
    waktuPengerjaanDetik: 410, // 6m 50s
    nilaiKriteria: [
      { kriteriaId: 'crit_1_1', nilai: 9, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { kriteriaId: 'crit_1_2', nilai: 8, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8] },
      { kriteriaId: 'crit_1_3', nilai: 23 },
      { kriteriaId: 'crit_1_4', nilai: 9, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    ],
    pelanggaranList: [],
    totalPengurangan: 0,
    totalNilai: 49, // 9 + 8 + 23 + 9
    catatanJuri: 'Gagasan sangat bernas dan artikulasi jelas. Pertahankan tempo pengucapan.',
    tandaTanganUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 25 Q 30 5 50 25 T 90 20" stroke="%2378350f" fill="none" stroke-width="2"/></svg>',
    paktaIntegritasDisetujui: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    approvedAt: new Date(Date.now() - 3000000).toISOString(),
    approvedBy: 'Usseradmin',
  },
  // Fajar Alfian (pst_01) by juri2
  {
    id: 'sub_01_juri2',
    mataLombaId: 'ml_01',
    pesertaId: 'pst_01',
    juriId: 'usr_juri2',
    juriNama: 'Dra. Hj. Siti Aminah, M.Pd',
    waktuPengerjaanDetik: 415,
    nilaiKriteria: [
      { kriteriaId: 'crit_1_1', nilai: 9, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { kriteriaId: 'crit_1_2', nilai: 9, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { kriteriaId: 'crit_1_3', nilai: 22 },
      { kriteriaId: 'crit_1_4', nilai: 8, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8] },
    ],
    pelanggaranList: [],
    totalPengurangan: 0,
    totalNilai: 48,
    catatanJuri: 'Penampilan mengesankan dan etika panggung terjaga.',
    tandaTanganUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 20 Q 40 30 70 10 T 90 30" stroke="%2378350f" fill="none" stroke-width="2"/></svg>',
    paktaIntegritasDisetujui: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 3500000).toISOString(),
    approvedAt: new Date(Date.now() - 3000000).toISOString(),
    approvedBy: 'Usseradmin',
  },
  // Anindya Putri (pst_02) by juri1
  {
    id: 'sub_02_juri1',
    mataLombaId: 'ml_01',
    pesertaId: 'pst_02',
    juriId: 'usr_juri1',
    juriNama: 'Prof. Dr. Hendra Wijaya, M.Sn',
    waktuPengerjaanDetik: 405, // 6m 45s - faster!
    nilaiKriteria: [
      { kriteriaId: 'crit_1_1', nilai: 10, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      { kriteriaId: 'crit_1_2', nilai: 9, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
      { kriteriaId: 'crit_1_3', nilai: 24 },
      { kriteriaId: 'crit_1_4', nilai: 9, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    ],
    pelanggaranList: [],
    totalPengurangan: 0,
    totalNilai: 52,
    catatanJuri: 'Luar biasa, orasi sangat membakar semangat!',
    tandaTanganUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M15 15 Q 35 35 60 15 T 85 25" stroke="%2378350f" fill="none" stroke-width="2"/></svg>',
    paktaIntegritasDisetujui: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 2500000).toISOString(),
    approvedAt: new Date(Date.now() - 2000000).toISOString(),
    approvedBy: 'Usseradmin',
  },
  // Bagus Tri (pst_03) by juri1 - Pending approval
  {
    id: 'sub_03_juri1',
    mataLombaId: 'ml_01',
    pesertaId: 'pst_03',
    juriId: 'usr_juri1',
    juriNama: 'Prof. Dr. Hendra Wijaya, M.Sn',
    waktuPengerjaanDetik: 435,
    nilaiKriteria: [
      { kriteriaId: 'crit_1_1', nilai: 8, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8] },
      { kriteriaId: 'crit_1_2', nilai: 8, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8] },
      { kriteriaId: 'crit_1_3', nilai: 20 },
      { kriteriaId: 'crit_1_4', nilai: 8, checkedIndices: [1, 2, 3, 4, 5, 6, 7, 8] },
    ],
    pelanggaranList: [
      { id: 'p_01', nama: 'Kelebihan durasi 15 detik dari target', poinPengurangan: 2 }
    ],
    totalPengurangan: 2,
    totalNilai: 42,
    catatanJuri: 'Gagasan baik namun sedikit melampaui alokasi target waktu.',
    tandaTanganUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 20 Q 50 5 90 20" stroke="%2378350f" fill="none" stroke-width="2"/></svg>',
    paktaIntegritasDisetujui: true,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_VOTING_CATEGORIES: VotingCategory[] = [
  {
    id: 'vote_cat_01',
    nama: 'Juara Terfavorit Pemirsa Nasional (Kategori Utama)',
    deskripsi: 'Penghargaan bergengsi pilihan langsung publik dan audiens dari seluruh cabang lomba.',
    hargaPerVote: 5000,
    isActive: true,
  },
  {
    id: 'vote_cat_02',
    nama: 'Best Speaker & Orator Paling Inspiratif',
    deskripsi: 'Pilihan pemirsa untuk peserta dengan pengaruh orasi kebangsaan paling berbobot.',
    hargaPerVote: 5000,
    mataLombaId: 'ml_01',
    isActive: true,
  },
];

const DEFAULT_TOPUP_REQUESTS: TopupRequest[] = [
  {
    id: 'topup_01',
    voterId: 'usr_voter1',
    voterNama: 'Andi Pratama Wijaya',
    jumlahVote: 15,
    hargaTotal: 75000,
    metode: 'DANA_QRIS',
    nomorDanaTujuan: '081314420312',
    buktiTransferUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80',
    pengirimNama: 'Andi Pratama',
    pengirimNomorHp: '081388990011',
    status: 'approved',
    catatanAdmin: 'Verifikasi sukses, dana masuk ke rekening DANA.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    approvedAt: new Date(Date.now() - 7000000).toISOString(),
  },
  {
    id: 'topup_02',
    voterId: 'usr_voter2',
    voterNama: 'Dewi Lestari Putri',
    jumlahVote: 10,
    hargaTotal: 50000,
    metode: 'DANA_QRIS',
    nomorDanaTujuan: '081314420312',
    buktiTransferUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    pengirimNama: 'Dewi Lestari',
    pengirimNomorHp: '081399887766',
    status: 'pending',
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

const DEFAULT_VOTE_RECORDS: VoteRecord[] = [
  {
    id: 'vr_01',
    votingCategoryId: 'vote_cat_01',
    voterId: 'usr_voter1',
    pesertaId: 'pst_02', // Anindya
    jumlahVote: 24,
    createdAt: new Date(Date.now() - 5000000).toISOString(),
  },
  {
    id: 'vr_02',
    votingCategoryId: 'vote_cat_01',
    voterId: 'usr_voter1',
    pesertaId: 'pst_01', // Fajar
    jumlahVote: 19,
    createdAt: new Date(Date.now() - 4000000).toISOString(),
  },
  {
    id: 'vr_03',
    votingCategoryId: 'vote_cat_01',
    voterId: 'usr_voter2',
    pesertaId: 'pst_03', // Bagus Tri
    jumlahVote: 14,
    createdAt: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 'vr_04',
    votingCategoryId: 'vote_cat_01',
    voterId: 'usr_voter2',
    pesertaId: 'pst_05', // Darmawan
    jumlahVote: 8,
    createdAt: new Date(Date.now() - 2000000).toISOString(),
  },
];

// Broadcast channel for multi-tab live sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('simpel_digital_channel');
  } catch {
    broadcastChannel = null;
  }
}

export const StorageService = {
  // Broadcaster
  broadcastChange(type: string) {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, timestamp: Date.now() });
    }
  },

  onRemoteChange(callback: (type: string) => void) {
    if (typeof window === 'undefined') return () => {};

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type) {
        callback(event.data.type);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('simpel_')) {
        callback('storage_update');
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }
    window.addEventListener('storage', handleStorage);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      window.removeEventListener('storage', handleStorage);
    };
  },

  // USERS
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.broadcastChange('users');
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  },

  updateUser(user: User) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    this.saveUsers(users);

    // If currently logged in user updated, update current session too
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
  },

  deleteUser(userId: string) {
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);
  },

  // AUTH SESSION
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.broadcastChange('auth');
  },

  // MATA LOMBA
  getMataLomba(): MataLomba[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MATA_LOMBA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MATA_LOMBA, JSON.stringify(DEFAULT_MATA_LOMBA));
      return DEFAULT_MATA_LOMBA;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_MATA_LOMBA;
    }
  },

  saveMataLomba(list: MataLomba[]) {
    localStorage.setItem(STORAGE_KEYS.MATA_LOMBA, JSON.stringify(list));
    this.broadcastChange('matalomba');
  },

  clearMataLomba() {
    this.saveMataLomba([]);
  },

  // PESERTA
  getPeserta(): Peserta[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PESERTA);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(DEFAULT_PESERTA));
      return DEFAULT_PESERTA;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PESERTA;
    }
  },

  savePeserta(list: Peserta[]) {
    localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(list));
    this.broadcastChange('peserta');
  },

  clearPeserta() {
    this.savePeserta([]);
  },

  // SUBMISSIONS (NILAI)
  getSubmissions(): NilaiSubmission[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(DEFAULT_SUBMISSIONS));
      return DEFAULT_SUBMISSIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SUBMISSIONS;
    }
  },

  saveSubmissions(list: NilaiSubmission[]) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    this.broadcastChange('submissions');
  },

  addOrUpdateSubmission(sub: NilaiSubmission) {
    const list = this.getSubmissions();
    const idx = list.findIndex(s => s.id === sub.id || (s.pesertaId === sub.pesertaId && s.juriId === sub.juriId && s.mataLombaId === sub.mataLombaId));
    if (idx >= 0) {
      list[idx] = sub;
    } else {
      list.push(sub);
    }
    this.saveSubmissions(list);
  },

  deleteSubmission(subId: string) {
    const list = this.getSubmissions().filter(s => s.id !== subId);
    this.saveSubmissions(list);
  },

  clearSubmissions() {
    this.saveSubmissions([]);
  },

  // MATA LOMBA HELPERS
  updateMataLomba(ml: MataLomba) {
    const list = this.getMataLomba();
    const idx = list.findIndex(m => m.id === ml.id);
    if (idx >= 0) list[idx] = ml;
    else list.push(ml);
    this.saveMataLomba(list);
  },

  deleteMataLomba(mlId: string) {
    const list = this.getMataLomba().filter(m => m.id !== mlId);
    this.saveMataLomba(list);
  },

  // PESERTA HELPERS
  updatePeserta(pst: Peserta) {
    const list = this.getPeserta();
    const idx = list.findIndex(p => p.id === pst.id);
    if (idx >= 0) list[idx] = pst;
    else list.push(pst);
    this.savePeserta(list);
  },

  deletePeserta(pstId: string) {
    const list = this.getPeserta().filter(p => p.id !== pstId);
    this.savePeserta(list);
  },

  // VOTING CATEGORIES
  getVotingCategories(): VotingCategory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTING_CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VOTING_CATEGORIES, JSON.stringify(DEFAULT_VOTING_CATEGORIES));
      return DEFAULT_VOTING_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_VOTING_CATEGORIES;
    }
  },

  saveVotingCategories(list: VotingCategory[]) {
    localStorage.setItem(STORAGE_KEYS.VOTING_CATEGORIES, JSON.stringify(list));
    this.broadcastChange('voting_categories');
  },

  updateVotingCategory(cat: VotingCategory) {
    const list = this.getVotingCategories();
    const idx = list.findIndex(c => c.id === cat.id);
    if (idx >= 0) list[idx] = cat;
    else list.push(cat);
    this.saveVotingCategories(list);
  },

  deleteVotingCategory(catId: string) {
    const list = this.getVotingCategories().filter(c => c.id !== catId);
    this.saveVotingCategories(list);
  },

  // TOPUP REQUESTS
  getTopupRequests(): TopupRequest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPUP_REQUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TOPUP_REQUESTS, JSON.stringify(DEFAULT_TOPUP_REQUESTS));
      return DEFAULT_TOPUP_REQUESTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TOPUP_REQUESTS;
    }
  },

  saveTopupRequests(list: TopupRequest[]) {
    localStorage.setItem(STORAGE_KEYS.TOPUP_REQUESTS, JSON.stringify(list));
    this.broadcastChange('topup_requests');
  },

  updateTopupRequest(req: TopupRequest) {
    const list = this.getTopupRequests();
    const idx = list.findIndex(t => t.id === req.id);
    if (idx >= 0) list[idx] = req;
    else list.unshift(req);
    this.saveTopupRequests(list);
  },

  deleteTopupRequest(reqId: string) {
    const list = this.getTopupRequests().filter(t => t.id !== reqId);
    this.saveTopupRequests(list);
  },

  addTopupRequest(req: TopupRequest) {
    const list = this.getTopupRequests();
    list.unshift(req);
    this.saveTopupRequests(list);
  },

  // VOTE RECORDS
  getVoteRecords(): VoteRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VOTE_RECORDS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.VOTE_RECORDS, JSON.stringify(DEFAULT_VOTE_RECORDS));
      return DEFAULT_VOTE_RECORDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_VOTE_RECORDS;
    }
  },

  saveVoteRecords(list: VoteRecord[]) {
    localStorage.setItem(STORAGE_KEYS.VOTE_RECORDS, JSON.stringify(list));
    this.broadcastChange('vote_records');
  },

  clearVoteRecords() {
    this.saveVoteRecords([]);
  },

  clearTopupRequests() {
    this.saveTopupRequests([]);
  },

  castVote(votingCategoryId: string, voterId: string, pesertaId: string, jumlah: number): { success: boolean; message: string } {
    const users = this.getUsers();
    const voter = users.find(u => u.id === voterId);
    if (!voter) {
      return { success: false, message: 'Pengguna voter tidak ditemukan.' };
    }
    const currentBalance = voter.voteBalance || 0;
    if (currentBalance < jumlah) {
      return { success: false, message: `Saldo vote tidak mencukupi (${currentBalance} suara tersisa). Silakan top-up terlebih dahulu.` };
    }

    // Deduct balance
    voter.voteBalance = currentBalance - jumlah;
    this.saveUsers(users);

    // Save record
    const records = this.getVoteRecords();
    records.push({
      id: 'vr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      votingCategoryId,
      voterId,
      pesertaId,
      jumlahVote: jumlah,
      createdAt: new Date().toISOString(),
    });
    this.saveVoteRecords(records);

    return { success: true, message: `Berhasil memberikan ${jumlah} vote!` };
  },

  // EVENT CONFIG
  getEventConfig(): EventConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENT_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(DEFAULT_EVENT_CONFIG));
      return DEFAULT_EVENT_CONFIG;
    }
    try {
      return { ...DEFAULT_EVENT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_EVENT_CONFIG;
    }
  },

  saveEventConfig(cfg: EventConfig) {
    localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(cfg));
    this.broadcastChange('event_config');
  },

  // BACKUP & RESTORE
  exportFullBackup(): string {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      mataLomba: this.getMataLomba(),
      peserta: this.getPeserta(),
      submissions: this.getSubmissions(),
      votingCategories: this.getVotingCategories(),
      topupRequests: this.getTopupRequests(),
      voteRecords: this.getVoteRecords(),
      eventConfig: this.getEventConfig(),
    };
    return JSON.stringify(data, null, 2);
  },

  importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.mataLomba) localStorage.setItem(STORAGE_KEYS.MATA_LOMBA, JSON.stringify(data.mataLomba));
      if (data.peserta) localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(data.peserta));
      if (data.submissions) localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(data.submissions));
      if (data.votingCategories) localStorage.setItem(STORAGE_KEYS.VOTING_CATEGORIES, JSON.stringify(data.votingCategories));
      if (data.topupRequests) localStorage.setItem(STORAGE_KEYS.TOPUP_REQUESTS, JSON.stringify(data.topupRequests));
      if (data.voteRecords) localStorage.setItem(STORAGE_KEYS.VOTE_RECORDS, JSON.stringify(data.voteRecords));
      if (data.eventConfig) localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(data.eventConfig));
      this.broadcastChange('all_restored');
      return true;
    } catch {
      return false;
    }
  },

  resetAllToDefault() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.MATA_LOMBA, JSON.stringify(DEFAULT_MATA_LOMBA));
    localStorage.setItem(STORAGE_KEYS.PESERTA, JSON.stringify(DEFAULT_PESERTA));
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(DEFAULT_SUBMISSIONS));
    localStorage.setItem(STORAGE_KEYS.VOTING_CATEGORIES, JSON.stringify(DEFAULT_VOTING_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.TOPUP_REQUESTS, JSON.stringify(DEFAULT_TOPUP_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.VOTE_RECORDS, JSON.stringify(DEFAULT_VOTE_RECORDS));
    localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(DEFAULT_EVENT_CONFIG));
    this.broadcastChange('all_reset');
  },

  // CALCULATION LOGIC & RANKING
  calculateRanking(mataLombaId: string): RankingParticipant[] {
    const allMataLomba = this.getMataLomba();
    const ml = allMataLomba.find(m => m.id === mataLombaId);
    if (!ml) return [];

    const pesertaList = this.getPeserta().filter(p => p.mataLombaId === mataLombaId);
    const submissions = this.getSubmissions().filter(s => s.mataLombaId === mataLombaId && s.status === 'approved');

    const results: RankingParticipant[] = pesertaList.map(pst => {
      const pstSubs = submissions.filter(s => s.pesertaId === pst.id);
      const count = pstSubs.length;
      const totalScoreSum = pstSubs.reduce((acc, curr) => acc + curr.totalNilai, 0);
      const totalTimeSum = pstSubs.reduce((acc, curr) => acc + curr.waktuPengerjaanDetik, 0);

      const rataRataNilai = count > 0 ? Number((totalScoreSum / count).toFixed(2)) : 0;
      const rataRataWaktuDetik = count > 0 ? Math.round(totalTimeSum / count) : 0;

      const isApprovedComplete = ml.assignedJuriIds.length > 0 && count >= ml.assignedJuriIds.length;

      return {
        peserta: pst,
        mataLomba: ml,
        submissions: pstSubs,
        jumlahJuriMenilai: count,
        rataRataNilai,
        rataRataWaktuDetik,
        rank: 0,
        isApprovedComplete,
      };
    });

    // Ranking algorithm:
    // 1. Highest average score (rataRataNilai DESC)
    // 2. Tie-breaker: Fastest time (rataRataWaktuDetik ASC) when average scores are equal!
    results.sort((a, b) => {
      if (b.rataRataNilai !== a.rataRataNilai) {
        return b.rataRataNilai - a.rataRataNilai;
      }
      // Tie breaker: only compare time if both have score > 0
      if (a.rataRataNilai > 0 && b.rataRataNilai > 0) {
        if (a.rataRataWaktuDetik !== b.rataRataWaktuDetik) {
          // Lesser seconds = faster = better rank!
          return a.rataRataWaktuDetik - b.rataRataWaktuDetik;
        }
      }
      return a.peserta.nomorUrut - b.peserta.nomorUrut;
    });

    // Assign rank and predikat juara:
    results.forEach((item, index) => {
      item.rank = index + 1;
      if (item.rataRataNilai > 0) {
        if (item.rank === 1) item.predikatJuara = 'Juara 1 (Emas)';
        else if (item.rank === 2) item.predikatJuara = 'Juara 2 (Perak)';
        else if (item.rank === 3) item.predikatJuara = 'Juara 3 (Perunggu)';
        else if (item.rank === 4) item.predikatJuara = 'Harapan 1';
        else if (item.rank === 5) item.predikatJuara = 'Harapan 2';
        else if (item.rank === 6) item.predikatJuara = 'Harapan 3';
        else item.predikatJuara = 'Finalis';
      }
    });

    return results;
  },

  // VOTE TOTALS PER PARTICIPANT
  getVoteCounts(votingCategoryId?: string): Record<string, number> {
    const records = this.getVoteRecords();
    const counts: Record<string, number> = {};

    records.forEach(r => {
      if (!votingCategoryId || r.votingCategoryId === votingCategoryId) {
        counts[r.pesertaId] = (counts[r.pesertaId] || 0) + r.jumlahVote;
      }
    });

    return counts;
  },
};
