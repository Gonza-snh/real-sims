'use client'

import { useEffect, useState, useRef } from 'react'

interface SelectionBoxOverlayProps {
  isActive: boolean
  onSelectionComplete?: (bounds: { left: number; top: number; right: number; bottom: number }) => void
}

interface BoxBounds {
  left: number
  top: number
  width: number
  height: number
}

export default function SelectionBoxOverlay({ isActive, onSelectionComplete }: SelectionBoxOverlayProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const [box, setBox] = useState<BoxBounds | null>(null)
  const hasMoved = useRef(false)
  
  // Usar refs para acceder a los valores actuales en los event handlers
  const isDrawingRef = useRef(isDrawing)
  const startPosRef = useRef(startPos)
  const boxRef = useRef(box)
  
  useEffect(() => {
    isDrawingRef.current = isDrawing
  }, [isDrawing])
  
  useEffect(() => {
    startPosRef.current = startPos
  }, [startPos])
  
  useEffect(() => {
    boxRef.current = box
  }, [box])

  useEffect(() => {
    if (!isActive) {
      setIsDrawing(false)
      setStartPos(null)
      setCurrentPos(null)
      setBox(null)
      return
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Solo empezar si es click izquierdo
      if (e.button !== 0) return
      
      // Evitar que se ejecute si haces click en un objeto 3D
      const target = e.target as HTMLElement
      if (target.tagName.toLowerCase() === 'canvas') {
        hasMoved.current = false
        setIsDrawing(true)
        setStartPos({ x: e.clientX, y: e.clientY })
        setCurrentPos({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current || !startPosRef.current) return
      
      // Detectar si se movió más de 3px (para diferenciar click de drag)
      const deltaX = Math.abs(e.clientX - startPosRef.current.x)
      const deltaY = Math.abs(e.clientY - startPosRef.current.y)
      if (deltaX > 3 || deltaY > 3) {
        hasMoved.current = true
      }
      
      setCurrentPos({ x: e.clientX, y: e.clientY })
      
      // Calcular el rectángulo del marco
      const left = Math.min(startPosRef.current.x, e.clientX)
      const top = Math.min(startPosRef.current.y, e.clientY)
      const width = Math.abs(e.clientX - startPosRef.current.x)
      const height = Math.abs(e.clientY - startPosRef.current.y)
      
      setBox({ left, top, width, height })
    }

    const handleMouseUp = () => {
      // Solo completar selección si hubo movimiento (drag)
      if (isDrawingRef.current && boxRef.current && onSelectionComplete && hasMoved.current) {
        // Notificar los bounds del marco antes de limpiarlo
        const bounds = {
          left: boxRef.current.left,
          top: boxRef.current.top,
          right: boxRef.current.left + boxRef.current.width,
          bottom: boxRef.current.top + boxRef.current.height
        }
        onSelectionComplete(bounds)
      }
      
      if (isDrawingRef.current) {
        setIsDrawing(false)
        setStartPos(null)
        setCurrentPos(null)
        setBox(null)
        hasMoved.current = false
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isActive, onSelectionComplete])

  if (!isActive || !box || !isDrawing) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        border: '1.5px solid white',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    />
  )
}

