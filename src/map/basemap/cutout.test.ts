import type { CustomRenderMethodInput, Map as MapLibreMap } from "maplibre-gl";

import { fakeWebGL } from "@/test/mocks/webgl";

import { CUTOUT_LAYER_ID, cutoutLayer, cutoutTriangles, mercator } from "./cutout";
import { HUNGARY_RING, WORLD_RING } from "./outline";

const BUDAPEST: [number, number] = [19.04, 47.5];
const SZEGED: [number, number] = [20.15, 46.25];
const VIENNA: [number, number] = [16.37, 48.21];
const PARIS: [number, number] = [2.35, 48.86];

/** Whether the point lies in any of the triangles (x, y per vertex, three vertices each). */
function covered(triangles: Float32Array, [px, py]: [number, number]): boolean {
    const sign = (ax: number, ay: number, bx: number, by: number) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    for (let i = 0; i + 5 < triangles.length; i += 6) {
        const [ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0] = triangles.subarray(i, i + 6);
        const d1 = sign(ax, ay, bx, by);
        const d2 = sign(bx, by, cx, cy);
        const d3 = sign(cx, cy, ax, ay);
        const negative = d1 < 0 || d2 < 0 || d3 < 0;
        const positive = d1 > 0 || d2 > 0 || d3 > 0;
        if (!(negative && positive)) return true;
    }
    return false;
}

describe("mercator", () => {
    it("maps the world to the unit square, north-west first", () => {
        expect(mercator([-180, 85.0511])).toEqual([expect.closeTo(0, 4), expect.closeTo(0, 4)]);
        expect(mercator([180, -85.0511])).toEqual([expect.closeTo(1, 4), expect.closeTo(1, 4)]);
        expect(mercator([0, 0])).toEqual([0.5, 0.5]);
        const [x, y] = mercator(BUDAPEST);
        expect(x).toBeCloseTo(0.5529, 3);
        expect(y).toBeCloseTo(0.3497, 3);
    });
});

describe("cutoutTriangles", () => {
    const triangles = cutoutTriangles();

    it("triangulates the world with the country cut out, inside the unit square", () => {
        expect(triangles.length % 6).toBe(0);
        expect(triangles.length / 6).toBeGreaterThan(HUNGARY_RING.length);
        for (const value of triangles) {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1);
        }
    });

    it("covers the neighbours and the far world, not the country", () => {
        expect(covered(triangles, mercator(VIENNA))).toBe(true);
        expect(covered(triangles, mercator(PARIS))).toBe(true);
        expect(covered(triangles, mercator(BUDAPEST))).toBe(false);
        expect(covered(triangles, mercator(SZEGED))).toBe(false);
    });

    it("takes any outer ring and hole", () => {
        const square: [number, number][] = [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
        ];
        const hole: [number, number][] = [
            [4, 4],
            [6, 4],
            [6, 6],
            [4, 6],
            [4, 4],
        ];
        const ring = cutoutTriangles(square, hole);
        expect(covered(ring, mercator([1, 1]))).toBe(true);
        expect(covered(ring, mercator([5, 5]))).toBe(false);
        expect(cutoutTriangles(WORLD_RING, HUNGARY_RING)).toEqual(triangles);
    });
});

describe("cutoutLayer", () => {
    const map = {} as MapLibreMap;
    const matrix = new Float32Array(16).fill(0.5);
    const frame = { defaultProjectionData: { mainMatrix: matrix } } as unknown as CustomRenderMethodInput;

    it("is a flat custom layer", () => {
        expect(cutoutLayer()).toMatchObject({ id: CUTOUT_LAYER_ID, type: "custom", renderingMode: "2d" });
    });

    it("compiles its shaders and uploads the triangles when added", () => {
        const gl = fakeWebGL();
        cutoutLayer().onAdd?.(map, gl);
        expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
        expect(gl.createShader).toHaveBeenCalledWith(gl.FRAGMENT_SHADER);
        const sources = gl.shaderSource.mock.calls.map(([, source]) => source as string);
        expect(sources.some((source) => source.includes("u_matrix * vec4(a_pos, 0.0, 1.0)"))).toBe(true);
        expect(sources.some((source) => source.includes("gl_FragColor = vec4(0.0)"))).toBe(true);
        expect(gl.linkProgram).toHaveBeenCalledTimes(1);
        expect(gl.deleteShader).toHaveBeenCalledTimes(2);
        expect(gl.bufferData).toHaveBeenCalledWith(gl.ARRAY_BUFFER, cutoutTriangles(), gl.STATIC_DRAW);
        expect(gl.getAttribLocation).toHaveBeenCalledWith(expect.anything(), "a_pos");
        expect(gl.getUniformLocation).toHaveBeenCalledWith(expect.anything(), "u_matrix");
    });

    it("erases its triangles with zero blending under MapLibre's matrix on every frame", () => {
        const gl = fakeWebGL();
        const layer = cutoutLayer();
        layer.render(gl, frame);
        expect(gl.drawArrays).not.toHaveBeenCalled();
        layer.onAdd?.(map, gl);
        layer.render(gl, frame);
        expect(gl.useProgram).toHaveBeenCalledWith(gl.createProgram.mock.results[0]?.value);
        expect(gl.uniformMatrix4fv).toHaveBeenCalledWith(gl.getUniformLocation.mock.results[0]?.value, false, matrix);
        expect(gl.vertexAttribPointer).toHaveBeenCalledWith(3, 2, gl.FLOAT, false, 0, 0);
        expect(gl.enableVertexAttribArray).toHaveBeenCalledWith(3);
        expect(gl.disable).toHaveBeenCalledWith(gl.DEPTH_TEST);
        expect(gl.disable).toHaveBeenCalledWith(gl.STENCIL_TEST);
        expect(gl.disable).toHaveBeenCalledWith(gl.CULL_FACE);
        expect(gl.enable).toHaveBeenCalledWith(gl.BLEND);
        expect(gl.blendFunc).toHaveBeenCalledWith(gl.ZERO, gl.ZERO);
        expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLES, 0, cutoutTriangles().length / 2);
    });

    it("frees the program and the buffer when removed, and draws nothing afterwards", () => {
        const gl = fakeWebGL();
        const layer = cutoutLayer();
        layer.onRemove?.(map, gl);
        expect(gl.deleteBuffer).not.toHaveBeenCalled();
        layer.onAdd?.(map, gl);
        layer.onRemove?.(map, gl);
        expect(gl.deleteBuffer).toHaveBeenCalledWith(gl.createBuffer.mock.results[0]?.value);
        expect(gl.deleteProgram).toHaveBeenCalledWith(gl.createProgram.mock.results[0]?.value);
        layer.render(gl, frame);
        expect(gl.drawArrays).not.toHaveBeenCalled();
    });

    it("reports a shader or program that does not build", () => {
        const failedShader = fakeWebGL();
        failedShader.getShaderParameter.mockReturnValue(false);
        expect(() => cutoutLayer().onAdd?.(map, failedShader)).toThrow("Cutout shader: bad shader");
        const failedLink = fakeWebGL();
        failedLink.getProgramParameter.mockReturnValue(false);
        failedLink.getProgramInfoLog.mockReturnValue(null);
        expect(() => cutoutLayer().onAdd?.(map, failedLink)).toThrow("Cutout program: failed to link");
        const lost = fakeWebGL();
        lost.createProgram.mockReturnValue(null);
        expect(() => cutoutLayer().onAdd?.(map, lost)).toThrow("Cutout: no program");
    });
});
