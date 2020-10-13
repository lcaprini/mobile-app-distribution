### Common Configuration

Every `distribute.json` file must contains `app` and `buildDir` sections in order to complete the process; the other sections are optional.

All `*` marked fields are mandatory.

#### App section

All details about app or webapp;

```js
"app": {
    // * App's project name
    "name": "MyApp",

    // * Real app's name on client side
    "label": "My App"
}
```

#### Builds section

Every distribution process creates one or more files as output: the `buildsDir` attribute is the path (absolute or relative) will contains the build files.

```js
// * Path of output directory
"buildsDir": "./builds"
```

#### Source compile section

All commons details about source (pre)compiling tasks: if you want to compile sources you have to add the `c` task in `distribute` command and it runs before the distribution process tasks, like `ios`, `android` and of course `remote` and `email`. You could run NodeJS script, `package.json` `npm` scripts, and so on.

```js
"sources": {
    // * Command line tool used to build the web app
    "compileCommand": "grunt build:production",

    // * Path to launch the `sources.compileCommand`
    "compilePath": "src"
}
```

#### Builds upload, repo update and sources upload sections

All commons details about the processes to upload created builds over (S)FTP and update the remote file to allow the OTA installations.
In order to send the final email, you have to add the task `u` in the `distribute cordova` command.

```js
"remote": {
    "builds": {
        // * (S)FTP host for builds upload
        "host": "lcapriniftp",

        // (S)FTP port for builds upload
        // default 21
        "port": 1111,

        // * Username for (S)FTP connection with read and write permissions
        "user": "lcaprini-user",

        // * Password of `emote.builds.user
        "password": "lcaprini-password",
    },

    "repo": {
        // * (S)FTP host for repository update
        "host": "lcapriniftp",

        // * (S)FTP port for repository update
        // default 21
        "port": 1111,

        // * Username for (S)FTP connection with read and write permissions
        "user": "lcaprini-user",

        // * Password of remote.repo.user
        "password": "lcaprini-password",

        // * Absolute path of remote folder that contains builds.json file to update it
        "jsonPath": "/var/www/html/test/wd",

        // * Public URL of remote.repo.jsonPath for wireless distribution repository
        "homepageUrl": "https://lcaprini.com/test/wd"
    },

    "sources": {
        // * (S)FTP host for sources upload
        "host": "lcapriniftp",

        // * (S)FTP port for sources upload
        // default 21
        "port": 1111,

        // * Username for (S)FTP connection with read and write permissions
        "user": "lcaprini-user",

        // * Password of remote.sources.user
        "password": "lcaprini-passwd",

        // * Absolute path of folder will contains all zipped sources
        "sourcesPath": "/var/www/html/test/sources"
    }
}
```

#### Email section

All details about final email sender;
In order to send the final email, you have to add the task `e` in every `distribute`'s subcommands.

```js
"email" : {
    // * SMTP host of email service
    "host": "mail.gmail.com",

    // SMTP port of email service
    // default 25
    "port": 1111,

    // * Email sender public name
    "user": "lcaprini-user",

    // * Password of email.user
    "password": "lcaprini-password",

    // * Sender's email
    "from": "luca.caprini@gmail.com",

    // * List of email's recipients
    "to": ["luca.caprini@gmail.com"]
}
```
