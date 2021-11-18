"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const type_1 = require("./type");
// import ora from 'ora'
const glob_1 = require("glob");
const colors_1 = require("colors");
const ali_oss_1 = __importDefault(require("ali-oss"));
const utils_1 = require("./utils");
const fs_1 = __importDefault(require("fs"));
const assetUploaderPlugin = (options) => {
    const oss = new ali_oss_1.default({
        region: options.region,
        accessKeyId: options.accessKeyId,
        accessKeySecret: options.accessKeySecret,
        bucket: options.bucket
    });
    const { from, dist, deleteOrigin, deleteEmptyDir, setOssPath, timeout, verbose, test, overwrite, bail, quitWpOnError, } = Object.assign(type_1.defaultOption, options);
    /**
     * 上传文件
     * @param files 所有需要上传的文件的路径列表
     * @param inVite 是否是vite
     * @param outputPath 需要上传的文件目录路径（打包输入目录路径）
     */
    const upload = async (files, inVite, outputPath = '') => {
        // 是否测试模式
        if (test) {
            console.log((0, colors_1.green)(`\n Currently running in test mode. your files won\'t realy be uploaded.\n`));
        }
        else {
            console.log((0, colors_1.green)(`\n Your files will be uploaded very soon.\n`));
        }
        // 设置文件路径信息
        const _files = files.map(file => ({
            path: file,
            fullPath: path.resolve(file)
        }));
        const filesUploaded = []; // 已上传文件列表
        const filesIgnored = []; // 已忽略的文件列表
        const filesErrors = []; // 上传失败文件列表
        const basePath = getBasePath(inVite, outputPath);
        for (let file of _files) {
            const { fullPath: filePath, path: fPath } = file;
            // 为每个文件设置上传的绝对路径
            let ossFilePath = (0, utils_1.slash)(path.join(dist, (setOssPath && setOssPath(filePath)
                || basePath && filePath.split(basePath)[1]
                || '')));
            // 查看OSS中是否存在该文件
            const fileExists = await getFileExists(ossFilePath);
            // OSS已有该文件且不需覆盖，则将文件加入忽略名单
            if (fileExists && !overwrite) {
                filesIgnored.push(filePath);
                continue;
            }
            // 测试模式
            if (test) {
                console.log((0, colors_1.blue)(fPath), `is ready to upload to ${(0, colors_1.green)(ossFilePath)}`);
                continue;
            }
            try {
                // ora(`${underline(fPath)} is uploading to ${underline(ossFilePath)}`).start()
                let result = await oss.put(ossFilePath, filePath, {
                    timeout,
                    headers: !overwrite ? { "Cache-Control": "max-age=31536000", 'x-oss-forbid-overwrite': true } : {}
                });
                result.url = (0, utils_1.normalize)(result.url);
                filesUploaded.push(fPath);
                // verbose && ora(`${blue(underline(fPath))} successfully uploaded, oss url =>  ${link(result.url, green(result.url))}`).succeed()
                if (deleteOrigin) {
                    fs_1.default.unlinkSync(filePath);
                    if (deleteEmptyDir && files.every(f => f.indexOf(path.dirname(filePath)) === -1)) {
                        cleanEmptyDir(filePath);
                    }
                }
            }
            catch (err) {
                filesErrors.push({
                    file: fPath,
                    err: { code: err.code, message: err.message, name: err.name }
                });
                const errorMsg = (0, colors_1.red)(`Failed to upload ${(0, colors_1.underline)(fPath)}: ${err.name}-${err.code}: ${err.message}`);
                // ora(errorMsg).fail()
                if (bail) {
                    console.log(` ${(0, colors_1.bgRed)((0, colors_1.white)('UPLOADING STOPPED'))} `, '\n');
                    break;
                }
            }
        }
    };
    /**
     * 获取文件的绝对路径
     * @param inVite 是否为vite
     * @param outputPath 需要上传的文件目录路径（打包输入目录路径）
     * @returns
     */
    const getBasePath = (inVite, outputPath) => {
        if (setOssPath)
            return '';
        let basePath = '';
        if (inVite) {
            if (path.isAbsolute(outputPath))
                basePath = outputPath;
            else
                basePath = path.resolve(outputPath);
        }
        else {
            const buildRoot = options.buildRoot;
            if (path.isAbsolute(buildRoot))
                basePath = buildRoot;
            else
                basePath = path.resolve(buildRoot);
        }
        return (0, utils_1.slash)(basePath);
    };
    /**
     * 根据文件路径判断OSS中是否存在该文件
     * @param filepath OSS中的文件路径
     * @returns
     */
    const getFileExists = async (filepath) => {
        return oss.get(filepath)
            .then((result) => {
            return result.res.status == 200;
        }).catch((e) => {
            if (e.code == 'NoSuchKey')
                return false;
        });
    };
    /**
     * 清空目录
     * @param filePath 文件路径
     */
    const cleanEmptyDir = (filePath) => {
        let dirname = path.dirname(filePath);
        if (fs_1.default.existsSync(dirname) && fs_1.default.statSync(dirname).isDirectory()) {
            fs_1.default.readdir(dirname, (err, files) => {
                if (err)
                    console.error(err);
                else {
                    if (!files.length) {
                        fs_1.default.rmdir(dirname, (err) => {
                            if (err) {
                                console.log((0, colors_1.red)(err));
                            }
                            else {
                                verbose && console.log((0, colors_1.green)('empty directory deleted'), dirname);
                            }
                        });
                    }
                }
            });
        }
    };
    return {
        name: 'vite-plugin-oss',
        // 在解析 Vite 配置后调用。使用这个钩子读取和存储最终解析的配置。当插件需要根据运行的命令做一些不同的事情时，它也很有用。
        // 打包好之后
        configResolved: async (config) => {
            // 获取需要上传的文件目录路径
            const outputPath = path.resolve((0, utils_1.slash)(config.build.outDir));
            // 获取需要上传的文件目录路径的所有文件的路径列表
            const files = await glob_1.glob.sync(from);
            if (files.length) {
                try {
                    upload(files, true, outputPath);
                }
                catch (err) {
                    console.log((0, colors_1.red)(err));
                }
            }
            else {
                verbose && console.log((0, colors_1.red)(`no files to be uploaded`));
            }
        }
    };
};
exports.default = assetUploaderPlugin;
