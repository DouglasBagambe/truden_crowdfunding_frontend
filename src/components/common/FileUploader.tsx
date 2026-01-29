'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploaderProps {
  label: string;
  onUpload: (files: { filename: string, content: string }[]) => void;
  maxFiles?: number;
  accept?: string;
}

export function FileUploader({ label, onUpload, maxFiles = 3, accept = ".pdf,.jpg,.png" }: FileUploaderProps) {
  const [files, setFiles] = useState<{ filename: string, size: number, progress: number }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.slice(0, maxFiles - files.length);
    const uploadedData: { filename: string, content: string }[] = [];

    for (const file of validFiles) {
        // Mocking upload progress
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            uploadedData.push({ filename: file.name, content: base64 });
            
            if (uploadedData.length === validFiles.length) {
                onUpload(uploadedData);
            }
        };
        reader.readAsDataURL(file);

        setFiles(prev => [...prev, { filename: file.name, size: file.size, progress: 100 }]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    // In a real app, you'd also notify the parent to remove that specific file content
  };

  return (
    <div className="space-y-4">
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-[2rem] p-10 transition-all ${isDragging ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-slate-700'}`}
      >
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple 
            accept={accept}
        />
        
        <div className="flex flex-col items-center gap-4 text-center">
            <div className={`p-4 rounded-2xl transition-all ${isDragging ? 'bg-indigo-600 text-white animate-bounce' : 'bg-gray-50 dark:bg-slate-800 text-gray-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600'}`}>
                <Upload className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-bold dark:text-white">{label}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Drag & drop or click to browse (Max {maxFiles} files)</p>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
                {files.map((file, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={i} 
                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold dark:text-white truncate max-w-[200px]">{file.filename}</p>
                                <p className="text-[10px] text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-gray-400 hover:text-rose-500 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
