import React, { useEffect, useMemo, useState } from 'react';
import { FaUniversity, FaUsers, FaFilter, FaSearch, FaExclamationTriangle, FaDownload, FaTrash } from 'react-icons/fa';
import { academicsAPI } from '../../services/api/academicsAPI';
import { adminUsersAPI } from '../../services/api/adminUsersAPI';

const yearOptions = Array.from({ length: 27 }, (_, idx) => 2000 + idx); // 2000-2026

const AdminStudentsPage = () => {
  const [institutionType, setInstitutionType] = useState('university');
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [structure, setStructure] = useState(null);
  const [branchCode, setBranchCode] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [section, setSection] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await academicsAPI.getInstitutions(institutionType);
        setInstitutions(res || []);
      } catch (err) {
        setError('Unable to load institutions.');
      }
    };
    loadInstitutions();
    setSelectedInstitution('');
    setStructure(null);
    setBranchCode('');
    setBatchYear('');
    setCurrentYear('');
    setSection('');
    setStudents([]);
  }, [institutionType]);

  useEffect(() => {
    const loadStructure = async () => {
      if (!selectedInstitution) {
        setStructure(null);
        return;
      }
      try {
        const res = await academicsAPI.getStructure(selectedInstitution);
        setStructure(res);
      } catch (err) {
        setError('Unable to load branches for this institution.');
        setStructure(null);
      }
    };
    loadStructure();
    setBranchCode('');
    setBatchYear('');
    setCurrentYear('');
    setSection('');
    setStudents([]);
  }, [selectedInstitution]);

  const branchOptions = useMemo(() => {
    if (!structure?.branches) return [];
    if (institutionType === 'college') {
      return structure.branches.filter((b) => b.category === 'tech');
    }
    return structure.branches;
  }, [structure, institutionType]);

  const sectionOptions = useMemo(() => {
    if (!batchYear || !branchCode) return [];
    const prefix = `${batchYear}${branchCode.toUpperCase()}`;
    return Array.from({ length: 30 }, (_, idx) => `${prefix}${idx + 1}`);
  }, [batchYear, branchCode]);

  const canSearch =
    selectedInstitution && branchCode && batchYear && currentYear && section;

  const handleSearch = async () => {
    if (!canSearch) {
      setError('Please select all fields before searching.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await adminUsersAPI.listStudents({
        institutionId: selectedInstitution,
        branchCode: branchCode.toUpperCase(),
        batchYear: Number(batchYear),
        currentYear: Number(currentYear),
        section: section.toUpperCase(),
      });
      setStudents(res.data?.students || res.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const buildStudentRows = () => {
    if (!students || students.length === 0) return [];
    return students.map((s) => [
      `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      s.email || '',
      s.institution?.name || '',
      s.branch?.code || '',
      s.batchYear ?? '',
      s.currentYear ?? '',
      s.section || '',
    ]);
  };

  const toCSV = () => {
    const headers = ['Name', 'Email', 'Institution', 'Branch', 'Batch', 'Year', 'Section'];
    const rows = buildStudentRows();
    if (!rows.length) return '';
    return [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  const download = (ext) => {
    const csv = toCSV();
    if (!csv) {
      alert('No student data to download');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}? This will permanently remove the student and all their exam attempts from the database. This action cannot be undone.`)) {
      return;
    }

    setDeletingId(studentId);
    setError('');

    try {
      await adminUsersAPI.deleteStudent(studentId);
      // Remove the student from the UI
      setStudents(prevStudents => prevStudents.filter(s => (s._id || s.id) !== studentId));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete student');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaUniversity className="text-sky-600" />
            <div>
              <p className="text-sm text-slate-500">Admin • Students</p>
              <h1 className="text-2xl font-semibold text-slate-900">Students Directory</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <FaFilter />
            <span>Filter by hierarchy</span>
          </div>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Institution Type</label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                value={institutionType}
                onChange={(e) => setInstitutionType(e.target.value)}
              >
                <option value="university">University</option>
                <option value="college">College</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Institution</label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
              >
                <option value="">Select</option>
                {institutions
                  .filter((i) => i.type === institutionType)
                  .map((inst) => (
                    <option key={inst._id || inst.id} value={inst._id || inst.id}>
                      {inst.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Branch</label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                disabled={!branchOptions.length}
              >
                <option value="">Select</option>
                {branchOptions.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Batch Year</label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                disabled={!branchCode}
              >
                <option value="">Select</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Current Year (1-8)</label>
              <input
                type="number"
                min="1"
                max="8"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                disabled={!batchYear}
                placeholder="e.g., 2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Section</label>
              <input
                list="section-options"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                disabled={!batchYear || !branchCode}
                placeholder="Select or type"
              />
              <datalist id="section-options">
                {sectionOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500 mt-1">
                Suggested: {sectionOptions.slice(0, 3).join(', ')}...
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 flex items-center space-x-2"
            >
              <FaSearch />
              <span>{loading ? 'Searching...' : 'Proceed'}</span>
            </button>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FaUsers className="text-sky-600" />
              <div>
                <p className="text-xs uppercase text-slate-500 tracking-wide">Results</p>
                <h2 className="text-lg font-semibold text-slate-900">Students</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{students.length} found</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => download('csv')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  disabled={students.length === 0}
                >
                  <FaDownload className="w-3 h-3" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => download('xlsx')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  disabled={students.length === 0}
                >
                  <FaDownload className="w-3 h-3" />
                  Excel
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {['Name', 'Email', 'Institution', 'Branch', 'Batch', 'Year', 'Section', 'Action'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && students.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-sm text-slate-500 text-center">
                      No students found. Adjust filters and try again.
                    </td>
                  </tr>
                )}
                {students.map((s) => {
                  const studentId = s._id || s.id;
                  const studentName = `${s.firstName} ${s.lastName}`;
                  const isDeleting = deletingId === studentId;
                  
                  return (
                    <tr key={studentId} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        <div className="flex items-center justify-between">
                          <span>{studentName}</span>
                          <button
                            onClick={() => handleDeleteStudent(studentId, studentName)}
                            disabled={isDeleting || loading}
                            className="ml-2 p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove student"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{s.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{s.institution?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{s.branch?.code || '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{s.batchYear}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{s.currentYear}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{s.section}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {isDeleting && <span className="text-xs text-slate-400">Deleting...</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminStudentsPage;










