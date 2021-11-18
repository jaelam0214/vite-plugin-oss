var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/utils.ts
__export(exports, {
  normalize: () => normalize,
  slash: () => slash
});
var normalize = (url) => {
  const tmpArr = url.split(/\/{2,}/);
  if (tmpArr.length > 2) {
    const [protocol, ...rest] = tmpArr;
    url = protocol + "//" + rest.join("/");
  }
  return url;
};
var slash = (path) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path);
  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }
  return path.replace(/\\/g, "/");
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  normalize,
  slash
});
