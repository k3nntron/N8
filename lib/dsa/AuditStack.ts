export interface AuditEntry {
  action: string;
  userId: string;
  targetId: string;
  timestamp: number;
  details?: string;
}

class StackNode<T> {
  value: T;
  next: StackNode<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}

export class AuditStack {
  private top: StackNode<AuditEntry> | null = null;
  private _size = 0;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  push(entry: AuditEntry): void {
    if (this._size >= this.maxSize) {
      this.pop();
    }
    const node = new StackNode(entry);
    node.next = this.top;
    this.top = node;
    this._size++;
  }

  pop(): AuditEntry | undefined {
    if (!this.top) return undefined;
    const value = this.top.value;
    this.top = this.top.next;
    this._size--;
    return value;
  }

  peek(): AuditEntry | undefined {
    return this.top?.value;
  }

  get size(): number {
    return this._size;
  }

  isEmpty(): boolean {
    return this._size === 0;
  }

  toArray(): AuditEntry[] {
    const result: AuditEntry[] = [];
    let current = this.top;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  undo(): AuditEntry | undefined {
    return this.pop();
  }
}
