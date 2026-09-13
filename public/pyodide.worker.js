/**
 * MasmSpace — Dedicated Pyodide WebAssembly Web Worker
 * 
 * Runs all Pyodide loading and Python code execution completely off the main UI thread.
 * Prevents UI freezes on low-end hardware (4GB RAM laptops) and releases memory when terminated.
 */

const PYODIDE_CDN_VERSION = "v0.26.4";
const PYODIDE_JS_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_CDN_VERSION}/full/pyodide.js`;
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_CDN_VERSION}/full/`;

let pyodideInstance = null;
let initPromise = null;

async function getWorkerPyodide() {
  if (pyodideInstance) return pyodideInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    self.postMessage({
      type: "STATUS",
      message: "Loading Pyodide WASM in background worker…",
    });

    // Dynamically load Pyodide CDN bundle inside Web Worker
    if (typeof self.loadPyodide === "undefined") {
      importScripts(PYODIDE_JS_URL);
    }

    if (!self.loadPyodide) {
      throw new Error("Failed to load Pyodide script in Worker context.");
    }

    const pyodide = await self.loadPyodide({
      indexURL: PYODIDE_INDEX_URL,
    });

    pyodideInstance = pyodide;

    self.postMessage({
      type: "STATUS",
      message: "Pyodide WebAssembly worker initialized",
    });

    return pyodide;
  })();

  return initPromise;
}

self.onmessage = async (e) => {
  let type = "RUN_PYTHON";
  let code = "";
  let id = null;

  if (typeof e.data === "string") {
    code = e.data;
    type = "RUN_PYTHON";
  } else if (e.data && typeof e.data === "object") {
    type = e.data.type || "RUN_PYTHON";
    code = e.data.code || "";
    id = e.data.id || null;
  }

  if (type === "INIT") {
    try {
      await getWorkerPyodide();
      self.postMessage({ type: "INIT_READY", id, output: "Pyodide WebAssembly worker initialized" });
    } catch (err) {
      self.postMessage({
        type: "ERROR",
        id,
        error: err.message || String(err),
        output: err.message || String(err),
      });
    }
    return;
  }

  if (type === "RUN_PYTHON" || type === "RUN") {
    const startTime = performance.now();
    try {
      self.postMessage({
        type: "STATUS",
        id,
        message: "Executing Python in isolated Web Worker…",
      });

      const pyodide = await getWorkerPyodide();

      let stdout = "";
      let stderr = "";

      pyodide.setStdout({
        batched: (text) => {
          stdout += (stdout ? "\n" : "") + text;
        },
      });

      pyodide.setStderr({
        batched: (text) => {
          stderr += (stderr ? "\n" : "") + text;
        },
      });

      const rawResult = await pyodide.runPythonAsync(code || "");
      let returnValue = null;

      if (rawResult !== undefined && rawResult !== null) {
        try {
          if (typeof rawResult.toJs === "function") {
            const jsVal = rawResult.toJs();
            returnValue = JSON.stringify(jsVal, null, 2);
          } else {
            returnValue = String(rawResult);
          }
        } catch {
          returnValue = String(rawResult);
        } finally {
          if (typeof rawResult.destroy === "function") {
            rawResult.destroy();
          }
        }
      }

      const executionTimeMs = Math.round(performance.now() - startTime);
      const combinedOutput = stdout || returnValue || "(Code executed with no return value)";

      self.postMessage({
        type: "SUCCESS",
        id,
        output: combinedOutput,
        stdout,
        stderr,
        returnValue,
        executionTimeMs,
      });
    } catch (err) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      const errString = err.message || String(err);
      self.postMessage({
        type: "ERROR",
        id,
        error: errString,
        output: errString,
        stderr: errString,
        stdout: "",
        returnValue: null,
        executionTimeMs,
      });
    }
  }
};
