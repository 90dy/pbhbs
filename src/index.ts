import {docopt} from 'docopt'
import {version} from '../package.json'

const doc = `Usage: pbhbs [options] PROTOS

Parse protobuf declarations and handlebars-js templates to generate custom code

Arguments:
  PROTOS            input protos files

Options:
  -h --help         Show this
  -p --path         Adds a directory to the include path
  -o --out DIR      Specify output directory [default: cwd]
`

console.log(docopt(doc, {argv: process.argv.slice(2), help: true}))
