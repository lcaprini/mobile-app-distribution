### iOS configuration

The following paragraphs describes all specific iOS configurations for the Cordova iOS platform; by the way, you also have to add the [commons configurations](./commons-readme.md).

All `*` marked fields are mandatory.

#### iOS build section

All details about building, exporting and signing and iOS project.
In order to build the iOS project you have to add the task `i` in the `distribute cordova` command.

```json
"ios": {
    // Main plist of iOS XCode project.
    // If not specified the tool will look for Info.plist or <app.name>-Info.plist
    "infoPlistPath": "MyApp-Info.plist",

    // 'false' if you want build the .xcodeproj file instead the .xcworkspace.
    // default true (build .xcworkspace)
    "buildWorkspace": true,

    // Xcode project schema to build.
    // If not specified the default value will be `app.name`
    "targetSchema": "MyApp",

    // JSON object with same attributes and values of iOS's export options plist file (`xcodebuild --help` to view all docs)
    // At least the following attributes must be specified
    "exportOptionsPlist": {
        // * Describes how Xcode should export the archive;
        // Supports the values "app-store", "package", "ad-hoc", "enterprise", "development", "developer-id"
        // default "enterprise"
        "method": "enterprise",
        "teamID": "ABC123EF"
    },

    // Path of a phisical exportOptionsPlist file with all attributes properly configured.
    // This field is an alternative to ios.exportOptionsPlist
    "exportOptionsPlistPath": "./myConfiguredExportOptionsPlist.plist",
}
```

#### Builds upload, repo update and sources upload sections

All specific details about the processes to upload created iOS builds over (S)FTP and update the remote file to allow the OTA installations.
In order to send the final email, you have to add the task `u` in the `distribute cordova` command.

```json
"remote": {
    "builds": {
        // * Absolute path of folder will contains all iOS `.ipa` and `.plist` files
        "iosDestinationPath": "/var/www/html/test/iOS",
    },

    "repo": {
        // * Public URL of remote.builds.iosDestinationPath for iOS app download
        "iosUrlPath": "https://lcaprini.com/test/iOS",
    }
}
```
