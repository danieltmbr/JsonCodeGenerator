/* It's just a simple 'dictionary' -> Key(class name): [properties for the class] */
var classes = {};

function convert() {
	clearData()
	parseJson(getJson(), "ClassName");
	displayCode(assembleOutput(classes));
}

function parseJson(json, className) {

	var object = JSON.parse(json);
	createClass(className, object);
}

function createClass(withName, fromObject) {
	classes[withName] = Object.keys(fromObject).map( function(key) {
        return createPropertyObject(key, fromObject[key]);
	});
}

function getType(key, value, recursive) {

	switch(typeof(value)) {
		
		case "boolean":

			return {type: "bool", array: false};

		case "number":

			if(intEnabled() && value % 1 === 0) {
				return {type: "int", array: false};
			} else {
				return {type: "double", array: false};
			}

		case "string":

			if(!isNaN(Date.parse(value, getDateFormat()))) {
				return {type: "date", array: false};
			} else {
				return {type: "string", array: false};
			}

		case "object":

			if(Array.isArray(value)) {
				console.log("It's an array");
			} else {
				if(recursive) {
					var className = capitalise(key)+"DTO";
					createClass(className, value);
					return {type: className, array: false};
				} else {
					return {type: "json", array: false};
				}
			}

		default:
			return {type: "undefined", array: false}
	}

}

function createPropertyObject(key, value) {
	var pType = getType(key, value, recursionEnabled());
	return {"name": key, "type":pType.type, "array":pType.array};
}

/* Function for creating Styled HTML output */

function getSwiftType(property) {
	if(property.type == "date") {
		return "NSDate?";
	} else if(property.array) {
		return "["+capitalise(poperty.type)+"]";
	} else {
		return capitalise(property.type);
	}
}

function propertyToHtml(property, enabledLet) {
	var def = enabledLet ? "let" : "var";
	return "<span class=\"definition\">"+def+"</span> "+property.name+": <span class=\"type\">"+getSwiftType(property)+"</span>\n";
}

function propertyParseToHtml(property) {
	if(property.type == "date") {
		return "<span class=\"var\">"+property.name+"</span> = <span class=\"type\">NSDate</span>(dateString: json[<span class=\"string\">\""+property.name+"\"</span>].<span class=\"var\">stringValue</span>)\n";
	} else if(property.array) {
		return ;
	} else {
		return "<span class=\"var\">"+property.name+"</span> = json[<span class=\"string\">\""+property.name+"\"</span>].<span class=\"var\">"+property.type+"Value</span>\n";
	}
}

function createClassHtmlOutput(name, properties) {

	var htmlDeclareProperties = ""; 
	var htmlInitProperties = ""; 

	properties.forEach(function(element, index, array) {
		htmlDeclareProperties += "\t"+propertyToHtml(element, letEnabled());
		htmlInitProperties += "\t\t"+propertyParseToHtml(element);
	});

	var classOutput = "<span class=\"definition\">final class</span> <span class=\"replace\"><#"+name+"#></span>: <span class=\"var\">ResponseJSONSerializable";

	if (collectionEnabled()) {
		classOutput += ", ResponseJSONCollectionSerializable";
	}

	classOutput += "</span> {\n\n";
	classOutput += htmlDeclareProperties;
	classOutput += "\n\t<span class=\"definition\">required init</span>?(json: <span class=\"var\">JSON</span>) {\n";
	classOutput += htmlInitProperties;
	classOutput += "\t}\n";

	if(collectionEnabled()) {
		classOutput += "\n\t<span class=\"definition\">static func</span> collection(json: <span class=\"var\">JSON</span>) -> [<span class=\"replace\"><#"+name+"#></span>] {\n";
		classOutput += "\t\t<span class=\"definition\">var</span> items = [<span class=\"replace\"><#"+name+"#></span>]()\n";
		classOutput += "\t\t<span class=\"definition\">for</span> (_,subJson):(<span class=\"type\">String</span>, <span class=\"var\">JSON</span>) in json {\n";
		classOutput += "\t\t\t<span class=\"definition\">if let</span> item = <span class=\"replace\"><#"+name+"#></span>(json: subJson) {\n";
		classOutput += "\t\t\t\titems.append(item)\n";
		classOutput += "\t\t\t}\n";
		classOutput += "\t\t}\n";
		classOutput += "\t\t<span class=\"definition\">return</span> items\n";
		classOutput += "\t}\n";
	}

	classOutput += "}";	

	return classOutput;
}

function assembleOutput(classesObject) {
	return Object.keys(classesObject).reduce( function(previousValue, currentValue, currentIndex, array) {
  		return previousValue + createClassHtmlOutput(currentValue, classesObject[currentValue]) + "\n\n";
	}, "");
}

/* NSDate Extension functions */

function generateDateExtension() {
	displayDateExtension(createDateExtensionHtml(getDateFormat()));
}

function createDateExtensionHtml(dateFormat) {

	var output = "\n<span class=\"definition\">extension</span> <span class=\"type\">NSDate</span> {\n";
    output += "\t<span class=\"definition\">convenience init</span>?(<span class=\"type\">dateString: String, format: <span class=\"type\">String = <span class=\"string\">\""+dateFormat+"\"</span>) {\n";
    output += "\t\t<span class=\"definition\">let</span> dateStringFormatter = <span class=\"type\">NSDateFormatter</span>()\n";
    output += "\t\tdateStringFormatter.<span class=\"type\">dateFormat</span> = <span class=\"string\">\""+dateFormat+"\"</span>\n";
    output += "\t\tdateStringFormatter.<span class=\"type\">locale</span> = <span class=\"type\">NSLocale</span>(localeIdentifier: <span class=\"string\">\"en_US_POSIX\"</span>)\n";
    output += "\t\t<span class=\"definition\">guard let</span> date = dateStringFormatter.<span class=\"type\">dateFromString(dateString)</span> <span class=\"definition\">else</span> { <span class=\"definition\">return nil</span> }\n";
    output += "\t\t<span class=\"definition\">self.init</span>(timeInterval:0, sinceDate:date)\n";
    output += "\t}\n";
	output += "}";
	return output;
}

/* Helper functions */

function getJson() {
	return document.getElementById("ta-json").value;
}

function letEnabled() {
	return document.getElementById("cb-let").checked;
}

function intEnabled() {
	return !document.getElementById("cb-double").checked;
}

function collectionEnabled() {
	return document.getElementById("cb-collection").checked;
}

function recursionEnabled() {
	return document.getElementById("cb-recursive").checked;
}

function getDateFormat() {
	return document.getElementById("tb-dateformat").value;
}

function capitalise(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);//.toLowerCase();
}

function displayCode(swiftCode) {
	document.getElementById("swift").innerHTML = swiftCode;
}

function displayDateExtension(dateHtml) {
	document.getElementById("date-extension").innerHTML = dateHtml;
}

function clearData() {
	classes = {};
}
