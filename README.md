foParseArguments
===============

Parse Node.js arguments library.

Getting Started
---------------
1. Install foParseArguments via NPM.
  
  `npm install foparsearguments`
  
  Optionally: rename `foparsearguments` to `foParseArguments`: npm is unable to
  handle the complexity of uppercase characters in a module name. Node.js on
  Windows does not have this problem, so renaming the folder is not required
  for you to use the module.
  
2. Require foParseArguments in your project.
  
  `var foParseArguments=require("foParseArguments");`

3. Parse arguments using foParseArguments.
  
  ```
  var oArguments = foParseArguments({
    "dfxTypesConverters": { 
      "myType": function (sValue) {
        if (!isvalid(sValue) throw new Error("must be a valid xxx");
        return processed(sValue);
      }, // define a type
      ...
    },
    "adxParameters": [ 
      {
        "sName": "first parameter",
        "sTypeDescription": "string",
        "sHelpText": "This will be shown when you run the script with -?",
        "xDefaultValue": "first"
      },
      {
        "sName": "second parameter",
        "sTypeDescription": "int",
        "sHelpText": "This will be shown when you run the script with -?",
        "xDefaultValue": 2
      },
      ...
    ],
    "dxSwitches": {
      "switch-name": {
        "sHelpText": "This will be shown when you run the script with -?",
      },
      ...
    ],
    "dxOptions": {
      "option-name": {
        "sTypeDescription": "myType", // option must be of mytype.
        "sHelpText": "This will be shown when you run the script with -?",
        "xDefaultValue": 2
      },
      ...
    }
  });
  ```
  
4. Used parsed arguments in your script
  
  ```  
  var uSomeNumber = oArguments.dxOptions["some-number"];
  var sSomeString = oArguments.axParameters[0];
  var bSomeBoolean = oArguments.dbSwitches["some-boolean"];
  ```
  
Notes
-----
### Alpha release

This has not been extensively tested and the API will most likely change in the
future. 

--------------------------------------------------------------------------------

### License
This code is licensed under [CC0 v1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
