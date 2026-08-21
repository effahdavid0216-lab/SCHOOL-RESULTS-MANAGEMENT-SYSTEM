import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Check,
  X,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  Crop,
  Layers,
  Sparkles
} from 'lucide-react';
import { saveStorageFileRecord } from '../lib/services';

export interface ImageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  currentImageUrl?: string;
  schoolId: string;
  entityType: 'STUDENT' | 'TEACHER' | 'SCHOOL_LOGO' | 'DOCUMENT' | 'SIGNATURE' | 'HOUSE';
  entityId: string;
  fileCategory?: string;
  aspectRatio?: 'SQUARE' | 'LANDSCAPE' | 'FREE';
  onImageSaved: (savedUrl: string) => void;
  onImageDeleted?: () => void;
}

export const ImageManagerModal: React.FC<ImageManagerModalProps> = ({
  isOpen,
  onClose,
  title = 'Image Management Studio',
  currentImageUrl,
  schoolId,
  entityType,
  entityId,
  fileCategory = 'PASSPORT_PHOTO',
  aspectRatio = 'SQUARE',
  onImageSaved,
  onImageDeleted
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '');
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentImageUrl || '');
      setZoom(1);
      setRotation(0);
      setErrorMessage(null);
      setSelectedFile(null);
      setIsCameraActive(false);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, currentImageUrl]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera capture is not supported on this browser or device.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to access device camera.');
      setIsCameraActive(false);
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startX = ((video.videoWidth || 640) - size) / 2;
    const startY = ((video.videoHeight || 640) - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setPreviewUrl(dataUrl);
    setZoom(1);
    setRotation(0);
    stopCamera();
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB limit. Please select a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);
        setZoom(1);
        setRotation(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const rotateClockwise = () => setRotation((prev) => (prev + 90) % 360);
  const rotateCounterClockwise = () => setRotation((prev) => (prev - 90 + 360) % 360);

  const applyCropAndCompression = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!previewUrl) return reject(new Error('No image loaded'));
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetDimension = aspectRatio === 'SQUARE' ? 400 : 600;
        canvas.width = targetDimension;
        canvas.height = aspectRatio === 'SQUARE' ? 400 : 400;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        const w = targetDimension;
        const h = (targetDimension * img.height) / img.width;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = previewUrl;
    });
  };

  const handleSaveImage = async () => {
    if (!previewUrl) {
      setErrorMessage('Please upload or capture a photo first.');
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    try {
      setProgress(50);
      const processedUrl = await applyCropAndCompression();
      setProgress(80);

      // Record file metadata in common storage abstraction service
      await saveStorageFileRecord({
        schoolId,
        storageProvider: 'LOCAL_BLOB',
        fileId: `img_${entityType}_${entityId}_${Date.now()}`,
        fileUrl: processedUrl,
        fileName: selectedFile?.name || `${entityType.toLowerCase()}_photo.jpg`,
        fileSize: Math.round(processedUrl.length * 0.75),
        mimeType: 'image/jpeg',
        entityType,
        entityId,
        fileCategory
      });

      setProgress(100);
      onImageSaved(processedUrl);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Image processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteImage = () => {
    if (confirm('Are you sure you want to remove this photo?')) {
      setPreviewUrl('');
      setSelectedFile(null);
      if (onImageDeleted) onImageDeleted();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f111a] border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161925]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">
                Crop, rotate, zoom, compress, and sync image across system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Canvas & Controls */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Active Camera View */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700 aspect-square max-h-72 mx-auto flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
                <button
                  onClick={capturePhotoFromCamera}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" /> Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Preview Canvas */
            <div className="space-y-4">
              {previewUrl ? (
                <div className="relative mx-auto w-64 h-64 rounded-2xl overflow-hidden bg-slate-950 border-2 border-dashed border-blue-500/40 flex items-center justify-center group shadow-inner">
                  <div
                    className="w-full h-full transition-transform duration-100 flex items-center justify-center"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Crop Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Circular guideline overlay for passport photo */}
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full pointer-events-none" />
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-800 hover:border-slate-700 bg-[#161925]/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">
                      Click to upload or drag & drop photo
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports JPG, PNG, WEBP up to 8MB
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Choose File / Open Camera */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  {previewUrl ? 'Replace Photo' : 'Upload File'}
                </button>

                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2 bg-[#161925] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  Use Camera
                </button>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>

              {/* Interactive Crop / Rotate / Zoom Controls */}
              {previewUrl && (
                <div className="bg-[#161925] p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Crop className="w-3.5 h-3.5 text-blue-400" /> Adjust & Optimize
                    </span>
                    <button
                      onClick={() => {
                        setZoom(1);
                        setRotation(0);
                      }}
                      className="text-[10px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ZoomIn className="w-3 h-3" /> Zoom Scale
                      </span>
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Rotate Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">Orientation</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={rotateCounterClockwise}
                        className="px-2.5 py-1.5 bg-[#0f111a] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> -90°
                      </button>
                      <button
                        type="button"
                        onClick={rotateClockwise}
                        className="px-2.5 py-1.5 bg-[#0f111a] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" /> +90°
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-blue-400">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compressing & Saving...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#161925]">
          <span className="text-[10px] text-slate-500">
            Auto-compressed & normalized for terminal reports
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || !previewUrl}
              onClick={handleSaveImage}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Apply & Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
