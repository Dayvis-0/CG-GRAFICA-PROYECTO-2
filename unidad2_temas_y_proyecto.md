# Unidad II — Gráficos 3D y Técnicas Avanzadas
**Asignatura:** Computación Gráfica (IIAD65) · Ciclo VI  
**Docente:** M.Sc. Neptalí Menejes Palomino  
**Duración:** 17/06/2026 al 11/08/2026 · 48 horas · 8 semanas

---

## Temas por semana

### Semana 9 — Visualización de Objetos 3D
- Modelado 3D: conceptos y representaciones
- Vistas y proyecciones (perspectiva y ortográfica)
- Mallas poligonales y superficies
- Superficies paramétricas y NURBS

### Semana 10 — Modelado Poligonal y Transformaciones Geométricas 3D
- Representación poligonal y normales de superficie
- Transformaciones básicas en 3D: traslación, rotación, escalado
- Composición de transformaciones
- Matrices de transformación homogéneas

### Semana 11 — Modelos de Iluminación y Sombreado
- Modelo de iluminación de Phong
- Tipos de fuentes de luz: ambiental, direccional, puntual, spot
- Modelos de sombreado: Flat, Gouraud, Phong
- Componentes: ambiente, difusa, especular

### Semana 12 — Realismo y Rendering
- Conceptos básicos de rendering
- Texturas 2D y mapeo UV
- Texturas 3D y procedurales
- Transparencia, reflejos (espejos) y sombras

### Semana 13 — Técnicas de Renderizado Avanzado (Ray Tracing)
- Introducción al ray tracing
- Ray tracing básico: rayos primarios y secundarios
- Mapeo de sombras (shadow mapping)
- Hardware requerido y aplicaciones actuales

### Semana 14 — Procesamiento de Imágenes y Visión por Computador
- Conceptos generales e historia
- Técnicas de mejoramiento de contraste y filtros
- Detección de bordes
- Aplicaciones en casos reales

### Semana 15 — Evaluación Final
- Examen de conocimientos (Unidad II)
- Informe final del proyecto de computación gráfica

### Semana 16 — Evaluación de Aplazados

---

## Resultado de aprendizaje de la unidad

El estudiante implementa aplicaciones de computación gráfica en 3D integrando técnicas de renderización, iluminación y uso de APIs modernas, optimizando el rendimiento de la solución.

---

## Criterios de evaluación

| Evidencia | Peso | Instrumento |
|---|---|---|
| Conocimiento | 40% | Examen escrito |
| Desempeño | 50% | Examen práctico de laboratorio |
| Actitudes | 10% | Ficha de observación actitudinal |

---

## Cómo debe ser el proyecto

### Objetivo general
El proyecto debe ser una aplicación de computación gráfica 3D funcional que demuestre los temas de la unidad de forma visible e interactiva. No es suficiente que funcione: el profesor debe poder ver qué concepto se está aplicando en cada momento.

### Qué debe incluir

**Escena 3D con objetos**
La aplicación debe mostrar objetos 3D reales (no solo figuras decorativas). Lo mínimo es una malla poligonal con normales correctas para que la iluminación funcione bien. Los objetos deben poder transformarse: moverse, rotar y escalar, ya sea automáticamente o por interacción del usuario.

**Modelos de iluminación visibles**
Este es el tema más importante de la unidad. El proyecto debe permitir cambiar entre al menos dos modelos de sombreado (por ejemplo Lambert, Phong y PBR/Standard) y el cambio debe notarse visualmente en los objetos. También debe haber al menos dos tipos de fuentes de luz activas (direccional, puntual o spot), y preferiblemente se puede encender y apagar cada una para mostrar su efecto por separado.

**Texturas**
Los objetos o el entorno deben tener algún tipo de textura. Puede ser una textura cargada desde imagen o una textura procedural generada por código (con Canvas o GLSL). Lo importante es que no todo sea color sólido.

**Dos tipos de proyección**
Debe existir un botón o control que cambie entre cámara perspectiva y cámara ortográfica. Esto demuestra directamente el tema de vistas y proyecciones de la semana 9.

**Algún efecto de realismo**
Puede ser sombras proyectadas, transparencia en algún material, o un efecto de reflejo simple. No tiene que ser ray tracing completo, pero sí debe haber algo que vaya más allá del sombreado básico.

**Interfaz que nombre los conceptos**
El proyecto debe mostrar de alguna forma qué concepto gráfico está activo en cada momento: el tipo de material, el tipo de cámara, las luces encendidas. Puede ser un HUD, etiquetas en los controles o un panel lateral. Esto es importante porque le permite al profesor ver que el estudiante sabe lo que está implementando y no solo copió código.

### Qué no debe faltar para la nota

Según las rúbricas del sílabo, se evalúa en cinco criterios de desempeño:

1. **Implementación del pipeline de renderizado 3D** — debe ser completo y funcional, no parcial
2. **Aplicación de iluminación** — modelos de iluminación correctos en la escena
3. **Uso de APIs gráficas** — manejo eficiente de Three.js, WebGL u otra API moderna
4. **Optimización del rendimiento** — uso de buffers compartidos, materiales reutilizados, no crear objetos en el loop de animación
5. **Calidad de la solución gráfica** — aplicación estable, visualmente correcta y sin errores evidentes

### Recomendaciones de presentación

Preparar una demostración de 3 a 5 minutos donde se muestre: primero la escena funcionando, luego cambiar el modelo de sombreado para que se note la diferencia, luego apagar y encender luces individualmente, cambiar entre perspectiva y ortográfica, y finalmente mostrar las texturas de cerca. Eso cubre todos los temas de forma ordenada y el profesor puede seguir la demostración sin perderse.
