"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docopt_1 = require("docopt");
const doc = `Usage: pbhbs [options] PROTOS

Parse protobuf declarations and handlebars-js templates to generate custom code

Arguments:
  PROTOS            input protos files

Options:
  -h --help         Show this
  -p --path         Adds a directory to the include path
  -o --out DIR      Specify output directory [default: cwd]
`;
console.log(docopt_1.docopt(doc, { argv: process.argv.slice(2), help: true }));
//# sourceMappingURL=index.js.map