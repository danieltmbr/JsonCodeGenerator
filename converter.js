/**
------------------------------------ Global ------------------------------------
*/

const parserConfig = new ParserConfig(getRootName, getDynamicNumberEnabled, getDateFormat)
const parser = new Parser(parserConfig)

const swiftConfig = new SwiftConfig(getConstansEnabled, getPrefix, getPostfix)
const swiftGenerator = new SwiftGenerator(swiftConfig)

function convert() {
	removeError()
	const json = getJson()
	const structs = parser.parse(json)
	const html = swiftGenerator.html(structs)
	displayCode(html)
}

/**
------------------------------- Action handlers --------------------------------
*/

$("#convert").on('click', function() {
	convert()
})

$("#clear-input").on('click', function() {
	$("#ta-json").html("")
})

$("#close-output").on('click', function() {
	$("#output").addClass("hidden")
})

$("#copy-output").on('click', function() {
	ClipboardHelper.copyElement($('#code').first());
})

$("#btn-constans-enabled").on('click', function() {
	$("#btn-constans-enabled").addClass("selected")
	$("#btn-constans-disabled").removeClass("selected")
})

$("#btn-constans-disabled").on('click', function() {
	$("#btn-constans-disabled").addClass("selected")
	$("#btn-constans-enabled").removeClass("selected")
})

$("#btn-numbers-dynamic").on('click', function() {
	$("#btn-numbers-dynamic").addClass("selected")
	$("#btn-numbers-double").removeClass("selected")
})

$("#btn-numbers-double").on('click', function() {
	$("#btn-numbers-double").addClass("selected")
	$("#btn-numbers-dynamic").removeClass("selected")
})

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
	return $("#ta-json").val()
}

function getRootName() {
	const root = $("#tb-root-name").val()
	return root.length > 0 ? root : "Root"
}

function getPrefix() {
	return $("#tb-type-prefix").val()
}

function getPostfix() {
	return $("#tb-type-postfix").val()
}

function getDateFormat() {
	const format = $("#tb-dateformat").val()
	return format.length > 0 ? format : "YYYY-MM-DDTHH:mm:ss.sssZ"
}

function getDynamicNumberEnabled() {
	return $("#btn-numbers-dynamic").hasClass('selected')
}

function getConstansEnabled() {
	return $("#btn-constans-enabled").hasClass('selected')
}

function capitalise(string) {
    return string.charAt(0).toUpperCase() + string.slice(1) //.toLowerCase()
}

function displayCode(code) {
	$("#code").html(code)
	$("#output").removeClass("hidden")
}

function displayDateExtension(dateHtml) {
	$("#date-extension").html(dateHtml)
}

function invalidInput() {
	$("#output").addClass("hidden")
	$("#error").html('<div class="alert alert-danger alert-dismissable fade in"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>Error!</strong> Couldn\'t parse the provided JSON.</div>')
}

function removeError() {
	$("#error").html("")
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

var ClipboardHelper = {
    copyElement: function ($element)
    {
       this.copyText($element.text())
    },
    copyText:function(text) // Linebreaks with \n
    {
			console.log(text)
        var $tempInput =  $("<textarea>");
        $("body").append($tempInput);
        $tempInput.val(text).select();
				try {
    	  	document.execCommand("copy");
					$tempInput.remove();
    		} catch(e) {
					$tempInput.remove();
					alert("Coulnd't copy the code to the clipboard. Your browser might not supported. Please try to update it.")
    		}
    }
}

function download() {
	var content = "What's up , hello world";
	// any kind of extension (.txt,.cpp,.cs,.bat)
	var filename = "hello.txt";

	var blob = new Blob([content], {
	 type: "text/plain;charset=utf-8"
	});

	saveAs(blob, filename);
}
