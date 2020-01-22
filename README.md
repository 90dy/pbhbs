# pbhbs

Generate files based on protobuf definition and handlebars templates.

## Getting Started


### Prerequisites

You need to have [yarn](https://github.com/yarnpkg/yarn) or [npm](https://github.com/npm/cli) installed

### Installation

With yarn
```bash
yarn global add pbhbs
```

With npm
```bash
npm install -g pbhbs
```

### Usage

```bash
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
```

### Examples

Currently there is no examples, please contribute to [#8](https://github.com/gponsinet/pbhbs/issues/8) :)

## Running the tests

Currently no tests have been provided, please contribute to [#7](https://github.com/gponsinet/pbhbs/issues/7) :)

## Deployment

Currently handmade, please contribute to [#5](https://github.com/gponsinet/pbhbs/issues/5), [#6](https://github.com/gponsinet/pbhbs/issues/6) and [#7](https://github.com/gponsinet/pbhbs/issues/7) :)

## Built With

* [protobufjs](https://github.com/protobufjs/protobuf.js)
* [handlebars](https://github.com/wycats/handlebars.js)
* [typescript](https://github.com/microsoft/TypeScript)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

Currently handmade, please contribute to [#5](https://github.com/gponsinet/pbhbs/issues/5) :)

## Authors

* **Godefroy Ponsinet** - *Initial work* - [gponsinet](https://github.com/gponsinet)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowlegment

* Inspired by [moul/protoc-gen-gotemplate](https://github.com/moul/protoc-gen-gotemplate)
* Idea provided by [gfanton](https://github.com/gfanton)
