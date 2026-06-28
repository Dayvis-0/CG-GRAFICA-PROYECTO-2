# Ideas de Proyecto — Unidad II

> Varias opciones con distinta dificultad. Todas cubren los conceptos evaluables del syllabus.

---

## 🏛️ Idea 1 — Galería de Arte 3D

**Dificultad:** ★★★☆☆ (similar al visualizador de audio)

**Qué es:** Una sala vacía con paredes, piso y techo. En las paredes cuelgan 3 cuadros con texturas procedurales. En el centro una escultura (toro o esfera).

**Conceptos que muestra:**
- Objetos 3D: la sala como cajas, la escultura, los cuadros como planos
- Iluminación: SpotLight apuntando a cada cuadro + AmbientLight, toggles individuales
- Materiales: cambiar material de la escultura (Lambert / Phong / Standard)
- Texturas: cada cuadro con textura procedural diferente (ondas, gradiente, ruido)
- Proyección: switch Perspectiva ↔ Ortográfica
- Realismo: sombras de la escultura en el piso + transparencia en la escultura
- HUD: "Foco 1: ON", "Escultura: Phong", "Cámara: Perspectiva"

**Por qué elegirla:** Se ve profesional, elegante. El profe entiende al toque.

---

## 🐠 Idea 2 — Acuario 3D Nocturno

**Dificultad:** ★★★☆☆ (similar al visualizador de audio)

**Qué es:** Un acuario semitransparente con agua, peces (geometrías simples), burbujas subiendo, plantas acuáticas, fondo marino con textura procedural.

**Conceptos que muestra:**
- Objetos 3D: peces (dos conos unidos o esferas alargadas), burbujas (esferas), plantas (cilindros + esferas), el tanque (caja sin tapa)
- Iluminación: luz direccional desde arriba + luces de acento color submarino
- Materiales: cambiar material de los peces (Lambert / Phong / Standard — en Phong los peces brillan como escamas)
- Texturas: fondo marino procedural (arena/ondas)
- Proyección: switch Perspectiva ↔ Ortográfica
- Realismo: **transparencia del agua** (`opacity: 0.6`), **sombras en el fondo**, burbujas animadas
- HUD: "Peces: Phong", "Agua: Transparente", "Luz superior: ON"

**Por qué elegirla:** NADIE va a presentar un acuario. Efecto WOW asegurado. La transparencia del agua se ve natural.

---

## 🔬 Idea 3 — Laboratorio de Gráficos (Test Bench 3D)

**Dificultad:** ★★★☆☆ (similar al visualizador de audio)

**Qué es:** 4 objetos distintos (esfera, toro, cubo, cono) sobre un pedestal. Podés seleccionar cada objeto con clic y cambiarle el material, la textura, etc.

**Conceptos que muestra:**
- Objetos 3D: 4 primitivas distintas visibles al mismo tiempo
- Iluminación: 4 luces igual que el visualizador, con toggles
- Materiales: cada objeto puede tener material DISTINTO (Lambert / Phong / Standard) o todos juntos
- Texturas: cada objeto con textura procedural diferente (rayas, lunares, degradado, madera)
- Proyección: switch Perspectiva ↔ Ortográfica
- Realismo: sombras de los 4 objetos
- HUD: selector de objeto + "Objeto: Toro | Material: Phong"

**Por qué elegirla:** Es didáctica. El profe ve los 4 objetos y compara visualmente Lambert vs Phong al mismo tiempo. Suma puntos por mostrar que entendiste los conceptos.

---

## 🌆 Idea 4 — Ciudad Nocturna Minimalista (un poco más difícil)

**Dificultad:** ★★★★☆ (medio-alta)

**Qué es:** Una pequeña ciudad nocturna con edificios de diferentes alturas y estilos, farolas que iluminan, luces de ventanas, niebla y cielo estrellado. Todo generado proceduralmente (sin modelos externos).

**Conceptos que muestra:**
- Objetos 3D: entre 30 y 100 edificios con BoxGeometry escalada, farolas (cilindro + esfera), suelo tipo asfalto
- Iluminación: **farolas como SpotLight** + luz ambiental tenue + **luces de ventanas** como PointLight pequeñas
- Materiales: cambiar material de TODOS los edificios (Lambert / Phong / Standard)
- Texturas: textura procedural en el suelo (asfalto/césped) y en edificios (ventanas como patrón)
- Proyección: switch Perspectiva ↔ Ortográfica
- Realismo: **sombras de edificios**, **niebla** (FogExp2), **transparencia en ventanas**
- **Plus:** luces de ventanas que se encienden/apagan aleatoriamente o en patrón
- HUD: "Edificios: Phong | Farolas: ON | Ventanas: ON | Cámara: Perspectiva"

**Por qué es más difícil:**
- Muchos más objetos en escena (decenas de edificios)
- Farolas como SpotLight requieren orientación precisa
- Ventanas con emisive que parpadean
- Más lógica procedural (generar la ciudad con calles, cuadras, alturas variadas)

**Por qué elegirla:** Una ciudad nocturna es VISUALMENTE IMPACTANTE. El profe ve edificios iluminados, sombras largas, farolas, y automáticamente piensa "esto es 3D de verdad". Y todo es generado con código, no hay modelos. Da la sensación de un proyecto mucho más grande de lo que realmente es.

---

## Comparativa rápida

| Idea | Dificultad | Factor sorpresa | Código nuevo vs. tu base |
|------|-----------|----------------|-------------------------|
| 🏛️ Galería | ★★★ | Medio | Poco (cambias barras por sala) |
| 🐠 Acuario | ★★★ | **Alto** | Poco-moderado (animación peces) |
| 🔬 Laboratorio | ★★★ | Medio | Muy poco (misma lógica) |
| 🌆 Ciudad | ★★★★ | **Muy alto** | Moderado (generar ciudad procedural) |

---

**Mi recomendación personal:** si querés sorprender sin complicarte, **Acuario 3D**. Si querés algo más ambicioso que de verdad destaque, **Ciudad Nocturna**.
