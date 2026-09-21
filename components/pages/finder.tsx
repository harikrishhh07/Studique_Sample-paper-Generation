import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Users, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GlowingEffect } from "@/components/ui/glowing-effect";

// Faculty data structure
interface Faculty {
  id: string;
  facultyId: string;
  name: string;
  designation: string;
  department: string;
  staffRoom: string;
}

// CSV parsing utility - improved to handle various CSV formats
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  
  // Handle different line endings and quotes
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    const values: any[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, '')); // Add last value
    
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    return obj;
  });
};

// Hook to fetch and parse CSV data
const useFacultyData = () => {
  const [facultyData, setFacultyData] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/data/finder.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch faculty data');
        }
        
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        
        if (parsedData.length === 0) {
          throw new Error('CSV file is empty or improperly formatted');
        }
        
        const validatedData: Faculty[] = parsedData
          .filter(item => item['Faculty Name'] && item['Faculty Name'].trim() !== '')
          .map((item, index) => ({
            id: `faculty-${index}`,
            facultyId: item['Faculty Id.'] || item['Faculty Id'] || `FAC${index.toString().padStart(4, '0')}`,
            name: item['Faculty Name'].trim(),
            designation: item['Designation']?.trim() || 'Faculty',
            department: item['Department']?.trim() || 'NWC',
            staffRoom: item['Staff Room']?.trim() || 'Not Assigned',
          }));
        
        setFacultyData(validatedData);
      } catch (err) {
        // suppressed error logging for faculty data load
        setError('Failed to load faculty data. Please ensure finder.csv exists in the public folder and is properly formatted.');
        setFacultyData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  return { facultyData, isLoading, error };
};

// Loading skeleton component
const FacultyCardSkeleton = () => (
  <div className="bg-[#1a1a1a] border border-[#222222] rounded-2xl p-6 animate-pulse">
    <div className="space-y-3">
      <div className="h-6 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-700 rounded w-1/3" />
    </div>
  </div>
);

// Error state component
const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Data</h3>
    <p className="text-gray-400 mb-6">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// Empty state component
const EmptyState = ({ onReset }: { onReset: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-12"
  >
    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-300 mb-2">No faculty found</h3>
    <p className="text-gray-400 mb-6">
      Try adjusting your search terms or department filter.
    </p>
    <button
      onClick={onReset}
      className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
    >
      Clear Search & Filter
    </button>
  </motion.div>
);

// Faculty card component
const FacultyCard = ({ faculty }: { faculty: Faculty }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.2 }}
    className="relative rounded-2xl p-6 transition-all duration-300 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 hover:border-orange-400/70 cursor-pointer h-full"
  >
    <GlowingEffect
      spread={40}
      glow={true}
      disabled={false}
      proximity={64}
      inactiveZone={0.01}
      status="success"
    />
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-white truncate" title={faculty.name}>
        {faculty.name}
      </h3>
      <p className="text-orange-400 text-sm font-medium mb-1">{faculty.designation}</p>
      <p className="text-gray-400 text-sm mb-2">
        <span className="font-medium text-gray-300">ID:</span> {faculty.facultyId}
      </p>
      <p className="text-gray-400 text-sm mb-2">
        <span className="font-medium text-gray-300">Department:</span> {faculty.department}
      </p>
      <p className="text-gray-400 text-sm">
        <span className="font-bold text-gray-300">Room:</span> {faculty.staffRoom}
      </p>
    </div>
  </motion.div>
);

// Search suggestions component
const SearchSuggestions = ({ 
  suggestions, 
  onSelect, 
  visible 
}: { 
  suggestions: Faculty[]; 
  onSelect: (faculty: Faculty) => void; 
  visible: boolean;
}) => {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-[#1a1a1a] border border-[#222222] rounded-b-xl mt-1 z-10 max-h-60 overflow-y-auto">
      {suggestions.map((faculty) => (
        <div
          key={faculty.id}
          className="p-3 hover:bg-[#222222] cursor-pointer transition-colors"
          onClick={() => onSelect(faculty)}
        >
          <div className="text-white font-medium">{faculty.name}</div>
          <div className="text-sm text-gray-400">
            {faculty.facultyId} • {faculty.department}
          </div>
        </div>
      ))}
    </div>
  );
};

// Main Finder component
const Finder = () => {
  const { facultyData, isLoading: dataLoading, error: dataError } = useFacultyData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('CTech');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Department tabs configuration
  const departmentTabs = [
    { id: 'CTech', label: 'CTech' },
    { id: 'NWC', label: 'NWC' },
    { id: 'Cintel', label: 'Cintel' },
    { id: 'DSBS', label: 'DSBS' },
  ];

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get unique departments for filter
  const departments = useMemo(() => {
    return Array.from(new Set(facultyData.map(faculty => faculty.department)))
      .filter(dept => dept && dept.trim() !== '')
      .sort();
  }, [facultyData]);

  // Check which departments have data
  const departmentsWithData = useMemo(() => {
    return new Set(facultyData.map(faculty => faculty.department).filter(Boolean));
  }, [facultyData]);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (searchQuery.length < 2) return [];
    
    return facultyData
      .filter(faculty => 
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.facultyId.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [facultyData, searchQuery]);

  // Filter faculty
  const filteredFaculty = useMemo(() => {
    return facultyData.filter(faculty => {
      const matchesSearch = searchQuery === '' || 
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.facultyId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = faculty.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    });
  }, [facultyData, searchQuery, selectedDepartment]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredFaculty.length / itemsPerPage));
  const paginatedFaculty = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFaculty.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFaculty, currentPage]);

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const maxPagesToShow = 5;
    const pages: number[] = [];
    
    if (totalPages <= 1) return pages;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
    setCurrentPage(1);
  }, []);

  const handleSearchSelect = useCallback((faculty: Faculty) => {
    setSearchQuery(faculty.name);
    setShowSuggestions(false);
    setCurrentPage(1);
  }, []);

  const handleDepartmentChange = useCallback((department: string) => {
    setSelectedDepartment(department);
    setCurrentPage(1);
  }, []);

  const retryLoadData = useCallback(() => {
    window.location.reload();
  }, []);

  const goToPage = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    scrollToTop();
  }, [totalPages, scrollToTop]);

  const resetSearchAndFilter = useCallback(() => {
    setSearchQuery('');
    setShowSuggestions(false);
    setCurrentPage(1);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartment]);

  // Coming Soon component
  const ComingSoonState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-16"
    >
      <div className="bg-[#111111] border border-orange-500/30 rounded-xl p-8 max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-orange-400 mb-3">Coming Soon</h3>
        <p className="text-gray-400 text-sm mb-4">
          Faculty data for {selectedDepartment} department will be added soon.
        </p>
        <button
          onClick={() => setSelectedDepartment('CTech')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          View CTech/NWC Department
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Finder</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Find faculty staff room. {' '}
              <a
                href="https://wa.me/919336843008?text=Hi%2C%20I%20want%20to%20report%20incorrect%20faculty%20information%20in%20Finder%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors text-sm duration-200"
              >
                Report incorrect info
              </a>
            </p>
          </div>
          <div className="w-full sm:w-auto bg-[#111111] rounded-xl p-2 border border-[#222222]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {departmentTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleDepartmentChange(tab.id)}
                  className={`text-xs py-2 px-3 font-medium transition-all duration-200 h-[40px] flex items-center justify-center rounded-lg ${
                    selectedDepartment === tab.id
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                  }`}
                >
                  <span className="truncate whitespace-nowrap" title={tab.label}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Search Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or faculty ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#222222] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={resetSearchAndFilter}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <SearchSuggestions 
                suggestions={searchSuggestions} 
                onSelect={handleSearchSelect}
                visible={showSuggestions}
              />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {dataError ? (
            <ErrorState message={dataError} onRetry={retryLoadData} />
          ) : dataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <FacultyCardSkeleton key={i} />
              ))}
            </div>
          ) : !departmentsWithData.has(selectedDepartment) ? (
            <ComingSoonState />
          ) : filteredFaculty.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedFaculty.map((faculty) => (
                  <FacultyCard 
                    key={faculty.id} 
                    faculty={faculty} 
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-[#1a1a1a] border border-[#222222] disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:border-orange-400/50 transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-10 h-10 rounded-lg border ${
                        currentPage === pageNum
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-[#1a1a1a] border-[#222222] text-gray-300 hover:border-orange-400/50'
                      } transition-colors`}
                      aria-label={`Page ${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-[#1a1a1a] border border-[#222222] disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:border-orange-400/50 transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="pt-6 border-t border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  For informational purposes only - no misuse or reproduction allowed. - on Departmental guidelines
                </p>
              </div>
              
            </>
          ) : (
            <>
              <EmptyState onReset={resetSearchAndFilter} />
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  For informational purposes only - no misuse or reproduction allowed. - on Departmental guidelines
                </p>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Finder;