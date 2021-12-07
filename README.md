# vite-plugin-oss
一个可以将打包好的文件目录上传到阿里OSS的vite(version>=2.6.0)插件。
# Install 安装
```
npm i vite-plugin-oss -D
```

# Options 配置参数
* region: 必传。阿里云上传区域
* accessKeyId: 必传。阿里云的授权accessKeyId
* accessKeySecret: 必传。阿里云的授权accessKeySecret
* bucket: 必传。上传到哪个bucket
* from: 必传。上传哪些文件，支持类似gulp.src的glob方法，如'./build/**', 为glob字符串。
* dist: 上传到oss哪个目录下，默认为oss根目录。可作为路径前缀使用。
* timeout: oss超时设置，默认为30秒(30000)
* overwrite: 是否覆盖oss同名文件。默认true。
* verbose: 是否显示上传日志，默认为true。
* deletOrigin: 上传完成是否删除原文件，默认false。
* deleteEmptyDir: 如果某个目录下的文件都上传过了，是否删除此目录。deleteOrigin为true时候生效。默认false。
* setOssPath: 自定义每个文件上传路径。接收参数为当前文件路径。不传，或者所传函数返回false则按默认方式上传。
* test: 测试，仅查看文件和上传路径，但是不执行上传操作。默认false。
* quitWpOnError: 出错是否中断打包。默认false。
* version: 版本号。默认为''。
* setVersion: 设置线上的版本号的方法。一般为axios请求方法，需同时配置version。
## 注意: accessKeyId, accessKeySecret 很重要，注意保密!!!

# Basic Exapmle 基本例子
```
// vite.config.js
import { defineConfig } from 'vite'
import VitePluginOss from 'vite-plugin-oss'

export default defineConfig({
  plugins: [
    VitePluginOss({
      from: './dist/**', // 上传那个文件或文件夹
      dist: "/test",  // 需要上传到oss上的给定文件目录
      region: 'oss-xx-xx-1',
      accessKeyId: 'xxxxxxxxxxxx',
      accessKeySecret: 'xxxxxxxxxxxx',
      bucket: 'xxxxxxxxx',
      test: true, // 测试，可以在进行测试看上传路径是否正确, 打开后只会显示上传路径并不会真正上传。默认false
      // 因为文件标识符 "\"  和 "/" 的区别 不进行 setOssPath配置,上传的文件夹就会拼到文件名上, 丢失了文件目录,所以需要对setOssPath 配置。
      setOssPath: filePath => {
        let index = filePath.lastIndexOf("dist")
        let Path = filePath.substring(index + 4, filePath.length)
        return Path.replace(/\\/g, "/")
      },
    })
  ],
});
```

# Custom Exapmle 指定环境（模式）下使用例子
## 该例子为在执行 npm run build:oss 时引入插件
### 1.在项目根目录下增加环境配置文件 .env.oss
```
NODE_ENV = oss
```

### 2.package.json 增加打包命令-oss模式。
"build:oss": "vue-tsc --noEmit && vite build --mode oss"
```
{
  "scripts": {
    "dev": "vite",
    "build:prod": "vue-tsc --noEmit && vite build",
    "build:oss": "vue-tsc --noEmit && vite build --mode oss",
  },
}
```
### vite.config.js 按需引入
```
import { defineConfig } from 'vite'
import VitePluginOss from 'vite-plugin-oss'

export default ({ mode }) => {
  const plugins = []  // 可将其他插件放入该数组
  if (mode === 'oss') { // 仅oss模式下引入
    plugins.push(VitePluginOss({
      from: './dist/**', // 上传那个文件或文件夹
      dist: "/test",  // 需要上传到oss上的给定文件目录
      region: 'oss-xx-xx-1',
      accessKeyId: 'xxxxxxxxxxxx',
      accessKeySecret: 'xxxxxxxxxxxx',
      bucket: 'xxxxxxxxx',
      test: true, // 测试，可以在进行测试看上传路径是否正确, 打开后只会显示上传路径并不会真正上传。默认false
      // 因为文件标识符 "\"  和 "/" 的区别 不进行 setOssPath配置,上传的文件夹就会拼到文件名上, 丢失了文件目录,所以需要对setOssPath 配置。
      setOssPath: filePath => {
        // some operations to filePath
        let index = filePath.lastIndexOf("dist")
        let Path = filePath.substring(index + 4, filePath.length)
        return Path.replace(/\\/g, "/")
      },
    }))
  }
  return defineConfig({
    base: mode === 'oss' ? './' : '/',
    plugins: plugins,
}
```

# 后续计划
* 优化代码结构
* 集成七牛云OSS等其他SDK
* 优化控制台输出日志
* ...