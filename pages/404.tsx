import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Background from '@/components/ui/background'
import { motion } from 'framer-motion'

export default function Custom404() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 text-center">
      <Background />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 items-center"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute -top-12 w-32 h-32 rounded-full bg-orange-500/10 blur-2xl"
        />
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Uh-oh, wrong portal!</h1>
        <Link href="/" className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-4 text-base rounded-lg transition">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back To Home
        </Link>
      </motion.div>
    </div>
  )
}
