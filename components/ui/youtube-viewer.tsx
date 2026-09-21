"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FaTimes, FaExpand, FaCompress } from "react-icons/fa"

interface YouTubeViewerProps {
  playlistUrl: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export default function YouTubeViewer({ playlistUrl, title, isOpen, onClose }: YouTubeViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  if (!isOpen) return null

  // Convert YouTube playlist URL to embed format
  const getEmbedUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const listParam = urlObj.searchParams.get('list')
      
      if (listParam) {
        return `https://www.youtube.com/embed/videoseries?list=${listParam}&autoplay=0&rel=0`
      }
      
      // Fallback for other YouTube URL formats
      return url.replace('watch?v=', 'embed/').replace('playlist?list=', 'embed/videoseries?list=')
    } catch (error) {
      // suppress invalid YouTube URL errors
      return url
    }
  }


  const embedUrl = getEmbedUrl(playlistUrl)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-[#111111] rounded-xl border border-[#222222] ${
          isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'
        } flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#222222]">
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#222222] rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
            {/* Pop-out / open-in-YouTube button removed per request */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#222222] rounded-lg transition-colors"
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* YouTube Player */}
        <div className="flex-1 p-4">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg border border-[#222222]"
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
