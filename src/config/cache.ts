import { Bulk, connect, Redis } from "../../deps.ts";
import { Logger } from "../Helpers/Logger.ts";
import { CONSTANTS } from "../utils.ts";

const enableCache = Deno.env.get("ENABLE_REDIS") === "true";

class CacheProvider {
  private static instance: CacheProvider;
  public client: Redis | null = null;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;

  private constructor() {}

  static getInstance(): CacheProvider {
    if (!CacheProvider.instance) {
      CacheProvider.instance = new CacheProvider();
    }
    return CacheProvider.instance;
  }

  async connect(): Promise<void> {
    if (!enableCache) {
      Logger.warn("Redis está deshabilitado");
      return;
    }

    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      Logger.error("Máximo de intentos de conexión alcanzado");
      return;
    }

    try {
      this.client = await connect({
        hostname: Deno.env.get("REDIS_HOST") || "localhost",
        port: Number(Deno.env.get("REDIS_PORT")) || 6379,
        username: Deno.env.get("REDIS_USERNAME") || "",
        password: Deno.env.get("REDIS_PASSWORD") || "",
      });
      Logger.log("Conectado exitosamente a Redis");
      this.connectionAttempts = 0;
    } catch (error) {
      this.connectionAttempts++;
      const message = error instanceof Error ? error.message : String(error);
      Logger.error(
        `Error al conectar a Redis (intento ${this.connectionAttempts}): ${message}`,
      );
    }
  }

  async get(key: string): Promise<Bulk | undefined> {
    if (!enableCache) return undefined;

    try {
      if (!this.client) {
        await this.connect();
      }
      return await this.client?.get(key);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Logger.error(`Error al obtener del caché: ${message}`);
      return undefined;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!enableCache) return;

    try {
      if (!this.client) {
        await this.connect();
      }
      await this.client?.set(key, value, {
        px: ttl || CONSTANTS.REDIS_TTL,
      });
      Logger.log(`Valor cacheado con clave: ${key}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Logger.error(`Error al establecer en caché: ${message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!enableCache) return;

    try {
      if (!this.client) {
        await this.connect();
      }
      await this.client?.del(key);
      Logger.log(`Clave eliminada del caché: ${key}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Logger.error(`Error al eliminar del caché: ${message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        Logger.log("Desconectado de Redis");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Logger.error(`Error al desconectar de Redis: ${message}`);
      }
    }
  }
}

export const cacheProvider = CacheProvider.getInstance();
