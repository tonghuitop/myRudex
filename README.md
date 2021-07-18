---
title: 手写简易版redux
top: false
cover: false
toc: true
mathjax: false
tags:
  - react
  - redux
  - ts
  - null
  - null
categories:
  - react
abbrlink: 2294066012
date: 2021-07-11 10:14:47
img: /img/react/redux.png
coverImg:
password:
summary:
---
### 前置知识
##### 订阅发布模式
> 发布订阅模式：一群订阅者（Subscriber）通过消息调度中心来实现基于某个主题去订阅发布者（Publisher）,当有关状态发生变化时，Publisher会基于某个主题去通知该主题下对应的订阅者（Subscriber）触发更新。相比于上面的观察者模式而言，能够实现发布者与订阅者之间的解耦，而且能基于不同主题来添加订阅者，从而实现更为颗粒度的控制。
```
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
```
#### 函数式编程之Compose函数
> `compose` 函数可以接收多个独立的函数作为参数，然后将这些函数进行组合串联，最终返回一个“组合函数”。
例如执行：相当于将层级函数，给拍平了。
```
function compose (f1, f2, f3, f4) {
  return (args) => f1(f2(f3(f4(args)))
}
```
**特点：**
- 参数是多个函数，返回值是一个“组合函数”。
- 组合函数内的所有的函数从右至左一个一个执行（主要符合数学从右到左的操作概念）。
- 组合函数内除了第一个执行函数的参数是多元的，其它函数的参数都是接收上一个函数的返回值。
```
function sum (x, y) {
  return x + y
}
function square(x) {
  return x**2
}
// 没有使用compose
const rust = (x, y) => square(sum(x, y)) 
// 使用compose
const rust = compose(square, sum)
```
所以先判断有多少个函数，然后递归执行函数，每次一个函数执行完成后，返回执行结果
```
// 使用es6的结构获取参数数组，其应该是传入的函数参数
function compose(...arr) {
  const len = arr.length
  // 函数是从最里面的函数开始执行，即从右执行
  let runIndex = len - 1
  return function recursion () {
    const result = arr[runIndex].apply(this, arguments)
    // 不满足运行条件
    if (runIndex <= 0) {
      runIndex = len - 1
      return result
    }
    runIndex--
    return recursion.call(this, result)
  }
}
```
**使用es6数组的reducer方法后，更简洁的方法**
```
function compose(...arr) {
  if (arr.length === 0) {
    return arg => arg
  }
  if (arr.length === 1) {
    return arr[0]
  }
  // ES6 方式的重点就是利用了数组的 reduce 合并功能， 每次遍历合并都会将上一次组合后的函数返回回来再与当前的函数参数进行组合。依次不断的累积组合，最终返回这个组合函数。
  return arr.reduce((a, b) => (...args) => a(b(...args)));
}
```

### Redux
#### Redux的设计思想
Redux是一个前端状态管理库。说到redux，不得不说一说flux。Flux是Facebook用于构建客户端Web应用程序的基本架构，我们可以将Flux看做一种应用程序中的数据流的设计模式，而Redux正是基于Flux的核心思想实现的一套解决方案，它也得到了原作者的肯定。

首先，在Flux中会有以下角色：
- Dispatcher: 调度器，收到Action，并将它发给store
- Action: 动作消息，包含动作类型与动作描述
- Store: 数据中心，持有应用程序的数据，并会响应Action消息
- View: 应用视图，可展示Store数据，并实时响应Store的更新   
从通讯的角度还可将其视为Action请求层 -> Dispatcher传输层 -> Store处理层 -> View视图层

Flux应用中的数据以单一方向流动：
1. 视图产生动作消息，将动作传递给调度器。   
2. 调度器将动作消息发送给每一个数据中心。    
3. 数据中心再将数据传递给视图。   

单向数据流具有以下特点：
- 集中化管理数据。常规应用可能会在视图层的任何地方或回调进行数据状态的修改与存储，而在Flux架构中，所有数据都只放在Store中进行储存与管理。
- 可预测性。在双向绑定或响应式编程中，当一个对象改变时，可能会导致另一个对象发生改变，这样会触发多次级联更新。对于Flux架构来讲，一次Action触发，只能引起一次数据流循环，这使得数据更加可预测。
- 方便追踪变化。所有引起数据变化的原因都可由Action进行描述，而Action只是一个纯对象，因此十分易于序列化或查看。

#### 开始手写一个my-redux---本次项目使用TS开发
1. 初始化项目
  - 创建项目文件夹 mkdir myRedux
  - 安装依赖 npm run @types/node tslint typescript -D
  - 设置tsconfig配置 tsc --init，生成tsconfig.json文件
    > {
      "compilerOptions": {
        "lib": ["ES2015"],
        "module": "commonjs",
        "outDir": "dist",
        "sourceMap": true,
        "strict": true,
        "target": "es2015",
      },
      "include": [
        "src"
      ]
    }
  - 创建项目目录，已及配置package中的脚本
    - ![index](/img/redux/src.png)
2. 创建createStore方法   
  在原redux中，我们的使用方法是
  ```
  import { createStore } from 'redux';

  const initState = {
    milk: 0
  };

  function reducer(state = initState, action) {
    switch (action.type) {
      case 'PUT_MILK':
        return {...state, milk: state.milk + action.payload.count}
        case 'TAKE_MILK':
          return {...state, milk: state.milk - action.payload.count}
      default:
        return state
    }
  }

  let store = createStore(reducer);

  // subscribe其实就是订阅store的变化，一旦store发生了变化，传入的回调函数就会被调用
  // 如果是结合页面更新，更新的操作就是在这里执行
  store.subscribe(() => console.log(store.getState()));

  // 将action发出去要用dispatch
  store.dispatch({ type: 'PUT_MILK', payload: {count: 1 }});    // milk: 1
  store.dispatch({ type: 'PUT_MILK', payload: {count: 1 }});    // milk: 2
  store.dispatch({ type: 'TAKE_MILK', payload: {count: 1 }});   // milk: 1
  ```
  **接下来我们自己实现**     
  从上面看，我们主要使用了createStore，这个api，传入的参数主要是，reducer，返回的是一个store，store上有subscribe,dispatch,getState等api
  - store.subscribe: 订阅state的变化，当state变化的时候执行回调，可以有多个subscribe，里面的回调会依次执行。
  - store.dispatch: 发出action的方法，每次dispatch action都会执行reducer生成新的state，然后执行subscribe注册的回调。---这里是不是我们前面讲的订阅发布呢
  - store.getState:一个简单的方法，返回当前的state。
  ```
  function createStore(reducer: reducerType) {
    let state: any  // 记录状态
    let listeners: Array<() => void> = []  // 保持所有注册的回调

    // 订阅事件
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
  ```
  ![console](/img/redux/logo.png)
  3. 添加**combineReducers**方法
  当项目中的store树过于庞大的时候，例如在一个复杂网站编辑器的web项目中，需要有关于域名设置的store，关于商店的store，关于网站设置的store。
  实际调用时
  ```
  const reducer = combineReducers({milk: milkReducer, rice: riceReducer})
  ```
  分析得到，combineReducers方法，就是输入多个reducer，输入一个普通的reducer，
  ```
  function combineReducers(reducerMap: {[key: string]: any}) {
    const reducerKeys = Object.keys(reducerMap)
    // 转化为一个普通结构的reducer对象
    const reducer = (state:any = {}, action: any) => {
      // 整合store
      const newState:any = {}
      // 循环便利执行所有的reduce
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
  ```
  测试
  ```
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
  ```
  输入
  ```
  ➜  myRedux git:(main) ✗ yarn dev
  yarn run v1.22.4
  $ ./node_modules/.bin/tsc && node ./dist/index.js
  PUT_MILK
    dispatching { type: 'PUT_MILK', payload: { count: 1 } }
    { milk: { milk: 1 }, rice: { rice: 0 } }
    next state { milk: { milk: 1 }, rice: { rice: 0 } }
  PUT_MILK
    dispatching { type: 'PUT_MILK', payload: { count: 1 } }
    { milk: { milk: 2 }, rice: { rice: 0 } }
    next state { milk: { milk: 2 }, rice: { rice: 0 } }
  TAKE_MILK
    dispatching { type: 'TAKE_MILK', payload: { count: 1 } }
    { milk: { milk: 1 }, rice: { rice: 0 } }
    next state { milk: { milk: 1 }, rice: { rice: 0 } }
  ✨  Done in 2.48s.
  ```
  5. 添加applyMiddleware方法
    先看一下手写的logger middleware，已及调用结果
    ```
    import { storeType } from './type'
    function logger(store: storeType) {
      /**
      * next === dispatch方法，next为old dispatch的装饰器方法
      */
      return function(next: any) {
        // 返回一个新的dispatch，增强了dispatch
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
    ...
    let store = createStore(reducer, applyMiddleware(logger))
    ...
    ```
    1. createStore方法的修改，我们看到createStore方法新增了第二个参数，这个参数官方称为enhancer，顾名思义他是一个增强器，用来增强store的能力的。官方对于enhancer的定义如下：
      ```
      type StoreEnhancer = (next: StoreCreator) => StoreCreator
      ```
      上面的结构的意思是说enhancer作为一个函数，他接收StoreCreator函数作为参数，同时返回的也必须是一个StoreCreator函数。注意他的返回值也是一个StoreCreator函数，也就是我们把他的返回值拿出来继续执行应该得到跟之前的createStore一样的返回结构，也就是说我们之前的createStore返回啥结构，他也必须返回哈结构。       
      **修改createStore方法：**
      ```
      function createStore(reducer: reducerType, enhancer?: enhancerType) {
      let state: any  // 记录状态
      let listeners: Array<() => void> = []  // 保持所有注册的回调

      if (enhancer && typeof enhancer === 'function') {
        const newCreateStore = enhancer(createStore)
        const newStore = newCreateStore(reducer)
        return newStore
      }
      ...
      ```
    2.  可以看到我们let result = next(action);这行执行之后state改变了，前面我们说了要改变state只能dispatch(action)，所以这里的next(action)就是dispatch(action)，只是换了一个名字而已。而且注意最后一层返回值return function(action)的结构，他的参数是action，是不是很像dispatch(action)，其实他就是一个新的dispatch(action)，这个新的dispatch(action)会调用原始的dispatch，并且在调用的前后加上自己的逻辑。所以到这里一个中间件的结构也清楚了。
      - 中间件接收store作为参数，会返回一个函数
      - 返回的这个函数接收老的dispatch函数作为参数，会返回一个新的函数
      - 返回的新函数就是新的dispatch函数，这个函数里面可以拿到外面两层传进来的store和老dispatch函数
      **注：**这里就是设计模式中的装饰者模式，也是koa的AOP面向切片编程的一种事件      
      下面来实现我们的applyMiddleware
      ```
      function applyMiddleware(middleware) {
        function enhancer(createStore) {
          // 返回一个新增的createStore
          function newCreateStore(reducer) {
            const store = createStore(reducer)
            // dispatch的装饰器
            const decoratorDispatch = middleware(store)
            const { dispatch } = store
            const newDispatch = decoratorDispatch(dispatch)
            return {...store, dispatch: newDispatch}
          }
          return newCreateStore
        }
        return enhancer
      }
      ```
    方法的测试在上方的输出已经验证过了
    3. 增强applyMiddleware方法，多个中间件的情况下怎么过work。
      ```
      let store = createStore(reducer, applyMiddleware(logger, logger2))
      ```
      前面我们说过了，middleware(store),返回的是增强过的dispatch,但还是一个dispatch，每个middleware都是接受store和dispatch，所以多个中间应该是decoratorDispatch4(decoratorDispatch3(decoratorDispatch2(decoratorDispatch(dispatch))))，此时就用到了我们前面将的compose
      ```
      // 多个middleware，先解构出dispatch => newDispatch的结构
      const decorators = middlewares.map(middleware => middleware(store))
      // 用compose得到一个组合了所有newDispatch的函数
      const newDispatchGen = compose(...decorators)
      // 执行这个函数得到newDispatch
      const newDispatch = newDispatchGen(dispatch)
      ```
      完成的applyMiddleware方法：
      ```
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
      ```   
      **测试：**
      ```
      yarn run v1.22.4
      $ ./node_modules/.bin/tsc && node ./dist/index.js
      PUT_MILK
        dispatching { type: 'PUT_MILK', payload: { count: 1 } }
        { milk: { milk: 1 }, rice: { rice: 0 } }
        logger2
        next state { milk: { milk: 1 }, rice: { rice: 0 } }
      PUT_MILK
        dispatching { type: 'PUT_MILK', payload: { count: 1 } }
        { milk: { milk: 2 }, rice: { rice: 0 } }
        logger2
        next state { milk: { milk: 2 }, rice: { rice: 0 } }
      TAKE_MILK
        dispatching { type: 'TAKE_MILK', payload: { count: 1 } }
        { milk: { milk: 1 }, rice: { rice: 0 } }
        logger2
        next state { milk: { milk: 1 }, rice: { rice: 0 } }
      ✨  Done in 2.82s.
      ```
      完成！！！

#### 函数柯立化 
最后分享一个小知识，在该项目的`compose`方法边写时，一时想到了`函数柯立化`,故记录下来，分享。
>维基百科：在数学和计算机科学中，柯里化是一种将使用多个参数的一个函数转换成一系列使用一个参数的函数的技术。    
> 柯里化（Currying）是一种关于函数的高阶技术。它不仅被用于 JavaScript，还被用于其他编程语言。
柯里化是一种函数的转换，它是指将一个函数从可调用的 f(a, b, c) 转换为可调用的 f(a)(b)(c)。
柯里化不会调用函数。它只是对函数进行转换。
```
function curry(f) { // curry(f) 执行柯里化转换
  return function(a) {
    return function(b) {
      return f(a, b);
    };
  };
}

function sum(a, b) {
  return a + b;
}

let currieSum = curry(sum)
alert(curry(a)(b)) // a + b

// 更为高级的封装，在不确定传入的方法的参数需要多少个的时候，抽象的方法
function curry(func) {
  function curried(...args) {
    if (args.length >= func.length) {    //  当传入的参数大于或等于，func方法需要的参数时，运行该方法
      return func.apply(this, args);
    } else {
      return function pass(...args2) {   //  当传入的参数不够传入的func的参数时，再次调用curried方法
        return curried.apply(this, args.concat(args2));
      }
    }
  }
}
```
### 总结
1. 首先我们学习了`订阅发布模式`，这个是redux的基础架构，通过`subscribe`订阅事件，`dispatch`进行触发。
2. 然后我们学习了`函数式编程之Compose函数`,可以将多个嵌套调用的函数，给合成一个函数，为多个redux的多个中间件调用打下了基础
3. 我们首先学习了redux的核心思想，flux思想
  - 视图产生动作消息，将动作传递给调度器。   
  - 调度器将动作消息发送给每一个数据中心。    
  - 数据中心再将数据传递给视图。
4. 我们手写完成了mini版本的redux，其代码仓库在github: https://github.com/tonghuitop/myRudex

### 参考资料
官方文档：https://redux.js.org/
GitHub源码：https://github.com/reduxjs/redux
手写一个Redux，深入理解其原理: https://segmentfault.com/a/1190000023084074