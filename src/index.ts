import {docopt} from 'docopt'
import {version as pkgVersion} from '../package.json'
import * as pbjs from 'protobufjs/cli/pbjs'
import * as protobuf from 'protobufjs'
import * as fs from 'fs'
import * as path from 'path'
import * as dree from 'dree'
import * as handlebars from 'handlebars'

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
`

declare class PbhbsOptions {
  '--debug': boolean
  '--help': boolean
  '--version': boolean
  '--output-dir': string
  '--proto-path': string[]
  '--template-dir': string
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

  options['--proto-path'].push(path.relative(process.cwd(), path.join(__dirname, "..")) || ".")
  // create protobuf root and override path resolver
  const roots: protobuf.Root[] = await Promise.all(
    options['<protos>'].map(async (proto: string): Promise<protobuf.Root> => {
      const root = new protobuf.Root()
      root.filename = proto


      const mainFiles: string[] = []

      root.resolvePath = function pbjsResolvePath(origin: string, target: string): string {

        const normOrigin = protobuf.util.path.normalize(origin),
          normTarget = protobuf.util.path.normalize(target)
        if (!normOrigin) {
          mainFiles.push(normTarget)
        }

        let resolved = protobuf.util.path.resolve(normOrigin, normTarget, true)
        const idx = resolved.lastIndexOf('google/protobuf/')
        if (idx > -1) {
          const altname = resolved.substring(idx)
          if (altname in protobuf.common) {
            resolved = altname
          }
        }

        if (fs.existsSync(resolved)) {
          return resolved
        }

        for (let i = 0; i < options['--proto-path'].length; ++i) {
          const iresolved = protobuf.util.path.resolve(options['--proto-path'][i] + '/', target)
          if (fs.existsSync(iresolved)) {
            return iresolved
          }
        }
        return resolved
      }
      // FIXME: resolveAll() failed caused by extensions (no problem in cli mode)
      return root.load(proto)
    })
  )

  console.debug(roots)

  // find template
  const templates: dree.Dree[] = []
  dree.scan(options['--template-dir'], { extensions: ['hbs'] }, (file: dree.Dree) => {
    console.debug(`template found: ${file.path}`)
    templates.push(file)
  })

  // init handlebar
  await Promise.all(templates.map(async (tmpl: dree.Dree): Promise<void> => {
    console.log(`template found: ${tmpl.name}`)
    await Promise.all(roots.map(async (root: protobuf.Root): Promise<void> => {

    const name: string = handlebars.compile(tmpl.name)(root)
    console.debug(`generating ${name}`)

    // apply on name


   // for each name create file

      // for each file generate content
   }))
  }))

  return 0
}
