---
title: P4 React 组件化开发
tags: []
categories:
  - React
abbrlink: 1385832995
date: 2021-12-07 06:01:55
---

# 类组件

类组件定义有如下要求：

1. 组件的名称必须以大写字母开头（无论是类组件还是函数组件）
2. 类组件需要继承自 `React.Component`
3. 类组件中必须实现 `render` 方法

在 ES6 之前，可以通过 `create-react-class` 模块来定义类组件，但是目前官网建议我们使用 ES6 的类定义。

在使用 class 类定义时，需要注意：

1. `constructor` 是可选的，我们通常在 `constructor` 中初始化一些数据，并且在初始化数据前，**一定要执行 `super()`**
2. `this.state` 中维护的就是我们组件内部的数据
3. `render()` 方法是 class 组件中唯一必须实现的方法

# 组件化开发

> 通过 `create-react-app <英文项目名>` 生成项目

## 组件的定义方式

1. 类组件

一个简单的类组件：

``` javascript
import { Component } from "react";

class App extends Component {
    constructor () {
        super()
        this.state = {
            message: '你好啊 Jamediii'
        }
    }
    render () {
        return <h2>我是 APP 组件{this.state.message}</h2>
    }
}
```

2. 函数式组件

一个简单的函数式组件：

``` javascript
function App () {
    return (
        <div>
            <h2>你好啊，Jamediii</h2>
            <span>我是 function 组件：App 组件</span>
        </div>
    )
}
```

函数式组件的特点：

1. 没有 `this` 对象
2. 没有内部的状态
    - 由于该组件是一个函数，当你在内部创建变量时，其实是不会像 `state` 中的数据一样被保存的。
    - 当 `Hooks` 出现后，实现了能让 函数式组件 维护自己的状态，通过一个叫 `useState` 的方法内部进行创建状态，并且状态是可维护的。
3. 没有生命周期，也会被更新挂并挂载，但是没有生命周期函数

## render 方法的返回值

当 `render` 方法被调用时，它会检查 `this.props` 和 `this.state` 的变化并且返回以下类型之一：
1. **React 元素**：
    - 通常是 JSX 创建；
    - 例如，<div /> 会被 React 渲染为 DOM 节点，<MyComponent /> 会被 React 渲染为自定义组件；
    - 无论是 <div /> 还是 <MyComponent /> 均为 React 元素。
2. **数组 或者 fragments**：使得 `render` 方法可以返回多个元素
3. **Protals**：可以渲染子节点到不同的 DOM 树中
4. **字符串 或 数值类型**：它们在 DOM 中会被渲染成文本节点
5. **布尔值类型 或 null**：什么都不渲染

# 认识生命周期

- 很多事物都有从创建到销毁的整个过程，这个过程称之为**生命周期**
- React 组件也有自己的生命周期，了解组件的生命周期可以让我们在合适的地方完成我们想要的功能
- 生命周期和生命周期函数的关系：
    1. 生命周期只是一个抽象的概念，在生命周期的整个过程，分成了很多个阶段：
        - 比如装载阶段（Mount）：组件第一次在 DOM 树中被渲染的过程
        - 比如更新阶段（Update）：组件状态发生变化，重新更新渲染的过程
        - 比如卸载阶段（Unmount）：组件从 DOM 树被移除的过程
    2. React 内部为了告诉我们当前处于哪些阶段，会对我们组件内部实现的某些函数进行回调，这些函数就是生命周期函数：
        - 比如实现 componentDidMount 函数：组件已经被挂载到 DOM 上时，就会回调
        - 比如实现 componentDidUpdate 函数：组件已经发生了更新时，就会回调
        - 比如实现 componentWillUnmount 函数：组件即将被移除时，就会回调
        - 我们可以在这些回调函数中编写我们自己的逻辑代码，来完成自己的需求功能
    3. 我们谈 React 生命周期时，主要谈的类的生命周期，因为函数式组件是没有生命周期函数的；（后面可以通过 Hooks 来模拟一些生命周期的回调）

## 生命周期解析

[完整的生命周期普](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)

```
graph TB
    subgraph Unmounting 第三个阶段
    Unmounting-.-> b3[componentWillUnmount]
    end
    subgraph Updating 第二个阶段
    a2[New props]-.->d2[render]
    b2[setState 方法]-.->d2[render]
    c2[forceUpdate 方法]-.->d2[render]
    d2[render]-.->e2[React updates DOM and refs]
    e2[React updates DOM and refs]-->f2[componentDidUpdate]
    end
    subgraph Mounting 第一个阶段
    a1[constructor]-.->b1[render]
    b1[render]-.->c1[React updates DOM and refs]
    c1[React updates DOM and refs]-->d1[componentDidMount]
    end
```

> 方法 & 函数的区别：
> 1. 方法一般与某个实例联系在一起，没有的话，我们将其称为函数
> 2. 要看这个函数内部是否有默认的 this 绑定，和某个实例联系在一起。

### 演练生命周期

在单一组件内的生命周期与上面的过程无异，但是父子组件嵌套时：

``` javascript
/* 子组件 */
class Cpt extends Component {
    constructor(props) {
        super(props);
        console.log('触发 Cpt：constructor');
        this.state = {
            count: 0
        }
    }
    render () {
        console.log('触发 Cpt：render');
        return (
            <div>
                <h2>Cpt 子组件</h2>
                <h2>{this.state.count}</h2>
                <button onClick={e => this.addCount()}>+1</button>
            </div>
        )
    }
    addCount () {
        this.setState({
            count: this.state.count + 1
        })
    }
    componentDidMount () {
        console.log('触发 Cpt：componentDidMount');
    }
    componentDidUpdate () {
        console.log('触发 Cpt：componentDidUpdate');
    }
    componentWillUnmount () {
        console.log('触发 Cpt：componentWillUnmount');
    }
}
/* 父组件 */
class App extends Component {
    constructor(props) {
        super(props);
        console.log('触发 App：constructor');
        this.state = {
            message: 'Hello React',
            count: 0,
            isShow: true
        }
    }
    render() { 
        console.log('触发 App：render');
        return (
            <div>
                <h2>{this.state.message}</h2>
                <h2>{this.state.count}</h2>
                <button onClick={e => this.addCount()}>+1</button>
                <hr />
                <button onClick={e => this.changeCpt()}>切换</button>
                {this.state.isShow && <Cpt />}
            </div>
        );
    }
    addCount () {
        this.setState({
            count: this.state.count + 1
        })
    }
    changeCpt () {
        this.setState({
            isShow: !this.state.isShow
        })
    }
    componentDidMount () {
        console.log('触发 App：componentDidMount');
    }
    componentDidUpdate () {
        console.log('触发 App：componentDidUpdate');
    }
}
```

1. 挂载过程：
```
graph TB
    a[触发 App: constructor]-.->b[触发 App: render]
    b[触发 App: render]-.->c[触发 Cpt: constructor]
    c[触发 Cpt: constructor]-.->d[触发 Cpt: render]
    d[触发 Cpt: render]-.->e[触发 Cpt: componentDidMount]
    e[触发 Cpt: componentDidMount]-.->f[触发 App: componentDidMount]
    style a fill:#db5246
    style b fill:#db5246
    style f fill:#db5246
```

2. 更新阶段：
    1. 当点击父组件 +1 按钮时：
    ```
    graph TB
        a[触发 App: render]-.->b[触发 Cpt: render]
        b[触发 Cpt: render]-.->c[触发 Cpt: componentDidUpdate]
        c[触发 Cpt: componentDidUpdate]-.->d[触发 App: componentDidUpdate]
        style a fill:#db5246
        style d fill:#db5246
    ```
    2. 当点击子组件 +1 按钮时：
    ```
    graph TB
        a[触发 Cpt: render]-.->b[触发 Cpt: componentDidUpdate]
    ```

3. 销毁阶段：
    1. 当点击父组件的 切换 按钮使子组件销毁时：
    ```
    graph TB
        a[触发 App: render]-.->b[触发 Cpt: componentWillUnmount]
        b[触发 Cpt: componentWillUnmount]-.->c[触发 App: componentDidUpdate]
        style a fill:#db5246
        style c fill:#db5246
    ```
    2. 当再点击父组件的 切换 按钮使子组件创建时：
    ```
    graph TB
        a[触发 App: render]-.->b[触发 Cpt: constructor]
        b[触发 Cpt: constructor]-.->c[触发 Cpt: render]
        c[触发 Cpt: render]-.->d[触发 Cpt: componentDidMount]
        d[触发 Cpt: componentDidMount]-.->e[触发 App: componentDidUpdate]
        style a fill:#db5246
        style e fill:#db5246
    ```
    
### 生命周期方法

常用的生命周期：

1. constructor
    - 如果不初始化 `state` 或不进行方法绑定，则不需要为 React 组件实现构造函数
    - constructor 通常只做两件事：
        1. 通过给 `this.state` 赋值对象来初始化内部的 `state`
        2. 为事件方法手动绑定 `this` 实例
2. componentDidMount
    - componentDidMount 会在组件挂载后（插入 DOM 树中）立即调用
    - 在 componentDidMount 中通常进行哪些操作呢？
        1. 依赖 DOM 的操作可以在这里进行
        2. 在此处发送网络请求（官方建议）
        3. 可以在此处添加一些订阅（记得要在 componentDidUnmount 中取消订阅）
3. componentDidUpdate
    - componentDidUpdate 会在更新后被立即调用，首次渲染不会执行此方法
    - 当组件更新后，可以在此处对 DOM 进行操作
    - 如果你对更新前后的 props 进行了比较，也可以选择在此处进行网络请求了；（例如，当 props 未发生改变时，则不会执行网络请求）
4. componentDidUnmount
    - componentDidUnmount 会在组件卸载及销毁之前调用
    - 在此方法中执行必要的清理操作，例如：清除 time，取消网络请求或清除在 componentDidMount 中创建的订阅

不常用的生命周期：

1. getDerivedStateFromProps: state 的值在任何时候都依赖于 props 使用，该方法返回一个对象来更新 state
2. getSnapshotBeforeUpdate: 在 React 更新 DOM 前回调的一个函数，可以获取到 DOM 更新前的一些信息（比如 滚动位置），之后将数据在 componentDidUpdate 的第三个参数中有显示。
3. shouldComponenUpdate：该生命周期函数很常用，但是此方法仅作为性能优化的方式而存在！通过返回 true / false 来判断是否会进行重新渲染

# 认识组件的嵌套

组件间存在嵌套关系：
- 如果我们的一个应用程序将所有的逻辑放在一个组件中，那么这个组件将变得非常的臃肿和难以维护
- 所以组件化的核心思想应该是对组件进行拆分，拆分成一个个小的组件
- 再将这些组件组合嵌套在一起

## 组件间的通信

父组件在展示子组件，可能会传递一些数据给子组件：
- 父组件通过 **属性=值** 的形式来传递给子组件数据
- 子组件通过 `props` 参数获取父组件传递过来的数据

1. 父组件传递子组件 - 类组件和函数组件

简单的父传子，子显示父数据：

``` javascript
import React, { Component } from 'react';

/* 子组件 - 类组件 */
class Children extends Component {
    constructor(props) {
        super();
        this.props = props
    }
    render() { 
        return ( <h2>子组件展示数据：{`${this.props.name} is ${this.props.age} & ${this.props.height}`}</h2> );
    }
}

/* 父组件 */
class App extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() { 
        return(
            <div>
                <Children name="jam" age="18" height="171"/>
                <Children name="kobi" age="40" height="198"/>
            </div>
        );
    }
}
 
export default App;
```

在上面代码中，每次想从 父组件 中获取数据在子组件中显示时，都需要手动的去声明 `this.props = props` ，但其实每次都是从 `React.Component` 中继承出一个 组件类，可以通过 `super(props)` 实现在父类中对 `props` 的声明，之后子类通过从父类中继承过来，就可以直接使用。

而为什么子类的 `this.props`  中的 `this` 指的是子类中的 `this`，这就跟 extends 继承关键字有关了，在转成 es5 时，通过构造器.call(this, xx) 将子类的 `this` 传给父类中，然后在子类中得到父类实例数据，且此时绑定的 `this` 是子类的。

所以在子类中，可以简化成：

``` javascript
/* 子组件 - 类组件 */
class Children extends Component {
    /* 默认会实现以下语句 */
    /* constructor(props) {
        super(props);
    } */
    render() { 
        return ( <h2>子组件展示数据：{`${this.props.name} is ${this.props.age} & ${this.props.height}`}</h2> );
    }
}
```

函数式组件则更为简单：

``` javascript
function Children (props) {
    return ( <h2>子组件展示数据：{`${this.props.name} is ${this.props.age} & ${this.props.height}`}</h2> ); 
}
```

> 注意：函数式组件的性能会比类组件性能更高，所以尽量使用函数式组件
> 
> 原因是：因为类组件使用的时候要**实例化**，而函数组件直接执行函数取返回结果即可。

2. 子组件传递父组件

在某些情况，我们也需要子组件向父组件传递消息：
- 在 Vue 中是通过自定义事件来完成的；
- 在 React 中同样是通过 props 传递消息，只是让父组件给子组件传递一个**回调函数**，在子组件中调用这个函数即可。

3. 跨组件间通信

方案一：利用 `prop` 一层一层往下传

``` javascript
function ProfileHead (props) {
    return (
        <div>
            {props.name}:
            {props.age}
        </div>
    )
}

function Profile (props) {
    return (
        <div>
            <ProfileHead name={props.name} age={props.age}/>
            <ul>
                <li>数据1</li>
                <li>数据2</li>
                <li>数据3</li>
                <li>数据4</li>
                <li>数据5</li>
            </ul>
        </div>
    )
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: 'kobe',
            age: 44
        }
    }
    render() { 
        const {name, age} = this.state
        return (
            <div>
                <Profile name={name} age={age}/>
            </div>
        );
    }
}
```

> 可以利用一个技巧：属性展开（`...xxx`）,这里的 `...` 并不是 ES6 中的扩展运算符，而是 jsx 中的展开语法。具体内容在官网的[这里，全局搜索属性展开](https://zh-hans.reactjs.org/docs/jsx-in-depth.html)

这样子，就可以不用一个一个的输入 props 中的属性键值对了：

``` javascript
...
<Profile {...this.state}/>
...
<ProfileHead {...props}/>
...
```

方案二：React 提供的 API：Context
- Context 提供了一中在组件之间共享此类值的方式，而不必显式的通过组件树的逐层传递 props；
- Context 的设计目的是为了共享那些对于一个组件树而言是“全局”的数据，例如当前认证的用户、主题或首选语言
- Context 相关 API：
    - React.createContext
        - 创建一个需要共享的 Context 对象
        - 如果一个组件订阅了 Context，那么这个组件会从离自身最近的那个匹配的 Provider 中读取到当前的 context 值
        - defaultValue 是组件在顶层查找过程中没有找到对应的 Provider，那么就会使用默认值
        `const MyContext = React.createContext(defaultValue)`
    - Context.Provider
        - 每个 Context 对象都会返回一个 Provider React 组件，它会允许消费组件订阅 context 的变化
        - Provider 接收一个 value 属性，传递给消费组件
        - 一个 Provider 可以和多个消费组件有对应关系
        - 多个 Provider 也可以嵌套使用，里层的会覆盖外层的数据
        - 当 Provider 的 value 发生变化时，它内部的所有消费组件都会重新渲染
        `<MyContext.Provider value={/* 某个值 */} />`
    - Class.contextType
        - 挂载在 class 上的 contextType 属性会被重新赋值为一个由 React.createContext() 创建的 Context 对象
        - 这能让你使用 this.context 来消费最近的 Context 上的那个值
        - 你可以使用任何生命周期中访问它，包括 render 函数中
        `MyClass.contextType = MyContext`
    - Context.consumer
        - 这里，React 组件也可以订阅 context 变更，这能让你在 函数式组件 中完成订阅 context
        - 这里需要 函数作为子元素（function as child）这种做法
        - 这个函数接受当前的 context 值，返回一个 React 节点
        ```
        <MyContext.Consumer>
        {
            context => /* 基于 context 值进行渲染 */
        }
        </MyContext.Consumer>
        ```
        > 函数式组件，不需要进行 `MyClass.contextType = MyContext` 操作，否则会报警告：`Warning: xxx: Function components do not support contextType.`

## 参数的类型限制（`propTypes`）

对于传递给子组件的数据，有时候我们希望进行验证，特别是大型项目中。

当然，如果你的项目中集成了 `Flow` 或者 `TypeScript` 的话，那么直接就可以进行类型验证，

但是，即使我们没有集成了 `Flow` 或者 `TypeScript`，也可以通过 `prop-types` 来进行参数验证。

从 `React v15.5` 开始，`React.PropTypes` 已移入到另一个包中：`prop-types` 库，所以想用时需要对其进行引用。

> 一些简单的校验可以使用 `prop-types`，但如果是较为复杂的，期望使用 `TypeScript`。

在原有的函数式组件中，对字段进行类型限制：

``` javascript
/* 子组件 - 函数组件 */
function Children (props) {
    return ( 
        <div>
            <h2>子组件展示数据：{`${props.name} is ${props.age} & ${props.height}`}</h2>
            <ul>
                {
                    props.names.map(name => {
                        return <li>{name}</li>
                    })
                }
            </ul>
        </div>
     );
}

/* 想要验证时 */
Children.propTypes = {
    name: PropTypes.string.isRequired,
    age: PropTypes.number,
    height: PropTypes.number,
    names: PropTypes.array
}
/* 想要设置初始值时 */
Children.defaultProps = {
    name: 'Jamediii',
    age: 25,
    height: 171,
    names: ['jamediii', 'lacey']
}

/* 在类组件中也可以这样子设置 */
class Children2 extends Component {
    /* 必须要有 static 关键字，因为是在类上加该属性。 */
    static propTypes = {}
    static defaultProps = {}
}

```

> 当给组件设置 `defaultProps.xx` 时，即使该 `xx` 在 `propTypes.xx: PropTypes.isRequired` 也不会报警告。
>
> 所以这说明是通过该属性给 `props` 中的值设置初始值

当然也有其他的类型的校验，如有兴趣，可以查看官网，点[这里](https://reactjs.bootcss.com/docs/typechecking-with-proptypes.html)。

# React 实现类似 Vue 中的 Slot

> React 中并没有插槽(slot)这个概念的
>
> 原因是：jsx 太灵活了，jsx 既是一个变量，也是一个数据，所以可以直接传给我们的子组件的:
>
> jsx -> 数据 -> 子组件

在父组件 `App` 内：
``` javascript
import React, { Component } from 'react';
import NavBar from "./NavBar";
import "./style.css";

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {  }
    }
    render() { 
        return (
            <div>
                {/* 方案一：得按照顺序来放置插槽组件 */}
                <NavBar>
                    <span>aaa</span> {/* 插槽组件一 */}
                    <strong>bbb</strong> {/* 插槽组件二 */}
                    <a href="/#">ccc</a> {/* 插槽组件三 */}
                </NavBar>
                {/* 方案一：可以通过属性名称随意放置插槽组件 */}
                <NavBar2 leftSlot={<span>aaa</span>}
                         centerSlot={<strong>bbb</strong>}
                         rightSlot={<a href="/#">ccc</a>}/>
            </div>
        );
    }
}
 
export default App;
```

1. 通过 `prop.children[下标值]` 获取对应的插槽组件

``` javascript
const NavBar = (prop) => {
    const [left, center, right] = prop.children
    return (
        <div className="nav-bar">
            <div className="item left">
                {left}
            </div>
            <div className="item center">
                {center}
            </div>
            <div className="item right">
                {right}
            </div>
        </div>
    );
}
 
export default NavBar;
```

> 采用这种方案时，一般都是组件中只存在一个子组件时，否则就缺少了灵活性


2. 通过直接在组件上自定义属性，该属性值是插槽组件

``` javascript
const NavBar2 = (prop) => {
    const {leftSlot, centerSlot, rightSlot} = prop
    return (
        <div className="nav-bar">
            <div className="item left">
                {leftSlot}
            </div>
            <div className="item center">
                {centerSlot}
            </div>
            <div className="item right">
                {rightSlot}
            </div>
        </div>
    );
}
 
export default NavBar2;
```