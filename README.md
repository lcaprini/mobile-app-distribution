# Mobile App Distribution

Compile, build and publish over FTP a Cordova mobile app for wireless distribution.

## Table of Contents

-   [What is "Distribute"?](#what-is-distribute)
-   [Installation](#installation)
-   [Command line usage](#command-line-usage)
    -   [Commands](#commands)
    -   [Version](#version)
    -   [Help](#help)
-   [Configuration](#configuration)
    -   [Common sections](./docs/commons-readme.md)
    -   [Cordova section](./docs/cordova-readme.md)
    -   [Angular section](./docs/angular-readme.md)
    -   [iOS section](./docs/ios-readme.md)
    -   [Android section](./docs/android-readme.md)
-   [`init` command](./docs/init-readme.md)
-   [`cordova` command](./docs/cordova-readme.md)
-   [`angular` command](./docs/angular-readme.md)
-   [`wd` command](./docs/wd-readme.md)
-   [`resources` command](./docs/resources-readme.md)
-   [`serve` command](./docs/serve-readme.md)

## What is "Distribute"?

Mobile App Distribution is a command line tool for distributing a Cordova mobile app or an Angular 2+ app over (S)FTP to allow its download and deploy over the
air and. It also have many command for icons and splashes generation, a local server creation, and so on.

## Installation

To make `distribute` command line available in your system you'll need to install [mobile-app-distribution](https://github.com/lcaprini/mobile-app-distribution) globally first. You can do that with the following command:

    $ npm install mobile-app-distribution -g

You should be now able to run `distribute` via terminal with the following command:

    $ distribute

## Command line usage

### Commands

Distribute tools have multiple commands to cover all aspects of mobile app distribution:

-   `$ distribute init`: The utility asks some questions in order to create the config file for distribution process.
-   `$ distribute cordova`: The utility launches all tasks for compiling, building and uploading a Cordova mobile app
-   `$ distribute angular`: The utility launches all tasks for building, deploing and uploading a Angular app
-   `$ distribute wd`: The utility creates the `wd` directory to upload on your FTP remote repository for the OTA installations
-   `$ distribute resources`: The utility generate iOS and Android icons and splash from one single icon and one single splash
-   `$ distribute serve`: The utility create a local host to test website or webapp
-   `$ distribute ios`: _[Coming soon...]_ The utility launches all tasks for building and uploading an iOS mobile app
-   `$ distribute android`: _[Coming soon...]_ The utility launches all tasks for building and uploading an Android mobile app
-   `$ distribute flutter`: _[Coming soon...]_ The utility launches all tasks for building and uploading a Flutter mobile app

### Version

To see the installed version number run the following command:

    $ distribute --version

### Help

To see general help menu and available commands run the following command:

    $ distribute --help

### Configuration

To use `distribute` command you'll need to create a `distribute.json` first; you could fine some examples for Cordova and Angular distributions in [`examples`](./examples) directory.

Some sections in `distribute.json`, like `app` or `buildDir`, are shared between distributions process, while others are specific for a single distribution type process.

-   [Common sections](./docs/commons-readme.md)
-   [Cordova section](./docs/cordova-readme.md)
-   [Angular section](./docs/angular-readme.md)
-   [iOS section](./docs/ios-readme.md)
-   [Android section](./docs/android-readme.md)

## `init` command

This utility asks some questions to user and create the `distribute.json` file for make builds.

All docs in [Init README](./docs/init-readme.md).

## `cordova` command

This utility launches all tasks for compiling, building and uploading a Cordova mobile app.

All docs in [Cordova README](./docs/cordova-readme.md).

## `angular` command

The utility launches all tasks for building, deploing and uploading a Angular app.

All docs in [Angular README](./docs/angular-readme.md).

## `wd` command

This utility creates a new folder called `wd` that contains all files for wireless distribution repository, ready to manually upload on FTP repo.

All docs in [Wireless Distribution README](./docs/wd-readme.md).

## `resources` command

This utility creates icons and splashes for iOS and Android platforms from one icon and one splash.

All docs in [Resources README](./docs/resources-readme.md).

## `serve` command

This utility creates and starts a local web server to test every single page application, like a Cordova `www` folder.

All docs in [Serve README](./docs/serve-readme.md).
