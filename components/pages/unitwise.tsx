"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import PDFViewer from "@/components/ui/pdf-viewer"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Search, X, RefreshCw } from 'lucide-react'

// Add metallic sheen animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = `
    @keyframes metallic-sheen {
      0% {
        transform: translateX(-160%) skewX(-14deg) scaleX(0.9);
        opacity: 0;
      }
      30% {
        opacity: 0.9;
      }
      55% {
        opacity: 0.7;
      }
      100% {
        transform: translateX(160%) skewX(-14deg) scaleX(1.05);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
}

interface ResourceItem {
  name: string
  fileKey: string
  resourceType?: string
}

interface Subject {
  name: string
  semester: string
  year: number | null
  ppts: ResourceItem[]
  pyqs: ResourceItem[]
  syllabus: ResourceItem[]
}

export default function UnitWise() {
  const [selectedSemester, setSelectedSemester] = useState<string>('combined')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showMobileResources, setShowMobileResources] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const [pdfViewer, setPdfViewer] = useState<{
    isOpen: boolean
    fileKey: string
    title: string
    list?: ResourceItem[]
    currentIndex?: number
  }>({
    isOpen: false,
    fileKey: '',
    title: '',
    list: undefined,
    currentIndex: undefined,
  })

  // Removed youtube state

  // Set default semester
  useEffect(() => {
    setSelectedSemester('combined')
  }, [])

  // Fetch resource data from backend
  const fetchResources = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const endpoint = forceRefresh ? '/api/resource/list?refresh=1' : '/api/resource/list'
      const response = await fetch(endpoint)

      if (!response.ok) {
        throw new Error('Failed to load resources data')
      }

      const data = await response.json()
      if (data.success && data.subjects) {
        setSubjects(data.subjects)
      } else {
        throw new Error('Invalid data format received')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load resources data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const query = searchQuery.trim().toLowerCase()
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = query === '' || subject.name.toLowerCase().includes(query)
    return matchesSearch
  }).sort((a, b) => a.name.localeCompare(b.name))

  const searchSuggestions = useMemo(() => {
    if (query.length < 2) return []
    return subjects
      .filter(s => s.name.toLowerCase().includes(query))
      .slice(0, 5)
  }, [subjects, query])

  // reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(searchSuggestions.length > 0 ? 0 : -1)
  }, [searchSuggestions])

  // Reset page when filteredSubjects or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [/* reset when filters change */ filteredSubjects.length, selectedSemester, searchQuery])

  // render subject name with highlighted match
  const renderHighlightedName = useCallback((name: string, q: string) => {
    if (!q) return name
    const idx = name.toLowerCase().indexOf(q)
    if (idx === -1) return name
    const before = name.slice(0, idx)
    const match = name.slice(idx, idx + q.length)
    const after = name.slice(idx + q.length)
    return (
      <>
        {before}
        <span className="text-orange-400 font-semibold">{match}</span>
        {after}
      </>
    )
  }, [])



  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowSuggestions(true)
  }, [])

  const handleSearchSelect = useCallback((subject: Subject) => {
    setSearchQuery(subject.name)
    setShowSuggestions(false)
    setSelectedSubject(subject)
    if (isMobile) setShowMobileResources(true)
  }, [isMobile])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev + 1) % searchSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev - 1 + searchSuggestions.length) % searchSuggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const idx = highlightedIndex >= 0 ? highlightedIndex : 0
      const subject = searchSuggestions[idx]
      if (subject) handleSearchSelect(subject)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }, [showSuggestions, searchSuggestions, highlightedIndex, handleSearchSelect])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    setSelectedSubject(null)
    setShowMobileResources(false)
  }, [])

  // Keep selectedSubject in sync with the currently filteredSubjects.
  // Rules:
  // - If there are no filtered subjects, clear selection.
  // - If nothing is selected, pick the first filtered subject.
  // - If the currently selected subject is not present in filteredSubjects, pick the first.
  // This avoids overriding an explicit user selection when switching tabs/searching.
  useEffect(() => {
    if (filteredSubjects.length === 0) {
      if (selectedSubject !== null) setSelectedSubject(null)
      setShowMobileResources(false)
      return
    }

    const isSelectedSubjectInList = selectedSubject
      ? filteredSubjects.some(s => s.name === selectedSubject.name && s.semester === selectedSubject.semester)
      : false

    if (!selectedSubject || !isSelectedSubjectInList) {
      setSelectedSubject(filteredSubjects[0])
      setShowMobileResources(false)
    }
  }, [filteredSubjects, selectedSemester, searchQuery, selectedSubject])

  // Pagination: determine items per page (responsive) and current page slice
  const itemsPerPage = isMobile ? 8 : 8
  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / itemsPerPage))
  const paginatedSubjects = filteredSubjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const scrollToTop = React.useCallback(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const goToPage = React.useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(newPage)
    scrollToTop()
  }, [totalPages, scrollToTop])

  // Keyboard navigation: Arrow keys to navigate subjects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in search input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Arrow Up/Down or Space to navigate subjects (Space acts as Down)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()

        if (filteredSubjects.length === 0) return

        let currentIndex = selectedSubject
          ? filteredSubjects.findIndex(s => s.name === selectedSubject.name && s.semester === selectedSubject.semester)
          : -1

        let nextIndex = currentIndex

        // Space key acts as Down arrow
        if (e.key === 'ArrowDown' || e.key === ' ') {
          nextIndex = (currentIndex + 1) % filteredSubjects.length
        } else if (e.key === 'ArrowUp') {
          nextIndex = currentIndex - 1 < 0 ? filteredSubjects.length - 1 : currentIndex - 1
        }

        const nextSubject = filteredSubjects[nextIndex]
        setSelectedSubject(nextSubject)
        if (isMobile) {
          setShowMobileResources(true)
        }

        // Handle pagination - ensure selected subject is visible
        const itemsPerPage = 8
        const pageForIndex = Math.ceil((nextIndex + 1) / itemsPerPage)
        if (pageForIndex !== currentPage) {
          setCurrentPage(pageForIndex)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filteredSubjects, selectedSubject, currentPage, isMobile])

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject)
    if (isMobile) {
      setShowMobileResources(true)
    }
  }

  // Group resources by unit number
  const groupResourcesByUnit = (resources: ResourceItem[]) => {
    const units = new Map<string, ResourceItem[]>()
    const others: ResourceItem[] = []

    resources.forEach(resource => {
      // Check for new format: "Unit X||FileName"
      const newFormatMatch = resource.name.match(/^(Unit\s+\d+(?:\.\d+)?)\|\|(.+)$/i)
      if (newFormatMatch) {
        const unitKey = newFormatMatch[1]
        const fileName = newFormatMatch[2].trim()

        if (!units.has(unitKey)) {
          units.set(unitKey, [])
        }
        units.get(unitKey)!.push({
          name: fileName,
          fileKey: resource.fileKey
        })
      } else {
        // Old format or non-unit resources
        const unitMatch = resource.name.match(/^Unit\s+(\d+(?:\.\d+)?)/i)
        if (unitMatch) {
          const unitKey = `Unit ${unitMatch[1]}`
          if (!units.has(unitKey)) {
            units.set(unitKey, [])
          }
          units.get(unitKey)!.push(resource)
        } else {
          others.push(resource)
        }
      }
    })

    // Sort units numerically
    const sortedUnits = Array.from(units.entries()).sort((a, b) => {
      const aNum = parseFloat(a[0].replace('Unit ', ''))
      const bNum = parseFloat(b[0].replace('Unit ', ''))
      return aNum - bNum
    })

    // Check if grouping is needed (at least one unit has multiple files)
    const needsGrouping = sortedUnits.some(([_, files]) => files.length > 1)

    return { units: sortedUnits, others, needsGrouping }
  }

  const toggleUnit = (unitKey: string) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev)
      if (newSet.has(unitKey)) {
        newSet.delete(unitKey)
      } else {
        newSet.add(unitKey)
      }
      return newSet
    })
  }

  // Open PDF in secure viewer (supports list navigation)
  const openPDF = (fileKey: string, title: string, list?: ResourceItem[], index?: number) => {
    if (fileKey && fileKey !== '#') {
      // build combined list if none provided
      let resolvedList: ResourceItem[] | undefined = list

      if (!resolvedList && selectedSubject) {
        const combined: ResourceItem[] = []
        if (selectedSubject.syllabus) combined.push(...selectedSubject.syllabus)
        if (selectedSubject.ppts) combined.push(...selectedSubject.ppts)
        if (selectedSubject.pyqs) combined.push(...selectedSubject.pyqs)

        resolvedList = combined.length > 0 ? combined : undefined
      }

      let resolvedIndex: number | undefined = typeof index === 'number' ? index : undefined
      if (resolvedList && typeof resolvedIndex !== 'number') {
        resolvedIndex = resolvedList.findIndex(item => item.fileKey === fileKey)
        if (resolvedIndex === -1) resolvedIndex = 0
      }
      setPdfViewer({
        isOpen: true,
        fileKey: fileKey,
        title,
        list: resolvedList ? resolvedList : undefined,
        currentIndex: typeof resolvedIndex === 'number' ? resolvedIndex : undefined,
      })
    }
  }

  const closePDF = () => {
    setPdfViewer({
      isOpen: false,
      fileKey: '',
      title: '',
      list: undefined,
      currentIndex: undefined,
    })
  };

  // Removed openYouTube

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Unitwise</h1>
          <p className="text-gray-400 text-sm sm:text-base">Loading study materials...</p>
        </div>
        <div className="flex h-96 w-full justify-center items-center">
          <div className="text-center">
            <p className="text-gray-400">Fetching resources data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-3 sm:p-4 lg:p-6 text-white">
        <div className="max-w-full mx-auto px-1 sm:px-2 lg:px-4">
          <div className="text-center py-16 sm:py-20">
            <div className="bg-[#111111] border border-red-500/30 rounded-lg p-6 sm:p-8 max-w-md mx-auto">
              <div className="text-4xl sm:text-5xl mb-4">⚠️</div>
              <h3 className="text-lg sm:text-xl font-semibold text-red-400 mb-3">Error Loading Resources</h3>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">Unitwise</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Access study materials{' '}
              <a
                href="https://wa.me/919336843008?text=Hi%2C%20I%20want%20to%20contribute%20study%20materials%20to%20Unitwise%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
              >
                (Contribute materials)
              </a>
            </p>
          </div>
        </motion.div>



        {/* Search Controls - full width (copied from Finder layout) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 relative z-20"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar - full width */}
            <div className="flex-1 relative z-20">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects across all years..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#222222] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Suggestions dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div role="listbox" className="absolute top-full left-0 right-0 bg-[#1a1a1a] border border-[#222222] rounded-b-xl mt-1 z-50 max-h-60 overflow-y-auto shadow-2xl">
                  {searchSuggestions.map((subj, idx) => {
                    const isHighlighted = highlightedIndex === idx
                    return (
                      <div
                        key={`${subj.semester}-${subj.name}`}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`p-3 cursor-pointer transition-colors ${isHighlighted ? 'bg-[#222222]' : 'hover:bg-[#222222]'}`}
                        onClick={() => handleSearchSelect(subj)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onMouseLeave={() => setHighlightedIndex(-1)}
                      >
                        <div className="text-white font-medium truncate">{renderHighlightedName(subj.name, query)}</div>
                        <div className="text-sm text-gray-400">{subj.semester ? subj.semester.replace('Semester ', 'Sem ') : 'All years'}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content - Two Column Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6"
        >
          {/* Left Side - Subjects List */}
          <div className={`lg:col-span-1 ${showMobileResources ? 'hidden lg:block' : 'block'} relative z-0`}>
            <div className="bg-[#111111] rounded-xl p-4 border border-[#222222]">

              <div className="space-y-2">
                {paginatedSubjects.map((subject, index) => (
                  <motion.button
                    key={`${subject.semester}-${subject.name}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`relative w-full text-left p-3 rounded-lg transition-all duration-300 text-sm font-medium h-[50px] flex items-center overflow-hidden ${selectedSubject?.name === subject.name
                      ? 'bg-orange-500 text-white border border-orange-400'
                      : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                      }`}
                  >
                    {/* Metallic sheen overlay for active state */}
                    {selectedSubject?.name === subject.name && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full w-24 opacity-0 animate-[metallic-sheen_1.2s_ease-in-out_infinite]"
                          style={{
                            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,250,240,0.9) 40%, rgba(255,255,255,0.95) 50%, rgba(255,250,240,0.8) 60%, rgba(255,255,255,0) 100%)',
                            filter: 'blur(4px)',
                            transform: 'translateX(-160%) skewX(-14deg)',
                            animation: 'metallic-sheen 1.2s ease-in-out infinite'
                          }}
                        />
                      </div>
                    )}
                    <span className="relative z-10 truncate w-full" title={subject.name}>
                      {subject.name}
                    </span>
                  </motion.button>
                ))}

                {filteredSubjects.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-sm font-medium">
                      {searchQuery
                        ? 'No subjects match your search'
                        : `No subjects for All years`}`
                    </p>
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="mt-2 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
              {/* Pagination controls for subjects list (compact UnitWise style) */}
              {filteredSubjects.length > itemsPerPage && (
                <div className="mt-5 flex flex-col items-center gap-2">

                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`text-sm font-medium py-1 px-3 rounded-md transition-all ${currentPage === 1 ? 'bg-[#0f0f0f] text-gray-600 cursor-not-allowed' : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222]'}`}
                    >
                      Prev
                    </button>

                    <div className="text-sm text-gray-300">Page {currentPage} / {totalPages}</div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`text-sm font-medium py-1 px-3 rounded-md transition-all ${currentPage === totalPages ? 'bg-[#0f0f0f] text-gray-600 cursor-not-allowed' : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222]'}`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Resources Content */}
          <div className={`lg:col-span-3 ${!showMobileResources ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-[#111111] rounded-xl p-4 sm:p-6 border border-[#222222] min-h-135">
              {selectedSubject ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Mobile: Back button and syllabus buttons in same row; Desktop: Syllabus buttons below title */}
                  <div className="mb-6">
                    {/* Mobile header with Back and Syllabus buttons */}
                    {showMobileResources && (
                      <div className="lg:hidden flex items-center justify-between flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => setShowMobileResources(false)}
                          className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors duration-200 text-sm font-medium"
                        >
                          ← Back to Subjects
                        </button>
                        {selectedSubject.syllabus.length > 0 && (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {selectedSubject.syllabus.map((syl, index) => (
                              <Button
                                key={index}
                                onClick={() => openPDF(syl.fileKey, `${selectedSubject.name} - ${syl.name}`, selectedSubject.syllabus, index)}
                                className="bg-orange-500 text-white hover:bg-orange-600 text-xs px-3 py-1 h-8 min-w-[80px] max-w-[120px]"
                                title={syl.name}
                              >
                                <span className="truncate">{syl.name}</span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subject title and syllabus buttons for desktop */}
                    <div className="hidden lg:flex lg:items-center lg:justify-between gap-4">
                      <h3
                        className="text-xl font-semibold truncate"
                        title={selectedSubject.name}
                      >
                        {selectedSubject.name}
                      </h3>
                      {selectedSubject.syllabus.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {selectedSubject.syllabus.map((syl, index) => (
                            <Button
                              key={index}
                              onClick={() => openPDF(syl.fileKey, `${selectedSubject.name} - ${syl.name}`, selectedSubject.syllabus, index)}
                              className="bg-orange-500 text-white hover:bg-orange-600 text-xs px-3 py-1 h-8 min-w-[80px] max-w-[200px]"
                              title={syl.name}
                            >
                              <span className="truncate">{syl.name}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Subject title for mobile (below buttons) */}
                    {showMobileResources && (
                      <h3
                        className="lg:hidden text-xl font-semibold truncate mb-4"
                        title={selectedSubject.name}
                      >
                        {selectedSubject.name}
                      </h3>
                    )}
                  </div>

                  {/* PPTs Section */}
                  {selectedSubject.ppts.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-4 text-orange-400">PPTs & Notes</h4>
                      {(() => {
                        const { units, others, needsGrouping } = groupResourcesByUnit(selectedSubject.ppts)

                        // Only show collapsible sections for Chemistry and if there are multiple files per unit
                        if (selectedSubject.name === 'Chemistry' && units.length > 0 && needsGrouping) {
                          return (
                            <div className="space-y-3">
                              {units.map(([unitKey, unitResources], unitIndex) => (
                                <div key={unitKey} className="border border-orange-500/55 rounded-lg overflow-hidden relative">
                                  <GlowingEffect
                                    spread={40}
                                    glow={true}
                                    disabled={false}
                                    proximity={64}
                                    inactiveZone={0.01}
                                    status="warning"
                                  />
                                  {/* Unit Header - Clickable to expand/collapse */}
                                  <button
                                    onClick={() => toggleUnit(unitKey)}
                                    className="w-full p-4 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] hover:border-orange-400/70 transition-all cursor-pointer flex items-center justify-between"
                                  >
                                    <span className="text-base font-semibold text-gray-200">{unitKey}</span>
                                    <motion.span
                                      animate={{ rotate: expandedUnits.has(unitKey) ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-orange-400"
                                    >
                                      ▼
                                    </motion.span>
                                  </button>

                                  {/* Unit Resources - Shown when expanded */}
                                  <AnimatePresence>
                                    {expandedUnits.has(unitKey) && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4 bg-[#0a0a0a] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                          {unitResources.map((ppt, index) => (
                                            <motion.button
                                              key={index}
                                              initial={{ opacity: 0, scale: 0.9 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              transition={{ delay: index * 0.05 }}
                                              onClick={() => openPDF(ppt.fileKey, `${selectedSubject.name} - ${ppt.name}`, unitResources, index)}
                                              className="relative p-3 rounded-lg transition-all duration-200 h-[60px] w-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 hover:border-orange-400/70"
                                            >
                                              <GlowingEffect
                                                spread={40}
                                                glow={true}
                                                disabled={false}
                                                proximity={64}
                                                inactiveZone={0.01}
                                                status="warning"
                                              />
                                              <span
                                                className="text-sm font-medium text-center truncate w-full px-1 text-gray-300"
                                                title={ppt.name}
                                              >
                                                {ppt.name}
                                              </span>
                                            </motion.button>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}

                              {/* Other resources (non-unit) */}
                              {others.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                                  {others.map((ppt, index) => (
                                    <motion.button
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: index * 0.05 }}
                                      onClick={() => openPDF(ppt.fileKey, `${selectedSubject.name} - ${ppt.name}`, others, index)}
                                      className="p-3 rounded-lg border bg-[#1a1a1a] border-[#222222] text-gray-300 hover:bg-[#222222] hover:border-orange-500/30 transition-all duration-200 h-[60px] w-full flex items-center justify-center"
                                    >
                                      <span
                                        className="text-sm font-medium text-center truncate w-full px-1"
                                        title={ppt.name}
                                      >
                                        {ppt.name}
                                      </span>
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        }

                        // If no units detected, show flat grid as before
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {selectedSubject.ppts.map((ppt, index) => (
                              <motion.button
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => openPDF(ppt.fileKey, `${selectedSubject.name} - ${ppt.name}`, selectedSubject.ppts, index)}
                                className="relative p-3 rounded-lg transition-all duration-200 h-[60px] w-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 hover:border-orange-400/70"
                              >
                                <GlowingEffect
                                  spread={40}
                                  glow={true}
                                  disabled={false}
                                  proximity={64}
                                  inactiveZone={0.01}
                                  status="warning"
                                />
                                <span
                                  className="text-sm font-medium text-center truncate w-full px-1 text-gray-300"
                                  title={ppt.name}
                                >
                                  {ppt.name}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* PYQs Section */}
                  {selectedSubject.pyqs.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold mb-4" style={{ color: '#ffe400' }}>
                        Previous Year Questions
                      </h4>
                      {(() => {
                        const { units, others, needsGrouping } = groupResourcesByUnit(selectedSubject.pyqs)

                        // Only show collapsible sections for Chemistry and if there are multiple files per unit
                        if (selectedSubject.name === 'Chemistry' && units.length > 0 && needsGrouping) {
                          return (
                            <div className="space-y-3">
                              {units.map(([unitKey, unitResources]) => (
                                <div key={unitKey} className="border border-yellow-400/55 rounded-lg overflow-hidden relative">
                                  <GlowingEffect
                                    spread={40}
                                    glow={true}
                                    disabled={false}
                                    proximity={64}
                                    inactiveZone={0.01}
                                    status="warning"
                                  />
                                  <button
                                    onClick={() => toggleUnit(`pyq-${unitKey}`)}
                                    className="w-full p-4 bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] hover:border-yellow-400/70 transition-all cursor-pointer flex items-center justify-between"
                                  >
                                    <span className="text-base font-semibold text-gray-200">{unitKey}</span>
                                    <motion.span
                                      animate={{ rotate: expandedUnits.has(`pyq-${unitKey}`) ? 180 : 0 }}
                                      transition={{ duration: 0.2 }}
                                      style={{ color: '#ffe400' }}
                                    >
                                      ▼
                                    </motion.span>
                                  </button>

                                  <AnimatePresence>
                                    {expandedUnits.has(`pyq-${unitKey}`) && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4 bg-[#0a0a0a] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                          {unitResources.map((pyq, index) => (
                                            <motion.button
                                              key={index}
                                              initial={{ opacity: 0, scale: 0.9 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              transition={{ delay: index * 0.05 }}
                                              onClick={() => openPDF(pyq.fileKey, `${selectedSubject.name} - ${pyq.name}`, unitResources, index)}
                                              className="relative p-3 rounded-lg transition-all duration-200 h-[60px] w-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-yellow-400/55 hover:border-yellow-400/70"
                                            >
                                              <GlowingEffect
                                                spread={40}
                                                glow={true}
                                                disabled={false}
                                                proximity={64}
                                                inactiveZone={0.01}
                                                status="warning"
                                              />
                                              <span
                                                className="text-sm font-medium text-center truncate w-full px-1 text-gray-300"
                                                title={pyq.name}
                                              >
                                                {pyq.name}
                                              </span>
                                            </motion.button>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}

                              {others.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                                  {others.map((pyq, index) => (
                                    <motion.button
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: index * 0.05 }}
                                      onClick={() => openPDF(pyq.fileKey, `${selectedSubject.name} - ${pyq.name}`, others, index)}
                                      className="relative p-3 rounded-lg transition-all duration-200 h-[60px] w-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-yellow-400/55 hover:border-yellow-400/70"
                                    >
                                      <GlowingEffect
                                        spread={40}
                                        glow={true}
                                        disabled={false}
                                        proximity={64}
                                        inactiveZone={0.01}
                                        status="warning"
                                      />
                                      <span
                                        className="text-sm font-medium text-center truncate w-full px-1 text-gray-300"
                                        title={pyq.name}
                                      >
                                        {pyq.name}
                                      </span>
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        }

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {selectedSubject.pyqs.map((pyq, index) => (
                              <motion.button
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => openPDF(pyq.fileKey, `${selectedSubject.name} - ${pyq.name}`, selectedSubject.pyqs, index)}
                                className="relative p-3 rounded-lg transition-all duration-200 h-[60px] w-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-yellow-400/55 hover:border-yellow-400/70"
                              >
                                <GlowingEffect
                                  spread={40}
                                  glow={true}
                                  disabled={false}
                                  proximity={64}
                                  inactiveZone={0.01}
                                  status="warning"
                                />
                                <span
                                  className="text-sm font-medium text-center truncate w-full px-1 text-gray-300"
                                  title={pyq.name}
                                >
                                  {pyq.name}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}



                  {/* Empty state */}
                  {selectedSubject.ppts.length === 0 &&
                    selectedSubject.pyqs.length === 0 &&
                    selectedSubject.syllabus.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-sm">Resources for this subject will be added soon.</p>
                        <p className="text-gray-400 text-sm mt-2">Have PPTs or PYQs for <span className="font-medium text-white">{selectedSubject.name}</span>?</p>
                        <a
                          href={`https://wa.me/919336843008?text=${encodeURIComponent("Hi Studique team! I'd like to contribute study materials to Unitwise. ")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Contribute Here
                        </a>
                      </div>
                    )}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Select a Subject</h3>
                  <p className="text-gray-500 text-sm">Choose a subject from the left panel to view resources</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* PDF Viewer */}
        <PDFViewer
          fileKey={pdfViewer.fileKey}
          title={pdfViewer.title}
          isOpen={pdfViewer.isOpen}
          currentIndex={typeof pdfViewer.currentIndex === 'number' ? pdfViewer.currentIndex + 1 : undefined}
          totalCount={pdfViewer.list ? pdfViewer.list.length : undefined}
          onClose={closePDF}
          onPrev={() => {
            setPdfViewer(prev => {
              if (!prev.list || typeof prev.currentIndex !== 'number') return prev
              const newIndex = Math.max(0, prev.currentIndex - 1)
              const item = prev.list[newIndex]
              if (!item) return prev
              return { ...prev, fileKey: item.fileKey, title: item.name, currentIndex: newIndex }
            })
          }}
          onNext={() => {
            setPdfViewer(prev => {
              if (!prev.list || typeof prev.currentIndex !== 'number') return prev
              const newIndex = Math.min(prev.list.length - 1, prev.currentIndex + 1)
              const item = prev.list[newIndex]
              if (!item) return prev
              return { ...prev, fileKey: item.fileKey, title: item.name, currentIndex: newIndex }
            })
          }}
          prevDisabled={!(pdfViewer.list && typeof pdfViewer.currentIndex === 'number' && pdfViewer.currentIndex > 0)}
          nextDisabled={!(pdfViewer.list && typeof pdfViewer.currentIndex === 'number' && pdfViewer.currentIndex < (pdfViewer.list.length - 1))}
        />


      </div>
    </div>
  )
}