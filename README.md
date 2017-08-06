### Mobile App Distribution (Distribute)
Compile, build and publish over FTP a Cordova mobile app for wireless distribution.

## Table of Contents
* [What is "Distribute"?](#what-is-distribute)
* [Installation](#installation)
* [Command line usage](#command-line-usage)
  * [Commands](#commands)
  * [Version](#version)
  * [Help](#help)
* [`cordova` command](#cordova-command)
  * [Synopsis](#synopsis)
  * [Options](#options)
  * [Config](#config)
    * App section
    * Source version changing
    * Source compiling section


## What is "Distribute"?
Mobile App Distribution is a command line tool for distributing a Cordova mobile app over FTP to allow its download over the air.

This module
* launches all necessary command line tools for compiling HTML, Javascript and CSS files
* updates app version
* builds iOS and Android platforms
* creates certified `.apk` and `.ipa` (with `.plist`) apps
* publishes final apps in a remote server over FTP
* updates via FTP the HTML page to download the final apps
* sends email to all working group with QRCode and direct download link
* prints a QRCode on terminal to make app download more simple

## Installation
To make `distribute` command line available in your system you'll need to install [Mobile App Distribution](https://github.com/lcaprini/mobile-app-distribution) globally first. You can do that with the following command:

    $ npm install mobile-app-distribution -g

You should be now able to run `distribute` via terminal with the following command:

    $ distribute


## Command line usage


### Commands
Distribute tools have multiple commands to cover all aspects of mobile app distribution:

* `$ distribute init`: The utility makes some questions and with them answers initializes the config file for distribution process and prepares the remote repository for download apps. *[Coming soon...]*
* `$ distribute cordova`: The utility launches all tasks for compiling, building and uploading a Cordova mobile app
* `$ distribute wd`: The utility create the `wd` folder for manually upload on FTP remote repository
* `$ distribute ios`: The utility launches all tasks for building and uploading an iOS mobile app *[Coming soon...]*
* `$ distribute android`: The utility launches all tasks for building and uploading an Android mobile app *[Coming soon...]*


### Version
To see the installed version number run one of the following commands:

    $ distribute -V
    $ distribute --version


### Help
To see general help menu and available commands run one of the following commands:

    $ distribute -h
    $ distribute --help


## `cordova` command
This utility launches all tasks for compiling, building and uploading a Cordova mobile app.


### Synopsis
    
    $ distribute cordova <app-version> -t <[c,v,i,a,u,e]> [options]

To correcly run process you'll need to specify the app version in [semver](http://semver.org/) format and one or more task from this list:

* `v` : Changes app version editing the `config.xml` of Cordova project
* `c` : Compiles HTML, Javascript, CSS files into `www` folder using the command (script or task runner) specified in `distribute.json`
* `i` : Builds, archives, exports a certified `.ipa` file with its `.plist` and moves all files into `buildsDir` folder
* `a` : Builds, archives, exports a certified `.apk` file and moves it into `buildsDir` folder
* `u` : Uploads the created app on the remote FTP server
* `e` : Sends an email with links and QRCode for download when the process ends


### Options

* _option:_ __`-p, --config <config-path>`__  
  _descr:_ Specify the path of `distribute.json` to use for process  
  _defaut:_ `./distribute.json`

* _option:_ __`-p, --config <config-path>`__  
  _descr:_ Specify the path of `distribute.json` to use for process  
  _defaut:_ `./distribute.json`


### Config
To use `distribute cordova` command you'll need to create a `distribute.json` first like `distribute-example.json`.

The following paragraphs describes all sections of a tipical `distribute.json` for Cordova app.


#### App section
All details about app; all are mandatory.
* `app.name`__*__ : App's name, usally is the Cordova project's name
* `app.label`__*__ : App's label vibile on the launcher of device

#### Source version changing
All details about web app version change; all are mandatory.
* `sources.htmlVersionPath`__*__ : Path of HTML file that contains `<mad-app-version></mad-app-version>` tag that process use to print inside the app's version label.

#### Source compiling section
All details about HTML, CSS and Javscript compiling; all are mandatory.
* `sources.compileCommand`__*__ : Command line tool used to build the web app 
* `sources.compilePath`__*__ : Path in where to launch the `sources.compileCommand`
