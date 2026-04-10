/**
 * FIFO Message Queue for real-time message delivery
 * O(1) enqueue, O(1) dequeue (amortized with linked-list style)
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  channelId: string;
}

class QueueNode<T> {
  value: T;
  next: QueueNode<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

export class MessageQueue<T = ChatMessage> {
  private head: QueueNode<T> | null = null;
  private tail: QueueNode<T> | null = null;
  private _size = 0;

  /** O(1) enqueue */
  enqueue(item: T): void {
    const node = new QueueNode(item);
    if (this.tail) {
      this.tail.next = node;
    }
    this.tail = node;
    if (!this.head) this.head = node;
    this._size++;
  }

  /** O(1) dequeue */
  dequeue(): T | undefined {
    if (!this.head) return undefined;
    const value = this.head.value;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this._size--;
    return value;
  }

  peek(): T | undefined {
    return this.head?.value;
  }

  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  /** Drain all items as array */
  drainAll(): T[] {
    const items: T[] = [];
    while (!this.isEmpty()) {
      items.push(this.dequeue()!);
    }
    return items;
  }
}
