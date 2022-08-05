import { Plugin } from 'vite'
import * as path from 'path'
import { defaultOption, PluginOptions } from './type'
import { glob } from 'glob'
import { red, blue, green, underline, yellow, white } from 'colors'
import OSS from 'ali-oss'
import { normalize, slash } from './utils'
import fs from 'fs'

const assetUploaderPlugin = (options: PluginOptions): Plugin => {
  const oss = new OSS({
    region: options.region,
    accessKeyId: options.accessKeyId,
    accessKeySecret: options.accessKeySecret,
    bucket: options.bucket
  })
  const {
    from,
    dist,
    deleteOrigin,
    deleteEmptyDir,
    setOssPath,
    timeout,
    verbose,
    test,
    overwrite,
    version,
    setVersion
  } = Object.assign(defaultOption, options)
  /**
   * 上传文件
   * @param files 所有需要上传的文件的路径列表
   * @param inVite 是否是vite
   * @param outputPath 需要上传的文件目录路径（打包输入目录路径）
   */
  const upload = async (files: string[], inVite: boolean, outputPath: string = '') => {
    // 是否测试模式
    if (test) {
      console.log(green(`\n Currently running in test mode. your files won\'t realy be uploaded.\n`))
    } else {
      console.log(green(`\n Your files will be uploaded very soon.\n`))
    }
    // 设置文件路径信息
    const _files = files.map(file => ({
      path: file,
      fullPath: path.resolve(file)
    }))
    const filesUploaded = []  // 已上传文件列表
    const filesIgnored = [] // 已忽略的文件列表
    const filesErrors = []  // 上传失败文件列表

    const basePath = getBasePath(inVite, outputPath)
    const fileCount = _files.length
    for (let i = 0; i < fileCount; i++) {
      const file = _files[i]
      const { fullPath: filePath, path: fPath } = file
      // 为每个文件设置上传的绝对路径
      let ossFilePath = await slash(
        path.join(
          dist as string,
          (
            setOssPath && setOssPath(filePath)
            || basePath && filePath.split(basePath)[1]
            || ''
          )
        )
      )
      // 查看OSS中是否存在该文件
      const fileExists = await getFileExists(ossFilePath)
      console.log(yellow(`\n oss中 ${underline(ossFilePath)} ${fileExists ? '已存在' : '不存在'}`))

      // OSS已有该文件且不需覆盖，则将文件加入忽略名单
      if (fileExists && !overwrite) {
        filesIgnored.push(filePath)
        continue
      }
      // 测试模式
      if (test) {
        console.log(blue(fPath), `is ready to upload to ${green(ossFilePath)} \n`)
        continue
      }

      try {
        verbose && console.log(`\n ${i + 1}/${fileCount} ${white(underline(fPath))} uploading...`)

        let result = await oss.put(ossFilePath, filePath, {
          timeout,
          headers: !overwrite ? { "Cache-Control": "max-age=31536000", 'x-oss-forbid-overwrite': true } : {}
        })

        result.url = normalize(result.url)
        filesUploaded.push(fPath)
        verbose && console.log(`\n ${i + 1}/${fileCount} ${blue(underline(fPath))} successfully uploaded, oss url =>  ${green(underline(result.url))}`)

        if (deleteOrigin) {
          fs.unlinkSync(filePath)
          if (deleteEmptyDir && files.every(f => f.indexOf(path.dirname(filePath)) === -1)) {
            cleanEmptyDir(filePath)
          }
        }
      } catch (err: any) {
        filesErrors.push({
          file: fPath,
          err: { code: err.code, message: err.message, name: err.name }
        })

        const errorMsg = red(`\n Failed to upload ${underline(fPath)}: ${err.name}-${err.code}: ${err.message}`)
        console.log(red(errorMsg))
      }
    }
    try {
      if (setVersion && version && !test) {
        await setVersion({ version: version })
        console.log('更新版本号')
      }
    } catch (err: any) {
      console.log(red(`更新版本号出错了...`))
    }
  }

  /**
   * 获取文件的绝对路径
   * @param inVite 是否为vite
   * @param outputPath 需要上传的文件目录路径（打包输入目录路径）
   * @returns 
   */
  const getBasePath = (inVite: boolean, outputPath: string): string => {
    if (setOssPath) return ''
    let basePath = ''
    if (inVite) {
      if (path.isAbsolute(outputPath)) basePath = outputPath
      else basePath = path.resolve(outputPath)
    } else {
      const buildRoot = options.buildRoot as string
      if (path.isAbsolute(buildRoot)) basePath = buildRoot
      else basePath = path.resolve(buildRoot)
    }
    return slash(basePath)
  }

  /**
   * 根据文件路径判断OSS中是否存在该文件
   * @param filepath OSS中的文件路径
   * @returns 
   */
  const getFileExists = async (filepath: string) => {
    return oss.get(filepath)
      .then((result) => {
        return result.res.status == 200
      }).catch((e) => {
        if (e.code == 'NoSuchKey') return false
      })
  }

  /**
   * 清空目录
   * @param filePath 文件路径
   */
  const cleanEmptyDir = (filePath: string) => {
    let dirname = path.dirname(filePath)
    if (fs.existsSync(dirname) && fs.statSync(dirname).isDirectory()) {
      fs.readdir(dirname, (err, files) => {
        if (err) console.error(err)
        else {
          if (!files.length) {
            fs.rmdir(dirname, (err: any) => {
              if (err) {
                console.log(red(err))
              } else {
                verbose && console.log(green('empty directory deleted'), dirname)
              }
            })
          }
        }
      })
    }
  }
  let outputPath = ''
  return {
    name: 'vite-plugin-oss',
    // 在解析 Vite 配置后调用。使用这个钩子读取和存储最终解析的配置。当插件需要根据运行的命令做一些不同的事情时，它也很有用。
    configResolved: async (config) => {
      // 获取需要上传的文件目录路径
      outputPath = path.resolve(slash(config.build.outDir))
    },
    // 打包完成后执行上传
    closeBundle: async () => {
      // 获取需要上传的文件目录路径的所有文件的路径列表
      const files = glob.sync(from)
      console.log(`需要更新上传的文件目录${files}`)

      if (files.length) {
        try {
          await upload(files, true, outputPath)
        } catch (err: any) {
          console.log(red(err))
        }
      } else {
        verbose && console.log(red(`no files to be uploaded`))
      }
    }
  }
}
export default assetUploaderPlugin