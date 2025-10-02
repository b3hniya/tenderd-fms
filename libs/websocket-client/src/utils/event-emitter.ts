/**
 * Type-safe event emitter utility
 * Provides a simple pub/sub pattern for internal use
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * Simple type-safe event emitter for internal use
 */
export class TypedEventEmitter<EventMap extends Record<string, any>> {
  private handlers: Map<keyof EventMap, Set<EventHandler<any>>> = new Map();

  /**
   * Register an event handler
   */
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  /**
   * Register a one-time event handler
   */
  once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const wrappedHandler = (data: EventMap[K]) => {
      handler(data);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }

  /**
   * Remove an event handler
   */
  off<K extends keyof EventMap>(event: K, handler?: EventHandler<EventMap[K]>): void {
    if (!handler) {
      // Remove all handlers for this event
      this.handlers.delete(event);
    } else {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(event);
        }
      }
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<K extends keyof EventMap>(event: K, data: EventMap[K]): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) return;

    const promises = Array.from(handlers).map(handler => {
      try {
        return Promise.resolve(handler(data));
      } catch (error) {
        console.error(`Error in event handler for "${String(event)}":`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get the number of handlers for an event
   */
  listenerCount(event: keyof EventMap): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  /**
   * Remove all event handlers
   */
  removeAllListeners(): void {
    this.handlers.clear();
  }
}
