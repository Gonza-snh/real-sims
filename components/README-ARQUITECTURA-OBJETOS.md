# 🏗️ Arquitectura de Objetos 3D - Sistema Escalable

## 📋 Índice
1. [Visión General](#visión-general)
2. [Componentes](#componentes)
3. [Flujo de Datos](#flujo-de-datos)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Migración desde DemoObjects](#migración-desde-demoobjects)

---

## 🎯 Visión General

Sistema modular para manejar objetos 3D con funcionalidades completas:
- ✅ **Selección**: Click para seleccionar/deseleccionar
- ✅ **Cursors inteligentes**: `pointer` → `grab` → `grabbing`
- ✅ **Drag XZ intuitivo**: Movimiento natural desde cualquier ángulo de cámara
- ✅ **Bounding box**: Visual feedback con handles
- ✅ **Rotación Y-axis**: Handle circular para girar objetos
- ✅ **Escalable**: Funciona con objetos demo y reales

---

## 🧩 Componentes

### 1. `SelectableObject` (Base Component)
**Archivo**: `components/SelectableObject.tsx`

**Propósito**: Wrapper que agrega toda la funcionalidad de selección, cursors y drag a cualquier objeto 3D.

**Props**:
```typescript
interface SelectableObjectProps {
  children: React.ReactNode              // Contenido 3D del objeto
  objectRef: React.RefObject<THREE.Group> // Referencia al grupo del objeto
  selectedObject: THREE.Object3D | null   // Estado global del objeto seleccionado
  onObjectClick: (object: THREE.Group) => void  // Callback al hacer click
  on3DClick?: () => void                 // Callback genérico para clicks en 3D
  onObjectDragStart?: () => void         // Callback al iniciar drag
  onObjectDragEnd?: () => void           // Callback al terminar drag
}
```

**Funcionalidades incluidas**:
- **Cursors automáticos**:
  - `pointer`: Objeto NO seleccionado en hover
  - `grab`: Objeto seleccionado en hover
  - `grabbing`: Durante el drag
  - `auto`: Estado normal
  
- **Drag inteligente**:
  - Proyección en plano XZ basada en orientación de cámara
  - Movimiento intuitivo desde cualquier ángulo
  - Mantiene Y=0 (siempre en el piso)
  
- **Event handling**:
  - `onClick`: Selección/deselección
  - `onPointerEnter`: Hover start
  - `onPointerLeave`: Hover end
  - `onPointerDown`: Inicio de drag

**Ejemplo de uso**:
```typescript
<SelectableObject
  objectRef={cubeRef}
  selectedObject={selectedObject}
  onObjectClick={handleObjectClick}
  on3DClick={handle3DClick}
  onObjectDragStart={handleDragStart}
  onObjectDragEnd={handleDragEnd}
>
  <group ref={cubeRef} position={[0, 0, 0]}>
    <mesh>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  </group>
</SelectableObject>
```

---

### 2. `DemoObjects` (Demo Component)
**Archivo**: `components/DemoObjects.tsx`

**Propósito**: Objetos de prueba para testing. Muestra cómo usar `SelectableObject`.

**Características**:
- ✅ Geometrías con origen en la base (como SketchUp)
- ✅ Usa `SelectableObject` para funcionalidad
- ✅ Incluye `SelectionBox` condicional
- ✅ Fácil de reemplazar con objetos reales

**Objetos de demo**:
1. **Cubo**: `position={[0, 0, 0]}`
2. **Cilindro**: `position={[2, 0, 0]}`

---

### 3. `ImportedObject` (Production Component)
**Archivo**: `components/ImportedObject.tsx`

**Propósito**: Componente para objetos 3D importados (GLTF, GLB, SketchUp, Blender).

**Props**:
```typescript
interface ImportedObjectProps {
  modelPath: string                       // Ruta al modelo 3D
  position: [number, number, number]      // Posición XYZ
  rotation?: [number, number, number]     // Rotación XYZ (opcional)
  scale?: [number, number, number]        // Escala XYZ (opcional)
  selectedObject: THREE.Object3D | null   // Estado global
  onObjectClick: (object: THREE.Group) => void
  on3DClick?: () => void
  onRotationStart?: () => void
  onRotationEnd?: () => void
  onObjectDragStart?: () => void
  onObjectDragEnd?: () => void
}
```

**Ejemplo de uso**:
```typescript
<ImportedObject
  modelPath="/models/sofa.glb"
  position={[1, 0, 2]}
  rotation={[0, Math.PI/4, 0]}
  scale={[1, 1, 1]}
  selectedObject={selectedObject}
  onObjectClick={handleObjectClick}
  on3DClick={handle3DClick}
  onRotationStart={handleRotationStart}
  onRotationEnd={handleRotationEnd}
  onObjectDragStart={handleDragStart}
  onObjectDragEnd={handleDragEnd}
/>
```

---

### 4. `ObjectRenderer` (Batch Renderer)
**Archivo**: `components/ObjectRenderer.tsx`

**Propósito**: Renderizar múltiples objetos desde una base de datos.

**Props**:
```typescript
interface ObjectData {
  id: string
  name: string
  modelPath: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  color?: string
  metalness?: number
  roughness?: number
}

interface ObjectRendererProps {
  objects: ObjectData[]
  selectedObject: THREE.Object3D | null
  onObjectClick: (object: THREE.Group) => void
  on3DClick?: () => void
  onRotationStart?: () => void
  onRotationEnd?: () => void
  onObjectDragStart?: () => void
  onObjectDragEnd?: () => void
}
```

**Ejemplo de uso con Supabase**:
```typescript
// Hook personalizado
const { objects, loading, error } = useObjectsFromSupabase('room_id_123')

// Renderizado
<ObjectRenderer
  objects={objects}
  selectedObject={selectedObject}
  onObjectClick={handleObjectClick}
  on3DClick={handle3DClick}
  onRotationStart={handleRotationStart}
  onRotationEnd={handleRotationEnd}
  onObjectDragStart={handleDragStart}
  onObjectDragEnd={handleDragEnd}
/>
```

---

### 5. `SelectionBox` (Visual Feedback)
**Archivo**: `components/SelectionBox.tsx`

**Propósito**: Bounding box con handles para objetos seleccionados.

**Características**:
- ✅ **Wireframe box**: Rota junto con el objeto
- ✅ **Corner handles**: 8 esferas blancas en las esquinas
- ✅ **Rotation handle**: Círculo blanco en la arista más cercana a la cámara
- ✅ **Padding inteligente**: Flush con el piso (sin padding abajo)

**Nota**: `SelectionBox` debe ser hijo del grupo del objeto para rotar correctamente.

---

## 🔄 Flujo de Datos

### Estado Global (Scene3D.tsx)
```typescript
const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null)
const [isRotatingObject, setIsRotatingObject] = useState(false)
```

### Callbacks
```typescript
const handleObjectClick = (object: THREE.Group) => {
  setSelectedObject(object)
  setActiveTool('seleccionar')
  setTransformMode(null)
  onObjectSelection(true)
}

const handle3DClick = () => {
  if (activeTool !== 'seleccionar' && !['mover', 'rotar', 'escalar'].includes(activeTool)) {
    setActiveTool('seleccionar')
  }
}

const handleRotationStart = () => setIsRotatingObject(true)
const handleRotationEnd = () => setIsRotatingObject(false)
const handleDragStart = () => orbitControlsRef.current.enabled = false
const handleDragEnd = () => orbitControlsRef.current.enabled = true
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Objetos Demo (Actual)
```typescript
<DemoObjects
  objectColor="#ff6347"
  objectMetalness={0.3}
  objectRoughness={0.7}
  selectedObject={selectedObject}
  onObjectClick={handleObjectClick}
  on3DClick={handle3DClick}
  onRotationStart={handleRotationStart}
  onRotationEnd={handleRotationEnd}
  onObjectDragStart={handleDragStart}
  onObjectDragEnd={handleDragEnd}
/>
```

### Ejemplo 2: Objeto Individual Importado
```typescript
<ImportedObject
  modelPath="/models/sofa.glb"
  position={[0, 0, 0]}
  rotation={[0, Math.PI/4, 0]}
  scale={[1.2, 1.2, 1.2]}
  selectedObject={selectedObject}
  onObjectClick={handleObjectClick}
  on3DClick={handle3DClick}
  onRotationStart={handleRotationStart}
  onRotationEnd={handleRotationEnd}
  onObjectDragStart={handleDragStart}
  onObjectDragEnd={handleDragEnd}
/>
```

### Ejemplo 3: Múltiples Objetos desde BD
```typescript
// Datos desde Supabase
const objects = [
  {
    id: '1',
    name: 'Sofa',
    modelPath: '/models/sofa.glb',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    id: '2',
    name: 'Table',
    modelPath: '/models/table.glb',
    position: { x: 2, y: 0, z: 1 },
    rotation: { x: 0, y: Math.PI/4, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }
]

// Renderizado
<ObjectRenderer
  objects={objects}
  selectedObject={selectedObject}
  onObjectClick={handleObjectClick}
  on3DClick={handle3DClick}
  onRotationStart={handleRotationStart}
  onRotationEnd={handleRotationEnd}
  onObjectDragStart={handleDragStart}
  onObjectDragEnd={handleDragEnd}
/>
```

---

## 🔄 Migración desde DemoObjects

### Paso 1: Preparar datos
```typescript
// Estructura de datos desde Supabase
type RoomObject = {
  id: string
  room_id: string
  model_path: string
  position_x: number
  position_y: number
  position_z: number
  rotation_x: number
  rotation_y: number
  rotation_z: number
  scale_x: number
  scale_y: number
  scale_z: number
  created_at: string
  updated_at: string
}

// Transformar a formato de ObjectRenderer
const objects: ObjectData[] = roomObjects.map(obj => ({
  id: obj.id,
  name: obj.name || 'Objeto',
  modelPath: obj.model_path,
  position: { x: obj.position_x, y: obj.position_y, z: obj.position_z },
  rotation: { x: obj.rotation_x, y: obj.rotation_y, z: obj.rotation_z },
  scale: { x: obj.scale_x, y: obj.scale_y, z: obj.scale_z }
}))
```

### Paso 2: Reemplazar componente
```typescript
// Antes (Scene3D.tsx)
<DemoObjects
  objectColor={objectColor}
  objectMetalness={objectMetalness}
  objectRoughness={objectRoughness}
  selectedObject={selectedObject}
  onObjectClick={handleObjectSelection}
  on3DClick={handle3DClick}
  onRotationStart={() => setIsRotatingObject(true)}
  onRotationEnd={() => setIsRotatingObject(false)}
  onObjectDragStart={() => { if (orbitControlsRef.current) orbitControlsRef.current.enabled = false }}
  onObjectDragEnd={() => { if (orbitControlsRef.current) orbitControlsRef.current.enabled = true }}
/>

// Después (Scene3D.tsx)
<ObjectRenderer
  objects={objects}
  selectedObject={selectedObject}
  onObjectClick={handleObjectSelection}
  on3DClick={handle3DClick}
  onRotationStart={() => setIsRotatingObject(true)}
  onRotationEnd={() => setIsRotatingObject(false)}
  onObjectDragStart={() => { if (orbitControlsRef.current) orbitControlsRef.current.enabled = false }}
  onObjectDragEnd={() => { if (orbitControlsRef.current) orbitControlsRef.current.enabled = true }}
/>
```

### Paso 3: Agregar fetch de datos
```typescript
const [roomObjects, setRoomObjects] = useState<ObjectData[]>([])

useEffect(() => {
  async function fetchRoomObjects() {
    const { data, error } = await supabase
      .from('room_objects')
      .select('*')
      .eq('room_id', currentRoomId)
    
    if (data) {
      const objects = data.map(obj => ({
        id: obj.id,
        name: obj.name,
        modelPath: obj.model_path,
        position: { x: obj.position_x, y: obj.position_y, z: obj.position_z },
        rotation: { x: obj.rotation_x, y: obj.rotation_y, z: obj.rotation_z },
        scale: { x: obj.scale_x, y: obj.scale_y, z: obj.scale_z }
      }))
      setRoomObjects(objects)
    }
  }
  
  fetchRoomObjects()
}, [currentRoomId])
```

---

## 🎉 Ventajas del Sistema

### ✅ Escalabilidad
- Un solo componente base (`SelectableObject`)
- Funciona con objetos demo y reales
- Renderizado masivo desde BD

### ✅ Mantenimiento
- Lógica centralizada
- Cambios en un solo lugar
- Fácil de debuggear

### ✅ Consistencia
- Mismo comportamiento en toda la app
- Cursors predecibles
- UX profesional

### ✅ Future-proof
- Compatible con SketchUp
- Compatible con Blender
- Soporte GLTF/GLB nativo
- Integración BD lista

---

## 📚 Recursos

- **Three.js Docs**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **Drei Components**: https://github.com/pmndrs/drei
- **SketchUp Export**: https://help.sketchup.com/en/exporting-3d-models

---

## 🐛 Troubleshooting

### Problema: Drag invertido
**Solución**: Asegúrate de que `SelectableObject` use la proyección basada en cámara con inversión de `deltaY`:
```typescript
const moveX = deltaX * right.x - deltaY * forward.x
const moveZ = deltaX * right.z - deltaY * forward.z
```

### Problema: Bounding box no rota con objeto
**Solución**: `SelectionBox` debe ser hijo del grupo del objeto:
```typescript
<group ref={objectRef}>
  <mesh>...</mesh>
  {selectedObject === objectRef.current && (
    <SelectionBox selectedObject={selectedObject} />
  )}
</group>
```

### Problema: Cursors no cambian
**Solución**: Verifica que `isDragging` esté actualizado en los event handlers:
```typescript
onPointerEnter={(e) => {
  if (!isDragging) {
    document.body.style.cursor = 'grab'
  }
}}
```

---

**¡Sistema listo para producción!** 🚀
