type CursorPayload = {
  userId: string;
  userName: string;
  line: number;
  column: number;
};

type CursorCallback = (payload: CursorPayload) => void;

class RealtimeService {
  private callbacks = new Map<string, Set<CursorCallback>>();
  private initialized = false;

  initialize() {
    this.initialized = true;
  }

  onCursorMove(sessionId: string, callback: CursorCallback) {
    const key = `cursor:${sessionId}`;
    const set = this.callbacks.get(key) || new Set<CursorCallback>();
    set.add(callback);
    this.callbacks.set(key, set);
  }

  broadcastCursor(sessionId: string, userId: string, line: number, column: number) {
    if (!this.initialized) return;
    const key = `cursor:${sessionId}`;
    const listeners = this.callbacks.get(key);
    if (!listeners) return;
    const payload: CursorPayload = {
      userId,
      userName: userId,
      line,
      column,
    };
    listeners.forEach((cb) => cb(payload));
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;

