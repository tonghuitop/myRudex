type reducerType = (state: any, action: any) => void
type enhancerType = (createStore: any) => any
type storeType = { subscribe: any, dispatch: (action: any) => void, getState: () => any } 
type createStoreType = (reducer: reducerType, enhancer?: enhancerType) => storeType

export {
  storeType,
  reducerType,
  enhancerType,
  createStoreType
}