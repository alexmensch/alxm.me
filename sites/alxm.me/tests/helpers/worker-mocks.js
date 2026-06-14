/**
 * Shared mock helpers for worker tests.
 */

export function createRequest(url, headers = {}) {
  return new Request(url, { headers });
}
