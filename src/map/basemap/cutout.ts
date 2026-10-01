import earcut from "earcut";
import type { CustomLayerInterface, CustomRenderMethodInput } from "maplibre-gl";

import { HUNGARY_RING, type Ring, WORLD_RING } from "./outline";

export const CUTOUT_LAYER_ID = "cutout";

/** Mercator space: `a_pos` is in the 0..1 world square, the matrix MapLibre hands the layer takes it to the screen. */
const VERTEX_SHADER = `
attribute vec2 a_pos;
uniform mat4 u_matrix;
void main() {
    gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
}`;
/** Nothing: with ZERO/ZERO blending the covered pixels end up fully transparent, whatever was drawn before. */
const FRAGMENT_SHADER = `
void main() {
    gl_FragColor = vec4(0.0);
}`;

/** Web Mercator, the 0..1 square MapLibre's custom layers draw in: [0, 0] is the north-west corner of the world. */
export function mercator([lon, lat]: [number, number]): [number, number] {
    const x = (lon + 180) / 360;
    const y = (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360;
    return [x, y];
}

/** The world with the country cut out, triangulated in Mercator: x, y per vertex, three vertices per triangle. */
export function cutoutTriangles(outer: Ring = WORLD_RING, hole: Ring = HUNGARY_RING): Float32Array {
    const vertices: number[] = [];
    for (const point of outer) vertices.push(...mercator(point));
    const holeStart = vertices.length / 2;
    for (const point of hole) vertices.push(...mercator(point));
    const indices = earcut(vertices, [holeStart]);
    const triangles = new Float32Array(indices.length * 2);
    indices.forEach((index, n) => {
        triangles[n * 2] = vertices[index * 2] ?? 0;
        triangles[n * 2 + 1] = vertices[index * 2 + 1] ?? 0;
    });
    return triangles;
}

interface Resources {
    program: WebGLProgram;
    buffer: WebGLBuffer;
    position: number;
    matrix: WebGLUniformLocation | null;
    vertexCount: number;
}

/** A WebGL resource, or the context is lost. */
function required<T>(resource: T | null, what: string): T {
    if (resource === null) throw new Error(`Cutout: no ${what}`);
    return resource;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = required(gl.createShader(type), "shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`Cutout shader: ${gl.getShaderInfoLog(shader) ?? "failed to compile"}`);
    }
    return shader;
}

function link(gl: WebGL2RenderingContext): WebGLProgram {
    const program = required(gl.createProgram(), "program");
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Cutout program: ${gl.getProgramInfoLog(program) ?? "failed to link"}`);
    }
    return program;
}

/**
 * A MapLibre custom layer that erases everything beyond the country's border: it draws the world-minus-Hungary
 * triangles with ZERO/ZERO blending, which sets the covered pixels to transparent black, so the tiles' roads and
 * water beyond the border vanish and the sky behind the canvas (map/Sky.tsx) shows through. Placed above the roads
 * and below the border and the names (map/Basemap.tsx). MapLibre resets its own GL state after a custom layer.
 */
export function cutoutLayer(): CustomLayerInterface {
    let resources: Resources | null = null;
    return {
        id: CUTOUT_LAYER_ID,
        type: "custom",
        renderingMode: "2d",
        onAdd(_map, gl) {
            const program = link(gl);
            const buffer = required(gl.createBuffer(), "buffer");
            const triangles = cutoutTriangles();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
            resources = {
                program,
                buffer,
                position: gl.getAttribLocation(program, "a_pos"),
                matrix: gl.getUniformLocation(program, "u_matrix"),
                vertexCount: triangles.length / 2,
            };
        },
        onRemove(_map, gl) {
            if (!resources) return;
            gl.deleteBuffer(resources.buffer);
            gl.deleteProgram(resources.program);
            resources = null;
        },
        render(gl, { defaultProjectionData }: CustomRenderMethodInput) {
            if (!resources) return;
            gl.useProgram(resources.program);
            gl.uniformMatrix4fv(resources.matrix, false, defaultProjectionData.mainMatrix);
            gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
            gl.enableVertexAttribArray(resources.position);
            gl.vertexAttribPointer(resources.position, 2, gl.FLOAT, false, 0, 0);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.STENCIL_TEST);
            gl.disable(gl.CULL_FACE);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ZERO, gl.ZERO);
            gl.drawArrays(gl.TRIANGLES, 0, resources.vertexCount);
        },
    };
}
