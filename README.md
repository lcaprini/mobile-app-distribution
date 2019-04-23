# Mobile App Distribution
Compile, build and publish over FTP a Cordova mobile app for wireless distribution.

## Table of Contents
* [What is "Distribute"?](#what-is-distribute)
* [Installation](#installation)
* [Command line usage](#command-line-usage)
  * [Commands](#commands)
  * [Version](#version)
  * [Help](#help)
* [Configuration](#configuration)
  * [App section](#app-section)
  * [Source version change section](#source-version-change-section)
  * [Source compile section](#source-compile-section)
  * [General Cordova build section](#general-cordova-build-section)
  * [iOS build section](#ios-build-section)
  * [Android build section](#android-build-section)
  * [Builds upload and repo update section](#builds-upload-and-repo-update-section)
  * [Email section](#email-section)
* [`init` command](#init-command)
* [`cordova` command](#cordova-command)
  * [Synopsis](#synopsis-cordova)
  * [Options](#options-cordova)
* [`angular` command](#angular-command)
  * [Synopsis](#synopsis-angular)
  * [Options](#options-angular)
* [`wd` command](#wd-command)
  * [Synopsis](#synopsis-wd)
* [`resources` command](#resources-command)
  * [Synopsis](#synopsis-resources)
* [`serve` command](#serve-command)
  * [Synopsis](#synopsis-serve)

## What is "Distribute"?
Mobile App Distribution is a command line tool for distributing a Cordova mobile app over FTP to allow its download over the air. It also have many command for icons and splashes generation, a local server creation, and so on. Add support for distributing a Angular 2+ app over FTP to allow its download over the air and FTP/SFTP server deploy;

## Installation
To make `distribute` command line available in your system you'll need to install [Mobile App Distribution](https://github.com/lcaprini/mobile-app-distribution) globally first. You can do that with the following command:

    $ npm install mobile-app-distribution -g

You should be now able to run `distribute` via terminal with the following command:

    $ distribute

## Command line usage

### Commands
Distribute tools have multiple commands to cover all aspects of mobile app distribution:

* `$ distribute init`: The utility makes some questions and with them answers initializes the config file for distribution process.
* `$ distribute cordova`: The utility launches all tasks for compiling, building and uploading a Cordova mobile app
* `$ distribute angular`: The utility launches all tasks for building, deploing and uploading a Angular app
* `$ distribute wd`: The utility creates the `wd` folder for manually upload on FTP remote repository
* `$ distribute resources`: The utility generate iOS and Android icons and splash from one single icon and one single splash
* `$ distribute serve`: The utility create a local host to test website or webapp
* `$ distribute ios`: *[Coming soon...]* The utility launches all tasks for building and uploading an iOS mobile app
* `$ distribute android`: *[Coming soon...]* The utility launches all tasks for building and uploading an Android mobile app

### Version
To see the installed version number run the following command:

    $ distribute --version

### Help
To see general help menu and available commands run the following command:

    $ distribute --help

### Cordova configuration
To use `distribute` command you'll need to create a `distribute.json` first, like [`distribute-example.json`](./resources/distribute-example.json).

The following paragraphs describes all sections of a tipical `distribute.json` for a Cordova app.

#### App section
All details about app; all are mandatory.
* `app.name`__*__ : App's name, usally is the Cordova project's name
* `app.label`__*__ : App's label vibile on the launcher of device

#### Source version change section
All details about web app version change; if you require the version changing task (`v`) all these fields are mandatory.
* `sources.htmlVersionPath`__*__ : Path of HTML file that contains `<mad-app-version></mad-app-version>` tag that process use to print inside the app's version label.

#### Source compile section
All details about HTML, CSS and Javscript compiling; if you require the source compiling task (`c`) all these fields are mandatory.
* `sources.compileCommand`__*__ : Command line tool used to build the web app
* `sources.compilePath`__*__ : Path in where to launch the `sources.compileCommand`

#### General Cordova build section
General details about Cordova build; all fields are mandatory.
* `cordova.path`__*__ : Path in where to launch all cordova commands

#### iOS build section
All details about building, exporting and signing iOS platform; if you require the iOS build task (`i`) all fields marked with __*__ are mandatory.
* `cordova.buildIosCommand` : Command to build iOS platform; if not specified the default value will be `cordova build ios`
* `ios.bundleId`__*__ : Bundle ID app to write into info plist of iOS platform.
* `ios.infoPlistPath` : Main plist of iOS XCode project; if not specified the tool will look for `Info.plist` or `<app.name>-Info.plist`
* `ios.targetSchema` : Xcode project schema to build; if not specified the default value will be `app.name`
* `ios.exportOptionsPlist`__*__ : JSON object with same attributes and values of iOS's export options plist file (`xcodebuild --help` to view all docs). At least the following attributes must be specified
  * `method`: (`app-store`|`package`|`ad-hoc`|`enterprise`|`development`|`developer-id`)
  Describes how Xcode should export the archive; if not specified the default value will be `enterprise`
  * `teamID`__*__ : Developer Portal team to use for export
* `ios.exportOptionsPlistPath` : Path of a phisical exportOptionsPlist file with all attributes properly configured. This field is an alternative to `ios.exportOptionsPlist`

#### Android build section
All details about building, exporting and signing Android platform; if you require the Android build task (`a`) all fields marked with __*__ are mandatory.
* `cordova.buildAndroidCommand` : Command to build iOS platform; if not specified the default value will be `cordova build android --relase`
* `android.bundleId`__*__ : Bundle ID app to write into info plist of iOS platform
* `android.keystore`__*__ : JSON object that specify an Android keystore and its credentials for signing process:
   * `path`__*__ : Path of the keystore file
   * `alias`__*__ : Alias of the keystore file
   * `password`__*__ : Password of the keystore file

#### Builds upload, repo update and sources upload sections
All details about the processes to upload created builds over FTP and update remote file to allow download over the web; if you require build's upload task (`u`) all fields marked with __*__ are mandatory.
* `remote.builds.host`__*__ : FTP host for builds upload
* `remote.builds.port` : FTP port for builds upload; if not specified the default value will be `21`
* `remote.builds.user`__*__ : Username for FTP connection with read and write permissions
* `remote.builds.password`__*__ : Password of `remote.builds.user`
* `remote.builds.iosDestinationPath`__*__ : Absolute path of folder will contains all iOS `.ipa` and `.plist` files
* `remote.builds.androidDestinationPath`__*__ : Absolute path of folder will contains all Android `.apk` files
* `remote.repo.host`__*__ : FTP host for repository update
* `remote.repo.port` : FTP port for repository update; if not specified the default value will be `21`
* `remote.repo.user`__*__ : Username for FTP connection with read and write permissions
* `remote.repo.password`__*__ : Password of `remote.repo.user`
* `remote.repo.iosUrlPath`__*__ : Public URL of `remote.builds.iosDestinationPath` for iOS app download
* `remote.repo.androidUrlPath`__*__ : Public URL of `remote.builds.androidDestinationPath` for Android app download
* `remote.repo.jsonPath`__*__ : Absolute path of remote folder that contains `builds.json` file to update it
* `remote.repo.homepageUrl`__*__ : Public URL of `remote.repo.jsonPath` for wireless distribution repository
* `remote.sources.host`__*__ : FTP host for sources upload
* `remote.sources.port` : FTP port for sources upload; if not specified the default value will be `21`
* `remote.sources.user`__*__ : Username for FTP connection with read and write permissions
* `remote.sources.password`__*__ : Password of `remote.sources.user`
* `remote.sources.sourcesPath`__*__ : Absolute path of folder will contains all zipped sources

#### Email section
All details about final email sending; if you require the send email task (`e`) all fields marked with __*__ are mandatory.
* `email.host`__*__ : SMTP host of email service
* `email.port` : SMTP port of email service; if not specified the default value will be `25`
* `email.user`__*__ : Email sender public name
* `email.password`__*__ : Password of `email.user`
* `email.from`__*__ : Sender's email
* `email.to`__*__ : List of email's recipients

### Angular configuration
To use `distribute` command you'll need to create a `distribute.json` first, like [`distribute-example.json`](./resources/distribute-angular-example.json).

The following paragraphs describes all sections of a tipical `distribute.json` for a Cordova app.

#### App section
All details about app; all are mandatory.
* `app.name`__*__ : App's name, usally is the Cordova project's name
* `app.label`__*__ : App's label vibile on the launcher of device

#### Source version change section
All details about web app version change; if you require the version changing task (`v`) all these fields are mandatory.
* `sources.updateVersion.filePath`__*__ : Path of file that contains `sources.updateVersion.replacingTag` tag that process use to print inside the app's version label
* `sources.updateVersion.replacingTag`__*__ : Tag to replace; if not specified the default value will be `{version}`.

#### Source compile section
All details about HTML, CSS and Javscript compiling; if you require the source compiling task (`c`) all these fields are mandatory.
* `sources.compileCommand`__*__ : Command line tool used to build the Angular app
* `sources.sourcePath`__*__ : Path in where to launch the `sources.compileCommand`

#### Server deploy
All details about the processes to sever deploy over FTP/SFTP; if you require server deploy task (`d`) all fields marked with __*__ are mandatory.
* `buildsDir`__*__ : Path (absolute or relative) will contains the build files (usualy is the `dist` folder on the Angular project root)
* `remote.deploy.host`__*__ : FTP/SFTP host for builds deploy
* `remote.deploy.port` : Port for builds deploy, can take two values; if not specified the default value will be `21`:
    * `21` for FTP protocol
    * `22` for SFTP protocol
* `remote.deploy.user`__*__ : Username for FTP/SFTP connection with read and write permissions
* `remote.deploy.password`__*__ : Password of `remote.deploy.user`
* `remote.deploy.angularDestinationPath`__*__ : Absolute path of remote server folder (usualy is the folder of document root of http server).

#### Repo upload build and update
All details about the processes to uppload the buil deploy builds over FTP/SFTP; if you require server build's deploy task (`d`) all fields marked with __*__ are mandatory.
* `buildsDir`__*__ : Path (absolute or relative) will contains the build files (usualy is the `dist` folder on the Angular project root)
* `remote.repo.host`__*__ : FTP host for repository update
* `remote.repo.port` : FTP port for repository update; if not specified the default value will be `21`
* `remote.repo.user`__*__ : Username for FTP connection with read and write permissions
* `remote.repo.password`__*__ : Password of `remote.repo.user`
* `remote.repo.jsonPath`__*__ : Absolute path of remote folder that contains `builds.json` file to update it
* `remote.repo.homepageUrl`__*__ : Public URL of `remote.repo.jsonPath` for wireless distribution repository
* `remote.repo.buildsPath`__*__ : Absolute path of remote repo server folder will contains all Angular `.zip` files
* `remote.repo.angularUrlPath`__*__ : Public URL of `remote.repo.buildsPath` for Angular app download.

#### Email section
All details about final email sending; if you require the send email task (`e`) all fields marked with __*__ are mandatory.
* `email.host`__*__ : SMTP host of email service
* `email.port` : SMTP port of email service; if not specified the default value will be `25`
* `email.user`__*__ : Email sender public name
* `email.password`__*__ : Password of `email.user`
* `email.from`__*__ : Sender's email
* `email.to`__*__ : List of email's recipients

## `init` command
This utility makes some questions to user and create the `distribute.json` file for make builds. Please see [Configuration](#configuration) paragraph to find more info about all configuration attributes.

## `cordova` command
This utility launches all tasks for compiling, building and uploading a Cordova mobile app.

### <a id="synopsis-cordova"></a> Synopsis

    $ distribute cordova <app-version> -t <[c,v,i,a,u,e]> [options]

To correcly run process you'll need to specify the app version in [semver](http://semver.org/) format and one or more task from this list:

* `v` : Changes app version editing the `config.xml` of Cordova project
* `c` : Compiles HTML, Javascript, CSS files into `www` folder using the command (script or task runner) specified in `distribute.json`
* `i` : Builds, archives, exports a certified `.ipa` file with its `.plist` and moves all files into `buildsDir` folder
* `a` : Builds, archives, exports a certified `.apk` file and moves it into `buildsDir` folder
* `u` : Uploads the created app on the remote FTP server
* `z` : Zip and upload Cordova `www` folder on the remote FTP server
* `e` : Sends an email with links and QRCode for download when the process ends

### <a id="options-cordova"></a> Options

* _option_: `-p, --config <config-path>`
  _descr_: Path of `distribute.json` to use for process
  _default_: `./distribute.json`

* _option_: `-a, --android-version-code <version-code>`
  _descr_: Version Code for Android build
  _default_: `MAJOR * 10000 + MINOR * 100 + PATCH`

* _option_: `-i, --ios-bundle-version <bundle-version>`
  _descr_: CF Bundle Version for build
  _default_: `MAJOR * 100 + MINOR * 10 + PATCH`

* _option_: `-c, --change-log <changelog.txt | "Text with *** line separator"`
  _descr_: Path of a `.txt` file that contains all changelog (one per line), or a string with `***` line separator
  _default_: `No changelog`

* _option_: `-q, --qr-code`
  _descr_: Print a QRCode coded with repository homepage in the terminal window when process is complete

* _option_: `-v, --verbose`
  _descr_: Print all messages in terminal insted only the task details

* _option_: `-f, --force`
  _descr_: The process starts and doesn't ask anything during all tasks

* _option_: `-h, --hidden`
  _descr_: Hide this build from repository homepage; use it for pre release and alpha/beta versions

## `angular` command
The utility launches all tasks for building, deploing and uploading a Angular app.

### <a id="synopsis-angular"></a> Synopsis

    $ distribute angular <app-version> -t <[b,v,d,u,e]> [options]

To correcly run process you'll need to specify the app version in [semver](http://semver.org/) format and one or more task from this list:

* `v` : Replace app version editing the file specified in `distribute.json`
* `b` : Compiles Angular source into `src` folder using the command (script or task runner) specified in `distribute.json`
* `d` : Deploy all files into `buildsDir` folder on the deploy server specified  in `distribute.json`
* `u` : Upload `buildsDir` zip archive folder and update the repo server specified in `distribute.json`
* `e` : Sends an email with links and QRCode for download when the process ends

### <a id="options-angular"></a> Options

* _option_: `-p, --config <config-path>`
  _descr_: Path of `distribute.json` to use for process
  _default_: `./distribute.json`

* _option_: `-c, --change-log <changelog.txt | "Text with *** line separator"`
  _descr_: Path of a `.txt` file that contains all changelog (one per line), or a string with `***` line separator
  _default_: `No changelog`

* _option_: `-q, --qr-code`
  _descr_: Print a QRCode coded with repository homepage in the terminal window when process is complete

* _option_: `-v, --verbose`
  _descr_: Print all messages in terminal insted only the task details

* _option_: `-f, --force`
  _descr_: The process starts and doesn't ask anything during all tasks

* _option_: `-h, --hidden`
  _descr_: Hide this build from repository homepage; use it for pre release and alpha/beta versions

## `wd` command
This utility creates a new folder called `wd` that contains all files for wireless distribution repository, ready to manually upload on FTP repo.

### <a id="synopsis-wd"></a> Synopsis

    $ distribute wd

## `resources` command
This utility creates icons and splashes for iOS and Android platforms from one icon and one splash.

### <a id="synopsis-resources"></a> Synopsis

    $ distribute resources

### Options

* _option_: `-i, --icon <icon-image-path>`
  _descr_: Path of image to use as icon to resize for all required platfoms
  _default_: `./resources/icon.png`

* _option_: `-s, --splash <splash-image-path>`
  _descr_: Path of image to use as splash to resize (and crop) for all required platfoms
  _default_: `./resources/icon.png`

* _option_: `-p, --platforms <i,a>`
  _descr_: Platforms to target for icons and splashes generate process
  _default_: `i,a`

## `serve` command
This utility creates and starts a local web server to test every single page application, like a Cordova `www` folder.

### <a id="synopsis-serve"></a> Synopsis

	$ distribute serve <www-root-path> [options]

The tool starts a local web server with root on `<www-root-path>` and a new browser window automatically appear on the following url

	http://127.0.0.1:9001/

## Options

* _option_: `-p, --port <port-number>`
  _descr_: Port for local server
  _default_: `9001`