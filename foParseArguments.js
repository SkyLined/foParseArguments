module.exports = foParseArguments;

var oPath = require("path");

function fShowHelp(oSettings) {
  asUsage = [oPath.basename(process.argv[1])];
  if (oSettings.adxParameters) {
    oSettings.adxParameters.forEach(function(oParameterSettings) {
      if (!oParameterSettings.auRepeat) {
        asUsage.push(oParameterSettings.sName);
      } else {
        asClosers = [];
        for (var uRepeat = 0; uRepeat < oParameterSettings.auRepeat[1]; uRepeat++) {
          if (uRepeat < oParameterSettings.auRepeat[0]) {
            asUsage.push(oParameterSettings.sName);
          } else if (uRepeat > 1 && oParameterSettings.auRepeat[1] == Infinity) {
            asUsage.push("[...]");
            break;
          } else {
            asUsage.push("[" + oParameterSettings.sName);
            asClosers.push("]");
          }
        }
        asUsage = asUsage.concat(asClosers);
      }
    });
  }
  if (oSettings.dxOptions) {
    if (oSettings.dxSwitches) {
      asUsage.push("[options and switches]");
    } else {
      asUsage.push("[options]");
    }
  } else if (oSettings.dxSwitches) {
    asUsage.push("[switches]");
  }
  console.log("Usage:");
  console.log("    " + asUsage.join(" "));
  console.log("");
  if (oSettings.adxParameters) {
    console.log("Parameters:");
    oSettings.adxParameters.forEach(function (oParameterSettings) {
      console.log("    " + oParameterSettings.sName + " (" + oParameterSettings.sTypeDescription + ")");
      console.log("        " + oParameterSettings.sHelpText);
      if (oParameterSettings.xDefaultValue !== undefined) {
        console.log("        default: " + JSON.stringify(oParameterSettings.xDefaultValue));
      }
    });
  }
  if (oSettings.dxOptions) {
    console.log("Options:");
    var asOptionNames = Object.keys(oSettings.dxOptions);
    asOptionNames.sort();
    asOptionNames.forEach(function (sOptionName) {
      var oOptionSettings = oSettings.dxOptions[sOptionName],
          sAdditionalName = oOptionSettings.sShortName ? " (or -" + oOptionSettings.sShortName + "=...)" : "";
      console.log("    --" + sOptionName + "=" + oOptionSettings.sTypeDescription + sAdditionalName);
      console.log("        " + oOptionSettings.sHelpText);
      if (oOptionSettings.xDefaultValue !== undefined) {
        console.log("        default: " + JSON.stringify(oOptionSettings.xDefaultValue));
      }
    });
  }
  if (oSettings.dxSwitches) {
    console.log("Switches:");
    var asSwitchNames = Object.keys(oSettings.dxSwitches);
    asSwitchNames.sort();
    asSwitchNames.forEach(function (sSwitchName) {
      console.log("    --" + sSwitchName);
      console.log("        " + oSettings.dxSwitches[sSwitchName].sHelpText);
    });
  }
}
function fShowError(sMessage) {
  console.log("Invalid argument syntax: " + sMessage);
}
function fxParseValueUsingTypeDescription(sName, sValue, sTypeDescription, dfxTypeConverters) {
  asSubTypesAndSeparators = sTypeDescription.split(/\b/);
  if (asSubTypesAndSeparators.length == 1) {
    if (sTypeDescription in dfxTypeConverters) {
      var fxTypeConverter = dfxTypeConverters[sTypeDescription];
      try {
        return fxTypeConverter(sValue);
      } catch (oError) {
        return fShowError(sName + " " + oError.message);
      }
    } else {
      throw new Error("Unknown type \"" + sTypeDescription + "\" for " + sName);
    }
  }
  var axValue = [];
  for (var u = 0; u < asSubTypesAndSeparators.length; u += 2) {
    var sSubName = sName + ", value #" + (u / 2 + 1),
        sSubTypeDescriptor = asSubTypesAndSeparators[u],
        sSeparator = asSubTypesAndSeparators[u + 1];
    if (sSubTypeDescriptor in dfxTypeConverters) {
      var fxTypeConverter = dfxTypeConverters[sSubTypeDescriptor];
      if (!sSeparator) {
        try {
          var xValue = fxTypeConverter(sValue);
        } catch (oError) {
          return fShowError(sSubName + " " + oError.message);
        }
      } else {
        var asValue = sValue.split(sSeparator);
        if (asValue.length == 1) {
          return fShowError(sSubName + " is not followed by a \"" + sSeparator + "\" separator");
        }
        try {
          xValue = fxTypeConverter(asValue.shift());
        } catch (oError) {
          return fShowError(sSubName + " " + oError.message);
        }
        sValue = asValue.join(sSeparator);
      }
      axValue.push(xValue);
    } else {
      throw new Error("Unknown type \"" + sSubTypeDescriptor + "\" for " + sSubName);
    }
  }
  return axValue;
}

function foParseArguments(oSettings, asArguments) {
  var asArguments = asArguments || process.argv.slice(2);
  var dfxTypeConverters = {
    "string": function (sValue) {
      return sValue;
    },
    "bool": function (sValue) {
      switch (sValue.toLowerCase()) {
        case "false": case "0": case "off": case "no": case "disabled":
          return false;
        case "true": case "1": case "on": case "yes": case "enabled":
          return true;
      }
      throw new Error("must be boolean");
    },
    "int": function (sValue) {
      var iValue = parseInt(sValue);
      if (isNaN(iValue)) throw new Error("must be an integer");
      return iValue;
    },
    "uint": function (sValue) {
      var uValue = parseInt(sValue);
      if (isNaN(uValue) || uValue < 0) throw new Error("must be a positive integer");
      return uValue;
    },
    "float": function (sValue) {
      var nValue = parseFloat(sValue);
      if (isNaN(nValue)) throw new Error("must be a number");
      return nValue;
    },
    "ufloat": function (sValue) {
      var nValue = parseFloat(sValue);
      if (isNaN(nValue) || nValue < 0) throw new Error("must be a positive number");
      return nValue;
    },
    "float01": function (sValue) {
      var nValue = parseFloat(sValue);
      if (isNaN(nValue) || nValue < 0 || nValue > 1) throw new Error("must be a number between 0 and 1");
      return nValue;
    },
  };
  if (oSettings.dfxTypeConverters) {
    for (sTypeName in oSettings.dfxTypeConverters) {
      dfxTypeConverters[sTypeName] = oSettings.dfxTypeConverters[sTypeName];
    }
  }
  var dsOptionTypeDescriptions = {},
      dsOptionNames = {},
      dxOptions = {};
  if (oSettings.dxOptions) {
    for (sOptionName in oSettings.dxOptions) {
      var oOptionSettings = oSettings.dxOptions[sOptionName];
      dsOptionTypeDescriptions[sOptionName] = oOptionSettings.sTypeDescription;
      dsOptionNames[sOptionName] = sOptionName;
      if (oOptionSettings.xDefaultValue !== undefined) {
        dxOptions[sOptionName] = oOptionSettings.xDefaultValue;
      }
      if (oOptionSettings.sShortName) {
        if (oOptionSettings.sShortName in dsOptionNames) {
          throw new Error("short name " + oOptionSettings.sShortName + " is used more than once");
        }
        dsOptionNames[sShortName] = oOptionSettings.sShortName;
      }
    }
  }
  var dxSwitchNames = {},
      dbSwitches = {};
  if (oSettings.dxSwitches) {
    for (var sSwitchName in oSettings.dxSwitches) {
      dxSwitchNames[sSwitchName] = 1;
      dbSwitches[sSwitchName] = false;
    }
  }
  
  function fsGetExcludedSwitchOrOption(oSwitchOrOptionSettings) {
    if (oSwitchOrOptionSettings.asExcludesSwitches) {
      var sInvalidSwitch;
      if (oSwitchOrOptionSettings.asExcludesSwitches.some(function (sExcludedSwitch) {
        sInvalidSwitch = sExcludedSwitch;
        return dbSwitches[sExcludedSwitch];
      })) {
        return sInvalidSwitch;
      }
    }
    if (oSwitchOrOptionSettings.asExcludesOptions) {
      var sInvalidOption;
      if (oSwitchOrOptionSettings.asExcludesOptions.some(function (sExcludedOption) {
        sInvalidOption = sExcludedOption;
        return sExcludedOption in dsOptionNames;
      })) {
        return sInvalidOption;
      }
    }
  }
  
  var asParameterNames = [],
      asParameterTypeDescriptions = [],
      aauParameterRepeats = [],
      dxParameters = {};
  if (oSettings.adxParameters) {
    oSettings.adxParameters.forEach(function (oParameterSettings) {
      if (oParameterSettings.sName in dxParameters) {
        throw new Error("Parameter name \"" + oParameterSettings.sName + "\" is used more than once");
      }
      asParameterNames.push(oParameterSettings.sName);
      asParameterTypeDescriptions.push(oParameterSettings.sTypeDescription);
      aauParameterRepeats.push(oParameterSettings.auRepeat);
      dxParameters[oParameterSettings.sName] = undefined;
    });
  }
  var bNoMoreOptionsOrSwitches = false,
      uParameterIndex = 0,
      uParameterRepeat = 0;
  if (!asArguments.every(function (sArgument) {
    if (sArgument == "--") {
      bNoMoreOptionsOrSwitches = true;
      return true;
    }
    var oOptionOrSwitchMatch = (
        bNoMoreOptionsOrSwitches ? false :
        sArgument.match(/^\-(?:([^:=])|\-([^:=]{2,}))(?:[:=](.+))?$/)
    );
    if (oOptionOrSwitchMatch) {
      if (sArgument == "-?" || sArgument == "-h" || sArgument == "--help") {
        return fShowHelp(oSettings);
      }
      var sName = oOptionOrSwitchMatch[1] || oOptionOrSwitchMatch[2],
          sValue = oOptionOrSwitchMatch[3];;
      if (sName in dxSwitchNames) {
        if (sValue) {
          return fShowError("Switch \"--" + sName + "\" does not take a value");
        }
        var sExcludedSwitchOrOption = fsGetExcludedSwitchOrOption(oSettings.dxSwitches[sName]);
        if (sExcludedSwitchOrOption) {
          return fShowError("Switch \"--" + sName + "\" cannot be used with \"--" + sExcludedSwitchOrOption + "\"");
        }
        dbSwitches[sName] = true;
      } else if (sName in dsOptionNames) {
        var sOptionName = dsOptionNames[sName]; // sName might be a short name
        if (!sValue) {
          if (++u < process.argv.length) {
            sValue = process.argv[u];
          } else {
            return fShowError("Missing value for option \"--" + sName + "\"");
          }
        }
        var xOptionValue = fxParseValueUsingTypeDescription("option " + sOptionName, sValue, 
            dsOptionTypeDescriptions[sOptionName], dfxTypeConverters);
        if (xOptionValue === undefined) {
          return;
        }
        var sExcludedSwitchOrOption = fsGetExcludedSwitchOrOption(oSettings.dxOptions[sName]);
        if (sExcludedSwitchOrOption) {
          return fShowError("Switch \"--" + sName + "\" cannot be used with \"--" + sExcludedSwitchOrOption + "\"");
        }
        dxOptions[sOptionName] = xOptionValue;
      } else {
        return fShowError("Unknown options \"-" + (sName.length > 1 ? "-" : "") + sName + "\"");
      }
    } else if (uParameterIndex < asParameterNames.length) {
      var sParameterName = asParameterNames[uParameterIndex],
          sParameterTypeDescription = asParameterTypeDescriptions[uParameterIndex],
          auParameterRepeats = aauParameterRepeats[uParameterIndex];
      if (auParameterRepeats) {
        var sValueName = "parameter " + sParameterName + ", value #" + ++uParameterRepeat;
        if (uParameterRepeat == auParameterRepeats[1]) {
          uParameterIndex++;
          uParameterRepeat = 0;
        }
        var xValue = fxParseValueUsingTypeDescription(
            sValueName, sArgument, sParameterTypeDescription, dfxTypeConverters);
        if (dxParameters[sParameterName] === undefined) {
          dxParameters[sParameterName] = [xValue];
        } else {
          dxParameters[sParameterName].push(xValue);
        }
      } else {
        var sValueName = "parameter " + sParameterName;
        xValue = fxParseValueUsingTypeDescription(
            sValueName, sArgument, sParameterTypeDescription, dfxTypeConverters);
        dxParameters[sParameterName] = xValue;
        uParameterIndex++;
        uParameterRepeat = 0;
      }
    } else {
      return fShowError("superfluous argument " + sArgument);
    }
    return true;
  })) {
    return;
  };
  while (uParameterIndex < asParameterNames.length) {
    if (!aauParameterRepeats[uParameterIndex]) {
      return fShowError("Missing parameter " + asParameterNames[uParameterIndex]);
    } else if (uParameterRepeat < aauParameterRepeats[uParameterIndex][0]) {
      return fShowError("Missing parameter " + asParameterNames[uParameterIndex] + ", value #" + (uParameterRepeat + 1));
    }
    uParameterIndex++;
    uParameterRepeat = 0;
  }
  return {
    "dxParameters": dxParameters,
    "dbSwitches": dbSwitches,
    "dxOptions": dxOptions,
  }
}
