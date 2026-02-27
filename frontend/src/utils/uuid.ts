export const uuidv4 = (): string => {
  try {
    const rnd = (globalThis as any)?.crypto?.randomUUID;
    if (typeof rnd === 'function') return rnd();
  } catch (e) {
    // ignore
  }

  // fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
