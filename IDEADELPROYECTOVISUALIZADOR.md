# Proyecto de Computación Gráfica — Unidad II

## Visualizador de Audio 3D Interactivo

**Asignatura:** Computación Gráfica (IIAD65) · Ciclo VI  
**Docente:** M.Sc. Neptalí Menejes Palomino  

---

## 1. Idea General

Aplicación web 3D que reproduce archivos de audio y visualiza sus frecuencias en tiempo real mediante una grilla de barras tridimensionales. A diferencia de un visualizador convencional, el proyecto pone **los conceptos de gráficos 3D en primer plano**: el usuario puede modificar interactivamente el modelo de sombreado, las fuentes de luz, el tipo de cámara y los materiales, viendo el efecto inmediato sobre los objetos 3D.

El audio actúa como **dinamizador de la escena** — las barras se mueven, las luces pulsan, la niebla respira — pero el núcleo evaluable son los conceptos de gráfica 3D de la Unidad II.

---

## 2. Objetivo General

Implementar una aplicación de computación gráfica 3D funcional que demuestre de forma visible, interactiva y combinada los temas de la Unidad II: visualización 3D, transformaciones, iluminación y sombreado, texturas, realismo y proyecciones.

---

## 3. Temas de la Unidad que Demuestra

| Semana | Tema | Cómo se implementa |
|---|---|---|
| 9 — Visualización 3D | Vistas y proyecciones | Botón que alterna entre cámara **perspectiva** y **ortográfica** en tiempo real |
| 9 — Visualización 3D | Mallas poligonales | Grilla de 512 barras con `BoxGeometry`, normales calculadas por Three.js |
| 10 — Transformaciones 3D | Traslación, rotación, escalado | Barras escalan en Y según frecuencia; rotación automática del grupo; animación idle con funciones senoidales |
| 11 — Iluminación y Sombreado | Modelo de iluminación Phong | Cambio entre `MeshLambertMaterial`, `MeshPhongMaterial` y `MeshStandardMaterial` (PBR) mediante botones |
| 11 — Iluminación y Sombreado | Tipos de fuentes de luz | AmbientLight, DirectionalLight y 2 PointLights — cada una con interruptor individual |
| 11 — Iluminación y Sombreado | Componentes: ambiente, difusa, especular | Visible visualmente al cambiar de material y al apagar luces |
| 12 — Realismo y Rendering | Texturas | Textura **procedural** generada con Canvas (gradiente, ruido o patrón) aplicada al piso o a las barras |
| 12 — Realismo y Rendering | Sombras | Shadow mapping activado en el renderer; las barras proyectan sombra sobre el suelo |
| 12 — Realismo y Rendering | Transparencia | Opción de material semitransparente en las barras, controlable desde la UI |

---

## 4. Funcionalidades Específicas

### 4.1 Escena 3D y Objetos
- Grilla de **32 × 16 barras** (512 objetos) con geometría compartida y un solo draw call por barra
- Las barras reaccionan en **altura y color** a las frecuencias del audio
- Transformaciones visibles: escalado en Y dinámico, rotación orbital del grupo, posición estática

### 4.2 Modelos de Iluminación y Sombreado
- Panel de control con 3 botones para cambiar el material global:
  - **Lambert** (`MeshLambertMaterial`) — sombreado por vértices, más plano
  - **Phong** (`MeshPhongMaterial`) — sombreado por píxel, brillos especulares
  - **Standard** (`MeshStandardMaterial`) — PBR, metalness y roughness
- Cada luz tiene un toggle (encendido/apagado) para mostrar su contribución individual

### 4.3 Texturas
- Textura procedural generada con Canvas API (patrón de ondas o gradiente radial)
- Aplicada como `map` en el material del suelo o como overlay en las barras
- No requiere archivos externos — se genera en código

### 4.4 Dos Tipos de Proyección
- Botón que conmuta entre:
  - **Cámara perspectiva** (FOV 55°) — profundidad y distancia focal realistas
  - **Cámara ortográfica** — vista plana sin distorsión de profundidad
- Se nota visualmente en la escena al alternar

### 4.5 Efectos de Realismo
- **Sombras**: `renderer.shadowMap.enabled = true`, luces con `castShadow`, barras y suelo con `castShadow`/`receiveShadow`
- **Transparencia**: slider o toggle que activa `transparent: true` en las barras, rebajando `opacity`
- **Niebla dinámica**: `FogExp2` que respira con el audio (ya implementado)

### 4.6 Interfaz que Nombra los Conceptos (HUD)
- Indicador en pantalla del **material activo**: "Lambert", "Phong" o "Standard"
- Indicador de la **cámara activa**: "Perspectiva" o "Ortográfica"
- Indicador del **estado de cada luz**: "Ambiental: ON", "Direccional: ON", "Acento 1: OFF", etc.
- Indicador de **sombras**: "Sombras: ON / OFF"
- Sin necesidad de panel externo — integrado en la barra de controles o como HUD superpuesto

---

## 5. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| API Gráfica | Three.js (r160) vía CDN con importmap |
| Lenguaje | JavaScript ES6 módulos nativos (sin bundler) |
| Audio | Web Audio API (AnalyserNode, FFT 512) |
| UI | HTML + CSS vanilla + Tailwind CSS (CDN) |
| Texturas procedurales | Canvas 2D API |

---

## 6. Arquitectura del Código

```
index.html               ← Entry point
src/
├── index.js              ← Orquestador principal
├── core/
│   ├── SceneManager.js   ← Escena + niebla
│   ├── CameraManager.js  ← Cámara perspectiva/ortográfica
│   └── RendererManager.js← Renderer + sombras
├── objects/
│   └── Bars.js           ← Grilla 32×16, LUT de colores, updateBars()
├── lights/
│   └── Lights.js         ← 4 fuentes de luz con control individual
├── audio/
│   └── AudioManager.js   ← Web Audio API wrapper
├── materials/
│   └── MaterialManager.js← Cambio entre Lambert / Phong / Standard
├── textures/
│   └── ProceduralTexture.js ← Generación de textura con Canvas
├── animations/
│   └── AnimationLoop.js  ← Bucle de renderizado
├── ui/
│   ├── Controls.js       ← Play/pausa, archivo, progreso
│   └── ConceptPanel.js   ← HUD de conceptos + botones de material/luz/cámara
└── utils/
    ├── ResizeHandler.js  ← Responsive
    └── FormatTime.js     ← Formato M:SS
```

---

## 7. Criterios de Evaluación — Cobertura

| Criterio (Rúbrica) | Cobertura |
|---|---|
| Pipeline de renderizado 3D completo | Escena, cámara, luces, objetos, sombras, loop de animación |
| Aplicación de iluminación | 4 luces intercambiables, 3 modelos de sombreado, toggles individuales |
| Uso de APIs gráficas | Three.js con ES modules, sin bundler, importmap |
| Optimización de rendimiento | Geometría compartida, LUT precalculada, sin `new` en el loop, pixel ratio limitado, materiales reutilizados |
| Calidad de la solución gráfica | Estable, visualmente atractiva, sin errores, demostrable en 3–5 min |

---

## 8. Plan de Demostración (3–5 min)

1. **Escena funcionando** — Subir un archivo, mostrar las barras reaccionando al audio, rotación y luces pulsando
2. **Cambiar modelo de sombreado** — Lambert → Phong → Standard, que se note la diferencia en los reflejos
3. **Apagar y encender luces** — Mostrar cada luz por separado, cómo cambia la escena sin ella
4. **Alternar proyección** — Perspectiva ↔ Ortográfica, mostrar la diferencia visual
5. **Mostrar texturas** — Acercar la cámara al suelo o las barras para ver la textura procedural
6. **Activar sombras** — Mostrar las sombras proyectadas de las barras sobre el piso

---

## 9. Estado Actual del Proyecto

El proyecto **ya tiene implementado**:
- ✅ Escena 3D con 512 barras, niebla, luces
- ✅ Motor de audio con Web Audio API
- ✅ Bucle de animación con reacción a frecuencias
- ✅ OrbitControls, responsive, UI de reproducción
- ✅ Arquitectura modular y optimizada

**Pendiente de implementar** (los temas evaluables de la Unidad II):
- 🔲 Cambio entre materiales Lambert / Phong / Standard
- 🔲 Toggles de luces individuales
- 🔲 Cámara ortográfica + switch
- 🔲 Textura procedural con Canvas
- 🔲 Sombras activadas
- 🔲 HUD de conceptos

---

## 10. Conclusión

El proyecto parte de un visualizador de audio funcional y visualmente atractivo, y sobre él se construyen **todos los conceptos evaluables de la Unidad II**. Esto permite una demostración dinámica (el audio mantiene la atención) pero con contenido técnico sólido (materiales, luces, sombras, proyecciones, texturas) que el profesor puede identificar y evaluar directamente.

El resultado no es "un visualizador con 3D", sino **una demo de gráficos 3D potenciada por audio**.
