/**
 * Utilidades para colores del sistema de diseño
 * Convierte variables CSS a valores que Three.js puede usar
 */

/**
 * Convierte un color hexadecimal a número para Three.js
 * @param hex - Color hexadecimal (ej: "#00FFFF" o "00FFFF")
 * @returns Número para Three.js (ej: 0x00FFFF)
 */
export function hexToThreeColor(hex: string): number {
  // Remover # si existe
  const cleanHex = hex.replace('#', '')
  return parseInt(cleanHex, 16)
}

/**
 * Obtiene el color de selección desde CSS variables
 * @returns Color cyan para elementos de selección
 */
export function getSelectionColor(): number {
  return hexToThreeColor('#00FFFF') // Cyan
}

/**
 * Obtiene el color de hover para elementos de selección
 * @returns Color cyan más claro para hover
 */
export function getSelectionHoverColor(): number {
  return hexToThreeColor('#00E6E6') // Cyan más claro
}

/**
 * Obtiene el color para elementos de selección múltiple (movimiento/duplicación)
 * @returns Color cyan para movimiento
 */
export function getMultiSelectionColor(): number {
  return hexToThreeColor('#00FFFF') // Cyan
}

/**
 * Obtiene el color para elementos de rotación múltiple
 * @returns Color cyan para rotación
 */
export function getMultiRotationColor(): number {
  return hexToThreeColor('#00FFFF') // Cyan
}

/**
 * Obtiene el grosor para líneas de wireframe y handles
 * @returns Grosor de líneas de selección
 */
export function getSelectionLineWidth(): number {
  return 2 // Grosor similar a las líneas gruesas de la grilla
}

/**
 * Obtiene la elevación para handles de rotación
 * @returns Elevación en metros para que los handles sean visibles sobre superficies
 */
export function getHandleElevation(): number {
  return 0 // Sin elevación adicional - ahora el suelo está más abajo
}

/**
 * Obtiene el tamaño para handles de esquina
 * @returns Radio de las esferas de esquina
 */
export function getCornerHandleSize(): number {
  return 0.035 // Radio de esferas de esquina
}

/**
 * Obtiene el tamaño para handle de rotación
 * @returns Radio de la esfera de rotación (más grande que las de esquina)
 */
export function getRotationHandleSize(): number {
  return 0.05 // Radio de esfera de rotación (más grande)
}

/**
 * Obtiene la elevación del suelo para evitar z-fighting
 * @returns Elevación del suelo en metros
 */
export function getFloorElevation(): number {
  return DESIGN_COLORS.elevacionSuelo
}

/**
 * Colores del sistema de diseño
 */
export const DESIGN_COLORS = {
  // Colores principales
  oscuro: '#242423',
  amarillo: '#EFE9D3',
  gris: '#E6E6E6',
  grisClaro: '#F7F5EF',
  grisMedio: '#6B7280',
  
  // Colores de selección
  seleccion: '#00FFFF',
  seleccionHover: '#00E6E6',
  seleccionLinea: '#00FFFF',
  
  // Colores para selección múltiple
  multiSeleccion: '#00FFFF', // Cyan para movimiento/duplicación
  multiSeleccionRotacion: '#00FFFF', // Cyan para rotación
  
  // Grosor de líneas
  grosorSeleccion: 2,
  
  // Elevación de handles
  elevacionHandle: 0, // Sin elevación adicional - ahora el suelo está más abajo
  
  // Elevación del suelo
  elevacionSuelo: -0.002, // 2mm por debajo de la grilla para evitar z-fighting
  
  // Tamaños de handles
  tamanoHandleEsquina: 0.035, // Radio de esferas de esquina
  tamanoHandleRotacion: 0.05, // Radio de esfera de rotación (más grande)
} as const

/**
 * Convierte colores del sistema a valores Three.js
 */
export const THREE_COLORS = {
  oscuro: hexToThreeColor(DESIGN_COLORS.oscuro),
  amarillo: hexToThreeColor(DESIGN_COLORS.amarillo),
  gris: hexToThreeColor(DESIGN_COLORS.gris),
  grisClaro: hexToThreeColor(DESIGN_COLORS.grisClaro),
  grisMedio: hexToThreeColor(DESIGN_COLORS.grisMedio),
  
  seleccion: hexToThreeColor(DESIGN_COLORS.seleccion),
  seleccionHover: hexToThreeColor(DESIGN_COLORS.seleccionHover),
  seleccionLinea: hexToThreeColor(DESIGN_COLORS.seleccionLinea),
} as const
