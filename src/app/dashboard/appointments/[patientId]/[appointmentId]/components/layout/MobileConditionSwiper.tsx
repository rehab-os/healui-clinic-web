'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { MoreVertical, LogOut, Check } from 'lucide-react'

interface Condition {
  id: string
  condition_name: string
  body_region?: string
  treatment_focus?: string
  condition?: {
    status?: string
  }
}

interface MobileConditionSwiperProps {
  conditions: Condition[]
  activeIndex: number
  onIndexChange: (index: number) => void
  onDischarge?: () => void
  onReactivate?: () => void
}

const swipeThreshold = 50

export default function MobileConditionSwiper({
  conditions,
  activeIndex,
  onIndexChange,
  onDischarge,
  onReactivate,
}: MobileConditionSwiperProps) {
  const [direction, setDirection] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  if (conditions.length === 0) return null

  const condition = conditions[activeIndex]
  const status = condition?.condition?.status?.toUpperCase()
  const isDischarged = status === 'DISCHARGED'
  const statusDot = status === 'ACTIVE' ? 'bg-teal-500' : status === 'CHRONIC' ? 'bg-amber-500' : 'bg-gray-400'
  const hasMultiple = conditions.length > 1
  const hasOverflow = onDischarge || onReactivate

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (!hasMultiple) return
    const { offset, velocity } = info
    if (offset.x < -swipeThreshold || velocity.x < -500) {
      if (activeIndex < conditions.length - 1) {
        setDirection(1)
        onIndexChange(activeIndex + 1)
      }
    } else if (offset.x > swipeThreshold || velocity.x > 500) {
      if (activeIndex > 0) {
        setDirection(-1)
        onIndexChange(activeIndex - 1)
      }
    }
  }

  const cardContent = (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot}`} />
      <h3 className="text-xs font-semibold text-gray-900 truncate flex-1 min-w-0">
        {condition.condition_name}
      </h3>
      {condition.treatment_focus === 'PRIMARY' && hasMultiple && (
        <span className="text-[9px] px-1 py-0.5 bg-teal-50 text-teal-700 rounded font-medium flex-shrink-0">
          Primary
        </span>
      )}
      {condition.body_region && (
        <span className="text-[11px] text-gray-400 flex-shrink-0 hidden min-[400px]:inline">
          {condition.body_region}
        </span>
      )}
      {hasOverflow && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                {!isDischarged && onDischarge ? (
                  <button
                    onClick={() => { setShowMenu(false); onDischarge() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Discharge Condition
                  </button>
                ) : onReactivate ? (
                  <button
                    onClick={() => { setShowMenu(false); onReactivate() }}
                    className="w-full text-left px-4 py-2.5 text-sm text-brand-teal hover:bg-teal-50 flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Reactivate Condition
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="lg:hidden mb-2">
      {hasMultiple ? (
        <>
          {/* Swipeable card */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={condition.id}
                custom={direction}
                initial={{ x: direction > 0 ? 200 : -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -200 : 200, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="bg-white rounded-lg px-3.5 py-2 touch-pan-y"
              >
                {cardContent}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-1 pt-1 pb-0.5">
            {conditions.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  setDirection(i > activeIndex ? 1 : -1)
                  onIndexChange(i)
                }}
                className={`rounded-full transition-all duration-200 ${
                  i === activeIndex
                    ? 'w-5 h-1.5 bg-brand-teal'
                    : 'w-1.5 h-1.5 bg-gray-300'
                }`}
                aria-label={`Go to ${c.condition_name}`}
              />
            ))}
          </div>
        </>
      ) : (
        /* Single condition — static card */
        <div className="bg-white rounded-lg px-3.5 py-2">
          {cardContent}
        </div>
      )}
    </div>
  )
}
