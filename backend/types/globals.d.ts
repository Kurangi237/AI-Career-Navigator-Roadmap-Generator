declare module 'redis';

declare module 'uuid';

declare namespace Express {
  interface Request {
    session?: {
      user?: {
        id: string;
        email?: string;
      };
    };
    user?: {
      id: string;
      role?: string;
    };
  }
}
