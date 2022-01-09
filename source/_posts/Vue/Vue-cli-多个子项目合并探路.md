---
title: Vue CLI4.x 多个子项目合并探路
tags: ["Vue CLI", "vue@3"]
categories:
  - Vue
abbrlink: 3044239623
date: 2021-12-31 14:57:22
---

依托公司项目，得以对多子项目能够有基础的使用，但是具体是如何的通过简单命令就能将各个子项目单独开发和打包的呢？带着这个疑惑，打算自己去实现一下从构建到打包的全过程。

因为该部分内容的实现并不是很复杂，官网内也有提到过一嘴（[点这里](https://cli.vuejs.org/zh/config/#pages)）。因此只是对自己的学习做一点总结，以免忘记。

[Github 地址](https://github.com/BLJJ-DBLD/Microhabit-Study/tree/main/Vue/test-multiple-projects)

## 项目创建

先通过 `vue create test-multiple-projects` 命令创建项目，再选中 `Default (Vue 3 Preview) ([Vue 3] babel, eslint)` 选项。

此时，脚手架帮助我们创建了一个以单个项目为主导的文件夹。这并不是目前的需求，所以我们需要在当前根目录内创建 `vue.config.js` 以做配置文件。也可以使用 `package.json` 中的 `vue` 字段，但是注意这种写法需要严格遵照 JSON 的格式来写。 

### 新建并配置 `vue.config.js`

将以下内容复制进 `vue.config.js` 中：

``` javascript
/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
var PROJECT_NAME = process.env.VUE_APP_PROJECT_NAME // 当前运行的项目
var NODE_ENV = process.env.NODE_ENV // 当前运行的环境
console.log({PROJECT_NAME, NODE_ENV});

if (!PROJECT_NAME && NODE_ENV !=='development') {
    console.log('请输入要启动或者打包模块');
    process.exit();//退出执行
}

function getEntry() {
    var entries = {};
    if (NODE_ENV === "production") {
        entries = {
            index: {
                // page的入口
                entry: "src/" + PROJECT_NAME + "/main.js",
                // 模板来源
                template: "public/index.html",
                // 在 dist/index.html 的输出
                filename: "index.html",
                title: PROJECT_NAME,
                chunks: ["chunk-vendors", "chunk-common", "index"]
            }
        };
    } else {
        
        // 1. 多个子项目同步启动
        // 启动后 url 路径：http://localhost:8080/${PROJECT_NAME}
        // var glob = require("glob");
        // var items = glob.sync("./src/*/*.js");
        // for (var i in items) {
        //     var filepath = items[i];
        //     var fileList = filepath.split("/");
        //     var fileName = fileList[fileList.length - 2];
        //     entries[fileName] = {
        //         entry: `src/${fileName}/main.js`,
        //         // 模板来源
        //         template: `public/index.html`,
        //         // 在 dist/index.html 的输出
        //         filename: `${fileName}.html`,
        //         // 提取出来的通用 chunk 和 vendor chunk。
        //         chunks: ["chunk-vendors", "chunk-common", fileName]
        //     };
        // }

        // 2. 让子项目单独启动
        // 启动后 url 路径：http://localhost:8080/${PROJECT_NAME}
        /* entries[PROJECT_NAME] = {
            entry: `src/${PROJECT_NAME}/main.js`,
            // 模板来源
            template: 'public/index.html',
            // 在 dist/index.html 的输出
            filename: `${PROJECT_NAME}.html`,
            // 提取出来的通用 chunk 和 vendor chunk。
            chunks: ["chunk-vendors", "chunk-common", PROJECT_NAME]
        }; */

        // 启动后 url 路径：http://localhost:8080
        entries = {
            index: {
                // page的入口
                entry: "src/" + PROJECT_NAME + "/main.js",
                // 模板来源
                template: "public/index.html",
                // 在 dist/index.html 的输出
                filename: "index.html",
                title: PROJECT_NAME,
                chunks: ["chunk-vendors", "chunk-common", "index"]
            }
        };
    }
    return entries;
}


module.exports = {
    productionSourceMap: false, // 生产禁止显示源代码
    outputDir: "./dist/" + PROJECT_NAME, // 输出目录
    publicPath: "/",
    pages: getEntry()
}
```

> 当自己在配置内容时，有几个地方极容易忽略而导致项目无法启动或启动后出现问题
>
> 1. pages 的字段名与字段内的 `chunks` 数组的最后一个文件名字符串一致
> 2. publicPath 在配置相对位置时有一些限制，其中就囊括使用 `pages` 选项构建多页面应用。更多详细内容 [点这里](https://cli.vuejs.org/zh/config/#publicpath)

### 新建并运行子项目

#### 子项目内容构建

在复制完内容后，需要创建相应的子项目在 src 内。目录结构大致如下：

``` 
src
|- base
    |- views            // 具体的页面内容
        |- Home.vue     // 具体的独立模块页面
    |- App.vue          // 模板 html 挂载的文件
    |- main.js          // 入口 js 文件
|- mixture
    |- views            // 具体的页面内容
    |- App.vue          // 模板 html 挂载的文件
    |- main.js          // 入口 js 文件
```

> 注意一个细节： mixture 文件夹内并没有 `Home.vue` 文件，目的是为了在 mixture 的 `App.vue` 内直接引入 base 的 `Home.vue` 文件

在 base 文件夹内：

在 `main.js` 中复制以下内容：

``` javascript
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.mount('#app')
```

在 `App.vue` 中复制以下内容：

``` vue
<template>
  <div class="App">
    <img alt="Vue logo" src="img/assets/logo.png">
    <home />
  </div>
</template>

<script>
import Home from './Home'

export default {
  name: 'App',
  component: {Home}
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.home {
  color: #663399; /* 用文字颜色简单的以示区别 */
}
</style>
```

在 `Home.vue` 内复制以下内容：

``` vue
<template>
    <div class="home">
        Base_Home
    </div>
</template>

<script>
export default {
    name: 'Home'
}
</script>
```

在 mixture 文件夹内：

在 `main.js` 中内容与 base 文件夹内的 `main.js` 文件内容一致

在 `App.vue` 中只是引入了 base 文件夹内的 `Home.vue` 文件，复制以下内容：

``` vue
<template>
  <div class="App">
    <img alt="Vue logo" src="img/assets/logo.png">
    <home />
  </div>
</template>

<script>
import Home from '../base/views/Home' // 引入了 base 文件夹内的 Home.vue 文件

export default {
  name: 'App',
  component: {Home}
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
.home {
  color: #ff1f01; /* 用文字颜色简单的以示区别 */
}
</style>
```

至此，我们已经完成了对子项目的基本构建，但是目前还是不能运行或打包。下面就让我们根据对应的环境以及子项目进行配置

#### 配置命令及环境

涉及的文件在目录中的位置：

```
根文件夹
|- package.json       // 修改 scripts 内相应的命令
|- .env.base          // base 项目开发环境配置内容
|- .env.base_pro      // base 项目生产环境配置内容
|- .env.mixture       // mixture 项目开发环境配置内容
|- .env.mixture_pro   // mixture 项目生产环境配置内容
```

在 package.json 内对 `scripts` 内容进行调整：

``` json
"scripts": {
  "build": "vue-cli-service build", // 已经失效，不能使用了
  "lint": "vue-cli-service lint",
  "serve_base": "vue-cli-service serve --mode base", // 运行 base 版本
  "build_base": "vue-cli-service build --mode base_pro", // 打包 base 版本
  "serve_mixture": "vue-cli-service serve --mode mixture", // 运行 mixture 版本
  "build_mixture": "vue-cli-service build --mode mixture_pro" // 打包 mixture 版本
},
```

在控制台中输入 `npm run serve_${projectName}`，根据 `vue.config.js` 内对 `pages` 的配置，能够指出如何访问页面内容。

![页面展示](image_1.png)