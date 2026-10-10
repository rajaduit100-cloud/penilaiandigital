import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, CheckSquare, Square, PenTool, ShieldCheck } from 'lucide-react';

interface DigitalSignaturePadProps {
  juriName: string;
  onSignatureChange: (dataUrl: string, pactAgreed: boolean) => void;
  required?: boolean;
}

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  juriName,
  onSignatureChange,
  required = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [pactAgreed, setPactAgreed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions according to container width
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    // Initial styling
    ctx.strokeStyle = '#78350f'; // Dark amber / warm brown
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl, pactAgreed);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange('', pactAgreed);
  };

  const handlePactToggle = () => {
    const newPact = !pactAgreed;
    setPactAgreed(newPact);
    const canvas = canvasRef.current;
    const dataUrl = canvas && hasSignature ? canvas.toDataURL('image/png') : '';
    onSignatureChange(dataUrl, newPact);
  };

  return (
    <div className="bg-stone-50 border border-amber-300/80 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-amber-700" />
          <h4 className="font-semibold text-sm text-stone-900 tracking-wide">
            Tanda Tangan Digital & Pakta Integritas Juri
          </h4>
        </div>
        <button
          type="button"
          onClick={clearCanvas}
          className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-red-700 bg-white border border-stone-200 px-2 py-1 rounded hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Ulangi
        </button>
      </div>

      {/* Canvas Area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-32 bg-white rounded-lg border-2 border-dashed border-amber-300 touch-none cursor-crosshair shadow-inner"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-stone-400 text-xs italic">
            Goreskan tanda tangan digital Anda di sini menggunakan mouse atau jari/stylus
          </div>
        )}
        <div className="text-[11px] text-stone-500 mt-1 flex justify-between">
          <span>Atas Nama: <strong className="text-stone-800">{juriName}</strong></span>
          <span className={hasSignature ? "text-emerald-700 font-medium" : "text-amber-700"}>
            {hasSignature ? "✓ Tanda tangan terekam" : "Belum ditandatangani"}
          </span>
        </div>
      </div>

      {/* Pakta Integritas Box */}
      <div 
        onClick={handlePactToggle}
        className={`p-3 rounded-lg border cursor-pointer transition-all ${
          pactAgreed
            ? 'bg-amber-100/60 border-amber-500/80 text-stone-900'
            : 'bg-white border-stone-200 text-stone-700 hover:border-amber-400'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            className="mt-0.5 text-amber-700 flex-shrink-0 focus:outline-none"
          >
            {pactAgreed ? (
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            ) : (
              <Square className="w-5 h-5 text-stone-400" />
            )}
          </button>
          <div className="text-xs leading-relaxed select-none">
            <div className="flex items-center gap-1 font-bold text-stone-900 mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Pakta Integritas & Pernyataan Resmi
            </div>
            <p className="text-stone-700">
              Saya menyatakan dengan sesungguhnya bahwa seluruh skor penilaian dan pencatatan waktu yang saya berikan adalah objektif, independen, jujur, dan berpedoman pada petunjuk teknis perlombaan tanpa dipengaruhi oleh pihak manapun.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
