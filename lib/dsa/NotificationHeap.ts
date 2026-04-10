/**
 * Min-Heap for notification priority
 * Lower priority number = higher importance
 * O(log n) insert, O(log n) extract, O(1) peek
 */
export interface Notification {
  id: string;
  type: 'mention' | 'reply' | 'reaction' | 'server' | 'system';
  message: string;
  timestamp: number;
  priority: number; // 0 = highest (mentions), 4 = lowest (system)
  read: boolean;
  sourceId: string;
}

const PRIORITY_MAP: Record<Notification['type'], number> = {
  mention: 0,
  reply: 1,
  reaction: 2,
  server: 3,
  system: 4,
};

export function getNotificationPriority(type: Notification['type']): number {
  return PRIORITY_MAP[type];
}

export class NotificationHeap {
  private heap: Notification[] = [];

  private parent(i: number) { return Math.floor((i - 1) / 2); }
  private left(i: number) { return 2 * i + 1; }
  private right(i: number) { return 2 * i + 2; }

  private swap(i: number, j: number) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private compare(a: Notification, b: Notification): number {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.timestamp - b.timestamp; // earlier first for same priority
  }

  /** O(log n) insert */
  insert(notification: Notification): void {
    this.heap.push(notification);
    this.bubbleUp(this.heap.length - 1);
  }

  private bubbleUp(i: number): void {
    while (i > 0 && this.compare(this.heap[i], this.heap[this.parent(i)]) < 0) {
      this.swap(i, this.parent(i));
      i = this.parent(i);
    }
  }

  /** O(log n) extract min (highest priority) */
  extractMin(): Notification | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    let smallest = i;
    const l = this.left(i);
    const r = this.right(i);
    if (l < n && this.compare(this.heap[l], this.heap[smallest]) < 0) smallest = l;
    if (r < n && this.compare(this.heap[r], this.heap[smallest]) < 0) smallest = r;
    if (smallest !== i) {
      this.swap(i, smallest);
      this.sinkDown(smallest);
    }
  }

  /** O(1) peek */
  peek(): Notification | undefined {
    return this.heap[0];
  }

  get size(): number {
    return this.heap.length;
  }

  /** Get top-k notifications – O(k log n) */
  topK(k: number): Notification[] {
    const result: Notification[] = [];
    const backup: Notification[] = [];
    for (let i = 0; i < k && this.heap.length > 0; i++) {
      const item = this.extractMin()!;
      result.push(item);
      backup.push(item);
    }
    // Restore heap
    for (const item of backup) this.insert(item);
    return result;
  }

  toSortedArray(): Notification[] {
    return [...this.heap].sort((a, b) => this.compare(a, b));
  }
}
