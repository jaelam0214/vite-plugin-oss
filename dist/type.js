var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/type.ts
__export(exports, {
  defaultOption: () => defaultOption
});
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  defaultOption
});
