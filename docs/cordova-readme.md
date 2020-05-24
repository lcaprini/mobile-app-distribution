### Cordova configuration

To use `distribute cordova` command you'll need to create a `distribute.json` first, like [`examples/configs/cordova-distribute.json`](../examples/configs/cordova-distribute.json).

The following paragraphs describes all sections of a tipical `distribute.json` for a Cordova app; by the way, you also have to add the [commons configurations](./commons-readme.md), and check for the specific [iOS](./ios-readme.md) and [Android](./android-readme.md) configurations.

All `*` marked fields are mandatory.

#### Source version change section

If you want to dynamically change version in an HTML file, use the `<mad-app-version>` tag and specify the HTML file path in `htmlVersionPath` attribute. Of course you also have to add the `v` task in `distribute cordova` command.

```json
"source": {
    // * Path of HTML file that contains `<mad-app-version>` tag
    "htmlVersionPath": "src/app/login/login.html"
}
```

#### Cordova build section

All details about Cordova build process.

```json
"cordova": {
    // * Path in where to launch all cordova commands
    "path": "app",

    // Custom command to build Android platform
    // default "cordova build android --release"
    "buildAndroidCommand": "npm run build:android:prod",

    // Custom command to build iOS platform
    // default "cordova build ios"
    "buildIosCommand": "npm run build:ios:prod"
}
```

#### Platforms sections

Specific configurations for build iOS and Android platforms.

```json
"ios": {
    // * iOS app's bundleId to write into id attribute inside config.xml file,
    // before build the iOS platform
    "bundleId": "it.lcaprini.test",
},

"android": {
    // * Android app's package name to write into id attribute inside config.xml file,
    // before build the Android platform
    "bundleId": "it.lcaprini.test",
}
```

### `cordova` command

This utility launches all tasks for compiling, building and uploading a Cordova mobile app.

#### Synopsis

    $ distribute cordova <app-version> -t <[c,v,i,a,u,e]> [options]

To correcly run process you'll need to specify the app version in [semver](http://semver.org/) format and one or more task from this list:

-   `v` : Changes app version editing the `sources.htmlVersionPath` before run Cordova build process
-   `c` : Compiles HTML, Javascript, CSS files into `www` folder using the command (script or task runner) specified in `distribute.json`
-   `i` : Builds, archives, exports a certified `.ipa` file with its `.plist` and moves all files into `buildsDir` folder
-   `a` : Builds, archives, exports a certified `.apk` file and moves it into `buildsDir` folder
-   `u` : Uploads the created app on the remote (S)FTP server
-   `z` : Zip and upload Cordova `www` folder on the remote (S)FTP server
-   `e` : Sends an email with links and QRCode for download when the process ends

#### Options

-   _option_: `-p, --config <config-path>`
    _descr_: Path of `distribute.json` to use for process
    _default_: `./distribute.json`

*   _option_: `-a, --android-version-code <version-code>`
    _descr_: Version Code for Android build
    _default_: `MAJOR * 10000 + MINOR * 100 + PATCH`

-   _option_: `-i, --ios-bundle-version <bundle-version>`
    _descr_: CF Bundle Version for build
    _default_: `MAJOR * 100 + MINOR * 10 + PATCH`

*   _option_: `-c, --change-log <changelog.txt | "Text with *** line separator"`
    _descr_: Path of a `.txt` file that contains all changelog (one per line), or a string with `***` line separator
    _default_: `No changelog`

-   _option_: `-q, --qr-code`
    _descr_: Print a QRCode coded with repository homepage in the terminal window when process is complete

*   _option_: `-v, --verbose`
    _descr_: Print all messages in terminal insted only the task details

-   _option_: `-f, --force`
    _descr_: The process starts and doesn't ask anything during all tasks

*   _option_: `-h, --hidden`
    _descr_: Hide this build from repository homepage; use it for pre release and alpha/beta versions
