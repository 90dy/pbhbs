import { Options } from './cli';
export interface Bag<T> {
    [script: string]: T;
}
export interface PackageJson {
    version?: string;
    devDependencies?: Bag<string>;
    scripts?: Bag<string>;
    name?: string;
    description?: string;
    main?: string;
    types?: string;
    files?: string[];
    license?: string;
    keywords?: string[];
}
export declare function addScripts(packageJson: PackageJson, options: Options): Promise<boolean>;
export declare function addDependencies(packageJson: PackageJson, options: Options): Promise<boolean>;
export declare function init(options: Options): Promise<boolean>;
