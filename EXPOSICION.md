# 🧪 TEST BENCH 3D — Exposición

**Computación Gráfica — Unidad II**
**Docente:** M.Sc. Neptalí Menejes Palomino

---

## En una frase

Un banco de pruebas 3D interactivo donde el usuario controla materiales, luces, texturas, proyección y mueve objetos con el teclado — todo en tiempo real.

---

## Demo paso a paso (3–5 min)

| # | Qué mostrar | Concepto que demuestra |
|---|-------------|----------------------|
| 1 | **Escena funcionando** | 4 objetos 3D rotando, sombras, luces | 
| 2 | **Seleccionar un objeto** (clic) + **moverlo con flechas** | Interacción 3D, transformaciones |
| 3 | **Cambiar material** → Lambert / Phong / Standard | Modelos de sombreado |
| 4 | **Apagar/encender luces** una por una | Tipos de luz, componentes de iluminación |
| 5 | **Aplicar textura** (madera, rayas, degradado) | Mapeo de texturas |
| 6 | **Alternar proyección** → Perspectiva ↔ Ortográfica | Proyecciones 3D |
| 7 | **Mover cámara** (arrastrar + zoom) | Transformaciones de vista |

---

## Novedad: movimiento por teclado

Cuando un objeto está seleccionado (clic), se mueve con las **flechas del teclado**:

| Tecla | Movimiento |
|-------|------------|
| ← → | Izquierda / Derecha (eje X) |
| ↑ ↓ | Fondo / Primer plano (eje Z) |

**Por qué importa:** permite ver cómo la posición de un objeto afecta la incidencia de la luz, las sombras proyectadas y la percepción de profundidad en ambas proyecciones.

---

## Conceptos clave que se ven en acción

| Tema | Cómo se demuestra |
|------|-------------------|
| **Mallas poligonales** | 4 geometrías distintas visibles a la vez |
| **Iluminación** | 4 luces con toggle + 3 modelos de material |
| **Texturas** | 5 procedurales, generadas con Canvas |
| **Proyecciones** | Switch perspectiva ↔ ortográfica en vivo |
| **Sombras** | Shadow mapping con PCFSoftShadowMap |
| **Transformaciones** | Rotación continua + movimiento por teclado |

---

## Stack técnico (simple)

- **Three.js** para renderizado 3D
- **JavaScript ES modules** (sin bundlers)
- **Canvas API** para texturas procedurales
- **HTML + CSS** puro

---

## Para explicar en la exposición

1. **Arquitectura modular** — cada cosa en su archivo: objetos, luces, materiales, texturas, animación
2. **Texturas procedurales** — se generan con código, no hay imágenes externas
3. **Movimiento por teclado** — cuando seleccionás un objeto, las flechas modifican su posición en X y Z, el anillo de selección lo sigue
4. **Raycaster** — la selección funciona lanzando un rayo desde la cámara hasta donde hiciste clic
5. **Dos cámaras** — comparten la misma órbita, solo cambia la matriz de proyección
