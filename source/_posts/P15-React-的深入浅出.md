---
title: P15 React 的深入浅出(一)
tags: []
categories:
  - React
abbrlink: 1612587612
date: 2021-12-08 21:14:09
---

> 通过上一节[P14](https://bljj-dbld.github.io/posts/2578506661.html),我们基本的认识了 Redux 是如何编写与解耦，以及学习到 Redux 与 React 的基本结配合使用。

通过在组件内引入 `./store` 文件夹，利用 `store.getState`, `store.dispath`, `store.subscribue` 等方法与组件配合在一起使用，但其中存在着一些高重复性的代码，例如：

``` javascript
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

![connect 做用图](image_1.png)

将重复性代码删除后，组件内部就变得非常的简洁（注释掉的即要删除的重复性代码）

``` javascript
import React, { PureComponent } from 'react';
import store, {
    addCount,
    subCount
} from "../store";

class About extends PureComponent {
    /* state = store.getState() */
    render() {
        return (
            <>
                ABOUT
                <h2>当前值：{this.props.count}</h2>
                <button onClick={this.addCount}>+10</button>
                {/* <button onClick={this.subCount}>-5</button> */}
                <button onClick={this.props.dispatch(5)}>-5</button>
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
import React from 'react';
import store, {
    addCount,
    subCount
} from "../store";

export default function About(props) {
    render() {
        return (
            <>
                ABOUT
                <h2>当前值：{props.count}</h2>
                <button onClick={props.addCount(10)}>+10</button>
                <button onClick={props.dispatch(5)}>-5</button>
                <hr />
            </>
        );
    }
} 
```