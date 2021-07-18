"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_1 = require("./redux");
const logger_1 = require("./logger");
const logo2_1 = require("./logo2");
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
const reducer = redux_1.combineReducers({ milk: milkReducer, rice: riceReducer });
let store = redux_1.createStore(reducer, redux_1.applyMiddleware(logger_1.default, logo2_1.default));
store.subscribe(() => console.log(store.getState()));
store.dispatch({ type: 'PUT_MILK', payload: { count: 1 } }); // milk: 1
store.dispatch({ type: 'PUT_MILK', payload: { count: 1 } }); // milk: 2
store.dispatch({ type: 'TAKE_MILK', payload: { count: 1 } }); // milk: 1
//# sourceMappingURL=index.js.map