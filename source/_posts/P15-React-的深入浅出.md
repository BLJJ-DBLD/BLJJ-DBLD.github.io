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

## 最后 react-redux 的使用

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

# 组件内的异步操作

通过之前简单的案例，`redux` 中保存的 `count` 是一个本地定义的数据，但事实，真实开发中，`redux` 中保存的很多数据有可能来自服务器，我们需要进行异步的请求，再将数据保存到 `redux` 中。

## 简单的异步操作

### 将请求放在 `componentDidMount`

> 一般我们的想法都是，先进行异步请求然后等请求结果响应后，在将数据保存在 `redux` 中。如下图：

![一般网络请求图](image_2.png)

下面只展示出异步请求数据的组件代码，其他的与之前的相类似：

``` javascript
// GetDataByAxios
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

