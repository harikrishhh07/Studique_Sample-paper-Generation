import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Edit3,
  Sparkles,
  BookOpen,
  FilePlus,
  ArrowRight,
  X,
  Layers,
  Check
} from 'lucide-react';
import driveResources from '@/public/data/resource-index-drive.json';

interface SubjectResource {
  name: string;
  semester?: string;
  ppts?: Array<{ name: string; url: string }>;
  pyqs?: Array<{ name: string; url: string }>;
}

export default function QuestionBankComponent() {
  // Form State
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [outputChoice, setOutputChoice] = useState<'qb' | 'sp' | 'both'>('both');
  const [pptFiles, setPptFiles] = useState<File[]>([]);
  const [pyqFiles, setPyqFiles] = useState<File[]>([]);
  const [subjectSuggestions, setSubjectSuggestions] = useState<SubjectResource[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Job & Processing State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result & Review State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedMarks, setEditedMarks] = useState(1);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'flagged'>('preview');
  const [selectedPreviewPdf, setSelectedPreviewPdf] = useState<string | null>(null);

  // Filter subject suggestions
  useEffect(() => {
    if (subjectName.length > 1 || subjectCode.length > 1) {
      const q = (subjectName || subjectCode).toLowerCase();
      const filtered = (driveResources.subjects as SubjectResource[]).filter(s =>
        s.name.toLowerCase().includes(q)
      ).slice(0, 5);
      setSubjectSuggestions(filtered);
    } else {
      setSubjectSuggestions([]);
    }
  }, [subjectName, subjectCode]);

  // Poll Job Status
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/qb/job?id=${activeJobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data);
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error('Job polling error:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  const handleSelectSubject = (subj: SubjectResource) => {
    setSubjectName(subj.name);
    setSubjectCode(subj.name.split(' ').map(w => w[0]).join('').toUpperCase() + '101');
    setShowSuggestions(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ppt' | 'pyq') => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    
    // File validation
    for (const f of selected) {
      if (f.size > 50 * 1024 * 1024) {
        setErrorMessage(`File ${f.name} exceeds maximum size limit of 50MB.`);
        return;
      }
    }

    if (type === 'ppt') {
      setPptFiles(prev => [...prev, ...selected]);
    } else {
      setPyqFiles(prev => [...prev, ...selected]);
    }
    setErrorMessage(null);
  };

  const removeFile = (index: number, type: 'ppt' | 'pyq') => {
    if (type === 'ppt') {
      setPptFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setPyqFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode || !subjectName) {
      setErrorMessage('Please enter both Subject Code and Subject Name.');
      return;
    }
    if (pyqFiles.length === 0 && pptFiles.length === 0) {
      setErrorMessage('Please upload at least one file (Unit Notes or PYQ Paper).');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('subject_code', subjectCode);
    formData.append('subject_name', subjectName);
    formData.append('output_choice', outputChoice);

    pyqFiles.forEach(f => formData.append('pyq_files', f));
    pptFiles.forEach(f => formData.append('ppt_files', f));

    try {
      const res = await fetch('/api/qb/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit upload job');
      }

      setActiveJobId(data.job_id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/qb/edit?id=${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: editedText,
          marks: editedMarks
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save question edit');
      }

      setEditingQuestion(null);
      // Refresh job status / results
      if (activeJobId) {
        const jRes = await fetch(`/api/qb/job?id=${activeJobId}`);
        if (jRes.ok) setJobStatus(await jRes.json());
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save edit');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-white">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141414] border border-[#222] rounded-3xl p-6 lg:p-8 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff652f]/10 text-[#ff652f] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Academic Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Question Bank & Sample Paper Generator</h1>
          <p className="text-sm text-[#a0a0a0] max-w-2xl">
            Upload subject PPT unit notes and past PYQ PDFs to generate verbatim Question Banks and SRM-format Sample Papers with zero duplicates.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form or Active Job Progress */}
      {!activeJobId ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#141414] border border-[#222] rounded-3xl p-6 lg:p-8 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <BookOpen className="w-5 h-5 text-[#ff652f]" />
              <span>1. Subject Information & Output Mode</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => {
                    setSubjectName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#ff652f]"
                />

                {/* Suggestions dropdown */}
                {showSuggestions && subjectSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden z-30 shadow-2xl">
                    {subjectSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSubject(s)}
                        className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#ff652f]/20 border-b border-[#262626] last:border-b-0 flex items-center justify-between"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-[#a0a0a0]">UnitWise Data</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">
                  Subject Code
                </label>
                <input
                  type="text"
                  required
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="e.g. 21CSC206T"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-[#ff652f]"
                />
              </div>
            </div>

            {/* Output Choice Pills */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#a0a0a0] mb-2">
                Output Documents to Generate
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setOutputChoice('qb')}
                  className={`p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    outputChoice === 'qb'
                      ? 'border-[#ff652f] bg-[#ff652f]/10 text-white'
                      : 'border-[#222] bg-[#0a0a0a] text-[#a0a0a0] hover:border-[#444]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">Question Bank Only</div>
                    <div className="text-xs mt-1 text-[#a0a0a0]">Extract all verbatim PYQs by unit/part</div>
                  </div>
                  {outputChoice === 'qb' && <Check className="w-5 h-5 text-[#ff652f]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setOutputChoice('sp')}
                  className={`p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    outputChoice === 'sp'
                      ? 'border-[#ff652f] bg-[#ff652f]/10 text-white'
                      : 'border-[#222] bg-[#0a0a0a] text-[#a0a0a0] hover:border-[#444]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">Sample Paper Only</div>
                    <div className="text-xs mt-1 text-[#a0a0a0]">New SRM paper with zero duplicate questions</div>
                  </div>
                  {outputChoice === 'sp' && <Check className="w-5 h-5 text-[#ff652f]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setOutputChoice('both')}
                  className={`p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
                    outputChoice === 'both'
                      ? 'border-[#ff652f] bg-[#ff652f]/10 text-white'
                      : 'border-[#222] bg-[#0a0a0a] text-[#a0a0a0] hover:border-[#444]'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">Both (Recommended)</div>
                    <div className="text-xs mt-1 text-[#a0a0a0]">Generate Question Bank & Sample Paper</div>
                  </div>
                  {outputChoice === 'both' && <Check className="w-5 h-5 text-[#ff652f]" />}
                </button>
              </div>
            </div>
          </div>

          {/* File Upload Dropzones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Notes Dropzone */}
            <div className="bg-[#141414] border border-[#222] rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <Layers className="w-4 h-4 text-[#ff652f]" />
                <span>2. Upload Unit Wise Notes (PDF / PPT / PPTX)</span>
              </h3>

              <label className="border-2 border-dashed border-[#262626] hover:border-[#ff652f]/50 bg-[#0a0a0a] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                <UploadCloud className="w-8 h-8 text-[#ff652f] mb-2" />
                <span className="text-xs font-bold text-white">Click or drag Unit Notes (PDF, PPT, PPTX)</span>
                <span className="text-[11px] text-[#888] mt-1">Multiple unit notes allowed (max 50MB each)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => handleFileChange(e, 'ppt')}
                  className="hidden"
                />
              </label>

              {pptFiles.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pptFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-[#1a1a1a] rounded-xl border border-[#262626] text-xs">
                      <span className="truncate max-w-[200px] text-white font-medium">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i, 'ppt')} className="text-red-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PYQ Papers Dropzone */}
            <div className="bg-[#141414] border border-[#222] rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                <FileText className="w-4 h-4 text-[#ff652f]" />
                <span>3. Upload PYQ Papers (PDF / PPT / PPTX)</span>
              </h3>

              <label className="border-2 border-dashed border-[#262626] hover:border-[#ff652f]/50 bg-[#0a0a0a] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                <UploadCloud className="w-8 h-8 text-[#ff652f] mb-2" />
                <span className="text-xs font-bold text-white">Click or drag PYQ Papers (PDF, PPT, PPTX)</span>
                <span className="text-[11px] text-[#888] mt-1">One or more past exam papers (max 50MB each)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => handleFileChange(e, 'pyq')}
                  className="hidden"
                />
              </label>

              {pyqFiles.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pyqFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-[#1a1a1a] rounded-xl border border-[#262626] text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[220px]">
                        <span className="truncate text-white font-medium">{f.name}</span>
                        <span className="px-2 py-0.5 rounded bg-[#ff652f]/20 text-[#ff652f] text-[10px] font-bold">Auto Header</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i, 'pyq')} className="text-red-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-4 rounded-full bg-[#ff652f] text-white font-bold text-sm hover:bg-[#ff652f]/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ff652f]/20 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Uploading & Initializing Pipeline...</span>
              </>
            ) : (
              <>
                <span>Start Ingestion & Generation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Progress Dashboard & Results */
        <div className="space-y-6">
          <div className="bg-[#141414] border border-[#222] rounded-3xl p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Pipeline Execution Status</h2>
                <p className="text-xs text-[#a0a0a0]">Job ID: {activeJobId}</p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                jobStatus?.status === 'completed'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : jobStatus?.status === 'failed'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-[#ff652f]/20 text-[#ff652f] border border-[#ff652f]/30'
              }`}>
                {jobStatus?.status || 'Processing'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#a0a0a0]">
                <span>{jobStatus?.stage || 'Queued'}</span>
                <span>{Math.round((jobStatus?.progress || 0) * 100)}%</span>
              </div>
              <div className="w-full bg-[#222] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#ff652f] h-full transition-all duration-500"
                  style={{ width: `${(jobStatus?.progress || 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Retry Button on failure */}
            {jobStatus?.status === 'failed' && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-3">
                <p>Pipeline Error: {jobStatus?.error}</p>
                <button
                  onClick={() => setActiveJobId(null)}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Ingestion Job</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Screen */}
          {jobStatus?.status === 'completed' && (
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex border-b border-[#222]">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'preview'
                      ? 'border-[#ff652f] text-[#ff652f]'
                      : 'border-transparent text-[#a0a0a0] hover:text-white'
                  }`}
                >
                  PDF Downloads & Preview
                </button>
                <button
                  onClick={() => setActiveTab('flagged')}
                  className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
                    activeTab === 'flagged'
                      ? 'border-[#ff652f] text-[#ff652f]'
                      : 'border-transparent text-[#a0a0a0] hover:text-white'
                  }`}
                >
                  Flagged Questions & Inline Editor
                </button>
              </div>

              {activeTab === 'preview' ? (
                (() => {
                  const qbFileRef = jobStatus?.qb_pdf_ref || jobStatus?.payload?.qb_pdf_ref || `uploads/qb/QB_${(subjectCode || 'CS101').replace(/[^a-zA-Z0-9]/g, '')}_${(jobStatus?.user_id || 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}.pdf`;
                  const spFileRef = jobStatus?.sp_pdf_ref || jobStatus?.payload?.sp_pdf_ref || `uploads/papers/sample_paper_${(activeJobId || 'job').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16)}.pdf`;
                  const activePreviewMode = selectedPreviewPdf === 'sp' ? 'sp' : 'qb';
                  const currentPreviewRef = activePreviewMode === 'sp' ? spFileRef : qbFileRef;

                  return (
                    <div className="space-y-6">
                      {/* Download Buttons Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a
                          href={`/api/qb/download?fileRef=${encodeURIComponent(qbFileRef)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-5 bg-[#141414] border border-[#222] hover:border-[#ff652f] rounded-2xl flex items-center justify-between group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#ff652f]/20 text-[#ff652f] flex items-center justify-center">
                              <Download className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">Download Question Bank PDF</div>
                              <div className="text-xs text-[#a0a0a0]">Verbatim past year questions tagged by session</div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-[#a0a0a0] group-hover:text-[#ff652f] transition-all" />
                        </a>

                        <a
                          href={`/api/qb/download?fileRef=${encodeURIComponent(spFileRef)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-5 bg-[#141414] border border-[#222] hover:border-[#ff652f] rounded-2xl flex items-center justify-between group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#ff652f]/20 text-[#ff652f] flex items-center justify-center">
                              <Download className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm">Download Sample Paper PDF</div>
                              <div className="text-xs text-[#a0a0a0]">SRM-format 75 marks exam paper</div>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-[#a0a0a0] group-hover:text-[#ff652f] transition-all" />
                        </a>
                      </div>

                      {/* Inline PDF Viewer Frame */}
                      <div className="bg-[#141414] border border-[#222] rounded-3xl p-4 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-2">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">
                              Inline Document Viewer
                            </div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {activePreviewMode === 'sp' ? 'Sample Paper PDF (SRM Format)' : 'Question Bank PDF (Verbatim PYQs)'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-[#0a0a0a] p-1.5 rounded-2xl border border-[#222]">
                            <button
                              type="button"
                              onClick={() => setSelectedPreviewPdf('qb')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                activePreviewMode === 'qb'
                                  ? 'bg-[#ff652f] text-white shadow-md shadow-[#ff652f]/20'
                                  : 'text-[#a0a0a0] hover:text-white'
                              }`}
                            >
                              Question Bank
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPreviewPdf('sp')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                activePreviewMode === 'sp'
                                  ? 'bg-[#ff652f] text-white shadow-md shadow-[#ff652f]/20'
                                  : 'text-[#a0a0a0] hover:text-white'
                              }`}
                            >
                              Sample Paper
                            </button>
                          </div>
                        </div>

                        <iframe
                          src={`/api/qb/download?fileRef=${encodeURIComponent(currentPreviewRef)}`}
                          className="w-full h-[600px] rounded-2xl border border-[#262626] bg-white"
                        />
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Flagged Questions Editor */
                <div className="bg-[#141414] border border-[#222] rounded-3xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#ff652f]" />
                    <span>Flagged Questions Requiring Verification</span>
                  </h3>

                  {editingQuestion ? (
                    <div className="bg-[#0a0a0a] border border-[#333] rounded-2xl p-6 space-y-4">
                      <h4 className="text-sm font-bold text-white">Edit Question Details</h4>
                      <div>
                        <label className="block text-xs font-bold text-[#a0a0a0] mb-1">Question Text (LaTeX supported)</label>
                        <textarea
                          rows={4}
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full bg-[#141414] border border-[#333] rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#ff652f]"
                        />
                      </div>

                      <div className="flex gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#a0a0a0] mb-1">Marks</label>
                          <input
                            type="number"
                            value={editedMarks}
                            onChange={(e) => setEditedMarks(parseInt(e.target.value))}
                            className="w-24 bg-[#141414] border border-[#333] rounded-xl p-2.5 text-white text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSavingEdit}
                          className="px-5 py-2.5 rounded-xl bg-[#ff652f] text-white font-bold text-xs hover:bg-[#ff652f]/90 transition-all flex items-center gap-2"
                        >
                          {isSavingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Save & Regenerate PDF</span>
                        </button>
                        <button
                          onClick={() => setEditingQuestion(null)}
                          className="px-5 py-2.5 rounded-xl bg-[#222] text-[#a0a0a0] font-bold text-xs hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-[#a0a0a0] p-4 bg-[#0a0a0a] rounded-2xl border border-[#222]">
                      No flagged questions currently require manual correction. All extracted questions meet structural confidence thresholds.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
