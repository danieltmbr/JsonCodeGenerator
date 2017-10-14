/**
------------------------------------ Global ------------------------------------
*/

const parserConfig = new ParserConfig(getRootName, getIntEnabled, getDateFormat)
const parser = new Parser(parserConfig)

const swiftConfig = new SwiftConfig(getLetEnabled, getPrefix, getPostfix)
const swiftGenerator = new SwiftGenerator(swiftConfig)

function convert() {
	removeError()
	const json = getJson()
	const structs = parser.parse(json)
	const html = swiftGenerator.html(structs)
	displayCode(html)
}

/**
------------------------------- Helper functions -------------------------------
*/

// parseJson(json, name)
// params: json - string to parse in JSON format
//				 name - name of the root object of the JSON
// returns: object - {name, properties}
function getJson() {
	try {
			const object = JSON.parse(getJsonString())
			return object
	} catch(err) {
			console.log(err)
			invalidInput()
	}
}

function getJsonString() {
	return document.getElementById("ta-json").value
}

function getRootName() {
	const root = document.getElementById("tb-root-name").value
	return root.length > 0 ? root : "Root"
}

function getPrefix() {
	return document.getElementById("tb-type-prefix").value
}

function getPostfix() {
	return document.getElementById("tb-type-postfix").value
}

function getIntEnabled() {
	return !document.getElementById("cb-double").checked
}

function getDateFormat() {
	return document.getElementById("tb-dateformat").value
}

function getLetEnabled() {
	return document.getElementById("cb-let").checked
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
