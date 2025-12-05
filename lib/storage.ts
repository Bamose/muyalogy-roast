import { Redis } from '@upstash/redis';

type UserRecord = {
  userId: number;
  username?: string;
  firstName?: string;
  lastActive: number;
};

class Storage {
  private redis?: Redis;
  private memoryChats = new Map<string, Map<string, UserRecord>>();

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      this.redis = new Redis({ url, token });
    }
  }

  private chatSetKey(chatId: number | string) {
    return `chat:${chatId}:users`;
  }

  private userKey(chatId: number | string, userId: number | string) {
    return `chat:${chatId}:user:${userId}`;
  }

  async markActive(user: UserRecord & { chatId: number | string }) {
    const { chatId, ...rest } = user;
    if (this.redis) {
      const userKey = this.userKey(chatId, rest.userId);
      await Promise.all([
        this.redis.sadd(this.chatSetKey(chatId), String(rest.userId)),
        this.redis.set(userKey, JSON.stringify(rest))
      ]);
      return;
    }

    const chatKey = String(chatId);
    const bucket = this.memoryChats.get(chatKey) ?? new Map<string, UserRecord>();
    bucket.set(String(rest.userId), rest);
    this.memoryChats.set(chatKey, bucket);
  }

  async getUser(chatId: number | string, userId: number | string): Promise<UserRecord | null> {
    if (this.redis) {
      const data = await this.redis.get<string>(this.userKey(chatId, userId));
      return data ? (JSON.parse(data) as UserRecord) : null;
    }

    return this.memoryChats.get(String(chatId))?.get(String(userId)) ?? null;
  }

  async findByUsername(chatId: number | string, username: string): Promise<UserRecord | null> {
    const normalized = username.replace(/^@/, '').toLowerCase();
    const users = await this.listUsers(chatId);
    return (
      users.find((u) => (u.username ?? '').toLowerCase() === normalized) ?? null
    );
  }

  async listUsers(chatId: number | string): Promise<UserRecord[]> {
    if (this.redis) {
      const ids = await this.redis.smembers<string>(this.chatSetKey(chatId));
      if (!ids.length) return [];
      const keys = ids.map((id) => this.userKey(chatId, id));
      const stored = await this.redis.mget<string>(...keys);
      return stored
        .map((json) => (json ? (JSON.parse(json) as UserRecord) : null))
        .filter((u): u is UserRecord => Boolean(u));
    }

    return Array.from(this.memoryChats.get(String(chatId))?.values() ?? []);
  }

  async findInactiveUser(
    chatId: number | string,
    excludeUserId: number | string,
    thresholdMs: number
  ): Promise<UserRecord | null> {
    const now = Date.now();
    const users = await this.listUsers(chatId);
    const inactive = users
      .filter((u) => String(u.userId) !== String(excludeUserId))
      .filter((u) => now - u.lastActive >= thresholdMs)
      .sort((a, b) => a.lastActive - b.lastActive);
    return inactive[0] ?? null;
  }
}

export const storage = new Storage();
export type { UserRecord };
