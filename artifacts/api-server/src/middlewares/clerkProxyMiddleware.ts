import type { RequestHandler } from "express";

/**
 * Legacy compatibility middleware.
 *
 * Clerk has been removed.
 * Authentication is now handled by the custom
 * session-based authentication middleware.
 *
 * This middleware currently does nothing and simply
 * allows the request to continue.
 */
export const AUTH_PROXY_PATH = "/api/__auth";

export function authProxyMiddleware(): RequestHandler {
  return (_req, _res, next) => {
    next();
  };
}