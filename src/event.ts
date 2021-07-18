type callbackType = (options?: any) => void

class Event {
  private listeners: Map<string, Array<callbackType>> = new Map()
  
  // 订阅事件
  subscribe(key: string, callback: callbackType) {
    if (typeof callback !== 'function') {
      return
    }
    const currentListeners = this.listeners.get(key)
    if(Array.isArray(currentListeners)) {
      this.listeners.set(key, [...currentListeners, callback])
    } else {
      this.listeners.set(key, [callback])
    }
    
  }

  // 发布事件
  publish(key: string, options?: any) {
    const currentListeners = this.listeners.get(key)
    if (!currentListeners) { 
      return
    }
    currentListeners.forEach((callback) => {
      callback(options)
    })
  }

  // 移出已订阅事件
  remove(key: string, callback: callbackType): boolean {
    const currentListeners = this.listeners.get(key)
    if(!currentListeners || !callback) {
      return false
    }

    const newListeners = currentListeners.filter(
        (listenerCallback) => listenerCallback !== callback
      )
    if (newListeners.length > 0) {
      this.listeners.set(key, newListeners)
    } else {
      this.listeners.delete(key)
    }
    return true
  }
}