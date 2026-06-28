# 🧪 TEST BENCH 3D
## Laboratorio interactivo de gráficos por computadora

**Asignatura:** Computación Gráfica — Unidad II  
**Integrantes:** _[Tus nombres aquí]_  
**Docente:** M.Sc. Neptalí Menejes Palomino

---

## ¿Qué es?

Una aplicación web 3D que funciona como un **banco de pruebas interactivo**.

En lugar de una demo fija donde solo mirás, acá **vos controlás todo**: seleccionás un objeto, le cambiás el material, apagás luces, aplicás texturas, alternás entre perspectiva y ortográfica… y ves el resultado **al instante**.

> Es como tener un laboratorio de gráficos 3D en el navegador.

---

## ¿Para qué sirve?

Para **entender visualmente** los conceptos de la Unidad II.

En vez de ver dibujos en una diapositiva, podés:

| Concepto | Lo ves en acción |
|---|---|
| **Proyección perspectiva vs ortográfica** | Apretás un botón y la escena cambia al instante |
| **Material Lambert vs Phong vs PBR** | Seleccionás un objeto, tocás el material, y ves la diferencia en los brillos |
| **Cómo afecta cada luz** | Apagás la luz direccional y la escena se oscurece de un lado |
| **Qué hace una textura** | Aplicás "rayas", "madera" o "degradado" y el objeto se transforma |
| **Sombras en tiempo real** | Los objetos proyectan sombra sobre el pedestal |

---

## ¿Qué objetos tiene la escena?

Cuatro primitivas 3D visibles **al mismo tiempo**, cada una con una geometría distinta:

```
  Esfera         Toro          Cubo           Cono
 ●━━━━━━━━━━━━━ ◎ ━━━━━━━━━━━━━━ ◼ ━━━━━━━━━━━━━━ ▲
  SphereGeo     TorusGeo      BoxGeo         ConeGeo
  48×32 segm.   24×48 segm.   1.5×1.5×1.5    32 segm.
```

Cada una rota lentamente para que se vea el sombreado desde todos los ángulos.

---

## Panel de control — ¿Qué puedo hacer?

### 🎯 Seleccionar objeto
Hacés clic en un objeto (o en los botones del panel) y se marca con un **anillo brillante**. El HUD muestra qué objeto está seleccionado.

### 🎨 Cambiar material
Tres opciones para el objeto seleccionado:

| Material | Cómo se ve | Para qué sirve |
|---|---|---|
| **Lambert** | Superficie mate, sin brillos | Muestra iluminación por vértices, más plana |
| **Phong** | Brillos especulares visibles | Muestra iluminación por píxel, más realista |
| **Standard (PBR)** | Acabado metálico/rugoso | Muestra el modelo físico basado en metalness y roughness |

### 💡 Controlar las 4 luces
Cada luz tiene su interruptor ON/OFF:

```
☀️ Direccional  →  luz blanca que viene de arriba (con sombras)
🔴 Puntual roja →  luz localizada a la izquierda
🔵 Puntual azul →  luz localizada a la derecha
🌫 Ambiental    →  iluminación base pareja
```

Podés **apagar cualquier luz** para ver cómo contribuye a la escena.

### 🖼 Aplicar texturas
Cinco opciones, generadas con código (sin imágenes externas):

`Ninguna` · `Rayas` · `Lunares` · `Degradado` · `Madera`

Se aplican al instante sobre el objeto seleccionado.

### 📷 Cambiar proyección
Dos botones:

- **Perspectiva** → los objetos lejanos se ven más chicos (como el ojo humano)
- **Ortográfica** → todos los objetos se ven del mismo tamaño sin importar la distancia

### 🖱 Mover la cámara
- **Arrastrar** con el mouse para orbitar alrededor de la escena
- **Rueda** para acercar y alejar

---

## HUD — ¿Qué información muestra?

En la esquina superior izquierda ves siempre:

```
🔬 TEST BENCH 3D
Objeto:      Toro
Material:    Phong
Textura:     Rayas
Proyección:  Perspectiva
```

Sabés en todo momento **qué concepto está activo**.

---

## ¿Qué tecnologías usa?

| Componente | Qué es |
|---|---|
| **Three.js** (r160) | La biblioteca gráfica que dibuja todo en 3D |
| **ES Modules** | JavaScript moderno sin bundlers ni herramientas externas |
| **Canvas 2D API** | Para generar las texturas directamente en el navegador |
| **CSS vanilla** | Estilos propios, sin frameworks |

---

## Arquitectura del código

El proyecto está **modularizado** para que sea fácil de entender y mantener:

```
TEST_BENCH/
├── index.html             ← Página principal (solo HTML)
├── style.css              ← Estilos
└── src/
    ├── index.js           ← Orquestador (conecta todo)
    ├── core/              ← Escena, cámaras, renderer
    ├── objects/           ← Las 4 primitivas 3D
    ├── lights/            ← Las 4 luces
    ├── textures/          ← Generación de texturas
    ├── materials/         ← Fábrica de materiales
    ├── controls/          ← Órbita de cámara
    ├── ui/                ← Interfaz de usuario
    ├── animations/        ← Bucle de renderizado
    └── utils/             ← Utilitarios (responsive)
```

Cada archivo hace **una sola cosa** y está bien identificado.

---

## Demo en vivo (3–5 min)

1. **Mostrar la escena** — los 4 objetos rotando, sombras, luces encendidas
2. **Seleccionar un objeto** — clic en el viewport o botón del panel
3. **Cambiar material** — Lambert → Phong → Standard, se ven los brillos
4. **Apagar luces** — una por una, se ve cómo cambia la iluminación
5. **Aplicar textura** — "madera" o "degradado" sobre el objeto seleccionado
6. **Alternar proyección** — perspectiva ↔ ortográfica, se nota la diferencia
7. **Mover la cámara** — arrastrar para orbitar, rueda para zoom

---

## ¿Por qué este proyecto?

Porque **no es solo código que funciona**: es una herramienta para **aprender gráficos 3D haciendo**. Cada control está etiquetado con su nombre técnico. El HUD muestra los conceptos activos. El docente puede señalar cualquier elemento y decir "eso es el modelo Phong" y el alumno lo ve en pantalla, funcionando, en tiempo real.

> No es una demo que se mira — es un laboratorio que se experimenta.
