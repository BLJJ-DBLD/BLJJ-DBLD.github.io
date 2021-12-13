---
title: P1 React 开发初体验
abbrlink: 2864467857
tags: []
categories:
  - React
date: 2021-12-06 13:31:58
---
# React 的特点

声明式编程

- 声明式编程是目前整个大前端开发的模式： Vue、React、Flutter、SwiftUI
- 它允许我i们只需要维护自己的状态，当状态改变时，React 可以根据最新的状态去渲染我的 UI 界面
    
组件化开发
    
- 将复杂的界面拆解成一个个小的组件
    
# React 的开发依赖

- 必须依赖的三个库：
    - react: 包含 react 所必须的核心代码
    - react-dom: react 渲染在不同平台所需要的核心代码
    - babel: 将 jsx 转换成 React 代码的工具
    
- 对于 Vue 来说，我们只依赖一个 Vue.js 文件即可，但是 React 却需要依赖三个库
    - 其实，三个库是各司其职，目的就是让每一个库只单纯做自己的事情
    - 在 React 0.14 版本之前是没有 react-dom 这个概念的，所有的功能都包含在 react 里
    - 那为什么还要进行拆分呢？原因是 react-native。
    - react 包中包含了 react 和 react-native 所共同拥有的核心代码。
        
- react-dom 针对 web 和 native 所完成的事情不同。
    - web 端：react-dom 会将 jsx 最终渲染成真实的 DOM，显示在浏览器上
    - navtive 端：react-dom 会将 jsx 最终渲染成原生的控件（比如 Android 中的 Button，IOS 中的 UIButton）
        
# 认识 Babel

babel 是什么呢？

- 是目前前端使用最广泛的编辑器、转移器
- 比如当下很多浏览器并不支持 ES6 的语法，但是确实 ES6 的语法非常的简洁和方便，我们希望**开发时**能够使用它。
- 那么编写源码时我们就可以使用 ES6 来编写，之后通过 Babel 工具，将 ES6 转成大多数浏览器都支持的 ES5 语法。
    
React 和 Babel 的关系：

- 默认情况下开发 React 其实可以不使用 babel
- 但是前提是我们自己使用 React.creactElement 来编写源代码，它编写的代码非常的繁琐和可读性差。
- 那么我们就可以直接编写 jsx （JavaScript XML）的语法，并且让 babel 帮助我们转换成 React.createElement
    
# 引入 React 依赖

> 所以，我们在编写 React 代码时，这三个依赖都是必不可少的。

那么，如何添加这三个依赖：

- 方法一：直接 CDN 引入
- 方法二：下载后，添加本地依赖
- 方法三：通过 npm 管理（后续脚手架再使用）