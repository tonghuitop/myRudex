import { reducerType, enhancerType, createStoreType } from './type'

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
  // 翻译一个普通结构的reducer对象
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
function applyMiddleware(middleware: any) {
  function enhancer(createStore: createStoreType) {
    function newCreateStore(reducer: reducerType) {
      const store = createStore(reducer);
      const func = middleware(store)
      const { dispatch } = store
      const newDispatch = func(dispatch);
      return {...store, dispatch: newDispatch}
    }
    return newCreateStore
  }
  return enhancer
}

export {
  createStore,
  combineReducers,
  applyMiddleware,
}