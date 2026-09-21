"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface Subject {
  id: string
  credits: number
  grade: string
}

interface Semester {
  id: string
  number: number
  sgpa: number
  credits: number
}

interface Prediction {
  id: string
  internalMarks: string
  desiredGrade: string
  requiredMarks: number | null
  alreadyAchieved: boolean
  unachievable: boolean
  error: string | null
  relativeMessage: string | null
}

const indianGradeOptions = [
  { value: 'O', label: 'O', points: 10, color: 'bg-orange-500', minTotal: 91, maxTotal: 100 },
  { value: 'A+', label: 'A+', points: 9, color: 'bg-orange-500', minTotal: 81, maxTotal: 90 },
  { value: 'A', label: 'A', points: 8, color: 'bg-orange-500', minTotal: 71, maxTotal: 80 },
  { value: 'B+', label: 'B+', points: 7, color: 'bg-orange-500', minTotal: 61, maxTotal: 70 },
  { value: 'B', label: 'B', points: 6, color: 'bg-orange-500', minTotal: 56, maxTotal: 60 },
  { value: 'C', label: 'C', points: 5, color: 'bg-orange-500', minTotal: 50, maxTotal: 55 },
  { value: 'F', label: 'F', points: 0, color: 'bg-orange-500/40', minTotal: 0, maxTotal: 49 },
]

export default function CalcGPA() {
  const [activeTab, setActiveTab] = useState("sgpa")
  
  // SGPA Calculator States
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', credits: 3, grade: '' },
    { id: '2', credits: 3, grade: '' },
    { id: '3', credits: 3, grade: '' },
    { id: '4', credits: 3, grade: '' },
    { id: '5', credits: 3, grade: '' },
  ])

  // CGPA Calculator States
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: '1', number: 1, sgpa: 0, credits: 20 },
    { id: '2', number: 2, sgpa: 0, credits: 20 },
    { id: '3', number: 3, sgpa: 0, credits: 20 },
    { id: '4', number: 4, sgpa: 0, credits: 20 }
  ])

  // Grade Predictor States
  const [predictions, setPredictions] = useState<Prediction[]>([
    { id: '1', internalMarks: '', desiredGrade: '', requiredMarks: null, alreadyAchieved: false, unachievable: false, error: null, relativeMessage: null },
  ])

  const tabs = [
    { id: "sgpa", label: "SGPA Calculator" },
    { id: "cgpa", label: "CGPA Calculator" },
    { id: "predictor", label: "Grade Predictr" },
  ]

  // SGPA Calculator Functions
  const addSubject = () => {
    setSubjects([...subjects, { 
      id: Date.now().toString(), 
      credits: 3, 
      grade: '' 
    }])
  }

  const removeSubject = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter(subject => subject.id !== id))
    }
  }

  const updateSubject = (id: string, field: keyof Subject, value: string | number) => {
    setSubjects(subjects.map(subject => 
      subject.id === id ? { ...subject, [field]: value } : subject
    ))
  }

  const resetSGPACalculator = () => {
    setSubjects([
      { id: '1', credits: 3, grade: '' },
      { id: '2', credits: 3, grade: '' },
      { id: '3', credits: 3, grade: '' },
      { id: '4', credits: 3, grade: '' },
      { id: '5', credits: 3, grade: '' },
    ])
  }

  const calculateSGPA = () => {
    let totalPoints = 0
    let totalCredits = 0

    subjects.forEach(subject => {
      if (subject.grade && subject.credits > 0) {
        const gradeOption = indianGradeOptions.find(option => option.value === subject.grade)
        if (gradeOption) {
          totalPoints += gradeOption.points * subject.credits
          totalCredits += subject.credits
        }
      }
    })

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  }

  // CGPA Calculator Functions
  const addSemester = () => {
    if (semesters.length >= 8) return
    const nextSemesterNumber = semesters.length > 0 ? Math.max(...semesters.map(s => s.number)) + 1 : 1
    setSemesters([...semesters, { 
      id: Date.now().toString(), 
      number: nextSemesterNumber, 
      sgpa: 0, 
      credits: 20 
    }])
  }

  const removeSemester = (id: string) => {
    if (semesters.length > 1) {
      setSemesters(semesters.filter(semester => semester.id !== id))
    }
  }

  const updateSemester = (id: string, field: keyof Semester, value: number) => {
    if (field === 'sgpa') {
      value = Math.max(0, Math.min(10, value))
    } else if (field === 'credits') {
      value = Math.max(0, Math.min(30, value))
    } else if (field === 'number') {
      value = Math.max(1, Math.min(8, value))
    }

    setSemesters(semesters.map(semester => 
      semester.id === id ? { ...semester, [field]: value } : semester
    ))
  }

  const resetCGPACalculator = () => {
    setSemesters([
      { id: '1', number: 1, sgpa: 0, credits: 20 },
      { id: '2', number: 2, sgpa: 0, credits: 20 },
      { id: '3', number: 3, sgpa: 0, credits: 20 },
      { id: '4', number: 4, sgpa: 0, credits: 20 }
    ])
  }

  const calculateCGPA = () => {
    let totalPoints = 0
    let totalCredits = 0

    semesters.forEach(semester => {
      if (semester.sgpa > 0 && semester.credits > 0) {
        totalPoints += semester.sgpa * semester.credits
        totalCredits += semester.credits
      }
    })

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00'
  }

  // Grade Predictor Functions
  const addPrediction = () => {
    setPredictions([...predictions, { 
      id: Date.now().toString(), 
      internalMarks: '',
      desiredGrade: '',
      requiredMarks: null,
      alreadyAchieved: false,
      unachievable: false,
      error: null,
      relativeMessage: null
    }])
  }

  const removePrediction = (id: string) => {
    if (predictions.length > 1) {
      setPredictions(predictions.filter(prediction => prediction.id !== id))
    }
  }

  const validateMarks = (marks: string) => {
    if (marks === '') return null
    const num = parseInt(marks)
    if (isNaN(num)) return 'Please enter a valid number'
    if (num < 0) return 'Marks cannot be negative'
    if (num > 60) return 'Marks cannot exceed 60'
    return null
  }

  const calculateRequiredMarks = (internalMarks: string, desiredGrade: string) => {
    if (!internalMarks || !desiredGrade) return null
    
    const grade = indianGradeOptions.find(g => g.value === desiredGrade)
    if (!grade) return null

    const internalRaw = parseInt(internalMarks) || 0
    const cappedInternal = Math.min(Math.max(internalRaw, 0), 60)

    // Internal marks: out of 60, converted to 60% weightage
    // External marks: out of 75, converted to 40% weightage
    // Total final score: out of 100

    const weightedInternal = (cappedInternal / 60) * 60

    // Check if already achieved with current internal marks
    if (weightedInternal >= grade.minTotal) {
      return { requiredMarks: 0, alreadyAchieved: true, unachievable: false, relativeMessage: null }
    }

    // Calculate required weighted external marks (out of 40% weightage)
    const requiredWeightedExternal = grade.minTotal - weightedInternal
    
    // Convert back to raw external marks needed (out of 75)
    const requiredRawExternal = (requiredWeightedExternal * 75) / 40

    if (requiredRawExternal <= 0) {
      return { requiredMarks: 0, alreadyAchieved: true, unachievable: false, relativeMessage: null }
    }

    const isUnachievable = requiredRawExternal > 75
    const finalRequiredMarks = Math.ceil(Math.min(requiredRawExternal, 75))
    
    // For relative marking: only show when target grade is unachievable but within 10 marks
    let relativeMessage: string | null = null
    if (isUnachievable) {
      const currentTotal = weightedInternal + 40 // Max possible with current internal + max external
      const shortfallFromTarget = grade.minTotal - currentTotal
      if (shortfallFromTarget > 0 && shortfallFromTarget <= 10) {
        relativeMessage = `but relative marking can help you get ${grade.label} grade!`
      }
    }

    return {
      requiredMarks: finalRequiredMarks,
      alreadyAchieved: false,
      unachievable: isUnachievable,
      relativeMessage: relativeMessage
    }
  }

  const updatePrediction = (id: string, field: string, value: string) => {
    const updatedPredictions = predictions.map(prediction => {
      if (prediction.id === id) {
        const updated = { 
          ...prediction, 
          [field]: value 
        }
        
        if (field === 'internalMarks') {
          updated.error = validateMarks(value)
        }
        
        if ((field === 'internalMarks' || field === 'desiredGrade') && !updated.error) {
          if ((updated.internalMarks !== '' || field === 'desiredGrade') && updated.desiredGrade) {
            const result = calculateRequiredMarks(updated.internalMarks, updated.desiredGrade)
            updated.requiredMarks = result?.requiredMarks ?? null
            updated.alreadyAchieved = result?.alreadyAchieved ?? false
            updated.unachievable = result?.unachievable ?? false
            updated.relativeMessage = result?.relativeMessage ?? null
          } else {
            updated.requiredMarks = null
            updated.alreadyAchieved = false
            updated.unachievable = false
            updated.relativeMessage = null
          }
        }
        
        return updated
      }
      return prediction
    })
    
    setPredictions(updatedPredictions)
  }

  const resetPredictor = () => {
    setPredictions([
      { id: '1', internalMarks: '', desiredGrade: '', requiredMarks: null, alreadyAchieved: false, unachievable: false, error: null, relativeMessage: null },
    ])
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">CalcGPA</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Calculate your SGPA, CGPA and predict grades
            </p>
          </div>
          <div className="w-full sm:w-auto bg-[#111111] rounded-xl p-2 border border-[#222222]">
            <div className="grid grid-cols-3 gap-2">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs py-2 px-3 font-medium transition-all duration-200 h-[40px] flex items-center justify-center ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                  }`}
                >
                  <span className="truncate" title={tab.label}>
                    {tab.label.split(' ')[0]}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === "sgpa" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SGPA Input Section */}
              <div className="lg:col-span-2">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#222222]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold">SGPA Calculator</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button onClick={addSubject} className="bg-orange-500 hover:bg-orange-600">
                        Add Course
                      </Button>
                      <Button onClick={resetSGPACalculator} variant="outline" className="border-[#333333] text-gray-300 bg-[#1a1a1a] hover:bg-[#1a1a1a] hover:border-[#333333] hover:text-gray-300">
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#222222]">
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Credits</label>
                          <select
                            value={subject.credits}
                            onChange={(e) => updateSubject(subject.id, 'credits', parseInt(e.target.value))}
                            className="w-full bg-[#222222] border border-[#333333] focus:border-[#ff652f] hover:border-[#ff652f]/50 focus:ring-0 rounded-lg px-3 py-2 pr-8 text-sm text-white transition-colors duration-200 appearance-none"
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 8px center',
                              backgroundSize: '16px'
                            }}
                          >
                            {Array.from({ length: 11 }, (_, i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-8">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Grade</label>
                          <div className="grid grid-cols-7 gap-1">
                            {indianGradeOptions.map(option => (
                              <button
                                key={option.value}
                                onClick={() => updateSubject(subject.id, 'grade', option.value)}
                                className={`p-2 rounded text-sm font-medium border transition-colors ${subject.grade === option.value ? 
                                  'bg-orange-500 border-orange-500 text-white' : 
                                  'bg-[#222222] border-[#333333] text-gray-300 hover:border-orange-500/50 hover:text-orange-400'}`}
                              >
                                {option.value}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="sm:col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeSubject(subject.id)}
                            disabled={subjects.length === 1}
                            aria-label="Remove course"
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:text-red-500 hover:bg-[#222222] disabled:opacity-30 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SGPA Results */}
              <div className="lg:col-span-1">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] h-fit sticky top-24">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-orange-400 mb-2">{calculateSGPA()}</div>
                    <div className="text-gray-300">Semester GPA</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#222222]">
                      <div className="text-xl font-semibold text-white">
                        {subjects.filter(s => s.grade && s.credits > 0).length}
                      </div>
                      <div className="text-sm text-gray-400">Courses</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#222222]">
                      <div className="text-xl font-semibold text-white">
                        {subjects.filter(s => s.grade && s.credits > 0).reduce((sum, s) => sum + s.credits, 0)}
                      </div>
                      <div className="text-sm text-gray-400">Credits</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Grade Scale</h3>
                    <div className="grid grid-cols-7 gap-1">
                      {indianGradeOptions.map(grade => (
                        <div 
                          key={grade.value} 
                          className={`rounded p-1 sm:p-2 text-center text-white text-xs flex flex-col items-center ${grade.value === 'F' ? 'bg-[#222222] text-red-400 border border-red-500/40' : 'bg-orange-500/20 border border-orange-500/40 text-orange-300'} `}
                        >
                          <span className="font-bold text-white/90">{grade.value}</span>
                          <span>{grade.points}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "cgpa" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CGPA Input Section */}
              <div className="lg:col-span-2">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#222222]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold">CGPA Calculator</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button 
                        onClick={addSemester} 
                        disabled={semesters.length >= 8}
                        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
                      >
                        Add Semester
                      </Button>
                      <Button onClick={resetCGPACalculator} variant="outline" className="border-[#333333] text-gray-300 bg-[#1a1a1a] hover:bg-[#1a1a1a] hover:border-[#333333] hover:text-gray-300">
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {semesters.map((semester) => (
                      <div key={semester.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#222222]">
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Semester</label>
                          <input
                            type="number"
                            min="1"
                            max="8"
                            value={semester.number}
                            onChange={(e) => updateSemester(semester.id, 'number', parseInt(e.target.value) || 1)}
                            className="w-full bg-[#222222] border border-[#333333] focus:border-[#ff652f] hover:border-[#ff652f]/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-white transition-colors duration-200"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-medium text-gray-400 mb-1">SGPA</label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            placeholder="0.00"
                            value={semester.sgpa || ''}
                            onChange={(e) => updateSemester(semester.id, 'sgpa', parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#222222] border border-[#333333] focus:border-[#ff652f] hover:border-[#ff652f]/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-white transition-colors duration-200"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Credits</label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            placeholder="20"
                            value={semester.credits || ''}
                            onChange={(e) => updateSemester(semester.id, 'credits', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#222222] border border-[#333333] focus:border-[#ff652f] hover:border-[#ff652f]/50 focus:ring-0 rounded-lg px-3 py-2 text-sm text-white transition-colors duration-200"
                          />
                        </div>
                        <div className="sm:col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeSemester(semester.id)}
                            disabled={semesters.length === 1}
                            aria-label="Remove semester"
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:text-red-500 hover:bg-[#222222] disabled:opacity-30 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CGPA Results */}
              <div className="lg:col-span-1">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] h-fit sticky top-24">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-orange-400 mb-2">{calculateCGPA()}</div>
                    <div className="text-gray-300">Cumulative GPA</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#222222]">
                      <div className="text-xl font-semibold text-white">
                        {semesters.filter(s => s.sgpa > 0 && s.credits > 0).length}
                      </div>
                      <div className="text-sm text-gray-400">Active</div>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-4 text-center border border-[#222222]">
                      <div className="text-xl font-semibold text-white">
                        {semesters.filter(s => s.sgpa > 0 && s.credits > 0).reduce((sum, s) => sum + s.credits, 0)}
                      </div>
                      <div className="text-sm text-gray-400">Credits</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "predictor" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Grade Predictor Input Section */}
              <div className="lg:col-span-2">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#222222]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-semibold">Grade Predictr</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button onClick={addPrediction} className="bg-orange-500 hover:bg-orange-600">
                        Add Course
                      </Button>
                      <Button onClick={resetPredictor} variant="outline" className="border-[#333333] text-gray-300 bg-[#1a1a1a] hover:bg-[#1a1a1a] hover:border-[#333333] hover:text-gray-300">
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {predictions.map((prediction) => (
                      <div key={prediction.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-[#1a1a1a] rounded-lg border border-[#222222]">
                        <div className="sm:col-span-7">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Internal Marks (out of 60)</label>
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={prediction.internalMarks}
                            onChange={(e) => updatePrediction(prediction.id, 'internalMarks', e.target.value)}
                            placeholder="Enter marks (0-60)"
                            className={`w-full bg-[#222222] border ${prediction.error ? 'border-red-500' : 'border-[#333333] focus:border-[#ff652f] hover:border-[#ff652f]/50'} focus:ring-0 rounded-lg px-3 py-2 text-sm text-white transition-colors duration-200`}
                          />
                          {prediction.error && (
                            <p className="text-xs text-red-400 mt-1">{prediction.error}</p>
                          )}
                        </div>
                        <div className="sm:col-span-4">
                          <label className="block text-xs font-medium text-gray-400 mb-1">Desired Grade</label>
                          <select
                            value={prediction.desiredGrade}
                            onChange={(e) => updatePrediction(prediction.id, 'desiredGrade', e.target.value)}
                            className="w-full bg-[#222222] border border-[#333333] focus:border-[#ff652f] hover:border-[#ff652f]/50 focus:ring-0 rounded-lg px-3 py-2 pr-8 text-sm text-white transition-colors duration-200 appearance-none"
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 8px center',
                              backgroundSize: '16px'
                            }}
                          >
                            <option value="">Select Grade</option>
                            {indianGradeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removePrediction(prediction.id)}
                            disabled={predictions.length === 1}
                            aria-label="Remove prediction"
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:text-red-500 hover:bg-[#222222] disabled:opacity-30 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grade Predictor Results */}
              <div className="lg:col-span-1">
                <div className="bg-[#111111] rounded-xl p-6 border border-[#222222] h-fit sticky top-24">
                  
                  <div className="space-y-4 mb-6">
                    {predictions.map((prediction, index) => (
                      <div key={prediction.id} className="bg-[#1a1a1a] border border-[#222222] rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-300 mb-2">
                          Course {index + 1}
                        </h3>
                        
                        {prediction.error ? (
                          <div className="text-sm text-red-400">
                            Fix input error
                          </div>
                        ) : prediction.desiredGrade && prediction.internalMarks !== '' ? (
                          <div>
                            {prediction.alreadyAchieved ? (
                              <div className="text-sm text-emerald-400 font-medium">
                                Already achieved {prediction.desiredGrade}!
                              </div>
                            ) : prediction.unachievable ? (
                              <div>
                                <div className="text-sm text-red-400 font-medium">
                                  Grade {prediction.desiredGrade} unachievable
                                </div>
                                {prediction.relativeMessage && (
                                  <div className="text-sm text-yellow-400 font-medium mt-1">
                                    {prediction.relativeMessage}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm text-gray-400">For {prediction.desiredGrade}:</span>
                                  <span className="text-sm font-medium text-white">
                                    {prediction.requiredMarks}/75
                                  </span>
                                </div>
                                
                                <div className="w-full bg-[#222222] rounded-full h-2 mt-3">
                                  <div 
                                    className="h-2 rounded-full bg-orange-500"
                                    style={{ width: `${Math.min(100, (prediction.requiredMarks || 0) / 75 * 100)}%` }}
                                  ></div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Enter marks & grade
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Grade Scale</h3>
                    <div className="grid grid-cols-7 gap-1">
                      {indianGradeOptions.map(grade => (
                        <div 
                          key={grade.value} 
                          className={`rounded p-1 text-center text-xs flex flex-col items-center ${grade.value === 'F' ? 'bg-[#222222] text-red-400 border border-red-500/40' : 'bg-orange-500/20 border border-orange-500/40 text-orange-300'}`}
                          title={`${grade.minTotal}-${grade.maxTotal}%`}
                        >
                          <span className="font-bold text-white/90">{grade.value}</span>
                          <span className="text-[10px]">{grade.minTotal}-{grade.maxTotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}