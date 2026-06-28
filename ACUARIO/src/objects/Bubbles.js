import * as THREE from 'three';

/**
 * BURBUJAS DEL ACUARIO
 *
 * Esferas semitransparentes que suben desde el fondo
 * con velocidades y tamaños variables, simulando
 * un burbujeador natural.
 */

const NUM_BUBBLES = 40;
const BUBBLE_MIN_R = 0.04;
const BUBBLE_MAX_R = 0.12;
const TANK_H = 4.5;
const TANK_W = 8;
const TANK_D = 5;

/**
 * Crea un sistema de burbujas animadas.
 * @returns {{ group: THREE.Group, bubbles: Array }}
 */
export function createBubbles() {
    const group = new THREE.Group();
    const bubbles = [];

    // Material compartido (cada burbuja puede tener su propia opacidad)
    const baseMat = new THREE.MeshPhysicalMaterial({
        color: 0xbbddff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.0,
        metalness: 0.0,
        transmission: 0.6,
    });

    for (let i = 0; i < NUM_BUBBLES; i++) {
        const radius = BUBBLE_MIN_R + Math.random() * (BUBBLE_MAX_R - BUBBLE_MIN_R);
        const mat = baseMat.clone();
        mat.opacity = 0.2 + Math.random() * 0.3;

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 12, 12),
            mat
        );

        // Posición inicial aleatoria en el fondo del tanque
        mesh.position.set(
            (Math.random() - 0.5) * (TANK_W - 1),
            0.2 + Math.random() * 0.5,
            (Math.random() - 0.5) * (TANK_D - 1),
        );

        // Datos de animación
        const data = {
            mesh,
            speed: 0.4 + Math.random() * 0.8,
            wobbleAmp: 0.02 + Math.random() * 0.04,
            wobbleFreq: 1.0 + Math.random() * 2.0,
            phase: Math.random() * Math.PI * 2,
            maxY: TANK_H - 0.3,
            baseX: mesh.position.x,
            baseZ: mesh.position.z,
        };

        group.add(mesh);
        bubbles.push(data);
    }

    return { group, bubbles };
}

/**
 * Actualiza la animación de burbujas.
 */
export function updateBubbles(bubbles, time) {
    for (const b of bubbles) {
        // Subir
        b.mesh.position.y += b.speed * 0.008;

        // Oscilación lateral
        b.mesh.position.x = b.baseX + Math.sin(time * b.wobbleFreq + b.phase) * b.wobbleAmp;
        b.mesh.position.z = b.baseZ + Math.cos(time * b.wobbleFreq * 0.7 + b.phase) * b.wobbleAmp;

        // Escala que pulsa ligeramente
        const pulse = 1 + Math.sin(time * b.wobbleFreq * 1.5 + b.phase) * 0.08;
        b.mesh.scale.setScalar(pulse);

        // Reiniciar al llegar arriba
        if (b.mesh.position.y > b.maxY) {
            b.mesh.position.y = 0.1 + Math.random() * 0.3;
            b.mesh.position.x = (Math.random() - 0.5) * (TANK_W - 1);
            b.mesh.position.z = (Math.random() - 0.5) * (TANK_D - 1);
            b.baseX = b.mesh.position.x;
            b.baseZ = b.mesh.position.z;
        }
    }
}
