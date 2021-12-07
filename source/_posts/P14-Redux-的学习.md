---
title: P14 Redux 的学习
tags: []
categories:
  - React
abbrlink: 2578506661
date: 2021-12-07 19:58:23
---

# JavaScript 纯函数

函数式编程中有一个概念叫纯函数，JavaScript 符合函数式编程的范式，所以也有纯函数的概念。

在 React 中，纯函数的概念非常的重要！

纯函数的维基百科定义：
在程序设计中，若一个函数符合以下要求，则它可能被认为是纯函数：
- 此函数在相同的输入值时，需产生相同的输出。函数的输出和输入值以外的其他隐藏信息或状态无关，也和由I/O设备产生的外部输出无关。
- 该函数不能有语义上可观察的函数副作用，诸如“触发事件”，使输出设备输出，或更改输出值以外物件的内容等。

简单总结：
- 确定的输入，一定会产生确定的输出
    - 确定的输出是指，不会因为一些变量的变化导致输出的不确定。
- 函数在执行过程中，不会产生副作用
    - 副作用 - 维基百科解释：函数副作用指当调用函数时，除了返回函数值之外，还对主调用函数产生附加的影响。例如修改全局变量（函数外的变量），修改参数或改变外部存储。

例子如下：

``` javascript
// 这是一个纯函数吗？ - Yes
function sum1 (num1, num2) {
    return num1 + num2
}
sum1(1, 2) // 3
sum1(1, 2) // 3
sum1(1, 2) // 3
sum1(1, 2) // 3

// 这是一个纯函数吗？ - No, 原因是这个函数会因为外部变量的变化导致不能产生确定的输出
let data2 = 1
function sum2 (num) {
    return data2 + num
}
sum2(2) // 3
data2 = 2
sum2(2) // 4

// 这是一个纯函数吗？ - Yes
const data3 = 1
function sum3 (num) {
    return data3 + num
}
sum3(2) // 3
data3 = 2 // 会导致报错，而无法更改
sum3(2) // 3

// 这是一个纯函数吗？ - No, 原因是这个函数会产生副作用，会更改输入
const obj = {
    name: 'lacy'
}
function getName (user) {
    user.name = 'jam'
    return user.name
}
getName(obj)
```

为什么纯函数在函数式编程中非常重要？
- 因为你可以安心的写和安心的用；
- 你在写的时候保证了函数的纯度，只需要专心去实现自己的业务逻辑即可，不需要关心传入的内容或者依赖其他的外部变量；
- 在用的时候，你确定你的输入内容不会被任意篡改，并且自己的确定的输入，一定会有确定的输出；

在 React 中，就要求我们无论是函数还是 class 声明一个组件，这个组件都必须想纯函数一样，保护它们的 `props` 不被篡改：

> React 非常灵活，但它也有一个严格的规则：
> 所有 React 组件都必须像纯函数一样保护它们的 `props` 不被更改。

# 为什么需要 Redux

1. JavaScript 开发的应用程序，已经变得越来越复杂了
    - 这些状态不再只是简单的对表单做个校验，也包括一些 UI 的状态，比如某些元素的选中，是否显示加载动效，分页等
2. 管理不断变化的 state 是非常困难的
    - 状态之间互相存在依赖，一个状态的变化会引起另一个状态的变化， View 页面也有可能会引起状态的变化
    - 当程序变得复杂时，state 在什么时候，因为什么原因而发生变化，发生了怎么样的变化，会变得非常难以控制和追踪
3. React 是在视图层帮助我们解决了 DOM 的渲染过程，但是 State 还是由我们自己来管理
    - 无论是组件定义自己的 state，还是组件间通信通过 props 进行传递；也包括通过 Context 进行数据之间的共享
    - React 主要负责帮助我们管理视图，state 如何维护最终还是我们自己决定

Redux 就是帮助我们管理 State 的容器：Redux 是 JavaScript 的状态容器，提供了可预测的状态管理；
Redux 除了和 React 一起使用外，它还可以和其他界面库一起来使用（比如 Vue ），并且它非常小（包括依赖在内，只有 2kb）

# Redux 的三大原则

1. 单一数据源
    1. 整个应用程序的 state 被存储再一棵 Object tree 中，并且这个 Object tree 只能存储一个 store 中；
    2. Redux 并没有强制要求我们不能创建多个 Store，但是那样子不利于数据的维护；
    3. 单一的数据源可以让整个应用程序的 state 变得方便维护、追踪、修改；
2. State 是只读的
    1. 唯一修改 State 的方法一定是触发 action，不要试图在其他地方通过任何的方式来修改 State；
    2. 这样子就确保了 View 或网络请求都不能直接修改 State，它们只能通过 action 来描述自己想要如何修改 state；
    3. 这样确保所有的修改都被集中化处理，并且严格按照顺序执行，不用担心 race condition（竟态）的问题。
3. 使用纯函数来执行修改
    1. 通过 reduce 将 旧state 和 action 联系在一起，并且返回一个新的 state
    2. 随着应用程序的复杂度增加，我们可以将 reduce 拆分成多个小的 reducers ，分别操作不同的 state tree 的一部分
    3. 但是所有的 reducer 都应该是纯函数，不能产生任何的副作用

# Redux 的使用

## Redux 流程图

首先先看一下大概的流程，有利于后续的理解

![Redux 流程图](image_1.png)

## Redux 的基本使用

目前环境下，我们只是在 Node 环境内做一个简单的使用。

``` javascript
// 1. 导入 Redux
const redux = require('redux')

// 2. 初始化的数据：initalState/defaultState
const initalState = {
    count: 0
}

// 3. 创建 reducer 方法 - 该方法必须是纯函数
function reducer (state = initalState/* 设置初始值 */, action) {
    // TODO: 根据 action.type 的不同更改 state 值
    // 示例：
    switch (action.type) {
        case "ADD_COUNT":
            return {...state, count: state.count + action.count}
        // ... 更多的其他 Type
        default:
            return state
    }
}

// 4. 利用 redux.createStore 方法 创建 store
const store = redux.createStore(/* 第一个参数是 reducer 方法 */ reducer)

// 如果想对 state 的变化做监听的话，可以使用 store.subscribe 方法。注意：必须在派发前！
store.subscribe(() => {
    console.log('state 发生了变化', store.getState())
})

// 5. 设置 actions && 派发（dispatch）action
const action1 = {type: "ADD_COUNT", count: 15}
// 派发
store.dispatch(action1)
```

以上就是一个简单的 redux 的流程。

## Redux 的模块化使用

只使用 node 时，我们期望采用 ES6 的方式导入文件那该如何操作呢？

1. 当 node 版本在 13.2.x 以下时有两步操作：在 package.json 中添加：
    ``` javascript
    {
        ...
        + "type": "module",
        "scripts": {
            - "start": "node ./index.js"
            + "start": "node --experimental-modules ./index.js" // 使用 Node 中的实验特性
        }
    }
    ```
2. 当 node 版本在 13.2.x 以上时，只需加入 `"type": "module"`