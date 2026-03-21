import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScanSuccess, onClose }: ScannerProps) {
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Avoid double initialization in Strict Mode
    let isMounted = true;
    
    // We construct the scanner right away so we can store its reference
    const scanner = new Html5Qrcode('reader', {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A
      ]
    });
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 }
          },
          (decodedText) => {
            // On success, stop scanning and pass value
            if (scanner.isScanning) {
              scanner.stop().then(() => {
                if (isMounted) onScanSuccess(decodedText);
              }).catch(console.error);
            }
          },
          (_errorMessage) => {
            // Ignore ongoing scan frame failures
          }
        );
      } catch (err: any) {
        if (isMounted) {
          setError('No se pudo acceder a la cámara. Revisa los permisos o intenta desde un celular/tablet.');
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
      scanner.clear();
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center py-12 px-4 animate-in fade-in duration-300">
      <div className="w-full flex justify-between items-center mb-6 max-w-md">
        <h2 className="text-white text-xl font-bold tracking-tight">Escanea el Código</h2>
        <button 
          onClick={onClose}
          className="text-slate-300 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden relative shadow-2xl">
        <div id="reader" className="w-full h-[400px] sm:h-[300px] object-cover bg-black" />
      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl max-w-md text-sm text-center">
          {error}
        </div>
      )}
      
      <p className="text-slate-400 text-sm mt-8 max-w-xs text-center leading-relaxed">
        Apunta tu cámara al código de barras del producto. Detectará automáticamente EAN-13, EAN-8 o UPC.
      </p>
    </div>
  );
}
