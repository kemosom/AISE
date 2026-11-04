/// <reference lib="webworker" />
export {};

type Check = { name: string; passed: boolean; error?: string };
const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message); };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

self.onmessage = (event: MessageEvent<{ code: string; issue: string }>) => {
  const { code, issue } = event.data;
  const results: Check[] = [];
  const test = (name: string, callback: () => void) => {
    try { callback(); results.push({ name, passed: true }); }
    catch (error) { results.push({ name, passed: false, error: error instanceof Error ? error.message : String(error) }); }
  };

  try {
    const module = { exports: {} as Record<string, any> };
    // The compiled code executes in this worker, not the application UI.
    new Function('module', 'exports', code)(module, module.exports);
    const lib = module.exports;

    if (issue === 'checkout') {
      test('Tax calculation returns integer cents', () => {
        assert(lib.totalAfterTax({ id: 'A', amountCents: 1299 }, 8) === 1403, 'Expected 1403 cents for RM12.99 plus 8% tax');
        assert(lib.totalAfterTax({ id: 'B', amountCents: 0 }, 10) === 0, 'Zero amount must stay zero');
      });
      test('Invalid tax values are rejected', () => {
        for (const bad of [-2, Infinity, NaN]) {
          let rejected = false;
          try { lib.totalAfterTax({ id: 'C', amountCents: 100 }, bad); } catch (error) { rejected = error instanceof RangeError; }
          assert(rejected, 'Expected RangeError for invalid tax percentage');
        }
      });
    } else if (issue === 'queue') {
      test('Critical incidents preempt routine work', () => {
        const selected = lib.nextJob([{ id: 'normal', priority: 'normal', createdAt: 1 }, { id: 'urgent', priority: 'critical', createdAt: 99 }]);
        assert(selected?.id === 'urgent', 'Critical issue must be selected first');
      });
      test('Same priority uses earliest timestamp', () => {
        assert(lib.nextJob([{ id: 'new', priority: 'high', createdAt: 8 }, { id: 'old', priority: 'high', createdAt: 2 }])?.id === 'old', 'Oldest high-priority item must win');
      });
      test('Input queue remains unchanged', () => {
        const items = [{ id: 'a', priority: 'high', createdAt: 2 }, { id: 'b', priority: 'normal', createdAt: 1 }];
        lib.nextJob(items);
        assert(items[0].id === 'a', 'Function mutated the caller input');
      });
      test('Empty queue returns null', () => assert(lib.nextJob([]) === null, 'Expected null'));
    } else if (issue === 'security') {
      test('Redacts credentials regardless of case', () => {
        const original = { Authorization: 'Bearer secret', Cookie: 'sid=123', 'X-API-Key': 'testkey' };
        assert(equal(lib.sanitizeHeaders(original), { Authorization: '[REDACTED]', Cookie: '[REDACTED]', 'X-API-Key': '[REDACTED]' }), 'Sensitive headers are not all redacted');
      });
      test('Preserves non-sensitive headers', () => {
        assert(equal(lib.sanitizeHeaders({ 'Content-Type': 'application/json', Accept: '*/*' }), { 'Content-Type': 'application/json', Accept: '*/*' }), 'Non-sensitive headers were changed');
      });
      test('Does not mutate caller input', () => {
        const original = { Authorization: 'Bearer secret' };
        lib.sanitizeHeaders(original);
        assert(original.Authorization === 'Bearer secret', 'Caller input was modified');
      });
      test('Redacts Set-Cookie and Proxy-Authorization', () => {
        assert(equal(lib.sanitizeHeaders({ 'set-COOKIE': 'sid=secret', 'Proxy-Authorization': 'Basic abc' }), { 'set-COOKIE': '[REDACTED]', 'Proxy-Authorization': '[REDACTED]' }), 'Additional credential headers not redacted');
      });
    } else {
      throw new Error('Unknown evaluation case');
    }

    self.postMessage({ results, passed: results.every((item) => item.passed) });
  } catch (error) {
    self.postMessage({ results, passed: false, error: error instanceof Error ? error.message : String(error) });
  }
};
