import Inspect from 'vite-plugin-inspect'
import vitePluginOss from './src/index'
export default {
  plugins: [
    Inspect(),
    vitePluginOss({
      from: './dist/**', // 上传那个文件或文件夹  可以是字符串或数组
      // dist: "/test",  // 需要上传到oss上的给定文件目录
      region: 'xxxx',
      accessKeyId: 'xxxx',
      accessKeySecret: 'xxxxxxx',
      bucket: 'xxxxx',
      test: true
    }),
  ]
}