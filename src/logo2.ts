import { storeType } from './type'

function logger2(store: storeType) {
  return function(next: any) {
    return function(action: any) {
      let result = next(action);
      console.log('logger2');
      return result
    }
  }
}

export default logger2