### `resources` command

This utility creates icons and splashes for iOS and Android platforms from one icon and one splash using [ionic/cordova-res project](https://github.com/ionic-team/cordova-res)

#### Synopsis

    $ distribute resources [options]

#### Options

-   _option_: `-i, --icon <icon-image-path>`
    _descr_: Path of image to use as icon to resize for all required platfoms
    _default_: `./resources/icon.png`

*   _option_: `-s, --splash <splash-image-path>`
    _descr_: Path of image to use as splash to resize (and crop) for all required platfoms
    _default_: `./resources/icon.png`

-   _option_: `-p, --platforms <i,a>`
    _descr_: Platforms to target for icons and splashes generate process
    _default_: `ia`

*   _option_: `-r, --resources-directory <i,a>`
    _descr_: Directory that contains the source images (when `-i` and `-s` are not used) and the generated ones
    _default_: `resources`
