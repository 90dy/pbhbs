"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const docopt_1 = require("docopt");
const dree = require("dree");
const fs = require("fs");
const fse = require("fs-extra");
const handlebars = require("handlebars");
const handlebarsHelper = require("handlebars-helpers");
const path = require("path");
const protobuf = require("protobufjs");
const package_json_1 = require("../package.json");
const doc = `pbhbs version ${package_json_1.version}

Usage:
  pbhbs [--debug] [--output-dir=<dir>] [--template-dir=<dir>] [--proto-path=<proto_path>...] [--helper-dir=<helper-dir>]  <protos>...
  pbhbs [--debug] (-h | --help)
  pbhbs [--debug] (-v | --version)

Parse protobuf declarations and handlebars-js templates to generate custom files

Arguments:
  protos                      Protos input files

Options:
  -h --help                   Show this
  -v --version                Show current version
  -d --debug                  Display debug informations
  -p --proto-path DIR         Adds a directory to the include path
  -t --template-dir DIR       Specify templates directory [default: ./template]
  -H --helper-dir DIR         Specify handlebars helper directory
  -o --output-dir DIR         Specify output directory [default: .]`;
function help() {
    console.log(doc);
    return 0;
}
function version() {
    console.log(`pbhbs version ${package_json_1.version}`);
    return 0;
}
function getAbsolutePath(paths, target) {
    const resolved = [
        ...paths.map(_ => path.normalize(_ + '/' + target)),
        ...paths.map(_ => path.resolve(process.cwd(), target)),
    ];
    const res = resolved.find(_ => fs.existsSync(_));
    if (res == null) {
        throw new Error(`cannot find path for target: ${target}`);
    }
    return fs.realpathSync(res);
}
function getRelativePath(paths, target) {
    const abs = getAbsolutePath(paths, target);
    const pathIndex = paths.findIndex(_ => abs.match(new RegExp(`^${_}`)) ? true : false);
    if (pathIndex === -1) {
        throw new Error(`cannot get relative path for target: ${abs}`);
    }
    return abs.replace(paths[pathIndex], '');
}
function main(argv) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = docopt_1.docopt(doc, { argv: process.argv.slice(2), help: false });
        if (options['--debug'] === false) {
            console.debug = () => { };
        }
        console.debug(options);
        if (options['--help'] !== false) {
            return help();
        }
        if (options['--version'] !== false) {
            return version();
        }
        // get relative .proto path from include path
        options['--proto-path'] = [...options['--proto-path'], '.'].map(_ => fs.realpathSync(path.resolve(_)) + '/');
        options['<protos>'] = options['<protos>'].map(_ => getRelativePath(options['--proto-path'], _));
        const root = new protobuf.Root();
        // permit to resolve proto-path
        root.resolvePath = function pbjsResolvePath(origin, target) {
            return getAbsolutePath([origin, ...options['--proto-path']], target);
        };
        root.loadSync(options['<protos>']).resolveAll();
        // add helpers to handlebars
        handlebarsHelper({ handlebars });
        console.log(handlebarsHelper);
        if (options['--helper-dir'] != null) {
            const helpers = [];
            dree.scan(options['--helper-dir'], { extensions: ['js', 'ts'] }, (file) => {
                console.debug(`helper found: ${file.relativePath}`);
                helpers.push(file);
            });
            helpers.forEach(file => {
                const handlebarsHelper = require(file.path);
                if (handlebarsHelper &&
                    typeof handlebarsHelper.register === 'function') {
                    console.debug(`${file.relativePath} has a register function, registering with handlebars`);
                    handlebarsHelper.register(handlebars);
                }
                else {
                    console.error(`WARNING: helper ${file.relativePath} does not export a 'register' function, cannot import`);
                }
            });
        }
        // find template
        const templates = [];
        dree.scan(options['--template-dir'], { extensions: ['hbs'] }, (file) => {
            console.debug(`template found: ${file.relativePath}`);
            templates.push(file);
        });
        // create output files and generate file content
        templates.forEach((tmpl) => {
            options['<protos>'].forEach((proto) => {
                // use proto filename as root filename
                root.filename = proto;
                const name = path.normalize(options['--output-dir'] + '/' +
                    handlebars.compile(tmpl.relativePath, { noEscape: true })(root).replace(/\.hbs$/, ''));
                console.debug(`creating file ${name}`);
                fse.outputFileSync(name, '');
                // apply on name
                console.debug(`generating file content for ${name}`);
                // generate content
                try {
                    const content = handlebars.compile(fs.readFileSync(tmpl.path, 'utf8'), { noEscape: true })(root);
                    fs.appendFileSync(name, content);
                }
                catch (err) {
                    throw new Error(err.message + ' for template ' + tmpl.relativePath +
                        ' line ' + err.lineNumber);
                }
            });
        });
        return 0;
    });
}
exports.main = main;
//# sourceMappingURL=index.js.map