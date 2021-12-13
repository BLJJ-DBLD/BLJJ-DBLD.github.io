---
title: P5 setState 详细解析 & React 性能优化
tags: []
categories:
  - React
abbrlink: 3526460681
date: 2021-12-07 06:03:26
---

# 为什么使用 setState

在开发中，我们并不能直接通过修改 state 的值来让界面发生更新，因为 React 并没有实现类似 Vue2 中 Object.definedProerty 或者 Vue3 中的 Proxy 的方式监听数据的变化；我们必须通过 setState 来告知 React 数据发生了改变

> 在组件中并没有实现对 setState 的方法，为什么可以调用呢？
>
> 原因是，setState 是从 Component 中继承过来的。

# setState 是异步更新的？我们来探究一下

## 为什么 setState 设计为异步呢？

1. setState 设计为异步，可以显著的提升性能；
    - 如果每次调用 setState 都进行一次更新，那么意味着 render 方法会被频繁调用，界面重新渲染，这样效率会很低；
    - 最好的办法应该是获取到多个更新，之后进行批量更新
2. 如果同步更新了 state，但是还没有执行 render 函数，那么父组件内的 state 与子组件内的 prop 将不能保持同步。
    - state 和 props 不能保持一致，会在开发中产生很多的问题

## 如何获取异步的结果

方式一：通过 setState 的第二个参数（回调函数）等待更新后，再去获取具体的值

``` javascript
...
<!-- setState(更新的 state 属性, 回调函数) -->
this.setState({
    message: this.state.message
}, () => {
    console.log(this.state.message)
})
...
```

方式二：在 `componentDidUpdate` 方法中获取到更新后的当前值

``` javascript
...
componentDidUpdate() {
    console.log(this.state.message)
}
...
```

> 方式二会在方式一之前被调用到。

## setState 一定是异步的吗？

> 首先说出结论：不一定的。

其实是分为两种的：
- 在组件生命周期或 React 合成事件中，setState 是异步的；
- 在 `setTimeout` 或者原生 `DOM` 事件内，setState 是同步的；

### 什么是 React 的合成事件？为什么要这样子做？

1. 什么是 React 的合成事件：指的是 jsx 中的事件绑定，例如 `onClick` 等此类事件。甚至于，合成事件内的 `event` 对象也是 React 合成的。
2. 为何要如此做法：
    - 因为 React 不仅仅想要跑在浏览器中，当我们使用的是 React-Native 的话，是跑在原生的手机上的。
    - 我们在 React 的 render 方法内编写的都是 jsx 代码，当跑在浏览器上，那就意味着到时候浏览器产生的 DOM 事件对象 `event` 给到 React；
    - 如果 React 是跑在原生手机上时，就需要给到原生控件的对象。
    - 所以，当你在写这个代码的时候， React 是不明确你到底跑在哪个平台上的
    - 既然不明确，那 React 就将这个事件对象改成合成对象。
    - 改成合成对象后的好处是：如果是跑在浏览器中，我就将浏览器事件对象与我的其他属性 合成到 合成对象当中；如果是跑在原生当中，我就将 `Button` 或者其他原生控件的相关属性与我的其他属性 合成到 合成对象当中。

> 总结：合成对象 `event` 会根据不同的平台（浏览器 / 原生）会发生相应的变化。

### 在 React 当中，到底是如何决定是同步还是异步的？

> 探究源码：
>
> 总结：React 源码当中做过一个判断，它会根据我们当前处于的上下文不同情况来返回当前这里到底是同步的还是异步的 

# setState 中的合并

## setState 中的**数据**合并

上源码讲解：

``` javascript
...
 this.state = { message: 'Hello World', name: 'jamediii' }
...
changeMessage () {
    this.setState({
        message: 'hello jamediii'
    })
}
...
```

此时的 `name` 并不会消失，因为在 React 对 state 的更新手法是：`Object.assgin({}, prevState, partialState)`

## setState 中自身的合并

依旧上源码：

``` javascript
...
increment () {
    this.setState({
        count: this.state.count + 1
    });
    this.setState({
        count: this.state.count + 1
    });
    this.setState({
        count: this.state.count + 1
    });
}
...
```

这个是之前的计数器案例，此时我多次调用 `setState` 方法，输出的 count 会是多少呢？

> 结论：会输出 `1`

为什么不是 `3` 呢？
- 原因是： React 会对 `setState` 方法进行内部合并，虽然被调用了三次，但是会被合并成一个对象，而这一个对象（最后调用的 `setState` 对象），才是最终我们更新的的对象。

如果我们将代码修改为：

``` javascript
increment () {
    this.setState({
        count: this.state.count + 1
    });
    this.setState({
        count: this.state.count + 2
    });
    this.setState({
        count: this.state.count + 3
    });
}
```

按照之前的结论，每次输出是：+ `3`

但是，有时我们有并不希望是当前的结果，我们希望的是每一次调用 `setState` 后获取到的结果累加。此时，`setState` 方法的第一个参数可以为函数这个优点就有所体现了，但是需要注意的是，为函数时，需要传递参数。

上代码：

``` javascript
increment () {
    this.setState((prevState, props) => {
        return {
            count: prevState.count + 1
        }
    });
    this.setState((prevState, props) => {
        return {
            count: prevState.count + 1
        }
    });
    this.setState((prevState, props) => {
        return {
            count: prevState.count + 1
        }
    });
}
```

> 结论是：输出 `3`; ohhhhhhhh!

> 总结来说：根据 `setState` 的第一个参数是指 对象，还是 函数，会有不同的操作。
>
> 1. 当参数是对象时，会对多个 `setState` 只会合并并且只会将最后一次的 `setState` 方法进行执行
>
> 2. 当参数时函数时，会对多个 `setState` 进行合并，但是，会将每次的函数都执行一次；函数中需要至少传递一个参数 `prevState` 指代的是上一次执行后的 `state` 值，在此基础上就可以在上次的前提下进行累加操作了。

# React 的更新机制

React 的渲染流程：`jsx -> 虚拟 DOM -> 真实 DOM`

React 的更新流程：`props/state 改变 -> render 方法的重新执行 —> 会产生新的虚拟 DOM 树 -> 新旧虚拟 DOM 树作 diff 比较 -> 计算出差异进行更新 -> 更新到真实的 DOM 上`

每一次进行比较更新时，即使是最先进的算法，该算法的复杂程度为 `O(n^3)`，其中 `n` 是指树中元素个数。

假如页面中展示 1000 个元素，那所需要的执行的计算量将在 十亿的量级范围；这种开销太过昂贵，会使得 React 更新性能变得非常低效。

于是，React 对算法进行了优化，将其优化成了 `O(n)`，具体的优化过程：
- 只会对同层节点之间相互比较，不会跨节点比较；
- 新旧 DOM 树上，同层的节点发生类型改变时，会重铸该节点及以下的所有节点；
- 开发中，可以通过 `key` 来指定哪些节点在不同的渲染下保持稳定；

1. 情况一：对比不同类型的元素，会触发 `componentUnmount -> componentDidMount`
	- 当节点为不同的元素，React 会拆卸原有的树，并且建立起新的树
	- 比如下面的代码：React 会销毁 Counter 组件并且重新装载一个新的组件，而不会对 Counter 进行复用。
		``` javascript
		// 原先的 jsx 
		<div>
			<Counter />
		</div>
		// 更新后的 jsx
		<span>
			<Counter />
		</span>
		```
2. 情况二：对比同一类型的元素，会触发 `componentDidUpdate`
	- 当比较两个相同类型的 React 元素时，React 会保留 DOM 节点，仅对比更新有改变的属性。
	- 比如下面的代码：通过比较，React 知道只需要修改 DOM 元素上的 className 属性
		``` javascript
		// 原先的 jsx
		<div className="before" title="stuff" />
		// 更新后的 jsx
		<div className="after" title="stuff" />
		```
	- 又比如，当更新 style 中的某个属性时，React 仅更新有所更变的属性。
	- 通过对比这两个元素，React 知道只需要修改 DOM 元素上的 color 样式，无需修改 fontWeight
		``` javascript
		// 原先的 jsx
		<div style={{color: 'red', fontWeight: 'blod'}} />
		// 更新后的 jsx
		<div style={{color: 'green', fontWeight: 'blod'}} />
		```
3. 情况三：对子节点进行递归
	- 默认条件下，当递归 DOM 节点的子元素时，React 会同时遍历两个子元素的列表，当产生差异时，生成一个 mutation。
	- 当只是向列表的尾部插入数据时，不会有什么影响，但如果是向列表的中间或者头部插入数据时，就会导致插入的数据之后的元素重新构建，即使没有任何变化。
	- 此时， `key` 的出现，就是为了优化这一点，它会比较列表中每一项的 key & 元素是否一致，一致时就不会被重构，只会将位置进行置换。
	- 使用 `key` 时需要注意的是：
		- key 应该是在当前根节点下唯一的；
		- key 尽量不要使用随机数
		- 使用 index 作为 key 时，对性能是没有优化的

## render 方法被无效调用

我们在使用之前的一个嵌套案例：当 App 中，我们增加一个计数器的代码；当点击 +1 时，会重新调用 render 方法，而当 App 的 render 方法被调用时，所有的子组件的 render 方法也会被重新调用；

那么，只要根组件的 render 被重新调用，那所有子组件也需要被迫重新 render，当进行 diff 算法时，性能必然很低；

事实上，很多的组件只要没有涉及到自身的更改时，是没有必要重新 render 的，它们调用 render 时应该有一个前提，那就是依赖的数据（state / props）发生了更新，再调用自己的 render 方法

那如何自由的控制组件内的 render 是否被调用呢？答案是通过 `shouldComponentUpdate` 方法即可；

### shouldComponentUpdate 方法

React 提供了一个生命周期方法 `shouldComponentUpdate`，这个方法接受参数。并且需要有返回值：

- 该方法有两个参数（nextProps, nextState）均返回最新的参数数据。
- 该方法返回值是一个 boolean 类型：
  - 当返回值为 true 时，那就会调用 render 方法
  - 当返回值为 false 时，将不会调用 render 方法
  - 默认返回是 true，也就是只要 state 发生改变，就会调用 render 方法

> `shouldComponentUpdate` 方法虽好，但是也会有两个问题：
>
> 1. 需要在每一个组件内一次次的声明该方法
> 2. 无法对函数组件使用该方法

### PureComponent 类

只能是类组件通过继承 `PureComponent` 类：

1. 检测该组件中是否有使用 shouldComponentUpdate 方法。
   1. 当组件内使用了该方法时，就会按照该方法的输出来决定是否进行 render。
   2. 当未使用时，在 `PureComponent` 类中会通过 `checkShouldComponentUpdate` 方法对新旧 `props, state, context` 比较，当返回 true 时才会进行 render。
2. 比较时，只是进行浅层比较。
3. 不建议在 `shouldComponentUpdate` 中进行深层比较或使用 `JSON.stringify()`，原因是这样非常影响效率，且会损害性能。
> 一般情况下，基本可以使用 `PureComponent` 来代替 `Component` 的使用。因为 `PureComponent` 在一定程度上能够优化我们的性能。

上代码：

``` javascript
import {PureComponent} from 'react'

class Children extends PureComponent {
    render () {
        return (
        	<div>子组件</div>
        )
    }
}
```

### memo 高阶函数组件

> 高阶函数组件：能够对一个函数操作并且返回一个函数

上代码：

``` javascript
import {memo} from 'react'

// 函数式组件
const MemoChildren = memo(function Children () {
    return (
    	<div>子组件</div>
    )
})
```

---

# 钻个🐂尖

## 深入理解 `setState` 的“异步”

Q: `setState` 为什么给人的感觉是异步的？

A:
在 `setState()` 之后无法立即获取到最新的 `state`

Q: 那为什么 `React` 要把状态的更新设计成这种方式呢？直接 `this.state.count = 1` 不好吗？

A:
首先，`this.state.count = 1` 这般做法是不能触发更新。 `React` 与 `Vue` 不同，`Vue` 是响应式系统（Reactivity System），在 Vue3 中通过 `Proxy` 监听对象或 Vue2.x 中通过 `Object.defineProperty` 监听对象的属性来实现更新视图的。而 `React` 是通过 `setState()` 触发更新视图的。

`React` 设计成这种方式的原因，设计者已经正面回答了。[点这里](https://github.com/facebook/react/issues/11527#issuecomment-360199710)。总结起来：

- 保证内部的一致性：即使 `state` 是同步更新，`props` 也不是。（你只有在父组件重新渲染时才能知道`props`）
- 将 `state` 的更新延缓到最后批量合并再去渲染对于应用的性能优化是有极大好处的，如果每次的状态改变都去重新渲染真实dom，那么它将带来巨大的性能消耗。

Q: `setState` 真的是异步吗？

A:
其实不然，`setState` 内部是没有编写异步代码的。它只是模拟了异步的行为。就像上文说的，`setState` 根据**上下文环境**来判断是异步更新还是同步更新。再通俗点是，`React` 会维护一个标识（`isBatchingUpdates`），判断是直接更新还是先暂存 state 到队列。

而这个上下文环境指的是执行 `setState` 方法时，是在 合成方法和钩子函数【1】 中，还是在 原生事件和 `setTimeout`【2】 中。在 【1】 中会表现成 “异步”，在 【2】 中时会表现成 同步。并且在 “异步” 状态下，`setState` 会进行批量更新优化，对同一个值进行多次 `setState`，`setState` 的批量更新策略会对其进行覆盖，去最后一次的执行；如果是同时多个值进行多次 `setState`，则会合并批量更新。