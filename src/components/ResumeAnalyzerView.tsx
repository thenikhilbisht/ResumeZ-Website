import { useAuth } from '../contexts/AuthContext';
import React, { useState, useRef } from 'react';
import { getAuthHeaders, getApiUrl } from '../lib/api';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Coins, 
  Target, 
  Layers, 
  FileSearch,
  CheckCheck,
  Eye,
  EyeOff,
  Trash2,
  Cpu,
  Code2,
  Server,
  Cloud,
  Database,
  Smartphone,
  CheckCircle,
  FileCheck2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ATSAnalysisResult, ResumeAnalysisRecord } from '../types';
import { SAMPLE_JOB_DESCRIPTIONS, INITIAL_RESUME_CONTENT } from '../data/sampleData';
import { scoreColor } from '../lib/theme';

interface ResumeAnalyzerViewProps {
  onAnalysisComplete: (analysis: ResumeAnalysisRecord) => void;
  creditsRemaining: number;
  onOpenCreditsModal: () => void;
}

export const ResumeAnalyzerView: React.FC<ResumeAnalyzerViewProps> = ({
  onAnalysisComplete,
  creditsRemaining,
  onOpenCreditsModal,
}) => {
  const { session, refreshProfile } = useAuth();
  const [isRefilling, setIsRefilling] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume State
  const [resumeFileName, setResumeFileName] = useState<string>('Alex_Rivera_Resume.pdf');
  const [resumeFileSize, setResumeFileSize] = useState<string>('38.4 KB');
  const [showExtractedPreview, setShowExtractedPreview] = useState<boolean>(false);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);

  const [resumeText, setResumeText] = useState<string>(() => {
    // Generate initial text representation of sample resume
    const p = INITIAL_RESUME_CONTENT.personal_info;
    const exp = INITIAL_RESUME_CONTENT.experience.map(e => 
      `${e.job_title} at ${e.company_name} (${e.start_date} - ${e.end_date})\n` + e.bullet_points.map(b => `• ${b}`).join('\n')
    ).join('\n\n');
    const skills = INITIAL_RESUME_CONTENT.skills.map(s => `${s.category_name}: ${s.skills_list.join(', ')}`).join('\n');
    return `${p.full_name}\n${p.headline}\nEmail: ${p.email} | Phone: ${p.phone} | Location: ${p.location}\n\nSUMMARY\n${INITIAL_RESUME_CONTENT.summary.body}\n\nEXPERIENCE\n${exp}\n\nSKILLS\n${skills}`;
  });

  // Target Job Description State (Default: AI Engineer preset)
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SAMPLE_JOB_DESCRIPTIONS[0].id);
  const [jobDescription, setJobDescription] = useState<string>(SAMPLE_JOB_DESCRIPTIONS[0].text);
  const [targetJobTitle, setTargetJobTitle] = useState<string>(SAMPLE_JOB_DESCRIPTIONS[0].title);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ATSAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const handleSelectPreset = (presetId: string) => {
    const selected = SAMPLE_JOB_DESCRIPTIONS.find((p) => p.id === presetId);
    if (selected) {
      setSelectedPresetId(selected.id);
      setTargetJobTitle(selected.title);
      setJobDescription(selected.text);
      setErrorMessage(null);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File exceeds the 5 MB limit. Please upload a smaller PDF or text file.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'txt', 'md', 'docx'];
    if (!validExts.includes(ext || '')) {
      setErrorMessage('Unsupported format. Please upload a PDF, DOCX, TXT, or MD resume.');
      return;
    }

    setResumeFileName(file.name);
    const sizeInKb = (file.size / 1024).toFixed(1);
    setResumeFileSize(`${sizeInKb} KB`);

    if (ext === 'pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl && dataUrl.includes(',')) {
          const b64 = dataUrl.split(',')[1];
          setFileBase64(b64);
          setFileMimeType('application/pdf');
          setResumeText(`[Uploaded PDF Document: ${file.name} (${sizeInKb} KB)]\nFull document attached for ATS algorithm audit.`);
          setErrorMessage(null);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setResumeText(content);
          setFileBase64(null);
          setFileMimeType(null);
          setErrorMessage(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetToSampleResume = () => {
    const p = INITIAL_RESUME_CONTENT.personal_info;
    const exp = INITIAL_RESUME_CONTENT.experience.map(e => 
      `${e.job_title} at ${e.company_name} (${e.start_date} - ${e.end_date})\n` + e.bullet_points.map(b => `• ${b}`).join('\n')
    ).join('\n\n');
    const skills = INITIAL_RESUME_CONTENT.skills.map(s => `${s.category_name}: ${s.skills_list.join(', ')}`).join('\n');
    setResumeText(`${p.full_name}\n${p.headline}\nEmail: ${p.email} | Phone: ${p.phone} | Location: ${p.location}\n\nSUMMARY\n${INITIAL_RESUME_CONTENT.summary.body}\n\nEXPERIENCE\n${exp}\n\nSKILLS\n${skills}`);
    setResumeFileName('Alex_Rivera_Resume.pdf');
    setResumeFileSize('38.4 KB');
    setFileBase64(null);
    setFileMimeType(null);
    setErrorMessage(null);
  };

  const handleClearResume = () => {
    setResumeText('');
    setResumeFileName('');
    setResumeFileSize('');
    setFileBase64(null);
    setFileMimeType(null);
    setShowExtractedPreview(false);
  };

  const handleRunAnalysis = async () => {
    if (!resumeText.trim() && !fileBase64) {
      setErrorMessage('Please upload or enter your resume before running ATS analysis.');
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMessage('Please provide or select a target job description for ATS comparison.');
      return;
    }

    if (creditsRemaining < 2) {
      onOpenCreditsModal();
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(getApiUrl('/api/ai/analyze-resume'), {
        method: 'POST',
        headers: getAuthHeaders(session?.access_token),
        body: JSON.stringify({
          resume_text: resumeText,
          file_base64: fileBase64,
          file_mime_type: fileMimeType,
          job_description: jobDescription,
          target_job_title: targetJobTitle,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to complete ATS analysis');
      }

      setAnalysisResult(data.analysis.result_json);
      onAnalysisComplete(data.analysis);
      await refreshProfile();

      if (data.analysis.result_json.overall_score >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      console.error('ATS Analysis Error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRefill = async () => {
    setIsRefilling(true);
    try {
      const res = await fetch(getApiUrl('/api/user/refill'), {
        method: 'POST',
        headers: getAuthHeaders(session?.access_token),
        body: JSON.stringify({ amount: 10, plan_name: 'Instant Refill' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshProfile();
        setErrorMessage(null);
      }
    } catch (e) {
      console.error('Refill error:', e);
    } finally {
      setIsRefilling(false);
    }
  };

  const handleCopyRewrite = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16 text-[#F5F1E8]">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292344] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#E1C77A]">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F1E8]">
              AI ATS Resume & Job Match Analyzer
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#AAA6B7]">
            Simulate recruiter ATS scanners: benchmark keyword alignment, compute impact ratios, and optimize bullet points.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-[#151329] border border-[#292344] px-3 py-1.5 text-xs font-semibold text-[#AAA6B7]">
            <Coins className="h-3.5 w-3.5 text-[#C6A75E]" />
            <span>Cost: 2 Credits</span>
          </div>
          <button
            id="run-ats-audit-btn"
            disabled={isLoading}
            onClick={handleRunAnalysis}
            className="flex items-center gap-2 rounded-xl btn-gold-primary px-5 py-2.5 text-xs font-semibold shadow-lg shadow-[#C6A75E]/10 transition disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-[#080711]" />
                <span className="text-[#080711]">Scanning ATS Metrics...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-[#080711]" />
                <span className="text-[#080711]">Run Full ATS Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-[#A94D4D]/50 bg-[#A94D4D]/15 p-4 text-xs text-[#F5F1E8] flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#A94D4D]" />
            <div>
              <p className="font-bold text-[#F5F1E8]">Analysis Notice</p>
              <p className="mt-0.5 text-[#AAA6B7]">{errorMessage}</p>
            </div>
          </div>
          {errorMessage.toLowerCase().includes('credit') && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleQuickRefill}
                disabled={isRefilling}
                className="rounded-xl bg-[#A94D4D] hover:bg-[#A94D4D]/80 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isRefilling ? 'Refilling...' : '+10 Free Credits'}
              </button>
              <button
                onClick={onOpenCreditsModal}
                className="rounded-xl border border-[#292344] bg-[#151329] px-3 py-1.5 text-xs font-bold text-[#F5F1E8] hover:border-[#C6A75E] transition cursor-pointer"
              >
                Manage
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Section (Dual Columns: Resume & Job Description) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Clean Resume Upload & Update Card */}
        <div className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#AAA6B7] flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#C6A75E]" />
                1. Candidate Resume
              </label>
              {resumeText ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-[#4F9D69]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready for Scan
                </span>
              ) : (
                <span className="text-[11px] text-[#C49A4A] font-medium">No resume uploaded</span>
              )}
            </div>

            {/* Resume Upload / Active State Display */}
            {resumeText ? (
              <div className="mt-4 space-y-3">
                {/* Active Upload Card */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`rounded-2xl border p-4 transition ${
                    dragActive
                      ? 'border-[#C6A75E] bg-[#1B1833]'
                      : 'border-[#292344] bg-[#0E0C1B]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C6A75E]/15 text-[#E1C77A] border border-[#C6A75E]/30">
                        <FileCheck2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#F5F1E8] truncate max-w-[200px] sm:max-w-[260px]">
                          {resumeFileName || 'Candidate_Resume.pdf'}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-[#AAA6B7]">
                          {resumeFileSize && <span>{resumeFileSize}</span>}
                          <span>•</span>
                          <span>{resumeText.length} chars</span>
                          <span>•</span>
                          <span className="font-mono text-[#4F9D69] font-medium">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-[#151329] border border-[#292344] hover:border-[#C6A75E]/50 px-3 py-1.5 text-xs font-bold text-[#F5F1E8] transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Upload new file to replace current resume"
                      >
                        <Upload className="h-3.5 w-3.5 text-[#C6A75E]" />
                        Update Resume
                      </button>
                    </div>
                  </div>

                  {/* Quick drag & drop footer tip */}
                  <div className="mt-3 pt-3 border-t border-[#292344] flex items-center justify-between text-[11px] text-[#AAA6B7]">
                    <span className="flex items-center gap-1 text-[#706C7C]">
                      <Upload className="h-3 w-3" /> Drop another file here anytime to update
                    </span>
                    <button
                      onClick={() => setShowExtractedPreview(!showExtractedPreview)}
                      className="text-xs font-semibold text-[#C6A75E] hover:text-[#E1C77A] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {showExtractedPreview ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Hide Extracted Text
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> View Extracted Text
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Extracted Content Preview */}
                {showExtractedPreview && (
                  <div className="rounded-2xl border border-[#292344] bg-[#080711] p-3.5 shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-[#292344] text-[11px] font-bold text-[#AAA6B7]">
                      <span>Parsed Text Preview</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(resumeText);
                          setCopiedIndex(-1);
                          setTimeout(() => setCopiedIndex(null), 1500);
                        }}
                        className="text-[#C6A75E] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === -1 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedIndex === -1 ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="mt-2 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed text-[#AAA6B7] whitespace-pre-wrap">
                      {resumeText}
                    </div>
                  </div>
                )}

                {/* Quick Info Box */}
                <div className="rounded-xl bg-[#312E63]/25 border border-[#6366A8]/30 p-3 text-xs text-[#AAA6B7] space-y-1">
                  <div className="font-semibold text-[#F5F1E8] flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-[#6366A8]" />
                    Resume is primed for ATS matching
                  </div>
                  <p className="text-[11px] text-[#AAA6B7]">
                    Our AI model will extract your key work experience, achievements, tech stack, and educational metrics directly from this document.
                  </p>
                </div>
              </div>
            ) : (
              /* Empty / Upload Dropzone */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`mt-4 rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  dragActive ? 'border-[#C6A75E] bg-[#1B1833]' : 'border-[#292344] bg-[#0E0C1B]'
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C6A75E]/15 text-[#E1C77A] border border-[#C6A75E]/30">
                  <Upload className="h-7 w-7" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-[#F5F1E8]">
                  Upload your Resume
                </h4>
                <p className="mt-1 text-xs text-[#AAA6B7]">
                  Drag & drop your resume file here, or click to browse
                </p>
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl btn-gold-primary px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    Select PDF / DOCX / TXT
                  </button>
                  <button
                    onClick={handleResetToSampleResume}
                    className="rounded-xl btn-secondary-luxury px-3 py-2 text-xs font-semibold cursor-pointer"
                  >
                    Load Sample Resume
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-[#706C7C]">Supports PDF, DOCX, and TXT files up to 5MB</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#292344] flex items-center justify-between text-[11px] text-[#706C7C]">
            <span>Supports standard PDF, TXT, or markdown</span>
            {resumeText && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetToSampleResume}
                  className="text-[#C6A75E] hover:text-[#E1C77A] font-medium cursor-pointer transition-colors"
                >
                  Reset to Sample
                </button>
                <button
                  onClick={handleClearResume}
                  className="text-[#A94D4D] hover:text-[#A94D4D]/80 flex items-center gap-1 font-medium cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Target Job Description Input */}
        <div className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#AAA6B7] flex items-center gap-1.5">
                <Target className="h-4 w-4 text-[#6366A8]" />
                2. Target Job Description
              </label>

              {/* Role Dropdown Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#706C7C]">Role:</span>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="rounded-xl border border-[#292344] bg-[#0E0C1B] px-2.5 py-1 text-xs font-semibold text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                >
                  {SAMPLE_JOB_DESCRIPTIONS.map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-[#151329] text-[#F5F1E8]">
                      {preset.badge || preset.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick 1-Click Role Filter Chips */}
            <div className="mt-1 flex flex-wrap gap-1.5 pb-2">
              {SAMPLE_JOB_DESCRIPTIONS.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-[#312E63] border border-[#6366A8] text-[#E1C77A] shadow-xs'
                        : 'border border-[#292344] bg-[#0E0C1B] text-[#AAA6B7] hover:border-[#C6A75E]/40 hover:text-[#F5F1E8]'
                    }`}
                  >
                    {preset.id === 'ai-engineer' && <Cpu className="h-3 w-3 text-[#E1C77A]" />}
                    {preset.id === 'frontend-web' && <Code2 className="h-3 w-3" />}
                    {preset.id === 'fullstack-dev' && <Layers className="h-3 w-3" />}
                    {preset.id === 'backend-engineer' && <Server className="h-3 w-3" />}
                    {preset.id === 'devops-cloud' && <Cloud className="h-3 w-3" />}
                    {preset.id === 'data-scientist' && <Database className="h-3 w-3" />}
                    {preset.id === 'mobile-app' && <Smartphone className="h-3 w-3" />}
                    <span>{preset.badge || preset.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Target Job Title Input */}
            <div className="mt-2">
              <input
                type="text"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                placeholder="Target Job Title (e.g., AI Engineer, Frontend Web Developer)"
                className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs font-semibold text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
              />
            </div>

            {/* Editable Job Description Area */}
            <textarea
              id="job-desc-input"
              rows={9}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste custom target job description here (responsibilities, required skills, tech stack)..."
              className="mt-2.5 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] p-3 text-xs font-mono text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[#292344] flex items-center justify-between text-[11px] text-[#706C7C]">
            <span>ATS compares hard skills, responsibilities & keywords</span>
            <button
              onClick={() => {
                setJobDescription('');
                setTargetJobTitle('');
              }}
              className="text-[#AAA6B7] hover:text-[#F5F1E8] transition-colors cursor-pointer"
            >
              Clear Custom JD
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div id="ats-report-results" className="space-y-8 pt-4">
          {/* Top Scorecard Hero Card */}
          <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-2xl">
            <div className="grid gap-6 md:grid-cols-12 items-center">
              {/* Radial Score Gauge */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-[#292344]">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-[#292344]">
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-[#C6A75E] transition-all duration-1000"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`,
                      opacity: analysisResult.overall_score / 100,
                    }}
                  />
                  <div className="text-center">
                    <span
                      className="text-4xl font-black"
                      style={{ color: scoreColor(analysisResult.overall_score) }}
                    >
                      {analysisResult.overall_score}
                    </span>
                    <span className="block text-[11px] font-bold text-[#706C7C]">/ 100 ATS</span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    analysisResult.overall_score >= 80
                      ? 'bg-[#4F9D69]/15 border border-[#4F9D69]/30 text-[#4F9D69]'
                      : analysisResult.overall_score >= 65
                      ? 'bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#E1C77A]'
                      : 'bg-[#A94D4D]/15 border border-[#A94D4D]/30 text-[#A94D4D]'
                  }`}>
                    {analysisResult.verdict}
                  </span>
                </div>
              </div>

              {/* Breakdown Category Progress Bars */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-[#F5F1E8]">ATS Algorithm Diagnostic</h3>
                  <p className="text-xs text-[#AAA6B7]">{analysisResult.summary}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Keyword Match */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-[#AAA6B7]">
                      <span>Keyword Match</span>
                      <span className="font-bold text-[#F5F1E8]">{analysisResult.scoring_breakdown.keyword_match_score}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-[#0E0C1B] border border-[#292344]">
                      <div
                        className="h-2 rounded-full bg-[#C6A75E] transition-all"
                        style={{ width: `${analysisResult.scoring_breakdown.keyword_match_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Experience Relevance */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-[#AAA6B7]">
                      <span>Experience Relevance</span>
                      <span className="font-bold text-[#F5F1E8]">{analysisResult.scoring_breakdown.experience_relevance_score}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-[#0E0C1B] border border-[#292344]">
                      <div
                        className="h-2 rounded-full bg-[#6366A8] transition-all"
                        style={{ width: `${analysisResult.scoring_breakdown.experience_relevance_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills Alignment */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-[#AAA6B7]">
                      <span>Skills Alignment</span>
                      <span className="font-bold text-[#F5F1E8]">{analysisResult.scoring_breakdown.skills_alignment_score}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-[#0E0C1B] border border-[#292344]">
                      <div
                        className="h-2 rounded-full bg-[#4F9D69] transition-all"
                        style={{ width: `${analysisResult.scoring_breakdown.skills_alignment_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Formatting & ATS Readability */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-[#AAA6B7]">
                      <span>Formatting Readability</span>
                      <span className="font-bold text-[#F5F1E8]">{analysisResult.scoring_breakdown.formatting_readability_score}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-[#0E0C1B] border border-[#292344]">
                      <div
                        className="h-2 rounded-full bg-[#7C6BA8] transition-all"
                        style={{ width: `${analysisResult.scoring_breakdown.formatting_readability_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Impact & Metric Ratio */}
                  <div className="sm:col-span-2">
                    <div className="flex justify-between text-xs font-medium text-[#AAA6B7]">
                      <span>Quantified Impact Metrics</span>
                      <span className="font-bold text-[#F5F1E8]">{analysisResult.scoring_breakdown.impact_metrics_score}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-[#0E0C1B] border border-[#292344]">
                      <div
                        className="h-2 rounded-full bg-[#E1C77A] transition-all"
                        style={{ width: `${analysisResult.scoring_breakdown.impact_metrics_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Keywords Matrix Block */}
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-[#C6A75E]" />
              Keywords & Hard Skills Matrix
            </h3>
            <p className="mt-1 text-xs text-[#AAA6B7]">
              ATS systems perform strict string matching. Missing critical keywords directly harm your candidate ranking.
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {/* Missing Critical Keywords */}
              <div className="rounded-xl border border-[#A94D4D]/30 bg-[#A94D4D]/10 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#A94D4D]">
                  <XCircle className="h-4 w-4" />
                  Missing Critical Keywords
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {analysisResult.keywords_analysis.missing_critical_keywords.map((kw, i) => (
                    <span key={i} className="rounded-md bg-[#A94D4D]/20 border border-[#A94D4D]/30 px-2 py-0.5 text-xs font-semibold text-[#F5F1E8]">
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Recommended Keywords */}
              <div className="rounded-xl border border-[#C49A4A]/30 bg-[#C49A4A]/10 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#E1C77A]">
                  <AlertTriangle className="h-4 w-4 text-[#C49A4A]" />
                  Recommended Additions
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {analysisResult.keywords_analysis.missing_recommended_keywords.map((kw, i) => (
                    <span key={i} className="rounded-md bg-[#C49A4A]/20 border border-[#C49A4A]/30 px-2 py-0.5 text-xs font-medium text-[#E1C77A]">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Matching Keywords */}
              <div className="rounded-xl border border-[#4F9D69]/30 bg-[#4F9D69]/10 p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F9D69]">
                  <CheckCircle2 className="h-4 w-4" />
                  Detected Matching Keywords
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {analysisResult.keywords_analysis.matching_keywords.map((kw, i) => (
                    <span key={i} className="rounded-md bg-[#4F9D69]/20 border border-[#4F9D69]/30 px-2 py-0.5 text-xs font-medium text-[#4F9D69]">
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* High-Impact AI Bullet Point Rewrites (Google XYZ Formula) */}
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C6A75E]" />
                  Recommended Bullet Rewrites (Google XYZ Formula)
                </h3>
                <p className="text-xs text-[#AAA6B7]">
                  Transformed into: "Accomplished [X] as measured by [Y], by doing [Z]"
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {analysisResult.tailored_suggestions.bullet_rewrite_examples.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-[#292344] bg-[#0E0C1B] p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#706C7C] uppercase tracking-wider">Original</span>
                    <button
                      onClick={() => handleCopyRewrite(item.suggested_rewrite, idx)}
                      className="flex items-center gap-1 text-xs font-semibold text-[#C6A75E] hover:text-[#E1C77A] transition cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <CheckCheck className="h-3.5 w-3.5 text-[#4F9D69]" />
                          <span className="text-[#4F9D69]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Optimized</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#AAA6B7] line-through">
                    "{item.original}"
                  </p>

                  <div className="pt-2 border-t border-[#292344]">
                    <span className="text-[11px] font-bold text-[#4F9D69] uppercase tracking-wider">
                      ATS Optimized Rewrite
                    </span>
                    <p className="mt-0.5 text-xs font-semibold text-[#F5F1E8]">
                      "{item.suggested_rewrite}"
                    </p>
                    <p className="mt-1 text-[11px] text-[#AAA6B7] italic">
                      Why: {item.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section-by-Section Evaluations */}
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
            <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#6366A8]" />
              Section Breakdown & Action Plan
            </h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {analysisResult.section_evaluations.map((sec, i) => (
                <div key={i} className="rounded-xl border border-[#292344] bg-[#0E0C1B] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-[#F5F1E8]">{sec.section_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      sec.status === 'strong'
                        ? 'bg-[#4F9D69]/15 border border-[#4F9D69]/30 text-[#4F9D69]'
                        : sec.status === 'acceptable'
                        ? 'bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#E1C77A]'
                        : 'bg-[#A94D4D]/15 border border-[#A94D4D]/30 text-[#A94D4D]'
                    }`}>
                      {sec.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    {sec.strengths.length > 0 && (
                      <div>
                        <span className="font-semibold text-[#4F9D69]">Strengths:</span>
                        <ul className="list-disc pl-4 text-[#AAA6B7]">
                          {sec.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sec.actionable_recommendations.length > 0 && (
                      <div>
                        <span className="font-semibold text-[#E1C77A]">Recommended Fix:</span>
                        <ul className="list-disc pl-4 text-[#AAA6B7]">
                          {sec.actionable_recommendations.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
