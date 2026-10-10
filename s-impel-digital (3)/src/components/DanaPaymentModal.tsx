import React, { useState } from 'react';
import { QrCode, Upload, CheckCircle2, Copy, AlertTriangle, ArrowRight, ArrowLeft, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { EventConfig, TopupRequest, User } from '../types';
import { StorageService } from '../services/storage';
import { soundService } from '../services/sound';

interface DanaPaymentModalProps {
  currentUser: User;
  eventConfig: EventConfig;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DanaPaymentModal: React.FC<DanaPaymentModalProps> = ({
  currentUser,
  eventConfig,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [voteCount, setVoteCount] = useState<number>(10);
  const [customVote, setCustomVote] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [senderName, setSenderName] = useState<string>(currentUser.name || '');
  const [senderPhone, setSenderPhone] = useState<string>(currentUser.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const PRICE_PER_VOTE = 5000;
  const currentVotes = customVote ? Math.max(1, parseInt(customVote) || 1) : voteCount;
  const totalAmount = currentVotes * PRICE_PER_VOTE;

  const handleCopyDana = () => {
    navigator.clipboard.writeText(eventConfig.nomorDanaAdmin || '081314420312');
    setCopied(true);
    soundService.playClick();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = () => {
    if (!proofUrl) {
      alert('Mohon unggah bukti transfer / screenshot pembayaran Anda.');
      return;
    }
    if (!senderName.trim()) {
      alert('Mohon isi nama pengirim rekening DANA Anda.');
      return;
    }

    setIsSubmitting(true);
    soundService.playClick();

    const newRequest: TopupRequest = {
      id: 'topup_' + Date.now(),
      voterId: currentUser.id,
      voterNama: currentUser.name,
      jumlahVote: currentVotes,
      hargaTotal: totalAmount,
      metode: 'DANA_QRIS',
      nomorDanaTujuan: eventConfig.nomorDanaAdmin || '081314420312',
      buktiTransferUrl: proofUrl,
      pengirimNama: senderName,
      pengirimNomorHp: senderPhone,
      status: eventConfig.autoApproveWebhookEnabled ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: eventConfig.autoApproveWebhookEnabled ? new Date().toISOString() : undefined,
    };

    if (eventConfig.autoApproveWebhookEnabled) {
      // Auto approve immediately if simulator is on
      const users = StorageService.getUsers();
      const voter = users.find(u => u.id === currentUser.id);
      if (voter) {
        voter.voteBalance = (voter.voteBalance || 0) + currentVotes;
        StorageService.saveUsers(users);
      }
    }

    StorageService.addTopupRequest(newRequest);

    setIsSubmitting(false);
    setStep(4);
    soundService.playSuccessFanfare();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-stone-900 border-2 border-amber-500/50 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-stone-100 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 px-6 py-4 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-stone-950 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-100">
                Beli Suara Vote via DANA QRIS
              </h3>
              <p className="text-xs text-amber-200/80">
                Akun Resmi DANA: <span className="font-mono font-bold text-white">{eventConfig.nomorDanaAdmin || '081314420312'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200/70 hover:text-white p-1 rounded-lg text-xl"
          >
            ✕
          </button>
        </div>

        {/* Feature toggle check */}
        {eventConfig.danaTransferDisabled ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-950/80 border border-red-500/50 rounded-full flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-red-200">
              Layanan Transfer DANA Sedang Dinonaktifkan
            </h4>
            <p className="text-sm text-stone-400 max-w-sm mx-auto">
              Panitia / Super Admin sedang menjeda sementara penerimaan transaksi voting berbayar via DANA. Silakan hubungi panitia acara.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Step Indicators */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`p-2 rounded-lg border ${step === 1 ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : step > 1 ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-stone-800/40 border-stone-700 text-stone-400'}`}>
                1. Pilih Paket
              </div>
              <div className={`p-2 rounded-lg border ${step === 2 ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : step > 2 ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' : 'bg-stone-800/40 border-stone-700 text-stone-400'}`}>
                2. Scan QRIS DANA
              </div>
              <div className={`p-2 rounded-lg border ${step >= 3 ? 'bg-amber-600/30 border-amber-500 text-amber-300 font-bold' : 'bg-stone-800/40 border-stone-700 text-stone-400'}`}>
                3. Kirim Bukti
              </div>
            </div>

            {/* STEP 1: Pilih Paket Vote */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-sm text-stone-300">
                  Pilih jumlah tiket voting yang ingin Anda beli. Harga resmi: <strong className="text-amber-400">Rp {PRICE_PER_VOTE.toLocaleString('id-ID')} / Vote</strong>.
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[5, 10, 20].map(qty => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => {
                        setVoteCount(qty);
                        setCustomVote('');
                        soundService.playClick();
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                        !customVote && voteCount === qty
                          ? 'bg-gradient-to-b from-amber-600/40 to-amber-900/60 border-amber-400 text-amber-200 shadow-md ring-2 ring-amber-500/50'
                          : 'bg-stone-800/60 border-stone-700 text-stone-300 hover:border-amber-600/50'
                      }`}
                    >
                      <div className="text-xl font-extrabold text-amber-300">{qty}</div>
                      <div className="text-[11px] text-stone-400">Suara Vote</div>
                      <div className="mt-1 text-xs font-mono font-bold text-white">
                        Rp {(qty * PRICE_PER_VOTE).toLocaleString('id-ID')}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800 space-y-2">
                  <label className="text-xs text-stone-300 font-medium flex items-center justify-between">
                    <span>Atau Jumlah Kustom:</span>
                    <span className="text-[11px] text-amber-400 font-mono">
                      Subtotal: Rp {(currentVotes * PRICE_PER_VOTE).toLocaleString('id-ID')}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Masukkan jumlah vote (misal: 50)"
                    value={customVote}
                    onChange={e => setCustomVote(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
                  <div>
                    <div className="text-xs text-amber-200/70">Total Tagihan Transfer:</div>
                    <div className="text-lg font-mono font-bold text-amber-300">
                      Rp {totalAmount.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundService.playClick();
                      setStep(2);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-sm shadow cursor-pointer transition-all"
                  >
                    Lanjut ke QRIS DANA
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Scan QRIS DANA (081314420312) */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-sm text-amber-300">
                    Scan Barcode QRIS / Transfer ke Akun DANA
                  </h4>
                  <p className="text-xs text-stone-400">
                    Buka aplikasi DANA di ponsel Anda dan scan kode QR atau kirim ke nomor di bawah:
                  </p>
                </div>

                {/* QR Code graphic & details */}
                <div className="bg-white p-4 rounded-2xl shadow-xl max-w-[260px] mx-auto text-stone-900 text-center border-4 border-amber-400">
                  <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 mb-1">
                    QRIS RESMI DANA
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200 flex flex-col items-center justify-center">
                    {/* SVG Stylized QR Code with DANA logo accent */}
                    <svg viewBox="0 0 200 200" className="w-44 h-44">
                      {/* Corner markers */}
                      <rect x="10" y="10" width="45" height="45" fill="#111827" rx="6" />
                      <rect x="18" y="18" width="29" height="29" fill="#ffffff" rx="3" />
                      <rect x="25" y="25" width="15" height="15" fill="#d97706" rx="2" />

                      <rect x="145" y="10" width="45" height="45" fill="#111827" rx="6" />
                      <rect x="153" y="18" width="29" height="29" fill="#ffffff" rx="3" />
                      <rect x="160" y="25" width="15" height="15" fill="#d97706" rx="2" />

                      <rect x="10" y="145" width="45" height="45" fill="#111827" rx="6" />
                      <rect x="18" y="153" width="29" height="29" fill="#ffffff" rx="3" />
                      <rect x="25" y="160" width="15" height="15" fill="#d97706" rx="2" />

                      {/* Random dense QR code matrix pattern */}
                      <g fill="#1f2937">
                        <rect x="65" y="15" width="12" height="12" />
                        <rect x="85" y="15" width="12" height="24" />
                        <rect x="105" y="20" width="24" height="12" />
                        <rect x="65" y="35" width="25" height="10" />
                        <rect x="100" y="40" width="15" height="15" />
                        <rect x="125" y="35" width="12" height="20" />

                        <rect x="20" y="65" width="25" height="12" />
                        <rect x="55" y="65" width="20" height="20" />
                        <rect x="85" y="60" width="30" height="12" />
                        <rect x="125" y="65" width="20" height="15" />
                        <rect x="155" y="65" width="25" height="12" />

                        <rect x="15" y="85" width="15" height="25" />
                        <rect x="40" y="90" width="25" height="15" />
                        <rect x="140" y="90" width="20" height="25" />
                        <rect x="170" y="85" width="15" height="20" />

                        <rect x="70" y="85" width="60" height="30" rx="4" fill="#0284c7" />
                        <text x="100" y="105" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">DANA</text>

                        <rect x="15" y="120" width="20" height="15" />
                        <rect x="45" y="115" width="30" height="12" />
                        <rect x="85" y="125" width="20" height="20" />
                        <rect x="115" y="120" width="25" height="15" />
                        <rect x="150" y="125" width="35" height="12" />

                        <rect x="65" y="155" width="30" height="12" />
                        <rect x="105" y="150" width="15" height="30" />
                        <rect x="130" y="160" width="20" height="15" />
                        <rect x="160" y="155" width="25" height="25" />
                        <rect x="65" y="175" width="45" height="12" />
                      </g>
                    </svg>
                  </div>
                  <div className="mt-2 text-xs font-bold text-stone-800">
                    {eventConfig.namaAkunDana || 'S-IMPEL DIGITAL'}
                  </div>
                  <div className="text-[11px] font-mono text-stone-600">
                    ID: {eventConfig.nomorDanaAdmin || '081314420312'}
                  </div>
                </div>

                {/* Account Number Box with 1-click Copy */}
                <div className="bg-stone-950/80 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-stone-400 block">Nomor Akun DANA Tujuan:</span>
                    <span className="text-base font-mono font-bold text-amber-300">
                      {eventConfig.nomorDanaAdmin || '081314420312'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyDana}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-semibold border border-stone-700 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Tersalin!' : 'Salin Nomor'}
                  </button>
                </div>

                <div className="bg-amber-950/30 border border-amber-600/30 p-3 rounded-xl text-xs text-amber-200/90 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Pastikan nominal transfer pas sebesar <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong> ({currentVotes} suara vote). Setelah scan QRIS / transfer sukses, klik tombol lanjut untuk mengirim bukti.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playClick();
                      setStep(3);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-sm shadow cursor-pointer transition-all"
                  >
                    Sudah Transfer: Upload Bukti
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Upload Bukti Transfer */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-sm text-stone-300">
                  Kirimkan detail dan foto struk/screenshot transaksi DANA Anda untuk diverifikasi oleh Admin.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-300 block mb-1">Nama Pengirim Rekening DANA:</label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      placeholder="Contoh: Budi Gunawan"
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-300 block mb-1">Nomor HP / DANA Pengirim:</label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Upload Image Box */}
                <div>
                  <label className="text-xs text-stone-300 block mb-1">
                    Unggah Bukti Transfer (Screenshot Struk DANA):
                  </label>
                  <div className="border-2 border-dashed border-stone-700 hover:border-amber-500 rounded-xl p-4 text-center bg-stone-950/60 relative">
                    {proofUrl ? (
                      <div className="space-y-2">
                        <img
                          src={proofUrl}
                          alt="Bukti Transfer"
                          className="max-h-40 mx-auto rounded-lg border border-stone-700 object-contain shadow"
                        />
                        <div className="text-xs text-emerald-400 font-medium">
                          ✓ Foto bukti transfer siap dikirim
                        </div>
                        <label className="inline-block text-xs text-amber-300 underline cursor-pointer hover:text-amber-200">
                          Ganti foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer block space-y-2">
                        <Upload className="w-8 h-8 text-amber-400 mx-auto" />
                        <div className="text-xs text-stone-300 font-semibold">
                          Klik untuk memilih file foto bukti dari perangkat Anda
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Mendukung format JPG, PNG, atau WebP
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Summary box */}
                <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-stone-400 block">Jumlah Vote:</span>
                    <strong className="text-amber-300">{currentVotes} Suara</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-400 block">Nominal Terbayar:</span>
                    <strong className="text-emerald-400 font-mono">Rp {totalAmount.toLocaleString('id-ID')}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Lihat QRIS Lagi
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitProof}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl text-sm shadow cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success confirmation */}
            {step === 4 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-300">
                    Permintaan Top-Up Berhasil Dikirim!
                  </h4>
                  <p className="text-xs text-stone-300 max-w-sm mx-auto mt-1 leading-relaxed">
                    Bukti pembayaran Anda untuk pembelian <strong>{currentVotes} suara vote</strong> (Rp {totalAmount.toLocaleString('id-ID')}) telah masuk ke sistem antrean verifikasi Admin.
                  </p>
                </div>

                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs text-stone-400 space-y-1 text-left max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span>Tujuan DANA:</span>
                    <span className="text-stone-200 font-mono">{eventConfig.nomorDanaAdmin || '081314420312'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-amber-400 font-semibold">
                      {eventConfig.autoApproveWebhookEnabled ? 'Otomatis Disetujui (Webhook)' : 'Menunggu Approval Admin'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengirim:</span>
                    <span className="text-stone-200">{senderName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSuccess();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-xl text-xs shadow hover:from-amber-400 hover:to-amber-500 cursor-pointer"
                >
                  Selesai & Ke Dashboard Voter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
