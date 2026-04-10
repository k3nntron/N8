/**
 * Hash Map for O(1) user/invite code lookup
 */
export interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  servers: string[];
}

export class UserDirectory {
  private usersById: Map<string, UserRecord> = new Map();
  private usersByUsername: Map<string, string> = new Map(); // username -> id
  private inviteCodes: Map<string, string> = new Map(); // code -> serverId

  /** O(1) insert */
  addUser(user: UserRecord): void {
    this.usersById.set(user.id, user);
    this.usersByUsername.set(user.username.toLowerCase(), user.id);
  }

  /** O(1) lookup by ID */
  getUserById(id: string): UserRecord | undefined {
    return this.usersById.get(id);
  }

  /** O(1) lookup by username */
  getUserByUsername(username: string): UserRecord | undefined {
    const id = this.usersByUsername.get(username.toLowerCase());
    return id ? this.usersById.get(id) : undefined;
  }

  removeUser(id: string): boolean {
    const user = this.usersById.get(id);
    if (!user) return false;
    this.usersByUsername.delete(user.username.toLowerCase());
    this.usersById.delete(id);
    return true;
  }

  /** Generate invite code – O(1) insert */
  createInviteCode(serverId: string): string {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.inviteCodes.set(code, serverId);
    return code;
  }

  /** O(1) invite code resolution */
  resolveInvite(code: string): string | undefined {
    return this.inviteCodes.get(code.toUpperCase());
  }

  /** O(n) search with prefix matching */
  searchUsers(query: string): UserRecord[] {
    const q = query.toLowerCase();
    const results: UserRecord[] = [];
    for (const user of this.usersById.values()) {
      if (
        user.username.toLowerCase().includes(q) ||
        user.displayName.toLowerCase().includes(q)
      ) {
        results.push(user);
      }
    }
    // O(n log n) sort by relevance (exact prefix first)
    return results.sort((a, b) => {
      const aStarts = a.username.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.username.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts;
    });
  }

  get totalUsers(): number {
    return this.usersById.size;
  }

  getAllUsers(): UserRecord[] {
    return Array.from(this.usersById.values());
  }
}
