import React, { useRef, useMemo } from 'react'
import * as THREE from 'three'
import SelectionBox from './SelectionBox'
import SelectableObject from './SelectableObject'
import { useSceneObjects } from '@/contexts/SceneObjectsContext'
import { hasObjectOnTop } from '@/utils/collisionDetection'

interface DemoObjectsProps {
  objectColor: string
  objectMetalness: number
  objectRoughness: number
  onObjectClick: (object: THREE.Group, isMultiSelectMode?: boolean) => void
  on3DClick?: () => void
  selectedObject: THREE.Object3D | null
  selectedObjects?: THREE.Object3D[]
  onRotationStart?: () => void
  onRotationEnd?: () => void
  onObjectDragStart?: () => void
  onObjectDragEnd?: () => void
  onScaleStart?: () => void
  onScaleEnd?: () => void
  interactionsDisabled?: boolean
  hideHandles?: boolean
}

/**
 * Objetos de demostración para testing
 * TODO: Reemplazar con objetos reales desde Supabase
 * 
 * IMPORTANTE: Los objetos están configurados como objetos importados (SketchUp/Blender):
 * - Cada mesh tiene position=[0,0,0] (origen local)
 * - La geometría está trasladada para que el origen (0,0,0) esté en la BASE del objeto
 * - El grupo puede estar en cualquier posición mundial
 * - Esto simula objetos 3D reales como muebles que tienen su origen en el piso
 * 
 * Escalabilidad: Cada objeto simplemente necesita:
 * 1. Un ref de tipo THREE.Group
 * 2. Un SelectableObject wrapper
 * 3. Un conditional render del SelectionBox si selectedObject === objectRef.current
 */
export default function DemoObjects({
  objectColor,
  objectMetalness,
  objectRoughness,
  onObjectClick,
  on3DClick,
  selectedObject,
  selectedObjects = [],
  onRotationStart,
  onRotationEnd,
  onObjectDragStart,
  onObjectDragEnd,
  onScaleStart,
  onScaleEnd,
  interactionsDisabled = false,
  hideHandles = false
}: DemoObjectsProps) {
  const cubeRef = useRef<THREE.Group>(null!)
  const cylinderRef = useRef<THREE.Group>(null!)
  const { getAllObjects } = useSceneObjects()
  
  // Verificar si cada objeto tiene algo encima
  const cubeHasObjectOnTop = cubeRef.current ? hasObjectOnTop(cubeRef.current, getAllObjects()) : false
  const cylinderHasObjectOnTop = cylinderRef.current ? hasObjectOnTop(cylinderRef.current, getAllObjects()) : false

  // Geometrías con origen en la base (como SketchUp)
  const cubeGeometry = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    // Trasladar la geometría hacia abajo para que el origen (0,0,0) esté en la base
    geometry.translate(0, 0.5, 0)
    return geometry
  }, [])

  const cylinderGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32)
    // Trasladar la geometría hacia abajo para que el origen (0,0,0) esté en la base
    geometry.translate(0, 0.75, 0)
    return geometry
  }, [])

  return (
    <>
      {/* CUBO - Objeto de demostración */}
      <SelectableObject
        objectId="demo-cube"
        objectRef={cubeRef}
        selectedObject={selectedObject}
        selectedObjects={selectedObjects}
        onObjectClick={onObjectClick}
        on3DClick={on3DClick}
        onObjectDragStart={onObjectDragStart}
        onObjectDragEnd={onObjectDragEnd}
        interactionsDisabled={interactionsDisabled}
      >
        <group ref={cubeRef} position={[0, 0, 0]}>
          {/* Mesh en origen local (0,0,0) - geometría trasladada para que el origen esté en la base */}
          <mesh 
            position={[0, 0, 0]} 
            castShadow 
            receiveShadow
          >
            <primitive object={cubeGeometry} />
            <meshStandardMaterial
              color={objectColor}
              metalness={objectMetalness}
              roughness={objectRoughness}
            />
          </mesh>

          {/* SelectionBox si este objeto está seleccionado (individual o múltiple) */}
          {(selectedObject === cubeRef.current || selectedObjects.includes(cubeRef.current)) && (
            <SelectionBox
              selectedObject={selectedObject || cubeRef.current}
              onRotationStart={onRotationStart}
              onRotationEnd={onRotationEnd}
              onScaleStart={onScaleStart}
              onScaleEnd={onScaleEnd}
              objectId="demo-cube"
              showHandles={selectedObject === cubeRef.current && !cubeHasObjectOnTop && !hideHandles}
            />
          )}
        </group>
      </SelectableObject>

      {/* CILINDRO - Objeto de demostración */}
      <SelectableObject
        objectId="demo-cylinder"
        objectRef={cylinderRef}
        selectedObject={selectedObject}
        selectedObjects={selectedObjects}
        onObjectClick={onObjectClick}
        on3DClick={on3DClick}
        onObjectDragStart={onObjectDragStart}
        onObjectDragEnd={onObjectDragEnd}
        interactionsDisabled={interactionsDisabled}
      >
        <group ref={cylinderRef} position={[2, 0, 0]}>
          {/* Mesh en origen local (0,0,0) - la geometría se extiende hacia arriba naturalmente */}
          <mesh 
            position={[0, 0, 0]} 
            castShadow 
            receiveShadow
          >
            <primitive object={cylinderGeometry} />
            <meshStandardMaterial
              color={objectColor}
              metalness={objectMetalness}
              roughness={objectRoughness}
            />
          </mesh>

          {/* SelectionBox si este objeto está seleccionado (individual o múltiple) */}
          {(selectedObject === cylinderRef.current || selectedObjects.includes(cylinderRef.current)) && (
            <SelectionBox
              selectedObject={selectedObject || cylinderRef.current}
              onRotationStart={onRotationStart}
              onRotationEnd={onRotationEnd}
              onScaleStart={onScaleStart}
              onScaleEnd={onScaleEnd}
              objectId="demo-cylinder"
              showHandles={selectedObject === cylinderRef.current && !cylinderHasObjectOnTop && !hideHandles}
            />
          )}
        </group>
      </SelectableObject>
    </>
  )
}