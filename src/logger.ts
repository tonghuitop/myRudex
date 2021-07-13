import { storeType } from './type'

function logger(store: storeType) {
  /**
   * next === dispatch方法
   */
  return function(next: any) {
    return function(action: any) {
      console.group(action.type);
      console.info('dispatching', action);
      let result = next(action);
      console.log('next state', store.getState());
      console.groupEnd();
      return result
    }
  }
}

export default logger