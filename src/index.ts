import {docopt} from 'docopt'
import * as dree from 'dree'
import * as fs from 'fs'
import * as fse from 'fs-extra'
import * as handlebars from 'handlebars'
import * as handlebarsHelper from 'handlebars-helpers'
import * as path from 'path'
import * as protobuf from 'protobufjs'
import * as pbjs from 'protobufjs/cli/pbjs'

import * as helpers from '../helper'
import {version as pkgVersion} from '../package.json'

const doc = `pbhbs version ${pkgVersion}

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
  -o --output-dir DIR         Specify output directory [default: .]`

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

function help(): number{
  console.log(doc)
  return 0
}

function version(): number {
  console.log(`pbhbs version ${pkgVersion}`)
  return 0
}

function getAbsolutePath(paths: string[], target: string): string {
  const resolved: string[] =
    [
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

  const pathIndex =
    paths.findIndex(_ => abs.match(new RegExp(`^${_}`)) ? true : false)
  if (pathIndex === -1) {
    throw new Error(`cannot get relative path for target: ${abs}`)
  }
  return abs.replace(paths[pathIndex], '')
}

export async function main(argv: string[]): Promise<number> {
  const options: PbhbsOptions =
  docopt(doc, {argv: process.argv.slice(2), help: false})

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
  options['--proto-path'] = [...options['--proto-path'], '.'].map(
    _ => fs.realpathSync(path.resolve(_)) + '/'
  )
  options['<protos>'] = options['<protos>'].map(
    _ => getRelativePath(options['--proto-path'], _)
  )

  const root = new protobuf.Root()

  // permit to resolve proto-path
  root.resolvePath = function pbjsResolvePath(origin: string, target: string): string {
    return getAbsolutePath([origin, ...options['--proto-path']], target)
  }

  root.loadSync(options['<protos>']).resolveAll()

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
      if (handlebarsHelper &&
        typeof handlebarsHelper.register === 'function') {
        console.debug(`${
          file.relativePath} has a register function, registering with handlebars`)
        handlebarsHelper.register(handlebars)
      }
      else {
        console.error(`WARNING: helper ${
          file.relativePath} does not export a 'register' function, cannot import`)
      }
    })
  }

  // find template
  const templates: dree.Dree[] = []
  dree.scan(options['--template-dir'], { extensions: ['hbs'] }, (file: dree.Dree) => {
    console.debug(`template found: ${file.relativePath}`)
    templates.push(file)
  })


  // create output files and generate file content
  templates.forEach((tmpl: dree.Dree): void => {
    options['<protos>'].forEach((proto: string): void => {
      // use proto filename as root filename
      root.filename = proto

      const name: string = path.normalize(
        options['--output-dir'] + '/' +
        handlebars.compile(tmpl.relativePath, {noEscape: true})(root).replace(/\.hbs$/, '')
      )

      console.debug(`creating file ${name}`)

      fse.outputFileSync(name, '')

      // apply on name
      console.debug(`generating file content for ${name}`)

      // generate content
      try {
        const content = handlebars.compile(
          fs.readFileSync(tmpl.path, 'utf8'), {noEscape: true})(root)
        fs.appendFileSync(name, content)
      } catch (err) {
        throw new Error(
          err.message + ' for template ' + tmpl.relativePath +
          ' line ' + err.lineNumber)
      }
    })})

  return 0
}
