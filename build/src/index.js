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
const package_json_1 = require("../package.json");
const protobuf = require("protobufjs");
const fs = require("fs");
const path = require("path");
const dree = require("dree");
const handlebars = require("handlebars");
const doc = `
Usage:
  pbhbs [--debug] [--output-dir=<dir>] [--template-dir=<dir>] [--proto-path=<proto_path>...]  <protos>...
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
  -o --output-dir DIR         Specify output directory [default: .]
`;
function help() {
    console.log(doc);
    return 0;
}
function version() {
    console.log('pbhbs version ', package_json_1.version);
    return 0;
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
        options['--proto-path'].push(path.relative(process.cwd(), path.join(__dirname, "..")) || ".");
        // create protobuf root and override path resolver
        const roots = yield Promise.all(options['<protos>'].map((proto) => __awaiter(this, void 0, void 0, function* () {
            const root = new protobuf.Root();
            root.filename = proto;
            const mainFiles = [];
            root.resolvePath = function pbjsResolvePath(origin, target) {
                const normOrigin = protobuf.util.path.normalize(origin), normTarget = protobuf.util.path.normalize(target);
                if (!normOrigin) {
                    mainFiles.push(normTarget);
                }
                let resolved = protobuf.util.path.resolve(normOrigin, normTarget, true);
                const idx = resolved.lastIndexOf('google/protobuf/');
                if (idx > -1) {
                    const altname = resolved.substring(idx);
                    if (altname in protobuf.common) {
                        resolved = altname;
                    }
                }
                if (fs.existsSync(resolved)) {
                    return resolved;
                }
                for (let i = 0; i < options['--proto-path'].length; ++i) {
                    const iresolved = protobuf.util.path.resolve(options['--proto-path'][i] + '/', target);
                    if (fs.existsSync(iresolved)) {
                        return iresolved;
                    }
                }
                return resolved;
            };
            // FIXME: resolveAll() failed caused by extensions (no problem in cli mode)
            return root.load(proto);
        })));
        console.debug(roots);
        // find template
        const templates = [];
        dree.scan(options['--template-dir'], { extensions: ['hbs'] }, (file) => {
            console.debug(`template found: ${file.path}`);
            templates.push(file);
        });
        // init handlebar
        yield Promise.all(templates.map((tmpl) => __awaiter(this, void 0, void 0, function* () {
            console.log(`template found: ${tmpl.name}`);
            yield Promise.all(roots.map((root) => __awaiter(this, void 0, void 0, function* () {
                const name = handlebars.compile(tmpl.name)(root);
                console.debug(`generating ${name}`);
                // apply on name
                // for each name create file
                // for each file generate content
            })));
        })));
        return 0;
    });
}
exports.main = main;
//# sourceMappingURL=index.js.map