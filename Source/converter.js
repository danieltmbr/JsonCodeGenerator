// In-memory database :D
var structs = []

/**
--------------------------------- Parsing Json ---------------------------------
*/

function convert() {
	removeError()
	clearData()
	const root = parseJson(getJson(), "Root")
	structs = getStructsList(root)
	console.log(structs)
	displayCode(htmlOutput(structs))
}

// parseJson(json, name)
// params: json - string to parse in JSON format
//				 name - name of the root object of the JSON
// returns: object - {name, properties}
function parseJson(json, name) {
	try {
    	const object = JSON.parse(json)
			return parseObject(object, name)
	} catch(err) {
		console.log(err)
		invalidInput()
	}
}

// parseObject(object, name)
// params: object - js object parsed from JSON
//				 name - name of the root object
// returns: object - {name, [properties]}
function parseObject(object, name) {

	const properties = typeof(object) == "object"
		? Object.keys(object).map( function(key) {
	        return parseProperty(key, object[key])
				})
		: null

	// var properties = null
	//
	// if typeof(object) == "object"

	return {name: name, properties: properties}
}

// parseProperty(key, value)
// params: key - key that stored the value in the parent object
//				 value - value for the key from parent object
// returns: object - {
// 		key: String (from json),
// 		name: String (swift syntax name),
// 		isArray: Bool
// 		type: object {name, properties}
// }
function parseProperty(key, value) {
	const definition = getPropertyDefinition(key, value)
	return {
		key: key,
		name: swiftify(key),
		isArray: definition.isArray,
		type: definition.type
	}
}

// returns: object - {
// 		isArray: Bool,
// 		type: {name, [properties]}
// }
function getPropertyDefinition(key, value) {
	const isArray = Array.isArray(value)
	const type = getTypeDefinition(key, value)
	return {isArray: isArray, type: type}
}

// returns: object - {name, [properties]}
function getTypeDefinition(key, value) {

	const name = getTypeName(key, value)
	if (typeof(value) == "object") {
		// Object
		if (!Array.isArray(value)) {
			return parseObject(value, name)
		}
		// Not ampty array
		else if (value.length != 0) {
			return parseObject(value[0], name)
		}
	}
	// Else Primitive value (e.g. int, bool, string, etc)
	return {name: name, properties: null}
}

// returns: string (Name of a swift type)
function getTypeName(key, value) {

	switch(typeof(value)) {
		case "boolean":
			return "Bool"
		case "number":
			return (intEnabled() && value % 1 === 0) ? "Int" : "Double"
		case "string":
			if(moment(value, getDateFormat(), true).isValid()) {
				return "Date"
			} else if (isURL(value)) {
				return "URL"
			} else {
				return "String"
			}
		case "object":
			if(Array.isArray(value)) {
				if(value.length == 0) {
					return "Any"
				} else {
					return getTypeName(key, value[0])
				}
			} else {
					return capitalise(swiftify(key)+"Dto")
			}
		default: return "undefined"
	}
}

/**
--------------------------------- Parsing Json ---------------------------------
*/

// Creates a list (with no duplicants) from a Struct Tree
function getStructsList(root) {
	return removeDuplicates(flattenStructs(root))
}

// Creates array from struct tree
function flattenStructs(root) {
	return flattenStruct(root, [])
}

// Creates array from struct tree
// and add it to the accumulator array
function flattenStruct(struct, accumulator) {

	const props = struct.properties.map(flattenedProperty)
	var needsDecoder = false

	for (prop of struct.properties) {
		if (!needsDecoder && prop.key != prop.name) {
				needsDecoder = true
		}
		if (null != prop.type.properties) {
			flattenStruct(prop.type, accumulator)
		}
	}

	accumulator.push({name: struct.name, properties: props, needsDecoder: needsDecoder})
	return accumulator
}

// Simplifies a property object
function flattenedProperty(prop) {
	return {key: prop.key, name: prop.name, isArray: prop.isArray, type: prop.type.name}
}

// Remove duplicant structs from a list
// Same structs: which has the same property list
function removeDuplicates(structs) {
	return uniqBy(structs, keyOf)
}

// Remove duplicant object form array
// which has the same key
function uniqBy(array, key) {
    var seen = {}
    return array.filter(function(item) {
        var k = key(item)
        return seen.hasOwnProperty(k) ? false : (seen[k] = true)
    })
}

// Creates key from a struct
// using its properties array
function keyOf(struct) {
	return JSON.stringify(struct.properties)
}

/**
--------------------------------- Html output ----------------------------------
*/

//
function htmlOutput(structs) {
	return structs.reduce(structsReduce, "")
}

function structsReduce(accumulator, struct) {
		console.log(accumulator + structHtml(struct) + "\n\n")
		return accumulator + structHtml(struct) + "\n\n"
}

function structHtml(struct) {

	// Declare struct
	var structHtml = "<span class=\"definition\">struct</span> <span class=\"type\">"+struct.name+": Codable</span> {\n\n"
	// List properties
	structHtml += struct.properties.reduce(propertyDeclarationHtml, "") + "\n"

	// Declare coding keys
	if (struct.needsDecoder) {
		structHtml += "\t<span class=\"definition\">private enum</span> <span class=\"type\">CodingKeys: String, CodingKey</span> {\n"
		structHtml += struct.properties.reduce(propertyCodingKeyHtml, "")
		structHtml += "\t}\n"
	}

	return structHtml + "}"
}

function propertyDeclarationHtml(accumulator, property) {
	return accumulator + "\t<span class=\"definition\">"+propertyDefinition()+"</span> "+property.name+": <span class=\"type\">"+propertyType(property)+"</span>\n"
}

function propertyCodingKeyHtml(accumulator, property) {
	var key = "\t\t<span class=\"definition\">case</span> "+property.name
	key += (property.key != property.name) ? " = <span class=\"string\">\""+property.key+"\"</span>\n" : "\n"
	return accumulator + key
}

function propertyDefinition() {
	return letEnabled() ? "let" : "var"
}

function propertyType(property) {
	const todo = property.type == "Any" ? "</span> <span class=\"comment\">// TODO: Please provide a codable type, because Any isn't one." : ""
		return (property.isArray ? "["+property.type+"]" : property.type) + todo
}

/**
-------------------------------- Date extension --------------------------------
*/

/* NSDate Extension functions */

function generateDateExtension() {
	displayDateExtension(createDateExtensionHtml(getDateFormat()))
}

function createDateExtensionHtml(dateFormat) {

	var output = "\n<span class=\"definition\">extension</span> <span class=\"type\">Date</span> {\n"
    output += "\t<span class=\"definition\">convenience init</span>?(dateString: <span class=\"type\">String</span>, format: <span class=\"type\">String</span> = <span class=\"string\">\""+dateFormat+"\"</span>) {\n"
    output += "\t\t<span class=\"definition\">let</span> dateStringFormatter = <span class=\"type\">NSDateFormatter</span>()\n"
    output += "\t\tdateStringFormatter.<span class=\"type\">dateFormat</span> = <span class=\"string\">\""+dateFormat+"\"</span>\n"
    output += "\t\tdateStringFormatter.<span class=\"type\">locale</span> = <span class=\"type\">NSLocale</span>(localeIdentifier: <span class=\"string\">\"en_US_POSIX\"</span>)\n"
    output += "\t\t<span class=\"definition\">guard let</span> date = dateStringFormatter.<span class=\"type\">dateFromString(dateString)</span> <span class=\"definition\">else</span> { <span class=\"definition\">return nil</span> }\n"
    output += "\t\t<span class=\"definition\">self.init</span>(timeInterval:0, sinceDate:date)\n"
    output += "\t}\n"
	output += "}"
	return output
}

/**
------------------------------- Helper functions -------------------------------
*/

function swiftify(key) {
	const words = key
		.replace(/[-_]/g, ' ')
		.split(' ')

	var name = ""
	for (var i = 0; i < words.length; i++) {
		name += i == 0 ? words[i] : capitalise(words[i])
	}
	return name
}

function getJson() {
	return document.getElementById("ta-json").value
}

function letEnabled() {
	return document.getElementById("cb-let").checked
}

function intEnabled() {
	return !document.getElementById("cb-double").checked
}

function getDateFormat() {
	return document.getElementById("tb-dateformat").value
}

function capitalise(string) {
    return string.charAt(0).toUpperCase() + string.slice(1) //.toLowerCase()
}

function displayCode(swiftCode) {
	document.getElementById("swift").innerHTML = swiftCode
}

function displayDateExtension(dateHtml) {
	document.getElementById("date-extension").innerHTML = dateHtml
}

function invalidInput() {
	document.getElementById("h3-json").className = "error"
	document.getElementById("ta-json").className = "error"
}

function removeError() {
	document.getElementById("h3-json").className = ""
	document.getElementById("ta-json").className = ""
}

function clearData() {
	structs = {}
}

function isURL(str) {
  var pattern = new RegExp(
  	"^" +
    // protocol identifier
    "(?:(?:https?|ftp)://)" +
    // user:pass authentication
    "(?:\\S+(?::\\S*)?@)?" +
    "(?:" +
      // IP address exclusion
      // private & local networks
      "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
      "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
      "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
      "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
      "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
    "|" +
      // host name
      "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
      // domain name
      "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
      // TLD identifier
      "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
      // TLD may end with dot
      "\\.?" +
    ")" +
    // port number
    "(?::\\d{2,5})?" +
    // resource path
    "(?:[/?#]\\S*)?" +
  "$", "i"
	) // fragment locator
  return pattern.test(str)
}
