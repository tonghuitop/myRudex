import { createStore, combineReducers, applyMiddleware } from './redux'
import logger from './logger'

const initState = {
  milk: 0
}

function milkReducer (state = initState, action: any) {
  switch (action.type) {
    case 'PUT_MILK':
      return {...state, milk: state.milk + action.payload.count}
      case 'TAKE_MILK':
        return {...state, milk: state.milk - action.payload.count}
    default:
      return state
  }
}

const initRiceState = {
  rice: 0
}

function riceReducer (state = initRiceState, action: any) {
  switch (action.type) {
    case 'PUT_RICE':
      return {...state, milk: state.rice + action.payload.count}
      case 'TAKE_RICE':
        return {...state, milk: state.rice - action.payload.count}
    default:
      return state
  }
}


const reducer = combineReducers({milk: milkReducer, rice: riceReducer})

let store = createStore(reducer, applyMiddleware(logger))

store.subscribe(() => console.log(store.getState()))

store.dispatch({ type: 'PUT_MILK', payload: {count: 1 }});    // milk: 1
store.dispatch({ type: 'PUT_MILK', payload: {count: 1 }});    // milk: 2
store.dispatch({ type: 'TAKE_MILK', payload: {count: 1 }});   // milk: 1

