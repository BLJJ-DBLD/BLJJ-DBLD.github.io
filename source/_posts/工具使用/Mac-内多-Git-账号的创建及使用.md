---
title: Mac 内多 Git 账号的创建及使用
tags:
  - git
categories:
  - 工具使用
abbrlink: 2246521759
date: 2023-07-27 22:20:00
---

# 1. 前置操作

> 假设你是一个有强迫症的人，期望自己电脑内的 git 账号是干净且规整的，那建议你先讲之前的配置做一个清除，好保证后续的操作。当然，之前的残留并不会影响到之后的操作～

- 1. 清空默认全局的 username 和 useremail
``` bash
# 查看信息：
git config --list

# 清除默认的 用户 和 邮箱
git config --global --unset user.name
git config --global --unset user.email

# 删除 .ssh 内的配信文件（可选，谨慎使用命令）
rm -rf ~/.ssh/*
```

# 2. 给不同的 git 账户生成 ssh-key：比方说一个公司账号，一个个人账号

一般默认的命令是：`ssh-keygen -t rsa -C "youremail@xxx.com"`

git 生成 ssh-key，默认不设置名字的话就是 id_rsa

因为我们这边是要生成多个 id_rsa，因此需要添加更多命令语句生成不同的 id_rsa_xxx

``` bash
# 输入自定义的rsa名字到自己的邮箱上去
ssh-keygen -t rsa -f ~/.ssh/id_rsa_xxx -C "youremail@xxx.com"
```

这样子就会生成对应的文件，通过在 ssh 目录下输入 `ls` 可以看到自定义名字的 id_rsa

# 3. 给他们分别添加到 ssh-agent 信任列表

> 添加的好处有很多：
> 1. 将 SSH 密钥添加到 SSH Agent 的信任列表中可以方便地进行身份验证，而无需每次连接到远程服务器时都输入密码。这样可以提高安全性，同时也提高了使用 SSH 的便利性。
> 2. 当您将 SSH 密钥添加到 SSH Agent 后，Agent 会在您首次使用密钥进行身份验证时将其加载到内存中，并将其与您的操作系统用户会话关联。之后，当您连接到远程服务器时，Agent 会自动提供密钥进行身份验证，而无需再次输入密码。
> 3. 这对于频繁连接到多个远程服务器的开发人员来说尤其有用，因为它避免了每次连接时都要输入密码的麻烦。同时，由于 SSH Agent 以安全的方式保存密钥，这也可以提高安全性，因为您的密钥不会明文存储在磁盘上。

添加到信任列表的命令：`ssh-add ~/.ssh/id_rsa_xxx`

如果使用上面命令出现 Error，比如：Could not open a connection to your authentication agent.

那么请先输入：`ssh-agent bash`。作用是：启动一个新的 Bash shell 并在该 shell 中启动 SSH Agent。

之后再重复 「添加到信任列表的命令」。

如有多个 id_rsa 则多次输入相应文件名称即可。

# 4. 添加公钥到 git 账户中

1. 复制公钥，然后去 git 网站内去配置
``` bash
pbcopy < ~/.ssh/id_rsa_xxx
```

2. 配置地址：用户的 「setting」 -> 「SSH and GPG keys」 -> SSH keys 的右侧的 [New SSH key] 去添加

# 5. 新建 config 文件去配置多个 ssh-key

1. .ssh 文件内没有 config 文件的话：
``` bash
touch ~/.ssh/config
open config
```

2. 分别配置公司和自己的 ssh-key

| 键 | 值 | 规则 |
| -- | -- | -- |
| Host | 主机 | 有关联性，与以 SSH Clone 中的前缀有关联 |
| Hostname | 主机名 | 必须写正确，是你的git公有地址，比方说码云：gitee.com、github.com |
| IdentityFile | 身份文件 | 你的rsa具体路径地址 |
| User | 用户名 | 可随意写，建议使用Host的前面部分 |

config 文件内容如下：

``` bash
#gmail
Host gmail.github.com
Hostname github.com
IdentityFile ~/.ssh/id_rsa_xxx
User gmail
  
#126
Host 126.github.com
Hostname github.com
IdentityFile ~/.ssh/id_rsa_yyy
User 126
```

# 6. 测试连接

> 命令格式：`ssh -T git@{config 里面的 Host}`

连接成功时，终端中会显示：`Hi xxx！ You've successfully authenticated.but GitHub does not provide shell acess`

# 7. SSH clone 

``` bash
# 原本单个账户的情况
git clone git@github.com:xxx

# 设置多个账户和 config 后
git clone git@{config 里面的 Host}:xxx

# 后续就可以正常的操作了~
```