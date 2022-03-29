---
title: Less 和 Sass 的使用
tags:
  - null
categories:
  - CSS
hidden: false
abbrlink: 3797739102
date: 2022-03-09 19:24:27
---

# 基础概念

由于CSS功能比较弱，代码的复用性比较弱，为了更方便地编写CSS，程序员们想到可以更方便的文件设计样式，然后再转换为CSS。这种方式就成为CSS预处理。而Less和Sass就是目前最流行的CSS预处理文件。

这两种方式实现的功能类似，都具备如下所示的基础功能增强：

- 变量，CSS不支持变量，导致相同的数值需要复制粘贴，采用Less或Sass就可以指定变量，重复的地方直接使用变量即可
- 混合，CSS无法实现样式代码的复用，使用Less和Sass可以复用Class的样式
- 继承，CSS无法实现样式的继承，而Less和Sass可以更好地继承另一个Class的样式
- 嵌套，Css中嵌套的指定比较麻烦，而且不直观，使用Less和Sass可以改善这种情况
- 运算，Css中不支持数值的运算，使用Less和Sass可以支持比较丰富的数学运算

# LESS

## 变量

Less使用 `@` 字符指定变量，使用方式如下所示：

```
@color: #4D926F;

h2 {
  color: @color;
}
```

### 插值

```
@direction: left;

.myPadding{
  padding-@{direction}: 20px;
}
```

最终转换为CSS代码如下所示：

```
.myPadding {
  padding-left: 20px;
}
```


## 混合

Less可以将一个定义好的 Class 引入另一个 Class 中，从而达到样式的复用，同时支持参数的调用，类似其他语言中方法调用的效果，代码如下所示：

```
.rounded-corners (@radius: 5px) {
  border-radius: @radius;
  -webkit-border-radius: @radius;
  -moz-border-radius: @radius;
}

#header {
  .rounded-corners;
}
#footer {
  .rounded-corners(10px);
}
```

最终转换为CSS代码如下所示：

```
#header {
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
}
#footer {
  border-radius: 10px;
  -webkit-border-radius: 10px;
  -moz-border-radius: 10px;
}
```

## 继承

Less如果希望在 Class 中继承另一个 Class 的样式，可以采用与混合功能一样的实现方式，直接将被继承的样式直接加入即可，代码如下所示：

```
.rounded-corners (@radius: 5px) {
  border-radius: @radius;
  -webkit-border-radius: @radius;
  -moz-border-radius: @radius;
}

.content {
  .rounded-corners;
  font-size: 20px;
}
```

## 嵌套

在原始的CSS中，每个嵌套方式需要一一指定，导致写起来很繁琐，而且不直观，在Less中可以直接按照层次写即可。代码如下所示：

```
#header {
  h1 {
    font-size: 26px;
    font-weight: bold;
  }
  p { font-size: 12px;
    a { text-decoration: none;
      &:hover { border-width: 1px }
    }
  }
}
```

而转换为CSS后，对应的代码如下所示：

```
#header h1 {
  font-size: 26px;
  font-weight: bold;
}
#header p {
  font-size: 12px;
}
#header p a {
  text-decoration: none;
}
#header p a:hover {
  border-width: 1px;
}
```

可以看到在 Less 中，可以直接在 `{}` 中增加样式即可表示层次关系，而且层次关系可以循环嵌套下去，而 CSS 中则相当繁琐，需要一层一层指定下去。

## 运算

在Less中，可以直接对数值进行运算，大大方便开发者。代码如下所示：

```
@the-border: 1px;
@base-color: #111;

#header {
  color: @base-color * 3;
  border-right: @the-border * 2;
}
```

转换为 CSS 后，对应的代码如下：

```
#header {
  color: #333333;
  border-right: 2px;
}
```

# SASS

Sass 包含两种文本格式，一种是 `.sass` 格式的，采用 `python` 类似的严格缩进，不使用 `{}` 和 `;` 作为分隔符。一种是 `.scss`，采用 `{}` 和 `;` 进行分隔，是标准的 CSS 语法。`.scss` 是 Sass 最新的默认格式。后续介绍也都以此格式进行介绍。

## 变量

Sass使用 `$` 字符指定变量，代码如下所示：

```
$color: #4D926F;

h2 {
  color: $color;
}
```

### 插值

```
$direction: left;

.myPadding{
  padding-#{$direction}: 20px;                             
}
```

转换为 CSS 后，对应的代码如下：

```
.myPadding{
  padding-left: 20px;
}
```

## 混合

Sass中可以将一些公共样式进行复用，也支持指定参数。在使用中，需要使用 `@mixin` 参数指定复用的样式，并使用 `@include` 进行引用，代码如下所示：

```
@mixin rounded-corners ($radius: 5px) {
  border-radius: $radius;
  -webkit-border-radius: $radius;
  -moz-border-radius: $radius;
  @content;
}

#header {
  @include rounded-corners(){background: $color;};
}
#footer {
  @include rounded-corners(10px);
}
```

转换为 CSS 后，对应的代码如下：

```
#header {
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  background: red;
}

#footer {
  border-radius: 10px;
  -webkit-border-radius: 10px;
  -moz-border-radius: 10px;
}
```

## 继承

Sass 中可以继承另外一些样式的代码，在 Sass 中可以使用 `@extend` 继承样式，代码如下所示：

```
.rounded-corners {
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
}

.content {
  @extend .rounded-corners;
  font-size: 20px;
}
```

转换为 CSS 后，对应的代码如下：

```
.rounded-corners, .content {
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
}

.content {
  font-size: 20px;
}

```

可以看到 Less 中混合和继承使用相同的实现方式，而 Sass 中继承和混合采用不同关键字进行实现。

在大作数情况下 `@mixin` 会比 `@extend` 更好，但是它们俩都有自己的一席之地。**当样式和选择器之间的关系在某些方面比较紧密的时候，使用 `@extend`**。除此之外，你可以使用 `@mixin` 在任何地方。

## 嵌套

对于嵌套的语法，Sass与Less基本一致，实现的代码如下所示

```
#header {
  h1 {
    font-size: 26px;
    font-weight: bold;
  }
  p { font-size: 12px;
    a { text-decoration: none;
      &:hover { border-width: 1px }
    }
  }
}
```

可以看到，与Less语法一致。

## 运算

进行通用运算，基本的算法与Less也相同，代码如下所示：

```
$the-border: 1px;
$base-color: #111;

#header {
  color: $base-color * 3;
  border-right: $the-border * 2;
}
```

# LESS 和 SASS 的主要区别

## 变量标识符不同

sass中规定，以美元符号 `$` 开头的即表示变量，而less中以符号 `@` 开头表示变量。

## 变量插值方式不同

在两种语言中，变量都可以以一定的方式插入到字符串中去，这个特性极为有用，但两种语言的插入方式不同，具体请看下例：

```
//sass 中

$direction: left;
.myPadding{
  padding-#{$direction}: 20px;                             
}

//less中

@direction: left;

.myPadding{
  padding-@{direction}: 20px;
}


//编译后的css代码是相同的，如下：

.myPadding{
  padding-left: 20px;
}
```

## 变量作用域

在 `sass 3.4.0` 之前，sass 可以说是没有局部变量和全局变量之分的，即后声明的同名变量总是会覆盖之前的同名变量，不管后声明的变量是位于何处。先看一段熟悉的js代码：

``` javascript
//代码块A

var a = 1;
(function (){
  a = 5;
  alert(a);               //a = 5;
})();
alert(a);                 //a = 5;
```

由于闭包的作用，匿名函数内部可以引用到外部的变量a,因此上面的代码可以正常运行。再来看下面这个:

``` javascript
//代码块B

var a = 1;
(function (){
  var a = 5;
  alert(a);               //a = 5;
})();
alert(a);                 //a = 1;
```

`sass 3.4.0之前` 的变量设计思想是类似于 **代码块A** 的，即不带关键字var的局部变量声明，而less的思想类似 **代码块B**，带关键字var的局部变量声明。

`sass 3.4.0之后`，改进了，并还附送了彩蛋 `!global`

举例说明：

```
$color: blue;
a{
  $color: red;
  color: $color;               //red
}
p{
  color: $color;               //blue
}

//但是，若使用 !global

span{
  $color: yellow !global;
  color: $color;               //yellow
}
div{
  color: $color;               //yellow
}
```