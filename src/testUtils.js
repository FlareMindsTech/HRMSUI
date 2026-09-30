// Minimal fetch/localStorage test helpers. Network is fully mocked — no
// test here asserts a successful live API call; backend behavior is covered
// by contract tracing plus the manual checklist in the test report.

export const jsonResponse = (body, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  headers: { get: (name) => (String(name).toLowerCase() === 'content-type' ? 'application/json' : '') },
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});

export const installFetchMock = (impl) => {
  const spy = jest.fn(impl);
  global.fetch = spy;
  return spy;
};

export const clearTestStorage = () => {
  try {
    localStorage.clear();
  } catch {
    // ignore storage errors in test env
  }
};
