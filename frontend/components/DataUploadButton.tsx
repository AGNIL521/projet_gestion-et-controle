'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface DataUploadButtonProps {
  onUploadSuccess: () => void;
  isLoading: boolean;
}

const DataUploadButton: React.FC<DataUploadButtonProps> = ({ onUploadSuccess, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
        setStatus('error');
        setMessage('Please upload a valid CSV file.');
        return;
    }

    setIsUploading(true);
    setStatus('idle');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`Success! ${data.records_processed} records loaded.`);
        onUploadSuccess();
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed.');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('Network error. Is the backend running?');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || isUploading}
        className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200
            ${status === 'error' ? 'bg-red-50 border-red-200 text-red-700' : ''}
            ${status === 'success' ? 'bg-green-50 border-green-200 text-green-700' : ''}
            ${status === 'idle' ? 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700' : ''}
        `}
      >
        {isUploading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
        ) : status === 'success' ? (
            <CheckCircle className="w-4 h-4" />
        ) : status === 'error' ? (
            <AlertCircle className="w-4 h-4" />
        ) : (
            <Upload className="w-4 h-4" />
        )}
        
        <span className="text-sm font-medium">
            {isUploading ? 'Uploading...' : status === 'idle' ? 'Import CSV' : message}
        </span>
      </button>
    </div>
  );
};

export default DataUploadButton;
