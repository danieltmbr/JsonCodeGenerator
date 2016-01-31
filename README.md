# JsonToSwift
A tiny webpage (html, css, js), which helps you to create DTO classes in SWIFT from JSON for Networking.

###Purpose

In iOS developement it's not so rare to use [Alamofire][Alamofire link] and [SwiftyJSON][SwiftyJSON link] together for networking & parsing.
If you do as well, you certainly has taken benefit of SWIFT's generics for type-safe serialization [(_as the documentation of Alamofire shows_)](http://cocoadocs.org/docsets/Alamofire/3.1.5/#generic-response-object-serialization), combined with [SwiftyJSON][SwiftyJSON link] initialization.

This webpage generates SWIFT classes, with a [SwiftyJSON][SwiftyJSON link] initializer, including all the properties contained by the JSON input.

###Preferences

* **Declare properties as 'let':** 
 
 If you don't tend to change the value of the properties, it's suggested to declare them as _'let'_. Otherwise properties'll be declared as _'var'_.
* **Always declare number-value-properties as Double:**

 It may happen that a _double_ value does not contain any decimal point, so the parser would declare it as an _integer_. You can avoid that by cheking this option.
* **Generate collection initializer:**

 To generate a _class_ function for the DTO, which can produce a collection from _JSON_ check this option.
* **Allow recursion (create DTOs for for inner objects):**

 By cheking this option, you enable to generate classes recursively for non primitive objects contained by the _JSON_.

####Other features

* Generate NSDate optional initializer for a given format

[SwiftyJSON link]: https://github.com/SwiftyJSON/SwiftyJSON
[Alamofire link]: https://github.com/Alamofire/Alamofire