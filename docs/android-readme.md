### Android configuration

The following paragraphs describes all specific Android configurations for the Cordova Android platform; by the way, you also have to add the [commons configurations](./commons-readme.md).

All `*` marked fields are mandatory.

#### Android build section

All details about building, exporting and signing and Android project.
In order to build the Android project you have to add the task `i` in the `distribute cordova` command.

```json
"Android": {
    // * JSON object that specify an Android keystore and its credentials for signing process
    "keystore": {
        // * Path of the keystore file
        "path": "resources/android/lcaprini.keystore",
        // * Alias of the keystore file
        "alias": "lcaprini-alias",
        // * Alias of the keystore file
        "password": "lcaprini-password"
    }
}
```

#### Builds upload, repo update and sources upload sections

All specific details about the processes to upload created Android builds over (S)FTP and update the remote file to allow the OTA installations.
In order to send the final email, you have to add the task `u` in the `distribute cordova` command.

```json
"remote": {
    "builds": {
        // * Absolute path of folder will contains all Android `.ipa` and `.plist` files
        "androidDestinationPath": "/var/www/html/test/Android",
    },

    "repo": {
        // * Public URL of remote.builds.AndroidDestinationPath for Android app download
        "androidUrlPath": "https://lcaprini.com/test/Android",
    }
}
```
