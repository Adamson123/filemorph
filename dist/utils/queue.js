export class Queue {
    items = [];
    enqueue(item) {
        this.items.unshift(item);
    }
    dequeue() {
        return this.items.shift();
    }
    isEmpty() {
        return this.items.length === 0;
    }
}
