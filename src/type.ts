export type OSSOptions = {
  region: string  // OSS region
  accessKeyId: string // OSS accessKeyId
  accessKeySecret: string // OSS accessKeySecret
  bucket: string  // OSS bucker
}

export type OptionalOptions = {
  from: string  // 上传哪些文件，支持类似gulp.src的glob方法，如'./build/**', 可以为glob字符串
  test?: boolean  // 测试
  verbose?: boolean  // 输出log
  dist?: string // oss目录
  buildRoot?: string // 构建目录名
  deleteOrigin?: boolean  // 是否删除源文件
  deleteEmptyDir?: boolean  // 是否删除源文件目录， deleteOrigin 为true时有效
  timeout?: number  // 超时时间
  setOssPath?: (filePath: string) => string // 手动设置每个文件的上传路径
  overwrite?: boolean  // 覆盖oss同名文件
  bail?: boolean  // 出错中断上传
  quitWpOnError?: boolean // 出错中断打包
}

export type PluginOptions = OSSOptions & OptionalOptions


export const defaultOption = {
  test: false,
  verbose: true,
  dist: '',
  buildRoot: '.',
  deleteOrigin: false,
  deleteEmptyDir: false,
  timeout: 30 * 1000,
  overwrite: true,
  bail: false,
  quitWpOnError: false,
} as OptionalOptions