---
title: P2 jsx 语法
abbrlink: 2450581629
tags: []
categories:
  - React
date: 2021-12-07 05:56:26
---

# 认识 JSX

看一段代码：

``` javascript
const element = <h2>Hello World</h2>
ReactDOM.render(element, document.getElementById("app"))
```

- 在这段 `element` 变量的声明右侧赋值的标签语法是什么呢？
    - 它不是一段字符串（因为没有使用 引号 包裹），它看上去是一段 HTML 原生，但是我们能在 js 中直接给一个变量赋值 html 吗？
    - 其实是不可以的，如果我们将 `script` 标签上的 `type="text/babel"` 属性去掉，那么就会出现语法错误。
    - 它到底是什么呢？ 其实它是一段 jsx 语法。

- jsx 是什么？
    - jsx 是一种 JavaScript 的语法扩展，在很多地方被称为 JavaScript XML ，因为看起来就是一段 XML 语法；
    - 它用于描述我们的 UI 界面，并且其完全可以和 JavaScript 融合在一起使用
    - 它不同于 Vue 中的模板语法，你可以不用专门学习模板语法中的一些指令（比如 `v-if, v-else, v-bind, v-for`）

- jsx 的书写规范
    - jsx 的顶层**只能有一个根元素**，所以我们很多时候会在外层包裹一个 `div`，或者使用 `Fragment` 包裹
    - 为了方便阅读，我们通常会在 jsx 的外层包裹一个小括号`()`，这样方便阅读，并且 jsx 可以进行换行书写
    - jsx 中的标签可以是单标签，也可以是双标签
        - 注意：如果是单标签，必须以 `/>` 结尾（即使用严格语法）

# 为什么 React 选择了 JSX

- React 认为渲染逻辑本质上与其他 UI 逻辑存在内在耦合
    - 比如 UI 需要绑定事件（button、a 原生等等）
    - 比如 UI 中需要展示数据状态，在某些状态发生改变时，又需要改变 UI

- 他们之间是密不可分的，所以 React 没有将标记分离到不同的文件中，而是组合在了一起

# JSX 的使用

## jsx 中的注释

> 推荐使用一种，如下：

``` javascript
{/**/}
```

## jsx 中嵌入变量

- 情况一：当变量是 `Number, String, Array` 类型时，可以直接显示。
- 情况二：当变量是 `null, undefined, Boolean` 类型时，内容为空；
    - 如果希望可以显示 `null, undefined, Boolean`，需要转成字符串
        - 转换的方法有很多，比如在 `Boolean` 类型中使用 `toString` 方法。
        - `null, undefined` 它们没有 `toString` 方法，可以是利用 `String()` 方法，或者是和 空字符串（""） 做拼接
- 情况三：对象 类型不能作为子元素（not valid as a React child）。但是 数组 类型可以

## jsx 绑定属性

- 元素中的 title 属性
- img 元素中的 src 属性
- a 元素中的 href 属性
- 元素需要绑定 class 类
- 原生使用内联样式 style

### 绑定普通属性

1. 比如每个元素都有的一个属性：`title`
2. 比如 `img` 中的 `src` 属性中需要动态的添加路径。 

``` javascript
...
constructor () {
    this.state = {
        message: 'hello world',
        imgSrc: 'http://p1.music.126.net/vb_M0LwztnrUE61_LtyEaw==/109951165799377902.jpg'
    }
}
render () {
    const {message, imgSrc} = this.state
    return (
        <div>
            {/* 1. 绑定普通的属性 */}
            <p title={message}>Hello World</p>
            <img src="this.getSizeImage(imgSrc, 160)" alt="图片" />
        </div>
    )
}
function getSizeImage (url, size) {
    return url + `?param=${size}y${size}`
}
...
```

### 绑定 className(html 中的 class)

> 在 render 中的 return 中，编写的是 jsx 语法。而 class 在语法中是代指类。与 html 中的 class 有冲突，所以在 jsx 中将 html 中的 class 需要写成 className。诸如此类的，还有比如 label 中的 for 属性，在 jsx 中需要写成 htmlFor。

``` javascript
...
{/* 2. 绑定 class 类 */}
{/* 在 jsx 中 class 是一个关键词，所以并不能使用 html 中的 class 属性名，而要改成使用特定的名称： className */}
<div className="title body">我是 div 元素</div>
{/* 还有就是比如说在 label 中的 for 属性名。在 jsx 中 for 应该是遍历关键字，所以需要改为：htmlFor */}
<label htmlFor=""></label>
...
```

### 绑定 style 属性

> 需要注意的是要分清楚两层花括号的含义。

``` javascript
{/* 3. 绑定 style 内容 */}
{/* 一定要清楚，第一个花括号是表示在里面写 js 代码。第二个花括号是表示在里面是要写一个对象 {} */}
{/* 还有一点，属性名必须是驼峰式 */}
<div style={{color: "red", fontSize: "20px"}}>我是div，我绑定了 style 属性</div>
```

## jsx 绑定事件

### 通过 `bind` 显示绑定 this

``` javascript
...
constructor () {
    super()
    this.state = {
        message: 'Hello World',
        counter: 100
    }
    console.log(this);
    this.bindClick = this.bindClick.bind(this)
}
...
{/* 方案一：通过 bind 绑定 this(显示绑定) */}
{/* 
    这样子做的坏处有二：
    1. 需要每次通过 bind 绑定，重复性代码偏多; 解决方案：在 构造器(constructor) 中手动一次性绑定
    2. 
*/}
<button onClick={this.bindClick.bind(this)}>按钮1</button>
<button onClick={this.bindClick}>按钮2</button>
<button onClick={this.bindClick}>按钮3</button>
...
```

### 利用箭头函数的特性

1. 在类中定义变量，赋值其箭头函数方法

``` javascript
...
{/* 方案二：定义函数时，使用箭头函数 */}
<button onClick={this.increment}>+1</button>
...

// 首先得清楚，箭头函数中永远不会绑定 this，只会通过上下文查找
// 这样子 相当于在 ES6 中给每个对象都添加了个 increment 属性。
increment = () => {
    console.log(this.state.counter);
}
```

2. 在给元素绑定事件时，直接传入一个箭头函数（**推荐**）

``` javascript
...
{/* 
    方案三：通过在绑定时，直接传入一个箭头函数，优点颇多，也是最推荐的一种
    1. 虽然跟方案二相比只是在绑定时采用箭头函数，但是却不会给每个实例中添加各自的同名属性方法
    2. 还可以方便的往绑定的函数中添加参数
*/}
<button onClick={() => {this.decrement('name')}}>-1</button>
...
decrement (name) {
    console.log(this.state.counter, name);
}
```

### 向绑定事件中添加参数

> 这时，就体现出了在事件绑定时，直接利用箭头函数的优势了！

在原生事件绑定中，我们需要手动的将 event 传给事件函数。

``` javascript
<button onclick="btnClick(this, event)">按钮</button>
<script>
    function btnClick (dom, event) {
        console.log(dom, event);
    }
</script>
```

而在 jsx 中，react 已经默认的通过回调，将 event 传递给绑定方法了。

> 有一个注意点是，bind 在三种改变 this 指针方法中优先级最高！

``` javascript
...
constructor () {
    super()
    this.state = {
        message: 'Hello World',
        movies: ['大话西游', '流浪地球', '正义联盟', '阿凡达']
    }
}
render () {
    // 使用 () 的原因是将内部的内容当作一个整体
    return (
        <div>
            <button onClick={this.btnClick}>jsx 按钮</button>

            <ul>
                {
                    this.state.movies.map((item, index) => {
                        return (
                            <li
                                key={index}
                                onClick={e => {this.liClick(e, index, item)}}>
                                {item}
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    );
}
btnClick (event) {
    console.log(event);
}
liClick (event, index, item) {
    console.log(event, index, item);
}
...
```

## jsx 中的条件渲染

1. 方案一：通过 `if` 判断，适合逻辑代码多的情况
2. 方案二：通过 三元运算符
3. 方案三：利用 逻辑与（一个条件不成立时，后面的条件将都不会执行）

``` javascript
constructor () {
    super()
    this.state = {
        isLogin: true
    }
}
render () {
    const {isLogin} = this.state
    // 方案一：if 语句判断
    let welcome = null
    if (isLogin) {
        welcome = "欢迎回来~"
    } else {
        welcome = "请先登录"
    }

    // 使用 () 的原因是将内部的内容当作一个整体
    return (
        <div>
            <h2>{welcome}</h2>
            {/* 方案二：三元运算符 */}
            <button onClick={() => this.btnClick()}>{isLogin ? '退出' : '登录'}</button>
            <hr />
            {/* 方案三：逻辑与 */}
            <h2>{isLogin && '你是傻吊'}</h2>
        </div>
    );
}

btnClick () {
    this.setState({
        isLogin: !this.state.isLogin
    })
}
```

## jsx 中的列表渲染

> 多去了解 Array 中的纯函数，比如：`map, slice, filter` 等

``` javascript
constructor () {
    super()
    this.state = {
        message: 'Hello World',
        movies: ['大话西游', '流浪地球', '正义联盟', '阿凡达'],
        numbers: [100, 221, 21, 43, 430, 10, 50]
    }
}
render () {
    const {movies, numbers} = this.state
    // 使用 () 的原因是将内部的内容当作一个整体
    return (
        <div>
            <h2>电影列表</h2>
            <ul>
                {
                    movies.map(item => <li>{item}</li>)
                }
            </ul>
            <h2>数字列表（筛选大于50）</h2>
            <ul>
                {
                    numbers.filter(item => item >= 50).map(item => <li>{item}</li>)
                }
            </ul>
            <h2>数字列表（截取 [2, 5)）</h2>
            <ul>
                {
                    numbers.slice(2, 5).map(item => <li>{item}</li>)
                }    
            </ul>
        </div>
    );
}
```

## jsx 的本质

- 实际上，jsx 仅仅只是 `React.creatElement(component, props, ...children)` 函数的语法糖。
    - 所有的 jsx 最终都会被转换成 React.createElement 的函数调用
    - babel 在中间的角色是：jsx -> babel -> React.creatElement()
- React.createElement 在源码的什么位置？ 项目下 -> packages -> react -> src -> ReactELement.js 中的 `createElement` 函数
- createElement 需要传递的三个参数：
    - 参数一：type
        - 当前 ReactElement 类型；
        - 如果是 标签元素（比如 `div, p` 等） 或者 组件元素，那么直接使用字符串名称表示即可
    - 参数二：config
        - 所有的 jsx 中的属性都在 config 中以对象的属性 & 值的形式存储
    - 参数三：children
        - 存放在标签内的内容，以 children 数组的方式存储；
        - 当然如果是多个元素，React 内部会对它们做处理

### jsx 的基本写法

使用 jsx 的语法写出来的代码，最终会通过 babel 将其转换成 `React.createELement()` 的形式。

`message1` 就是 jsx 的语法所编写的，如果没有在 script 中通过 `type='text/babel'` 明确指出是采用的 babel，那样子就会出现错误。
而 `message2` 却不需要。

``` javascript
<script>
    // const message1 = <h2>hello world</h2>
    const message2 = React.createElement('h2', null, 'hello world')
    ReactDOM.render(message2, document.getElementById('app'))
</script>
```

### jsx 的 bable 转换

其实上面我已经简单的做了个 jsx -> babel 的例子了。

当 jsx 中根元素下的包含多个子元素时， `React.createElement` 将如何编写呢？

首先看看采用 jsx 的语法编写

``` javascript
render () {
    // 使用 () 的原因是将内部的内容当作一个整体
    return (
        <div>
            <div className="header">
                <h1 className="title">我是标题</h1>
            </div>
            <div className="content">
                <h2>我是页面内容</h2>
                <button>按钮</button>
                <button>+</button>
                <a href="">baidu.cn</a>
            </div>
        </div>
    );
}
```

像如上的情况，同级的子标签元素，将继续在 `React.createElement()` 的参数中添加，内部元素则时按照再创建一个 `React.createElement` 继续。
利用 babel 的官网提供的[编辑器](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=false&spec=false&loose=false&code_lz=DwEwlgbgfAUABAupJwMYBsCGBnbA5TAWwFMBeAIgAtjMRiAnc2RFpSgRjS1wJIoBcw_dMSaBEI0D0ZoHALQBkZwAPQdmiBeGjwVarjnxEy5VAHsAdv2KmmG1mwBMUSYFcMwEbpgUMVAndoLKdq62AAjAFd-fhMoQEhjQDqUhUDg0J8WfyCQ4ygAamikuOsEYEw4SnpiADMKJj9MMBAAgDpUYwVMZRz5NVhVSCggA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=false&presets=env%2Creact&prettier=false&targets=&version=7.13.11&externalPlugins=)，我们可以清楚的看出：

``` javascript
const App = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
className: "header"
}, /*#__PURE__*/React.createElement("h1", {
className: "title"
}, "\u6211\u662F\u6807\u9898")), /*#__PURE__*/React.createElement("div", {
className: "content"
}, /*#__PURE__*/React.createElement("h2", null, "\u6211\u662F\u9875\u9762\u5185\u5BB9"), /*#__PURE__*/React.createElement("button", null, "\u6309\u94AE"), /*#__PURE__*/React.createElement("button", null, "+"), /*#__PURE__*/React.createElement("a", {
href: ""
}, "baidu.cn")));

ReactDOM.render(App, document.getElementById('app'))
```

> /*#__PURE__*/: 含义是说明该 `React.createElement` 函数是一个纯函数。在 React 中纯函数尤其重要

## 虚拟 DOM 创建过程

我们是通过 `React.createElement` 最终创建出一个 ReactElement 对象

而这个 ReactElement 对象的作用是什么呢？为什么 React 要创建它呢？

- 原因就是 React 利用 ReactElement 对象组成了一个 **JavaScript 对象树**；
- JavaScript 对象树就是大名鼎鼎的**虚拟 DOM (Virtual DOM)**；
- 之后再由虚拟 DOM 树通过 `ReactDOM.render()` 方法构建成真实的 DOM 树。

由这个 JavaScript 对象树组成我们的 **树结构**

> 树结构：数据结构概念中的一种组织数据的方式。
>
> 我们构建的 JavaScript 树与 DOM 树是一一对应的。

``` javascript
class App extends React.Component {
    constructor () {
        super()
        this.state = {
            message: 'Hello World'
        }
    }
    render () {
        // jsx -> babel -> React.createElement() -> ReactElement 对象树(虚拟 DOM 树) -> ReactDOM.render() -> 真实 DOM 树

        // 在 React Native 中，只是最后一步不一样
        // jsx -> babel -> React.createElement() -> ReactElement 对象树(虚拟 DOM 树) -> ReactDOM.render() -> 原生控件(IOS 中的 UIButton 等)
        // 使用 () 的原因是将内部的内容当作一个整体
        const elementObj = (
            <div>
                <h2>{this.state.message}</h2>
            </div>
        );
        console.log(elementObj); // {$$typeof: Symbol(react.element), type: "div", key: null, ref: null, props: {…}, …}
        return elementObj
    }
}

ReactDOM.render(<App />, document.getElementById('app'))
```

> jsx -> babel -> React.createElement() -> ReactElement 对象树(虚拟 DOM 树) -> ReactDOM.render() -> 真实 DOM 树

### 为什么使用虚拟 DOM

- 为什么要采用虚拟 DOM，而不是直接修改真实的 DOM 呢？

1. 很难跟踪状态发生的改变：原有的开发模式，我们很难跟踪到状态发生了改变，不方便我们针对程序进行调试；
2. 操作真实的 DOM 性能特别低：传统的开发模式会进行频繁的 DOM 操作，而这一做法性能非常低。

比如，我们有一组数据需要渲染：[0, 2, 4, 6]，我们会怎么做呢？

- 我们可以通过 ul & li 进行展示

但是后来，我们又新增了数据：[0, 2, 4, 6, 8, 10]，做显示时，我们可能有两种方案

1. 方式一：重新遍历整个数组（不推荐）
2. 方式二：在 ul 后面再追加 li

但是不管是哪种方法，都是非常低效的。因为我们通过 document.createElement 创建元素，再通过 ul.appendChild() 方法渲染到 DOM 上，会进行多次的 DOM 操作；当然对于批量操作，最好的办法不是一次次修改 DOM，而是对批量的操作进行合并；（比如可以通过 DocumentFragment 生成一块游离在 DOM 树外的元素，之后进行统一合并）。

### 命名式编程向声明式编程的转换

- **虚拟 DOM 帮助我们从命令式编程转到了声明式编程的模式**
- React 官方的说法：Virtual DOM 是一种编程理念
    - 在这个理念中，UI 以一种理想化或者虚拟化的方式保存在内存中，并且它是一个相对简单的 JavaScript 对象；
    - 我们可以通过 ReactDOM.render 让虚拟 DOM 和 真实 DOM 同步起来，这个过程中叫做协调(Reconciliation)
- 这种编程方式赋予了 React 声明式 API：
    - 你只需要告诉 React 希望 UI 是什么状态；
    - React 来确保 DOM 和这些状态是匹配的；
    - 你不需要直接进行 DOM 操作，就可以从手动更改 DOM，属性操作、事件处理中解放出来！