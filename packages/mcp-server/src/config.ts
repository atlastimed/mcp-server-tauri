/**
 * Configuration for the MCP Bridge connection.
 *
 * This module provides configuration options for connecting to Tauri apps,
 * with support for environment variables and sensible defaults.
 */

export interface BridgeConfig {
   host: string;
   port: number;
}

/**
 * HTTP header the MCP client sends on WebSocket upgrade.
 *
 * The plugin server requires this; browsers do not attach it
 * automatically, which is the CSWSH control.
 */
export const MCP_BRIDGE_TOKEN_HEADER = 'X-MCP-Bridge-Token';

/**
 * Gets the default host for MCP Bridge connections.
 *
 * Resolution priority:
 * 1. MCP_BRIDGE_HOST environment variable
 * 2. TAURI_DEV_HOST environment variable (set by Tauri CLI for mobile dev)
 * 3. 'localhost' (default)
 */
export function getDefaultHost(): string {
   // eslint-disable-next-line no-process-env
   return process.env.MCP_BRIDGE_HOST || process.env.TAURI_DEV_HOST || 'localhost';
}

/**
 * Gets the default port for MCP Bridge connections.
 *
 * Resolution priority:
 * 1. MCP_BRIDGE_PORT environment variable
 * 2. 9223 (default)
 */
export function getDefaultPort(): number {
   // eslint-disable-next-line no-process-env
   const port = process.env.MCP_BRIDGE_PORT;

   return port ? parseInt(port, 10) : 9223;
}

/**
 * Gets the CWD hint used to route tool calls to the right Tauri instance
 * when multiple are connected at once.
 *
 * Resolution priority:
 * 1. MCP_BRIDGE_CWD environment variable (explicit override; useful when a
 *    wrapper script wants to pin routing to a specific worktree regardless
 *    of where the TS server happened to be launched from)
 * 2. process.cwd() (natural inheritance from the calling shell / IDE)
 *
 * Returns null only when both are unavailable, which is extremely rare:
 * process.cwd() is set on every healthy POSIX process.
 */
export function getCwdHint(): string | null {
   // eslint-disable-next-line no-process-env
   const override = process.env.MCP_BRIDGE_CWD;

   if (override && override.length > 0) {
      return override;
   }
   try {
      return process.cwd();
   } catch{
      return null;
   }
}

/**
 * Gets the full bridge configuration from environment variables.
 */
export function getConfig(): BridgeConfig {
   return {
      host: getDefaultHost(),
      port: getDefaultPort(),
   };
}

/**
 * Shared secret for plugin WebSocket upgrade, if the operator configured one.
 *
 * Empty or unset means the client will not send `X-MCP-Bridge-Token`. Auto-discovery
 * must not treat an unauthenticated peer as the session target in that case.
 */
export function getBridgeToken(): string | null {
   // eslint-disable-next-line no-process-env
   const token = process.env.MCP_BRIDGE_TOKEN;

   if (token && token.length > 0) {
      return token;
   }

   return null;
}

/**
 * Headers to attach to the plugin WebSocket upgrade.
 *
 * @returns `undefined` when no token is configured so the client omits the header.
 */
export function getWebSocketClientHeaders(): Record<string, string> | undefined {
   const token = getBridgeToken();

   if (!token) {
      return undefined;
   }

   return { [MCP_BRIDGE_TOKEN_HEADER]: token };
}

/**
 * Canonical host comparison form: trimmed, lowercased, IPv6 brackets and
 * IPv4-mapped prefixes stripped.
 */
export function canonicalizeHost(host: string): string {
   let normalized = host.trim().toLowerCase();

   if (normalized.startsWith('[') && normalized.endsWith(']')) {
      normalized = normalized.slice(1, -1);
   }

   if (normalized.startsWith('::ffff:')) {
      normalized = normalized.slice(7);
   }

   return normalized;
}

/**
 * True for localhost / loopback IPv4 (127.0.0.0/8) / IPv6 ::1.
 */
export function isLoopbackHost(host: string): boolean {
   const normalized = canonicalizeHost(host);

   if (normalized === 'localhost' || normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
      return true;
   }

   const octets = normalized.split('.');

   if (octets.length !== 4 || octets[0] !== '127') {
      return false;
   }

   return octets.every((octet) => {
      if (!/^\d{1,3}$/.test(octet)) {
         return false;
      }

      const value = Number(octet);

      return value >= 0 && value <= 255;
   });
}

/**
 * Hosts the MCP client may treat as a plugin endpoint.
 *
 * Allowlist is loopback, `MCP_BRIDGE_HOST`, `TAURI_DEV_HOST`, and an
 * operator-supplied host (tool argument). Arbitrary destinations are
 * rejected even if they speak WebSocket.
 */
export function isAllowedBridgeHost(host: string, extraAllowedHost?: string): boolean {
   if (isLoopbackHost(host)) {
      return true;
   }

   const canonical = canonicalizeHost(host),
         // eslint-disable-next-line no-process-env
         candidates = [ process.env.MCP_BRIDGE_HOST, process.env.TAURI_DEV_HOST, extraAllowedHost ];

   return candidates.some((candidate) => {
      return typeof candidate === 'string' && candidate.length > 0 && canonicalizeHost(candidate) === canonical;
   });
}

/**
 * Builds a WebSocket URL from host and port.
 */
export function buildWebSocketURL(host: string, port: number): string {
   return `ws://${host}:${port}`;
}
