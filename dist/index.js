"use strict";
function createStore(reducer, enhancer) {
    let state; // 记录状态
    let listeners = []; // 保持所有注册的回调
    if (enhancer && typeof enhancer === 'function') {
        const newCreateStore = enhancer(createStore);
        const newStore = newCreateStore(reducer);
        return newStore;
    }
    function subscribe(callback) {
        listeners.push(callback);
    }
    // dispatch 就是将所有的回调拿出来依次执行
    function dispatch(action) {
        state = reducer(state, action);
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener();
        }
    }
    function getState() {
        return state;
    }
    const store = {
        subscribe,
        dispatch,
        getState
    };
    return store;
}
function combineReducers(reducerMap) {
    const reducerKeys = Object.keys(reducerMap);
    // 翻译一个普通结构的reducer对象
    const reducer = (state = {}, action) => {
        const newState = {};
        for (let i = 0; i < reducerKeys.length; i++) {
            const key = reducerKeys[i];
            const currentReducer = reducerMap[key];
            const prevState = state[key];
            newState[key] = currentReducer(prevState, action);
        }
        return newState;
    };
    return reducer;
}
/**
 *
 * @param middleware: applyMiddleware的返回值应该是一个enhancer
 */
function applyMiddleware(middleware) {
    function enhancer(createStore) {
        function newCreateStore(reducer) {
            const store = createStore(reducer);
            const func = middleware(store);
            const { dispatch } = store;
            const newDispatch = func(dispatch);
            return Object.assign(Object.assign({}, store), { dispatch: newDispatch });
        }
        return newCreateStore;
    }
    return enhancer;
}
function logger(store) {
    /**
     * next === dispatch方法
     */
    return function (next) {
        return function (action) {
            console.group(action.type);
            console.info('dispatching', action);
            let result = next(action);
            console.log('next state', store.getState());
            console.groupEnd();
            return result;
        };
    };
}
const initState = {
    milk: 0
};
function milkReducer(state = initState, action) {
    switch (action.type) {
        case 'PUT_MILK':
            return Object.assign(Object.assign({}, state), { milk: state.milk + action.payload.count });
        case 'TAKE_MILK':
            return Object.assign(Object.assign({}, state), { milk: state.milk - action.payload.count });
        default:
            return state;
    }
}
const initRiceState = {
    rice: 0
};
function riceReducer(state = initRiceState, action) {
    switch (action.type) {
        case 'PUT_RICE':
            return Object.assign(Object.assign({}, state), { milk: state.rice + action.payload.count });
        case 'TAKE_RICE':
            return Object.assign(Object.assign({}, state), { milk: state.rice - action.payload.count });
        default:
            return state;
    }
}
const reducer = combineReducers({ milk: milkReducer, rice: riceReducer });
let store = createStore(reducer, applyMiddleware(logger));
store.subscribe(() => console.log(store.getState()));
store.dispatch({ type: 'PUT_MILK', payload: { count: 1 } }); // milk: 1
store.dispatch({ type: 'PUT_MILK', payload: { count: 1 } }); // milk: 2
store.dispatch({ type: 'TAKE_MILK', payload: { count: 1 } }); // milk: 1
//# sourceMappingURL=index.js.map