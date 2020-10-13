### Angular configuration

To use `distribute angular` command you'll need to create a `distribute.json` first, like [`examples/configs/angular-distribute.json`](../examples/configs/angular-distribute.json).

The following paragraphs describes all sections of a tipical `distribute.json` for an Angular2+ app; by the way, you also have to add the [commons configurations](./commons-readme.md).

All `*` marked fields are mandatory.

#### Source version change section

Some specific details about web app version change.

```js
"sources": {
    "updateVersion" : {
        // Path of file that contains sources.updateVersion.replacingTag tag that will be used to print inside the app's version label
        "filePath": "",

        // Tag to replace
        // default "{version}"
        "replacingTag": ""
    }
}
```

#### Remote server deploy

All details about the processes to sever deploy over (S)FTP.
In order to deploy the builded app, you have to add the task `d` in the `distribute angular` commands.

```js
"remote": {
    "deploy": {
        // (S)FTP host for builds deploy
        "host": "lcapriniftp",

        // Port for build deploy, can take two values:
        // 21 for FTP protocol
        // 22 for SFTP protocol
        // default 21:
        "port": 22,

        // Username for (S)FTP connection with read and write permissions
        "user": "lcaprini-user",

        // Password of remote.deploy.user
        "password": "lcaprini-password",

        // Absolute path of remote server folder (usualy is the folder of document root of http server)
        "angularDestinationPath": "/var/www/html/test/angular_app",

        // ...
        "privateKey": "/home/federico/Projects/2019/test-sftp-upload/smart-agricolture_private.key"
    }
}
```

#### Repo upload build and update

Some specific details about web app repo OTA distribution.

```js
"remote": {
    "repo": {
        // Absolute path of remote repo server folder will contains all Angular `.zip` files
        "buildsPath": "https://lcaprini.com/test/Angular",

        // Public URL of remote.repo.buildsPath for Angular app download.
        "angularUrlPath": "https://lcaprini.com/test/wd"
    }
}
```

### `angular` command

The utility launches all tasks for building, deploing and uploading a Angular app.

#### Synopsis

    $ distribute angular <app-version> -t <[b,v,d,u,e]> [options]

To correcly run process you'll need to specify the app version in [semver](http://semver.org/) format and one or more task from this list:

-   `v` : Replace app version editing the file specified in `distribute.json`
-   `b` : Compiles Angular source into `src` folder using the command (script or task runner) specified in `distribute.json`
-   `d` : Deploy all files into `buildsDir` folder on the deploy server specified in `distribute.json`
-   `u` : Upload `buildsDir` zip archive folder and update the repo server specified in `distribute.json`
-   `e` : Sends an email with links and QRCode for download when the process ends

#### Options

-   _option_: `-p, --config <config-path>`
    _descr_: Path of `distribute.json` to use for process
    _default_: `./distribute.json`

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
