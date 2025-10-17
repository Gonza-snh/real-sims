import * as THREE from 'three'

/**
 * Sistema de detección de colisiones para objetos 3D
 * 
 * Utiliza bounding boxes (AABB) para detectar colisiones entre objetos.
 * Es suficientemente preciso para acomodar muebles y objetos en una escena.
 */

/**
 * Calcula el bounding box de un objeto en coordenadas mundiales
 */
export function getWorldBoundingBox(object: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3()
  
  // Encontrar el mesh dentro del objeto
  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      // Calcular bounding box en coordenadas mundiales
      const geometry = child.geometry
      if (!geometry.boundingBox) {
        geometry.computeBoundingBox()
      }
      
      if (geometry.boundingBox) {
        const meshBox = geometry.boundingBox.clone()
        meshBox.applyMatrix4(child.matrixWorld)
        box.union(meshBox)
      }
    }
  })
  
  return box
}

/**
 * Verifica si dos bounding boxes se están intersectando
 */
export function isColliding(box1: THREE.Box3, box2: THREE.Box3): boolean {
  return box1.intersectsBox(box2)
}

/**
 * Verifica si un objeto colisiona con algún otro objeto en la escena
 * 
 * @param object - Objeto a verificar
 * @param allObjects - Array de todos los objetos en la escena
 * @param margin - Margen adicional para colisiones (default: 0.05)
 * @returns El objeto con el que colisiona, o null si no hay colisión
 */
export function checkCollisionWithObjects(
  object: THREE.Object3D,
  allObjects: THREE.Object3D[],
  margin: number = 0.05
): THREE.Object3D | null {
  const objectBox = getWorldBoundingBox(object)
  
  // Expandir el box con el margen
  objectBox.expandByScalar(margin)
  
  // Verificar colisión con cada objeto
  for (const otherObject of allObjects) {
    // Skip si es el mismo objeto
    if (otherObject === object) continue
    
    const otherBox = getWorldBoundingBox(otherObject)
    
    if (isColliding(objectBox, otherBox)) {
      return otherObject
    }
  }
  
  return null
}

/**
 * Empuja suavemente un objeto fuera de una colisión
 * 
 * @param object - Objeto a empujar
 * @param collidingObject - Objeto con el que está colisionando
 * @returns Nueva posición sin colisión
 */
export function pushAwayFromCollision(
  object: THREE.Object3D,
  collidingObject: THREE.Object3D
): THREE.Vector3 {
  const objectBox = getWorldBoundingBox(object)
  const collidingBox = getWorldBoundingBox(collidingObject)
  
  // Calcular centros
  const objectCenter = objectBox.getCenter(new THREE.Vector3())
  const collidingCenter = collidingBox.getCenter(new THREE.Vector3())
  
  // Vector de separación (del objeto colisionante hacia nuestro objeto)
  const separationVector = objectCenter.clone().sub(collidingCenter)
  separationVector.y = 0 // Solo empujar en XZ
  
  // Si los objetos están exactamente en el mismo lugar, empujar en dirección aleatoria
  if (separationVector.lengthSq() < 0.001) {
    separationVector.set(Math.random() - 0.5, 0, Math.random() - 0.5)
  }
  
  // Normalizar y aplicar distancia mínima
  separationVector.normalize()
  
  // Calcular distancia necesaria para separar
  const objectSize = objectBox.getSize(new THREE.Vector3())
  const collidingSize = collidingBox.getSize(new THREE.Vector3())
  const minDistance = (Math.max(objectSize.x, objectSize.z) + Math.max(collidingSize.x, collidingSize.z)) / 2 + 0.1
  
  // Nueva posición empujada
  const newPosition = collidingCenter.clone().add(
    separationVector.multiplyScalar(minDistance)
  )
  newPosition.y = 0 // Mantener en el piso
  
  return newPosition
}

/**
 * Coloca un objeto encima de otro (apilamiento)
 * Calcula basándose SOLO en los meshes, ignorando SelectionBox
 * 
 * @param objectToPlace - Objeto A que será colocado encima
 * @param objectBelow - Objeto B que servirá de base
 * @returns Nueva posición Y para A (encima de B)
 */
export function placeObjectOnTop(
  objectToPlace: THREE.Object3D,
  objectBelow: THREE.Object3D
): number {
  // Buscar solo meshes, ignorando SelectionBox y otros elementos UI
  let belowBox = new THREE.Box3()
  let toPlaceBox = new THREE.Box3()
  
  // Calcular bounding box SOLO de los meshes del objeto de abajo
  // Excluir meshes que son parte del SelectionBox (wireframes, handles, etc.)
  objectBelow.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      // Ignorar meshes con userData.isHandle o que usen LineBasicMaterial/EdgesGeometry
      const isHandle = child.userData?.isHandle === true
      const isWireframe = child.geometry instanceof THREE.EdgesGeometry
      const isSphere = child.geometry instanceof THREE.SphereGeometry && 
                       (child.geometry as THREE.SphereGeometry).parameters.radius < 0.1 // Handles son pequeños
      
      // Solo procesar meshes principales (no UI)
      if (!isHandle && !isWireframe && !isSphere) {
        // Actualizar matriz mundial
        child.updateWorldMatrix(true, false)
        
        // Calcular bounding box del mesh en coordenadas mundiales
        const geometry = child.geometry
        if (!geometry.boundingBox) {
          geometry.computeBoundingBox()
        }
        
        if (geometry.boundingBox) {
          const meshBox = geometry.boundingBox.clone()
          meshBox.applyMatrix4(child.matrixWorld)
          belowBox.union(meshBox)
        }
      }
    }
  })
  
  // Calcular bounding box SOLO de los meshes del objeto a colocar
  objectToPlace.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const isHandle = child.userData?.isHandle === true
      const isWireframe = child.geometry instanceof THREE.EdgesGeometry
      const isSphere = child.geometry instanceof THREE.SphereGeometry && 
                       (child.geometry as THREE.SphereGeometry).parameters.radius < 0.1
      
      if (!isHandle && !isWireframe && !isSphere) {
        child.updateWorldMatrix(true, false)
        
        const geometry = child.geometry
        if (!geometry.boundingBox) {
          geometry.computeBoundingBox()
        }
        
        if (geometry.boundingBox) {
          const meshBox = geometry.boundingBox.clone()
          meshBox.applyMatrix4(child.matrixWorld)
          toPlaceBox.union(meshBox)
        }
      }
    }
  })
  
  // Calcular la altura del mesh de abajo (sin padding del SelectionBox)
  const belowTop = belowBox.max.y
  
  // Calcular la altura base del mesh a colocar (su punto más bajo)
  const toPlaceBottom = toPlaceBox.min.y
  const toPlaceCurrentY = objectToPlace.position.y
  
  // Offset entre el punto más bajo del mesh y su posición Y
  const offset = toPlaceBottom - toPlaceCurrentY
  
  // Nueva posición Y: tope del mesh de abajo - offset del mesh a colocar
  const newY = belowTop - offset
  
  return newY
}

/**
 * Sistema de empuje: Intenta empujar un objeto cuando A colisiona con B
 * 
 * @param pushingObject - Objeto A que está empujando (el que se mueve)
 * @param pushedObject - Objeto B que será empujado
 * @param allOtherObjects - Todos los demás objetos en la escena (para verificar colisiones de B)
 * @returns true si el empuje fue exitoso, false si B no se pudo empujar
 */
export function tryPushObject(
  pushingObject: THREE.Object3D,
  pushedObject: THREE.Object3D,
  allOtherObjects: THREE.Object3D[]
): boolean {
  // Calcular dirección de empuje (de A hacia B)
  const pushingBox = getWorldBoundingBox(pushingObject)
  const pushedBox = getWorldBoundingBox(pushedObject)
  
  const pushingCenter = pushingBox.getCenter(new THREE.Vector3())
  const pushedCenter = pushedBox.getCenter(new THREE.Vector3())
  
  // Vector de empuje (de A hacia B)
  const pushDirection = pushedCenter.clone().sub(pushingCenter)
  pushDirection.y = 0 // Solo en XZ
  
  if (pushDirection.lengthSq() < 0.001) {
    // Si están exactamente encima, empujar en dirección aleatoria
    pushDirection.set(Math.random() - 0.5, 0, Math.random() - 0.5)
  }
  
  pushDirection.normalize()
  
  // Calcular cuánto empujar (hasta que dejen de colisionar + un pequeño margen)
  const pushingSize = pushingBox.getSize(new THREE.Vector3())
  const pushedSize = pushedBox.getSize(new THREE.Vector3())
  const pushDistance = (Math.max(pushingSize.x, pushingSize.z) + Math.max(pushedSize.x, pushedSize.z)) / 2 + 0.05
  
  // Guardar posición original de B
  const originalPosition = pushedObject.position.clone()
  
  // Intentar empujar B
  const newPosition = originalPosition.clone().add(
    pushDirection.multiplyScalar(pushDistance * 0.15) // Empuje mínimo y suave
  )
  newPosition.y = 0
  
  // Aplicar nueva posición temporalmente
  pushedObject.position.copy(newPosition)
  pushedObject.updateWorldMatrix(true, true)
  
  // Verificar si B ahora colisiona con algún otro objeto (excepto A)
  const otherObjectsExceptPushing = allOtherObjects.filter(obj => obj !== pushingObject)
  const collision = checkCollisionWithObjects(pushedObject, otherObjectsExceptPushing, 0.02)
  
  if (collision) {
    // B colisiona con otro objeto → NO se puede empujar
    // Revertir posición de B
    pushedObject.position.copy(originalPosition)
    pushedObject.updateWorldMatrix(true, true)
    return false
  }
  
  // B se empujó exitosamente sin colisionar con nada más
  return true
}

/**
 * Detecta si un objeto tiene otro objeto encima de él
 * 
 * @param object - Objeto a verificar
 * @param allObjects - Array de todos los objetos en la escena
 * @param tolerance - Margen de tolerancia para considerar "encima" (default: 0.1)
 * @returns true si hay un objeto encima, false si no
 */
export function hasObjectOnTop(
  object: THREE.Object3D,
  allObjects: THREE.Object3D[],
  tolerance: number = 0.1
): boolean {
  const objectBox = getWorldBoundingBox(object)
  const objectTopY = objectBox.max.y
  
  // Verificar cada otro objeto
  for (const otherObject of allObjects) {
    if (otherObject === object) continue
    
    const otherBox = getWorldBoundingBox(otherObject)
    const otherBottomY = otherBox.min.y
    
    // Si el otro objeto está encima (su base está cerca o por encima del tope de este objeto)
    if (otherBottomY >= objectTopY - tolerance) {
      // Verificar si se solapan en el plano XZ
      const objectMinX = objectBox.min.x
      const objectMaxX = objectBox.max.x
      const objectMinZ = objectBox.min.z
      const objectMaxZ = objectBox.max.z
      
      const otherMinX = otherBox.min.x
      const otherMaxX = otherBox.max.x
      const otherMinZ = otherBox.min.z
      const otherMaxZ = otherBox.max.z
      
      // Verificar solapamiento en XZ
      const overlapX = !(objectMaxX < otherMinX || objectMinX > otherMaxX)
      const overlapZ = !(objectMaxZ < otherMinZ || objectMinZ > otherMaxZ)
      
      if (overlapX && overlapZ) {
        return true
      }
    }
  }
  
  return false
}
