var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.ts
__export(exports, {
  default: () => assetUploaderPlugin
});
var path = __toModule(require("path"));

// src/type.ts
var defaultOption = {
  test: false,
  verbose: true,
  dist: "",
  buildRoot: ".",
  deleteOrigin: false,
  deleteEmptyDir: false,
  timeout: 30 * 1e3,
  overwrite: true,
  bail: false,
  quitWpOnError: false
};

// src/index.ts
var import_glob = __toModule(require("glob"));
var import_colors = __toModule(require("colors"));
var import_ali_oss = __toModule(require("ali-oss"));

// src/utils.ts
var normalize = (url) => {
  const tmpArr = url.split(/\/{2,}/);
  if (tmpArr.length > 2) {
    const [protocol, ...rest] = tmpArr;
    url = protocol + "//" + rest.join("/");
  }
  return url;
};
var slash = (path2) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path2);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path2);
  if (isExtendedLengthPath || hasNonAscii) {
    return path2;
  }
  return path2.replace(/\\/g, "/");
};

// src/index.ts
var import_fs = __toModule(require("fs"));
function assetUploaderPlugin(options) {
  const oss = new import_ali_oss.default({
    region: options.region,
    accessKeyId: options.accessKeyId,
    accessKeySecret: options.accessKeySecret,
    bucket: options.bucket
  });
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
    bail,
    quitWpOnError
  } = Object.assign(defaultOption, options);
  const upload = async (files, inVite, outputPath = "") => {
    if (test) {
      console.log((0, import_colors.green)(`
 Currently running in test mode. your files won't realy be uploaded.
`));
    } else {
      console.log((0, import_colors.green)(`
 Your files will be uploaded very soon.
`));
    }
    const _files = files.map((file) => ({
      path: file,
      fullPath: path.resolve(file)
    }));
    const filesUploaded = [];
    const filesIgnored = [];
    const filesErrors = [];
    const basePath = getBasePath(inVite, outputPath);
    for (let file of _files) {
      const { fullPath: filePath, path: fPath } = file;
      let ossFilePath = slash(path.join(dist, setOssPath && setOssPath(filePath) || basePath && filePath.split(basePath)[1] || ""));
      const fileExists = await getFileExists(ossFilePath);
      if (fileExists && !overwrite) {
        filesIgnored.push(filePath);
        continue;
      }
      if (test) {
        console.log((0, import_colors.blue)(fPath), `is ready to upload to ${(0, import_colors.green)(ossFilePath)}`);
        continue;
      }
      try {
        let result = await oss.put(ossFilePath, filePath, {
          timeout,
          headers: !overwrite ? { "Cache-Control": "max-age=31536000", "x-oss-forbid-overwrite": true } : {}
        });
        result.url = normalize(result.url);
        filesUploaded.push(fPath);
        if (deleteOrigin) {
          import_fs.default.unlinkSync(filePath);
          if (deleteEmptyDir && files.every((f) => f.indexOf(path.dirname(filePath)) === -1)) {
            cleanEmptyDir(filePath);
          }
        }
      } catch (err) {
        filesErrors.push({
          file: fPath,
          err: { code: err.code, message: err.message, name: err.name }
        });
        const errorMsg = (0, import_colors.red)(`Failed to upload ${(0, import_colors.underline)(fPath)}: ${err.name}-${err.code}: ${err.message}`);
        if (bail) {
          console.log(` ${(0, import_colors.bgRed)((0, import_colors.white)("UPLOADING STOPPED"))} `, "\n");
          break;
        }
      }
    }
  };
  const getBasePath = (inVite, outputPath) => {
    if (setOssPath)
      return "";
    let basePath = "";
    if (inVite) {
      if (path.isAbsolute(outputPath))
        basePath = outputPath;
      else
        basePath = path.resolve(outputPath);
    } else {
      const buildRoot = options.buildRoot;
      if (path.isAbsolute(buildRoot))
        basePath = buildRoot;
      else
        basePath = path.resolve(buildRoot);
    }
    return slash(basePath);
  };
  const getFileExists = async (filepath) => {
    return oss.get(filepath).then((result) => {
      return result.res.status == 200;
    }).catch((e) => {
      if (e.code == "NoSuchKey")
        return false;
    });
  };
  const cleanEmptyDir = (filePath) => {
    let dirname2 = path.dirname(filePath);
    if (import_fs.default.existsSync(dirname2) && import_fs.default.statSync(dirname2).isDirectory()) {
      import_fs.default.readdir(dirname2, (err, files) => {
        if (err)
          console.error(err);
        else {
          if (!files.length) {
            import_fs.default.rmdir(dirname2, (err2) => {
              if (err2) {
                console.log((0, import_colors.red)(err2));
              } else {
                verbose && console.log((0, import_colors.green)("empty directory deleted"), dirname2);
              }
            });
          }
        }
      });
    }
  };
  return {
    name: "vite-plugin-oss",
    configResolved: async (config) => {
      const outputPath = path.resolve(slash(config.build.outDir));
      const files = await import_glob.glob.sync(from);
      if (files.length) {
        try {
          upload(files, true, outputPath);
        } catch (err) {
          console.log((0, import_colors.red)(err));
        }
      } else {
        verbose && console.log((0, import_colors.red)(`no files to be uploaded`));
      }
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
