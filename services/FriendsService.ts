import { SocialGraph } from '../lib/dsa/SocialGraph';
import { UserDirectory, UserRecord } from '../lib/dsa/UserDirectory';
import { AuditStack } from '../lib/dsa/AuditStack';
import { mergeSort } from '../lib/dsa/Sorting';
import { binarySearch } from '../lib/dsa/Search';

export interface FriendRecommendation {
  userId: string;
  username: string;
  displayName: string;
  mutualFriendsCount: number;
  score: number;
}

export class FriendsService {
  private socialGraph: SocialGraph;
  private userDirectory: UserDirectory;
  private actionHistory: AuditStack;

  constructor() {
    this.socialGraph = new SocialGraph();
    this.userDirectory = new UserDirectory();
    this.actionHistory = new AuditStack(1000);
  }

  addUser(user: UserRecord): void {
    this.userDirectory.addUser(user);
    this.socialGraph.addNode(user.id);
    this.logAction('user_created', user.id, user.id, `Added user ${user.username}`);
  }

  addFriend(userId: string, friendId: string): void {
    this.socialGraph.addEdge(userId, friendId);
    this.logAction('friend_added', userId, friendId, `User ${userId} added friend ${friendId}`);
  }

  removeFriend(userId: string, friendId: string): void {
    this.socialGraph.removeEdge(userId, friendId);
    this.logAction('friend_removed', userId, friendId, `User ${userId} removed friend ${friendId}`);
  }

  getFriends(userId: string): string[] {
    return this.socialGraph.getNeighbors(userId);
  }

  getMutualFriends(userIdA: string, userIdB: string): string[] {
    return this.socialGraph.mutualFriends(userIdA, userIdB);
  }

  getMutualFriendsWithDetails(userIdA: string, userIdB: string): UserRecord[] {
    const mutualIds = this.socialGraph.mutualFriends(userIdA, userIdB);
    return mutualIds
      .map(id => this.userDirectory.getUserById(id))
      .filter((u): u is UserRecord => u !== undefined);
  }

  searchUsers(query: string): UserRecord[] {
    return this.userDirectory.searchUsers(query);
  }

  getUserById(id: string): UserRecord | undefined {
    return this.userDirectory.getUserById(id);
  }

  getUserByUsername(username: string): UserRecord | undefined {
    return this.userDirectory.getUserByUsername(username);
  }

  getFriendRecommendations(userId: string, limit: number = 5): FriendRecommendation[] {
    const myFriends = new Set(this.socialGraph.getNeighbors(userId));
    const allUsers = this.userDirectory.getAllUsers();

    const candidates = allUsers
      .filter(u => u.id !== userId && !myFriends.has(u.id))
      .map(user => {
        const mutualCount = this.socialGraph.mutualFriends(userId, user.id).length;
        return {
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          mutualFriendsCount: mutualCount,
          score: mutualCount * 10 + (user.status === 'online' ? 5 : 0)
        };
      })
      .filter(c => c.mutualFriendsCount > 0)
      .sort((a, b) => b.score - a.score);

    return candidates.slice(0, limit);
  }

  getFriendsByScore(userId: string): UserRecord[] {
    const friendIds = this.socialGraph.getNeighbors(userId);
    const friends = friendIds
      .map(id => this.userDirectory.getUserById(id))
      .filter((u): u is UserRecord => u !== undefined);

    return mergeSort(friends, (a, b) => {
      const scoreA = this.getUserScore(a);
      const scoreB = this.getUserScore(b);
      return scoreB - scoreA;
    });
  }

  private getUserScore(user: UserRecord): number {
    let score = 0;
    if (user.status === 'online') score += 10;
    if (user.status === 'dnd') score += 5;
    score += user.servers.length * 2;
    return score;
  }

  binarySearchUser(sortedUsers: UserRecord[], username: string): UserRecord | null {
    const result = binarySearch(
      sortedUsers,
      { username, displayName: '', id: '', servers: [], status: 'offline' } as UserRecord,
      (a, b) => a.username.localeCompare(b.username)
    );
    return result ? result.item : null;
  }

  logAction(action: string, userId: string, targetId: string, details?: string): void {
    this.actionHistory.push({
      action,
      userId,
      targetId,
      timestamp: Date.now(),
      details
    });
  }

  undoLastAction(): { action: string; userId: string; targetId: string; timestamp: number; details?: string } | undefined {
    return this.actionHistory.undo();
  }

  getActionHistory(): { action: string; userId: string; targetId: string; timestamp: number; details?: string }[] {
    return this.actionHistory.toArray();
  }

  getGraphStats(): { nodeCount: number; edgeCount: number } {
    const nodes = this.socialGraph.size;
    let edges = 0;
    for (const node of this.socialGraph.getAllNodes()) {
      edges += this.socialGraph.getNeighbors(node).length;
    }
    return { nodeCount: nodes, edgeCount: edges / 2 };
  }

  findConnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const node of this.socialGraph.getAllNodes()) {
      if (!visited.has(node)) {
        const component = this.socialGraph.bfs(node);
        component.forEach(n => visited.add(n));
        components.push(component);
      }
    }

    return components;
  }

  bfsTraversal(startUserId: string): string[] {
    return this.socialGraph.bfs(startUserId);
  }

  dfsTraversal(startUserId: string): string[] {
    return this.socialGraph.dfs(startUserId);
  }
}

export const friendsService = new FriendsService();
