---
title: P11 React 中的样式
tags: []
categories:
  - React
abbrlink: 388776449
date: 2021-12-07 19:34:11
---

# 组件化下的 CSS

CSS 的设计就不是为组件化而生的，所以在目前组件化的框架中都在需要一种合适的 CSS 解决方案。

在组件化中选择合适的 CSS 解决方案应该符合以下条件：
- 可以编写局部 CSS：CSS 具备自己的局部作用域，不会随意污染其他组件内的元素
- 可以编写动态的 CSS：可以获取当前组件的一些状态，根据状态的变化生成不同的 CSS 样式
- 支持所有的 CSS 特性：伪类、动画、媒体查询等
- 编写起来简洁方便、最好符合一贯的 CSS 风格

事实上，CSS 一直是 React 的痛点，也是被很多开发者吐槽、诟病的一个点。

在这一点上，Vue 会相对性的更好：
- Vue 通过在 .vue 文件内编写 `<style></style>` 标签来编写自己的样式
- 通过是否添加 `scoped` 属性来决定编写的样式是全局有效还是局部有效
- 通过 `lang` 属性来设置你喜欢的 less、sass 等预处理器
- 也可以通过内联风格的方式来根据最新的状态设置和改变 CSS

相比较而言，React 官方并没有给出 React 中统一的样式风格，由此，从普通的 CSS，到 CSS in JS，有几十种不同的解决方案，上百个不同的库。

# 内联样式 & 普通的 CSS 引入

内联样式 配合 普通的 CSS 引入是官方推荐的 css 样式的写法

## 1. 内联样式

内联样式：
- style 接受采用小驼峰命名属性的 JavaScript 对象，而不是 CSS 字符串
- 并且可以引用 state 中的状态来设置相关的样式

优点：
1. 内联样式之间不会有冲突
2. 可以动态的获取当前 state 中的状态

缺点：
1. 写法上都需要使用驼峰标识，与普通的写法风格不一致
2. 样式没有提示语
3. 大量的样式，会导致代码混乱
4. 某些样式无法编写（例如伪类 、 伪元素）

## 2. 普通的 CSS 引入

通常会编写到一个单独的文件内，之后直接引入 

优点：
1. 普通的风格编写 CSS 样式
2. 支持所有的 CSS 风格

缺点：
1. 容易出现样式覆盖
2. 编写起来颇为繁琐

# CSS modules

> 注意：CSS modules 并不是 React 特有的解决方案，而是所有使用了类似于 webpack 配置的环境下都可以使用的。
> 但是，如果想要使用，就必须配置在 webpack.config.js 中对 css-loader 中的 modules: true 。

React 脚手架已经内置了 CSS modules 的配置：
- .css/.less/.scss 等样式文件都修改为 .module.css/.module.less/.module.scss 后就可以直接引用了。

优点：
- CSS modules 确实解决了局部作用域的问题。

缺点：
- 引用的类名，不能使用连接符（.home-title），连接符在 JavaScript 中是无法识别的
- 所有的 className 必须使用 {style.className} 的形式编写。
- 不便于动态修改某些样式，依然需要使用内联样式的方式进行操作

案例代码：

创建 `xx.module.css` 文件，按照普通的 CSS 样式编写，这里创建 `style.module.css`：

``` css
.title {
    color: cadetblue;
}
```

之后在 `App.js` 中像模块一样引入 `import style from './style.module.css'` ，而不是直接引入一个文件 `import 'xx.css'`，之后模块中的 类名（例如 `.title`）就是 变量名（例如 `style.title`）

``` javascript
...
import style from './style.module.css'
...
render() { 
    return (
        <p className={style.title} />
    );
}
...
```

# CSS in JS

“CSS-in-JS” 是指一种模式，其中 CSS 由 JavaScript 生成而不是在外部文件中定义。

> 注意：此功能并不是 React 的一部分，而是由**第三方库提供**。 React 对样式如何定义并没有明确态度；如果存在疑惑，比较好的方式是和平时一样，在一个单独的 *.css 文件定义你的样式，并且通过 className 指定它们。

在传统的前端开发中，我们通常会将结构（HTML）、样式（CSS）、逻辑（JavaScript）进行分离。

但是，React 的思想中认为逻辑本身和 UI 是无法分离的，所以才会有 JSX 的语法。其中样式也是属于 UI 中的一部分的。

实际上，CSS-in-JS 的模式就是一种将样式 CSS 也写入到 JavaScript 中的方式，并且可以方便的使用 JavaScript 的状态；所以 React 也有被人称为 ALL in React。

当然，事物都两面性，也有人认为 CSS 不应该写入 JavaScript 中，[点这里](https://hackernoon.com/stop-using-css-in-javascript-for-web-development-fa32fb873dcc)

不同的声音虽然有，但是在我们看来优秀的 CSS-in-JS 的库依然非常强大、方便：
- CSS-in-JS 通过 JavaScript 来为 CSS 赋予一些能力，包括类似于 CSS 预处理一样的样式嵌套、函数定义、逻辑服用、**动态改状态**等
    - 虽然 CSS 预处理器也具备一些能力，但是获取动态状态依然是一个不好处理的点
  
所以，目前 CSS-in-JS 是 React 编写 CSS 最为受欢饮的一种解决方案。

目前比较流行的 CSS-in-JS 的库有很多，但目前最流行的 CSS-in-JS 库非 `styled-components` 。

在了解 CSS-in-JS 前，得再在说说模板字符串，说到模板字符串，大家都会使用。但是 **标签模板** 我想很少有用到。标签模板的一个重要应用，就是过滤HTML字符串，防止用户输入恶意内容。

## 1. 标签模板

> 标签模板是在反引号前面引入一个标签（tag）。该标签是一个函数，处于定制化模用于板字符串后返回值。

模板字符串的使用：

``` javascript
const name = 'jam'
const age = 18
const message = `my name is ${name}, age is ${age}`
console.log(message); // my name is jam, age is 18
```

标签模板字符串的使用：

``` javascript
function test (...age) {
    console.log(age)
}
const name = 'jam'
const age = 18
test`my name is ${name}, age is ${age}`  // [ [ 'my name is ', ', age is ', '' ], 'jam', 18 ]
```

tag 函数中的参数：
- 第一个参数是一个数组，该数组的成员是模板字符串中那些没有变量代替的部分。
- 之后的参数会是变量所代表的值。

此时，我写以下语句：

``` javascript
test`
    font-size: 5px;
    color: ${props => props.color};
`
```

`styled-components` 就是在标签模板的前提下实现的。

## 2. `styled-components` 的使用

首先，`styled-components` 是第三方库插件，所以需要引入 React 项目中：`yarn add styled-components`

上案例：

``` javascript
/* 1. 在项目中先引入该模块 */
import styled from "styled-components";

/* 2. 使用 styled 中的方法生成 React 组件 */
const AppWrapper = styled.div`
    div {
        color: red;
        font-size: 24px;
    }
    .title {
        background-color: blue;
    }
    .polifile {
        li {
            color: #12f3;
            list-style: none;
            text-decoration: underline;
            &.title {
                color: chartreuse;
                &::before {
                    content: "ABC-";
                }
            }
            &:hover {
                cursor: pointer;
                color: red;
            }
        }
    }
`

function Home(props) {
    return (
        <div className="title">
            <h2>Home</h2>
        </div>
    )
}
function Polifile(props) {
    return (
        <ul className="">
            <li className="title">Polifile</li>
            <li>1</li>
            <li>2</li>
            <li>3</li>
            <li>4</li>
        </ul>
    )
}

class App extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {  }
    }
    render() { 
        return (
            /* 3. 在项目中使用。 */
            <AppWrapper>
                <p className="title">APP</p>
                <Home />
                <Polifile />
            </AppWrapper>
        );
    }
}
```

案例中，`styled.div` 是一个方法，但是并不是像使用普通方法一样调用它，而是使用 **标签模板字符串（``）** 来直接调用。
    - 1. 在 `styled` 这个对象中，有多种标签方法，比如 `styled.span`、`styled.h2` 等等。
    - 2. 该方法会返回一个 React 组件。
    - 3. 使用 `styled-components` 时，也会有 `Less`、`Sass` 类似的语法。

当我们使用 `styled-components` 时，并不像直接使用 CSS 一样，会有样式的高亮与提示，所以这里我们会安装一个 VScode 插件来辅助我们使用 `styled-components`：[vscode-styled-components](https://marketplace.visualstudio.com/items?itemName=jpoissonnier.vscode-styled-components)

### 2.1 使用 `styled-components` 特点

1. props 穿透
``` javascript
...
const InputWrapper = styled.input`
    background-color: red
`
...
render() { 
    return (
        /* 3. 在项目中使用。 */
        <>
            <input type="password" />
            <InputWrapper />
        </>
    );
}
```

![未设置 props 穿透前](image_1.png)

从图上，能看到两个 `input` 标签，普通标签能够直接使用标签的属性，那由 `styled-components` 创建的 React 组件呢？
其实，在组件上设置的属性能够穿透到内部设置的普通元素上。

``` javascript
<InputWrapper type="password" />
```

![props 穿透后](image_2.png)


2. attrs 的使用
``` javascript
const AppWrapper = styled.div.attrs({
    bgColor: '#ea5'
})`
    background-color: ${props => props.bgColor};
`
```

3. 传入 state 作为 props 属性
``` javascript
...
/* 2. 使用 styled 中的方法生成 React 组件 */
const AppWrapper = styled.div.attrs({
    bgColor: 'red'
})`
    /* 获取从 state 中传入的属性值 */
    color: ${props => props.textColor}; // 能够正常生效
    background-color: ${props => props.bgColor} // 不能生效，会按照 attrs 中设置的属性名的值显示。
`
...
constructor(props) {
    super(props);
    this.state = {
        bgColor: 'blue',
        textColor: 'blue',
    }
}
render() { 
    return (
        /* 3. 在项目中使用。 */
        <AppWrapper
            bgColor={this.state.bgColor}
            textColor={this.state.textColor}>
            <p className="title">APP</p>
            <input type="password" />
            <InputWrapper type="text" />
            <Home />
            <Polifile />
        </AppWrapper>
    );
}
...
```

> 注意：通过由 `styled.{nodeName}` 创建的 React 组件，在组件上设置的属性值，无法覆盖由 `styled.{nodeName}.attrs()` 中设置的默认值。在上面的案例中通过 `bgColor` 属性可以看出。

![通过 state 设置属性值](image_3.png)

4. `styled` 组件间的继承
``` javascript
...
const HYButton = styled.button`
    padding: 5px 10px;
    color: #000;
`
const SuccessHYButton = styled(HYButton)`
    color: green;
    background-color: #22f622;
`
...
render() { 
    return (
        /* 3. 在项目中使用。 */
        <div>
            <HYButton>默认的按钮</HYButton>
            <SuccessHYButton>成功的按钮</SuccessHYButton>
        </div>
    );
}
...
```

![style 组件间的继承](image_4.png)

5. 使用 `styled-components` 内置组件 `ThemeProvider` 来设置主题样式
``` javascript
/* 1. 从模块中引入 ThemeProvider 组件 */
...
import styled, {ThemeProvider} from "styled-components";
...
const HYButton = styled.button`
    padding: 5px 10px;
    color: #000;
`
/* 3. 在组件中使用属性 */
const SuccessHYButton = styled(HYButton)`
    color: ${props => (props.theme.textColor || '#0f0')};
    background-color: ${props => (props.theme.bgColor || '#22f622')};
`
...
constructor(props) {
    super(props);
    this.state = {
        bgColor: '#c3c3fa',
        textColor: '#0707ff',
    }
}
render() { 
    return (
        /* 2. 在项目中使用 ThemeProvider 组件 */
        <ThemeProvider theme={this.state}>
            <HYButton>默认的按钮</HYButton>
            <SuccessHYButton>成功的按钮</SuccessHYButton>
        </ThemeProvider>
    );
}
...
```

![style 组件间的继承](image_5.png)
