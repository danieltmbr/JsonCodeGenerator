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

			return {type: "bool", array: false, custom: false};

		case "number":

			if(intEnabled() && value % 1 === 0) {
				return {type: "int", array: false, custom: false};
			} else {
				return {type: "double", array: false, custom: false};
			}

		case "string":

			if(!isNaN(Date.parse(value, getDateFormat()))) {
				return {type: "date", array: false, custom: false};
			} else {
				return {type: "string", array: false, custom: false};
			}

		case "object":

			if(Array.isArray(value)) {
				if(value.length == 0) {
					return {type: "AnyObject", array: true, custom: false};
				} else {
					var type = getType(key, value[0], recursive);
					return {type: type.type, array: true, custom: type.custom};
				}
			} else {
				if(recursive) {
					var className = capitalise(key)+"DTO";
					createClass(className, value);
					return {type: className, array: false, custom: true};
				} else {
					return {type: "json", array: false, custom: true};
				}
			}

		default:
			return {type: "undefined", array: false, custom: true}
	}

}

function createPropertyObject(key, value) {
	var pType = getType(key, value, recursionEnabled());
	return {"name": key, "type":pType.type, "array":pType.array, custom: pType.custom};
}

/* Function for creating Styled HTML output */

function getSwiftType(property) {
	if(property.type == "date") {
		return "NSDate?";
	} else {
		var output = capitalise(property.type);
		if(property.custom) {
			output = "<span class=\"replace\">"+output+"</span>";
		}
		if(property.array) {
			output = "["+output+"]";
		}
		return output
	} 
}

function propertyToHtml(property, enabledLet) {
	var def = enabledLet ? "let" : "var";
	var output = "<span class=\"definition\">"+def+"</span> "+property.name+": <span class=\"type\">"+getSwiftType(property)+"</span>";
	if((property.custom && !property.array) || (property.array && !property.custom)) {
		output += "?";
	}
	return output + "\n";
}

function propertyParseToHtml(property) {
	if(property.type == "date") {
		return "<span class=\"var\">"+property.name+"</span> = <span class=\"type\">NSDate</span>(dateString: json[<span class=\"string\">\""+property.name+"\"</span>].<span class=\"var\">stringValue</span>)\n";
	} else if(property.array) {

		if(property.custom) {
			return "<span class=\"var\">"+property.name+"</span> = <span class=\"replace\">"+property.type+"</span>.<span class=\"var\">collection</span>(json[<span class=\"string\">\""+property.name+"\"</span>])\n";
		} else {
			return "<span class=\"var\">"+property.name+"</span> = json[<span class=\"string\">\""+property.name+"\"</span>].<span class=\"var\">arrayObject</span> <span class=\"definition\">as</span>? <span class=\"type\">"+getSwiftType(property)+"</span>\n";
		}

	} else if(property.custom) {
		return "<span class=\"var\">"+property.name+"</span> = <span class=\"replace\">"+property.type+"</span>(json: json[<span class=\"string\">\""+property.name+"\"</span>])\n";
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

	var classOutput = "<span class=\"definition\">final class</span> <span class=\"replace\">"+name+"</span>: <span class=\"var\">ResponseJSONSerializable";

	if (collectionEnabled()) {
		classOutput += ", ResponseJSONCollectionSerializable";
	}

	classOutput += "</span> {\n\n";
	classOutput += htmlDeclareProperties;
	classOutput += "\n\t<span class=\"definition\">required init</span>?(json: <span class=\"var\">JSON</span>) {\n";
	classOutput += htmlInitProperties;
	classOutput += "\t}\n";

	if(collectionEnabled()) {
		classOutput += "\n\t<span class=\"definition\">static func</span> collection(json: <span class=\"var\">JSON</span>) -> [<span class=\"replace\">"+name+"</span>] {\n";
		classOutput += "\t\t<span class=\"definition\">var</span> items = [<span class=\"replace\">"+name+"</span>]()\n";
		classOutput += "\t\t<span class=\"definition\">for</span> (_,subJson):(<span class=\"type\">String</span>, <span class=\"var\">JSON</span>) in json {\n";
		classOutput += "\t\t\t<span class=\"definition\">if let</span> item = <span class=\"replace\">"+name+"</span>(json: subJson) {\n";
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
