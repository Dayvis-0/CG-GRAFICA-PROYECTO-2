# 🧪 TEST BENCH 3D
## Laboratorio interactivo de gráficos por computadora

**Asignatura:** Computación Gráfica — Unidad II
**Docente:** M.Sc. Neptalí Menejes Palomino

---

## ¿Qué es?

Una aplicación web 3D que funciona como **banco de pruebas interactivo**. En lugar de una demo fija, vos controlás todo en tiempo real: seleccionás un objeto, le cambiás el material, apagás luces, aplicás texturas, alternás entre perspectiva y ortográfica, y **movés los objetos con las flechas del teclado**.

> Un laboratorio de gráficos 3D funcionando en el navegador.

---

## ¿Qué se puede hacer?

### 🎯 Seleccionar y mover objetos
- **Clic** en cualquier objeto (o en los botones del panel) para seleccionarlo
- Se marca con un **anillo brillante**
- **Flechas del teclado** para moverlo por la escena:
  - ← → : mover en X (izquierda/derecha)
  - ↑ ↓ : mover en Z (fondo/primer plano)
- El anillo de selección sigue al objeto cuando se mueve

### 🎨 Cambiar material
| Material | Característica |
|----------|---------------|
| **Lambert** | Superficie mate, sin brillos. Muestra iluminación por vértices |
| **Phong** | Brillos especulares visibles. Iluminación por píxel |
| **Standard (PBR)** | Acabado metálico/rugoso realista |

### 💡 Controlar 4 luces
Cada una tiene su interruptor ON/OFF:
- **Direccional** — luz blanca que viene de arriba, proyecta sombras
- **Puntual roja** — luz localizada a la izquierda
- **Puntual azul** — luz localizada a la derecha
- **Ambiental** — iluminación base pareja

### 🖼 Aplicar texturas procedurales (sin imágenes externas)
`Ninguna` · `Rayas` · `Lunares` · `Degradado` · `Madera`

### 📷 Cambiar proyección
- **Perspectiva** — objetos lejanos se ven más chicos (como el ojo humano)
- **Ortográfica** — todos los objetos se ven del mismo tamaño

### 🖱 Mover la cámara
- **Arrastrar** con mouse para orbitar
- **Rueda** para acercar/alejar

---

## La escena

Cuatro primitivas 3D visibles al mismo tiempo sobre un pedestal:

```
Esfera (SphereGeometry)   →   x: -4.5
Toro   (TorusGeometry)    →   x: -1.5
Cubo   (BoxGeometry)      →   x:  1.5
Cono   (ConeGeometry)     →   x:  4.5
```

Todas rotan lentamente para que se vea el sombreado desde todos los ángulos.

---

## HUD (información en pantalla)

En la esquina superior izquierda se ve siempre:
- Objeto seleccionado
- Material activo
- Textura activa
- Proyección activa

---

## Tecnologías

| Componente | Qué es |
|------------|--------|
| **Three.js** (r160) | Biblioteca gráfica 3D |
| **ES Modules** | JavaScript modular, sin bundlers |
| **Canvas 2D API** | Genera texturas procedurales |
| **CSS vanilla** | Estilos sin frameworks |

---

## Arquitectura

```
TEST_BENCH/
├── index.html
├── style.css
└── src/
    ├── index.js              ← Orquestador
    ├── core/                 ← Escena, cámaras, renderer
    ├── objects/              ← 4 primitivas + anillos de selección
    ├── lights/               ← 4 luces
    ├── textures/             ← Texturas procedurales
    ├── materials/            ← Fábrica de materiales
    ├── controls/             ← Órbita de cámara
    ├── ui/                   ← Interfaz + selección por clic + movimiento por teclado
    ├── animations/           ← Bucle de renderizado
    └── utils/                ← Responsive
```

Cada archivo hace **una sola cosa**.
