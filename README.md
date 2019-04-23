# `pbhbs`
:open_file_folder: protocol generator + handlebar-js template (protobuf)

A generic **code**/script/data generator based on [Protobuf](https://developers.google.com/protocol-buffers/).

Largely inspired by the work of [moul](https://github.com/moul/protoc-gen-gotemplate).

# Installation

```bash
$> npm install -g pbhbs
```

# Usage

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
