import type { CodeRunner, ExecutionResult } from './types';

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    pyodideInstance?: any;
  }
}

export class PyodideRunner implements CodeRunner {
  name = 'Pyodide Web Worker & Browser Runtime';
  private pyodide: any = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.pyodide) return;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        if (typeof window === 'undefined') {
          return;
        }

        // Check if Pyodide script is already present
        if (!window.loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Pyodide runtime script from CDN'));
            document.head.appendChild(script);
          });
        }

        if (window.loadPyodide) {
          this.pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
          });
          window.pyodideInstance = this.pyodide;

          // Preload common scientific packages
          try {
            await this.pyodide.loadPackage(['numpy', 'matplotlib', 'scikit-learn']);
          } catch (pkgErr) {
            console.warn('Optional packages loading deferred:', pkgErr);
          }
        }
      } catch (err) {
        console.warn('Pyodide CDN initialization fallback:', err);
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  async run(code: string, files?: Array<{ name: string; content: string }>): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
      await this.initialize();

      if (!this.pyodide) {
        // Fallback lightweight Python execution simulator for simulated testing in environments where external CDN script might be restricted
        return this.runSimulatedPython(code, files, startTime);
      }

      // Write auxiliary & workspace files (e.g. helpers.py, main.py) to Pyodide's virtual filesystem
      if (files && files.length > 0) {
        for (const file of files) {
          try {
            this.pyodide.FS.writeFile(file.name, file.content, { encoding: 'utf8' });
          } catch (fsErr) {
            console.error('Error writing virtual file to Pyodide:', file.name, fsErr);
          }
        }
      }

      // Pass user code directly via Pyodide globals to avoid escaping/indentation issues
      this.pyodide.globals.set('_raw_user_code', code);

      // Python execution wrapper to configure sys.path, reload cached modules, and capture stdout, stderr, plots
      const runnerWrapper = `
import sys
import os
import io
import base64
import importlib

# Ensure current working directory is in sys.path for local module imports (e.g. from helpers import ...)
_cwd = os.getcwd()
if _cwd not in sys.path:
    sys.path.insert(0, _cwd)
if '' not in sys.path:
    sys.path.insert(0, '')

# Force-reload or clear cached local modules so student code changes take effect immediately
for _mod in list(sys.modules.keys()):
    if _mod in [
        'helpers',
        'main',
        'solution',
        'starter',
        'priority_model',
        'requirements_data',
        'data_pipeline',
    ]:
        try:
            importlib.reload(sys.modules[_mod])
        except Exception:
            del sys.modules[_mod]

_stdout_buffer = io.StringIO()
_stderr_buffer = io.StringIO()
_old_stdout = sys.stdout
_old_stderr = sys.stderr

sys.stdout = _stdout_buffer
sys.stderr = _stderr_buffer

_runtime_exception = None
_plots = []

try:
    _exec_globals = {
        '__name__': '__main__',
        '__file__': 'main.py',
        '__doc__': None,
    }
    _compiled = compile(_raw_user_code, 'main.py', 'exec')
    exec(_compiled, _exec_globals)

    # Capture any Matplotlib plots if generated
    try:
        import matplotlib.pyplot as _plt
        for _fignum in _plt.get_fignums():
            _fig = _plt.figure(_fignum)
            _img_buf = io.BytesIO()
            _fig.savefig(_img_buf, format='png', bbox_inches='tight')
            _img_buf.seek(0)
            _b64 = base64.b64encode(_img_buf.read()).decode('utf-8')
            _plots.append('data:image/png;base64,' + _b64)
            _plt.close(_fig)
    except Exception:
        pass

except Exception:
    import traceback
    _runtime_exception = traceback.format_exc()
finally:
    sys.stdout = _old_stdout
    sys.stderr = _old_stderr

{
    "stdout": _stdout_buffer.getvalue(),
    "stderr": _stderr_buffer.getvalue(),
    "error": _runtime_exception,
    "plots": _plots
}
`;

      const pyResult = await this.pyodide.runPythonAsync(runnerWrapper);
      const res = pyResult.toJs ? pyResult.toJs({ dict_converter: Object.fromEntries }) : pyResult;

      const duration = Math.round(performance.now() - startTime);

      return {
        stdout: res.stdout || '',
        stderr: res.stderr || (res.error ? res.error : ''),
        error: res.error || undefined,
        exitCode: res.error ? 1 : 0,
        executionTimeMs: duration,
        plots: Array.isArray(res.plots) ? res.plots : [],
      };
    } catch (err: any) {
      const duration = Math.round(performance.now() - startTime);
      return {
        stdout: '',
        stderr: err?.message || String(err),
        error: err?.message || String(err),
        exitCode: 1,
        executionTimeMs: duration,
        plots: [],
      };
    }
  }

  // Do not fabricate laboratory results if the Python runtime cannot load.
  // A false simulation would undermine requirement verification.
  private runSimulatedPython(
    _code: string,
    _files?: Array<{ name: string; content: string }>,
    startTime = performance.now()
  ): ExecutionResult {
    return {
      stdout: '',
      stderr:
        'The browser Python runtime could not be loaded. Check your network connection and reload the page before running or verifying the lab.',
      error: 'Pyodide runtime unavailable',
      exitCode: 1,
      executionTimeMs: Math.round(performance.now() - startTime),
      plots: [],
    };
  }

  stop(): void {
    // Web worker termination signal or interrupt
  }

  async reset(): Promise<void> {
    if (this.pyodide) {
      try {
        await this.pyodide.runPythonAsync(`
import sys
for mod in list(sys.modules.keys()):
    if mod not in sys.builtin_module_names and not mod.startswith('_'):
        pass
`);
      } catch {
        // Reset state
      }
    }
  }
}

export const defaultCodeRunner = new PyodideRunner();
