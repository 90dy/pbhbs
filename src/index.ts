import {docopt} from 'docopt'
import {version as pkgVersion} from '../package.json'
import * as pbjs from 'protobufjs/cli/pbjs'
import * as protobuf from 'protobufjs'
import * as fs from 'fs'
import * as path from 'path'
import * as dree from 'dree'
import * as handlebars from 'handlebars'
import * as fse from 'fs-extra'
import * as handlebarsHelper from 'handlebars-helpers'
import * as helpers from '../helper'

const doc = `
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
  -o --output-dir DIR         Specify output directory [default: .]
`

declare class PbhbsOptions {
  '--debug': boolean
  '--help': boolean
  '--version': boolean
  '--output-dir': string
  '--proto-path': string[]
  '--template-dir': string
  '--helper-dir': string
  '<protos>': string[]
}

function help(): number {
  console.log(doc)
  return 0
}

function version(): number {
  console.log('pbhbs version ', pkgVersion)
  return 0
}

function getAbsolutePath(paths: string[], target: string): string {
  const resolved: string[] = [
    ...paths.map(_ => path.normalize(_ + '/' + target)),
    ...paths.map(_ => path.resolve(process.cwd(), target)),
  ]

  const res = resolved.find(_ => fs.existsSync(_))
  if (res == null) {
    throw new Error(`cannot find path for target: ${target}`)
  }
  return fs.realpathSync(res)
}

function getRelativePath(paths: string[], target: string): string {
  const abs = getAbsolutePath(paths, target)

  const pathIndex = paths.findIndex(_ => abs.match(new RegExp(`^${_}`)) ? true : false)
  if (pathIndex === -1) {
    throw new Error(`cannot get relative path for target: ${abs}`)
  }
  return abs.replace(paths[pathIndex], '')
}

export async function main(argv: string[]): Promise<number> {
  const options: PbhbsOptions = docopt(doc, {argv: process.argv.slice(2), help: false})

  if (options['--debug'] === false) {
    console.debug = () => {}
  }
  console.debug(options)

  if (options['--help'] !== false) {
    return help()
  }

  if (options['--version'] !== false) {
    return version()
  }

  // get relative .proto path from include path
  options['--proto-path'] = [...options['--proto-path'], '.'].map(_ => fs.realpathSync(path.resolve(_)) + '/')
  options['<protos>'] = options['<protos>'].map(_ => getRelativePath(options['--proto-path'], _))

  // create protobuf root and override path resolver
  const roots: protobuf.Root[] = await Promise.all(
    options['<protos>'].map(async (proto: string): Promise<protobuf.Root> => {
      const root = new protobuf.Root()
      root.filename = proto

      root.resolvePath = function pbjsResolvePath(origin: string, target: string): string {
        return getAbsolutePath([origin, ...options['--proto-path']], target)
      }
      return root.load(proto)
    })
  )

  // add helpers to handlebars
  handlebarsHelper(handlebars)
  if (options['--helper-dir'] != null) {
    const helpers: dree.Dree[] = []
    dree.scan(options['--helper-dir'], { extensions: ['js', 'ts'] }, (file: dree.Dree) => {
      console.debug(`helper found: ${file.relativePath}`)
      helpers.push(file)
    })
    helpers.forEach(file => {
      const handlebarsHelper = require(file.path)
      if (handlebarsHelper && typeof handlebarsHelper.register === 'function') {
        console.debug(`${file.relativePath} has a register function, registering with handlebars`)
        handlebarsHelper.register(handlebars)
      } else {
        console.error(`WARNING: helper ${file.relativePath} does not export a 'register' function, cannot import`)
      }
    })
  }

  // find template
  const templates: dree.Dree[] = []
  dree.scan(options['--template-dir'], { extensions: ['hbs'] }, (file: dree.Dree) => {
    console.debug(`template found: ${file.relativePath}`)
    templates.push(file)
  })


  // create output files
  templates.map((tmpl: dree.Dree): void => {
    roots.map((root: protobuf.Root): void => {
      const name: string = path.normalize(
        options['--output-dir'] + '/' +
        handlebars.compile(tmpl.relativePath)(root).replace(/\.hbs$/, '')
      )
      console.debug(`creating file ${name}`)
      return fse.outputFileSync(name, '')
    })
  })

  // generate file content
  templates.map((tmpl: dree.Dree): void => {
    roots.map((root: protobuf.Root): void => {

      // apply on name
      const name: string = path.normalize(
        options['--output-dir'] + '/' +
        handlebars.compile(tmpl.relativePath)(root).replace(/\.hbs$/, '')
      )
      console.debug(`generating file content for ${name}`)

      // generate content
      try {
        const content = handlebars.compile(fs.readFileSync(tmpl.path, 'utf8'))(root)
        console.debug(content)
        return fs.appendFileSync(name, content)
      } catch (err) {
        throw new Error(err.message + ' for template ' + tmpl.relativePath + ' line ' + err.lineNumber)
      }
    })
  })

  return 0
}
