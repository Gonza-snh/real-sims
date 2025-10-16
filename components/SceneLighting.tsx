/**
 * Componente de iluminación para escenas 3D
 * Incluye luz ambiental y luz direccional con sombras
 */
export default function SceneLighting({
  ambientIntensity = 0.4,
  sunIntensity = 1.5,
}: {
  ambientIntensity?: number
  sunIntensity?: number
}) {
  return (
    <>
      {/* Luz ambiental - ilumina toda la escena uniformemente */}
      <ambientLight intensity={ambientIntensity} />
      
      {/* Luz direccional - simula el sol con sombras */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
    </>
  )
}

