import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileUpload,
  FaPlus,
  FaSave,
  FaTrash,
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { adminAuthAPI } from '../../services/api/adminAuthAPI';
import { testAPI } from '../../services/api/testAPI';
import { academicsAPI } from '../../services/api/academicsAPI';
import { adminUsersAPI } from '../../services/api/adminUsersAPI';

const emptyQuestion = () => ({
  id: `local-${Date.now()}`,
  prompt: '',
  options: ['', ''],
  correctOptions: [],
  meta: { source: 'manual' },
});

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeTeacherId = (value) => value.trim().toUpperCase();

const normalizeAnswer = (raw, options) => {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => normalizeAnswer(item, options))
      .flat()
      .filter(Boolean);
  }

  if (typeof raw === 'number' && options[raw]) return [options[raw]];
  if (typeof raw === 'string') {
    if (options.includes(raw)) return [raw];
    const parsedIndex = Number(raw);
    if (!Number.isNaN(parsedIndex) && options[parsedIndex]) return [options[parsedIndex]];
    return [raw];
  }

  return [];
};

const normalizeQuestion = (item, idx) => {
  const prompt = item.prompt || item.question || item.text || `Question ${idx + 1}`;
  const options =
    item.options ||
    item.choices ||
    item.answers ||
    (Array.isArray(item) ? item : []) ||
    item?.meta?.choices ||
    [];

  const safeOptions = Array.isArray(options) && options.length > 0 ? options : ['Option A', 'Option B'];
  const answer = item.correctAnswer || item.answer || item.correct || item.key || item.correctOptions;

  return {
    id: item.id || `q-${idx}-${Date.now()}`,
    prompt,
    options: safeOptions,
    correctOptions: normalizeAnswer(answer, safeOptions),
    meta: { source: 'upload' },
  };
};

const extractQuestionsFromJSON = (payload) => {
  const visited = new WeakSet();
  const walk = (node) => {
    if (!node || typeof node !== 'object') return [];
    if (visited.has(node)) return [];
    visited.add(node);

    if (Array.isArray(node)) return node;
    if (Array.isArray(node.questions)) return node.questions;

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) return value;
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === 'object') {
        const result = walk(value);
        if (result.length) return result;
      }
    }

    return [];
  };

  const found = walk(payload);
  return found.map((q, idx) => normalizeQuestion(q, idx));
};

const CreateTest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'mcq';

  const [step, setStep] = useState(1);
  const [ingestionMode, setIngestionMode] = useState('upload'); // upload | manual
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [parseError, setParseError] = useState('');
  const [parseSummary, setParseSummary] = useState('');
  const [schedule, setSchedule] = useState({
    name: '',
    startDate: '',
    startTime: '',
    windowCloseDate: '',
    windowCloseTime: '',
    duration: '',
  });
  const [allocations, setAllocations] = useState({
    // Students allocation will be driven by academic filters instead of raw emails
    studentFilters: [],
    teacherIds: [],
  });
  const [allocationForm, setAllocationForm] = useState({
    institutionType: 'university',
    institutionId: '',
    branchCode: '',
    batchYear: '',
    currentYear: '',
    section: '',
    teacherUniversity: '',
    teacherIdInput: '',
  });
  const [institutions, setInstitutions] = useState([]);
  const [structure, setStructure] = useState(null);
  const [allocationStats, setAllocationStats] = useState({
    studentCount: 0,
    teacherCount: 0,
  });
  const [previewedStudents, setPreviewedStudents] = useState([]);
  const [previewedTeachers, setPreviewedTeachers] = useState([]);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [allocationError, setAllocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!adminAuthAPI.isAuthenticated()) {
      navigate('/auth/admin-login', { replace: true });
    }
  }, [navigate]);

  // Load institutions for allocation filters
  useEffect(() => {
    let cancelled = false;
    const loadInstitutions = async () => {
      try {
        const data = await academicsAPI.getInstitutions(allocationForm.institutionType);
        if (!cancelled) {
          setInstitutions(Array.isArray(data?.data) ? data.data : data || []);
        }
      } catch (error) {
        console.error('Failed to load institutions', error);
      }
    };
    loadInstitutions();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocationForm.institutionType]);

  const handleFileUpload = async (file) => {
    setParseError('');
    setParseSummary('');
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = extractQuestionsFromJSON(json);

      if (!parsed.length) {
        setParseError('No questions found. Ensure the JSON contains an array or "questions" field.');
        return;
      }

      const cleaned = parsed.map((q) => ({
        ...q,
        options: q.options.filter(Boolean),
      }));

      setQuestions(cleaned);
      setIngestionMode('upload');
      setParseSummary(`Imported ${cleaned.length} question(s) successfully.`);
    } catch (error) {
      setParseError(`Unable to read file: ${error.message}`);
    }
  };

  const handleInstitutionChange = async (institutionId) => {
    setAllocationForm((prev) => ({
      ...prev,
      institutionId,
      branchCode: '',
      batchYear: '',
      currentYear: '',
      section: '',
    }));
    setStructure(null);
    if (!institutionId) return;
    try {
      const data = await academicsAPI.getStructure(institutionId);
      setStructure(data?.data || data || null);
    } catch (error) {
      console.error('Failed to load institution structure', error);
      setStructure(null);
    }
  };

  const addStudentFilter = () => {
    setAllocationError('');
    const { institutionId, branchCode, batchYear, currentYear, section } = allocationForm;
    if (!institutionId || !branchCode || !batchYear || !currentYear || !section.trim()) {
      setAllocationError('Fill institution, branch, batch year, current year and section before adding.');
      return;
    }
    const filter = {
      institutionId,
      branchCode,
      batchYear: Number(batchYear),
      currentYear: Number(currentYear),
      section: section.trim().toUpperCase(),
    };

    const exists = allocations.studentFilters.some(
      (f) =>
        f.institutionId === filter.institutionId &&
        f.branchCode === filter.branchCode &&
        f.batchYear === filter.batchYear &&
        f.currentYear === filter.currentYear &&
        f.section === filter.section,
    );
    if (exists) {
      setAllocationError('This student group is already added.');
      return;
    }

    setAllocations((prev) => ({
      ...prev,
      studentFilters: [...prev.studentFilters, filter],
    }));
  };

  const removeStudentFilter = (index) => {
    setAllocations((prev) => ({
      ...prev,
      studentFilters: prev.studentFilters.filter((_, idx) => idx !== index),
    }));
    // Clear preview when filters change
    if (allocations.studentFilters.length === 1) {
      setPreviewedStudents([]);
      setAllocationStats((prev) => ({ ...prev, studentCount: 0 }));
    }
  };

  const addTeacherId = () => {
    setAllocationError('');
    const raw = allocationForm.teacherIdInput;
    const id = normalizeTeacherId(raw);
    if (!id) {
      setAllocationError('Enter a teacher ID before adding.');
      return;
    }
    if (!/^[A-Z0-9]{6,12}$/.test(id)) {
      setAllocationError('Teacher ID must be 6-12 alphanumeric characters.');
      return;
    }
    if (allocations.teacherIds.includes(id)) {
      setAllocationError('This teacher ID is already added.');
      return;
    }
    setAllocations((prev) => ({
      ...prev,
      teacherIds: [...prev.teacherIds, id],
    }));
    setAllocationForm((prev) => ({ ...prev, teacherIdInput: '' }));
  };

  const removeTeacherId = (id) => {
    setAllocations((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.filter((t) => t !== id),
    }));
    // Update teacher preview when removed
    setPreviewedTeachers((prev) => prev.filter((t) => t.teacherId !== id));
  };

  const handleTeacherExcelUpload = async (file) => {
    if (!file) return;
    setAllocationError('');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (!rows.length) {
        setAllocationError('Uploaded file is empty.');
        return;
      }
      const [headerRow, ...dataRows] = rows;
      const headerIndex = headerRow.findIndex((h) =>
        String(h || '')
          .toLowerCase()
          .includes('teacher'),
      );
      if (headerIndex === -1) {
        setAllocationError('Could not find a column for teacher IDs. Add a header like "teacherId".');
        return;
      }
      const parsedIds = dataRows
        .map((row) => normalizeTeacherId(String(row[headerIndex] || '')))
        .filter((id) => id && /^[A-Z0-9]{6,12}$/.test(id));
      if (!parsedIds.length) {
        setAllocationError('No valid teacher IDs found in the file.');
        return;
      }
      setAllocations((prev) => ({
        ...prev,
        teacherIds: Array.from(new Set([...(prev.teacherIds || []), ...parsedIds])),
      }));
    } catch (error) {
      console.error('Failed to parse teacher Excel file', error);
      setAllocationError('Failed to read teacher file. Please upload a valid .xlsx/.xls file.');
    }
  };

  const refreshAllocationStats = async () => {
    if (!allocations.studentFilters.length) {
      setAllocationStats((prev) => ({ ...prev, studentCount: 0 }));
      setPreviewedStudents([]);
      return;
    }
    setAllocationLoading(true);
    setAllocationError('');
    try {
      const allStudents = [];
      const seen = new Set();
      // Fetch students for each filter and de-duplicate by id.
      // This is a best-effort count; actual backend allocation can enforce stricter rules.
      // eslint-disable-next-line no-restricted-syntax
      for (const filter of allocations.studentFilters) {
        // eslint-disable-next-line no-await-in-loop
        const { students } = await adminUsersAPI.listStudents(filter);
        students.forEach((s) => {
          const id = s.id || s._id || s.email;
          if (id && !seen.has(id)) {
            seen.add(id);
            allStudents.push({
              id: s.id || s._id,
              email: s.email,
              firstName: s.firstName,
              lastName: s.lastName,
              name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'N/A',
            });
          }
        });
      }
      setAllocationStats((prev) => ({ ...prev, studentCount: allStudents.length }));
      setPreviewedStudents(allStudents);
    } catch (error) {
      console.error('Failed to preview allocated students', error);
      setAllocationError('Unable to preview allocated students. You can still save the schedule.');
      setPreviewedStudents([]);
    } finally {
      setAllocationLoading(false);
    }
  };

  // Fetch teacher details when teacher IDs are added
  useEffect(() => {
    const fetchTeacherDetails = async () => {
      if (allocations.teacherIds.length === 0) {
        setPreviewedTeachers([]);
        return;
      }

      try {
        const { teachers } = await adminUsersAPI.getTeachersByIds(allocations.teacherIds);
        setPreviewedTeachers(
          teachers.map((t) => ({
            teacherId: t.teacherId,
            email: t.email,
            firstName: t.firstName,
            lastName: t.lastName,
            name: `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'N/A',
            university: t.university,
          }))
        );
        setAllocationStats((prev) => ({ ...prev, teacherCount: teachers.length }));
      } catch (error) {
        console.error('Failed to fetch teacher details', error);
        // Set placeholder data for teachers that couldn't be found
        setPreviewedTeachers(
          allocations.teacherIds.map((id) => ({
            teacherId: id,
            email: 'N/A',
            name: `Teacher ID: ${id}`,
            university: 'N/A',
          }))
        );
      }
    };

    fetchTeacherDetails();
  }, [allocations.teacherIds]);

  const updateQuestion = (id, updates) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addOption = (id) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, options: [...q.options, ''] } : q)),
    );
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => (prev.length === 1 ? prev : prev.filter((q) => q.id !== id)));
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
    setIngestionMode('manual');
  };

  const validQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          q.prompt.trim().length > 0 && q.options.filter((opt) => opt.trim().length > 0).length >= 2,
      ),
    [questions],
  );

  const canProceedStep1 = validQuestions.length > 0 && !parseError;

  const handleNext = () => {
    if (step === 1 && !canProceedStep1) {
      setParseError('Add at least one valid question before proceeding.');
      return;
    }

    if (step === 2) {
      const { startDate, startTime, windowCloseDate, windowCloseTime, duration, name } = schedule;
      if (!name.trim()) {
        setToast('Enter a test name before scheduling.');
        return;
      }
      if (!startDate || !startTime || !windowCloseDate || !windowCloseTime || !duration) {
        setToast('All scheduling fields are required.');
        return;
      }

      const start = new Date(`${startDate}T${startTime}`);
      const close = new Date(`${windowCloseDate}T${windowCloseTime}`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(close.getTime())) {
        setToast('Provide valid dates and times.');
        return;
      }
      if (start < new Date()) {
        setToast('Start time must be in the future.');
        return;
      }
      if (close <= start) {
        setToast('Window close must be after start time.');
        return;
      }
      if (Number(duration) <= 0) {
        setToast('Duration must be greater than zero.');
        return;
      }
    }

    setToast('');
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (allocations.studentFilters.length === 0 && allocations.teacherIds.length === 0) {
      setToast('Allocate the test to at least one student group or one teacher.');
      return;
    }

    try {
      setSubmitting(true);
      const start = new Date(`${schedule.startDate}T${schedule.startTime}`).toISOString();
      const windowClose = new Date(`${schedule.windowCloseDate}T${schedule.windowCloseTime}`).toISOString();

      const result = await testAPI.create({
        name: schedule.name.trim(),
        type,
        questions: validQuestions,
        schedule: {
          start,
          windowClose,
          duration: Number(schedule.duration),
        },
        allocations: {
          studentFilters: allocations.studentFilters,
          teacherIds: allocations.teacherIds,
          stats: allocationStats,
        },
      });

      const allocatedCount = result?.allocatedStudents || allocationStats?.totalStudents || 0;
      setToast(`Test created and scheduled successfully. Allocated to ${allocatedCount} students.`);
      setTimeout(() => navigate('/admin/scheduled-exams'), 1500);
    } catch (error) {
      console.error('Test creation error:', error);
      const errorMessage = error.message || 'Failed to save the test. Please try again.';
      setToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300"
            >
              <FaArrowLeft />
            </button>
            <div>
              <p className="text-sm text-slate-500">Admin • Test Builder</p>
              <h1 className="text-2xl font-semibold text-slate-900">Create {type.toUpperCase()} Test</h1>
            </div>
          </div>
          {toast && (
            <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <FaExclamationTriangle />
              <span>{toast}</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`rounded-xl border px-4 py-3 ${
                step === num
                  ? 'border-sky-400 bg-sky-50 text-sky-700'
                  : step > num
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <p className="text-sm font-semibold">
                Step {num}:{' '}
                {num === 1
                  ? 'Questions'
                  : num === 2
                  ? 'Schedule'
                  : 'Allocation'}
              </p>
            </div>
          ))}
        </div>

        {step === 1 && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
                <p className="text-sm text-slate-600">
                  Upload a JSON file or create questions manually. Supports arrays or objects containing a
                  &quot;questions&quot; field.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIngestionMode('upload')}
                  className={`px-3 py-1 text-sm rounded-md border ${
                    ingestionMode === 'upload'
                      ? 'border-sky-500 text-sky-700 bg-sky-50'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setIngestionMode('manual')}
                  className={`px-3 py-1 text-sm rounded-md border ${
                    ingestionMode === 'manual'
                      ? 'border-sky-500 text-sky-700 bg-sky-50'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {ingestionMode === 'upload' && (
              <div className="border border-dashed border-slate-300 rounded-xl p-5 bg-slate-50">
                <label className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
                  <FaFileUpload className="text-sky-500 text-2xl" />
                  <span className="text-sm text-slate-600">
                    Drag & drop or choose a .json file containing questions
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                </label>
                {parseSummary && (
                  <p className="mt-3 text-sm text-emerald-700 flex items-center space-x-2">
                    <FaCheckCircle />
                    <span>{parseSummary}</span>
                  </p>
                )}
                {parseError && (
                  <p className="mt-3 text-sm text-amber-700 flex items-center space-x-2">
                    <FaExclamationTriangle />
                    <span>{parseError}</span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-800">Question {idx + 1}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">
                        Source: {q.meta?.source === 'upload' ? 'Upload' : 'Manual'}
                      </span>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="p-2 text-slate-500 hover:text-red-600"
                        title="Remove question"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                    rows={3}
                    placeholder="Enter the question prompt"
                    value={q.prompt}
                    onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                  />

                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Options</p>
                    {q.options.map((opt, optIdx) => (
                      <div key={`${q.id}-opt-${optIdx}`} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={q.correctOptions.includes(opt)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const updatedOpt = opt || `Option ${optIdx + 1}`;
                            updateQuestion(q.id, {
                              correctOptions: checked
                                ? Array.from(new Set([...(q.correctOptions || []), updatedOpt]))
                                : (q.correctOptions || []).filter((c) => c !== updatedOpt),
                            });
                          }}
                        />
                        <input
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                          placeholder={`Option ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            const previous = newOptions[optIdx];
                            newOptions[optIdx] = e.target.value;
                            const corrected = (q.correctOptions || []).map((c) =>
                              c === previous ? e.target.value : c,
                            );
                            updateQuestion(q.id, { options: newOptions, correctOptions: corrected });
                          }}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(q.id)}
                      className="text-sm text-sky-600 hover:text-sky-700 flex items-center space-x-2"
                    >
                      <FaPlus />
                      <span>Add option</span>
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={addQuestion}
                className="w-full border border-slate-300 border-dashed rounded-xl py-3 text-sky-600 flex items-center justify-center space-x-2 hover:border-sky-500 bg-white"
              >
                <FaPlus />
                <span>Add another question</span>
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <FaCalendarAlt className="text-sky-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Schedule Test</h2>
                <p className="text-sm text-slate-600">Define availability and duration.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Test Name</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  placeholder="e.g., Midterm MCQ Assessment"
                  value={schedule.name}
                  onChange={(e) => setSchedule((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={schedule.duration}
                  onChange={(e) => setSchedule((s) => ({ ...s, duration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={schedule.startDate}
                  onChange={(e) => setSchedule((s) => ({ ...s, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Start Time</label>
                <input
                  type="time"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={schedule.startTime}
                  onChange={(e) => setSchedule((s) => ({ ...s, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Window Close Date</label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={schedule.windowCloseDate}
                  onChange={(e) => setSchedule((s) => ({ ...s, windowCloseDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Window Close Time</label>
                <input
                  type="time"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={schedule.windowCloseTime}
                  onChange={(e) => setSchedule((s) => ({ ...s, windowCloseTime: e.target.value }))}
                />
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <FaSave className="text-sky-500" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Allocate Test</h2>
                <p className="text-sm text-slate-600">
                  Choose which students and proctoring teachers should see this test in their dashboards.
                </p>
              </div>
            </div>

            {allocationError && (
              <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                <FaExclamationTriangle />
                <span>{allocationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Students allocation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Students allocation</p>
                    <p className="text-xs text-slate-500">
                      Filter by institution, branch, year and section. You can add multiple groups.
                    </p>
                  </div>
                  <span className="text-xs rounded-full bg-sky-50 text-sky-700 px-3 py-1 border border-sky-100">
                    {allocationStats.studentCount} matched (preview)
                  </span>
                </div>

                <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Type</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                        value={allocationForm.institutionType}
                        onChange={(e) =>
                          setAllocationForm((prev) => ({
                            ...prev,
                            institutionType: e.target.value,
                            institutionId: '',
                          }))
                        }
                      >
                        <option value="university">University</option>
                        <option value="college">College</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Institution</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                        value={allocationForm.institutionId}
                        onChange={(e) => handleInstitutionChange(e.target.value)}
                      >
                        <option value="">Select</option>
                        {institutions.map((inst) => (
                          <option key={inst._id || inst.id} value={inst._id || inst.id}>
                            {inst.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Branch</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                        disabled={!structure}
                        value={allocationForm.branchCode}
                        onChange={(e) =>
                          setAllocationForm((prev) => ({
                            ...prev,
                            branchCode: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select</option>
                        {structure?.branches?.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Batch (Year of joining)</label>
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                        placeholder="e.g. 2023"
                        value={allocationForm.batchYear}
                        onChange={(e) =>
                          setAllocationForm((prev) => ({
                            ...prev,
                            batchYear: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Current year</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                        value={allocationForm.currentYear}
                        onChange={(e) =>
                          setAllocationForm((prev) => ({
                            ...prev,
                            currentYear: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select</option>
                        {[1, 2, 3, 4, 5].map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Section</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                        placeholder="e.g. A"
                        value={allocationForm.section}
                        onChange={(e) =>
                          setAllocationForm((prev) => ({
                            ...prev,
                            section: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={addStudentFilter}
                      className="px-3 py-1.5 text-xs rounded-md bg-sky-600 text-white hover:bg-sky-700 flex items-center space-x-1"
                    >
                      <FaPlus />
                      <span>Add group</span>
                    </button>
                    <button
                      type="button"
                      onClick={refreshAllocationStats}
                      disabled={!allocations.studentFilters.length || allocationLoading}
                      className="px-3 py-1.5 text-xs rounded-md border border-slate-200 text-slate-700 disabled:opacity-60 bg-white"
                    >
                      {allocationLoading ? 'Checking…' : 'Preview students'}
                    </button>
                  </div>

                  {allocations.studentFilters.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs font-medium text-slate-700">Added groups</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {allocations.studentFilters.map((f, idx) => (
                          <div
                            key={`${f.institutionId}-${f.branchCode}-${f.batchYear}-${f.currentYear}-${f.section}-${idx}`}
                            className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-2 py-1"
                          >
                            <span>
                              {f.branchCode} • Batch {f.batchYear} • Year {f.currentYear} • Sec {f.section}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeStudentFilter(idx)}
                              className="text-slate-400 hover:text-red-500 px-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Students List */}
                  {previewedStudents.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900">
                          Preview: {previewedStudents.length} Student(s)
                        </p>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-lg p-2">
                        {previewedStudents.map((student, idx) => (
                          <div
                            key={student.id || student.email || idx}
                            className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-slate-50 rounded border-b border-slate-100 last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {student.name}
                              </p>
                              <p className="text-slate-600 truncate text-[11px]">{student.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher allocation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Teacher allocation</p>
                    <p className="text-xs text-slate-500">
                      Add one or more proctor teacher IDs or upload a file containing them.
                    </p>
                  </div>
                  <span className="text-xs rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 border border-emerald-100">
                    {allocations.teacherIds.length} teacher(s)
                  </span>
                </div>

                <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">University (for reference)</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                      placeholder="Enter university / college name"
                      value={allocationForm.teacherUniversity}
                      onChange={(e) =>
                        setAllocationForm((prev) => ({
                          ...prev,
                          teacherUniversity: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Teacher ID</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                        placeholder="e.g. TC1234"
                        value={allocationForm.teacherIdInput}
                        onChange={(e) =>
                          setAllocationForm((prev) => ({
                            ...prev,
                            teacherIdInput: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={addTeacherId}
                        className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Only the ID is stored; you can map it to a specific teacher record on the backend.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Upload teacher IDs (Excel)</label>
                    <label className="flex flex-col items-center justify-center space-y-1 cursor-pointer border border-dashed border-slate-300 rounded-lg py-3 bg-white">
                      <FaFileUpload className="text-sky-500 text-base" />
                      <span className="text-[11px] text-slate-600">
                        Upload .xlsx / .xls file with a column named &quot;teacherId&quot;
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => handleTeacherExcelUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>

                  {allocations.teacherIds.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-700">Added teacher IDs</p>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {allocations.teacherIds.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center text-[11px] bg-white border border-slate-200 rounded-full px-2 py-0.5"
                          >
                            {id}
                            <button
                              type="button"
                              onClick={() => removeTeacherId(id)}
                              className="ml-1 text-slate-400 hover:text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Teachers List */}
                  {previewedTeachers.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900">
                          Preview: {previewedTeachers.length} Teacher(s)
                        </p>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-lg p-2">
                        {previewedTeachers.map((teacher, idx) => (
                          <div
                            key={teacher.teacherId || idx}
                            className="flex items-center justify-between text-xs py-1.5 px-2 hover:bg-slate-50 rounded border-b border-slate-100 last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">
                                {teacher.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                                <span className="truncate">{teacher.email}</span>
                                {teacher.teacherId && (
                                  <span className="text-slate-400">• ID: {teacher.teacherId}</span>
                                )}
                              </div>
                              {teacher.university && (
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {teacher.university}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">Summary</p>
              <p>{validQuestions.length} question(s) ready • Duration {schedule.duration || 0} min</p>
              <p>
                Start: {schedule.startDate || '—'} {schedule.startTime || '—'} | Window close:{' '}
                {schedule.windowCloseDate || '—'} {schedule.windowCloseTime || '—'}
              </p>
              <p>
                Students:{' '}
                {allocations.studentFilters.length > 0
                  ? `${allocations.studentFilters.length} group(s) • approx. ${allocationStats.studentCount} learner(s)`
                  : 'Pending'}
              </p>
              <p>
                Teachers:{' '}
                {allocations.teacherIds.length > 0 ? `${allocations.teacherIds.length} proctor(s)` : 'Pending'}
              </p>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-4 py-2 text-sm rounded-md border border-slate-200 text-slate-700 disabled:opacity-60 bg-white"
          >
            Back
          </button>
          <div className="flex items-center space-x-3">
            {step < 3 && (
              <button
                onClick={handleNext}
                className="px-5 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700"
              >
                Proceed
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"
              >
                {submitting ? 'Saving...' : 'Save & Schedule'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTest;

