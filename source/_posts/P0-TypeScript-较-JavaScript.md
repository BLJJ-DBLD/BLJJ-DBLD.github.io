---
title: P0 TypeScript 较 JavaScript
tags: []
categories:
  - TypeScript
date: 2022-01-05 21:37:26
abbrlink:
---

# TypeScript 较 JavaScript

## TypeScript 是什么

> TypeScript （简称 TS） 是 JavaScript 的 超集 （JS 有的 TS 也有）
>
> TypeScript = Type + JavaScript （为 JS 添加类型系统）

![Typescript 相对于 Javascript 囊括图](image_1.png)

``` typescript
// TypeScript 代码：有明确的类型，即 ：number （数值类型）
let age: number = 18;

// JavaScript 代码：无明确的类型，只有编译的时候才能知道具体类型
let age = 18;
```

## TS 相比 JS 的优势

- 优势一：**类型化思维方式**，使得开发更加严谨，提前发现错误，
- 优势二：类型系统提高了代码可读性，并使维护和**重构代码更加容易**
- 优势三：补充了接口、枚举等开发大型应用时 **JS 缺失的功能**