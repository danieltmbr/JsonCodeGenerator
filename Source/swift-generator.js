/**
--------------------------------- Html output ----------------------------------
*/

//
function htmlOutput(structs) {
	console.log(structs)
	return structs
		.map(swiftifyStruct)
		.reduce(structsReduce, "")
}

function structsReduce(accumulator, struct) {
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

function swiftifyStruct(struct) {
	const properties = struct.properties.map(swiftifyProperty)
	return {
		name: swiftifyStructName(struct.name),
		needsDecoder: propertiesNeedsDecoder(properties),
		properties: properties
	}
}

function swiftifyProperty(property) {
	return {
		key: property.key,
		name: swiftifyPropertyName(property.name),
		isArray: property.isArray,
		type: swiftifyType(property.type)
	}
}

function swiftifyStructName(name) {
	return capitalise(swiftify(name)+"Dto")
}

function swiftifyPropertyName(name) {
	return swiftify(name)
}

function swiftifyType(type) {

	switch(type) {
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
			return "undefined" // TODO: maybe should be replaced with Any
		default: return swiftifyStructName(type)
	}
}

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

function propertiesNeedsDecoder(properties) {

	for (prop of properties) {
		if (prop.key != prop.name) {
				return true
		}
	}
	return false
}
