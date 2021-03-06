export declare type OSSOptions = {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
};
export declare type OptionalOptions = {
    from: string;
    test?: boolean;
    verbose?: boolean;
    dist?: string;
    buildRoot?: string;
    deleteOrigin?: boolean;
    deleteEmptyDir?: boolean;
    timeout?: number;
    setOssPath?: (filePath: string) => string;
    overwrite?: boolean;
    quitWpOnError?: boolean;
    version?: string;
    setVersion?: (data: {
        version: string;
    }) => void;
};
export declare type PluginOptions = OSSOptions & OptionalOptions;
export declare const defaultOption: OptionalOptions;
