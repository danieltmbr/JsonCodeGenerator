/**
------------------------------ PropertyDefinition ------------------------------
*/

function PropertyDefinition(isArray, type) {
	// Properties
	this.isArray 	= isArray 	// Bool
	this.type 		= type			// Struct
}

/**
----------------------------------- Property -----------------------------------
*/

function Property(key, name, isArray, type) {

	// Properties
	this.key 			= key 		// String
	this.name 		= name		// String
	this.isArray 	= isArray	// Bool
	this.type 		= type		// Struct

	// Methods

	// Simplifies a property object
	// returns: PlainProperty
	this.flattened = function() {
		return new PlainProperty(this.key, this.name, this.isArray, this.type.name)
	}
}

/**
-------------------------------- PlainProperty ---------------------------------
*/

function PlainProperty(key, name, isArray, type) {
	// Properties
	this.key 			= key 		// String
	this.name 		= name	  // String
	this.isArray 	= isArray	// Bool
	this.type 		= type		// String
}

/**
----------------------------------- Struct -------------------------------------
*/

function Struct(name, properties) {

	// Properties
	this.name 			= name				// String
	this.properties = properties // (Plain)Property array - can be null

	// Methods

	// Creates a list (with no duplicants) from a Struct Tree
	this.list = function() {
		return this.flattened([])
	}

	// Creates array from struct tree
	// and add it to the accumulator array
	this.flattened = function(accumulator) {

		const props = this.properties.map(property => property.flattened())
		accumulator.push(new Struct(this.name, props))

		for (prop of this.properties) {
			if (null != prop.type.properties) {
				prop.type.flattened(accumulator)
			}
		}
		return accumulator
	}
}

/**
-------------------------------- ParserConfig ----------------------------------
*/

function ParserConfig(rootName, intEnabled, dateFormat) {
	this.rootName 	= rootName 	// Function, returns: String
	this.intEnabled = intEnabled	// Function, returns: Bool
	this.dateFormat = dateFormat	// Function, returns: String
}

/**
----------------------------------- Parser -------------------------------------
*/

function Parser(config) {

	this.config 	= config	// Configuration of the parser
	this.structs 	= [] 		// In-memory database :D

	// parse(object)
	// returns a duplicated free flattened Struct array
	this.parse = function(object) {
		const root = this.parseObject(object, config.rootName())
		return this.removeDuplicates(root.list())
	}

	// parseObject(object, name)
	// params: object - js object parsed from JSON
	//				 name - name of the root object
	// returns: Struct
	this.parseObject = function(object, name) {
		const properties = object != null && typeof(object) == "object"
			? Object.keys(object).map(key => this.parseProperty(key, object[key]))
			: null
		return new Struct(name, properties)
	}

	// parseProperty(key, value)
	// params: key - key that stored the value in the parent object
	//				 value - value for the key from parent object
	// returns: Property
	this.parseProperty = function(key, value) {
		const definition = this.getPropertyDefinition(key, value)
		return new Property(key, key, definition.isArray, definition.type)
	}

	// returns: PropertyDefinition
	this.getPropertyDefinition = function(key, value) {
		const isArray = Array.isArray(value)
		const type = this.getTypeDefinition(key, value)
		return new PropertyDefinition(isArray, type)
	}

	// returns: Struct
	this.getTypeDefinition = function(key, value) {

		const name = this.getTypeName(key, value)
		if (typeof(value) == "object") {
			// Object
			if (!Array.isArray(value)) {
				return this.parseObject(value, name)
			}
			// Not ampty array
			else if (value.length != 0) {
				return this.parseObject(value[0], name)
			}
		}
		// Else Primitive value (e.g. int, bool, string, etc)
		return new Struct(name, null)
	}

	// returns: string (Name of a type)
	this.getTypeName = function(key, value) {

		switch(typeof(value)) {
			case "boolean":
				return "boolean"
			case "number":
				return (this.config.intEnabled() && value % 1 === 0) ? "integer" : "double"
			case "string":
				if(moment(value, this.config.dateFormat(), true).isValid()) {
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
						return this.getTypeName(key, value[0])
					}
				} else {
						return key;
				}
			default: return "undefined"
		}
	}

	// Remove duplicant structs from a list
	// Same structs: which has the same property list
	this.removeDuplicates = function(structs) {
		return this.uniqBy(structs, this.keyOf)
	}

	// Remove duplicant object form array
	// which has the same key
	this.uniqBy = function(array, key) {
	    var seen = {}
			var changes = {}
	    const filtered = array.filter(function(item) {
					const k = key(item)
	        var duplicate = false
					if (seen.hasOwnProperty(k)) {
						duplicate = true
						changes[item.name] = seen[k]
					} else {
						seen[k] = item.name
					}
					return !duplicate
	    })
			return this.correctTypedStructs(filtered, changes)
	}

	this.correctTypedStructs = function(structs, typeChanges) {
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
	this.keyOf = function(struct) {
		return JSON.stringify(struct.properties)
	}
}
