import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import { academicsAPI } from '../../services/api/academicsAPI';
import { adminUsersAPI } from '../../services/api/adminUsersAPI';

const yearOptions = Array.from({ length: 27 }, (_, idx) => 2000 + idx); // 2000-2026

const StudentFilter = ({ onStudentsSelected, selectedFilters = [] }) => {
  const [institutionType, setInstitutionType] = useState('university');
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [structure, setStructure] = useState(null);
  const [branchCode, setBranchCode] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [section, setSection] = useState('');
  const [error, setError] = useState('');

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

  const canAddFilter =
    selectedInstitution && branchCode && batchYear && currentYear && section;

  const handleAddFilter = () => {
    if (!canAddFilter) {
      setError('Please select all fields before adding filter.');
      return;
    }

    const newFilter = {
      institutionId: selectedInstitution,
      branchCode: branchCode.toUpperCase(),
      batchYear: Number(batchYear),
      currentYear: Number(currentYear),
      section: section.toUpperCase(),
    };

    // Check if this filter already exists
    const filterExists = selectedFilters.some(
      (f) =>
        f.institutionId === newFilter.institutionId &&
        f.branchCode === newFilter.branchCode &&
        f.batchYear === newFilter.batchYear &&
        f.currentYear === newFilter.currentYear &&
        f.section === newFilter.section
    );

    if (filterExists) {
      setError('This filter combination already exists.');
      return;
    }

    onStudentsSelected([...selectedFilters, newFilter]);
    setError('');
    // Reset form
    setBranchCode('');
    setBatchYear('');
    setCurrentYear('');
    setSection('');
  };

  const handleRemoveFilter = (index) => {
    const newFilters = selectedFilters.filter((_, i) => i !== index);
    onStudentsSelected(newFilters);
  };

  const getFilterLabel = (filter) => {
    const institution = institutions.find((i) => (i._id || i.id) === filter.institutionId);
    return `${institution?.name || 'Unknown'} - ${filter.branchCode} - Batch ${filter.batchYear} - Year ${filter.currentYear} - Section ${filter.section}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
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
            onClick={handleAddFilter}
            disabled={!canAddFilter}
            className="px-4 py-2 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60 flex items-center space-x-2"
          >
            <FaSearch />
            <span>Add Filter</span>
          </button>
        </div>
      </div>

      {selectedFilters.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Selected Filters:</p>
          <div className="space-y-2">
            {selectedFilters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-slate-700">{getFilterLabel(filter)}</span>
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFilter;

