import React, { useRef, useState } from 'react';
import { Printer, Download, ArrowLeft, FileText, CheckCircle2, Award, Clock, Loader2, Sparkles } from 'lucide-react';
import { EventConfig, MataLomba, Peserta, RankingParticipant } from '../types';
import { StorageService } from '../services/storage';
import { soundService } from '../services/sound';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type PrintModeType =
  | 'rekapan_per_matalomba'
  | 'rekapan_keseluruhan'
  | 'blangko_per_peserta_per_lomba'
  | 'blangko_per_peserta_semua_lomba'
  | 'blangko_semua_peserta_per_lomba'
  | 'blangko_semua_peserta_semua_lomba';

interface PrintReportViewProps {
  mode: PrintModeType;
  selectedMataLombaId?: string;
  selectedPesertaId?: string;
  includeFilledScores?: boolean; // false for empty blanks, true for filled sheets
  eventConfig: EventConfig;
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  mode,
  selectedMataLombaId,
  selectedPesertaId,
  includeFilledScores = false,
  eventConfig,
  onClose,
}) => {
  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printDate] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  });

  const mataLombaList = StorageService.getMataLomba();
  const pesertaList = StorageService.getPeserta();
  const submissions = StorageService.getSubmissions();
  const users = StorageService.getUsers();

  const savePdfFile = (pdf: jsPDF, filename: string) => {
    try {
      pdf.save(filename);
    } catch (saveErr) {
      console.warn('pdf.save direct call failed, using Blob fallback:', saveErr);
      const blob = pdf.output('blob');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 500);
    }
  };

  // Pure jsPDF Vector Document Generator: 100% resilient, instantaneous, standard A4 layout, zero DOM/canvas dependency
  const generateVectorPdf = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    const drawKopSurat = (yStart = 14) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(180, 83, 9);
      pdf.text('KOMITE RESMI S-IMPEL DIGITAL • SISTEM PENILAIAN DIGITAL', pageWidth / 2, yStart, { align: 'center' });

      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text((eventConfig.judulKegiatan || 'S-IMPEL DIGITAL').toUpperCase(), pageWidth / 2, yStart + 6.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(75, 85, 99);
      pdf.text(eventConfig.subJudul || 'Sistem Informasi Manajemen Penilaian Lomba Digital', pageWidth / 2, yStart + 11.5, { align: 'center' });

      // Double line separator
      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(0.6);
      pdf.line(margin, yStart + 15, pageWidth - margin, yStart + 15);
      pdf.setLineWidth(0.2);
      pdf.line(margin, yStart + 16, pageWidth - margin, yStart + 16);

      return yStart + 21;
    };

    const drawFooterSignatures = (yPos: number) => {
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = drawKopSurat(14);
      }
      
      pdf.setDrawColor(168, 162, 158);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      const col1 = margin + 35;
      const col2 = pageWidth - margin - 35;

      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('Mengetahui,', col1, yPos, { align: 'center' });
      pdf.text('Ditetapkan Secara Sah,', col2, yPos, { align: 'center' });
      yPos += 4;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Ketua Panitia Pelaksana', col1, yPos, { align: 'center' });
      pdf.text('Koordinator Dewan Juri', col2, yPos, { align: 'center' });
      yPos += 14;

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text('(Tanda Tangan & Cap Basah)', col1, yPos - 5, { align: 'center' });
      pdf.text('(Tanda Tangan Digital Tersertifikasi)', col2, yPos - 5, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      const ketuaNama = eventConfig.penyelenggara.split('&')[0]?.trim() || 'Panitia S-IMPEL DIGITAL';
      const juriNama = users.find(u => u.role === 'juri')?.name || 'Dewan Juri Nasional';
      pdf.text(ketuaNama, col1, yPos, { align: 'center' });
      pdf.text(juriNama, col2, yPos, { align: 'center' });
      yPos += 4;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text('NIP / ID Panitia Resmi', col1, yPos, { align: 'center' });
      pdf.text('Ketua Tim Penilai', col2, yPos, { align: 'center' });
      yPos += 6;

      // Footer Informasi Dokumen Resmi: Tepat di bagian paling bawah halaman
      const footerY = pageHeight - 8;
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.2);
      pdf.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text('S-IMPEL DIGITAL Dokumen Resmi • Keabsahan Terverifikasi', margin, footerY);
      pdf.text(`Dicetak pada: ${printDate}`, pageWidth - margin, footerY, { align: 'right' });
    };

    if (mode === 'rekapan_per_matalomba') {
      let y = drawKopSurat();
      const currentMl = mataLombaList.find(m => m.id === selectedMataLombaId) || mataLombaList[0];
      const ranking = currentMl ? StorageService.calculateRanking(currentMl.id) : [];

      // Title Card
      pdf.setFillColor(254, 243, 199);
      pdf.setDrawColor(251, 191, 36);
      pdf.roundedRect(margin, y, contentWidth, 13, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('REKAPITULASI HASIL AKHIR & PERANGKINGAN', margin + 4, y + 5);

      pdf.setFontSize(7.5);
      pdf.setTextColor(180, 83, 9);
      pdf.text(`Mata Lomba: ${currentMl?.kode || ''} - ${currentMl?.nama || ''} (${currentMl?.kategori || ''})`, margin + 4, y + 9.5);

      y += 16;

      // Table Header
      pdf.setFillColor(226, 232, 240);
      pdf.setDrawColor(148, 163, 184);
      pdf.rect(margin, y, contentWidth, 6.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Peringkat', margin + 2, y + 4.3);
      pdf.text('No Dada', margin + 17, y + 4.3);
      pdf.text('Nama Peserta', margin + 34, y + 4.3);
      pdf.text('Asal Instansi', margin + 82, y + 4.3);
      pdf.text('Waktu', margin + 124, y + 4.3);
      pdf.text('Rata-Rata Nilai', margin + 144, y + 4.3);
      pdf.text('Predikat', margin + 165, y + 4.3);

      y += 6.5;

      ranking.forEach((r, idx) => {
        if (y > pageHeight - 55) {
          pdf.addPage();
          y = drawKopSurat();
        }

        const isTop3 = idx < 3;
        if (isTop3) {
          pdf.setFillColor(254, 249, 195);
          pdf.rect(margin, y, contentWidth, 6, 'F');
        } else if (idx % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y, contentWidth, 6, 'F');
        }

        pdf.setDrawColor(203, 213, 225);
        pdf.line(margin, y + 6, pageWidth - margin, y + 6);

        pdf.setFont('helvetica', isTop3 ? 'bold' : 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(15, 23, 42);

        pdf.text(String(r.rank), margin + 6, y + 4.2, { align: 'center' });
        pdf.text(r.peserta.nomorDada, margin + 23, y + 4.2, { align: 'center' });
        pdf.text(r.peserta.nama.substring(0, 24), margin + 34, y + 4.2);
        pdf.text(r.peserta.asalInstansi.substring(0, 22), margin + 82, y + 4.2);
        pdf.text(r.rataRataWaktuDetik > 0 ? formatSeconds(r.rataRataWaktuDetik) : '-', margin + 124, y + 4.2);
        pdf.text(r.rataRataNilai > 0 ? r.rataRataNilai.toFixed(2) : '0.00', margin + 152, y + 4.2, { align: 'center' });
        
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(isTop3 ? 180 : 75, isTop3 ? 83 : 85, isTop3 ? 9 : 99);
        pdf.text(r.predikatJuara || '-', margin + 165, y + 4.2);

        y += 6;
      });

      if (ranking.length === 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text('Belum ada data peserta atau penilaian untuk mata lomba ini.', pageWidth / 2, y + 6, { align: 'center' });
        y += 10;
      }

      y += 4;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(6.8);
      pdf.setTextColor(100, 116, 139);
      pdf.text('* Catatan Regulasi: Penentuan peringkat didasarkan pada Rata-Rata Nilai Tertinggi. Tie-breaker menggunakan Waktu Tercepat.', margin, y);
      y += 7;

      drawFooterSignatures(y);
    } else if (mode === 'rekapan_keseluruhan') {
      let y = drawKopSurat();

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text('REKAPITULASI MASTER SELURUH CABANG MATA LOMBA', pageWidth / 2, y, { align: 'center' });
      y += 7;

      mataLombaList.forEach((ml) => {
        const ranking = StorageService.calculateRanking(ml.id);

        if (y > pageHeight - 50) {
          pdf.addPage();
          y = drawKopSurat();
        }

        pdf.setFillColor(241, 245, 249);
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(margin, y, contentWidth, 5.5, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`${ml.kode} • ${ml.nama} (${ml.kategori})`, margin + 3, y + 3.8);
        y += 5.5;

        ranking.slice(0, 5).forEach((r, rIdx) => {
          if (y > pageHeight - 40) {
            pdf.addPage();
            y = drawKopSurat();
          }

          if (rIdx < 3) {
            pdf.setFillColor(254, 249, 195);
            pdf.rect(margin, y, contentWidth, 5, 'F');
          }
          pdf.setDrawColor(226, 232, 240);
          pdf.line(margin, y + 5, pageWidth - margin, y + 5);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6.8);
          pdf.setTextColor(15, 23, 42);
          pdf.text(`Rank ${r.rank}`, margin + 3, y + 3.5);
          pdf.text(r.peserta.nomorDada, margin + 18, y + 3.5);
          pdf.text(r.peserta.nama.substring(0, 24), margin + 34, y + 3.5);
          pdf.text(r.peserta.asalInstansi.substring(0, 22), margin + 82, y + 3.5);
          pdf.text(formatSeconds(r.rataRataWaktuDetik), margin + 125, y + 3.5);
          pdf.text(r.rataRataNilai.toFixed(2), margin + 152, y + 3.5);
          pdf.setFont('helvetica', 'bold');
          pdf.text(r.predikatJuara || '-', margin + 165, y + 3.5);

          y += 5;
        });
        y += 2.5;
      });

      drawFooterSignatures(y);
    } else {
      // Blangko Lembar Penilaian Juri: 1 Peserta per halaman standar A4
      let targets: { ml: MataLomba; pst?: Peserta }[] = [];
      if (mode === 'blangko_per_peserta_per_lomba') {
        const ml = mataLombaList.find(m => m.id === selectedMataLombaId) || mataLombaList[0];
        const pst = pesertaList.find(p => p.id === selectedPesertaId) || pesertaList.find(p => p.mataLombaId === ml.id);
        if (ml && pst) targets.push({ ml, pst });
      } else if (mode === 'blangko_per_peserta_semua_lomba') {
        const pst = pesertaList.find(p => p.id === selectedPesertaId) || pesertaList[0];
        mataLombaList.forEach(ml => targets.push({ ml, pst }));
      } else if (mode === 'blangko_semua_peserta_per_lomba') {
        const ml = mataLombaList.find(m => m.id === selectedMataLombaId) || mataLombaList[0];
        const psts = pesertaList.filter(p => p.mataLombaId === ml?.id);
        psts.forEach(pst => targets.push({ ml, pst }));
      } else {
        mataLombaList.forEach(ml => {
          const psts = pesertaList.filter(p => p.mataLombaId === ml.id);
          psts.forEach(pst => targets.push({ ml, pst }));
        });
      }

      if (targets.length === 0 && mataLombaList[0]) {
        targets.push({ ml: mataLombaList[0], pst: pesertaList[0] });
      }

      targets.forEach((item, tIdx) => {
        if (tIdx > 0) pdf.addPage();
        let y = drawKopSurat();

        const { ml, pst } = item;
        const sub = includeFilledScores && pst
          ? submissions.find(s => s.pesertaId === pst.id && s.mataLombaId === ml.id && s.status === 'approved')
          : null;

        // Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(`BLANGKO PENILAIAN ${includeFilledScores ? '(HASIL RESMI DEWAN JURI)' : '(FORMAT ISIAN DEWAN JURI)'}`, margin, y);
        pdf.setFontSize(7.5);
        pdf.setTextColor(180, 83, 9);
        pdf.text(`Lomba: ${ml.kode} - ${ml.nama} (${ml.kategori})`, margin, y + 4.2);
        y += 8.5;

        // Peserta info box
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(margin, y, contentWidth, 11, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text('NO DADA:', margin + 4, y + 4);
        pdf.text('NAMA PESERTA:', margin + 45, y + 4);
        pdf.text('ASAL INSTANSI:', margin + 115, y + 4);

        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(pst?.nomorDada || '-', margin + 4, y + 8.5);
        pdf.text(pst?.nama || '-', margin + 45, y + 8.5);
        pdf.text(pst?.asalInstansi || '-', margin + 115, y + 8.5);
        y += 14;

        // Criteria table header function
        const drawBlangkoTableHeader = (curY: number) => {
          pdf.setFillColor(226, 232, 240);
          pdf.setDrawColor(120, 113, 108);
          pdf.setLineWidth(0.3);
          pdf.rect(margin, curY, contentWidth, 7, 'FD');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text('No', margin + 4, curY + 4.8, { align: 'center' });
          pdf.text('Kriteria Penilaian & Indikator', margin + 10, curY + 4.8);
          pdf.text('Tipe', margin + 69, curY + 4.8, { align: 'center' });
          pdf.text('Maks', margin + 84, curY + 4.8, { align: 'center' });
          pdf.text('Kolom Ceklis / Poin Penilaian', margin + 94, curY + 4.8);
          pdf.text('Skor', margin + 174, curY + 4.8, { align: 'center' });
          return curY + 7;
        };

        y = drawBlangkoTableHeader(y);

        ml.kriteriaList.forEach((crit, cIdx) => {
          const critScore = sub?.nilaiKriteria?.find((k: any) => k.kriteriaId === crit.id);
          const scoreText = critScore?.nilai !== undefined ? String(critScore.nilai) : (includeFilledScores ? '-' : '.....');

          // Parameter kolom ceklis dan wrapping
          const checkColStart = margin + 94;
          const checkColEnd = margin + 165;
          const boxSize = 4.4;
          const boxGap = 1.4;
          const boxesPerRow = Math.max(1, Math.floor((checkColEnd - checkColStart + boxGap) / (boxSize + boxGap)));
          const totalBoxRows = crit.tipe === 'checkbox' ? Math.max(1, Math.ceil(crit.nilaiMaksimal / boxesPerRow)) : 1;
          const checkboxBlockHeight = totalBoxRows * (boxSize + boxGap) + 2.5;

          // Parameter kolom teks kriteria (mendukung text-wrapping multi-baris jika panjang)
          const textColWidth = 52;
          const namaLines = pdf.splitTextToSize(crit.nama || '', textColWidth);
          const descLines = crit.deskripsi ? pdf.splitTextToSize(crit.deskripsi, textColWidth) : [];
          const textBlockHeight = (namaLines.length * 3.4) + (descLines.length * 2.6) + 3;

          const rowHeight = Math.max(8.5, checkboxBlockHeight, textBlockHeight);

          // Check if row exceeds page height, trigger pagination cleanly
          if (y + rowHeight > pageHeight - 48) {
            pdf.addPage();
            y = drawKopSurat(12);
            y = drawBlangkoTableHeader(y);
          }

          // Row background & border
          if (cIdx % 2 === 1) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, y, contentWidth, rowHeight, 'F');
          }
          pdf.setDrawColor(203, 213, 225);
          pdf.setLineWidth(0.2);
          pdf.rect(margin, y, contentWidth, rowHeight);

          // No (Centered vertically in row)
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.setTextColor(15, 23, 42);
          pdf.text(String(cIdx + 1), margin + 4, y + (rowHeight / 2) + 1.2, { align: 'center' });

          // Kriteria name & description (wrapped lines, completely shown without truncation)
          let curTextY = y + 3.8;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.setTextColor(15, 23, 42);
          namaLines.forEach((nLine: string) => {
            pdf.text(nLine, margin + 10, curTextY);
            curTextY += 3.3;
          });
          if (descLines.length > 0) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(5.8);
            pdf.setTextColor(100, 116, 139);
            descLines.forEach((dLine: string) => {
              pdf.text(dLine, margin + 10, curTextY);
              curTextY += 2.6;
            });
          }

          // Tipe & Maks (Centered vertically in row)
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6.8);
          pdf.setTextColor(71, 85, 105);
          pdf.text(crit.tipe === 'checkbox' ? 'Ceklis' : 'Angka', margin + 69, y + (rowHeight / 2) + 1.2, { align: 'center' });

          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(180, 83, 9);
          pdf.text(String(crit.nilaiMaksimal), margin + 84, y + (rowHeight / 2) + 1.2, { align: 'center' });

          // Kolom Ceklis / Poin Penilaian: Tampilkan SEMUA ceklis secara lengkap dengan multiple rows jika panjang
          if (crit.tipe === 'checkbox') {
            let curBoxX = checkColStart;
            let curBoxY = y + 2.0;

            for (let num = 1; num <= crit.nilaiMaksimal; num++) {
              if (curBoxX + boxSize > checkColEnd) {
                // Turun ke baris baru secara otomatis (multiple lines / wrapping)
                curBoxX = checkColStart;
                curBoxY += boxSize + boxGap;
              }
              const isChecked = includeFilledScores && critScore?.checkedIndices?.includes(num);

              if (isChecked) {
                pdf.setFillColor(217, 119, 6); // amber-600
                pdf.setDrawColor(180, 83, 9);
                pdf.roundedRect(curBoxX, curBoxY, boxSize, boxSize, 0.7, 0.7, 'FD');
                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(6.2);
                pdf.text('✓', curBoxX + (boxSize / 2), curBoxY + 3.2, { align: 'center' });
              } else {
                pdf.setFillColor(255, 255, 255);
                pdf.setDrawColor(168, 162, 158);
                pdf.roundedRect(curBoxX, curBoxY, boxSize, boxSize, 0.7, 0.7, 'FD');
                pdf.setTextColor(87, 83, 78);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(5.8);
                pdf.text(String(num), curBoxX + (boxSize / 2), curBoxY + 3.1, { align: 'center' });
              }
              curBoxX += boxSize + boxGap;
            }
          } else {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.5);
            pdf.setTextColor(100, 116, 139);
            pdf.text(`[Rentang Nilai: 0 s.d ${crit.nilaiMaksimal}]`, checkColStart, y + (rowHeight / 2) + 1.2);
          }

          // Skor (Centered vertically in row)
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.5);
          pdf.setTextColor(15, 23, 42);
          pdf.text(scoreText, margin + 174, y + (rowHeight / 2) + 1.2, { align: 'center' });

          y += rowHeight;
        });

        // Stopwatch Result & Total Score box: Check pagination before drawing
        if (y > pageHeight - 52) {
          pdf.addPage();
          y = drawKopSurat(12);
        }

        y += 3;
        pdf.setFillColor(254, 243, 199);
        pdf.setDrawColor(251, 191, 36);
        pdf.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(120, 53, 15);
        pdf.text('WAKTU PENGERJAAN (TIE-BREAKER):', margin + 4, y + 4);
        pdf.text('TOTAL SKOR AKHIR:', margin + 115, y + 4);

        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        const waktuTxt = sub ? formatSeconds(sub.waktuPengerjaanDetik) : '...... Menit ...... Detik';
        const totalTxt = sub ? `${sub.totalNilai} Poin` : '....... Poin Bersih';
        pdf.text(waktuTxt, margin + 4, y + 8.5);
        pdf.text(totalTxt, margin + 115, y + 8.5);
        y += 14;

        drawFooterSignatures(y);
      });
    }

    const filename = `S-IMPEL_${mode}_${Date.now()}.pdf`;
    savePdfFile(pdf, filename);
  };

  // Direct Printer Trigger with isolated print iframe + dialog connection
  const handleTriggerPrint = () => {
    soundService.playClick();
    if (!printAreaRef.current) {
      window.print();
      return;
    }

    try {
      // 1. Buat iframe terisolasi untuk memunculkan jendela dialog printer langsung tanpa merusak halaman
      const printIframe = document.createElement('iframe');
      printIframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (iframeDoc) {
        // Capture all loaded stylesheets and font links to ensure 100% fidelity on physical printers
        const documentStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map(el => el.outerHTML)
          .join('\n');

        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Laporan Resmi S-IMPEL DIGITAL (Standar A4)</title>
              ${documentStyles}
              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm 10mm 12mm 10mm;
                }
                * {
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                html, body {
                  font-family: 'Plus Jakarta Sans', Arial, -apple-system, sans-serif;
                  color: #1c1917 !important;
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 4px !important;
                  font-size: 10px;
                  line-height: 1.4;
                }
                .no-print { display: none !important; }
                table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                }
                th, td {
                  border: 1px solid #78716c !important;
                }
                .participant-sheet {
                  min-height: 275mm !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  page-break-after: always !important;
                  break-after: page !important;
                  margin-bottom: 0 !important;
                }
                .participant-sheet:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                .doc-print-footer {
                  margin-top: auto !important;
                  padding-top: 8px !important;
                  border-top: 1px solid #78716c !important;
                }
              </style>
            </head>
            <body class="bg-white text-stone-900">
              ${printAreaRef.current.innerHTML}
            </body>
          </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (iframeErr) {
            console.warn('Iframe print error, falling back to window.print():', iframeErr);
            window.focus();
            window.print();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(printIframe);
              } catch (_) {}
            }, 2000);
          }
        }, 250);
        return;
      }
    } catch (e) {
      console.warn('Iframe print initialization failed, using standard window.print():', e);
    }

    // Direct window fallback
    try {
      window.focus();
      window.print();
    } catch (err) {
      console.error('Window print fallback failed:', err);
    }
  };

  // Cetak Khusus Printer Thermal (Struk POS 58mm / 80mm Standar Kasir & Juri Lapangan)
  const handleTriggerThermalPrint = () => {
    soundService.playClick();
    try {
      const printIframe = document.createElement('iframe');
      printIframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
      document.body.appendChild(printIframe);

      const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();

        let thermalBodyHtml = '';
        if (mode.startsWith('blangko')) {
          const ml = mataLombaList.find(m => m.id === selectedMataLombaId) || mataLombaList[0];
          let psts = selectedPesertaId ? pesertaList.filter(p => p.id === selectedPesertaId) : pesertaList.filter(p => p.mataLombaId === ml?.id);
          if (psts.length === 0) psts = pesertaList.slice(0, 5);

          thermalBodyHtml = psts.map(pst => {
            const sub = includeFilledScores
              ? submissions.find(s => s.pesertaId === pst.id && s.mataLombaId === ml?.id && s.status === 'approved')
              : null;

            return `
              <div class="thermal-ticket">
                <div class="text-center font-bold text-sm">S-IMPEL DIGITAL</div>
                <div class="text-center text-xs">${eventConfig.judulKegiatan}</div>
                <div class="divider"></div>
                <div class="text-center font-bold">SLIP PENILAIAN JURI RESMI</div>
                <div class="row"><span>Mata Lomba:</span><span class="bold">${ml?.nama || '-'}</span></div>
                <div class="row"><span>No Dada:</span><span class="bold">[${pst.nomorDada}]</span></div>
                <div class="row"><span>Nama:</span><span class="bold">${pst.nama}</span></div>
                <div class="row"><span>Instansi:</span><span>${pst.asalInstansi}</span></div>
                <div class="divider"></div>
                <div class="bold text-xs" style="margin-bottom:3px;">RINCIAN NILAI KRITERIA:</div>
                ${ml?.kriteriaList.map((crit, idx) => {
                  const val = sub?.nilaiKriteria?.find((k: any) => k.kriteriaId === crit.id)?.nilai ?? (includeFilledScores ? '-' : '.....');
                  return `<div class="row"><span>${idx + 1}. ${crit.nama.substring(0, 18)}</span><span class="bold font-mono">${val}/${crit.nilaiMaksimal}</span></div>`;
                }).join('')}
                <div class="divider"></div>
                <div class="row"><span>Waktu Selesai:</span><span class="bold font-mono">${sub ? formatSeconds(sub.waktuPengerjaanDetik) : '... dt'}</span></div>
                <div class="row text-sm"><span class="bold">TOTAL NILAI:</span><span class="bold font-mono text-base">${sub ? sub.totalNilai : '....'} Poin</span></div>
                <div class="divider"></div>
                <div class="text-center text-xs">
                  Disahkan Juri: ${sub?.juriNama || users.find(u => u.role === 'juri')?.name || 'Dewan Juri'}<br/>
                  Pakta Integritas: Disetujui ✓
                </div>
                <div class="divider"></div>
                <div class="text-center text-[9px]">
                  Dicetak pada: ${printDate}<br/>
                  *** BUKTI CETAK FISIK RESMI S-IMPEL ***
                </div>
              </div>
            `;
          }).join('<div class="page-break"></div>');
        } else {
          const currentMl = mataLombaList.find(m => m.id === selectedMataLombaId) || mataLombaList[0];
          const ranking = currentMl ? StorageService.calculateRanking(currentMl.id) : [];
          thermalBodyHtml = `
            <div class="thermal-ticket">
              <div class="text-center font-bold text-sm">S-IMPEL DIGITAL</div>
              <div class="text-center text-xs">${eventConfig.judulKegiatan}</div>
              <div class="divider"></div>
              <div class="text-center font-bold">REKAP HASIL AKHIR & PERANGKINGAN</div>
              <div class="text-center font-bold text-xs">${currentMl?.nama || ''}</div>
              <div class="divider"></div>
              ${ranking.map(item => `
                <div class="row">
                  <span><strong>#${item.rank}</strong> [${item.peserta.nomorDada}] ${item.peserta.nama.substring(0, 14)}</span>
                  <span class="bold font-mono">${item.rataRataNilai.toFixed(2)}</span>
                </div>
                <div style="font-size:9px;color:#333;margin-bottom:2px;">
                  ${item.predikatJuara || ''} | ${item.rataRataWaktuDetik > 0 ? formatSeconds(item.rataRataWaktuDetik) : '-'}
                </div>
              `).join('')}
              <div class="divider"></div>
              <div class="text-center text-[9px]">
                Dicetak pada: ${printDate}<br/>
                DOKUMEN RESMI S-IMPEL DIGITAL
              </div>
            </div>
          `;
        }

        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Print Slip Thermal POS (58/80mm)</title>
              <style>
                @page {
                  size: 80mm auto;
                  margin: 2mm 3mm;
                }
                * {
                  box-sizing: border-box;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body {
                  font-family: 'Courier New', Courier, monospace, Arial, sans-serif;
                  font-size: 11px;
                  color: #000;
                  margin: 0;
                  padding: 2mm;
                  width: 74mm;
                  line-height: 1.35;
                }
                .thermal-ticket {
                  padding: 4px 0 16px 0;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold, .bold { font-weight: bold; }
                .font-mono { font-family: monospace; }
                .text-sm { font-size: 13px; }
                .text-xs { font-size: 10px; }
                .row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin: 2px 0;
                }
                .divider {
                  border-top: 1px dashed #000;
                  margin: 6px 0;
                }
                .page-break {
                  page-break-after: always;
                  break-after: page;
                  height: 12px;
                }
              </style>
            </head>
            <body>
              ${thermalBodyHtml}
            </body>
          </html>
        `);
        iframeDoc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (iframeErr) {
            console.warn('Thermal print fallback to standard:', iframeErr);
            window.print();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(printIframe);
              } catch (_) {}
            }, 2000);
          }
        }, 250);
        return;
      }
    } catch (e) {
      console.error('Thermal print error:', e);
      window.print();
    }
  };


  // Helper konversi warna modern (oklch/modern CSS) ke format standar RGB/Hex secara akurat
  const convertColorToValidRgb = (colorStr: string): string => {
    if (!colorStr) return colorStr;
    if (!colorStr.includes('oklch') && !colorStr.includes('color(')) return colorStr;
    try {
      const helperCanvas = document.createElement('canvas');
      helperCanvas.width = 1;
      helperCanvas.height = 1;
      const ctx = helperCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillStyle = colorStr;
        if (ctx.fillStyle && ctx.fillStyle !== '#ffffff') {
          return ctx.fillStyle;
        }
      }
    } catch (_) {}

    // Fallback palet Tailwind resmi yang digunakan pada blangko & laporan
    if (colorStr.includes('amber-50') || colorStr.includes('95.277')) return '#fffbeb';
    if (colorStr.includes('amber-100')) return '#fef3c7';
    if (colorStr.includes('amber-200')) return '#fde68a';
    if (colorStr.includes('amber-300')) return '#fcd34d';
    if (colorStr.includes('amber-500')) return '#f59e0b';
    if (colorStr.includes('amber-600') || colorStr.includes('amber-700')) return '#d97706';
    if (colorStr.includes('amber-800') || colorStr.includes('amber-900')) return '#92400e';
    if (colorStr.includes('stone-50')) return '#fafaf9';
    if (colorStr.includes('stone-100')) return '#f5f5f4';
    if (colorStr.includes('stone-200')) return '#e7e5e4';
    if (colorStr.includes('stone-300')) return '#d6d3d1';
    if (colorStr.includes('stone-400')) return '#a8a29e';
    if (colorStr.includes('stone-500')) return '#78716c';
    if (colorStr.includes('stone-600') || colorStr.includes('stone-700')) return '#44403c';
    if (colorStr.includes('stone-800')) return '#292524';
    if (colorStr.includes('stone-900')) return '#1c1917';
    if (colorStr.includes('stone-950')) return '#0c0a09';
    if (colorStr.includes('emerald')) return '#059669';
    if (colorStr.includes('red')) return '#dc2626';

    return '#1c1917';
  };

  // Unduh Dokumen PDF Standar A4: 100% Identik dengan Tampilan Visual Aplikasi
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) {
      generateVectorPdf();
      return;
    }

    setIsGeneratingPdf(true);
    soundService.playClick();

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; // A4 mm
      const pdfHeight = 297; // A4 mm

      // Sanitize cloned styles to retain 100% visual fidelity without crashing html2canvas
      const sanitizeClonedDoc = (clonedDoc: Document) => {
        // 1. Konversi oklch pada tag style secara presisi (mempertahankan warna asli)
        const styles = clonedDoc.querySelectorAll('style');
        styles.forEach(s => {
          if (s.textContent && (s.textContent.includes('oklch') || s.textContent.includes('color('))) {
            s.textContent = s.textContent.replace(/oklch\([^)]+\)/gi, match => convertColorToValidRgb(match));
          }
        });

        // 2. Terapkan warna RGB standar pada inline styles elemen yang di-clone
        if (printAreaRef.current) {
          const origElements = printAreaRef.current.querySelectorAll('*');
          const cloneElements = clonedDoc.querySelectorAll('*');
          const len = Math.min(origElements.length, cloneElements.length);

          for (let i = 0; i < len; i++) {
            const orig = origElements[i] as HTMLElement;
            const clone = cloneElements[i] as HTMLElement;
            if (!orig || !clone || !orig.style) continue;

            try {
              const comp = window.getComputedStyle(orig);
              if (comp.color && comp.color.includes('oklch')) {
                clone.style.color = convertColorToValidRgb(comp.color);
              }
              if (comp.backgroundColor && comp.backgroundColor.includes('oklch')) {
                clone.style.backgroundColor = convertColorToValidRgb(comp.backgroundColor);
              }
              if (comp.borderColor && comp.borderColor.includes('oklch')) {
                clone.style.borderColor = convertColorToValidRgb(comp.borderColor);
              }
              if (comp.borderTopColor && comp.borderTopColor.includes('oklch')) {
                clone.style.borderTopColor = convertColorToValidRgb(comp.borderTopColor);
              }
              if (comp.borderBottomColor && comp.borderBottomColor.includes('oklch')) {
                clone.style.borderBottomColor = convertColorToValidRgb(comp.borderBottomColor);
              }
            } catch (_) {}
          }
        }

        // 3. Hilangkan bayangan luar agar potongan kertas PDF presisi dan rata
        const clonedTarget = clonedDoc.querySelector('.print-container') as HTMLElement;
        if (clonedTarget) {
          clonedTarget.style.boxShadow = 'none';
          clonedTarget.style.margin = '0';
          clonedTarget.style.borderRadius = '0';
        }

        // 4. Pastikan tabel dan kolom ceklis tidak terpotong (overflow visible & full text wrapping)
        const overflowEls = clonedDoc.querySelectorAll<HTMLElement>('.overflow-x-auto, .participant-sheet, table, td, th');
        overflowEls.forEach(el => {
          el.style.overflow = 'visible';
          el.style.maxWidth = 'none';
          el.style.wordBreak = 'break-word';
        });
      };

      const sheetElements = printAreaRef.current.querySelectorAll<HTMLElement>('.participant-sheet');

      // Helper function to paginate any HTML element onto standard A4 PDF pages with natural cut boundaries
      let pageCount = 0;
      const paginateElementToPdf = async (
        element: HTMLElement,
        isFirstElement: boolean
      ) => {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: sanitizeClonedDoc,
        });

        // A4 page parameters with standard 10mm margins
        const marginX = 10;
        const marginY = 10;
        const availWidthMm = pdfWidth - (marginX * 2); // 190 mm
        const availHeightMm = pdfHeight - (marginY * 2); // 277 mm
        const pageRatio = availHeightMm / availWidthMm; // ~1.45789

        const maxSliceCanvasHeight = Math.floor(canvas.width * pageRatio);

        // If the canvas comfortably fits in 1 page (with a small 5% tolerance for slight overflow)
        if (canvas.height <= maxSliceCanvasHeight * 1.05) {
          if (!isFirstElement || pageCount > 0) {
            pdf.addPage();
          }
          pageCount++;

          const ratio = canvas.height / canvas.width;
          let renderWidthMm = availWidthMm;
          let renderHeightMm = renderWidthMm * ratio;

          if (renderHeightMm > availHeightMm) {
            renderHeightMm = availHeightMm;
            renderWidthMm = renderHeightMm / ratio;
          }

          const posX = marginX + ((availWidthMm - renderWidthMm) / 2);
          const posY = marginY;

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(imgData, 'JPEG', posX, posY, renderWidthMm, renderHeightMm, undefined, 'FAST');
          return;
        }

        // Multi-page requirement: Intelligently slice canvas at natural row or section boundaries
        const containerRect = element.getBoundingClientRect();
        const scaleY = canvas.height / (containerRect.height || 1);

        const breakCandidateNodes = element.querySelectorAll<HTMLElement>(
          'tr, .page-break-inside-avoid, .doc-print-footer, h2, h3, .border-b, div'
        );
        const safeCutOffsets: number[] = [];
        breakCandidateNodes.forEach(node => {
          const rect = node.getBoundingClientRect();
          const bottomOffset = (rect.bottom - containerRect.top) * scaleY;
          if (bottomOffset > 0 && bottomOffset < canvas.height) {
            safeCutOffsets.push(bottomOffset);
          }
        });
        safeCutOffsets.sort((a, b) => a - b);

        let currentY = 0;
        while (currentY < canvas.height) {
          if (!isFirstElement || pageCount > 0) {
            pdf.addPage();
          }
          pageCount++;

          const idealMaxY = currentY + maxSliceCanvasHeight;
          let chosenCutY = Math.min(idealMaxY, canvas.height);

          // Find the best cut point that doesn't split a row
          if (chosenCutY < canvas.height) {
            const minAcceptableY = currentY + (maxSliceCanvasHeight * 0.60);
            const candidates = safeCutOffsets.filter(
              offset => offset >= minAcceptableY && offset <= idealMaxY
            );

            if (candidates.length > 0) {
              chosenCutY = candidates[candidates.length - 1];
            }
          }

          const sliceHeight = chosenCutY - currentY;
          if (sliceHeight <= 0) break;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          if (pageCtx) {
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageCtx.drawImage(
              canvas,
              0,
              currentY,
              canvas.width,
              sliceHeight,
              0,
              0,
              canvas.width,
              sliceHeight
            );

            const sliceData = pageCanvas.toDataURL('image/jpeg', 0.98);
            const sliceRatio = sliceHeight / canvas.width;
            const sliceHeightMm = availWidthMm * sliceRatio;

            pdf.addImage(
              sliceData,
              'JPEG',
              marginX,
              marginY,
              availWidthMm,
              sliceHeightMm,
              undefined,
              'FAST'
            );
          }

          currentY = chosenCutY;
        }
      };

      if (sheetElements.length > 0) {
        // Blangko penilaian: Tiap lembar peserta diproses terpisah secara independen
        for (let i = 0; i < sheetElements.length; i++) {
          await paginateElementToPdf(sheetElements[i], i === 0);
        }
      } else {
        // Dokumen rekapan / master laporan: Diproses dengan pemotongan multi-halaman presisi
        await paginateElementToPdf(printAreaRef.current, true);
      }

      const filename = `S-IMPEL_${mode}_${Date.now()}.pdf`;
      savePdfFile(pdf, filename);
    } catch (err) {
      console.warn('Canvas rendering encountered issue, falling back to direct vector PDF:', err);
      generateVectorPdf();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s (${sec} dt)`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/90 backdrop-blur-md overflow-y-auto flex flex-col print-modal-overlay">
      {/* Top Action Bar (Hidden when printing via .no-print) */}
      <div className="no-print bg-stone-950 text-white px-6 py-3 border-b border-stone-800 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Admin
          </button>
          <div>
            <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pratinjau Cetak & Download PDF Standar A4
            </h2>
            <p className="text-[11px] text-stone-400">
              Format standar A4 simetris dengan kop resmi, tanda tangan juri, stempel waktu, dan pemisahan 1 halaman per peserta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg cursor-pointer transition-all disabled:opacity-50"
            title="Download file PDF standar langsung ke perangkat"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Membuat File PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download File PDF (Otomatis Tersimpan)
              </>
            )}
          </button>

          <button
            onClick={handleTriggerPrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs shadow-lg cursor-pointer transition-all"
            title="Cetak format penuh A4 ke printer fisik"
          >
            <Printer className="w-4 h-4" />
            Cetak Printer Langsung (A4)
          </button>

          <button
            onClick={handleTriggerThermalPrint}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-xl text-xs shadow-lg cursor-pointer transition-all border border-amber-500/40"
            title="Cetak slip/struk ringkas langsung ke printer thermal portabel / POS kasir 58mm atau 80mm"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Cetak Printer Thermal (POS 58/80mm)
          </button>
        </div>
      </div>

      {/* Printable Paper Canvas */}
      <div className="flex-1 p-4 sm:p-8 flex justify-center bg-stone-300 print-canvas-wrapper">
        <div
          ref={printAreaRef}
          className="print-container bg-white text-stone-900 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-2xl rounded-sm text-xs leading-normal flex flex-col justify-between"
          style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}
        >
          {/* Header Kop Surat Resmi */}
          <div>
            <div className="border-b-2 border-stone-900 pb-4 mb-6 text-center relative">
              <div className="text-[10px] font-bold tracking-widest text-amber-800 uppercase mb-1">
                KOMITE RESMI S-IMPEL DIGITAL • SISTEM PENILAIAN DIGITAL
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-stone-950 font-display">
                {eventConfig.judulKegiatan}
              </h1>
              <p className="text-xs text-stone-600 font-medium mt-1">
                {eventConfig.subJudul}
              </p>
            </div>

            {/* Content Switcher based on mode */}
            {/* MODE 1: Rekapan Nilai Per Mata Lomba */}
            {mode === 'rekapan_per_matalomba' && (
              <RenderRekapanPerLomba
                mataLombaId={selectedMataLombaId || mataLombaList[0]?.id}
                mataLombaList={mataLombaList}
                formatSeconds={formatSeconds}
              />
            )}

            {/* MODE 2: Rekapan Nilai Keseluruhan Semua Mata Lomba */}
            {mode === 'rekapan_keseluruhan' && (
              <RenderRekapanKeseluruhan
                mataLombaList={mataLombaList}
                formatSeconds={formatSeconds}
              />
            )}

            {/* MODE 3: Blangko Format Penilaian Kosong / Isi */}
            {(mode === 'blangko_per_peserta_per_lomba' ||
              mode === 'blangko_per_peserta_semua_lomba' ||
              mode === 'blangko_semua_peserta_per_lomba' ||
              mode === 'blangko_semua_peserta_semua_lomba') && (
              <RenderBlangkoPenilaian
                mode={mode}
                selectedMataLombaId={selectedMataLombaId}
                selectedPesertaId={selectedPesertaId}
                includeFilled={includeFilledScores}
                mataLombaList={mataLombaList}
                pesertaList={pesertaList}
                submissions={submissions}
                users={users}
                formatSeconds={formatSeconds}
                printDate={printDate}
                eventConfig={eventConfig}
              />
            )}
          </div>

          {/* Footer & Tanda Tangan Resmi Pengesahan (Hanya untuk Rekapan Lomba, bukan Blangko Individual) */}
          {!mode.startsWith('blangko') && (
            <div className="mt-auto pt-6 border-t border-stone-400 doc-print-footer-container">
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-stone-600 mb-1">Mengetahui,</p>
                  <p className="font-bold text-stone-900">Ketua Panitia Pelaksana</p>
                  <div className="h-16 flex items-center justify-center italic text-stone-400 text-[10px]">
                    (Tanda Tangan & Cap Basah)
                  </div>
                  <p className="font-semibold text-stone-900 underline">
                    {eventConfig.penyelenggara.split('&')[0]?.trim() || 'Panitia S-IMPEL DIGITAL'}
                  </p>
                  <p className="text-[10px] text-stone-500">NIP / ID Panitia Resmi</p>
                </div>

                <div>
                  <p className="text-stone-600 mb-1">Ditetapkan Secara Sah,</p>
                  <p className="font-bold text-stone-900">Koordinator Dewan Juri</p>
                  <div className="h-16 flex items-center justify-center italic text-stone-400 text-[10px]">
                    (Tanda Tangan Digital Tersertifikasi)
                  </div>
                  <p className="font-semibold text-stone-900 underline">
                    {users.find(u => u.role === 'juri')?.name || 'Dewan Juri Nasional'}
                  </p>
                  <p className="text-[10px] text-stone-500">Ketua Tim Penilai</p>
                </div>
              </div>

              {/* Keterangan Tanggal & Waktu Pencetakan Resmi di Posisi Paling Bawah Halaman */}
              <div className="mt-auto pt-4 border-t border-stone-300 text-[10px] text-stone-500 flex flex-wrap justify-between items-center w-full doc-print-footer">
                <div className="font-semibold text-stone-700">
                  <span>S-IMPEL DIGITAL Dokumen Resmi • Keabsahan Terverifikasi</span>
                </div>
                <div className="font-mono text-stone-600">
                  Dicetak pada: <strong>{printDate}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component 1: Rekapan Nilai Per Mata Lomba
const RenderRekapanPerLomba: React.FC<{
  mataLombaId: string;
  mataLombaList: MataLomba[];
  formatSeconds: (s: number) => string;
}> = ({ mataLombaId, mataLombaList, formatSeconds }) => {
  const currentMl = mataLombaList.find(m => m.id === mataLombaId) || mataLombaList[0];
  if (!currentMl) return <div>Data lomba tidak ditemukan.</div>;

  const ranking = StorageService.calculateRanking(currentMl.id);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50/80 p-3 rounded border border-amber-200 flex justify-between items-center">
        <div>
          <h2 className="text-base font-bold text-stone-900 uppercase">
            REKAPITULASI HASIL AKHIR & PERANGKINGAN
          </h2>
          <p className="text-xs text-amber-900 font-semibold">
            Mata Lomba: {currentMl.kode} - {currentMl.nama} ({currentMl.kategori})
          </p>
        </div>
        <div className="text-right text-[11px] text-stone-600">
          Target Durasi: {formatSeconds(currentMl.durasiTargetDetik)}
        </div>
      </div>

      <table className="w-full text-left border-collapse border border-stone-400 text-[11px]">
        <thead>
          <tr className="bg-stone-200 text-stone-900 font-bold">
            <th className="p-2 border border-stone-400 text-center w-10">Peringkat</th>
            <th className="p-2 border border-stone-400 text-center w-16">No Dada</th>
            <th className="p-2 border border-stone-400">Nama Peserta</th>
            <th className="p-2 border border-stone-400">Asal Instansi</th>
            <th className="p-2 border border-stone-400 text-center">Waktu Pengerjaan</th>
            <th className="p-2 border border-stone-400 text-center">Rata-Rata Nilai</th>
            <th className="p-2 border border-stone-400 text-center font-bold">Predikat Kejuaraan</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((item, idx) => (
            <tr
              key={item.peserta.id}
              className={idx < 3 ? 'bg-amber-50/50 font-medium' : idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}
            >
              <td className="p-2 border border-stone-400 text-center font-bold text-stone-800">
                {item.rank}
              </td>
              <td className="p-2 border border-stone-400 text-center font-mono font-bold">
                {item.peserta.nomorDada}
              </td>
              <td className="p-2 border border-stone-400 font-bold text-stone-900">
                {item.peserta.nama}
              </td>
              <td className="p-2 border border-stone-400 text-stone-700">
                {item.peserta.asalInstansi}
              </td>
              <td className="p-2 border border-stone-400 text-center font-mono">
                {item.rataRataWaktuDetik > 0 ? formatSeconds(item.rataRataWaktuDetik) : '-'}
              </td>
              <td className="p-2 border border-stone-400 text-center font-mono font-bold text-stone-900">
                {item.rataRataNilai > 0 ? item.rataRataNilai.toFixed(2) : '0.00'}
              </td>
              <td className="p-2 border border-stone-400 text-center font-bold">
                {item.predikatJuara ? (
                  <span className={item.rank === 1 ? 'text-amber-800' : item.rank <= 3 ? 'text-stone-800' : 'text-stone-600'}>
                    {item.predikatJuara}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
          {ranking.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-stone-500 italic">
                Belum ada data peserta atau penilaian untuk mata lomba ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="text-[10px] text-stone-600 italic bg-stone-100 p-2 rounded border border-stone-200">
        * Catatan Regulasi: Penentuan peringkat didasarkan pada Rata-Rata Nilai Tertinggi. Apabila terdapat nilai yang sama (tie), peserta dengan Waktu Penyelesaian Lomba Tercepat secara otomatis menempati peringkat lebih tinggi.
      </div>
    </div>
  );
};

// Sub-component 2: Rekapan Keseluruhan Semua Mata Lomba
const RenderRekapanKeseluruhan: React.FC<{
  mataLombaList: MataLomba[];
  formatSeconds: (s: number) => string;
}> = ({ mataLombaList, formatSeconds }) => {
  return (
    <div className="space-y-6">
      <div className="bg-stone-100 p-3 rounded border border-stone-300 text-center">
        <h2 className="text-base font-bold text-stone-900 uppercase">
          REKAPITULASI MASTER SELURUH CABANG MATA LOMBA
        </h2>
        <p className="text-xs text-stone-600">
          Daftar Pemenang Resmi Juara 1, 2, 3, dan Harapan
        </p>
      </div>

      {mataLombaList.map(ml => {
        const ranking = StorageService.calculateRanking(ml.id);
        return (
          <div key={ml.id} className="space-y-2 page-break-inside-avoid">
            <div className="flex justify-between items-center bg-stone-200/80 px-3 py-1.5 rounded font-bold text-xs text-stone-900 border border-stone-300">
              <span>{ml.kode} • {ml.nama}</span>
              <span className="font-normal text-[11px] text-stone-600">{ml.kategori}</span>
            </div>

            <table className="w-full text-left border-collapse border border-stone-400 text-[10px]">
              <thead>
                <tr className="bg-stone-100 font-bold">
                  <th className="p-1.5 border border-stone-400 text-center w-8">Rank</th>
                  <th className="p-1.5 border border-stone-400 text-center w-12">No</th>
                  <th className="p-1.5 border border-stone-400">Nama Peserta</th>
                  <th className="p-1.5 border border-stone-400">Asal Instansi</th>
                  <th className="p-1.5 border border-stone-400 text-center">Waktu</th>
                  <th className="p-1.5 border border-stone-400 text-center">Nilai</th>
                  <th className="p-1.5 border border-stone-400 text-center">Status Juara</th>
                </tr>
              </thead>
              <tbody>
                {ranking.slice(0, 6).map(item => (
                  <tr key={item.peserta.id} className={item.rank <= 3 ? 'bg-amber-50/40 font-semibold' : ''}>
                    <td className="p-1.5 border border-stone-400 text-center">{item.rank}</td>
                    <td className="p-1.5 border border-stone-400 text-center font-mono">{item.peserta.nomorDada}</td>
                    <td className="p-1.5 border border-stone-400">{item.peserta.nama}</td>
                    <td className="p-1.5 border border-stone-400 text-stone-600">{item.peserta.asalInstansi}</td>
                    <td className="p-1.5 border border-stone-400 text-center font-mono">{item.rataRataWaktuDetik > 0 ? formatSeconds(item.rataRataWaktuDetik) : '-'}</td>
                    <td className="p-1.5 border border-stone-400 text-center font-mono font-bold">{item.rataRataNilai.toFixed(2)}</td>
                    <td className="p-1.5 border border-stone-400 text-center font-bold text-amber-900">{item.predikatJuara || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

// Sub-component 3: Blangko Format Penilaian Ceklis Kosong / Isi
const RenderBlangkoPenilaian: React.FC<{
  mode: PrintModeType;
  selectedMataLombaId?: string;
  selectedPesertaId?: string;
  includeFilled: boolean;
  mataLombaList: MataLomba[];
  pesertaList: Peserta[];
  submissions: any[];
  users: any[];
  formatSeconds: (s: number) => string;
  printDate?: string;
  eventConfig?: EventConfig;
}> = ({
  mode,
  selectedMataLombaId,
  selectedPesertaId,
  includeFilled,
  mataLombaList,
  pesertaList,
  submissions,
  users,
  formatSeconds,
  printDate,
  eventConfig,
}) => {
  // Determine targets to print
  let targets: { ml: MataLomba; pst?: Peserta }[] = [];

  if (mode === 'blangko_per_peserta_per_lomba') {
    const ml = mataLombaList.find(m => m.id === selectedMataLombaId) || mataLombaList[0];
    const pst = pesertaList.find(p => p.id === selectedPesertaId) || pesertaList.find(p => p.mataLombaId === ml.id);
    if (ml && pst) targets.push({ ml, pst });
  } else if (mode === 'blangko_per_peserta_semua_lomba') {
    const pst = pesertaList.find(p => p.id === selectedPesertaId) || pesertaList[0];
    mataLombaList.forEach(ml => {
      targets.push({ ml, pst });
    });
  } else if (mode === 'blangko_semua_peserta_per_lomba') {
    const ml = mataLombaList.find(m => m.id === selectedMataLombaId) || mataLombaList[0];
    const psts = pesertaList.filter(p => p.mataLombaId === ml?.id);
    psts.forEach(pst => {
      targets.push({ ml, pst });
    });
  } else {
    // semua peserta semua lomba
    mataLombaList.forEach(ml => {
      const psts = pesertaList.filter(p => p.mataLombaId === ml.id);
      psts.forEach(pst => {
        targets.push({ ml, pst });
      });
    });
  }

  if (targets.length === 0) {
    return <div className="p-4 text-center text-stone-500">Tidak ada data blangko untuk kriteria yang dipilih.</div>;
  }

  return (
    <div className="space-y-8">
      {targets.map((item, index) => {
        const { ml, pst } = item;
        const sub = includeFilled && pst
          ? submissions.find(s => s.pesertaId === pst.id && s.mataLombaId === ml.id && s.status === 'approved')
          : null;

        return (
          <div
            key={`${ml.id}_${pst?.id || 'none'}_${index}`}
            className="participant-sheet page-break-inside-avoid border border-stone-400 p-6 rounded-lg bg-white space-y-4 shadow-sm flex flex-col justify-between min-h-[275mm]"
            style={{ pageBreakAfter: 'always', breakAfter: 'page', minHeight: '275mm' }}
          >
            {/* Blangko Header */}
            <div className="border-b-2 border-stone-800 pb-2.5 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                  S-IMPEL DIGITAL • LEMBAR PENILAIAN RESMI
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-950 uppercase mt-0.5">
                  BLANGKO PENILAIAN {includeFilled ? '(HASIL RESMI DEWAN JURI)' : '(FORMAT ISIAN DEWAN JURI)'}
                </h3>
                <div className="text-xs text-stone-800 font-bold mt-0.5">
                  Mata Lomba: {ml.kode} - {ml.nama} ({ml.kategori})
                </div>
              </div>
              <div className="text-right text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div>Durasi Lomba: <strong>{ml.durasiMaksimalMenit} Menit</strong></div>
                <div className="text-[10px] text-amber-700 font-semibold">*Tie-Breaker Waktu Pengerjaan</div>
              </div>
            </div>

            {/* Peserta Info Strip */}
            {pst && (
              <div className="bg-stone-50 border border-stone-300 p-3 rounded-lg text-xs grid grid-cols-3 gap-2">
                <div>
                  <span className="text-stone-500 text-[10px] block">NOMOR DADA:</span>
                  <strong className="text-sm font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-300 inline-block">{pst.nomorDada}</strong>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">NAMA PESERTA:</span>
                  <strong className="text-xs font-bold text-stone-900">{pst.nama}</strong>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">ASAL INSTANSI:</span>
                  <strong className="text-xs text-stone-800">{pst.asalInstansi}</strong>
                </div>
              </div>
            )}

            {/* Kriteria Table with Widened Checklist Columns & Professional Borders */}
            <div className="w-full overflow-visible">
              <table className="w-full table-fixed text-left border-collapse border-2 border-stone-500 text-[11px]">
                <thead>
                  <tr className="bg-stone-200/90 text-stone-900 font-bold border-b-2 border-stone-500 text-xs">
                    <th className="p-2 border border-stone-400 text-center w-[5%] font-extrabold">No</th>
                    <th className="p-2 border border-stone-400 w-[24%] font-extrabold break-words">Kriteria Penilaian & Indikator</th>
                    <th className="p-2 border border-stone-400 text-center w-[8%] font-extrabold">Tipe</th>
                    <th className="p-2 border border-stone-400 text-center w-[7%] font-extrabold">Maks</th>
                    <th className="p-2 border border-stone-400 text-left w-[48%] pl-3 font-extrabold break-words">Kolom Ceklis / Poin Penilaian</th>
                    <th className="p-2 border border-stone-400 text-center w-[8%] font-extrabold">Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {ml.kriteriaList.map((crit, cIdx) => {
                    const critScore = sub?.nilaiKriteria?.find((k: any) => k.kriteriaId === crit.id);
                    const filledVal = critScore?.nilai ?? '';

                    return (
                      <tr key={crit.id} className={`border-b border-stone-300 page-break-inside-avoid ${cIdx % 2 === 1 ? 'bg-stone-50/40' : 'bg-white'}`}>
                        <td className="p-2 border border-stone-400 text-center font-bold text-stone-800 align-middle">{cIdx + 1}</td>
                        <td className="p-2 border border-stone-400 align-middle break-words">
                          <div className="font-bold text-stone-900 text-xs leading-snug break-words whitespace-normal">{crit.nama}</div>
                          {crit.deskripsi && (
                            <div className="text-[10px] text-stone-500 mt-0.5 leading-snug break-words whitespace-normal">{crit.deskripsi}</div>
                          )}
                        </td>
                        <td className="p-2 border border-stone-400 text-center capitalize font-medium text-stone-700 align-middle">
                          {crit.tipe === 'checkbox' ? 'Ceklis' : 'Angka'}
                        </td>
                        <td className="p-2 border border-stone-400 text-center font-bold font-mono text-amber-900 align-middle">
                          {crit.nilaiMaksimal}
                        </td>
                        
                        {/* Dynamic checklist column: Left aligned, widened, spacious vertical wrapping */}
                        <td className="p-2 pl-3 border border-stone-400 text-left align-middle break-words">
                          {crit.tipe === 'checkbox' ? (
                            <div className="flex flex-wrap gap-1.5 items-center justify-start text-left w-full py-1">
                              {Array.from({ length: crit.nilaiMaksimal }, (_, i) => i + 1).map(num => {
                                const isChecked = includeFilled && critScore?.checkedIndices?.includes(num);
                                return (
                                  <div
                                    key={num}
                                    className={`w-6 h-6 sm:w-7 sm:h-7 min-w-[24px] rounded border text-[11px] sm:text-xs flex items-center justify-center font-mono font-bold transition-all shrink-0 select-none ${
                                      isChecked
                                        ? 'bg-amber-600 text-white border-amber-700 shadow-sm font-black'
                                        : 'bg-white border-stone-400 text-stone-700 font-semibold'
                                    }`}
                                    title={`Kolom Poin ${num}`}
                                  >
                                    {isChecked ? '✓' : num}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="border border-dashed border-stone-400 bg-stone-50/80 px-3 py-1.5 rounded text-[10px] flex items-center justify-between w-full max-w-sm">
                              <span className="text-stone-600">Rentang Nilai: 0 s.d {crit.nilaiMaksimal}</span>
                              <span className="font-mono font-bold text-stone-800">
                                {filledVal !== '' ? `Skor Juri: ${filledVal}` : '[ Isian Juri: ............ ]'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="p-2 border border-stone-400 text-center font-extrabold font-mono text-sm text-stone-900 bg-stone-50/30 align-middle">
                          {filledVal !== '' ? filledVal : '.....'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pelanggaran & Stopwatch Result */}
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-300 text-xs grid grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-stone-800 block mb-0.5">Pencatatan Waktu Pengerjaan Peserta:</span>
                <div className="font-mono text-stone-900 font-bold">
                  {sub ? formatSeconds(sub.waktuPengerjaanDetik) : '...... Menit ...... Detik (Waktu Aktual)'}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  *Digunakan sebagai penentu kejuaraan jika total nilai sama.
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-stone-800 block mb-0.5">Total Nilai Akhir (Setelah Penalti):</span>
                <div className="font-mono text-base font-extrabold text-amber-900">
                  {sub ? `${sub.totalNilai} Poin` : '....... Poin Bersih'}
                </div>
              </div>
            </div>

            {/* Digital Signature & Pact Status if filled */}
            {sub && sub.tandaTanganUrl ? (
              <div className="flex items-center justify-between text-xs text-stone-700 bg-amber-50/80 p-3 rounded-lg border border-amber-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span>Disahkan oleh Juri: <strong>{sub.juriNama}</strong></span>
                    <div className="text-[10px] text-emerald-700">Pakta Integritas telah disetujui & diverifikasi</div>
                  </div>
                </div>
                <img
                  src={sub.tandaTanganUrl}
                  alt="Tanda Tangan Juri"
                  className="h-10 max-w-[120px] object-contain border border-stone-300 bg-white rounded p-1"
                />
              </div>
            ) : (
              <div className="pt-2 border-t border-stone-300 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-stone-600">Catatan Khusus Juri:</p>
                  <div className="h-12 border-b border-dashed border-stone-400 mt-1"></div>
                </div>
                <div>
                  <p className="text-stone-600">Tanda Tangan Dewan Juri Penilai:</p>
                  <div className="h-12 border-b border-dashed border-stone-400 mt-1"></div>
                  <p className="text-[10px] text-stone-500 mt-1">( Nama Terang & Tanda Tangan )</p>
                </div>
              </div>
            )}

            {/* Footer Informasi Dokumen Resmi di Posisi Paling Bawah Halaman */}
            <div className="mt-auto pt-3 border-t border-stone-300 text-[10px] text-stone-500 flex flex-wrap justify-between items-center w-full doc-print-footer">
              <span className="font-semibold text-stone-700">
                S-IMPEL DIGITAL Dokumen Resmi • Keabsahan Terverifikasi
              </span>
              <div className="flex items-center gap-2 font-mono text-stone-600 text-[9px]">
                <span>Hal. Peserta: <strong>{pst?.nomorDada || '-'}</strong></span>
                <span>•</span>
                <span>Dicetak pada: <strong>{printDate}</strong></span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
