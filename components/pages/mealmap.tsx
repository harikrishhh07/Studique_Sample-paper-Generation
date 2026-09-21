"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { 
  getMealData, 
  getCurrentDay, 
  getCurrentMeal, 
  isMealActive, 
  messHalls,
  daysOfWeek,
  type MessHall,
  type DayOfWeek,
  type MealType
} from "@/lib/mealService"

export default function MealMap() {
  const [activeDay, setActiveDay] = useState<DayOfWeek>(getCurrentDay())
  const [activeMess, setActiveMess] = useState<MessHall>("Sannasi") // Default to Sannasi
  const [currentMeal, setCurrentMeal] = useState<MealType>("breakfast")
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null)

  // Update current meal every minute and set initial selected meal
  useEffect(() => {
    const updateCurrentMeal = () => {
      const nextMeal = getCurrentMeal()
      setCurrentMeal(nextMeal)
      
      // Auto-select the next meal if no meal is selected
      if (!selectedMeal) {
        const mealId = nextMeal.toLowerCase()
        setSelectedMeal(mealId)
      }
    }
    
    // Set initial meal
    updateCurrentMeal()
    
    // Update every minute
    const interval = setInterval(updateCurrentMeal, 60000)
    
    return () => clearInterval(interval)
  }, [selectedMeal])

  // Get current menu data using the service
  const currentMenu = getMealData(activeMess, activeDay)

  // Function to check if meal is currently active (updated to use service function)
  const isMealActiveLocal = (mealName: MealType) => {
    return isMealActive(mealName)
  }

  const mealTypes = [
    { 
      id: "breakfast", 
      name: "Breakfast", 
      time: "7:00 AM - 9:00 AM",
      items: currentMenu.breakfast,
      isCurrent: currentMeal === "breakfast",
      isActive: isMealActiveLocal("breakfast")
    },
    { 
      id: "lunch", 
      name: "Lunch", 
      time: "11:30 AM - 1:30 PM", 
      items: currentMenu.lunch,
      isCurrent: currentMeal === "lunch",
      isActive: isMealActiveLocal("lunch")
    },
    { 
      id: "snacks", 
      name: "Snacks", 
      time: "4:30 PM - 5:30 PM",
      items: currentMenu.snacks,
      isCurrent: currentMeal === "snacks",
      isActive: isMealActiveLocal("snacks")
    },
    { 
      id: "dinner", 
      name: "Dinner", 
      time: "7:30 PM - 9:00 PM",
      items: currentMenu.dinner,
      isCurrent: currentMeal === "dinner",
      isActive: isMealActiveLocal("dinner")
    },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 text-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Header - Following UnitWise structure */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8"
        >
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">MealMap</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              <a
                href="https://wa.me/919336843008?text=Hi%2C%20I%20want%20to%20suggest%20menu%20updates%20for%20MealMap%3A%20"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 transition-colors duration-200"
              >
                Report menu updates
              </a>
            </p>
          </div>
          
          {/* Mess Hall Toggle - Same for both desktop and mobile */}
          <div className="w-full sm:w-auto bg-[#111111] rounded-xl p-2 border border-[#222222]">
            <div className="flex gap-2">
              {messHalls.map((mess) => (
                <button
                  key={mess}
                  onClick={() => setActiveMess(mess)}
                  className={`flex-1 py-2 px-3 font-medium transition-all duration-200 h-[42px] flex items-center justify-center rounded-md text-sm ${
                    activeMess === mess
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                  }`}
                >
                  <span className="truncate" title={mess}>
                    {mess}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Day Selection - Following UnitWise button pattern */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#111111] rounded-xl p-4 border border-[#222222] mb-6"
        >
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <Button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-2 py-2 text-sm transition-all duration-200 h-[40px] flex items-center justify-center ${
                  activeDay === day
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                }`}
                title={day}
              >
                <span className="font-semibold md:hidden">
                  {day.charAt(0)}
                </span>
                <span className="font-semibold hidden md:block truncate">
                  {day}
                </span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Main Content - Split Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {/* Left Panel - Meal Types (Following UnitWise pattern) */}
          <div className="lg:col-span-1">
            <div className="bg-[#111111] rounded-xl p-4 border border-[#222222]">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {mealTypes.map((meal) => (
                  <motion.button
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 text-sm font-medium min-h-[40px] flex items-center justify-between ${
                      selectedMeal === meal.id
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : meal.isActive 
                          ? 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'
                          : 'bg-[#1a1a1a] text-gray-300 border border-[#222222] hover:bg-[#222222] hover:border-orange-500/30 hover:text-orange-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="font-medium">{meal.name}</span>
                    {meal.isActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Menu Items (Following UnitWise pattern) */}
          <div className="lg:col-span-3">
            <div className="bg-[#111111] rounded-xl p-4 sm:p-6 border border-[#222222] min-h-[400px]">
              {selectedMeal ? (
                <>
                  {(() => {
                    const meal = mealTypes.find(m => m.id === selectedMeal)!
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        
                        {/* Menu Items Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {meal.items.map((item: string, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className={`relative p-3 rounded-lg transition-all duration-200 h-[60px] w-full flex items-center justify-center cursor-pointer ${
                                meal.isActive
                                  ? 'bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-green-500/55 hover:border-green-400/70'
                                  : 'bg-gradient-to-br from-[#141414] via-[#0f0f0f] to-[#0b0b0b] border border-orange-500/55 hover:border-orange-400/70'
                              }`}
                            >
                              <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                status={meal.isActive ? "success" : "warning"}
                              />
                              <span className="text-sm font-medium text-center px-2 leading-tight text-gray-300" title={item}>
                                {item.length > 40 ? item.substring(0, 40) + '...' : item}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )
                  })()}
                </>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-400 mb-2">Select a Meal</h3>
                  <p className="text-gray-500 text-sm">Choose a meal time from the left panel to view the menu</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}