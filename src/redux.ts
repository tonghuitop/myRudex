import { reducerType, enhancerType, createStoreType } from './type'

function compose(...arr: Array<any>) {
  if (arr.length === 0) {
    return (arg: any) => arg
  }
  if (arr.length === 1) {
    return arr[0]
  }
  // ES6 方式的重点就是利用了数组的 reduce 合并功能， 每
  // 次遍历合并都会将上一次组合后的函数返回回来再与当前的函数参数进行组合。依次不断的累积组合，最终返回这个组合函数。
  return arr.reduce((a, b) => (...args: any) => a(b(...args)))
}

function createStore(reducer: reducerType, enhancer?: enhancerType) {
  let state: any  // 记录状态
  let listeners: Array<() => void> = []  // 保持所有注册的回调

  if (enhancer && typeof enhancer === 'function') {
    const newCreateStore = enhancer(createStore)
    const newStore = newCreateStore(reducer)
    return newStore
  }

  function subscribe(callback: () => any) {
    listeners.push(callback)
  }

  // dispatch 就是将所有的回调拿出来依次执行
  function dispatch(action: any) {
    state = reducer(state, action)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }
  }

  function getState() {
    return state
  }

  const store = {
    subscribe,
    dispatch,
    getState
  }
  return store
}

function combineReducers(reducerMap: {[key: string]: any}) {
  const reducerKeys = Object.keys(reducerMap)
  // 转化为一个普通结构的reducer对象
  const reducer = (state:any = {}, action: any) => {
    const newState:any = {}
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i]
      const currentReducer = reducerMap[key]
      const prevState = state[key]
      newState[key] = currentReducer(prevState, action)
    }
    return newState
  }
  return reducer
}

/**
 * 
 * @param middleware: applyMiddleware的返回值应该是一个enhancer
 */
// function applyMiddleware(middleware: any) {
//   function enhancer(createStore: createStoreType) {
//     function newCreateStore(reducer: reducerType) {
//       const store = createStore(reducer);
//       const func = middleware(store)
//       const { dispatch } = store
//       const newDispatch = func(dispatch);
//       return {...store, dispatch: newDispatch}
//     }
//     return newCreateStore
//   }
//   return enhancer
// }

  /**
   * 
   * @param middlewares: 参数多个中间件
   */
  function applyMiddleware(...middlewares: Array<any>) {
    function enhancer(createStore: createStoreType) {
      function newCreateStore(reducer: reducerType) {
        const store = createStore(reducer);
        const { dispatch } = store;
        // 多个middleware，先解构出dispatch => newDispatch的结构
        const decorators = middlewares.map(middleware => middleware(store));
        // 用compose得到一个组合了所有newDispatch的函数
        const newDispatchGen = compose(...decorators)
        // 执行这个函数得到newDispatch
        const newDispatch = newDispatchGen(dispatch)
        return {...store, dispatch: newDispatch}
      }
      return newCreateStore;
    }
    return enhancer;
  }

export {
  createStore,
  combineReducers,
  applyMiddleware,
}