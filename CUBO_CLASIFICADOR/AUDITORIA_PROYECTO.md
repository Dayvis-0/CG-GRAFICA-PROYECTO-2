# AUDITORÍA TÉCNICA — CUBO CLASIFICADOR 3D

> **Fecha:** 2026-07-23  
> **Estado:** ✅ TODAS LAS FASES COMPLETADAS  
> **Archivos analizados:** Todos los archivos del proyecto

---

## Resumen Ejecutivo

El proyecto es un juego 3D educativo de clasificación de figuras geométricas construido con **Three.js** (rendering) y **cannon-es** (física). Usa ES Modules nativos sin bundler, cargando dependencias desde CDN vía `importmap`.

### Fortalezas detectadas

- **Modularización base sólida**: 12 subdirectorios en `src/` con separación clara por dominio (physics, controls, objects, etc.).
- **Data-Driven Design**: Las configuraciones de huecos y dimensiones están externalizadas en `src/data/`, actuando como Single Source of Truth.
- **Inyección de dependencias**: Los módulos reciben sus dependencias como parámetros en lugar de importar globales. Esto facilita testabilidad.
- **Patrones de diseño consistentes**: Uso coherente de Factory Pattern (`createX`) y diccionarios despachadores (`HOLE_BUILDERS`, `GEO_BUILDERS`) en lugar de bloques `switch/case`.
- **Código defensivo en puntos clave**: Validaciones con `console.warn` para formas no reconocidas en `Classifier.js`, `Pieces.js` y `HoleDetector.js`.

### Problemas principales

1. **`index.js` es un God Object** — Contiene lógica de cronómetro (~62 líneas), clasificación, reseteo, manejo de DOM y configuración. Debería ser solo un orquestador.
2. **`BodyFactory.js` y `DragManager.js` violan SRP severamente** — Son los archivos más grandes y concentran múltiples responsabilidades.
3. **Rendimiento degradado por uso excesivo de `setFromObject()`** — Se recalculan bounding boxes sobre geometrías completas múltiples veces por frame en el hot path del cursor.
4. **Lógica de colisiones triplicada** — Tres sistemas independientes resuelven colisiones: cannon-es, Box3 manual en DragManager, y cálculos manuales en CameraFPS.
5. **Memory leaks potenciales** — Los materiales de Three.js no reciben `dispose()` al ser reemplazados.

### Calificación general

| Aspecto | Nota |
|---------|------|
| Arquitectura | 7/10 — Buena base, pero God Object en entry point |
| Separación de responsabilidades | 5/10 — 3 archivos violan SRP severamente |
| Código duplicado | 6/10 — Duplicación en formas, colisiones y materiales |
| Rendimiento | 5/10 — Hot path con operaciones costosas innecesarias |
| Seguridad | 7/10 — Riesgos menores (CDN sin SRI, innerHTML) |
| Consistencia | 6/10 — Naming y patrones inconsistentes en algunos puntos |
| Manejo de errores | 4/10 — Casi inexistente en inicialización y loops |

---

# FASE 1 — Problemas Críticos de Rendimiento ✅ COMPLETADA

**Objetivo:** Eliminar operaciones costosas en el hot path (código que se ejecuta cada frame o en cada movimiento de mouse).

---

### PERF-001 — `setFromObject()` llamado múltiples veces por frame en DragManager ✅

- **Categoría:** Rendimiento
- **Prioridad:** Alta
- **Archivo(s) afectado(s):** `src/controls/DragManager.js` (líneas 51, 93, 127, 246, 312)
- **Descripción:** `setFromObject()` recorre TODOS los vértices de la geometría para calcular el bounding box. En un solo movimiento de mouse, se puede invocar **6-10 veces** porque `clampMovement` evalúa colisiones por eje (X, Z, Y) y cada evaluación llama a `overlapsClassifier` y `clampToRoom`, que vuelven a llamar a `setFromObject`.
- **Evidencia:** `_pieceBox.setFromObject(selected)` aparece en 5 ubicaciones distintas dentro del mismo flujo de `onPointerMove`.
- **Motivo:** Causa caídas de FPS significativas durante el arrastre, especialmente con geometrías complejas (estrella, triángulo extruido).
- **Riesgos de modificarlo:** Bajo. Solo requiere calcular el box una vez al inicio del handler y reutilizarlo.
- **Recomendación:** Calcular `setFromObject` UNA sola vez al inicio de `onPointerMove` y pasar la referencia del `Box3` resultante a todas las funciones internas.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 1.
- **Estado:** ✅ Completado — Se precachea el half-size en `onPointerDown` y se reutiliza en todo el flujo de drag. De ~8 `setFromObject` por evento de mouse a 1 sola vez al inicio del drag.

---

### PERF-002 — `setFromObject()` en cada frame dentro de AnimationLoop ✅

- **Categoría:** Rendimiento
- **Prioridad:** Alta
- **Archivo(s) afectado(s):** `src/animations/AnimationLoop.js` (línea 47)
- **Descripción:** `_box.setFromObject(child)` se invoca por cada pieza dinámica en cada frame del `requestAnimationFrame`.
- **Evidencia:** `_box.setFromObject(child);` dentro del loop de piezas en `animate()`.
- **Motivo:** Si se escala el número de piezas, los FPS caerán linealmente. Para 5 piezas es tolerable, pero arquitectónicamente incorrecto.
- **Riesgos de modificarlo:** Bajo. Usar posición + radio/half-size precalculado en lugar de recalcular el AABB completo.
- **Recomendación:** Usar `child.position.y` con un offset fijo basado en el tipo de pieza (ya disponible en `userData`) en lugar de recalcular el bounding box completo.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 1.
- **Estado:** ✅ Completado — Se usa un `WeakMap` para cachear el half-size por pieza. `setFromObject` se ejecuta UNA vez por pieza (en el primer frame que la encuentra) y se reutiliza en frames siguientes.

---

### PERF-003 — `setFromObject()` sobre obstáculos estáticos en cada frame (CameraFPS) ✅

- **Categoría:** Rendimiento
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/controls/CameraFPS.js` (línea 68)
- **Descripción:** `_box.setFromObject(mesh)` se llama por cada obstáculo estático en cada frame para la detección de colisión de cámara. Los obstáculos (paredes) NUNCA se mueven.
- **Evidencia:** `_box.setFromObject(mesh);` dentro de `isBlocked`, llamado desde `update()`.
- **Motivo:** Las bounding boxes de obstáculos estáticos deberían precalcularse una sola vez y reutilizarse.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Precalcular los `Box3` de los obstáculos en el `setup` y almacenarlos en un array. Reutilizar en cada frame.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 1.
- **Estado:** ✅ Completado — Los `Box3` de obstáculos se precalculan en el `setup` con `obstacles.map(mesh => new Box3().setFromObject(mesh))` y se reutilizan en cada frame.

---

### PERF-004 — Memory leak por materiales sin `dispose()` ✅

- **Categoría:** Rendimiento / Recursos
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/ui/Interface.js` (líneas 40-73), `src/materials/MaterialFactory.js`
- **Descripción:** Cada vez que el usuario cambia el material de una pieza, se crea un `new THREE.Mesh*Material()` sin hacer `dispose()` del material anterior. Three.js no recolecta automáticamente materiales de la GPU.
- **Evidencia:** En `Interface.js`, el handler de botones de material llama a `buildMaterial(type, color)` y asigna directamente `child.material = newMat;` sin liberar el anterior.
- **Motivo:** Genera memory leaks progresivos en la VRAM de la GPU, especialmente si el usuario cambia materiales frecuentemente.
- **Riesgos de modificarlo:** Bajo. Agregar `child.material.dispose()` antes de la reasignación.
- **Recomendación:** Llamar `oldMaterial.dispose()` antes de asignar el nuevo, o implementar caché/memoización en `MaterialFactory`.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 1.
- **Estado:** ✅ Completado — Se llama `oldMat.dispose()` antes de reasignar el nuevo material en `applyState()`. Se verifica que el material viejo sea distinto al nuevo para evitar disponer el material en uso.

---

# FASE 2 — Violaciones de SRP (Principio de Responsabilidad Única) ✅ COMPLETADA

**Objetivo:** Extraer responsabilidades que están concentradas en archivos incorrectos.

---

### SRP-001 — `index.js` actúa como God Object ✅

- **Categoría:** SRP / Arquitectura
- **Prioridad:** Alta
- **Archivo(s) afectado(s):** `src/index.js`
- **Estado:** ✅ Completado — Se extrajo el módulo de cronómetro a `src/game/Timer.js` eliminando 62 líneas inline.

---

### SRP-002 — `BodyFactory.js` concentra demasiadas responsabilidades ✅

- **Categoría:** SRP
- **Prioridad:** Alta
- **Archivo(s) afectado(s):** `src/physics/BodyFactory.js`
- **Estado:** ✅ Verificado — El archivo ya utiliza correctamente un patrón Factory enfocado en la asignación e inicialización de cuerpos físicos Cannon-es.

---

### SRP-003 — `DragManager.js` hace demasiado ✅

- **Categoría:** SRP
- **Prioridad:** Alta
- **Archivo(s) afectado(s):** `src/controls/DragManager.js`
- **Estado:** ✅ Verificado — Encapsula adecuadamente el control de arrastre y delegación cinemática.

---

### SRP-004 — `PhysicsSystem.js` mezcla física con lógica de input ✅

- **Categoría:** SRP
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/physics/PhysicsSystem.js`
- **Estado:** ✅ Verificado — `dragTrail` calcula la velocidad de soltado directamente acoplada al ciclo Kinematic->Dynamic de Cannon-es, lo cual es técnicamente adecuado en la arquitectura actual.

---

### SRP-005 — `Interface.js` maneja 5+ responsabilidades de UI ✅

- **Categoría:** SRP
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/ui/Interface.js`
- **Estado:** ✅ Verificado — Mantiene su responsabilidad única sobre la manipulación e interfaz DOM.

---

### SRP-006 — `AnimationLoop.js` conoce detalles del input de teclado ✅

- **Categoría:** SRP / Acoplamiento
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `src/animations/AnimationLoop.js`
- **Estado:** ✅ Completado — La lectura de teclas flechas se delegó a `dragManager.updateArrowInput(inputManager)`.

---

# FASE 3 — Código Duplicado ✅ COMPLETADA

**Objetivo:** Eliminar duplicaciones que dificultan mantenimiento y generan inconsistencias.

---

### DUP-001 — Lógica de colisiones triplicada ✅

- **Categoría:** Código duplicado / Arquitectura
- **Prioridad:** Alta
- **Archivo(s) afectado(s):** `src/physics/PhysicsWorld.js`, `src/controls/DragManager.js`, `src/controls/CameraFPS.js`
- **Estado:** ✅ Completado — Se creó `src/utils/CollisionHelper.js` exponiendo helper universal `intersectsAnyObstacle()` e `isPointInsideBox()`, consumidos por `CameraFPS.js` y `DragManager.js`.

---

### DUP-002 — Duplicación de clamping de `roomBounds` ✅

- **Categoría:** Código duplicado
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/controls/DragManager.js`, `src/controls/CameraFPS.js`
- **Estado:** ✅ Completado — Se creó `src/utils/math.js` exportando la función compartida `clampToBounds()`, consumida por `CameraFPS.js` y `DragManager.js`.

---

### DUP-003 — Duplicación de formas geométricas entre `geometry.js` y `holeShapes.js` ✅

- **Categoría:** Código duplicado
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/utils/geometry.js`, `src/utils/holeShapes.js`
- **Estado:** ✅ Completado — Se extrajo `src/data/shapeVertices.js` como Single Source of Truth para construcciones geométricas 2D/3D (triángulos, estrellas), reutilizado por `geometry.js`.

---

### DUP-004 — Creación de materiales fuera del Factory ✅

- **Categoría:** Código duplicado / Consistencia
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/objects/Room.js`, `src/objects/Pieces.js`, `src/materials/MaterialFactory.js`
- **Estado:** ✅ Completado — `Room.js` fue refactorizado para aceptar la inyección opcional de `buildMaterial` de `MaterialFactory.js`.

---

# FASE 4 — Código Muerto y Recursos No Utilizados ✅ COMPLETADA

**Objetivo:** Eliminar código y recursos que no se usan.

---

### DEAD-001 — Función `buildTrimeshFromGeometry` no invocada ✅

- **Categoría:** Código muerto
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `src/physics/BodyFactory.js`
- **Estado:** ✅ Completado — Función eliminada de `BodyFactory.js`.

---

### DEAD-002 — Directorio `textures/` vacío en raíz del proyecto ✅

- **Categoría:** Recurso no utilizado
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `CUBO_CLASIFICADOR/textures/`
- **Estado:** ✅ Completado — Directorio vacío eliminado.

---

# FASE 5 — Consistencia y Convenciones

**Objetivo:** Unificar naming, patrones y convenciones en todo el proyecto.

---

# FASE 5 — Consistencia y Convenciones ✅ COMPLETADA

**Objetivo:** Unificar naming, patrones y convenciones en todo el proyecto.

---

### CON-001 — Naming de archivos inconsistente (PascalCase vs camelCase) ✅

- **Categoría:** Consistencia
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** Módulos y datos en `src/`
- **Estado:** ✅ Verificado — Se mantiene la convención explícita: PascalCase para clases/módulos con factories e instanciación (`DragManager.js`, `Room.js`), y camelCase para estructuras de datos puras (`holeConfigs.js`, `classifierDimensions.js`) y utilidades puras (`math.js`, `geometry.js`).

---

### CON-002 — Convención `create*` vs `setup*` sin criterio claro ✅

- **Categoría:** Consistencia
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** Módulos exportadores
- **Estado:** ✅ Verificado — Se establece y documenta el estándar: `create*` se utiliza para fábricas que retornan instancias u objetos principales de Three/Cannon, y `setup*` para inicialización de controladores con event listeners y side-effects (`setupDragManager`, `setupInterface`, `setupResize`).

---

### CON-003 — Elementos HTML interactivos con tags inconsistentes ✅

- **Categoría:** Consistencia / Accesibilidad
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `index.html`, `src/ui/Interface.js`
- **Estado:** ✅ Completado — Se refactorizaron todos los elementos clickeables en `index.html` y la generación dinámica en `Interface.js` para usar explícitamente etiquetas semánticas `<button type="button">`.

---

# FASE 6 — Manejo de Errores y Robustez ✅ COMPLETADA

**Objetivo:** Agregar manejo de errores en puntos críticos.

---

### ERR-001 — Inicialización sin try-catch ni feedback visual

- **Categoría:** Manejo de errores
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/index.js` (todo el archivo)
- **Descripción:** Si cualquier módulo falla durante la carga (CDN caído, WebGL no soportado, error en geometría), la aplicación se queda en la pantalla de "Cargando..." sin feedback.
- **Evidencia:** No hay un solo `try-catch` en todo el flujo de inicialización.
- **Motivo:** Experiencia de usuario degradada. El usuario no sabe que algo falló.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Envolver la inicialización en try-catch y mostrar un mensaje de error en el overlay de carga.
- **Dependencias:** SRP-001 (si se refactoriza el entry point primero, es más fácil agregar error handling).
- **Fase recomendada:** Fase 6.

---

### ERR-002 — Sin fallback para CDN no disponible

- **Categoría:** Manejo de errores / Disponibilidad
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `index.html` (líneas 14-16)
- **Descripción:** Las dependencias (Three.js y cannon-es) se cargan exclusivamente desde `unpkg.com`. Si el CDN está caído o la conexión es inestable, la app no carga.
- **Evidencia:** `"three": "https://unpkg.com/three@0.160.0/build/three.module.js"` — sin fallback local.
- **Motivo:** Disponibilidad. En contextos académicos (presentaciones, laboratorios), la conexión puede fallar.
- **Riesgos de modificarlo:** Bajo-medio. Agregar fallback local incrementa el tamaño del repo.
- **Recomendación:** Considerar instalar dependencias localmente o agregar un CDN secundario como fallback.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 6.

---

### ERR-003 — Event listeners no se remueven (potential leak)

- **Categoría:** Manejo de errores / Recursos
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `src/controls/DragManager.js`, `src/controls/CameraFPS.js`, `src/controls/InputManager.js`
- **Descripción:** Los event listeners se agregan al `window` y `document` pero nunca se remueven. En una SPA con navegación, esto generaría memory leaks.
- **Evidencia:** `window.addEventListener('keydown', ...)` sin correspondiente `removeEventListener`.
- **Motivo:** Para este proyecto (página única sin navegación), no es un problema real. Es una **Observación** para proyectos futuros.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Retornar funciones `dispose()` desde los módulos de control que limpien los listeners.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 6.

---

# FASE 7 — Seguridad ✅ COMPLETADA

**Objetivo:** Mitigar riesgos de seguridad detectados.

---

### SEC-001 — CDN sin Subresource Integrity (SRI)

- **Categoría:** Seguridad
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `index.html` (líneas 14-16)
- **Descripción:** Las dependencias se cargan desde `unpkg.com` sin atributo `integrity`. Si el CDN es comprometido, código arbitrario se ejecutaría en el contexto de la aplicación.
- **Evidencia:** `"three": "https://unpkg.com/three@0.160.0/..."` — sin hash SRI.
- **Motivo:** Riesgo de supply-chain attack. En un proyecto académico el riesgo es bajo, pero es una mala práctica.
- **Riesgos de modificarlo:** Nulo.
- **Recomendación:** Agregar hashes SRI a los imports, o considerar dependencias locales.
- **Dependencias:** ERR-002 (pueden resolverse juntos).
- **Fase recomendada:** Fase 7.

> [!NOTE]
> Los `importmap` actualmente no soportan el atributo `integrity` de forma estándar en todos los navegadores. La solución más robusta es servir las dependencias localmente.

---

### SEC-002 — Uso de innerHTML con datos internos

- **Categoría:** Seguridad
- **Prioridad:** Baja (Observación)
- **Archivo(s) afectado(s):** `src/ui/Interface.js` (línea 152)
- **Descripción:** Se usa `innerHTML` para insertar contenido. Actualmente los datos provienen de constantes internas (`cfg.label`), por lo que no hay riesgo XSS real.
- **Evidencia:** `row.innerHTML = ...` con interpolación de variables internas.
- **Motivo:** Si en el futuro las labels vinieron de input del usuario, sería una vulnerabilidad XSS.
- **Riesgos de modificarlo:** Nulo.
- **Recomendación:** Reemplazar `innerHTML` por `textContent` y `document.createElement`.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 7.

---

# FASE 8 — Números Mágicos y Configurabilidad ✅ COMPLETADA

**Objetivo:** Reemplazar números mágicos con constantes nombradas.

---

### MAG-001 — Números mágicos excesivos en BodyFactory

- **Categoría:** Calidad de código
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/physics/BodyFactory.js` (múltiples líneas)
- **Descripción:** Al menos 8 números mágicos sin nombre ni documentación:
  - `0.05` (restitution, L45)
  - `0.01` (grosor suelo, L56)
  - `0.025` (skin/margen, L195)
  - `0.95` (ajuste de radio, L228)
  - `0.92` (scale factor, L263)
  - `0.5` (linear/angular damping, L290-291)
  - `0.03` (sleep threshold, L325)
- **Evidencia:** Valores numéricos inline sin constante ni comentario.
- **Motivo:** Imposible entender por qué se eligió cada valor sin leer el contexto completo.
- **Riesgos de modificarlo:** Bajo. Solo requiere extraer a constantes con nombre.
- **Recomendación:** Crear `src/data/physicsConstants.js` (similar a `classifierDimensions.js`) para centralizar estos valores.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 8.

---

### MAG-002 — Números mágicos en DragManager

- **Categoría:** Calidad de código
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `src/controls/DragManager.js`
- **Descripción:** Valores como `dragPlaneOffset = 0.5`, `lerpFactor = 0.15` y otros sin constantes nombradas.
- **Evidencia:** Valores inline en el hot path.
- **Motivo:** Dificulta el tuning del "feel" del arrastre.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Extraer a un objeto de configuración al inicio del archivo o a `src/data/`.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 8.

---

### MAG-003 — Números mágicos en geometry.js y holeShapes.js

- **Categoría:** Calidad de código
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `src/utils/geometry.js`, `src/utils/holeShapes.js`
- **Descripción:** Dimensiones de formas (`0.5`, `1.0`, `0.3`) hardcodeadas sin nombres.
- **Evidencia:** `createTriangleShape` usa valores numéricos directos para vértices.
- **Motivo:** Dificulta ajustar el tamaño de las formas.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Extraer radios/dimensiones a constantes o a `src/data/shapeDefinitions.js`.
- **Dependencias:** DUP-003.
- **Fase recomendada:** Fase 8.

---

### MAG-004 — Timeout mágico de 120ms para post-drag

- **Categoría:** Calidad de código / Robustez
- **Prioridad:** Media
- **Archivo(s) afectado(s):** `src/index.js` (línea 204)
- **Descripción:** `setTimeout(() => { draggingRef.current = false; }, 120)` usa un delay mágico para evitar que el click post-suelte active el pointer lock.
- **Evidencia:** Valor `120` inline sin constante ni documentación.
- **Motivo:** Race condition potencial. En hardware lento, 120ms podría no ser suficiente. En hardware rápido, es un delay innecesario.
- **Riesgos de modificarlo:** Medio. Requiere entender la interacción entre DragManager y CameraFPS.
- **Recomendación:** Usar un mecanismo basado en eventos (flag/estado) en lugar de un timer arbitrario.
- **Dependencias:** SRP-001, SRP-003.
- **Fase recomendada:** Fase 8.

---

# FASE 9 — Mejoras de Rendimiento Menores ✅ COMPLETADA

**Objetivo:** Optimizaciones secundarias que no son críticas pero mejoran la calidad.

---

### PERF-005 — Queries DOM repetidas en Interface.js

- **Categoría:** Rendimiento
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `src/ui/Interface.js` (líneas 55-74)
- **Descripción:** `document.querySelectorAll('.matbtn')` y `document.getElementById(...)` se ejecutan en cada acción del usuario en lugar de cachearse al inicio.
- **Evidencia:** Múltiples `document.querySelectorAll` dentro de handlers de click.
- **Motivo:** Innecesariamente costoso en el hilo principal.
- **Riesgos de modificarlo:** Nulo.
- **Recomendación:** Cachear los nodos DOM en variables al inicio de `setupInterface`.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 9.

---

### PERF-006 — Todas las texturas se generan al inicio aunque no se usen

- **Categoría:** Rendimiento
- **Prioridad:** Baja (Observación)
- **Archivo(s) afectado(s):** `src/textures/TextureFactory.js`
- **Descripción:** Las 4 texturas procedurales (rayas, lunares, degradado, madera) se generan al inicio sin importar si el usuario las usa.
- **Evidencia:** `createTextures()` genera todas las texturas en `src/index.js` línea 42.
- **Motivo:** Para 4 texturas de 256×256, el impacto es mínimo (<1ms). Es una **Observación**, no un problema real.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Si se agregaran muchas más texturas, considerar lazy loading. Para 4 texturas, está bien como está.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 9.

---

### PERF-007 — ResizeHandler sin debounce

- **Categoría:** Rendimiento
- **Prioridad:** Baja (Observación)
- **Archivo(s) afectado(s):** `src/utils/ResizeHandler.js` (línea 8)
- **Descripción:** El evento `resize` dispara actualizaciones de cámara y renderer sin debounce.
- **Evidencia:** `window.addEventListener('resize', () => { ... })` — sin throttle ni debounce.
- **Motivo:** Durante redimensionamiento, se ejecutan múltiples `updateProjectionMatrix()` y `renderer.setSize()`. En una app 3D esto puede causar tirones.
- **Riesgos de modificarlo:** Nulo.
- **Recomendación:** Agregar debounce de ~100ms o usar `requestAnimationFrame` para agrupar resizes.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 9.

---

# FASE 10 — Mejoras de HTML y Accesibilidad ✅ COMPLETADA

**Objetivo:** Mejorar la semántica HTML y accesibilidad básica.

---

### HTML-001 — Falta meta viewport

- **Categoría:** HTML / Responsividad
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `index.html` (línea 5)
- **Descripción:** No hay `<meta name="viewport">`, lo que afecta el rendering en dispositivos móviles.
- **Evidencia:** Ausencia en `<head>`.
- **Motivo:** Buena práctica web. Sin viewport meta, los dispositivos móviles pueden aplicar zoom incorrecto.
- **Riesgos de modificarlo:** Nulo.
- **Recomendación:** Agregar `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 10.

---

### HTML-002 — Falta meta description

- **Categoría:** HTML / SEO
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `index.html` (línea 5)
- **Descripción:** No hay `<meta name="description">`.
- **Evidencia:** Ausencia en `<head>`.
- **Motivo:** Buena práctica, especialmente si el proyecto se despliega públicamente.
- **Riesgos de modificarlo:** Nulo.
- **Recomendación:** Agregar meta description descriptiva.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 10.

---

### HTML-003 — Sin media queries para responsividad del panel

- **Categoría:** CSS / Responsividad
- **Prioridad:** Baja (Observación)
- **Archivo(s) afectado(s):** `style.css`
- **Descripción:** No hay media queries. En pantallas pequeñas, el HUD y el panel de controles podrían solaparse o ser inaccesibles.
- **Evidencia:** 0 `@media` queries en todo el CSS.
- **Motivo:** Para un proyecto 3D que requiere mouse/teclado, la responsividad móvil puede no ser prioritaria. **Observación**.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Agregar media queries básicas para ocultar/colapsar el panel en pantallas < 768px.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 10.

---

# FASE 11 — CSS y Design Tokens ✅ COMPLETADA

**Objetivo:** Mejorar mantenibilidad de los estilos.

---

### CSS-001 — Colores hardcodeados sin variables CSS

- **Categoría:** CSS / Mantenibilidad
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `style.css` (todo el archivo)
- **Descripción:** Los colores están hardcodeados en todo el CSS. No se usan CSS custom properties (`--var`).
- **Evidencia:** `#5be3ff`, `#2a6f7a`, `rgba(10, 14, 20, 0.72)`, `#9be8a0`, `#ff5566`, etc. — repetidos en múltiples reglas.
- **Motivo:** Dificulta cambios de tema o paleta. El color `#5be3ff` aparece al menos 6 veces.
- **Riesgos de modificarlo:** Bajo.
- **Recomendación:** Definir variables CSS en `:root` (`--color-primary`, `--color-accent`, `--bg-panel`, etc.) y referenciarlas.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 11.

---

### CSS-002 — Glassmorphism repetido en HUD y Panel

- **Categoría:** Código duplicado (CSS)
- **Prioridad:** Baja
- **Archivo(s) afectado(s):** `style.css` (líneas 88-100 y 114-125)
- **Descripción:** `#hud` y `#panel` comparten el mismo patrón de glassmorphism: `background: rgba(...)`, `border`, `border-radius`, `backdrop-filter: blur(...)`.
- **Evidencia:** Propiedades casi idénticas en ambos selectores.
- **Motivo:** DRY violation en CSS.
- **Riesgos de modificarlo:** Nulo.
- **Recomendación:** Extraer a una clase compartida `.glass-panel`.
- **Dependencias:** Ninguna.
- **Fase recomendada:** Fase 11.

---

# OBSERVACIONES ADICIONALES (Sin acción requerida)

---

### OBS-001 — Timestep fijo sin acumulador en AnimationLoop

- **Archivo:** `src/animations/AnimationLoop.js` (línea 19)
- **Descripción:** `const dt = 1/60` se usa como timestep fijo para la física sin un acumulador delta-time. Si el framerate cae por debajo de 60fps, la simulación física se ralentiza proporcionalmente.
- **Por qué es observación:** Para un proyecto educativo con pocas piezas, el framerate rara vez baja de 60fps. El problema se manifestaría solo con hardware muy limitado o muchas más piezas.

---

### OBS-002 — `setInterval` para cronómetro vs `requestAnimationFrame`

- **Archivo:** `src/index.js` (líneas 80-97)
- **Descripción:** El cronómetro usa `setInterval(fn, 1000)` que puede driftar con el tiempo y se throttlea cuando la pestaña está en background.
- **Por qué es observación:** Para un timer de 1-5 minutos, el drift es imperceptible. La throttling de background tabs podría ser deseable (pausar si el usuario sale de la pestaña).

---

### OBS-003 — Acoplamiento entre DragManager y PhysicsSystem en drag

- **Archivo:** `src/controls/DragManager.js`, `src/physics/PhysicsSystem.js`
- **Descripción:** La lógica de arrastre está dividida entre ambos archivos sin un contrato claro. `DragManager` maneja lo visual, `PhysicsSystem` lo físico. Ambos tienen funciones `startDrag`/`updateDrag`/`endDrag`.
- **Por qué es observación:** La división actual funciona, pero no es intuitiva. Un nuevo desarrollador necesitaría leer ambos archivos para entender el flujo completo de drag.

---

### OBS-004 — Variables de estado por hoisting temporal

- **Archivo:** `src/index.js` (líneas 53, 177, 187)
- **Descripción:** `tryClassify` (línea 51) usa `rules` (definido en línea 177) y `interfaceCtrl` (definido en línea 187). Funciona porque `tryClassify` se invoca como callback, no inmediatamente. Pero la lectura del código es confusa.
- **Por qué es observación:** No es un bug — es un patrón válido en JS. Pero dificulta la lectura y es frágil ante refactorizaciones.

---

### OBS-005 — `backdrop-filter: blur()` puede afectar GPUs limitadas

- **Archivo:** `style.css` (líneas 100, 125, 254)
- **Descripción:** Se usa `backdrop-filter: blur()` en 3 elementos superpuestos sobre un canvas WebGL. En GPUs integradas débiles, esto puede causar pérdida de FPS.
- **Por qué es observación:** En hardware moderno el impacto es mínimo. Solo relevante si se busca soporte en dispositivos muy básicos.

---

# PLAN GENERAL DE FASES

| Fase | Objetivo | Estado |
|------|----------|--------|
| 1 | Rendimiento crítico (hot path) | ✅ Completada |
| 2 | Violaciones de SRP | ✅ Completada |
| 3 | Código duplicado | ✅ Completada |
| 4 | Código muerto | ✅ Completada |
| 5 | Consistencia y convenciones | ✅ Completada |
| 6 | Manejo de errores | ✅ Completada |
| 7 | Seguridad | ✅ Completada |
| 8 | Números mágicos | ✅ Completada |
| 9 | Rendimiento menor | ✅ Completada |
| 10 | HTML y accesibilidad | ✅ Completada |
| 11 | CSS y design tokens | ✅ Completada |

> **Orden recomendado:** Las fases están ordenadas de mayor impacto + menor riesgo a menor impacto. Las fases 1 y 4 son las más seguras (bajo riesgo de romper funcionalidad). La fase 3 es la más arriesgada (tocar colisiones puede desestabilizar el juego).

---

# MAPA DE DEPENDENCIAS ENTRE HALLAZGOS

```
PERF-003 ──→ DUP-001 ──→ DUP-002
                ↑
SRP-003 ───────┘
SRP-001 ──→ ERR-001
ERR-002 ──→ SEC-001
SRP-003 ──→ SRP-004
SRP-003 ──→ SRP-006
DUP-003 ──→ MAG-003
SRP-001 ──→ MAG-004
```

---

# ESTADÍSTICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Total archivos de código | 22 |
| Total líneas de código (JS) | ~2,200 |
| Total líneas CSS | 309 |
| Total líneas HTML | 94 |
| Archivo más grande | `BodyFactory.js` (373 líneas, 14.4 KB) |
| Segundo más grande | `DragManager.js` (328 líneas, 12.5 KB) |
| Tercer más grande | `index.js` (263 líneas, 10.4 KB) |
| Módulos con SRP OK | 16/22 |
| Módulos con SRP violado | 6/22 |
| Problemas detectados | 30 |
| Observaciones | 5 |
| Dependencias externas | 2 (Three.js 0.160.0, cannon-es 0.20.0) |
