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
	// displayCode(htmlOutput(structs))
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
			if(!isNaN(Date.parse(value, getDateFormat()))) {
				return "Date"
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
    var seen = {};
    return array.filter(function(item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
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
	return Object.keys(structs).reduce( function(previousValue, currentValue, currentIndex, array) {
  		return previousValue + objectHtmlOutput(currentValue, structs[currentValue]) + "\n\n"
	}, "")
}

function objectHtmlOutput(name, properties) {

	var htmlDeclareProperties = ""
	var htmlInitProperties = ""

	properties.forEach(function(element, index, array) {
		htmlDeclareProperties += "\t"+propertyToHtml(element, letEnabled())
		htmlInitProperties += "\t\t"+propertyParseToHtml(element)
	})

	var classOutput = "<span class=\"definition\">final class</span> <span class=\"replace\">"+name+"</span>: <span class=\"var\">ResponseJSONSerializable"


	classOutput += "</span> {\n\n"
	classOutput += htmlDeclareProperties
	classOutput += "\n\t<span class=\"definition\">required init</span>?(json: <span class=\"var\">JSON</span>) {\n"
	classOutput += htmlInitProperties
	classOutput += "\t}\n"

	classOutput += "}"

	return classOutput
}

function propertyToHtml(property, enabledLet) {
	const def = enabledLet ? "let" : "var"
	var output = "<span class=\"definition\">"+def+"</span> "+property.name+": <span class=\"type\">"+getSwiftType(property)+"</span>"
	if((property.custom && !property.array) || (property.array && !property.custom)) {
		output += "?"
	}
	return output + "\n"
}

function propertyParseToHtml(property) {
	if(property.type == "date") {
		return "<span class=\"var\">"+property.name+"</span> = <span class=\"type\">NSDate</span>(dateString: json[<span class=\"string\">\""+property.name+"\"</span>].<span class=\"var\">stringValue</span>)\n"
	} else if(property.array) {

		if(property.custom) {
			return "<span class=\"var\">"+property.name+"</span> = <span class=\"replace\">"+property.type+"</span>.<span class=\"var\">collection</span>(json[<span class=\"string\">\""+property.name+"\"</span>])\n"
		} else {
			return "<span class=\"var\">"+property.name+"</span> = json[<span class=\"string\">\""+property.name+"\"</span>].<span class=\"var\">arrayObject</span> <span class=\"definition\">as</span>? <span class=\"type\">"+getSwiftType(property)+"</span>\n"
		}

	} else if(property.custom) {
		return "<span class=\"var\">"+property.name+"</span> = <span class=\"replace\">"+property.type+"</span>(json: json[<span class=\"string\">\""+property.name+"\"</span>])\n"
	} else {
		return "<span class=\"var\">"+property.name+"</span> = json[<span class=\"string\">\""+property.name+"\"</span>].<span class=\"var\">"+property.type+"Value</span>\n"
	}
}

function getSwiftType(property) {
		var output = capitalise(property.type)
		if(property.custom) {
			output = "<span class=\"replace\">"+output+"</span>"
		}
		if(property.array) {
			output = "["+output+"]"
		}
		return output
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
