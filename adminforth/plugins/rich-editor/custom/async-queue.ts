

export default class AsyncQueue {
  queue: (() => Promise<any>)[];
  processing: boolean;

  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(task: () => Promise<any>) {
    this.queue.push(task);
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      try {
        await task();
      } catch (error) {
        console.error('Task encountered an error:', error);
      }
    }
    this.processing = false;
  }
}