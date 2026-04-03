import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Zap, Scan, Info } from 'lucide-react';

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
            fps: 15, // Faster detection
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return { width: minEdge * 0.8, height: minEdge * 0.4 }; // Wide box for barcodes
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Success: Immediate feedback
            if (navigator.vibrate) navigator.vibrate(50);
            
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center animate-in fade-in duration-500 overflow-hidden">
      
      {/* Background Camera Layer */}
      <div className="absolute inset-0 z-0">
        <div id="reader" className="w-full h-full object-cover" />
      </div>

      {/* Translucent Overlays for focus */}
      <div className="absolute inset-0 z-10 flex flex-col">
        <div className="flex-1 bg-black/60" />
        <div className="h-[200px] flex">
          <div className="flex-1 bg-black/60" />
          <div className="w-[300px] sm:w-[350px] relative">
             {/* The scanning window */}
             <div className="absolute inset-0 border-2 border-primary/40 rounded-3xl" />
             
             {/* Corner Markers */}
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl -mt-1 -ml-1" />
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl -mt-1 -mr-1" />
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl -mb-1 -ml-1" />
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl -mb-1 -mr-1" />
             
             {/* Scanning Line Animation */}
             <div className="absolute top-0 left-1 right-1 h-0.5 bg-primary/80 shadow-[0_0_15px_rgba(34,197,94,0.8)] animate-scanner-line" />
          </div>
          <div className="flex-1 bg-black/60" />
        </div>
        <div className="flex-1 bg-black/60 flex flex-col items-center justify-start pt-12 px-6">
           <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 max-w-xs flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                 <Scan size={18} />
              </div>
              <p className="text-white text-[13px] font-bold leading-tight">
                Centra el código de barras en el visor para detectar automáticamente.
              </p>
           </div>
           
           <p className="text-slate-400 text-xs mt-6 uppercase tracking-widest font-black opacity-60">
              EAN-13 / EAN-8 / UPC
           </p>
        </div>
      </div>

      {/* Top Navigation Bar (z-index 20) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pt-12 sm:pt-8">
        <div className="flex flex-col">
          <h2 className="text-white text-xl font-black tracking-tight">Escáner Pro</h2>
          <span className="text-primary text-[10px] font-black uppercase tracking-widest mt-0.5 flex items-center gap-1">
             <Zap size={10} className="fill-current" /> Modo Alta Precisión
          </span>
        </div>
        <button 
          onClick={onClose}
          className="text-white p-3 rounded-2xl bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all border border-white/10 active:scale-90"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="absolute bottom-32 z-30 mx-4 p-4 bg-red-500/90 backdrop-blur-md border border-red-400/30 text-white rounded-2xl max-w-md text-[13px] font-bold text-center flex items-center gap-3 animate-bounce shadow-2xl">
          <Info size={20} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
