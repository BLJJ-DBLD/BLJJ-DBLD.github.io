---
title: P15 React 的深入浅出
tags: []
categories:
  - React
abbrlink: 1612587612
date: 2021-12-08 21:14:09
---

# Redux 与组件的藕断丝连

## 使 Redux 更加复用

> 通过上一节[P14](https://bljj-dbld.github.io/posts/2578506661.html),我们基本的认识了 Redux 是如何编写与解耦，以及学习到 Redux 与 React 的基本结配合使用。

通过在组件内引入 `./store` 文件夹，利用 `store.getState`, `store.dispath`, `store.subscribue` 等方法与组件配合在一起使用，但其中存在着一些高重复性的代码，例如：

``` javascript
// About.js
...
// 通过 store.getState 方法获取 state 数据
state = {
	count: store.getState().count
}
...
componentDidMount () {
	// 订阅方法会返回一个对象，且是一个取消订阅方法
	this.unsubscribe = store.subscribe(() => {
		this.setState(store.getState())
	})
}
componentWillUnmount () {
	// 通过执行这个方法去注销订阅
	this.unsubscribe()
}
...
addCount () {
	store.dispatch(addCount(10))
}
subCount () {
	store.dispatch(subCount(5))
}
...
```

上面的代码，除了获取的数据可能不是 `count`；`dispatch` 的 `action` 函数不同以外，其余的都是具有重复性的。因此可以把不一样的东西抽离出来，公共的都放在一起去。

根据这个思想，我们可以在顶级目录内创建 `./utils/connect.js`，用来保存一个 `connect` 函数，将组件与 `redux` 通过这个函数连接在一起。

![connect 作用图](image_1.png)

将重复性代码删除后，组件内部就变得非常的简洁（注释掉的即要删除的重复性代码）

``` javascript
// About.js
import React, { PureComponent } from 'react';
import store, {
    addCount,
    subCount
} from "@/store";

class About extends PureComponent {
    /* state = store.getState() */
    render() {
        return (
            <>
                ABOUT
                <h2>当前值：{this.props.count}</h2>
                <button onClick={this.addCount}>+10</button>
                {/* <button onClick={this.subCount}>-5</button> */}
                <button onClick={this.props.subCount(5)}>-5</button>
                <hr />
            </>
        );
    }
    addCount () {
		this.props.addCount(10)
        /* store.dispatch(addCount(10)) */
    }
    /* subCount () {
        store.dispatch(subCount(5))
    } */
    /* componentDidMount () {
        // 订阅方法会返回一个对象，且是一个取消订阅方法
        this.unsubscribe = store.subscribe(() => {
            this.setState(store.getState())
        })
    }
    componentWillUnmount () {
        // 通过执行这个方法去注销订阅
        this.unsubscribe()
    } */
}
 
export default About;
```

最后再简化些就可以直接定义成 **函数式组件** 了

``` javascript
// About.js
import React from 'react';

export default function About(props) {
    return (
        <>
            ABOUT
            <h2>当前值：{props.count}</h2>
            <button onClick={props.addCount(10)}>+10</button>
            <button onClick={props.subCount(5)}>-5</button>
            <hr />
        </>
    );
} 
```

但是此时我们还不能从 `props` 中获取到相应的值与方法，因此我们就要借助 `connect` 函数来牵线搭桥。此时在 `connect.js` 文件内编写内容

``` javascript
// connect.js
import React, {PureComponent} from 'react';

export function connect (mapStateToProps, mapDispatchToProps) {
    // 返回一个 高阶组件（HOC），组件内部再返回一个类组件组件
    return function (ComponentWrapper) {
        return class extends PureComponent {
            render () {
                return <ComponentWrapper/>
            }
        }
    }
}
```

此时在 `About.js` 文件内，将 `connect` 函数添加

``` javascript
// About.js
...
+ import {connect} from '@/utils/connect'
...
// 此时 mapStateToProps, mapDispatchToProps 这俩参数还未定义，目前只是占位
+ connect(参数1, 参数2)(About) // 这样子，就对 About 组件做了增强
```

当我们想对 `About` 组件进行自定义增强时，就通过 参数1，参数2 来传值

``` javascript
// About.js
+ import {
    addCount,
    subCount
} from "@/store/actionCreator";
...
/* const mapStateToProps = {
    count: store.getState().count
};
const mapDispatchToProps = {
    addCount (num) {
        store.dispatch(addCount(num))
    }
    subCount (num) {
        store.dispatch(subCount(num))
    }
}; */
// 上面这般写是错误的，会导致还是需要依赖 store 对象
// 我们应该将这两个参数写成函数的形式，这么做的目的是，在 About 中由参数返回给我们 store.getState() / store.dispatch
const mapStateToProps = state => {
    return {
        count: state.count
    }
}
const mapDispatchToProps = dispatch => {
    return {
        addCount (num) {
            dispatch(addCount(num))
        }
        subCount (num) {
            dispatch(subCount(num))
        }
    }
}
...
- connect(参数1, 参数2)(About)
+ export default connect(mapStateToProps, mapDispatchToProps)(About)
```

此时我们就将参数传给了 `connect` 方法，就能在 `WrapperComponent` 中使用

``` javascript
// connect.js
import store from '@/store'
...
- return <ComponentWrapper/>
+ return <ComponentWrapper {
            ...this.props,
            ...mapStateToProps(store.getState()),
            ...mapDispatchToProps(store.dispatch)
        }/>
...
```

最后别忘记在返回的类组件内部对 `store.subscribe` 进行监听

``` javascript
// connect.js
...
constructor (props) {
    super(props)
    this.state = {
        storeState: mapStateToProps(store.getState())
    }
}
componentDidMount () {
    this.unsubscribe = store.subscribe(() => {
        this.setState({
            storeState: mapStateToProps(store.getState())
        }
    })
}
componentWillUnmount () {
    this.unsubscribe()
}
...
```

至此，就完成了 `About` 组件通过 `connet.js` 对 `Redux` 的使用

---

`connect.js` 的全部代码

``` javascript
import React, {PureComponent} from 'react'
import store from '@/store'

export function connect (mapStateToProps, mapDispatchToProps) {
    return function EnhanceHOC (ComponentWrapper) {
        return class extends PureComponent {
            constructor (props) {
                super(props)
                this.state = {
                    storeState: mapStateToProps(store.getState())
                }
            }
            render () {
                return <ComponentWrapper {
                    ...this.props,
                    ...mapStateToProps(store.getState()),
                    ...mapDispatchToProps(store.dispatch)
                }>
            }
            componentDidMount () {
                this.unsubscribe = store.subscribe(() => {
                    this.setState({
                        storeState: mapStateToProps(store.getState())
                    }
                })
            }
            componentWillUnmount () {
                this.unsubscribe()
            }
        }
    }
}
```

---

`About.js` 的全部优化后代码

``` javascript
import React from 'react'
import {connect} from '@/utils/connect'
import {
    addCount,
    subCount
} from "@/store/actionCreator";

function About (props) {
    return (
        <>
            ABOUT
            <h2>当前值：{props.count}</h2>
            <button onClick={props.addCount(10)}>+10</button>
            <button onClick={props.subCount(5)}>-5</button>
            <hr />
        </>
    )
}

const mapStateToProps = state => {
    return {
        count: state.count
    }
}
const mapDispatchToProps = dispatch => {
    return {
        addCount (num) {
            dispatch(addCount(num))
        }
        subCount (num) {
            dispatch(subCount(num))
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(About)
```

## 配合 context.js 实现通用性

假如我们想将 `connect.js` 上传到，这种情况下，`connect.js` 并不完全独立，而还需要手动的在 `connect.js` 中引入 `store`（有依赖）

因此，我们要想的是，**我们依然要拿到 `store` 但不是通过导入的方式**

我们在 `utils` 文件夹内再创建一个 `context.js`

``` javascript
// context.js
import React from 'react'

const StoreContext = React.createContext()

export {
    StoreContext
}
```

这样，我们就可以在 `connect.js` 中将 `store` 的引入去除

``` javascript
// connect.js

import React, {PureComponent} from 'react'
import {StoreContext} form './context'
- import store from '@/store'

export function connect (mapStateToProps, mapDispatchToProps) {
    return function EnhanceHOC (ComponentWrapper) {
        class EnhanceComponent extends PureComponent {
            - constructor (props) {
            + constructor (props, context) {
                - super(props)
                + super(props, context)
                this.state = {
                    - storeState: mapStateToProps(store.getState())
                    storeState: mapStateToProps(context.getState())
                }
            }
            render () {
                return <ComponentWrapper {
                    ...this.props,
                    - ...mapStateToProps(store.getState()),
                    - ...mapDispatchToProps(store.dispatch)
                    + ...mapStateToProps(context.getState()),
                    + ...mapDispatchToProps(context.dispatch)
                }>
            }
            componentDidMount () {
                - this.unsubscribe = store.subscribe(() => {
                + this.unsubscribe = context.subscribe(() => {
                    this.setState({
                        - storeState: mapStateToProps(store.getState())
                        + storeState: mapStateToProps(context.getState())
                    }
                })
            }
            componentWillUnmount () {
                this.unsubscribe()
            }
        }
        EnhanceComponent.contextType = StoreContext
        return EnhanceComponent
    }
}
```

最后在入口文件 `App.js` 中将 `store` 引入

``` javascript
// App.js
...
import { StoreContext } from "@/utils/context";
import store from "@/store";

ReactDOM.render(
  <React.StrictMode>
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
...
```

## 了解 react-redux 的使用

> 其实，上面的实现， `React` 已经帮我们做好了封装，那就是 `react-redux`，专门为 `React` 设计使用的，在使用，与我们自己的 `connect` & `context` 的使用是相似的。

首先我们在项目内安装 `react-redux`：`npm intsall react-redux --save`

我们在原先的基础上，对项目再做一些改动，在入口文件 `index.js` 中

``` javascript
// index.js
...
- import { StoreContext } from "./utils/context";
+ import { Provider } from "react-redux";
...
- <StoreContext.Provider value={store}>
+ <Provider store={store}>
    <App />
- </StoreContext.Provider>
+ </Provider>
...
```

之后我们在 `About` 组件也做一些改进

``` javascript
// About.js
...
- import connect from "../utils/connect";
+ import { connect } from "react-redux";
...
```

# Redux 内的异步操作

通过之前简单的案例，`redux` 中保存的 `count` 是一个本地定义的数据，但事实，真实开发中，`redux` 中保存的很多数据有可能来自服务器，我们需要进行异步的请求，再将数据保存到 `redux` 中。

## 简单的异步操作

### 将请求放在 `componentDidMount`

> 一般我们的想法都是，先进行异步请求然后等请求结果响应后，在将数据保存在 `redux` 中。如下图：

![一般网络请求图](image_2.png)

下面只展示出异步请求数据的组件代码，其他的与之前的相类似：

``` javascript
// GetDataByAxios.js
import React, {PureComponent} from 'react';
import { connect } from "react-redux";
import {
    getTableList,
} from "@/store";
import axios from "@/axios";

class GetDataByAxios extends PureComponent {
    componentDidMount () {
        axios.get(
            '/elementTable/list' // 自己定义的请求路径
        ).then((res) => {
            console.log(res);
            this.props.getTableList(res.data.rows)
        })
    }
    render() { 
        return (
            <>
                GetDataByAxios1
                <ul>
                    {
                        this.props.tableRows.map((item) => {
                            return <li key={item.date}>{item.date}</li>
                        })
                    }
                </ul>
                <hr />
            </>
        );
    }
}

const mapStateToPorps = state => ({
    tableRows: state.tableRows
})
const mapDispatchToProps = dispatch => {
    return {
        getTableList: (rows) => {
            dispatch(getTableList(rows))
        }
    }
}


export default connect(mapStateToPorps, mapDispatchToProps)(GetDataByAxios);
```
> 请求路径是从 [http://rap2.taobao.org/](http://rap2.taobao.org/) 这边做的✔

---

> 是否要将所有数据都放在 `redux` 中 ? 官方这边做了详细的解读 [点这里](https://redux.js.org/faq/organizing-state#organizing-state)

- 应用程序的其他部分是否关心这些数据？
- 您是否需要能够基于这些原始数据创建进一步的派生数据？
- 是否使用相同的数据来驱动多个组件？
- 能够将这种状态恢复到给定的时间点（即时间旅行调试）对您来说是否有价值？
- 您是否要缓存数据（即，如果它已经存在，则使用它的状态而不是重新请求它）？
- 您是否希望在热重载 UI 组件（交换时可能会丢失其内部状态）时保持此数据一致？

---

### 将请求放在 `Redux` 中管理

> 首先得认清楚一件事，在 `Redux` 中，默认是无法进行异步请求的。

在 `Redux` 中如何进行异步的操作呢？

答案是使用**中间件（Middleware）**

如下图：

![利用中间件](image_3.png)

#### `redux-thunk` 的使用

默认情况下的 `dispatch(action)`，`action` 是一个 javascript 对象。`redux-thunk` 可以是 `dispatch(action函数)`，action **可以是一个函数**。

`action` 函数会被调用，并且会传给这个函数一个 `dispatch` 函数和 `getState` 函数
- `dispatch` 函数用于我们之后再次派发 `action` 对象
- `getState` 函数考虑让我们可以便携获取之前的一些状态

在 './store' 入口文件 `index.js` 内，对 `store` 对象进行增强

``` javascript
// index.js
...
- const store = redux.createStore(reducer)
+ const store = redux.createStore(reducer, storeEnhancer)
...
```

而这个 `storeEnhancer` 从哪里来呢？

在 `redux` 中有个 `applyMiddleware` 的函数，用来应用一些中间件

``` javascript
// index.js
- import {createStore} from 'redux'
+ import {createStore, applyMiddleware} from 'redux'
// 应用一些中间件
const storeEnhancer = applyMiddleware(中间件1, 中间件2, 中间件3)
...
const store = redux.createStore(reducer, storeEnhancer)
...

```

当我们想引入 `redux-thunk` 时

``` javascript
// index.js
...
+ import thunkMiddleware from 'redux-thunk'

- applyMiddleware(中间件1, 中间件2, 中间件3)
+ const storeEnhancer = applyMiddleware(thunkMiddleware)
...
```

---

完整的 `index.js` 更改后代码是：

``` javascript
// index.js
import {createStore, applyMiddleware} from 'redux'
import reducer from './reducer.js'
import thunkMiddleware from 'redux-thunk'

const storeEnhancer = applyMiddleware(thunkMiddleware)
const store = createStore(reducer, storeEnhancer)

export default store
```
---

这样子，我们就完成了对 `store` 应用 `thunk` 中间件了。之后我们就可以在 `actionCretors.js` 中定义 `action` 函数。

代码如下：

``` javascript
// actionCretors.js
...
+ import axios from 'axios'
...
+ export const getAsyncData = (dispatch, getState) => {
    // 做一些异步操作，之后通过 dispatch 继续做常规操作
    axios.get(
        '/elementTable/list' // 自己定义的请求路径
    ).then((res) => {
        dispatch(getTableList(res.data.rows))
    })
}
...
```

在 `actionCretors.js` 中创建好 `action` 函数后，就可以在组件中，正常使用该 `action` 函数。

代码如下：

``` javascript
// GetDataByAxios.js
...
import {
    - getTableList,
    + getAsyncData
} from "@/store";
- import axios from 'axios'
...
componentDidMount () {
    - axios.get(
        '/elementTable/list' // 自己定义的请求路径
    ).then((res) => {
        console.log(res);
        this.props.getTableList(res.data.rows)
    })
    + this.props.getAsyncData()
}
...
const mapDispatchToProps = dispatch => {
    return {
        getAsyncData: (rows) => {
            - dispatch(getTableList())
            + dispatch(getAsyncData) // 注意！这里不再直接调用函数
        }
    }
}
...
```

##### redux-devtools 插件

> It can be used as a browser extension (for Chrome, Edge and Firefox), as a standalone app or as a React component integrated in the client app.

chrome 版安装地址【[点这里](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)】

其他版本请查阅 (GitHub 地址)[https://github.com/reduxjs/redux-devtools]

安装完毕后，还需要对代码进行增强才能够使用，具体的操作可查阅 (GitHub 地址)[https://github.com/zalmoxisus/redux-devtools-extension]

#### `react-saga` 的使用

在学习 `react-saga` 前，需要先复习一下 `Generator` 生成器函数。

先做特点总结：

1. `function` 函数关键字与函数名之间有一个星号
2. 函数体内部使用 `yield` 表达式
3. 返回一个遍历器对象，即内部指针对象
4. `next`方法的作用是分阶段执行迭代器。`next` 方法返回一个对象，`value` 属性就是当前`yield` 表达式的值，`done` 属性的 `false` 值，表示遍历还没有结束。
5. 通过向 `next` 方法内传值能向下传递。

----

直接上代码

``` javascript
// 1. 普通函数的定义
function f0 () {}
const result0 = f0()
console.log(result0)

// 2. 生成器函数的定义
// 生成器函数
function* f1 () {}
const result1 = f1()
console.log(result1)
```

上面的代码中，`result0` 和 `result1` 有区别吗？单从函数声明上看区别只是在生成器函数上加了个 “*” 符号（放置位置可选：`function* f1` 或者 `function *f1`）。但是结果却不同而语：

普通函数返回：`undefined`;

生成器函数返回： **iterator 迭代器**;

使用时也与平常的函数差别甚大。具体迭代器如何使用，如何返回数据，继续下文代码展示：

``` javascript
// 接上文代码
// 2. 生成器函数的定义
// 生成器函数
function* f1 () {
    yield "Hello";
    yield "World";
    yield "BLJJ-DBLD"
}
// iterator：迭代器
const result1 = f1()
// 3. 使用迭代器
const res1 = result1.next()
console.log(res1)
```

上文代码末尾的 `console` 输出什么呢？ 答案是输出一个对象：`{value: "Hello", done: false}`。

其中 `value` 代表的含义就是输出的结果。而 `done` 的布尔值代表什么含义呢？通过代码的继续执行，我们就可以揭晓了~

``` javascript
// 3. 使用迭代器
// 通过调用 next，就会消耗一次迭代器
const res1 = result1.next() // {value: "Hello", done: false}
const res2 = result1.next() // {value: "World", done: false}
const res3 = result1.next() // {value: "BLJJ-DBLD", done: false}
const res4 = result1.next() // {value: "", done: true}
```

从执行上可以看出，当迭代器消耗完毕后，再执行一次时， `done` 的结果就等于 `true`，因此我们可以得出结论， `done` 是用来**判断该迭代器是否结束**。

有趣的事情发生了，加入我们使用 `Generator + Promise`，配合 `setTimeout` 设计假的请求时又该如何的样子呢？

``` javascript
function* bar () {
    console.log(1)
    const result = yield new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Hello Generator')
        }, 3000)
    })
    console.log(result)
}
const it = bar()
```

此时，我们如何让 `result` 获取到 `resolve` 的值呢？

第一步，我们得清楚知道，迭代器消耗一次时，生成器函数内部都是如何在执行的：

``` javascript
// 接上文代码
// 执行 it 迭代器,会发生什么呢？
it.next()
// 此时会输出：
// 1
// Promise 对象
```

从上面代码可知，当消耗一次迭代器时，执行了 `log(1)`，返回了 Promise 对象。后续的 `result` 赋值和打印 `result` 的值并未执行。此时，我们如此写时：

``` javascript
it.next().value.then((res) => {
    it.next(res)
})
// 此时总体来会输出：
// 1
// 延缓 3000ms 后...
// Hello Generator
```

通过上面代码的执行， `Generator` 生成器函数内部执行的过程，我们大致就清楚了：

1. 当消耗一次迭代器时，只会执行当前 `yield` 之前及当前的语句， `result = ` 也当属于此次 `yield` 后的执行内容。
2. 当再次执行 `it.next()` 方法时，向其内传输数据，将会赋值给 `result`。

