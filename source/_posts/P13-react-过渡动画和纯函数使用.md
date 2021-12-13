---
title: P13 react 过渡动画和纯函数使用
tags: []
categories:
  - React
abbrlink: 522225208
date: 2021-12-07 19:57:27
---

# react-transition-group 使用

> [官网](https://reactcommunity.org/react-transition-group/)

背景介绍：React 曾经为开发者提供过动画插件 `react-addons-css-transition-group`，后由社区维护，形成了现在的 `react-transition-group` 
- 这个库能够帮助我们方便的实现组件的 入场 和 离场 动画，使用时需要额外安装（Vue 可以直接使用）：
    - npm：`npm i react-transition-group --save`
    - yarn: `yarn add react-transition-group`

`react-transition-group` 主要提供了四个组件：
1. `<Transition />`
    - 该组件是一个和平台无关的组件（不一定要结合 CSS）
    - 但一般在前端开发中，我们一般会结合 CSS 来完成样式，所以常用的是 `<CSSTransition />`；
2. `<CSSTransition/>`
    - 在前端开发中，通常用 `<CSSTransition/>` 来完成过渡动画效果
3. `<SwitchTransition/>`
    - 两个组件显示和隐藏切换时，使用该组件
4. `<TransitionGroup/>`
    - 将多个动画组件包裹在其中，一般用于列表中元素的动画

# CSSTransition 的使用

- `<CSSTransition />` 是基于 `<Transition />` 构建的
- `CSSTransition` 一共有三种状态：`appear(首次加载)`, `enter(进入)`, `exit(离开)`
- 它们的三种状态，需要定义对应的 CSS 样式：
    - 第一类，开始状态：对应的类是 `-appear`, `-enter`, `-exit`
    - 第二类，执行动画：对应的类是 `-appear-active`, `-enter-active`, `-exit-active`
    - 第三类，执行结束：对应的类是 `-appear-done`, `-enter-done`, `-exit-done`

例子如下：

`CSSTransitionDemo.js`：
``` javascript
import { PureComponent } from 'react';
import { Card, Avatar } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import {CSSTransition} from "react-transition-group";
import './CSSTransitionDemo.css';

const { Meta } = Card;

class CSSTransitionDemo extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            isShow: true
        }
    }
    render() { 
        const {isShow} = this.state
        return (
            <div>
                <button onClick={_ => this.setState({isShow: !isShow})}>显示/隐藏</button>
                <CSSTransition
                    in={isShow} // 当前状态
                    timeout={1000} // 过渡时间
                    unmountOnExit={true} // 在退出时是否卸载 DOM 元素(默认 false)
                    appear // 定义首次加载的动画，在 CSS 文件中有与之配对的类
                    classNames="card"
                    onEnter={el => console.log('开始进入')} // 钩子函数
                    onEntering={el => console.log('进入状态')}
                    onEntered={el => console.log('进入完成')}
                    onExit={el => console.log('开始退出')}
                    onExiting={el => console.log('退出状态')}
                    onExited={el => console.log('退出完成')}>
                    <Card
                        style={{ width: 300 }}
                        cover={
                        <img
                            alt="example"
                            src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
                        />
                        }
                        actions={[
                            <SettingOutlined key="setting" />,
                            <EditOutlined key="edit" />,
                            <EllipsisOutlined key="ellipsis" />,
                        ]}
                    >
                        <Meta
                            avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                            title="Card title"
                            description="This is the description"
                        />
                    </Card>
                </CSSTransition>
            </div>
        );
    }
}
 
export default CSSTransitionDemo;
```

`CSSTransitionDemo.css`：
``` css
/* 进入 */
.card-enter, .card-appear {
    opacity: 0;
    transform: scale(0.8);
}
.card-enter-active, .card-appear-acitve {
    opacity: 1;
    transform: scale(1);
    transition: opacity 1000ms, transform 1000ms;
}
.card-enter-done, .card-appear-done {
    opacity: 1;
    transform: scale(1);
}
/* 离开 */
.card-exit {
    opacity: 1;
    transform: scale(1);
}
.card-exit-active {
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 1000ms, transform 1000ms;
}
.card-exit-done {
    opacity: 0;
    transform: scale(0.8);
}
```

常见对应的属性：
- `in`：触发进入或退出状态
    - 如果添加了 `unmountOnExit={true}`，那么该组件会在执行推出动画结束后被移除掉
    - 当 `in` 为 `true` 时，触发进入状态，会添加 `-enter`, `-enter-active` 的 class 开始执行动画，当动画执行结束后，会移除两个 class，并添加 `-enter-done` 的 class
    - 当 `in` 为 `false` 时，触发退出状态，会添加 `-exit`, `-exit-active` 的 class 开始执行动画，当动画执行结束后，会移除两个 class，并且添加 `-enter-done` 的 class
- `classNames`：动画 class 的名称
- `timeout`：过渡动画的时间
- `appear`：是否在初次进入添加动画（需要和 `in` 同时为 `true`）
- `unmountOnExit`：退出后卸载

# SwitchTransition

`<SwitchTransition />` 可以完成两个组件之间切换的炫酷动画。这个动画在 Vue 中被称为 `vue transition modes`

> 1. `SwitchTransition` 组件里面要有 `CSSTransition` 或者 `Transition` 组件，不能直接包裹你想要切换的组件
> 2. `SwitchTransition` 里面的 `CSSTransition` 或 `Transition` 组件不再像以前那样通过 `in` 来判断元素是何种状态，取而代之的是** `key` 属性**

案例如下：

`SwitchTransitionDemo.js`：
``` javascript
import React, { PureComponent } from 'react';
import {SwitchTransition, CSSTransition} from 'react-transition-group'
import './SwitchTransitionDemo.css'

class SwitchTransitionDemo extends PureComponent {
    state = {
        isOn: true
    }
    render() { 
        const {isOn} = this.state
        return (
            <div className="switch-transition-demo">
                <SwitchTransition mode="out-in">
                    <CSSTransition
                        key={isOn ? 'on' : 'off'}
                        timeout={1000}
                        classNames="btn">
                        <button onClick={e => this.setState({isOn: !isOn})}>{isOn ? 'on' : 'off'}</button>
                    </CSSTransition>
                </SwitchTransition>
            </div>
        );
    }
}

export default SwitchTransitionDemo;
```

`SwitchTransitionDemo.css`：
``` css
.switch-transition-demo {
    padding: 100px;
    text-align: center;
}
.btn-enter {
    transform: translateX(100%);
}
.btn-enter-active {
    transform: translateX(0);
    transition: transform 1000ms;
}
.btn-enter-done {
    transform: translateX(0);
}
.btn-exit {
    opacity: 1;
    transform: translateX(0);
}
.btn-exit-active {
    opacity: 0;
    transform: translateX(-100%);
    transition: opacity 1000ms, transform 1000ms;

}
.btn-exit-done {
    opacity: 0;
    transform: translateX(-100%);
}
```

# TransitionGroup

当有一系列的元素需要添加相同的动画时使用

案例如下：

`TransitionGroupDemo.js`：
``` javascript

```