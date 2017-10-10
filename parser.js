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
		name: key,
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
			return "boolean"
		case "number":
			return (intEnabled() && value % 1 === 0) ? "integer" : "double"
		case "string":
			if(moment(value, getDateFormat(), true).isValid()) {
				return "date"
			} else if (isURL(value)) {
				return "url"
			} else {
				return "string"
			}
		case "object":
			if(Array.isArray(value)) {
				if(value.length == 0) {
					return "any"
				} else {
					return getTypeName(key, value[0])
				}
			} else {
					return key; // capitalise(swiftify(key)+"Dto")
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
	accumulator.push({name: struct.name, properties: props})

	for (prop of struct.properties) {
		if (null != prop.type.properties) {
			flattenStruct(prop.type, accumulator)
		}
	}

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
		var changes = {}
    const filtered = array.filter(function(item) {
				const k = key(item)
        var duplicate = false
				// const duplicate = seen.hasOwnProperty(k) ? false : (seen[k] = item.name)

				if (seen.hasOwnProperty(k)) {
					duplicate = true
					changes[item.name] = seen[k]
				} else {
					seen[k] = item.name
				}
				return !duplicate
    })
		return correctTypedStructs(filtered, changes)
}

function correctTypedStructs(structs, typeChanges) {
	var corrected = []
	for (struct of structs) {
		var s = struct
		for (key in s.properties) {
			const property = s.properties[key]
			if (typeChanges.hasOwnProperty(property.type)) {
				property.type = typeChanges[property.type]
			}
		}
		corrected.push(s)
	}
	return corrected
}

// Creates key from a struct
// using its properties array
function keyOf(struct) {
	return JSON.stringify(struct.properties)
}

/**
------------------------------- Helper functions -------------------------------
*/

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
