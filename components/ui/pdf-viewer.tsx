"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X, Download, Maximize2, Minimize2 } from 'lucide-react'

interface PDFViewerProps {
  fileKey: string
  title: string
  isOpen: boolean
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  currentIndex?: number
  totalCount?: number
}

export default function PDFViewer({ fileKey, title, isOpen, onClose, onPrev, onNext, prevDisabled, nextDisabled, currentIndex, totalCount }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset states when URL or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setLoadError(false)
      setIsLoading(false)
      setDownloadProgress(null)
      
      loadTimerRef.current = setTimeout(() => {
        setIsLoading(true)
      }, 300)
    }
    
    return () => {
      if (loadTimerRef.current) {
        clearTimeout(loadTimerRef.current)
      }
    }
  }, [fileKey, isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else {
          onClose()
        }
      } else if (e.key === 'ArrowLeft') {
        if (onPrev && !prevDisabled) onPrev()
      } else if (e.key === 'ArrowRight') {
        if (onNext && !nextDisabled) onNext()
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen(prev => !prev)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onPrev, onNext, prevDisabled, nextDisabled, onClose, isFullscreen])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Get internal viewer URL (for inline viewing in website)
  const getViewerUrl = useCallback(() => {
    if (!fileKey) return ''
    // Check if it's a Google Drive file ID
    if (fileKey.startsWith('1') && !fileKey.includes('://')) {
      // Google Drive inline viewer/preview URL format
      return `https://drive.google.com/file/d/${fileKey}/preview`
    }
    return `/api/resource/download?fileKey=${encodeURIComponent(fileKey)}&redirect=true&action=view`
  }, [fileKey])

  // Get direct download URL
  const getDirectDownloadUrl = useCallback(() => {
    if (!fileKey) return ''
    // Check if it's a Google Drive file ID
    if (fileKey.startsWith('1') && !fileKey.includes('://')) {
      // Google Drive direct download URL format
      return `https://drive.google.com/uc?export=download&id=${fileKey}`
    }
    return `/api/resource/download?fileKey=${encodeURIComponent(fileKey)}&redirect=true&action=download`
  }, [fileKey])

  // Download handler — fetches the file as a blob through the server proxy,
  // then saves it with the viewer title as the filename.
  // Using a blob URL means link.download always controls the filename.
  const handleDownload = useCallback(async () => {
    if (isDownloading) return

    setIsDownloading(true)
    setDownloadProgress('Downloading...')

    try {
      const params = new URLSearchParams({ fileKey, action: 'download' })
      const response = await fetch(`/api/resource/download?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = title ? `${title}.pdf` : 'resource.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Release the object URL after the browser picks up the download
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setIsDownloading(false)
      setDownloadProgress(null)
    }
  }, [isDownloading, fileKey, title])


  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(true)
      })
    } else {
      document.exitFullscreen().catch(() => {
        setIsFullscreen(false)
      })
    }
  }, [])

  const handleIframeLoad = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current)
    }
    setIsLoading(false)
  }, [])

  const handleIframeError = useCallback(() => {
    if (loadTimerRef.current) {
      clearTimeout(loadTimerRef.current)
    }
    setIsLoading(false)
    setLoadError(true)
  }, [])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col"
      >
        {/* Clean Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#222222]">
          {/* Left: Title & Counter */}
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white truncate max-w-[250px] sm:max-w-md" title={title}>
              {title}
            </h3>
            {(typeof currentIndex === 'number' && typeof totalCount === 'number') && (
              <span className="text-[11px] text-gray-500">
                Resource {currentIndex} of {totalCount}
              </span>
            )}
          </div>

          {/* Center: Navigation Arrows */}
          <div className="flex items-center gap-1 mx-4">
            <button
              onClick={onPrev}
              disabled={prevDisabled}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                prevDisabled 
                  ? 'border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'border-gray-600 text-gray-300 hover:text-white hover:border-orange-500 hover:bg-orange-500/10'
              }`}
              title="Previous (←)"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                nextDisabled 
                  ? 'border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'border-gray-600 text-gray-300 hover:text-white hover:border-orange-500 hover:bg-orange-500/10'
              }`}
              title="Next (→)"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right: Key Actions */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-full border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-orange-500 hover:bg-orange-500/10 transition-all"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                isDownloading
                  ? 'bg-orange-500/60 text-white/80 cursor-wait'
                  : 'bg-orange-500 hover:bg-orange-400 text-black'
              }`}
              title="Download PDF"
            >
              <Download size={16} className={isDownloading ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 transition-all"
              title="Close (ESC)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Download Progress Toast */}
        <AnimatePresence>
          {downloadProgress && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-sm text-gray-300 shadow-xl"
            >
              {downloadProgress}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Viewer Area */}
        <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
              <div className="text-center">
                <div className="relative w-12 h-12 mx-auto mb-3">
                  <div className="absolute inset-0 border-3 border-orange-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-3 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500 text-sm">Loading resource...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
              <div className="text-center max-w-sm px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X size={32} className="text-red-500" />
                </div>
                <p className="text-gray-300 font-medium mb-2">Unable to load resource</p>
                <p className="text-gray-500 text-sm mb-4">The file might be unavailable or restricted.</p>
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black rounded-lg transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* PDF iframe */}
          <iframe
            ref={iframeRef}
            src={getViewerUrl()}
            className="w-full h-full border-none"
            title={title}
            loading="eager"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="autoplay"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
