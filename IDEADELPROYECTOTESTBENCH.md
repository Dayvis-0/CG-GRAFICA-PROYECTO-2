# Proyecto de Computación Gráfica — Unidad II

## Test Bench 3D — Laboratorio de Gráficos Interactivo

**Asignatura:** Computación Gráfica (IIAD65) · Ciclo VI  
**Docente:** M.Sc. Neptalí Menejes Palomino  

---

## 1. Idea General

Aplicación web 3D que funciona como un **banco de pruebas interactivo** para explorar y comparar visualmente los conceptos fundamentales de gráficos por computadora de la Unidad II. A diferencia de una demo fija, el usuario puede manipular en tiempo real todos los parámetros gráficos sobre cuatro primitivas 3D distintas, viendo el efecto inmediato de cada cambio.

El test bench permite:
- **Seleccionar** entre 4 objetos 3D (esfera, toro, cubo, cono)
- **Cambiar el material** entre Lambert, Phong y Standard (PBR)
- **Activar/desactivar** cada una de las 4 luces individualmente
- **Alternar** entre proyección perspectiva y ortográfica
- **Aplicar** 5 texturas procedurales diferentes (ninguna, rayas, lunares, degradado, madera)
- **Interactuar** con la cámara mediante arrastre y zoom

El proyecto pone los **conceptos de gráficos 3D como protagonistas**: cada control de la interfaz está etiquetado con el nombre del concepto que demuestra (material, tipo de luz, proyección, textura), permitiendo al docente identificar y evaluar cada tema directamente.

---

## 2. Objetivo General

Implementar una aplicación de computación gráfica 3D funcional que permita explorar, comparar y demostrar de forma visible e interactiva los temas de la Unidad II: visualización 3D, transformaciones, iluminación y sombreado, texturas, realismo y proyecciones, mediante la manipulación en tiempo real sobre múltiples primitivas.

---

## 3. Temas de la Unidad que Demuestra

| Semana | Tema | Cómo se implementa |
|---|---|---|
| 9 — Visualización 3D | Vistas y proyecciones | Botón que alterna entre cámara **perspectiva** (FOV 50°) y **ortográfica** en tiempo real |
| 9 — Visualización 3D | Mallas poligonales | 4 primitivas distintas: `SphereGeometry` (48×32 segmentos), `TorusGeometry`, `BoxGeometry`, `ConeGeometry` — visibles simultáneamente |
| 10 — Transformaciones 3D | Traslación, rotación, escalado | Cada objeto tiene posición fija en X sobre el pedestal; rotación continua automática (0.0035 rad/frame); selección con anillo de resalte |
| 11 — Iluminación y Sombreado | Modelo de iluminación Phong | Cambio entre `MeshLambertMaterial`, `MeshPhongMaterial` y `MeshStandardMaterial` (PBR) mediante botones, aplicado al objeto seleccionado |
| 11 — Iluminación y Sombreado | Tipos de fuentes de luz | 4 luces con toggle individual: **AmbientLight** (0x404560), **DirectionalLight** (blanca, con sombras), **PointLight roja** y **PointLight azul** |
| 11 — Iluminación y Sombreado | Componentes: ambiente, difusa, especular | Visible visualmente al cambiar de material (Lambert no tiene especular, Phong sí) y al apagar/encender cada luz individualmente |
| 12 — Realismo y Rendering | Texturas | 5 texturas **procedurales** generadas con Canvas API (ninguna, rayas, lunares, degradado, madera) aplicadas como `map` al material del objeto seleccionado |
| 12 — Realismo y Rendering | Sombras | Shadow mapping activado (`PCFSoftShadowMap`); la DirectionalLight y PointLights proyectan sombras; pedestal y objetos con `castShadow`/`receiveShadow` |
| 12 — Realismo y Rendering | Representación de materiales PBR | `MeshStandardMaterial` con parámetros `roughness: 0.35` y `metalness: 0.45` para un acabado realista |

---

## 4. Funcionalidades Específicas

### 4.1 Escena 3D y Objetos
- **4 primitivas 3D** visibles simultáneamente: esfera, toro, cubo, cono
- Cada objeto tiene **geometría independiente** que demuestra distintos tipos de malla poligonal
- Los objetos rotan lentamente sobre su eje Y para apreciar el sombreado desde todos los ángulos
- Anillo de selección visual que rodea al objeto activo
- Pedestal compartido que recibe sombras, con grilla decorativa superpuesta

### 4.2 Modelos de Iluminación y Sombreado
- Panel de control con 3 botones para cambiar el material del objeto seleccionado:
  - **Lambert** (`MeshLambertMaterial`) — sombreado por vértices, superficie mate, sin brillos
  - **Phong** (`MeshPhongMaterial`) — sombreado por píxel, con componente especular (`shininess: 90`)
  - **Standard** (`MeshStandardMaterial`) — PBR realista con metalness y roughness
- **4 luces** con toggle individual (encendido/apagado):
  - **Ambiental**: iluminación base uniforme (siempre visible)
  - **Direccional**: luz blanca direccional con sombras
  - **Puntual roja**: luz localizada en la escena (esfera visual como referencia)
  - **Puntual azul**: segunda luz puntual en posición opuesta

### 4.3 Texturas Procedurales
- **5 texturas generadas con Canvas API**, sin archivos externos:
  - **Ninguna**: material sin textura
  - **Rayas**: franjas naranjas sobre fondo oscuro
  - **Lunares**: puntos cian sobre fondo azul oscuro
  - **Degradado**: gradiente lineal rosa-violeta-cian
  - **Madera**: vetas simuladas con funciones senoidales y ruido
- Cada textura usa `RepeatWrapping` con repetición 2×2
- Se aplican como `map` en el material del objeto seleccionado al instante

### 4.4 Dos Tipos de Proyección
- Botón que conmuta entre:
  - **Cámara perspectiva** (FOV 50°) — profundidad realista con punto de fuga
  - **Cámara ortográfica** — vista plana sin distorsión de profundidad, ideal para comparar proporciones
- Ambas cámaras comparten la misma órbita (posición, rotación, zoom)
- Se nota visualmente en la escena al alternar: los objetos más lejanos se ven del mismo tamaño en ortográfica

### 4.5 Efectos de Realismo
- **Sombras**: `renderer.shadowMap.enabled = true` con `PCFSoftShadowMap`; la DirectionalLight y PointLights proyectan sombras suaves sobre el pedestal
- **Niebla**: `Fog` con color 0x0a0a12, rango 10–28, que oscurece los bordes de la escena
- **Marcadores de luz**: esferas pequeñas de colores (rojo y azul) que indican la posición de las luces puntuales
- **Rotación continua**: los objetos giran lentamente para mostrar el sombreado desde todos los ángulos

### 4.6 Interfaz que Nombra los Conceptos (HUD)
- Indicador en pantalla del **objeto seleccionado**: "Esfera", "Toro", "Cubo" o "Cono"
- Indicador del **material activo**: "Lambert", "Phong" o "Standard"
- Indicador de la **textura activa**: "Ninguna", "Rayas", "Lunares", "Degradado", "Madera"
- Indicador de la **cámara activa**: "Perspectiva" u "Ortográfica"
- Panel de control con **cada concepto etiquetado por su nombre técnico**: "Material", "Textura procedural", "Proyección de cámara", "Luces (4)"
- Toggle switches con estado visual (ON/OFF) para cada luz

---

## 5. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| API Gráfica | Three.js (r160) vía CDN con importmap |
| Lenguaje | JavaScript ES6 módulos nativos (sin bundler) |
| UI | HTML + CSS vanilla |
| Texturas procedurales | Canvas 2D API |
| Interacción 3D | Cámara orbital manual (drag + wheel) |

---

## 6. Arquitectura del Código

```
TEST_BENCH/
├── index.html                ← Entry point
├── style.css                 ← Estilos de HUD, panel y componentes UI
└── src/
    ├── index.js              ← Orquestador principal
    ├── core/
    │   ├── SceneManager.js   ← Escena + niebla (Fog)
    │   ├── CameraManager.js  ← Cámara perspectiva + ortográfica
    │   └── RendererManager.js← Renderer + shadow map
    ├── objects/
    │   └── SceneObjects.js   ← 4 primitivas + pedestal + grid + rings
    ├── lights/
    │   └── Lights.js         ← 4 fuentes de luz + marcadores
    ├── textures/
    │   └── TextureFactory.js ← 5 texturas procedurales con Canvas
    ├── materials/
    │   └── MaterialFactory.js← Fábrica de materiales (Lambert/Phong/Standard)
    ├── controls/
    │   └── CameraOrbit.js    ← Órbita manual (drag + wheel)
    ├── ui/
    │   └── Interface.js      ← HUD + Panel + Selección por raycaster
    ├── animations/
    │   └── AnimationLoop.js  ← Bucle de renderizado
    └── utils/
        └── ResizeHandler.js  ← Responsive (ambas cámaras)
```

---

## 7. Criterios de Evaluación — Cobertura

| Criterio (Rúbrica) | Cobertura |
|---|---|
| Pipeline de renderizado 3D completo | Escena, 2 cámaras intercambiables, 4 luces, 4 objetos, sombras, loop de animación |
| Aplicación de iluminación | 4 luces intercambiables con toggles individuales, 3 modelos de sombreado aplicables por objeto, visibilidad de componentes ambiente/difusa/especular |
| Uso de APIs gráficas | Three.js con ES modules, sin bundler, importmap |
| Optimización de rendimiento | Geometrías creadas una sola vez, materiales reutilizados, sin `new` en el loop, pixel ratio limitado |
| Calidad de la solución gráfica | Estable, visualmente atractiva, sin errores, demostrable en 3–5 min |

---

## 8. Plan de Demostración (3–5 min)

1. **Escena funcionando** — Mostrar los 4 objetos 3D visibles sobre el pedestal, rotando lentamente, con sombras proyectadas
2. **Seleccionar un objeto** — Hacer clic en un objeto en el viewport o usar los botones del panel; mostrar el anillo de selección y el HUD actualizado
3. **Cambiar modelo de sombreado** — Seleccionar un objeto y cambiar Lambert → Phong → Standard; notar la aparición del brillo especular en Phong y el acabado PBR en Standard
4. **Apagar y encender luces** — Desactivar cada luz individualmente y mostrar cómo cambia la apariencia del objeto; la luz ambiental muestra la iluminación base
5. **Aplicar texturas** — Seleccionar un objeto y cambiar entre las 5 texturas; mostrar el degradado, las rayas, los lunares y la textura de madera
6. **Alternar proyección** — Cambiar de perspectiva a ortográfica y señalar la diferencia visual: los objetos distantes mantienen su tamaño relativo
7. **Interacción con cámara** — Arrastrar para orbitar alrededor de la escena, usar la rueda para zoom; mostrar que ambas proyecciones responden igual

---

## 9. Estado Actual del Proyecto

El proyecto **ya tiene implementado**:
- ✅ Escena 3D con 4 primitivas, pedestal, grilla y niebla
- ✅ 3 tipos de material (Lambert, Phong, Standard) aplicables por objeto
- ✅ 4 luces con toggle individual y marcadores visuales
- ✅ 5 texturas procedurales generadas con Canvas
- ✅ Cámara perspectiva y ortográfica con switch
- ✅ Sombras activadas con PCFSoftShadowMap
- ✅ Órbita de cámara manual (drag + wheel)
- ✅ Selección de objetos por raycaster (clic en viewport)
- ✅ HUD informativo y panel de control completo
- ✅ Arquitectura modular (mismo patrón que VISUALIZADOR/)
- ✅ Rotación continua de objetos para apreciar sombreado

**Pendiente de implementar** (posibles extensiones):
- 🔲 Control de opacidad/transparencia en materiales
- 🔲 Slider para ajustar metalness y roughness del material Standard
- 🔲 Animación de los parámetros de luz (intensidad pulsante)
- 🔲 Modo de visualización de mallas (wireframe)

---

## 10. Conclusión

El proyecto es un **banco de pruebas completo** para los conceptos de gráficos 3D de la Unidad II. A diferencia de un visualizador de audio que usa el sonido como dinamizador, el Test Bench 3D pone el control directamente en manos del usuario, permitiendo explorar cada concepto de forma aislada o combinada:

- Se pueden **comparar materiales** aplicando Lambert, Phong y Standard sobre el mismo objeto
- Se puede **ver el efecto de cada luz** apagándolas una por una
- Se puede **contrastar proyecciones** alternando entre perspectiva y ortográfica
- Se pueden **aplicar texturas** y ver cómo interactúan con la iluminación

Cada control está etiquetado con su **nombre técnico**, y el HUD muestra en todo momento qué conceptos están activos. Esto permite al docente identificar y evaluar cada tema directamente durante una demostración de 3 a 5 minutos.
