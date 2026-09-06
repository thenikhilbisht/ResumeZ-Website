import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Printer,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ResumeContent, ResumeDocument, TemplateId } from '../types';
import { INITIAL_RESUME_CONTENT } from '../data/sampleData';
import { BulletEnhancerModal } from './BulletEnhancerModal';

interface ResumeBuilderViewProps {
  initialResume?: ResumeDocument | null;
  onSaveResume: (resume: Partial<ResumeDocument>) => Promise<void>;
  creditsRemaining: number;
  onOpenCreditsModal: () => void;
}

export const ResumeBuilderView: React.FC<ResumeBuilderViewProps> = ({
  initialResume,
  onSaveResume,
  creditsRemaining,
  onOpenCreditsModal,
}) => {
  const [content, setContent] = useState<ResumeContent>(
    initialResume?.content && Object.keys(initialResume.content).length > 0
      ? initialResume.content
      : INITIAL_RESUME_CONTENT
  );

  const [activeResumeId] = useState<string | null>(initialResume?.id || null);
  const [resumeTitle, setResumeTitle] = useState<string>(initialResume?.title || 'Software Engineer Resume');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(
    (initialResume?.template_id as TemplateId) || 'modern_clean'
  );
  const [accentColor, setAccentColor] = useState<string>(content.meta?.accent_color || '#C6A75E');

  // Bullet Enhancer Modal state
  const [enhancerOpen, setEnhancerOpen] = useState<boolean>(false);
  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null);
  const [activeBulletIndex, setActiveBulletIndex] = useState<number | null>(null);
  const [bulletToEnhance, setBulletToEnhance] = useState<string>('');

  // Accordion section collapse state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    personal: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
    projects: false,
  });

  const toggleSection = (sec: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const isInitialMount = useRef(true);

  // Auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Only auto-save if we have some content
    if (!content.personal_info.full_name && !content.experience.length) return;

    setIsTyping(true);
    setSaveStatus('idle');

    const timeout = setTimeout(() => {
      setIsTyping(false);
      handleSave(true);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeout);
  }, [content, resumeTitle, selectedTemplate, accentColor]);

  const handleSave = async (isAutoSave = false) => {
    setSaveStatus('saving');
    try {
      const updatedMeta = { ...content.meta, template_id: selectedTemplate, accent_color: accentColor };
      const updatedContent = { ...content, meta: updatedMeta };
      await onSaveResume({
        id: activeResumeId || undefined,
        title: resumeTitle,
        template_id: selectedTemplate,
        content: updatedContent,
      });
      setSaveStatus('saved');
      if (!isAutoSave) {
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err) {
      console.error('Error saving resume:', err);
      setSaveStatus('idle');
    }
  };

  const handlePrintExport = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    alert('To generate a high-quality vector PDF, please select "Save as PDF" in the print dialog destination dropdown.');
    window.print();
  };

  const openBulletEnhancer = (expIdx: number, bulletIdx: number, text: string) => {
    setActiveExpIndex(expIdx);
    setActiveBulletIndex(bulletIdx);
    setBulletToEnhance(text);
    setEnhancerOpen(true);
  };

  const applyEnhancedBullet = (newText: string) => {
    if (activeExpIndex !== null && activeBulletIndex !== null) {
      const newExp = [...content.experience];
      newExp[activeExpIndex].bullet_points[activeBulletIndex] = newText;
      setContent({ ...content, experience: newExp });
    }
  };

  // Helper experience mutations
  const addExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      job_title: 'Software Engineer',
      company_name: 'Tech Company Inc.',
      location: 'Remote',
      start_date: '2023-01',
      end_date: 'Present',
      is_current: true,
      bullet_points: ['Spearheaded development of scalable microservices in Node.js / Go, reducing latency by 20%.'],
    };
    setContent({ ...content, experience: [newExp, ...content.experience] });
  };

  const removeExperience = (idx: number) => {
    setContent({ ...content, experience: content.experience.filter((_, i) => i !== idx) });
  };

  const addExperienceBullet = (expIdx: number) => {
    const newExp = [...content.experience];
    newExp[expIdx].bullet_points.push('Architected feature X resulting in Y% improvement by doing Z.');
    setContent({ ...content, experience: newExp });
  };

  const removeExperienceBullet = (expIdx: number, bulletIdx: number) => {
    const newExp = [...content.experience];
    newExp[expIdx].bullet_points = newExp[expIdx].bullet_points.filter((_, i) => i !== bulletIdx);
    setContent({ ...content, experience: newExp });
  };

  return (
    <div className="space-y-6 pb-20 text-[#F5F1E8]">
      {/* Top Controls Toolbar (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292344] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#C6A75E]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <input
              type="text"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              className="text-base font-bold text-[#F5F1E8] bg-transparent border-b border-transparent hover:border-[#292344] focus:border-[#C6A75E] focus:outline-none"
            />
            <p className="text-[11px] text-[#AAA6B7]">Live preview & PDF generator</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Template Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#706C7C]">Theme:</span>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value as TemplateId)}
              className="rounded-lg border border-[#292344] bg-[#151329] px-2.5 py-1.5 font-medium text-[#F5F1E8] text-xs focus:border-[#C6A75E] focus:outline-none"
            >
              <option value="modern_clean">Modern Clean</option>
              <option value="tech_minimalist">Tech Minimalist</option>
              <option value="executive_classic">Executive Classic</option>
              <option value="creative_compact">Creative Compact</option>
            </select>
          </div>

          {/* Accent Color picker */}
          <div className="flex items-center gap-1.5">
            {['#C6A75E', '#6366A8', '#4F9D69', '#C49A4A', '#7C6BA8', '#1E293B'].map((c) => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                className={`h-5 w-5 rounded-full transition cursor-pointer ${accentColor === c ? 'ring-2 ring-offset-2 ring-[#C6A75E]' : 'opacity-70 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Auto-Save Status / Save Button */}
          <button
            id="save-resume-btn"
            onClick={() => handleSave(false)}
            disabled={saveStatus === 'saving' || isTyping}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              saveStatus === 'saved'
                ? 'bg-[#4F9D69]/10 text-[#4F9D69] border border-[#4F9D69]/30'
                : isTyping || saveStatus === 'saving'
                ? 'bg-[#151329] text-[#AAA6B7] border border-[#292344]'
                : 'btn-secondary-luxury'
            } cursor-pointer`}
          >
            {saveStatus === 'saved' && !isTyping ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#4F9D69]" />
                <span>Saved to cloud</span>
              </>
            ) : isTyping || saveStatus === 'saving' ? (
              <>
                <Save className="h-3.5 w-3.5 animate-pulse" />
                <span>{isTyping ? 'Typing...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Save Draft</span>
              </>
            )}
          </button>

          {/* Print / PDF Export */}
          <div className="flex gap-2">
            <button
              id="print-export-btn"
              onClick={handlePrintExport}
              className="flex items-center gap-1.5 rounded-xl border border-[#292344] bg-[#151329] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#1B1833] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>

            <button
              id="download-pdf-btn"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 rounded-xl btn-gold-primary px-4 py-1.5 text-xs font-semibold shadow-md cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#080711]" />
              <span className="text-[#080711]">Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split-Screen Workspace (Left Editor, Right WYSIWYG Preview) */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Form Editor (5 Cols) (Hidden on Print) */}
        <div className="no-print lg:col-span-5 space-y-4 max-h-[85vh] overflow-y-auto pr-1">
          {/* Section 1: Personal Info */}
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-4 shadow-xl">
            <button
              onClick={() => toggleSection('personal')}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-[#F5F1E8] cursor-pointer"
            >
              <span>Personal & Contact Info</span>
              {collapsedSections.personal ? <ChevronDown className="h-4 w-4 text-[#AAA6B7]" /> : <ChevronUp className="h-4 w-4 text-[#AAA6B7]" />}
            </button>

            {!collapsedSections.personal && (
              <div className="mt-3 space-y-2.5">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={content.personal_info.full_name}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personal_info: { ...content.personal_info, full_name: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#292344] bg-[#0E0C1B] px-2.5 py-1.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Professional Headline"
                  value={content.personal_info.headline}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personal_info: { ...content.personal_info, headline: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#292344] bg-[#0E0C1B] px-2.5 py-1.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Email"
                    value={content.personal_info.email}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        personal_info: { ...content.personal_info, email: e.target.value },
                      })
                    }
                    className="rounded-lg border border-[#292344] bg-[#0E0C1B] px-2.5 py-1.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={content.personal_info.phone}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        personal_info: { ...content.personal_info, phone: e.target.value },
                      })
                    }
                    className="rounded-lg border border-[#292344] bg-[#0E0C1B] px-2.5 py-1.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Location (City, State)"
                    value={content.personal_info.location}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        personal_info: { ...content.personal_info, location: e.target.value },
                      })
                    }
                    className="rounded-lg border border-[#292344] bg-[#0E0C1B] px-2.5 py-1.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="GitHub URL"
                    value={content.personal_info.github_url || ''}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        personal_info: { ...content.personal_info, github_url: e.target.value },
                      })
                    }
                    className="rounded-lg border border-[#292344] bg-[#0E0C1B] px-2.5 py-1.5 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Summary */}
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-4 shadow-xl">
            <button
              onClick={() => toggleSection('summary')}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-[#F5F1E8] cursor-pointer"
            >
              <span>Executive Summary</span>
              {collapsedSections.summary ? <ChevronDown className="h-4 w-4 text-[#AAA6B7]" /> : <ChevronUp className="h-4 w-4 text-[#AAA6B7]" />}
            </button>

            {!collapsedSections.summary && (
              <div className="mt-3 space-y-2">
                <textarea
                  rows={3}
                  value={content.summary.body}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      summary: { ...content.summary, body: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-[#292344] bg-[#0E0C1B] p-2 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Section 3: Work Experience with AI Bullet Enhancer */}
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleSection('experience')}
                className="flex items-center gap-2 text-left text-xs font-bold text-[#F5F1E8] cursor-pointer"
              >
                <span>Work Experience ({content.experience.length})</span>
                {collapsedSections.experience ? <ChevronDown className="h-4 w-4 text-[#AAA6B7]" /> : <ChevronUp className="h-4 w-4 text-[#AAA6B7]" />}
              </button>

              <button
                onClick={addExperience}
                className="flex items-center gap-1 rounded bg-[#C6A75E]/15 border border-[#C6A75E]/30 px-2 py-1 text-[11px] font-semibold text-[#E1C77A] hover:bg-[#C6A75E]/25 transition cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Role
              </button>
            </div>

            {!collapsedSections.experience && (
              <div className="mt-3 space-y-4">
                {content.experience.map((exp, expIdx) => (
                  <div
                    key={exp.id || expIdx}
                    className="rounded-xl border border-[#292344] bg-[#0E0C1B] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={exp.job_title}
                        onChange={(e) => {
                          const newExp = [...content.experience];
                          newExp[expIdx].job_title = e.target.value;
                          setContent({ ...content, experience: newExp });
                        }}
                        placeholder="Job Title"
                        className="font-bold text-xs bg-transparent border-b border-transparent focus:border-[#C6A75E] focus:outline-none text-[#F5F1E8]"
                      />
                      <button
                        onClick={() => removeExperience(expIdx)}
                        className="text-[#706C7C] hover:text-[#A94D4D] transition cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={exp.company_name}
                        onChange={(e) => {
                          const newExp = [...content.experience];
                          newExp[expIdx].company_name = e.target.value;
                          setContent({ ...content, experience: newExp });
                        }}
                        placeholder="Company"
                        className="rounded border border-[#292344] bg-[#151329] px-2 py-1 text-[11px] text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={`${exp.start_date} - ${exp.end_date}`}
                        onChange={(e) => {
                          const parts = e.target.value.split('-');
                          const newExp = [...content.experience];
                          newExp[expIdx].start_date = parts[0]?.trim() || '';
                          newExp[expIdx].end_date = parts[1]?.trim() || '';
                          setContent({ ...content, experience: newExp });
                        }}
                        placeholder="2021-01 - Present"
                        className="rounded border border-[#292344] bg-[#151329] px-2 py-1 text-[11px] text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                      />
                    </div>

                    {/* Bullet Points with Google XYZ trigger */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold text-[#706C7C] uppercase">Impact Bullet Points</label>
                      {exp.bullet_points.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5">
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => {
                              const newExp = [...content.experience];
                              newExp[expIdx].bullet_points[bIdx] = e.target.value;
                              setContent({ ...content, experience: newExp });
                            }}
                            className="w-full rounded border border-[#292344] bg-[#151329] p-1.5 text-[11px] text-[#F5F1E8] font-mono focus:border-[#C6A75E] focus:outline-none"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => openBulletEnhancer(expIdx, bIdx, bullet)}
                              className="rounded bg-[#C6A75E]/15 border border-[#C6A75E]/30 p-1 text-[#E1C77A] hover:bg-[#C6A75E]/25 transition cursor-pointer"
                              title="Enhance with Google XYZ AI"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeExperienceBullet(expIdx, bIdx)}
                              className="rounded p-1 text-[#706C7C] hover:text-[#A94D4D] transition cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addExperienceBullet(expIdx)}
                        className="text-[10px] font-semibold text-[#C6A75E] hover:text-[#E1C77A] transition cursor-pointer"
                      >
                        + Add Bullet Point
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Skills Matrix */}
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-4 shadow-xl">
            <button
              onClick={() => toggleSection('skills')}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-[#F5F1E8] cursor-pointer"
            >
              <span>Skills Categories ({content.skills.length})</span>
              {collapsedSections.skills ? <ChevronDown className="h-4 w-4 text-[#AAA6B7]" /> : <ChevronUp className="h-4 w-4 text-[#AAA6B7]" />}
            </button>

            {!collapsedSections.skills && (
              <div className="mt-3 space-y-2">
                {content.skills.map((s, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <input
                      type="text"
                      value={s.category_name}
                      onChange={(e) => {
                        const newSkills = [...content.skills];
                        newSkills[sIdx].category_name = e.target.value;
                        setContent({ ...content, skills: newSkills });
                      }}
                      className="font-bold text-[11px] text-[#E1C77A] bg-transparent focus:outline-none"
                    />
                    <input
                      type="text"
                      value={s.skills_list.join(', ')}
                      onChange={(e) => {
                        const newSkills = [...content.skills];
                        newSkills[sIdx].skills_list = e.target.value.split(',').map((x) => x.trim());
                        setContent({ ...content, skills: newSkills });
                      }}
                      placeholder="React, TypeScript, Go..."
                      className="w-full rounded border border-[#292344] bg-[#0E0C1B] px-2 py-1 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live WYSIWYG Print-Ready Preview (7 Cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div
            id="printable-resume"
            className="w-full max-w-[700px] min-h-[900px] rounded-2xl border border-[#292344] bg-white p-8 sm:p-10 shadow-2xl text-slate-900 font-sans print:p-0 print:border-none print:shadow-none print:w-full"
            style={{
              fontSize: '11pt',
              lineHeight: '1.4',
            }}
          >
            {/* Resume Header */}
            <div className="border-b pb-4" style={{ borderColor: `${accentColor}30` }}>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
                {content.personal_info.full_name || 'Your Full Name'}
              </h1>
              <p className="text-xs font-semibold text-slate-700">{content.personal_info.headline}</p>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600">
                {content.personal_info.email && <span>{content.personal_info.email}</span>}
                {content.personal_info.phone && <span>• {content.personal_info.phone}</span>}
                {content.personal_info.location && <span>• {content.personal_info.location}</span>}
                {content.personal_info.github_url && <span>• {content.personal_info.github_url}</span>}
                {content.personal_info.linkedin_url && <span>• {content.personal_info.linkedin_url}</span>}
              </div>
            </div>

            {/* Summary */}
            {content.summary?.body && (
              <div className="mt-4">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: accentColor }}
                >
                  Professional Summary
                </h3>
                <p className="text-[10.5px] leading-relaxed text-slate-700">{content.summary.body}</p>
              </div>
            )}

            {/* Experience */}
            {content.experience?.length > 0 && (
              <div className="mt-4">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: accentColor }}
                >
                  Experience
                </h3>

                <div className="space-y-3">
                  {content.experience.map((exp, i) => (
                    <div key={i} className="text-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold">{exp.job_title}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {exp.start_date} – {exp.end_date}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-[10.5px] text-slate-600 font-medium">
                        <span>{exp.company_name}</span>
                        <span>{exp.location}</span>
                      </div>
                      <ul className="mt-1 space-y-1 pl-4 list-disc text-[10px] text-slate-700 leading-snug">
                        {exp.bullet_points.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {content.skills?.length > 0 && (
              <div className="mt-4">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: accentColor }}
                >
                  Technical Skills
                </h3>
                <div className="space-y-1 text-[10px] text-slate-700">
                  {content.skills.map((s, i) => (
                    <div key={i}>
                      <span className="font-bold text-slate-900">{s.category_name}: </span>
                      <span>{s.skills_list.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {content.education?.length > 0 && (
              <div className="mt-4">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: accentColor }}
                >
                  Education
                </h3>
                <div className="space-y-2">
                  {content.education.map((edu, i) => (
                    <div key={i} className="text-[10px]">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>
                          {edu.degree} in {edu.field_of_study}
                        </span>
                        <span className="text-slate-500 font-normal">
                          {edu.start_date} – {edu.end_date}
                        </span>
                      </div>
                      <div className="text-slate-600">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {content.projects?.length > 0 && (
              <div className="mt-4">
                <h3
                  className="text-xs font-bold uppercase tracking-wider mb-1.5"
                  style={{ color: accentColor }}
                >
                  Key Projects
                </h3>
                <div className="space-y-2">
                  {content.projects.map((proj, i) => (
                    <div key={i} className="text-[10px] text-slate-700">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{proj.title}</span>
                        {proj.tech_stack && (
                          <span className="text-[9.5px] font-normal text-slate-500">
                            [{proj.tech_stack.join(', ')}]
                          </span>
                        )}
                      </div>
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                        {proj.bullet_points?.map((bp, bidx) => (
                          <li key={bidx}>{bp}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google XYZ Enhancer Modal */}
      <BulletEnhancerModal
        isOpen={enhancerOpen}
        onClose={() => setEnhancerOpen(false)}
        initialBullet={bulletToEnhance}
        onApplyBullet={applyEnhancedBullet}
        creditsRemaining={creditsRemaining}
        onOpenCreditsModal={onOpenCreditsModal}
      />
    </div>
  );
};
