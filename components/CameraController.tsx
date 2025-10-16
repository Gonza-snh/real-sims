import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraControllerProps {
  cameraType: 'perspective' | 'orthographic'
}

/**
 * Componente para manejar el cambio dinámico entre cámara perspectiva y ortográfica
 * Mantiene la posición y orientación de la cámara al cambiar entre tipos
 */
export default function CameraController({ cameraType }: CameraControllerProps) {
  const { camera, gl, set, size } = useThree()
  const previousCameraType = useRef<string>('perspective')

  // Cambiar tipo de cámara
  useEffect(() => {
    // Solo cambiar si realmente cambió el tipo
    if (!camera || !gl || previousCameraType.current === cameraType) return
    
    console.log('🔄 CAMBIANDO CÁMARA de', previousCameraType.current, 'a', cameraType)
    const currentPosition = camera.position.clone()
    const currentQuaternion = camera.quaternion.clone()

    if (cameraType === 'orthographic') {
      // Crear cámara ortográfica
      const aspect = size.width / size.height
      
      // Calcular frustumSize para mantener el mismo nivel de zoom
      // Simular el FOV de perspectiva en ortográfica
      const distance = currentPosition.length()
      const fovInRadians = 50 * (Math.PI / 180) // FOV de 50 grados en radianes
      const frustumSize = 2 * distance * Math.tan(fovInRadians / 2)
      
      const newCamera = new THREE.OrthographicCamera(
        -frustumSize * aspect / 2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        1000
      )
      
      newCamera.position.copy(currentPosition)
      newCamera.quaternion.copy(currentQuaternion)
      
      // Reemplazar la cámara en el sistema usando set de R3F
      set({ camera: newCamera })
    } else {
      // Crear cámara perspectiva
      const newCamera = new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 1000)
      
      newCamera.position.copy(currentPosition)
      newCamera.quaternion.copy(currentQuaternion)
      
      // Reemplazar la cámara en el sistema usando set de R3F
      set({ camera: newCamera })
    }
    
    previousCameraType.current = cameraType
  }, [cameraType, camera, gl, set, size.width, size.height])

  // Manejar redimensionado de ventana para cámara ortográfica
  useEffect(() => {
    if (!camera || cameraType !== 'orthographic') return
    
    // Solo actualizar si es cámara ortográfica
    if (camera instanceof THREE.OrthographicCamera) {
      const aspect = size.width / size.height
      
      // Usar el mismo cálculo para mantener zoom consistente
      const distance = camera.position.length()
      const fovInRadians = 50 * (Math.PI / 180) // FOV de 50 grados en radianes
      const frustumSize = 2 * distance * Math.tan(fovInRadians / 2)
      
      camera.left = -frustumSize * aspect / 2
      camera.right = frustumSize * aspect / 2
      camera.top = frustumSize / 2
      camera.bottom = -frustumSize / 2
      camera.updateProjectionMatrix()
    }
  }, [size.width, size.height, camera, cameraType])

  return null
}

