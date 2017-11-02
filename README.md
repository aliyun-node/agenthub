agenthub
===========

agenthub 是由 Node.js 性能平台提供的 agent 命令程序，用于协助您的 Node 应用性能数据上报和问题诊断。

- [![Dependencies Status](https://david-dm.org/aliyun-node/@alicloud/agenthub.png)](https://david-dm.org/aliyun-node/@alicloud/agenthub)

## 安装

```sh
$ npm install @alicloud/agenthub -g
```

以上命令会将 agenthub 安装为一个全局的命令行工具。

## 使用
agenthub 需要一个配置文件来进行使用，agenthub 仅会在配置指定下的目录执行命令或读取日志。

### 极简配置

最简单的配置只需要传入 appid 和 secret 即可，格式如下：

```json
{
  "appid": "<YOUR APPID>",
  "secret": "<YOUR SECRET>",
}
```

保存为 `config.json` ，完成配置后，请使用以下命令进行执行：

```sh
$ nohup agenthub config.json &
```

agenthub 将以常驻进程的方式执行。部署完成后，请访问 <https://node.console.aliyun.com/> 查看您的应用详情。如果一切正常，稍等片刻（1分钟）即可收到你的应用性能数据。

### 详细配置

详细配置如下所示：

```json
{
  "server": "<SERVER IP>:8080",
  "appid": "<YOUR APPID>",
  "secret": "<YOUR SECRET>",
  "logdir": "</path/to/your/log/dir>",
  "error_log": [
    "</path/to/your/error.log>",
    "您的应用在业务层面产生的异常日志的路径",
    "例如：/root/.logs/error.#YYYY#-#MM#-#DD#-#HH#.log",
    "可选"
  ],
  "packages": [
    "</path/to/your/package.json>",
    "可以输入多个package.json的路径",
    "可选"
  ]
}
```
error_log 配置完成后您可以在 Node.js 性能平台上看到规整后的错误日志信息；packages 配置完成后您可以看到项目的版本依赖，以及对应的安全风险提示。

> 配置中的#YYYY#、#MM#、#DD#、#HH#是通配符，如果您的异常日志是按时间生成的，请使用它。

## 联系我们

所有使用中遇到的问题，请咨询钉钉群：11794270。

## License

[MIT](LICENSE)
