// Fuente ÚNICA de verdad para los 4 huecos del clasificador y sus piezas.
// Tanto Classifier.js como Pieces.js importan de acá.
// Si cambiás un tamaño de hueco, ajustalo SOLO en este archivo.

/** @type {Array<{
 *   label:       string,
 *   shape:       'circle'|'square'|'triangle'|'star',
 *   cx:          number,
 *   cy:          number,
 *   hole:        object,
 *   pieceType:   'sphere'|'box'|'triangle'|'star',
 *   pieceArgs:   number[],        // argumentos para el constructor de la geometría
 *   pieceColor:  number,
 *   piecePos:    {x:number, z:number},
 *   pieceY:      number,
 * }>} */
export const HOLE_CONFIGS = [
    {
        label: 'Esfera',
        shape: 'circle',
        cx: -1.1, cy: 1.1,
        hole: { r: 0.6 },
        pieceType: 'sphere',
        pieceArgs: [0.55, 32, 32],
        pieceColor: 0xff5566,
        piecePos: { x: 4.5, z: 0 },
        pieceY: 0.55,
    },
    {
        label: 'Cubo',
        shape: 'square',
        cx: 1.1, cy: 1.1,
        hole: { side: 1.0 },
        pieceType: 'box',
        pieceArgs: [0.9, 0.9, 0.9],
        pieceColor: 0x5588ff,
        piecePos: { x: 2.25, z: 3.9 },
        pieceY: 0.45,
    },
    {
        label: 'Triángulo',
        shape: 'triangle',
        cx: -1.1, cy: -1.1,
        hole: { r: 0.85 },
        pieceType: 'triangle',
        pieceArgs: [0.65, 0.9],
        pieceColor: 0x44dd88,
        piecePos: { x: -2.25, z: 3.9 },
        pieceY: 0.45,
    },
    {
        label: 'Estrella',
        shape: 'star',
        cx: 1.1, cy: -1.1,
        hole: { outerR: 0.55, innerR: 0.25, points: 4 },
        pieceType: 'star',
        pieceArgs: [0.5, 0.2, 0.6, 4],
        pieceColor: 0x44ddff,
        piecePos: { x: 2.25, z: -3.9 },
        pieceY: 0.3,
    },
];