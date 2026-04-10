import { describe, it, expect } from 'vitest';
import { SocialGraph } from '../lib/dsa/SocialGraph';
import { UserDirectory } from '../lib/dsa/UserDirectory';
import { AuditStack } from '../lib/dsa/AuditStack';
import { mergeSort, quickSort } from '../lib/dsa/Sorting';
import { linearSearch, binarySearch, interpolationSearch } from '../lib/dsa/Search';
import { FriendsService, friendsService } from '../services/FriendsService';

describe('DSA Benchmarks', () => {
  describe('SocialGraph - Graph Operations', () => {
    const graph = new SocialGraph();

    it('addNode - O(1)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        graph.addNode(`user-${i}`);
      }
      const end = performance.now();
      console.log(`addNode 1000 nodes: ${(end - start).toFixed(2)}ms`);
      expect(graph.size).toBe(1000);
    });

    it('addEdge - O(1)', () => {
      for (let i = 0; i < 999; i++) {
        graph.addEdge(`user-${i}`, `user-${i + 1}`);
      }
      const start = performance.now();
      graph.addEdge('user-0', 'user-999');
      const end = performance.now();
      console.log(`addEdge: ${(end - start).toFixed(4)}ms`);
      expect(graph.getNeighbors('user-0').length).toBe(2);
    });

    it('getNeighbors - O(1)', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        graph.getNeighbors('user-0');
      }
      const end = performance.now();
      console.log(`getNeighbors 10000 calls: ${(end - start).toFixed(2)}ms`);
    });

    it('BFS - O(V+E)', () => {
      const g = new SocialGraph();
      for (let i = 0; i < 500; i++) {
        g.addNode(`n${i}`);
      }
      for (let i = 0; i < 499; i++) {
        g.addEdge(`n${i}`, `n${i + 1}`);
      }
      const start = performance.now();
      const result = g.bfs('n0');
      const end = performance.now();
      console.log(`BFS on 500 nodes: ${(end - start).toFixed(2)}ms, visited: ${result.length}`);
      expect(result.length).toBe(500);
    });

    it('DFS - O(V+E)', () => {
      const start = performance.now();
      const result = graph.dfs('user-0');
      const end = performance.now();
      console.log(`DFS: ${(end - start).toFixed(2)}ms`);
    });

    it('mutualFriends - O(min(deg(a), deg(b)))', () => {
      const g = new SocialGraph();
      for (let i = 0; i < 100; i++) g.addNode(`u${i}`);
      
      g.addEdge('u0', 'u1');
      g.addEdge('u0', 'u2');
      g.addEdge('u0', 'u3');
      g.addEdge('u1', 'u2');
      g.addEdge('u1', 'u3');
      g.addEdge('u2', 'u3');

      const start = performance.now();
      const mutual = g.mutualFriends('u0', 'u1');
      const end = performance.now();
      console.log(`mutualFriends: ${(end - start).toFixed(4)}ms, count: ${mutual.length}`);
      expect(mutual.length).toBe(2);
    });
  });

  describe('UserDirectory - Hash Map Operations', () => {
    const dir = new UserDirectory();

    it('addUser - O(1)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        dir.addUser({
          id: `u${i}`,
          username: `user${i}`,
          displayName: `User ${i}`,
          status: 'online',
          servers: []
        });
      }
      const end = performance.now();
      console.log(`addUser 1000: ${(end - start).toFixed(2)}ms`);
      expect(dir.totalUsers).toBe(1000);
    });

    it('getUserById - O(1)', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        dir.getUserById('u500');
      }
      const end = performance.now();
      console.log(`getUserById 10000: ${(end - start).toFixed(2)}ms`);
    });

    it('getUserByUsername - O(1)', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        dir.getUserByUsername('user500');
      }
      const end = performance.now();
      console.log(`getUserByUsername 10000: ${(end - start).toFixed(2)}ms`);
    });

    it('searchUsers - O(n)', () => {
      const start = performance.now();
      const results = dir.searchUsers('user5');
      const end = performance.now();
      console.log(`searchUsers: ${(end - start).toFixed(2)}ms, found: ${results.length}`);
    });
  });

  describe('AuditStack - Stack Operations', () => {
    const stack = new AuditStack(1000);

    it('push/pop - O(1)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        stack.push({ action: 'test', userId: 'u1', targetId: 'u2', timestamp: Date.now() });
      }
      for (let i = 0; i < 1000; i++) {
        stack.pop();
      }
      const end = performance.now();
      console.log(`push/pop 1000: ${(end - start).toFixed(2)}ms`);
      expect(stack.size).toBe(0);
    });

    it('undo - O(1)', () => {
      stack.push({ action: 'undo_test', userId: 'u1', targetId: 'u2', timestamp: Date.now() });
      const start = performance.now();
      const undone = stack.undo();
      const end = performance.now();
      console.log(`undo: ${(end - start).toFixed(4)}ms`);
      expect(undone?.action).toBe('undo_test');
    });
  });

  describe('Sorting Algorithms', () => {
    const arr = Array.from({ length: 5000 }, (_, i) => ({ value: Math.random() * 10000 }));

    it('mergeSort - O(n log n)', () => {
      const start = performance.now();
      const sorted = mergeSort(arr, (a, b) => a.value - b.value);
      const end = performance.now();
      console.log(`mergeSort 5000: ${(end - start).toFixed(2)}ms`);
      expect(sorted[0].value).toBeLessThanOrEqual(sorted[1].value);
    });

    it('quickSort - O(n log n) avg', () => {
      const start = performance.now();
      const sorted = quickSort([...arr], (a, b) => a.value - b.value);
      const end = performance.now();
      console.log(`quickSort 5000: ${(end - start).toFixed(2)}ms`);
      expect(sorted[0].value).toBeLessThanOrEqual(sorted[1].value);
    });
  });

  describe('Search Algorithms', () => {
    const sortedArr = Array.from({ length: 10000 }, (_, i) => i * 2);

    it('linearSearch - O(n)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        linearSearch(sortedArr, x => x === 5000);
      }
      const end = performance.now();
      console.log(`linearSearch 1000x: ${(end - start).toFixed(2)}ms`);
    });

    it('binarySearch - O(log n)', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        binarySearch(sortedArr, 5000, (a, b) => a - b);
      }
      const end = performance.now();
      console.log(`binarySearch 1000x: ${(end - start).toFixed(2)}ms`);
    });

    it('interpolationSearch - O(log n) for uniform data', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        interpolationSearch(sortedArr, 5000);
      }
      const end = performance.now();
      console.log(`interpolationSearch 1000x: ${(end - start).toFixed(2)}ms`);
    });
  });

  describe('FriendsService Integration', () => {
    const service = new FriendsService();

    it('addUser and getUserById', () => {
      service.addUser({
        id: 'u1', username: 'john', displayName: 'John Doe', status: 'online', servers: ['s1', 's2']
      });
      const user = service.getUserById('u1');
      expect(user?.username).toBe('john');
    });

    it('addFriend and getMutualFriends', () => {
      service.addUser({ id: 'u2', username: 'jane', displayName: 'Jane Doe', status: 'online', servers: ['s1'] });
      service.addUser({ id: 'u3', username: 'bob', displayName: 'Bob Smith', status: 'offline', servers: ['s1'] });
      
      service.addFriend('u1', 'u2');
      service.addFriend('u1', 'u3');
      service.addFriend('u2', 'u3');

      const mutual = service.getMutualFriends('u1', 'u2');
      expect(mutual).toContain('u3');
    });

    it('getFriendRecommendations', () => {
      for (let i = 4; i <= 10; i++) {
        service.addUser({ id: `u${i}`, username: `user${i}`, displayName: `User ${i}`, status: 'online', servers: ['s1'] });
        service.addFriend('u1', `u${i}`);
      }
      service.addUser({ id: 'urec1', username: 'rec1', displayName: 'Recommend 1', status: 'online', servers: ['s1'] });
      service.addUser({ id: 'urec2', username: 'rec2', displayName: 'Recommend 2', status: 'online', servers: ['s1'] });
      service.addFriend('u2', 'urec1');
      service.addFriend('u3', 'urec1');
      service.addFriend('u4', 'urec2');

      const recs = service.getFriendRecommendations('u1', 5);
      console.log('Recommendations:', recs);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('getGraphStats', () => {
      const stats = service.getGraphStats();
      console.log('Graph Stats:', stats);
      expect(stats.nodeCount).toBeGreaterThan(0);
    });

    it('bfsTraversal', () => {
      const bfs = service.bfsTraversal('u1');
      console.log('BFS from u1:', bfs.length, 'users');
    });

    it('dfsTraversal', () => {
      const dfs = service.dfsTraversal('u1');
      console.log('DFS from u1:', dfs.length, 'users');
    });

    it('findConnectedComponents', () => {
      service.addUser({ id: 'isolated1', username: 'iso1', displayName: 'Isolated 1', status: 'offline', servers: [] });
      service.addUser({ id: 'isolated2', username: 'iso2', displayName: 'Isolated 2', status: 'offline', servers: [] });
      
      const components = service.findConnectedComponents();
      console.log('Connected components:', components.length);
    });

    it('action history and undo', () => {
      service.addFriend('u1', 'urec1');
      const history = service.getActionHistory();
      console.log('Action history count:', history.length);
      
      const undone = service.undoLastAction();
      console.log('Undone action:', undone?.action);
    });
  });
});
