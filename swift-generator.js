
/**
------------------------------- Swift Property ---------------------------------
*/

PlainProperty.prototype.swiftifiedName = function() {
	return swiftify(this.name)
}

PlainProperty.prototype.swiftifiedType = function (prefix, postfix) {

	switch(this.type) {
		case "boolean":
			return "Bool"
		case "integer":
			return "Int"
		case "double":
			return "Double"
		case "string":
			return "String"
		case "date":
			return "Date"
		case "url":
			return "URL"
		case "any":
			return "Any"
		case "undefined":
			return "Any"
		default:
			return prefix + capitalise(swiftify(this.type)) + postfix
	}
}

PlainProperty.prototype.swiftified = function(prefix, postfix) {
	return new PlainProperty(
		this.key,
		this.swiftifiedName(),
		this.isArray,
		this.swiftifiedType(prefix, postfix)
	)
}

/**
-------------------------------- Swift Struct ----------------------------------
*/

Struct.prototype.swiftifiedName = function(prefix, postfix) {
	return prefix + capitalise(swiftify(this.name)) + postfix
}

Struct.prototype.propertiesNeedsDecoder =	function(properties) {
		for (prop of properties) {
			if (prop.key != prop.name) {
					return true
			}
		}
		return false
}

Struct.prototype.swiftified = function(prefix, postfix) {
	const properties = this.properties.map(property => { return property.swiftified(prefix, postfix) })
	return new SwiftStruct(
		this.swiftifiedName(prefix, postfix),
		this.propertiesNeedsDecoder(properties),
		properties
	)
}

function SwiftStruct(name, needsDecoder, properties) {
	this.name 				= name 					// String
	this.needsDecoder	= needsDecoder	// Bool
	this.properties 	= properties		// PlainProperty array
}

/**
--------------------------- Swift Generator Config -----------------------------
*/

function SwiftConfig(letEnabled, prefix, postfix) {
	this.letEnabled = letEnabled 	// Function, retuns Bool
	this.prefix 		= prefix			// Function, retuns String
	this.postfix 		= postfix			// Function, retuns String
}

/**
------------------------------- Swift Generator --------------------------------
*/

function SwiftGenerator(config) {

	this.config = config

/**
-------------------------------- HTML generator --------------------------------
*/

	this.html = function(structs) {
		return structs
			.map(this.swiftifyStructs)
			.reduce(this.structsReduce, "")
	}

	this.swiftifyStructs = (struct) => {
		return struct.swiftified(
			this.config.prefix(),
			this.config.postfix()
		)
	}

	this.structsReduce = (accumulator, struct) => {
		return accumulator + this.structHtml(struct) + "\n\n"
	}

	this.structHtml = function(struct) {

		// Declare struct html
		var html = "<span class=\"definition\">struct</span> <span class=\"type\">"+struct.name+": Codable</span> {\n\n"
		// List properties
		html += struct.properties.reduce(this.propertyDeclarationHtml, "") + "\n"

		// Declare coding keys
		if (struct.needsDecoder) {
			html += "\t<span class=\"definition\">private enum</span> <span class=\"type\">CodingKeys: String, CodingKey</span> {\n"
			html += struct.properties.reduce(this.propertyCodingKeyHtml, "")
			html += "\t}\n"
		}

		return html + "}"
	}

	this.propertyDeclarationHtml = (acc, property) => {
		return acc
			+ "\t<span class=\"definition\">"
			+ this.propertyDefinition()
			+ "</span> "+property.name
			+ ": <span class=\"type\">"
			+ this.propertyType(property)
			+ "</span>\n"
	}

	this.propertyCodingKeyHtml = (accumulator, property) => {
		var key = "\t\t<span class=\"definition\">case</span> "+property.name
		key += (property.key != property.name) ? " = <span class=\"string\">\""+property.key+"\"</span>\n" : "\n"
		return accumulator + key
	}

	this.propertyDefinition = function() {
		return this.config.letEnabled() ? "let" : "var"
	}

	this.propertyType = function(property) {
		const todo = property.type == "Any" ? "</span> <span class=\"comment\">// TODO: Please provide a codable type, because Any isn't one." : ""
			return (property.isArray ? "["+property.type+"]" : property.type) + todo
	}

/**
-------------------------------- File generator --------------------------------
*/

	this.file = function(structs) {

	}

/**
------------------------------- General methods --------------------------------
*/

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
    output += "\t<span class=\"definition\">init</span>?(dateString: <span class=\"type\">String</span>, format: <span class=\"type\">String</span> = <span class=\"string\">\""+dateFormat+"\"</span>) {\n"
    output += "\t\t<span class=\"definition\">let</span> formatter = <span class=\"type\">DateFormatter</span>()\n"
    output += "\t\tformatter.<span class=\"type\">dateFormat</span> = format\n"
    output += "\t\tformatter.<span class=\"type\">locale</span> = <span class=\"type\">Locale</span>(identifier: <span class=\"string\">\"en_US_POSIX\"</span>)\n"
    output += "\t\t<span class=\"definition\">guard let</span> date = formatter.<span class=\"type\">date</span>(from: dateString) <span class=\"definition\">else</span> { <span class=\"definition\">return nil</span> }\n"
    output += "\t\t<span class=\"definition\">self</span> = date\n"
    output += "\t}\n"
	output += "}"
	return output
}

/**
------------------------------- Helper functions -------------------------------
*/

function swiftify(key) {
	const words = key
		.replace(/[-_ ]/g, ' ')
		.split(' ')

	var name = ""
	for (var i = 0; i < words.length; i++) {
		name += i == 0 ? words[i] : capitalise(words[i])
	}
	return name
}
