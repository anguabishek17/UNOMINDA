'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Cpu,
  GitFork,
  LayoutDashboard,
  ShieldAlert,
  ArrowLeft,
  X,
  FileCode,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadInstructionPage() {
  const { apiUrl, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('OPERATING');
  const [priority, setPriority] = useState('HIGH');
  const [version, setVersion] = useState('1.0');
  const [departmentId, setDepartmentId] = useState('');
  const [lineId, setLineId] = useState('');
  const [machineId, setMachineId] = useState('');

  // Dropdown Metadata options
  const [departments, setDepartments] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileCategory, setFileCategory] = useState<'image' | 'pdf' | 'video' | 'docx' | null>(null);

  // Upload Progress & Notification
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchMetadata = async () => {
    setLoadingMetadata(true);
    try {
      const res = await fetch(`${apiUrl}/auth/metadata`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.flatMap((p: any) => p.departments));
        setLines(data.flatMap((p: any) => p.departments.flatMap((d: any) => d.lines)));
        setMachines(data.flatMap((p: any) => p.departments.flatMap((d: any) => d.lines.flatMap((l: any) => l.machines))));
      } else {
        throw new Error();
      }
    } catch {
      // Fallback local defaults
      setDepartments([
        { id: 'dept-1', name: 'Machine Shop (CNC)' },
        { id: 'dept-2', name: 'Press Shop (Stamping)' }
      ]);
      setLines([
        { id: 'line-1', name: 'CNC Milling Line A', departmentId: 'dept-1' },
        { id: 'line-2', name: 'Heavy Press Line B', departmentId: 'dept-2' }
      ]);
      setMachines([
        { id: 'm-1', name: 'Hyundai Wia F400 CNC Milling', code: 'CNC-01', productionLineId: 'line-1' },
        { id: 'm-2', name: 'AIDA 400T Hydraulic Press', code: 'PRESS-01', productionLineId: 'line-2' }
      ]);
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Filter line options based on selected Department
  const filteredLines = lines.filter(l => !departmentId || l.departmentId === departmentId);

  // Filter machine options based on selected Line
  const filteredMachines = machines.filter(m => !lineId || m.productionLineId === lineId);

  // Handle file selection
  const processFile = (selectedFile: File) => {
    setError(null);
    setSuccess(null);
    const mime = selectedFile.type;
    let category: 'image' | 'pdf' | 'video' | 'docx' | null = null;

    if (mime.startsWith('image/')) {
      category = 'image';
    } else if (mime === 'application/pdf') {
      category = 'pdf';
    } else if (mime.startsWith('video/')) {
      category = 'video';
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword' ||
      selectedFile.name.endsWith('.docx') ||
      selectedFile.name.endsWith('.doc')
    ) {
      category = 'docx';
    } else {
      setError('Unsupported file type. Please upload a valid Image, PDF, DOCX, or Video file.');
      return;
    }

    setFile(selectedFile);
    setFileCategory(category);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Only create object URL for previewable formats
    if (category === 'image' || category === 'video' || category === 'pdf') {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileCategory(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title) {
      setError('Instruction Title is required.');
      return;
    }
    if (!file) {
      setError('Please select or drop an instruction file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('instructionType', type);
    formData.append('priority', priority);
    formData.append('version', version);
    if (machineId) formData.append('machineId', machineId);
    if (lineId) formData.append('productionLineId', lineId);
    if (departmentId) formData.append('departmentId', departmentId);
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiUrl}/instructions/upload`, true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentage);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200 || xhr.status === 201) {
        setSuccess('Instruction uploaded and published successfully!');
        resetForm();
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setError(res.error || 'Failed to publish instruction.');
        } catch {
          setError('Failed to publish instruction due to server error.');
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setError('A network error occurred while uploading. Please check connections.');
    };

    xhr.send(formData);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('OPERATING');
    setPriority('HIGH');
    setVersion('1.0');
    setDepartmentId('');
    setLineId('');
    setMachineId('');
    removeFile();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back to list and header */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push('/instructions')}
          className="flex items-center gap-1.5 text-xxs font-bold text-slate-400 hover:text-cyan-400 cursor-pointer w-fit transition-colors duration-300"
        >
          <ArrowLeft size={14} />
          <span>Back to SOP Instructions list</span>
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Upload Instruction</h1>
            <p className="text-sm text-slate-400">
              Create a new SOP instruction, assign scope targets, and attach multimedia files
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creation Form Column */}
        <div className="md:col-span-2 glass-panel p-6 border-none">
          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Instruction Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CNC Spindle Maintenance Checklist"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-655"
              />
            </div>

            <div>
              <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide step-by-step operating steps or checklist details..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-655"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                >
                  <option value="OPERATING">Operating SOP</option>
                  <option value="SAFETY">Safety Protocol</option>
                  <option value="EMERGENCY">Emergency drill</option>
                  <option value="MAINTENANCE">Maintenance guide</option>
                  <option value="TRAINING">Training Manual</option>
                  <option value="QUALITY">Quality Checklist</option>
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3.5 space-y-4">
              <h4 className="text-xxs font-extrabold text-cyan-400 uppercase tracking-wider">Scope Assignment (Target)</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setLineId('');
                      setMachineId('');
                    }}
                    className="w-full bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Machine Line</label>
                  <select
                    value={lineId}
                    onChange={(e) => {
                      setLineId(e.target.value);
                      setMachineId('');
                    }}
                    className="w-full bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                  >
                    <option value="">All Lines</option>
                    {filteredLines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Machine</label>
                  <select
                    value={machineId}
                    onChange={(e) => setMachineId(e.target.value)}
                    className="w-full bg-[#111625] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all cursor-pointer"
                  >
                    <option value="">All Machines (Generic)</option>
                    {filteredMachines.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-slate-400 mb-1">SOP Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Error & Success indicators */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-xxs text-red-400 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-xxs text-emerald-455 p-3 rounded-xl flex items-center gap-2 animate-bounce">
                <CheckCircle size={15} />
                <span>{success}</span>
              </div>
            )}

            {/* Progress bar container */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xxs text-slate-400 font-bold">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 border border-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-150 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                isUploading
                  ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 shadow-cyan-500/10'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-slate-500" />
                  <span>Publishing SOP...</span>
                </>
              ) : (
                <>
                  <FileUp size={16} className="text-slate-955" />
                  <span>Publish Instruction SOP</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Drag & Drop Preview Column */}
        <div className="space-y-4">
          <h3 className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
            Media Attachment & Preview
          </h3>

          {/* Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center cursor-pointer transition-all h-48 relative ${
              dragActive
                ? 'border-cyan-500 bg-cyan-500/5'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/avi,video/quicktime,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              className="hidden"
            />
            <FileUp size={30} className="text-slate-400 mb-2.5" />
            <p className="text-xs font-bold text-slate-300">
              Drag & Drop file here
            </p>
            <p className="text-xxs text-slate-400 mt-1 max-w-[180px] leading-relaxed">
              or browse to select JPG, PNG, WEBP, PDF, DOCX, MP4, AVI, MOV
            </p>
          </div>

          {/* Preview Panel */}
          {file && (
            <div className="glass-panel p-4 border-none space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xxs font-extrabold text-slate-400 uppercase tracking-wider">
                  File Preview
                </span>
                <button
                  onClick={removeFile}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Render Type-Specific Previews */}
              <div className="rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center min-h-[140px] max-h-[260px]">
                {fileCategory === 'image' && previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Uploaded preview"
                    className="w-full h-auto max-h-[260px] object-contain"
                  />
                )}

                {fileCategory === 'video' && previewUrl && (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-auto max-h-[260px]"
                  />
                )}

                {fileCategory === 'pdf' && previewUrl && (
                  <div className="flex flex-col items-center gap-2 p-6 text-center">
                    <FileText size={40} className="text-red-500" />
                    <span className="text-xxs font-bold text-slate-300">
                      PDF Document Loaded
                    </span>
                    <span className="text-xxxs text-slate-400 leading-relaxed max-w-[200px] truncate">
                      {file.name}
                    </span>
                  </div>
                )}

                {fileCategory === 'docx' && (
                  <div className="flex flex-col items-center gap-2 p-6 text-center">
                    <FileCode size={40} className="text-blue-500" />
                    <span className="text-xxs font-bold text-slate-300">
                      Word Document Loaded
                    </span>
                    <span className="text-xxxs text-slate-400 leading-relaxed max-w-[200px] truncate">
                      {file.name}
                    </span>
                  </div>
                )}
              </div>

              {/* File Info Meta */}
              <div className="flex items-center gap-2.5 p-2 bg-white/5 border border-white/10 rounded-xl text-xxs font-medium text-slate-405">
                {fileCategory === 'image' && <ImageIcon size={14} className="text-cyan-400" />}
                {fileCategory === 'video' && <Film size={14} className="text-cyan-400" />}
                {fileCategory === 'pdf' && <FileText size={14} className="text-cyan-400" />}
                {fileCategory === 'docx' && <FileCode size={14} className="text-cyan-400" />}
                <div className="flex-1 overflow-hidden truncate">
                  <div className="font-bold text-slate-300 truncate">
                    {file.name}
                  </div>
                  <div className="text-xxxs mt-0.5 text-slate-450">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
