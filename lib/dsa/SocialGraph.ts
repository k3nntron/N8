/**
 * Social Graph – Adjacency List implementation
 * Users and Servers are Nodes; membership = Edge.
 * O(1) add/remove edge, O(V+E) BFS/DFS traversal
 */
export class SocialGraph {
  private adjacencyList: Map<string, Set<string>> = new Map();

  addNode(id: string): void {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, new Set());
    }
  }

  removeNode(id: string): void {
    if (!this.adjacencyList.has(id)) return;
    for (const neighbor of this.adjacencyList.get(id)!) {
      this.adjacencyList.get(neighbor)?.delete(id);
    }
    this.adjacencyList.delete(id);
  }

  addEdge(a: string, b: string): void {
    this.addNode(a);
    this.addNode(b);
    this.adjacencyList.get(a)!.add(b);
    this.adjacencyList.get(b)!.add(a);
  }

  removeEdge(a: string, b: string): void {
    this.adjacencyList.get(a)?.delete(b);
    this.adjacencyList.get(b)?.delete(a);
  }

  getNeighbors(id: string): string[] {
    return Array.from(this.adjacencyList.get(id) ?? []);
  }

  /** BFS – find all nodes reachable from `start` */
  bfs(start: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [start];
    const result: string[] = [];
    visited.add(start);

    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);
      for (const neighbor of this.adjacencyList.get(node) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return result;
  }

  /** DFS – depth-first traversal from `start` */
  dfs(start: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const stack: string[] = [start];

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (visited.has(node)) continue;
      visited.add(node);
      result.push(node);
      for (const neighbor of this.adjacencyList.get(node) ?? []) {
        if (!visited.has(neighbor)) stack.push(neighbor);
      }
    }
    return result;
  }

  /** Mutual friends between two users */
  mutualFriends(a: string, b: string): string[] {
    const aNeighbors = this.adjacencyList.get(a);
    const bNeighbors = this.adjacencyList.get(b);
    if (!aNeighbors || !bNeighbors) return [];
    return Array.from(aNeighbors).filter((n) => bNeighbors.has(n));
  }

  get size(): number {
    return this.adjacencyList.size;
  }

  getAllNodes(): string[] {
    return Array.from(this.adjacencyList.keys());
  }
}
