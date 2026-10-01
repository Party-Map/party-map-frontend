import { vi } from "vitest";

/**
 * A WebGL2 context made of spies: enough for a MapLibre custom layer to compile its shaders, upload a buffer and
 * draw, with the constants the layer reads. Nothing is rendered; tests inspect the calls.
 */
export function fakeWebGL() {
    const gl = {
        VERTEX_SHADER: 0x8b31,
        FRAGMENT_SHADER: 0x8b30,
        COMPILE_STATUS: 0x8b81,
        LINK_STATUS: 0x8b82,
        ARRAY_BUFFER: 0x8892,
        STATIC_DRAW: 0x88e4,
        FLOAT: 0x1406,
        TRIANGLES: 0x0004,
        BLEND: 0x0be2,
        DEPTH_TEST: 0x0b71,
        STENCIL_TEST: 0x0b90,
        CULL_FACE: 0x0b44,
        ZERO: 0,
        createShader: vi.fn((): WebGLShader | null => ({})),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn((): boolean => true),
        getShaderInfoLog: vi.fn((): string | null => "bad shader"),
        deleteShader: vi.fn(),
        createProgram: vi.fn((): WebGLProgram | null => ({})),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn((): boolean => true),
        getProgramInfoLog: vi.fn((): string | null => "bad program"),
        deleteProgram: vi.fn(),
        getAttribLocation: vi.fn(() => 3),
        getUniformLocation: vi.fn((): WebGLUniformLocation | null => ({})),
        createBuffer: vi.fn((): WebGLBuffer | null => ({})),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        deleteBuffer: vi.fn(),
        useProgram: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        uniformMatrix4fv: vi.fn(),
        enable: vi.fn(),
        disable: vi.fn(),
        blendFunc: vi.fn(),
        drawArrays: vi.fn(),
    };
    return gl as typeof gl & WebGL2RenderingContext;
}
