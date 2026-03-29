import React, { useRef, useState } from 'react';
import { Camera, User, Loader2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const AvatarUpload: React.FC = () => {
  const { user, userData, updateUserData } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const currentAvatar = userData?.avatarUrl || user.photoURL;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert("Por favor selecciona una imagen válida.");
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert("La imagen no puede pesar más de 2MB.");
        return;
    }

    try {
      setUploading(true);
      const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {
          // Progreso (opcional, por ahora mostramos un spinner)
        },
        (error) => {
          console.error("Error subiendo el avatar:", error);
          alert("Hubo un error subiendo la imagen.");
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await updateUserData({ avatarUrl: downloadURL });
          } catch (urlError) {
            console.error("Error obteniendo la URL:", urlError);
            alert("No se pudo guardar el avatar.");
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (error) {
       console.error("Upload process error", error);
       alert("Hubo un error inicializando la subida.");
       setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect}
      />
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`w-28 h-28 bg-slate-100 rounded-[36px] flex items-center justify-center text-slate-400 overflow-hidden ring-8 ring-white shadow-2xl transition-transform ${uploading ? 'opacity-70' : 'cursor-pointer group-hover:scale-105'}`}
      >
        {uploading ? (
           <Loader2 size={32} className="animate-spin text-primary-green" />
        ) : currentAvatar ? (
          <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User size={48} />
        )}
      </div>
      
      {!uploading && (
        <button 
           onClick={() => fileInputRef.current?.click()}
           className="absolute bottom-1 -right-1 bg-primary-green text-white p-2.5 rounded-2xl shadow-lg border-4 border-white active:scale-90 transition-all hover:bg-green-500"
        >
          <Camera size={18} />
        </button>
      )}
    </div>
  );
}

export default AvatarUpload;
