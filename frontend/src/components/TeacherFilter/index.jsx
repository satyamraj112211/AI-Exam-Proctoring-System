import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';
import { adminUsersAPI } from '../../services/api/adminUsersAPI';

const TeacherFilter = ({ onTeachersSelected, selectedTeachers = [] }) => {
  const [university, setUniversity] = useState('');
  const [universities, setUniversities] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUniversities, setSelectedUniversities] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch universities for autocomplete
  useEffect(() => {
    const fetchUniversities = async () => {
      if (university.trim().length >= 1) {
        try {
          const data = await adminUsersAPI.getUniversities(university.trim());
          setUniversities(data.universities || []);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Error fetching universities:', err);
          setUniversities([]);
        }
      } else {
        setUniversities([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchUniversities, 300);
    return () => clearTimeout(debounceTimer);
  }, [university]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUniversitySelect = async (selectedUniversity) => {
    // Check if already selected
    if (selectedUniversities.includes(selectedUniversity)) {
      setError('This university is already selected.');
      return;
    }

    setUniversity('');
    setShowSuggestions(false);
    setError('');
    setLoading(true);

    try {
      // Fetch all teachers from this university
      // Use exact university name from autocomplete (which comes from database)
      const res = await adminUsersAPI.getTeachersByUniversity(selectedUniversity);
      
      // Handle different response structures
      let fetchedTeachers = [];
      if (res?.data?.teachers) {
        fetchedTeachers = res.data.teachers;
      } else if (res?.teachers) {
        fetchedTeachers = res.teachers;
      } else if (Array.isArray(res)) {
        fetchedTeachers = res;
      } else if (res?.data && Array.isArray(res.data)) {
        fetchedTeachers = res.data;
      }

      if (!fetchedTeachers || fetchedTeachers.length === 0) {
        setError(`No teachers found for "${selectedUniversity}". Please verify that teachers with this university name exist in the database.`);
        setLoading(false);
        return;
      }

      // Add all teachers from this university to selected list
      // Filter out any teachers that are already selected
      const newTeachers = fetchedTeachers.filter(
        (teacher) => {
          const teacherId = teacher._id || teacher.id;
          return teacherId && !selectedTeachers.some((t) => (t._id || t.id) === teacherId);
        }
      );

      // Add university to selected list
      const updatedUniversities = [...selectedUniversities, selectedUniversity];
      setSelectedUniversities(updatedUniversities);
      
      // Update count immediately for this university
      setUniversityCounts(prev => ({
        ...prev,
        [selectedUniversity]: fetchedTeachers.length
      }));
      setLoadingCounts(prev => ({
        ...prev,
        [selectedUniversity]: false
      }));
      
      // Add all new teachers to the selected list
      onTeachersSelected([...selectedTeachers, ...newTeachers]);
      
      // Clear any previous errors
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch teachers from this university.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUniversity = (universityToRemove) => {
    // Remove all teachers from this university
    const teachersToRemove = selectedTeachers.filter(
      (teacher) => teacher.university === universityToRemove
    );
    const remainingTeachers = selectedTeachers.filter(
      (teacher) => teacher.university !== universityToRemove
    );

    setSelectedUniversities(selectedUniversities.filter((u) => u !== universityToRemove));
    onTeachersSelected(remainingTeachers);
  };

  const handleInputChange = (e) => {
    setUniversity(e.target.value);
    setError('');
  };

  const handleInputFocus = () => {
    if (university.trim().length >= 1 && universities.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Get teachers grouped by university for display
  const teachersByUniversity = selectedTeachers.reduce((acc, teacher) => {
    const uni = teacher.university || 'Unknown';
    if (!acc[uni]) {
      acc[uni] = [];
    }
    acc[uni].push(teacher);
    return acc;
  }, {});

  // Fetch teachers count for each selected university in real-time
  const [universityCounts, setUniversityCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState({});
  
  useEffect(() => {
    const fetchCounts = async () => {
      if (selectedUniversities.length === 0) {
        setUniversityCounts({});
        setLoadingCounts({});
        return;
      }

      const counts = {};
      const loadingStates = {};

      // Set loading state for all universities
      selectedUniversities.forEach(uni => {
        loadingStates[uni] = true;
      });
      setLoadingCounts({ ...loadingStates });

      // Fetch counts for all selected universities in parallel
      const countPromises = selectedUniversities.map(async (uni) => {
        try {
          const res = await adminUsersAPI.getTeachersByUniversity(uni);
          const fetchedTeachers = res.data?.teachers || res.teachers || [];
          return { university: uni, count: fetchedTeachers.length, error: null };
        } catch (err) {
          console.error(`Error fetching count for ${uni}:`, err);
          // Fallback to local count if fetch fails
          const localCount = teachersByUniversity[uni]?.length || 0;
          return { university: uni, count: localCount, error: err.message };
        }
      });

      const results = await Promise.all(countPromises);
      
      // Update counts and clear loading states
      results.forEach(({ university, count }) => {
        counts[university] = count;
        loadingStates[university] = false;
      });

      setUniversityCounts(counts);
      setLoadingCounts(loadingStates);
    };

    fetchCounts();
  }, [selectedUniversities]);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="relative">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type university name (e.g., Amity, LPU, Chandigarh)..."
              value={university}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && universities.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {universities.map((uni, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleUniversitySelect(uni)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-900">{uni}</span>
                    {selectedUniversities.includes(uni) && (
                      <FaCheck className="text-sky-600 text-xs" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && university.trim().length >= 1 && universities.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4">
              <p className="text-sm text-slate-500 text-center">No universities found</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="text-sm text-slate-500 text-center py-2">Loading teachers...</div>
        )}
      </div>

      {/* Selected Universities */}
      {selectedUniversities.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Selected Universities:</p>
          <div className="space-y-2">
            {selectedUniversities.map((uni) => {
              // Use real-time count from database if available, otherwise use local count
              const realTimeCount = universityCounts[uni];
              const isLoading = loadingCounts[uni] === true;
              const localCount = teachersByUniversity[uni]?.length || 0;
              const displayCount = realTimeCount !== undefined ? realTimeCount : localCount;
              
              return (
                <div
                  key={uni}
                  className="bg-white border border-slate-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-slate-900">{uni}</span>
                      {isLoading ? (
                        <span className="text-xs text-slate-400 animate-pulse">(Loading...)</span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          ({displayCount} {displayCount === 1 ? 'teacher' : 'teachers'})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveUniversity(uni)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remove university and all its teachers"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Teachers Summary */}
      {selectedTeachers.length > 0 && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
          <p className="text-sm font-medium text-sky-900">
            Total Selected: {selectedTeachers.length} {selectedTeachers.length === 1 ? 'teacher' : 'teachers'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherFilter;
