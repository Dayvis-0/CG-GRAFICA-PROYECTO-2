# 🧊 CUBO CLASIFICADOR

Juego interactivo 3D en primera persona donde debes clasificar 6 piezas geométricas dejándolas caer en el hueco correcto de un cubo clasificador.

Construido con **Three.js** (render 3D) y **cannon-es** (físicas), todo desde un navegador sin build tools.

---

## 🎮 Cómo jugar

| Acción | Control |
|--------|---------|
| Mirar alrededor | Click en canvas (bloquea el mouse) + mover mouse |
| Caminar | **W A S D** |
| Agarrar / soltar pieza | Click sobre la pieza → arrastrar → soltar click |
| Mover pieza agarrada | **Flechas** del teclado |
| Soltar el mouse | **ESC** |

El objetivo es llevar cada pieza al hueco que coincide con su forma. Cuando la pieza está sobre su hueco correcto y la sueltas, se posiciona dentro del cubo y la gravedad termina el trabajo.

---

## 🧩 Las 6 piezas

| Pieza | Geometría 3D | Forma del hueco | Color |
|-------|-------------|-------------------|-------|
| **Esfera** | `SphereGeometry` (r=0.55) | Círculo | 🔴 Rojo |
| **Cubo** | `BoxGeometry` (0.9³) | Cuadrado | 🔵 Azul |
| **Cono** | `ConeGeometry` (r=0.65, h=1.1) | Triángulo equilátero | 🟢 Verde |
| **Hexágono** | `CylinderGeometry` (6 lados) | Hexágono | 🟡 Amarillo |
| **Pirámide** | `ConeGeometry` (4 lados) | Rombo | 🟣 Violeta |
| **Estrella** | `ExtrudeGeometry` (4 puntas) | Estrella 4 puntas | 🔷 Cian |

---

## 🖥️ Panel de control

En el panel lateral derecho puedes modificar la pieza seleccionada:

- **Material**: Lambert (mate), Phong (especular), Standard (PBR realista)
- **Textura procedural**: Rayas, Lunares, Degradado, Madera
- **Wireframe**: ON / OFF
- **Luces**: alternar Direccional, Techo y Ambiental individualmente

El **HUD** en la esquina superior izquierda muestra el estado actual.

---

## 🏗️ Arquitectura del proyecto

```
CUBO_CLASIFICADOR/
├── index.html              # Punto de entrada, HUD y panel
├── style.css                # Estilos del HUD y panel
└── src/
    ├── index.js            # Orquestador: monta todos los módulos
    ├── core/
    │   ├── SceneManager.js      # Escena Three.js (fondo oscuro)
    │   ├── CameraManager.js    # Cámara perspectiva 70° FOV
    │   └── RendererManager.js  # Renderer WebGL con sombras PCFSoft
    ├── objects/
    │   ├── Room.js            # Cuarto 14×8 (piso, techo, 4 paredes)
    │   ├── Classifier.js      # Cubo clasificador con 6 huecos
    │   └── Pieces.js          # Las 6 piezas geométricas
    ├── lights/
    │   └── Lights.js          # 3 luces: ambiental, techo, direccional con sombras
    ├── textures/
    │   └── TextureFactory.js  # 4 texturas procedurales (canvas 2D)
    ├── materials/
    │   └── MaterialFactory.js    # Fábrica: Lambert / Phong / Standard + textura + wireframe
    ├── controls/
    │   ├── InputManager.js   # Input centralizado (teclado + pointer lock)
    │   ├── CameraFPS.js      # Cámara FPS con WASD, mouse look, colisiones AABB
    │   └── DragManager.js    # Arrastre de piezas con raycasting y físicas
    ├── physics/
    │   ├── PhysicsWorld.js   # Mundo cannon-es (gravedad -35, contact materials)
    │   ├── BodyFactory.js    # Registro de bodies: dinámicos (piezas) y estáticos (paredes, panel)
    │   └── PhysicsSystem.js  # Step + sync mesh↔body + modo kinematic + velocity trail
    ├── game/
    │   └── ClassifierRules.js # Lógica: ¿la pieza está sobre su hueco?
    ├── ui/
    │   └── Interface.js      # HUD + panel de control (selección, materiales, texturas, luces)
    ├── animations/
    │   └── AnimationLoop.js  # Bucle principal (físicas → clamp → input → anim → render)
    ├── utils/
    │   ├── ResizeHandler.js  # Responsive (resize de ventana)
    │   ├── geometry.js       # Vértices de estrella (compartido entre huecos y piezas)
    │   ├── HoleDetector.js   # Detección punto-en-hueco (círculo, triángulo, polígono, etc.)
    │   └── holeShapes.js     # Generación de Paths para los 6 tipos de hueco
    └── data/
        ├── holeConfigs.js          # FUENTE ÚNICA: configuración de los 6 huecos y piezas
        └── classifierDimensions.js # Constantes geométricas del clasificador (OUTER, WALL_HEIGHT, ...)
```

### Principios de diseño

- **Single Source of Truth**: `data/holeConfigs.js` define tamaños y posiciones de huecos y piezas. `Classifier.js` y `Pieces.js` importan del mismo archivo. `data/classifierDimensions.js` centraliza las constantes geométricas del clasificador.
- **Single Responsibility**: cada archivo hace UNA cosa. Ej: `ClassifierRules.js` solo responde "¿está sobre su hueco?", no sabe de físicas ni de input.
- **Separación render-física**: Three.js renderiza, cannon-es simula. `PhysicsSystem.js` sincroniza ambos mundos.
- **Descubrimiento por tipo**: `BodyFactory.js` y `AnimationLoop.js` determinan el comportamiento de cada pieza por `pieceType` (no por label), manteniendo el polimorfismo sin acoplamiento.

---

## ⚙️ Detalles técnicos

| Aspecto | Implementación |
|---------|---------------|
| **Motor 3D** | Three.js r160 via CDN (import map) |
| **Física** | cannon-es 0.20 via CDN |
| **Sombras** | Directional light con shadow map 1024×1024, PCFSoft |
| **Colisión de cámara** | AABB contra paredes del cuarto y del clasificador |
| **Colisión de drag** | AABB por eje (X → Z → Y) para deslizamiento natural |
| **Panel perforado** | `CANNON.Trimesh` construido desde la geometría Three.js con huecos reales (`ExtrudeGeometry` + `shape.holes`). Las piezas caen por **gravedad física real** a través de los huecos |
| **Anti-tunneling** | `limitStep()` limita el desplazamiento al tamaño del AABB de la pieza |
| **Drop en hueco** | `onPointerUp` solo hace `setKinematic(false)`. La pieza cae **naturalmente** a través del Trimesh del panel — **no hay posicionamiento en Y=0.3** |
| **Fixed timestep** | `world.fixedStep(1/240, dt)` con dt máximo 1/30 para evitar espiral de muerte |
| **Sleep** | Cuerpos cannon-es entran en sleep para ahorrar CPU |

---

## 🚀 Cómo ejecutar

No requiere build ni servidor — es HTML + módulos ES nativos.

```bash
# Opción 1: abrir directamente (puede fallar por CORS)
firefox index.html

# Opción 2: servidor local (recomendado)
python3 -m http.server 8080
# luego abre http://localhost:8080

# Opción 3: con Node
npx serve .
```

---

## 🧠 Mejoras posibles

- Sistema de puntuación / timer
- Feedback visual y sonoro cuando una pieza encaja
- Más piezas y formas de hueco
- Modo multijugador o niveles progresivos
- Shaders personalizados en lugar de texturas procedurales canvas
- Instancing para múltiples cubos clasificadores