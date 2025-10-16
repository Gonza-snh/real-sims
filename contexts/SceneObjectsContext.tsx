import React, { createContext, useContext, useRef, useCallback } from 'react'
import * as THREE from 'three'

interface SceneObjectsContextType {
  registerObject: (id: string, object: THREE.Object3D) => void
  unregisterObject: (id: string) => void
  getAllObjects: () => THREE.Object3D[]
  getOtherObjects: (excludeId: string) => THREE.Object3D[]
}

const SceneObjectsContext = createContext<SceneObjectsContextType | null>(null)

/**
 * Provider que mantiene track de todos los objetos en la escena
 * para detección de colisiones
 * 
 * Uso:
 * - Envolver Scene3D o Canvas con este provider
 * - Los objetos se auto-registran al montarse
 * - Se auto-desregistran al desmontarse
 */
export function SceneObjectsProvider({ children }: { children: React.ReactNode }) {
  const objectsMap = useRef<Map<string, THREE.Object3D>>(new Map())

  const registerObject = useCallback((id: string, object: THREE.Object3D) => {
    objectsMap.current.set(id, object)
  }, [])

  const unregisterObject = useCallback((id: string) => {
    objectsMap.current.delete(id)
  }, [])

  const getAllObjects = useCallback(() => {
    return Array.from(objectsMap.current.values())
  }, [])

  const getOtherObjects = useCallback((excludeId: string) => {
    return Array.from(objectsMap.current.entries())
      .filter(([id]) => id !== excludeId)
      .map(([, object]) => object)
  }, [])

  const value = {
    registerObject,
    unregisterObject,
    getAllObjects,
    getOtherObjects
  }

  return (
    <SceneObjectsContext.Provider value={value}>
      {children}
    </SceneObjectsContext.Provider>
  )
}

/**
 * Hook para acceder al contexto de objetos de la escena
 */
export function useSceneObjects() {
  const context = useContext(SceneObjectsContext)
  if (!context) {
    // Si no hay context, retornar funciones vacías (permite usar sin provider)
    return {
      registerObject: () => {},
      unregisterObject: () => {},
      getAllObjects: () => [],
      getOtherObjects: () => []
    }
  }
  return context
}

/**
 * Hook para auto-registrar un objeto en la escena
 * Se encarga automáticamente de registrar/desregistrar en mount/unmount
 */
export function useObjectRegistration(id: string, objectRef: React.RefObject<THREE.Object3D>) {
  const { registerObject, unregisterObject } = useSceneObjects()

  React.useEffect(() => {
    if (objectRef.current) {
      registerObject(id, objectRef.current)
    }

    return () => {
      unregisterObject(id)
    }
  }, [id, objectRef, registerObject, unregisterObject])
}
