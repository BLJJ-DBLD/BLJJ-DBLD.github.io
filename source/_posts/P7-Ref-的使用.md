---
title: P7 Ref 的使用 & 受控/非受控组件
abbrlink: 1331800139
date: 2021-12-07 06:50:28
tags: []
categories:
  - React
---

# 1. 如何使用 ref

> 在 React 的开发模式中，通常情况下不需要、也不建议直接操作 DOM 元素，但是在某些特殊情况下，确实需要获取到 DOM 进行某些操作，比如：
> 1. 管理焦点，文本选择或媒体播放
> 2. 触发强制动画
> 3. 集成 第三方 DOM 库

如何创建 ref 来获取对应的 DOM？目前有三种方式：
1. 字符串（过时 API）
2. 对象（React 推荐的方式）
3. 函数

## 1.1 字符串：` ref = "xxx"`

- （官方回答）我们不建议使用它，因为 string 类型的 refs 存在 [一些问题](https://github.com/facebook/react/pull/8333)。**它已过时并可能会在未来的版本被移除。**
    - 链接中的内容翻译过来：
        - 它要求React跟踪当前渲染的组件（因为它无法猜测）。这使React变慢了一点。
        - 它不能像大多数望人期的那样使用“渲染回调”模式（例如 `<DataGrid renderRow = {this.renderRow} />`），因为基于上述原因，引用将被放置在 `DataGrid` 上。

``` javascript
...
{/* 1. ref=字符串 */}
<h2 ref="titleRef">hello world</h2>
<button onClick={e => {
    this.refs.titleRef.innerText = 'hello React'
}}>修改文案 By ref=字符串</button>
...
```

## 1.2 对象：`ref = {this.xxx}`

> 并不是任意的对象都能够被赋值 `ref` 的，必须是通过执行 `React.createRef` 方法创建出来的。

``` javascript
// 1. 先获取到 createRef 方法
import React, { Component, createRef } from 'react';
// 2. 一般都是在构建方法中对 ref 对象进行创建的
constructor (props) {
    super(props)
    this.titleRef = createRef()
}
...
// 3. 实现手法
{/* 2. ref=对象 */}
<h2 ref={this.titleRef}>hello world</h2>
<button onClick={e => {
    console.log(this.titleRef); // 获取到一个对象 {current: h2}
    this.titleRef.current.innerText = 'hello JavaScript'
}}>修改文案 By ref=对象</button>
...
```

## 1.3 回调函数：`ref = {(el) => xxx}`

``` javascript
{/* 3. ref=回调函数 */}
<h2 ref={(arg) => {
    console.log({arg}); // 获取到合成 DOM
    this.titleEl = arg
}}>hello world</h2>
<button onClick={e => {
    console.log(this.titleEl);
    this.titleEl.innerText = 'hello TypeScript'
}}>修改文案 By ref=回调函数</button>
```

# 2. ref 的类型

ref 的值根据节点的类型而有所不同：
- 当 ref 属性用于 html 元素时，构造函数中使用 `React.createRef` 方法创建的 ref 接收底层 DOM 元素作为其 current 属性；
- 当 ref 属性用于自定义 class 组件时，ref 对象接收组件的挂挂载实例作为其 current 属性；
- **你不能在函数式组件上使用 ref 属性**，原因是它们没有实例，只是个函数。

ref 属性用于自定义 class 组件案例关键代码：

``` javascript
...
<Counter ref={this.counterRef}/>
<button onClick={e => {
    console.log(this.counterRef); // {current: Counter}
    // 子组件中存在 changeText() 方法
    this.counterRef.current.changeText()
}}>修改子组件 By ref=对象</button>
...
```

函数式组件是没有实例的，所以无法通过 ref 获取它们的实例：
- 但是某些时候，可能想要获取函数式组件内部的**某一个 DOM 元素**；
- 这个时候我们可以通过 `React.forwardRef` 高阶函数（`HOC`）,后面也会学习 hooks 中如何使用 ref。
- 如果你使用 16.2 或更低版本的 React，或者你需要比 ref 转发更高的灵活性，也可以使用替代方案将 ref 作为特殊名字的 prop 直接传递。

利用 `React.forwardRef` 方法实现：

``` javascript
const CustomTextInput1 = forwardRef((props, ref) => {
    return (
        <input ref={ref} />
    )
})

...
// constructor 方法中：
this.inputEl1 = createRef()
// render 的 return 中：
{/* 访问函数组件中内部 DOM 元素 - 使用 ref 转发 (forwardRef())  */}
<CustomTextInput1 ref={this.inputEl1} />
<button onClick={e => {
    console.log(this.inputEl1);
}}>check CustomTextInput1-input </button>
...
```

替代方案实现：

``` javascript
function CustomTextInput2 (props) {
    return (
        <input ref={props.inputRef} />
    )
}

...
// constructor 方法中：
this.inputEl2 = null
// render 的 return 中：
{/* 访问函数组件中内部 DOM 元素 - 将 ref 作为特殊名字的 prop 直接传递 */}
<CustomTextInput2 inputRef={el => {
    console.log(el);
    this.inputEl2 = el
}} />
...
```

# 3. 受控组件

在 HTML 中，表单元素（如 `<input>`、 `<textarea>` 和 `<select>`）通常自己维护 state，并根据用户输入进行更新。而在 React 中，可变状态（mutable state）通常保存在组件的 state 属性中，并且只能通过使用 `setState()` 来更新。

比如下面的 HTML 表单元素：
- 这个处理方式是 DOM 默认处理 HTML 表单行为，在用户点击提交时会提交到某个服务器中，并且刷新页面；
- 在 React 中，并没有禁止这个行为，它依然是有效的；
- 但是通常情况下会使用 JavaScript 函数来方便的处理表单提交，同时还可以访问用户填写的表单数据；
- 实现这种效果的标准方式是使用 “受控组件”；

``` javascript
...
constructor(props) {
    super(props);
    this.state = {value: ''}
}
render() { 
    return (
        <form onSubmit={e => this.handleSubmit(e)}>
            <label>
                名字：
                <input type="text" value={this.state.value} onChange={e => this.handleChange(e)} />
            </label>
        </form>
    );
}
handleChange (e) {
    this.setState({
        value: e.target.value
    })
}
handleSubmit (e) {
    alert('提交的名字：' + this.state.value)
    e.preventDefault()
}
...
```

> 引用官方的一句话：
> 1. 使 React 的 state 成为“唯一数据源”。
> 2. 渲染表单的 React 组件还控制着用户输入过程中表单发生的操作。
> 
> 结论：被 React 以这种方式控制取值的表单输入元素就叫做“受控组件”。

| Element | Value property | Change callback | New value in the callback |
| --------- | ---------------- | ------------------ | -----------------------|
| `<input type="text" />` | `value={string}` | `onChange` | `event.target.value` |
| `<input type="checkbox" />` | `checked={boolean}` | `onChange` | `event.target.checked` |
| `<input type="radio" />` | `checked={boolean}` | `onChange` | `event.target.checked` |
| `<textarea />` | `value={string}` | `onChange` | `event.target.value` |
| `<select />` | `value={option.value}` | `onChange` | `event.target.value` |

# 4. 非受控组件

> 在大多数情况下，我们推荐使用 **受控组件** 来处理表单数据。在一个受控组件中，表单数据是由 React 组件来管理的。另一种替代方案是使用 **非受控组件**，这时表单数据将交由 DOM 节点来处理。
> 
> 注意：
> 1. 在 React 渲染生命周期时，表单元素上的 `value` 将会覆盖 DOM 节点中的值。在非受控组件中，你经常希望 React 能赋予组件一个初始值，**但是不去控制后续的更新**。 在这种情况下, 你可以指定一个 `defaultValue` 属性，而不是 `value`。在一个组件已经挂载之后去更新 `defaultValue` 属性的值，不会造成 DOM 上值的任何更新。
> 2. 在 React 中，`<input type="file" />` 始终是一个非受控组件，因为它的值只能由用户设置，而不能通过代码控制。

1. 一般的组件使用非受控组件时：

``` javascript
constructor(props) {
    super(props);
    this.input = createRef() // 记得在 react 模块包内解构获取到 createRef 方法
}
render() { 
    return (
        <form onSubmit={e => this.handleSubmit(e)}>
            {/* 非受控组件 */}
            <label>
                名字：
                {/* 需要设置默认值时，应该使用 defaultValue 属性 */}
                <input
                    type="text"
                    defaultValue="巴拉巴拉"
                    ref={this.input}
                    onChange={e => this.handleChange(e)}/>
            </label>
            <input type="submit" />
        </form>
    );
}
handleChange (e) {
    this.setState({
        value: this.input.current.value
    })
}
handleSubmit (e) {
    alert('提交的名字：' + this.input.current.value)
    e.preventDefault()
}
```

2. file 类型时（必须由用户自己来设置）：

``` javascript
constructor(props) {
    super(props);
    this.fileInput = createRef()
}
render() { 
    return (
        <form onSubmit={e => this.handleSubmit(e)}>
            <input type="file" multiple ref={this.fileInput} onChange={e => this.handleChange(e)} />
            <input type="submit" />
        </form>
    );
}
handleChange (e) {
    console.log(this.fileInput);
}
handleSubmit (e) {
    e.preventDefault()
    alert(
        `Selected file - ${this.fileInput.current.files[0].name}`
    );
}
```