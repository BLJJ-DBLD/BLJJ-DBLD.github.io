---
title: P12 Antd 的使用与其他补充
tags: []
categories:
  - React
abbrlink: 1574351288
date: 2021-12-07 19:53:58
---

# 使用前需了解的内容

## 兼容环境

- 现代浏览器 和 IE11(需要 polyfills)
- 支持服务端渲染
- Electorn

![支持的版本](image_1.png)

对于 IE 系列浏览器，需要提供相应的 Polyfill 支持，建议使用 @babel/preset-env 来解决浏览器兼容问题。如果你在使用 umi，可以直接使用 targets 配置。

> `antd@2.0` 之后不再支持 `IE8`。 `antd@4.0` 之后不再支持 `React 15` 和 `IE9/10`。

## 安装

使用 npm 、 yarn 安装

- npm: `npm install antd --save`
- yarn: `yarn add antd`

## Antd 的使用

``` javascript
/* App.js */
...
import { Button } from "antd";
...
render() { 
    return (
        <div>
            <Button> Antd button</Button>
        </div>
    );
}
...
```

![未加入 css 的 Antd 控件](image_2.png)

此时能看出控件是出来了，但是样式却不对，这是因为样式是需要单独引入：

``` javascript
/* index.js */
+ import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
```

![已加入 css 的 Antd 控件](image_3.png)

## 对 Antd 的高级配置

> 我们需要对 `create-react-app` 的默认配置进行自定义，这里我们使用 [craco](https://github.com/gsoft-inc/craco) （一个对 `create-react-app` 进行自定义配置的社区解决方案）。

现在我们安装 craco 并修改 `package.json` 里面的 `script` 属性

``` javascript
/* package.json */
"scripts": {
-   "start": "react-scripts start",
-   "build": "react-scripts build",
-   "test": "react-scripts test",
+   "start": "craco start",
+   "build": "craco build",
+   "test": "craco test",
}
```

之后在项目根目录创建一个 `craco.config.js` 用于修改默认配置。

``` javascript
/* craco.config.js */
module.exports = {
  // ...
};
```

### 对 Antd 配置自定义主题

有了 `craco` 能够自定义默认配置后，自定义主题需要用到类似 `less-loader` 提供的 `less` 变量覆盖功能。我们可以引入 `craco-less` 来帮助加载 `less` 样式和修改变量。

首先把 `src/index.js` 文件中对 `antd` css 的文件引入更改为 `less` 文件。

``` javascript
/* index.js */
-   import 'antd/dist/antd.css'; 
+  import 'antd/dist/antd.less'; 
```

然后安装 `craco-less` 并修改 `craco.config.js` 文件如下。

1. 安装 `craco-less`：`yarn add craco-less`

``` javascript
const CracoLessPlugin = require('craco-less');

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
                options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: { '@primary-color': '#ff322f' },
                        javascriptEnabled: true,
                    },
                },
            },
        },
    ],
};
```

这里利用了 `less-loader` 的 `modifyVars` 来进行主题配置，变量和其他配置方式可以参考 配置主题 文档。修改后重启 `yarn start`，如果看到一个红色的按钮就说明配置成功了。

![自定义主题色](image_4.png)

> 也可以使用 `create-react-app` 提供的 `yarn run eject` 命令将所有内建的配置暴露出来。不过这种配置方式不太建议使用。

## 设置路径别名

以前设置路径别名时，需要通过 `yarn eject` 把 `webpack` 的配置暴露出来，之后修改 `工程名/config/webpack.config.js` 文件

``` javascript
resolve: {
      alias: {
        'react-native': 'react-native-web',
        ...(isEnvProductionProfile && {
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling',
        }),
        ...(modules.webpackAliases || {}),
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages')
      },
      extensions: ['.js', '.jsx', '.json']
}	
```

但是现在我们能够使用 `craco` 来设置新的路径别名，在 `craco.config.js` 文件中新增：

``` javascript
+   const path = require('path')
+   const reslove = (dir) => path.resolve(__dirname, dir)

module.exports = {
    ...
    +   webpack: {
    +       alias: {
    +           '@': reslove('./src')
    +       }
    +   }
    ...
};
```

> 注意：与在 `webpack.config.js` 的 `resolve` 修改配置不同，而是在 `webpack` 中修改。

# 自定义 eslint 文件配置解决方案

首先，自定义的 eslint 配置方案并不是针对 `Antd` 来使用的，而是针对 `create-react-app` 来使用的。方案有多种：

1. `yarn eject` 项目将 webpack 配置暴露出来，这种方案不建议，因此不做过多解释。
2. 在 `react-script 4.x` 版本以下时，我们可以在 `package.json` 中的 `scripts` 命令添加环境变量 `EXTEND_ESLINT=true` 开启自定义
    - 原因是，在早期的 `react-script` 版本中，当环境变量 `EXTEND_ESLINT` 为 `true` 时，`react-script` 会认为我们自定义 eslint 配置，而不去启用 `eslint-config-react-app` 的配置。
    - 注意：开启这个变量我们只能在 `package.json` 中的 `eslintConfig` 字段进行配置自定义，无法通过根目录 `.eslintrc` 配置，所以不建议使用。
3. 在 `react-script 4.x` 版本以下时，也可以使用 `react-app-rewired` 和 `customize-cra` 对 `react-scripts` 手脚架包装一次进行使用，可不对 `react eject` 就可以对项目自定义 `webpack`。
4. `react-script 4.x` 版本以上，`react17` 官方团队修改了脚手架允许直接在外部声明 `.eslintrc` 文件覆盖 `eslint` 配置。不需要对 `package.json` 和 `react-app-rewired` 和 `customize-cra` 就可用实现 `eslint` 配置。

## 方案三 `react-app-rewired` 和 `customize-cra`

1. 先安装依赖：`yarn add react-app-rewired customize-cra --save-dev`
2. 在项目跟目录下创建 `config-overrides.js` 文件，内容如下：

``` javascript
const { override, addWebpackAlias, useEslintRc } = require('customize-cra')
const path = require('path')
 
module.exports = override(
  // 注意，一定要用 path.resolve 引入eslint的配置文件，否则不生效
  useEslintRc(path.resolve(__dirname, './.eslintrc.json')),
  // 补充一个在 4.x 以下时配置路径别名的方法
  addWebpackAlias({
    '@': path.resolve(__dirname, './src'),
    '_c': path.resolve(__dirname, './src/components')
  })
```

3. 修改 `package.json` 中 `scripts` 的命令：`"start": "cross-env REACT_APP_API=development react-app-rewired start"`
4. 然后在根目录创建 `.eslintrc.json` 进行自定义 `eslint` 配置即可。
    - 语法：0 表示关闭，1 表示警告，2 表示严重错误

``` json
{
    "env": {
        "node": true,
        "mocha": true,
        "jest": true,
        "es6": true,
        "browser": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "jsx-a11y",
        "react-hooks"
    ],
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "globals": {
        "JSX": true,
        "React": true,
        "NodeJS": true,
        "Promise": true
    },
    "rules": {
        "no-console": [1, { "allow": ["warn"] }], // 禁用 console
        "consistent-return": 2, // 要求 return 语句始终或从不指定值（一致返回）
        "curly": [2, "multi-or-nest"],
        "dot-location": 0, // 在点之前和之后强制换行（点位置）
        "eqeqeq": 2, // 要求 === 和 !==
        "no-alert": 2, // 禁止使用 Alert
        "no-eq-null": 2, // 禁止 == null 比较
        "no-lone-blocks": 2, // 禁止不必要的嵌套块
        "no-return-await": 2, // 禁止不必要的退出 await
        "no-unused-expressions": 2, // 禁止使用未使用的表达式
        "array-bracket-spacing": 2, // 禁止在方括号首尾加空格
        "object-curly-spacing": [2, "never", { "objectsInObjects": true }], // 强制在花括号中使用一致的空格
        "block-spacing": [2, "never"], // 禁止或强制在代码块中开括号前和闭括号后有空格
        "brace-style": 0, // 大括号风格要求
        "comma-spacing": 1, // 强制在逗号周围使用空格
        "consistent-this": 1, // 要求一致的 This
        "eol-last": 2, // 要求或禁止文件末尾保留一行空行
        "multiline-ternary": [1, "always-multiline"], // 要求或禁止在三元操作数中间换行
        "new-cap": [2, { "capIsNew": false }], // 要求构造函数首字母大写
        "no-trailing-spaces": 2, // 禁用行尾空白
        "semi": 2, // 要求或禁止使用分号代替 ASI
        "space-before-blocks": 2, // 要求或禁止语句块之前的空格
        "space-in-parens": [2, "never"], // 禁止或强制圆括号内的空格
        "spaced-comment": 2, // 要求或禁止在注释前有空白 (space 或 tab)
        "switch-colon-spacing": [2, { "after": true, "before": false }], // 强制在 switch 的冒号左右有空格 
        "arrow-spacing": 2, // 要求箭头函数的箭头之前或之后有空格
        "quotes": [0, "single"], // 强制使用一致的反勾号、双引号或单引号
        "key-spacing": 2, // 强制在对象字面量的键和值之间使用一致的空格
        "comma-dangle": [2, "never"], // 禁止在对象和数组文字中使用逗号结尾
        "no-empty-function": 1, // 禁止出现空函数
        "prefer-promise-reject-errors": 0, // 要求使用 Error 对象作为 Promise 拒绝的原因
        "react-hooks/exhaustive-deps": 0,
        "react-native/no-inline-styles": 0,
        "react/forbid-prop-types": 0,
        "react/prop-types": 0,
        "react/display-name": 0,
        "react/no-array-index-key": 2,
        "react/no-unused-state": 2,
        "react/jsx-indent-props": 2,
        "react/jsx-no-comment-textnodes": 1,
        "react/jsx-no-duplicate-props": 2,
        "react/jsx-no-target-blank": [1, { "enforceDynamicLinks": "always" }],
        "react/jsx-no-undef": 2,
        "react/jsx-props-no-multi-spaces": 1,
        "react/jsx-tag-spacing": 1,
        "react/jsx-uses-vars": 2,
        "react/jsx-wrap-multilines": 2,
        "react-hooks/rules-of-hooks": 2
    }
}
```

## `react-script 4.x` 方案

> react17 官方团队修改了脚手架允许直接在外部声明 `.eslintrc` 文件覆盖 `eslint` 配置。不需要对 `package.json` 和 `react-app-rewired` 和 `customize-cra` 就可用实现 `eslint` 配置。

在根目录创建文件 `.eslintrc.json`，配置的 `extends` 字段需要改一下。

``` json
{
    "env": {
        "node": true,
        "mocha": true,
        "jest": true,
        "es6": true,
        "browser": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended"
    ],
    "parser": "babel-eslint",
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "jsx-a11y",
        "react-hooks"
    ],
    "settings": {
        "react": {
            "version": "detect"
        }
    },
    "globals": {
        "JSX": true,
        "React": true,
        "NodeJS": true,
        "Promise": true
    },
    "rules": {
        "no-console": [1, { "allow": ["warn"] }], // 禁用 console
        "consistent-return": 2, // 要求 return 语句始终或从不指定值（一致返回）
        "curly": [2, "multi-or-nest"],
        "dot-location": 0, // 在点之前和之后强制换行（点位置）
        "eqeqeq": 2, // 要求 === 和 !==
        "no-alert": 2, // 禁止使用 Alert
        "no-eq-null": 2, // 禁止 == null 比较
        "no-lone-blocks": 2, // 禁止不必要的嵌套块
        "no-return-await": 2, // 禁止不必要的退出 await
        "no-unused-expressions": 2, // 禁止使用未使用的表达式
        "array-bracket-spacing": 2, // 禁止在方括号首尾加空格
        "object-curly-spacing": [2, "never", { "objectsInObjects": true }], // 强制在花括号中使用一致的空格
        "block-spacing": [2, "never"], // 禁止或强制在代码块中开括号前和闭括号后有空格
        "brace-style": 0, // 大括号风格要求
        "comma-spacing": 1, // 强制在逗号周围使用空格
        "consistent-this": 1, // 要求一致的 This
        "eol-last": 2, // 要求或禁止文件末尾保留一行空行
        "multiline-ternary": [1, "always-multiline"], // 要求或禁止在三元操作数中间换行
        "new-cap": [2, { "capIsNew": false }], // 要求构造函数首字母大写
        "no-trailing-spaces": 2, // 禁用行尾空白
        "semi": 2, // 要求或禁止使用分号代替 ASI
        "space-before-blocks": 2, // 要求或禁止语句块之前的空格
        "space-in-parens": [2, "never"], // 禁止或强制圆括号内的空格
        "spaced-comment": 2, // 要求或禁止在注释前有空白 (space 或 tab)
        "switch-colon-spacing": [2, { "after": true, "before": false }], // 强制在 switch 的冒号左右有空格 
        "arrow-spacing": 2, // 要求箭头函数的箭头之前或之后有空格
        "quotes": [0, "single"], // 强制使用一致的反勾号、双引号或单引号
        "key-spacing": 2, // 强制在对象字面量的键和值之间使用一致的空格
        "comma-dangle": [2, "never"], // 禁止在对象和数组文字中使用逗号结尾
        "no-empty-function": 1, // 禁止出现空函数
        "prefer-promise-reject-errors": 0, // 要求使用 Error 对象作为 Promise 拒绝的原因
        "react-hooks/exhaustive-deps": 0,
        "react-native/no-inline-styles": 0,
        "react/forbid-prop-types": 0,
        "react/prop-types": 0,
        "react/display-name": 0,
        "react/no-array-index-key": 2,
        "react/no-unused-state": 2,
        "react/jsx-indent-props": 2,
        "react/jsx-no-comment-textnodes": 1,
        "react/jsx-no-duplicate-props": 2,
        "react/jsx-no-target-blank": [1, { "enforceDynamicLinks": "always" }],
        "react/jsx-no-undef": 2,
        "react/jsx-props-no-multi-spaces": 1,
        "react/jsx-tag-spacing": 1,
        "react/jsx-uses-vars": 2,
        "react/jsx-wrap-multilines": 2,
        "react-hooks/rules-of-hooks": 2
    }
}
```

---
---

1. `create-react-app` 的多种自定义 `eslint` 方案参考：[https://blog.csdn.net/qq_33490514/article/details/110672186](https://blog.csdn.net/qq_33490514/article/details/110672186)