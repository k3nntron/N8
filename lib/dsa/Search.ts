export function linearSearch<T>(arr: T[], predicate: (item: T) => boolean): { index: number; item: T } | null {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i])) {
      return { index: i, item: arr[i] };
    }
  }
  return null;
}

export function binarySearch<T>(arr: T[], target: T, compare: (a: T, b: T) => number): { index: number; item: T } | null {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const cmp = compare(arr[mid], target);

    if (cmp === 0) {
      return { index: mid, item: arr[mid] };
    } else if (cmp < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return null;
}

export function binarySearchFirst<T>(arr: T[], target: T, compare: (a: T, b: T) => number): { index: number; item: T } | null {
  let left = 0;
  let right = arr.length - 1;
  let result: { index: number; item: T } | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const cmp = compare(arr[mid], target);

    if (cmp === 0) {
      result = { index: mid, item: arr[mid] };
      right = mid - 1;
    } else if (cmp < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

export function interpolationSearch(arr: number[], target: number): number | null {
  if (arr.length === 0 || target < arr[0] || target > arr[arr.length - 1]) {
    return null;
  }

  let left = 0;
  let right = arr.length - 1;

  while (left <= right && target >= arr[left] && target <= arr[right]) {
    const pos = left + Math.floor(
      ((target - arr[left]) * (right - left)) / (arr[right] - arr[left])
    );

    if (arr[pos] === target) return pos;
    if (arr[pos] < target) left = pos + 1;
    else right = pos - 1;
  }

  return null;
}

export function getComplexity(type: 'linearSearch' | 'binarySearch' | 'interpolationSearch'): string {
  const complexities = {
    linearSearch: 'O(n) time, O(1) space',
    binarySearch: 'O(log n) time, O(1) space',
    interpolationSearch: 'O(log n) average, O(1) space (works best for uniformly distributed data)'
  };
  return complexities[type];
}
