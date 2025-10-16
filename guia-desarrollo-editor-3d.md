# Guía para Desarrollar Editor 3D de Espacios Interiores

## Análisis de pCon.planner

### Formato .pbox
El archivo `.pbox` es un ZIP que contiene:
- `document.json` - Escena 3D completa con nodos jerárquicos
- `room.ifc` - Formato IFC estándar para arquitectura/BIM
- `resources/project.obk` - Configuraciones del proyecto
- `geometries/` - Modelos 3D en formato GLB con hash MD5
- `geometries2d/` - Geometrías para vistas en planta
- `textures/` - Texturas JPG para materiales
- `product_images/` - Imágenes del catálogo

### Funcionalidades Principales
- Diseño de interiores con catálogo de muebles
- Sistema de capas para organización
- Múltiples vistas (Perspectiva, Ortográfica, Top)
- Materiales PBR (Physically Based Rendering)
- Sistema de snapping para precisión
- Gestión de precios y cálculos
- Exportación a IFC 4 para BIM

---

## Stack Tecnológico Recomendado

### 1. Renderizado 3D
**Opciones principales:**
- **Three.js** - Más madura y popular
- **React Three Fiber** - Wrapper React de Three.js (recomendado si usas React)
- **Babylon.js** - Alternativa con mejor soporte para escenas complejas

### 2. Formatos 3D
- **GLB/GLTF 2.0** - Estándar moderno (igual que pCon.planner)
- Librerías:
  - `@gltf-transform/core` - Manipulación de modelos
  - `three-mesh-bvh` - Colisiones y picking eficiente
  - Draco compression - Compresión de modelos (integrado en Three.js)

### 3. Editor 3D - Core

```typescript
// Funcionalidades esenciales:
- Sistema de transformaciones (mover, rotar, escalar)
- Gizmos interactivos (TransformControls de Three.js)
- Sistema de snapping y guías
- Sistema de capas y visibilidad
- Cámara orbital con controles (OrbitControls)
- Raycast para selección de objetos
```

### 4. Gestión de Estado
- **Zustand** o **Redux** - Estado global del proyecto
- **Immer** - Mutaciones inmutables del árbol de escena

**Estructura de datos de escena:**
```typescript
interface SceneNode {
  id: string;
  type: 'article' | 'room' | 'wall';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  geometry: string; // ID del modelo GLB
  material: string; // ID del material
  children: SceneNode[];
}

interface Project {
  version: { major: number; minor: number };
  settings: {
    lengthUnit: 'meters' | 'feet';
    snapping: { active: boolean; value: number };
    showPrices: boolean;
  };
  viewer: {
    cameraPosition: [number, number, number];
    cameraRotation: [number, number, number];
    mode: 'perspective' | 'orthographic' | 'top';
  };
  model: {
    elements: SceneNode[];
    layers: Layer[];
    geometries: GeometryRef[];
    materials: Material[];
    textures: Texture[];
  };
}
```

### 5. Sistema de Materiales PBR
```typescript
interface Material {
  id: string;
  name: string;
  type: 'pbr';
  albedo?: [number, number, number]; // Color RGB
  metallic?: number; // 0-1
  roughness?: number; // 0-1
  alpha?: number; // Transparencia
  albedoTexture?: { texture: string; scale: [number, number] };
  normalTexture?: { texture: string };
  roughnessTexture?: { texture: string };
  metallicTexture?: { texture: string };
  bumpTexture?: { texture: string };
}
```

### 6. Catálogo de Productos
**Base de datos:**
- Supabase o PostgreSQL
- Campos necesarios:
  - ID, nombre, descripción, categoría
  - Precio, dimensiones
  - URL del modelo GLB
  - Thumbnail
  - Tags para búsqueda
  - Materiales por defecto

**Almacenamiento:**
- AWS S3 / Cloudflare R2 para modelos 3D
- CDN para servir assets rápido

### 7. Exportación

**Formato propio (ZIP):**
```javascript
import JSZip from 'jszip';

async function saveProject(projectData, geometries, textures) {
  const zip = new JSZip();
  
  // Documento principal
  zip.file('document.json', JSON.stringify(projectData));
  
  // Geometrías
  const geoFolder = zip.folder('geometries');
  for (const [hash, blob] of geometries) {
    geoFolder.file(`${hash}.glb`, blob);
  }
  
  // Texturas
  const texFolder = zip.folder('textures');
  for (const [id, blob] of textures) {
    texFolder.file(`${id}.jpg`, blob);
  }
  
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}
```

**Exportación IFC (BIM):**
- **IFC.js** - Librería para generar archivos IFC
- **three-to-ifc** - Convertir Three.js a IFC

**Otras exportaciones:**
- GLB nativo desde Three.js
- Screenshots: `renderer.domElement.toDataURL()`
- PDF con vistas y medidas

### 8. Performance (Crítico para Escenas Grandes)

**Optimizaciones esenciales:**
```javascript
// 1. Instancing - Para objetos repetidos
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

// 2. LOD (Level of Detail)
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);

// 3. Frustum Culling (automático en Three.js)
object.frustumCulled = true;

// 4. Web Workers para cálculos pesados
const worker = new Worker('calculations.worker.js');

// 5. Occlusion culling
// Usar three-mesh-bvh para detectar objetos ocultos
```

**Métricas objetivo:**
- 60 FPS con 100+ objetos
- < 2 segundos para cargar proyecto
- < 100ms para operaciones de edición

---

## Arquitectura de la Aplicación

### Frontend
```
Framework: Next.js + React + TypeScript
Estilos: Tailwind CSS
3D: Three.js + React Three Fiber
UI: Shadcn/ui
Estado: Zustand
```

### Backend
```
API: Next.js API Routes o Supabase Functions
Base de datos: PostgreSQL (Supabase)
Storage: S3-compatible (AWS S3, Cloudflare R2, Supabase Storage)
Autenticación: Supabase Auth
```

### Estructura de Carpetas
```
/app
  /editor
    /[projectId]
      - page.tsx          # Vista principal del editor
  /catalogo
    - page.tsx            # Catálogo de productos
  /proyectos
    - page.tsx            # Lista de proyectos
  /api
    /projects
      - route.ts          # CRUD proyectos
    /products
      - route.ts          # CRUD productos

/components
  /editor
    - Scene3D.tsx         # Canvas de Three.js
    - Toolbar.tsx         # Herramientas de edición
    - PropertiesPanel.tsx # Panel de propiedades
    - LayersPanel.tsx     # Panel de capas
    - CatalogPanel.tsx    # Panel de catálogo
  /ui
    - Button.tsx
    - Input.tsx
    ...

/lib
  /3d
    - scene-manager.ts    # Gestión de escena
    - transform.ts        # Transformaciones
    - materials.ts        # Sistema de materiales
    - loader.ts           # Carga de modelos
  /store
    - project-store.ts    # Estado del proyecto
    - editor-store.ts     # Estado del editor
  /utils
    - export.ts           # Exportación de proyectos
    - import.ts           # Importación de proyectos

/public
  /models
    - (modelos de ejemplo)
  /textures
    - (texturas base)
```

---

## Librerías y Dependencias

### Instalación Base
```bash
# Framework
npm install next react react-dom typescript

# 3D
npm install three @react-three/fiber @react-three/drei
npm install @types/three

# Manipulación de GLB/GLTF
npm install @gltf-transform/core @gltf-transform/functions

# Estado
npm install zustand immer

# Compresión ZIP
npm install jszip

# UI
npm install @radix-ui/react-* tailwindcss
npm install lucide-react

# Utilidades
npm install uuid nanoid
npm install date-fns

# Base de datos (si usas Supabase)
npm install @supabase/supabase-js
```

### Librerías Opcionales Útiles
```bash
# Colisiones avanzadas
npm install three-mesh-bvh

# Editor de materiales visual
npm install leva

# Exportación IFC
npm install web-ifc three-to-ifc

# Análisis de modelos
npm install gltf-validator

# Drag & Drop
npm install @dnd-kit/core @dnd-kit/sortable

# Undo/Redo
npm install immer use-immer
```

---

## Flujo de Desarrollo (Roadmap)

### Fase 1 - MVP (2-3 meses)
**Objetivo:** Editor básico funcional

- [ ] Configurar proyecto Next.js + Three.js
- [ ] Visor 3D básico con cámara orbital
- [ ] Carga de modelos GLB estáticos
- [ ] Sistema de selección (raycast)
- [ ] Transformaciones básicas (mover, rotar, escalar)
- [ ] Gizmos de transformación (TransformControls)
- [ ] Guardar escena en JSON local
- [ ] Cargar escena desde JSON
- [ ] Panel de propiedades básico
- [ ] UI mínima (toolbar, sidebar)

**Entregable:** Editor que permita colocar objetos y guardar/cargar proyectos.

### Fase 2 - Editor Funcional (3-4 meses)
**Objetivo:** Herramientas de edición profesionales

- [ ] Sistema de snapping (a grid, a objetos)
- [ ] Sistema de capas
- [ ] Catálogo de productos simple (5-10 objetos)
- [ ] Drag & Drop desde catálogo
- [ ] Base de datos para proyectos
- [ ] Autenticación de usuarios
- [ ] Lista de proyectos guardados
- [ ] Materiales PBR básicos (color, textura)
- [ ] Iluminación básica (directional, ambient)
- [ ] Exportación de screenshot
- [ ] Medidas y dimensiones
- [ ] Undo/Redo

**Entregable:** Aplicación usable para diseño de interiores básico.

### Fase 3 - Profesional (6-8 meses)
**Objetivo:** Características avanzadas

- [ ] Catálogo extenso de productos (100+ items)
- [ ] Editor de materiales visual
- [ ] Sistema de texturas avanzado (normal, roughness, metallic)
- [ ] Múltiples vistas (perspectiva, ortográfica, top, planta)
- [ ] Vista 2D/plano
- [ ] Reglas y guías
- [ ] Sistema de pricing/presupuesto
- [ ] Exportación a IFC
- [ ] Exportación a GLB/GLTF
- [ ] Exportación a PDF con renders
- [ ] Importación de planos (imagen de fondo)
- [ ] Paredes y habitaciones procedurales
- [ ] Iluminación avanzada (HDRI, shadows)
- [ ] Post-processing (SSAO, bloom, etc)

**Entregable:** Aplicación profesional competitiva.

### Fase 4 - Escalado (continuo)
**Objetivo:** Optimización y features empresariales

- [ ] Performance para escenas de 1000+ objetos
- [ ] LOD system
- [ ] Colaboración en tiempo real
- [ ] Integración con fabricantes (API catálogos)
- [ ] Realidad aumentada (AR) con WebXR
- [ ] Modo VR
- [ ] Marketplace de productos
- [ ] Templates de proyectos
- [ ] AI para sugerencias de diseño
- [ ] Renderizado realista (ray tracing)

---

## Componentes Críticos a Implementar

### 1. Scene Manager
```typescript
// lib/3d/scene-manager.ts
class SceneManager {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  objects: Map<string, THREE.Object3D>;
  
  constructor(canvas: HTMLCanvasElement);
  
  addObject(id: string, object: THREE.Object3D): void;
  removeObject(id: string): void;
  selectObject(id: string): void;
  transformObject(id: string, transform: Transform): void;
  
  exportScene(): SceneData;
  importScene(data: SceneData): void;
  
  render(): void;
  dispose(): void;
}
```

### 2. Transform System
```typescript
// lib/3d/transform.ts
class TransformManager {
  controls: TransformControls;
  snapping: { enabled: boolean; grid: number };
  
  setMode(mode: 'translate' | 'rotate' | 'scale'): void;
  setSnapping(enabled: boolean, grid: number): void;
  
  onTransform(callback: (object: Object3D, transform: Transform) => void): void;
}
```

### 3. Catalog System
```typescript
// lib/catalog/catalog-manager.ts
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  dimensions: { width: number; height: number; depth: number };
  modelUrl: string;
  thumbnailUrl: string;
  materials: string[];
  tags: string[];
}

class CatalogManager {
  async loadProducts(category?: string): Promise<Product[]>;
  async searchProducts(query: string): Promise<Product[]>;
  async instantiateProduct(productId: string): Promise<THREE.Object3D>;
}
```

### 4. Export System
```typescript
// lib/utils/export.ts
class ExportManager {
  async exportProject(format: 'json' | 'zip' | 'ifc' | 'glb'): Promise<Blob>;
  async exportScreenshot(width: number, height: number): Promise<Blob>;
  async exportPDF(views: CameraView[]): Promise<Blob>;
}
```

---

## Alternativas Pre-hechas

Si prefieres no construir desde cero:

### Frameworks/Engines Completos
- **PlayCanvas** - Motor 3D completo con editor web
- **Babylon.js Editor** - Editor visual incluido
- **Three.js Editor** - Base open-source para fork

### Servicios/APIs
- **Spline** - Editor 3D con API exportable
- **Autodesk Forge Viewer** - Visualización profesional (de pago)
- **Sketchfab Viewer** - Embeber modelos 3D (limitado)

### Librerías Útiles
- **react-3d-viewer** - Componente viewer básico
- **@use-gesture/react** - Gestos táctiles y mouse
- **leva** - Panel de controles automático

---

## Recursos de Aprendizaje

### Three.js
- Documentación oficial: https://threejs.org/docs/
- Three.js Journey: https://threejs-journey.com/
- Bruno Simon's course (el mejor)

### React Three Fiber
- Documentación: https://docs.pmnd.rs/react-three-fiber
- Ejemplos: https://github.com/pmndrs/react-three-fiber

### Formatos 3D
- GLTF Spec: https://registry.khronos.org/glTF/
- glTF Transform: https://gltf-transform.dev/

### BIM/IFC
- IFC.js: https://ifcjs.github.io/info/
- IFC Spec: https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/

---

## Estimación de Complejidad y Costos

### Tiempo de Desarrollo
- **MVP funcional**: 2-3 meses (1 desarrollador senior)
- **Versión profesional**: 8-12 meses (1-2 desarrolladores)
- **Nivel pCon.planner**: 2-3 años (equipo de 3-5 personas)

### Costos Estimados (USD)
**Desarrollo:**
- Freelancer senior: $60-120/hora
- MVP: $20,000 - $40,000
- Versión profesional: $80,000 - $150,000

**Infraestructura mensual:**
- Hosting (Vercel/Netlify): $20-100
- Base de datos (Supabase): $25-100
- Storage (R2/S3): $10-50
- CDN: $20-100
- **Total**: $75-350/mes

**Modelos 3D (catálogo):**
- Compra de modelos: $5-50 por modelo
- Modelado custom: $50-500 por modelo
- Catálogo de 100 modelos: $2,000-10,000

---

## Notas Importantes

### Performance
- Escenas con 100+ objetos requieren optimización agresiva
- Mobile requiere LOD y simplificación significativa
- Considera WebGL 2.0 como mínimo

### Compatibilidad
- Safari tiene limitaciones con WebGL
- Dispositivos móviles tienen menos memoria
- Necesitas fallbacks para navegadores antiguos

### Legal
- Licencias de modelos 3D (comercial vs personal)
- Términos de uso de texturas
- GDPR para datos de usuarios

### UX Crítico
- Atajos de teclado (como Blender/Maya)
- Feedback visual inmediato
- Loading states para assets grandes
- Tutorial inicial integrado

---

## Próximos Pasos

1. **Definir alcance exacto** - ¿Residencial? ¿Comercial? ¿Oficinas?
2. **Investigar competencia** - Roomstyler, Planner 5D, SketchUp
3. **Crear wireframes** - UI/UX del editor
4. **Proof of concept** - Implementar MVP en 1 semana
5. **Validar con usuarios** - Feedback temprano

---

## Contacto y Documentación Adicional

- Documentación de Three.js: https://threejs.org/
- React Three Fiber: https://docs.pmnd.rs/
- Supabase: https://supabase.com/docs
- IFC.js: https://ifcjs.github.io/

---

**Última actualización:** Octubre 2025
**Versión:** 1.0

