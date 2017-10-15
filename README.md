# Json Code Generator

A tiny script for generating Code from JSON.
Code: right now it only support Swift 4 (with Codable protocol)

## Features

* JSON verification
* Recognize Int, Double, String, Bool, Date (by a given format), Array (even empty array), Url, custom object
* Create Structs recursively
* Generate Date extension with optional initializer (for the given format)
* Easy configuration
    * Define properties as constants or variable type (let/var)
    * Define number type according to decimal places
    * Specify the name of the Root object
    * Add custom pre & postfix to Struct names
    * Specify custom date format
* Responsive layout
* Nice Xcode coloured output

## Future improvements

* Support other languages
    * Go
    * Kotlin
    * Java (?)
* Generate output files > .zip them > download them

## Help

This is my very first hobby project where I'm trying to use JS's prototype related features.
This is also my very first project where I'm using Bootstrap CSS. So:

* Post any comment or suggestion on the code to improve it
* Post any issues you find
* Post new feature requests
* Pull requests are welcome

## Author

danieltmbr, daniel@tmbr.me

## License

Json Code Generator is available under the MIT license. See the LICENSE file for more info.
