import * as THREE from 'three'

/**
 * Configuración de la grilla
 */
export const GRID_CONFIG = {
  cellSize: 0.1,      // Tamaño de cada celda de la grilla (10 cm)
}

/**
 * Aplica snap a la grilla a una posición 3D
 * @param position - Posición original
 * @param snapEnabled - Si el snap está habilitado
 * @returns Nueva posición con snap aplicado
 */
export function snapToGrid(position: THREE.Vector3, snapEnabled: boolean = true): THREE.Vector3 {
  if (!snapEnabled) {
    return position.clone()
  }

  const snapped = position.clone()
  
  // Snap en X y Z (horizontal), mantener Y (altura)
  snapped.x = Math.round(snapped.x / GRID_CONFIG.cellSize) * GRID_CONFIG.cellSize
  snapped.z = Math.round(snapped.z / GRID_CONFIG.cellSize) * GRID_CONFIG.cellSize
  
  return snapped
}

/**
 * Aplica snap a la grilla a un ángulo de rotación
 * @param angle - Ángulo original en radianes
 * @param snapEnabled - Si el snap está habilitado
 * @returns Nuevo ángulo con snap aplicado (en incrementos de 10 grados)
 */
export function snapAngleToGrid(angle: number, snapEnabled: boolean = true): number {
  if (!snapEnabled) {
    return angle
  }

  // Snap a incrementos de 10 grados (π/18 radianes)
  const snapIncrement = Math.PI / 18 // 10 grados
  return Math.round(angle / snapIncrement) * snapIncrement
}
