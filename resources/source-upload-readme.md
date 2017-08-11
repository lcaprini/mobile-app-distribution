
# Mobile App Distribution Server

View and debug web app with simple localhost server using NodeJS.


## Installation

After NodeJS install, you'll also need to install [`mobile-app-distribution`](https://github.com/lcaprini/mobile-app-distribution) package globally and use it.

	npm install mobile-app-distribution -g


## Usage

You'll now be able to use `distribute` tool with `serve` command

	distribute serve


### Synopsis

	$ distribute serve <www-root-path> [options]

The tool starts a local web server with root on `<www-root-path>` and a new browser window automatically appear on the following url

	http://127.0.0.1:9001/

## Options

* _option_: `-p, --port <port-number>`  
  _descr_: Port for local server
  _default_: `9001`
