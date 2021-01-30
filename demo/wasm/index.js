(function () {
    'use strict';

    let wasm;

    const heap = new Array(32).fill(undefined);

    heap.push(undefined, null, true, false);

    function getObject(idx) { return heap[idx]; }

    let heap_next = heap.length;

    function dropObject(idx) {
        if (idx < 36) return;
        heap[idx] = heap_next;
        heap_next = idx;
    }

    function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
    }

    function addHeapObject(obj) {
        if (heap_next === heap.length) heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];

        heap[idx] = obj;
        return idx;
    }

    let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

    cachedTextDecoder.decode();

    let cachegetUint8Memory0 = null;
    function getUint8Memory0() {
        if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
            cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachegetUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }

    function isLikeNone(x) {
        return x === undefined || x === null;
    }

    let cachegetFloat64Memory0 = null;
    function getFloat64Memory0() {
        if (cachegetFloat64Memory0 === null || cachegetFloat64Memory0.buffer !== wasm.memory.buffer) {
            cachegetFloat64Memory0 = new Float64Array(wasm.memory.buffer);
        }
        return cachegetFloat64Memory0;
    }

    let cachegetInt32Memory0 = null;
    function getInt32Memory0() {
        if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
            cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachegetInt32Memory0;
    }

    let WASM_VECTOR_LEN = 0;

    let cachedTextEncoder = new TextEncoder('utf-8');

    const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
        ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
        : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

    function passStringToWasm0(arg, malloc, realloc) {

        if (realloc === undefined) {
            const buf = cachedTextEncoder.encode(arg);
            const ptr = malloc(buf.length);
            getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
            WASM_VECTOR_LEN = buf.length;
            return ptr;
        }

        let len = arg.length;
        let ptr = malloc(len);

        const mem = getUint8Memory0();

        let offset = 0;

        for (; offset < len; offset++) {
            const code = arg.charCodeAt(offset);
            if (code > 0x7F) break;
            mem[ptr + offset] = code;
        }

        if (offset !== len) {
            if (offset !== 0) {
                arg = arg.slice(offset);
            }
            ptr = realloc(ptr, len, len = offset + arg.length * 3);
            const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
            const ret = encodeString(arg, view);

            offset += ret.written;
        }

        WASM_VECTOR_LEN = offset;
        return ptr;
    }

    function debugString(val) {
        // primitive types
        const type = typeof val;
        if (type == 'number' || type == 'boolean' || val == null) {
            return  `${val}`;
        }
        if (type == 'string') {
            return `"${val}"`;
        }
        if (type == 'symbol') {
            const description = val.description;
            if (description == null) {
                return 'Symbol';
            } else {
                return `Symbol(${description})`;
            }
        }
        if (type == 'function') {
            const name = val.name;
            if (typeof name == 'string' && name.length > 0) {
                return `Function(${name})`;
            } else {
                return 'Function';
            }
        }
        // objects
        if (Array.isArray(val)) {
            const length = val.length;
            let debug = '[';
            if (length > 0) {
                debug += debugString(val[0]);
            }
            for(let i = 1; i < length; i++) {
                debug += ', ' + debugString(val[i]);
            }
            debug += ']';
            return debug;
        }
        // Test for built-in
        const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
        let className;
        if (builtInMatches.length > 1) {
            className = builtInMatches[1];
        } else {
            // Failed to match the standard '[object ClassName]'
            return toString.call(val);
        }
        if (className == 'Object') {
            // we're a user defined class or Object
            // JSON.stringify avoids problems with cycles, and is generally much
            // easier than looping through ownProperties of `val`.
            try {
                return 'Object(' + JSON.stringify(val) + ')';
            } catch (_) {
                return 'Object';
            }
        }
        // errors
        if (val instanceof Error) {
            return `${val.name}: ${val.message}\n${val.stack}`;
        }
        // TODO we could test for more things here, like `Set`s and `Map`s.
        return className;
    }

    function makeMutClosure(arg0, arg1, dtor, f) {
        const state = { a: arg0, b: arg1, cnt: 1, dtor };
        const real = (...args) => {
            // First up with a closure we increment the internal reference
            // count. This ensures that the Rust closure environment won't
            // be deallocated while we're invoking it.
            state.cnt++;
            const a = state.a;
            state.a = 0;
            try {
                return f(a, state.b, ...args);
            } finally {
                if (--state.cnt === 0) {
                    wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

                } else {
                    state.a = a;
                }
            }
        };
        real.original = state;

        return real;
    }
    function __wbg_adapter_24(arg0, arg1, arg2) {
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h07e86c50a5e21f74(arg0, arg1, arg2);
    }

    let stack_pointer = 32;

    function addBorrowedObject(obj) {
        if (stack_pointer == 1) throw new Error('out of js stack');
        heap[--stack_pointer] = obj;
        return stack_pointer;
    }
    function __wbg_adapter_27(arg0, arg1, arg2) {
        try {
            wasm._dyn_core__ops__function__FnMut___A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h5d6df967491cd690(arg0, arg1, addBorrowedObject(arg2));
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }

    function __wbg_adapter_30(arg0, arg1, arg2) {
        wasm.wasm_bindgen__convert__closures__invoke1_mut__h4f8359c27f886dff(arg0, arg1, addHeapObject(arg2));
    }

    function __wbg_adapter_33(arg0, arg1) {
        wasm.wasm_bindgen__convert__closures__invoke0_mut__hba1bdfa0c3cb3a95(arg0, arg1);
    }

    function __wbg_adapter_36(arg0, arg1, arg2) {
        wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hb3f78e94c41dbab4(arg0, arg1, addHeapObject(arg2));
    }

    function handleError(f) {
        return function () {
            try {
                return f.apply(this, arguments);

            } catch (e) {
                wasm.__wbindgen_exn_store(addHeapObject(e));
            }
        };
    }

    let cachegetFloat32Memory0 = null;
    function getFloat32Memory0() {
        if (cachegetFloat32Memory0 === null || cachegetFloat32Memory0.buffer !== wasm.memory.buffer) {
            cachegetFloat32Memory0 = new Float32Array(wasm.memory.buffer);
        }
        return cachegetFloat32Memory0;
    }

    function getArrayF32FromWasm0(ptr, len) {
        return getFloat32Memory0().subarray(ptr / 4, ptr / 4 + len);
    }

    function getArrayU8FromWasm0(ptr, len) {
        return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
    }

    async function load(module, imports) {
        if (typeof Response === 'function' && module instanceof Response) {

            if (typeof WebAssembly.instantiateStreaming === 'function') {
                try {
                    return await WebAssembly.instantiateStreaming(module, imports);

                } catch (e) {
                    if (module.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                    } else {
                        throw e;
                    }
                }
            }

            const bytes = await module.arrayBuffer();
            return await WebAssembly.instantiate(bytes, imports);

        } else {

            const instance = await WebAssembly.instantiate(module, imports);

            if (instance instanceof WebAssembly.Instance) {
                return { instance, module };

            } else {
                return instance;
            }
        }
    }

    async function init(input) {
        if (typeof input === 'undefined') {
            input = (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href).replace(/\.js$/, '_bg.wasm');
        }
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
            takeObject(arg0);
        };
        imports.wbg.__wbindgen_cb_drop = function(arg0) {
            const obj = takeObject(arg0).original;
            if (obj.cnt-- == 1) {
                obj.a = 0;
                return true;
            }
            var ret = false;
            return ret;
        };
        imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
            var ret = getObject(arg0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
            var ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_undefined = function(arg0) {
            var ret = getObject(arg0) === undefined;
            return ret;
        };
        imports.wbg.__wbg_new_68adb0d58759a4ed = function() {
            var ret = new Object();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_2e79e744454afade = function(arg0, arg1, arg2) {
            getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
        };
        imports.wbg.__wbg_instanceof_Window_fbe0320f34c4cd31 = function(arg0) {
            var ret = getObject(arg0) instanceof Window;
            return ret;
        };
        imports.wbg.__wbg_document_2b44f2a86e03665a = function(arg0) {
            var ret = getObject(arg0).document;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_location_df2a42f020b6b0fe = function(arg0) {
            var ret = getObject(arg0).location;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_innerWidth_c4fa0fec0fd477b8 = handleError(function(arg0) {
            var ret = getObject(arg0).innerWidth;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_innerHeight_6344b1c89c013158 = handleError(function(arg0) {
            var ret = getObject(arg0).innerHeight;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_performance_eee010e5e49f08df = function(arg0) {
            var ret = getObject(arg0).performance;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_requestAnimationFrame_65ebf8f2415064e2 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).requestAnimationFrame(getObject(arg1));
            return ret;
        });
        imports.wbg.__wbg_fetch_99437343e599cf5a = function(arg0, arg1) {
            var ret = getObject(arg0).fetch(getObject(arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_width_c35d2490b8ca8df0 = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_957d2a3ab7ffcdf6 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_origin_4a468d07705cfed2 = handleError(function(arg0, arg1) {
            var ret = getObject(arg1).origin;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        });
        imports.wbg.__wbg_instanceof_Response_692fcbbfbfd64a77 = function(arg0) {
            var ret = getObject(arg0) instanceof Response;
            return ret;
        };
        imports.wbg.__wbg_text_09509938f837f5fc = handleError(function(arg0) {
            var ret = getObject(arg0).text();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_origin_16cfd8c80499523b = function(arg0, arg1) {
            var ret = getObject(arg1).origin;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_new_cf154bb78c9f6354 = handleError(function(arg0, arg1) {
            var ret = new URL(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_now_5ae3d18d57dd226f = function(arg0) {
            var ret = getObject(arg0).now();
            return ret;
        };
        imports.wbg.__wbg_drawArraysInstancedANGLE_49cfc530a6157e39 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
        };
        imports.wbg.__wbg_vertexAttribDivisorANGLE_4305eea92b3b14c4 = function(arg0, arg1, arg2) {
            getObject(arg0).vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
        };
        imports.wbg.__wbg_addEventListener_e8fdfac380f9ea25 = handleError(function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
        });
        imports.wbg.__wbg_instanceof_HtmlCanvasElement_bd2459c62d076bcd = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLCanvasElement;
            return ret;
        };
        imports.wbg.__wbg_width_8225e9e48185d280 = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_setwidth_80b60efe20240a3e = function(arg0, arg1) {
            getObject(arg0).width = arg1 >>> 0;
        };
        imports.wbg.__wbg_height_c55678b905b560e1 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_setheight_5c308278bb4139ed = function(arg0, arg1) {
            getObject(arg0).height = arg1 >>> 0;
        };
        imports.wbg.__wbg_getContext_7f0328be9fe8c1ec = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        });
        imports.wbg.__wbg_getContext_11f724663952b3c1 = handleError(function(arg0, arg1, arg2, arg3) {
            var ret = getObject(arg0).getContext(getStringFromWasm0(arg1, arg2), getObject(arg3));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        });
        imports.wbg.__wbg_width_301f3e7abf9f2305 = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_50486d6ba0bce999 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_newwithstr_ff21a7d112600cb1 = handleError(function(arg0, arg1) {
            var ret = new Request(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_size_4cb137335f05d7a8 = function(arg0) {
            var ret = getObject(arg0).size;
            return ret;
        };
        imports.wbg.__wbg_type_1239cde25586fcab = function(arg0) {
            var ret = getObject(arg0).type;
            return ret;
        };
        imports.wbg.__wbg_name_ad1ecd078b0a7b97 = function(arg0, arg1) {
            var ret = getObject(arg1).name;
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_body_08ba7a3043ff8e77 = function(arg0) {
            var ret = getObject(arg0).body;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createElement_7cbe07ad3289abea = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).createElement(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_instanceof_WebGlRenderingContext_5f4db52925ef5603 = function(arg0) {
            var ret = getObject(arg0) instanceof WebGLRenderingContext;
            return ret;
        };
        imports.wbg.__wbg_canvas_ec867bf11fa8b513 = function(arg0) {
            var ret = getObject(arg0).canvas;
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_drawingBufferWidth_51e376364ab971e8 = function(arg0) {
            var ret = getObject(arg0).drawingBufferWidth;
            return ret;
        };
        imports.wbg.__wbg_drawingBufferHeight_175f02c35a99ff7e = function(arg0) {
            var ret = getObject(arg0).drawingBufferHeight;
            return ret;
        };
        imports.wbg.__wbg_bufferData_283c9170f3c599d2 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).bufferData(arg1 >>> 0, getObject(arg2), arg3 >>> 0);
        };
        imports.wbg.__wbg_texImage2D_d7b327f14a7a8478 = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getObject(arg9));
        });
        imports.wbg.__wbg_texImage2D_5f7ef8739bfaadc7 = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_c44f7fd41a3c5934 = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_0816311bcfcef11b = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_a2dc35f51f93ccf2 = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_texImage2D_fd0df35ba60ffb92 = handleError(function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, getObject(arg6));
        });
        imports.wbg.__wbg_uniform1fv_601f90dfb7d4ea16 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform1fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniform2fv_e9990d07935b491f = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform2fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniform3fv_55648569ea84161e = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform3fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniform4fv_cee0ce0735f7a457 = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform4fv(getObject(arg1), getArrayF32FromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_uniformMatrix2fv_c2b99485bb3aa364 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniformMatrix2fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_uniformMatrix3fv_1ba701db531a821d = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniformMatrix3fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_uniformMatrix4fv_f0d65bec707c0283 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniformMatrix4fv(getObject(arg1), arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_activeTexture_cfc15ec752ffb9c4 = function(arg0, arg1) {
            getObject(arg0).activeTexture(arg1 >>> 0);
        };
        imports.wbg.__wbg_attachShader_b10f3a6e94e2e190 = function(arg0, arg1, arg2) {
            getObject(arg0).attachShader(getObject(arg1), getObject(arg2));
        };
        imports.wbg.__wbg_bindAttribLocation_cf003aad4fcdc520 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).bindAttribLocation(getObject(arg1), arg2 >>> 0, getStringFromWasm0(arg3, arg4));
        };
        imports.wbg.__wbg_bindBuffer_cdca8a246dc033e5 = function(arg0, arg1, arg2) {
            getObject(arg0).bindBuffer(arg1 >>> 0, getObject(arg2));
        };
        imports.wbg.__wbg_bindTexture_36a5955154ca7269 = function(arg0, arg1, arg2) {
            getObject(arg0).bindTexture(arg1 >>> 0, getObject(arg2));
        };
        imports.wbg.__wbg_blendFunc_b45bbe6bc5e17dd6 = function(arg0, arg1, arg2) {
            getObject(arg0).blendFunc(arg1 >>> 0, arg2 >>> 0);
        };
        imports.wbg.__wbg_clear_c7bb0cc46853ad89 = function(arg0, arg1) {
            getObject(arg0).clear(arg1 >>> 0);
        };
        imports.wbg.__wbg_clearColor_8b13b519ef2dd2d7 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).clearColor(arg1, arg2, arg3, arg4);
        };
        imports.wbg.__wbg_compileShader_406e03b35834cb67 = function(arg0, arg1) {
            getObject(arg0).compileShader(getObject(arg1));
        };
        imports.wbg.__wbg_createBuffer_bad9101b9d0e33e7 = function(arg0) {
            var ret = getObject(arg0).createBuffer();
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createProgram_19eb97f37bc7d978 = function(arg0) {
            var ret = getObject(arg0).createProgram();
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createShader_16e76257819c682b = function(arg0, arg1) {
            var ret = getObject(arg0).createShader(arg1 >>> 0);
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_createTexture_3008adb3eb4b8e63 = function(arg0) {
            var ret = getObject(arg0).createTexture();
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_deleteProgram_4954a8bcd2e3c6b9 = function(arg0, arg1) {
            getObject(arg0).deleteProgram(getObject(arg1));
        };
        imports.wbg.__wbg_deleteShader_913f6c4e5843248d = function(arg0, arg1) {
            getObject(arg0).deleteShader(getObject(arg1));
        };
        imports.wbg.__wbg_detachShader_6a0744139188a37c = function(arg0, arg1, arg2) {
            getObject(arg0).detachShader(getObject(arg1), getObject(arg2));
        };
        imports.wbg.__wbg_disable_b943997108c3320a = function(arg0, arg1) {
            getObject(arg0).disable(arg1 >>> 0);
        };
        imports.wbg.__wbg_enable_98a346f4f5f740b7 = function(arg0, arg1) {
            getObject(arg0).enable(arg1 >>> 0);
        };
        imports.wbg.__wbg_enableVertexAttribArray_c7db971134fe1d3c = function(arg0, arg1) {
            getObject(arg0).enableVertexAttribArray(arg1 >>> 0);
        };
        imports.wbg.__wbg_generateMipmap_ff0cba00f6b3d1fa = function(arg0, arg1) {
            getObject(arg0).generateMipmap(arg1 >>> 0);
        };
        imports.wbg.__wbg_getActiveAttrib_371fa8af896d3d30 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getActiveAttrib(getObject(arg1), arg2 >>> 0);
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_getActiveUniform_766f07278ee8b501 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getActiveUniform(getObject(arg1), arg2 >>> 0);
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_getAttribLocation_8ce6818f0f36aca9 = function(arg0, arg1, arg2, arg3) {
            var ret = getObject(arg0).getAttribLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
            return ret;
        };
        imports.wbg.__wbg_getExtension_3ce292edc1f35484 = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getExtension(getStringFromWasm0(arg1, arg2));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        });
        imports.wbg.__wbg_getParameter_ba4e157c6bc7d12d = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).getParameter(arg1 >>> 0);
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_getProgramInfoLog_efa3ee9c01a6c5d6 = function(arg0, arg1, arg2) {
            var ret = getObject(arg1).getProgramInfoLog(getObject(arg2));
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_getProgramParameter_f1068d691eca8e1f = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getProgramParameter(getObject(arg1), arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_getShaderInfoLog_c942a4f3fa1537cf = function(arg0, arg1, arg2) {
            var ret = getObject(arg1).getShaderInfoLog(getObject(arg2));
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbg_getShaderParameter_f330a1f677514bd0 = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).getShaderParameter(getObject(arg1), arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_getUniformLocation_e97e7d6bc3036b6d = function(arg0, arg1, arg2, arg3) {
            var ret = getObject(arg0).getUniformLocation(getObject(arg1), getStringFromWasm0(arg2, arg3));
            return isLikeNone(ret) ? 0 : addHeapObject(ret);
        };
        imports.wbg.__wbg_linkProgram_dc8c83ec66322d5e = function(arg0, arg1) {
            getObject(arg0).linkProgram(getObject(arg1));
        };
        imports.wbg.__wbg_pixelStorei_fca9dd56da4e09ed = function(arg0, arg1, arg2) {
            getObject(arg0).pixelStorei(arg1 >>> 0, arg2);
        };
        imports.wbg.__wbg_shaderSource_d8cce8917aa7df4a = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).shaderSource(getObject(arg1), getStringFromWasm0(arg2, arg3));
        };
        imports.wbg.__wbg_texParameteri_d05bbe24288d7efb = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
        };
        imports.wbg.__wbg_uniform1f_26a1f89de22ef689 = function(arg0, arg1, arg2) {
            getObject(arg0).uniform1f(getObject(arg1), arg2);
        };
        imports.wbg.__wbg_uniform1i_7b9b67ffae83a0d7 = function(arg0, arg1, arg2) {
            getObject(arg0).uniform1i(getObject(arg1), arg2);
        };
        imports.wbg.__wbg_uniform2f_fe51130cfa399aba = function(arg0, arg1, arg2, arg3) {
            getObject(arg0).uniform2f(getObject(arg1), arg2, arg3);
        };
        imports.wbg.__wbg_uniform3f_2bbbd256f7abf614 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).uniform3f(getObject(arg1), arg2, arg3, arg4);
        };
        imports.wbg.__wbg_uniform4f_fb71ebfc0c7f37e4 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
            getObject(arg0).uniform4f(getObject(arg1), arg2, arg3, arg4, arg5);
        };
        imports.wbg.__wbg_useProgram_5a83ef734fbc034b = function(arg0, arg1) {
            getObject(arg0).useProgram(getObject(arg1));
        };
        imports.wbg.__wbg_vertexAttribPointer_6026e45079e9750a = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
            getObject(arg0).vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
        };
        imports.wbg.__wbg_viewport_d6e0a7f81b3499c9 = function(arg0, arg1, arg2, arg3, arg4) {
            getObject(arg0).viewport(arg1, arg2, arg3, arg4);
        };
        imports.wbg.__wbg_setclassName_891973fd19edac41 = function(arg0, arg1, arg2) {
            getObject(arg0).className = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_instanceof_HtmlElement_ca5564c35b091ac9 = function(arg0) {
            var ret = getObject(arg0) instanceof HTMLElement;
            return ret;
        };
        imports.wbg.__wbg_setonload_2288267f14fd8110 = function(arg0, arg1) {
            getObject(arg0).onload = getObject(arg1);
        };
        imports.wbg.__wbg_setonerror_138979e04b86210f = function(arg0, arg1) {
            getObject(arg0).onerror = getObject(arg1);
        };
        imports.wbg.__wbg_new_4b0ad8ab891f26de = handleError(function(arg0, arg1) {
            var ret = new Event(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_setsrc_43904731d885a248 = function(arg0, arg1, arg2) {
            getObject(arg0).src = getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_setcrossOrigin_c71214d15b663eaf = function(arg0, arg1, arg2) {
            getObject(arg0).crossOrigin = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_width_e2288c6b7927b379 = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_3478f03a55caa6c1 = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_new_72aa46ede1a52e07 = handleError(function() {
            var ret = new Image();
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_width_ab989c9055e254ff = function(arg0) {
            var ret = getObject(arg0).width;
            return ret;
        };
        imports.wbg.__wbg_height_b2698cb9a13c936e = function(arg0) {
            var ret = getObject(arg0).height;
            return ret;
        };
        imports.wbg.__wbg_settextContent_1c74a88a26c29897 = function(arg0, arg1, arg2) {
            getObject(arg0).textContent = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
        };
        imports.wbg.__wbg_appendChild_98dedaeac24501f2 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).appendChild(getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_removeChild_51369e223cb8a779 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).removeChild(getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_getRandomValues_57e4008f45f0e105 = handleError(function(arg0, arg1) {
            getObject(arg0).getRandomValues(getObject(arg1));
        });
        imports.wbg.__wbg_randomFillSync_d90848a552cbd666 = handleError(function(arg0, arg1, arg2) {
            getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
        });
        imports.wbg.__wbg_self_f865985e662246aa = handleError(function() {
            var ret = self.self;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_static_accessor_MODULE_39947eb3fe77895f = function() {
            var ret = module;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_require_c59851dfa0dc7e78 = handleError(function(arg0, arg1, arg2) {
            var ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_crypto_bfb05100db79193b = function(arg0) {
            var ret = getObject(arg0).crypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_msCrypto_f6dddc6ae048b7e2 = function(arg0) {
            var ret = getObject(arg0).msCrypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_get_4bab9404e99a1f85 = handleError(function(arg0, arg1) {
            var ret = Reflect.get(getObject(arg0), getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_call_ab183a630df3a257 = handleError(function(arg0, arg1) {
            var ret = getObject(arg0).call(getObject(arg1));
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_newnoargs_ab5e899738c0eff4 = function(arg0, arg1) {
            var ret = new Function(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_dc5b27cfd2149b8f = function() {
            var ret = new Object();
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_resolve_9b0f9ddf5f89cb1e = function(arg0) {
            var ret = Promise.resolve(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_then_b4358f6ec1ee6657 = function(arg0, arg1) {
            var ret = getObject(arg0).then(getObject(arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_then_3d9a54b0affdf26d = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_self_77eca7b42660e1bb = handleError(function() {
            var ret = self.self;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_window_51dac01569f1ba70 = handleError(function() {
            var ret = window.window;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_globalThis_34bac2d08ebb9b58 = handleError(function() {
            var ret = globalThis.globalThis;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_global_1c436164a66c9c22 = handleError(function() {
            var ret = global.global;
            return addHeapObject(ret);
        });
        imports.wbg.__wbg_buffer_bc64154385c04ac4 = function(arg0) {
            var ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_length_e9f6f145de2fede5 = function(arg0) {
            var ret = getObject(arg0).length;
            return ret;
        };
        imports.wbg.__wbg_new_22a33711cf65b661 = function(arg0) {
            var ret = new Uint8Array(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_b29de3f25280c6ec = function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        };
        imports.wbg.__wbg_newwithbyteoffsetandlength_193d0d8755287921 = function(arg0, arg1, arg2) {
            var ret = new Float32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_length_380570c7c1ab8f8a = function(arg0) {
            var ret = getObject(arg0).length;
            return ret;
        };
        imports.wbg.__wbg_new_48c5d6d65ec9a035 = function(arg0) {
            var ret = new Float32Array(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_7e9ee185791c423d = function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        };
        imports.wbg.__wbg_newwithlength_48451d71403bfede = function(arg0) {
            var ret = new Uint8Array(arg0 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_subarray_6b2dd31c84ee881f = function(arg0, arg1, arg2) {
            var ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_3afd31f38e771338 = handleError(function(arg0, arg1, arg2) {
            var ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
            return ret;
        });
        imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
            const obj = getObject(arg1);
            var ret = typeof(obj) === 'number' ? obj : undefined;
            getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
            getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
        };
        imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
            const obj = getObject(arg1);
            var ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr0 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_boolean_get = function(arg0) {
            const v = getObject(arg0);
            var ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
            return ret;
        };
        imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
            var ret = debugString(getObject(arg1));
            var ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            getInt32Memory0()[arg0 / 4 + 1] = len0;
            getInt32Memory0()[arg0 / 4 + 0] = ptr0;
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbindgen_memory = function() {
            var ret = wasm.memory;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper173 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 4, __wbg_adapter_24);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper175 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 4, __wbg_adapter_27);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper581 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 216, __wbg_adapter_30);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper583 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 216, __wbg_adapter_33);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_closure_wrapper728 = function(arg0, arg1, arg2) {
            var ret = makeMutClosure(arg0, arg1, 256, __wbg_adapter_36);
            return addHeapObject(ret);
        };

        if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
            input = fetch(input);
        }

        const { instance, module } = await load(await input, imports);

        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;
        wasm.__wbindgen_start();
        return wasm;
    }

    init("wasm/shipyard_bunny_demo.wasm").catch(console.error);

}());
//# sourceMappingURL=index.js.map
