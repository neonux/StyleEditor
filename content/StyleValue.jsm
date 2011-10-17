/* vim:set ts=2 sw=2 sts=2 et: */
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Style Editor code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Cedric Vivier <cedricv@neonux.com> (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

const EXPORTED_SYMBOLS = ["StyleValue"];

Components.utils.import("chrome://StyleEditor/content/StyleEditorUtil.jsm");

const CONVERSION_TABLE = {
  "length": {  // canonical unit is 'in'
    "in": 1,
    "px": 96,
    "pt": 72,
    "pc": 6,
    "cm": 2.54,
    "mm": 254
  },
  "time": {    // canonical unit is 'ms'
    "ms": 1,
    "s": 0.001
  },
  "angle": {   // canonical unit is 'turn'
    "turn": 1,
    "deg": 360,
    "grad": 400
  },
  "number": {
  }
};
const COLOR_TABLE = {
  "transparent": [0, 0, 0, 0.0],
  "black": [0, 0, 0, 1.0],
  "silver": [192, 192, 192, 1.0],
  "gray": [128, 128, 128, 1.0],
  "white": [255, 255, 255, 1.0],
  "maroon": [128, 0, 0, 1.0],
  "red": [255, 0, 0, 1.0],
  "purple": [128, 0, 128, 1.0],
  "fuchsia": [255, 0, 255, 1.0],
  "green": [0, 128, 0, 1.0],
  "lime": [0, 255, 0, 1.0],
  "olive": [128, 128, 0, 1.0],
  "yellow": [255, 255, 0, 1.0],
  "navy": [0, 0, 128, 1.0],
  "blue": [0, 0, 255, 1.0],
  "teal": [0, 128, 128, 1.0],
  "aqua": [0, 255, 255, 1.0],
  "orange": [255, 165, 0, 1.0],
  "aliceblue": [240, 248, 245, 1.0],
  "antiquewhite": [250, 235, 215, 1.0],
  "aquamarine": [127, 255, 212, 1.0],
  "azure": [240, 255, 255, 1.0],
  "beige": [245, 245, 220, 1.0],
  "bisque": [255, 228, 196, 1.0],
  "blanchedalmond": [255, 235, 205, 1.0],
  "blueviolet": [138, 43, 226, 1.0],
  "brown": [165, 42, 42, 1.0],
  "burlywood": [222, 184, 35, 1.0],
  "cadetblue": [ 95, 158, 160, 1.0],
  "chartreuse": [127, 255, 0, 1.0],
  "chocolate": [210, 105, 30, 1.0],
  "coral": [255, 127, 80, 1.0],
  "cornflowerblue": [100, 149, 237, 1.0],
  "cornsilk": [255, 248, 220, 1.0],
  "crimson": [220, 20, 60, 1.0],
  "darkblue": [0, 0, 139, 1.0],
  "darkcyan": [0, 139, 139, 1.0],
  "darkgoldenrod": [184, 134, 11, 1.0],
  "darkgray": [169, 169, 169, 1.0],
  "darkgreen": [0, 100, 0, 1.0],
  "darkgrey": [169, 169, 169, 1.0],
  "darkkhaki": [189, 183, 107, 1.0],
  "darkmagenta": [139, 0, 139, 1.0],
  "darkolivegreen": [ 85, 107, 47, 1.0],
  "darkorange": [255, 140, 0, 1.0],
  "darkorchid": [153, 50, 204, 1.0],
  "darkred": [139, 0, 0, 1.0],
  "darksalmon": [233, 150, 122, 1.0],
  "darkseagreen": [143, 188, 143, 1.0],
  "darkslateblue": [ 72, 61, 139, 1.0],
  "darkslategray": [ 47, 79, 79, 1.0],
  "darkslategrey": [ 47, 79, 79, 1.0],
  "darkturquoise": [0, 206, 209, 1.0],
  "darkviolet": [148, 0, 211, 1.0],
  "deeppink": [255, 20, 147, 1.0],
  "deepskyblue": [0, 191, 255, 1.0],
  "dimgray": [105, 105, 105, 1.0],
  "dimgrey": [105, 105, 105, 1.0],
  "dodgerblue": [ 30, 144, 255, 1.0],
  "firebrick": [178, 34, 34, 1.0],
  "floralwhite": [255, 250, 240, 1.0],
  "forestgreen": [ 34, 139, 34, 1.0],
  "gainsboro": [220, 220, 220, 1.0],
  "ghostwhite": [248, 248, 255, 1.0],
  "gold": [255, 215, 0, 1.0],
  "goldenrod": [218, 165, 32, 1.0],
  "greenyellow": [173, 255, 47, 1.0],
  "grey": [128, 128, 128, 1.0],
  "honeydew": [240, 255, 240, 1.0],
  "hotpink": [255, 105, 180, 1.0],
  "indianred": [205, 92, 92, 1.0],
  "indigo": [ 75, 0, 130, 1.0],
  "ivory": [255, 255, 240, 1.0],
  "khaki": [240, 230, 140, 1.0],
  "lavender": [230, 230, 250, 1.0],
  "lavenderblush": [255, 240, 245, 1.0],
  "lawngreen": [124, 252, 0, 1.0],
  "lemonchiffon": [255, 250, 205, 1.0],
  "lightblue": [173, 216, 230, 1.0],
  "lightcoral": [240, 128, 128, 1.0],
  "lightcyan": [224, 255, 255, 1.0],
  "lightgoldenrodyellow": [250, 250, 210, 1.0],
  "lightgray": [211, 211, 211, 1.0],
  "lightgreen": [144, 238, 144, 1.0],
  "lightgrey": [211, 211, 211, 1.0],
  "lightpink": [255, 182, 193, 1.0],
  "lightsalmon": [255, 160, 122, 1.0],
  "lightseagreen": [ 32, 178, 170, 1.0],
  "lightskyblue": [135, 206, 250, 1.0],
  "lightslategray": [119, 136, 153, 1.0],
  "lightslategrey": [119, 136, 153, 1.0],
  "lightsteelblue": [176, 196, 222, 1.0],
  "lightyellow": [255, 255, 224, 1.0],
  "limegreen": [ 50, 205, 50, 1.0],
  "linen": [250, 240, 230, 1.0],
  "mediumaquamarine": [102, 205, 170, 1.0],
  "mediumblue": [0, 0, 205, 1.0],
  "mediumorchid": [186, 85, 211, 1.0],
  "mediumpurple": [147, 112, 219, 1.0],
  "mediumseagreen": [ 60, 179, 113, 1.0],
  "mediumslateblue": [123, 104, 238, 1.0],
  "mediumspringgreen": [0, 250, 154, 1.0],
  "mediumturquoise": [ 72, 209, 204, 1.0],
  "mediumvioletred": [199, 21, 133, 1.0],
  "midnightblue": [ 25, 25, 112, 1.0],
  "mintcream": [245, 255, 250, 1.0],
  "mistyrose": [255, 228, 225, 1.0],
  "moccasin": [255, 228, 181, 1.0],
  "navajowhite": [255, 222, 173, 1.0],
  "oldlace": [253, 245, 230, 1.0],
  "olivedrab": [107, 142, 35, 1.0]
};
const ENUMERATION_TABLE = {
  "border-style": ["dashed", "dotted", "double", "groove", "inset", "outset",
                   "ridge", "solid"],
  "align": ["left", "center", "right", "justify", "both", "top", "bottom"],
  "vertical-align": ["baseline", "sub", "super", "text-top", "text-bottom",
                     "middle", "top", "bottom"],
  "visibility": ["visible", "hidden", "collapse", "scroll", "auto"],
  "display": ["none", "block", "inline", "inline-block"],
  "position": ["absolute", "relative", "fixed", "static"],
  "repeat": ["no-repeat", "repeat", "repeat-x", "repeat-y"],
  "font-style": ["italic", "oblique"],
  "font-family": ["serif", "sans-serif", "monospace", "cursive", "fantasy"],
  "font-weight": ["bold", "bolder", "lighter"],
  "text-decoration": ["underline", "overline", "line-through"],
  "white-space": ["pre", "nowrap", "pre-wrap", "pre-line"],
  "text-transform": ["capitalize", "uppercase", "lowercase"],
  "text-overflow": ["ellipsis", "crop"]
};


/**
 * StyleValue constructor.
 * StyleValue provides methods to manipulate CSS values as defined in :
 * http://www.w3.org/TR/css3-values/
 *
 * @param string aText
 *        The string representation of the value.
 */
function StyleValue(aText)
{
  aText = aText.trim();
  this._text = aText;
  this._unit = null;
  this._type = null;
  if (!aText.length) {
    return;
  }

  if (aText[0] == "#") {
    let hex = aText.match(/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])$/) ||
              aText.match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/);
    if (hex) {
      this._type = "color";
      this._unit = aText.length == 4 ? "shorthex" : "hex";
      this._value = [hexColor(hex[1]), hexColor(hex[2]), hexColor(hex[3]), 1.0];
    }
  } else if (/^rgba?\(/.test(aText)) {
    let rgba = aText.match(/rgb\(([0-9]+),([0-9]+),([0-9]+)\)$/) ||
               aText.match(/rgba\(([0-9]+),([0-9]+),([0-9]+),([0-9.]+)\)$/);
    if (rgba) {
      this._type = "color";
      this._unit = rgba.length == 5 ? "rgba" : "rgb";
      this._value = [clampColor(rgba[1]),
                     clampColor(rgba[2]),
                     clampColor(rgba[3]),
                     parseFloat(rgba[4]) || 1.0];
    }
  } else {
    let parts = aText.split(/^(-?[0-9.]+)/);
    this._textValue = parseFloat(parts[1]);
    this._value = this._textValue;
    if (parts.length > 1 && this._value !== NaN) {
      // get type from unit and convert to canonical unit for given type
      this._unit = parts[2];
      for (let type in CONVERSION_TABLE) {
        let unitConversionTable = CONVERSION_TABLE[type];
        if (this._unit in unitConversionTable) {
          this._type = type;
          this._value /= unitConversionTable[this._unit];
          break;
        }
      }
      if (!this._type) {
        // unit is unknown therefore fallback type to plain number
        this._type = "number";
        CONVERSION_TABLE["number"][this._unit] = 1; // identity
      }
    } else if (aText in COLOR_TABLE) {
        this._value = COLOR_TABLE[aText];
        this._type = "color";
        this._unit = "name";
    } else {
      for (let value in ENUMERATION_TABLE) {
        if (ENUMERATION_TABLE[value].indexOf(aText) >= 0) {
          this._type = "enumeration";
          this._unit = aText;
          this._value = value;
          this._textValue = "";
          break;
        }
      }
    }
  }
}

StyleValue.prototype = {
  /**
   * Retrieve the type of this value or null if the value is invalid.
   * Note that 'number' aggregates CSS3's <integer>, <number> and <percentage>.
   *
   * @return string
   *         One of: angle, color, enumeration, length, number, time
   */
  get type() this._type,

  /**
   * Retrieve the current unit of the value.
   *
   * @return string
   */
  get unit() this._unit,

  /**
   * Set the current unit of the value.
   *
   * @param string aUnit
   * @see type
   */
  set unit(aUnit)
  {
    this._unit = aUnit;
    if (this._type != "color") {
      this._textValue = this._value * CONVERSION_TABLE[this._type][this._unit];
    }
  },

  /**
   * Retrieve the text representation of the value in the current unit.
   *
   * @return string
   * @see unit
   */
  get text()
  {
    if (!this._type) {
      return "";
    }
    if (this._type == "color") {
      switch (this._unit) {
      case "rgba":
        return ["rgba(",
                this._value[0], ",",
                this._value[1], ",",
                this._value[2], ",",
                this._value[3].toFixed(1), ")"].join("");
      case "rgb":
        return ["rgb(",
                this._value[0], ",",
                this._value[1], ",",
                this._value[2], ")"].join("");
      case "hex":
        return ["#",
                hex(this._value[0]),
                hex(this._value[1]),
                hex(this._value[2])].join("");
      case "shorthex":
        return ["#",
                Math.floor(this._value[0] / 16).toString(16),
                Math.floor(this._value[1] / 16).toString(16),
                Math.floor(this._value[2] / 16).toString(16)].join("");
      }
    }
    return [this._textValue, this._unit].join("");
  },

  /**
   * Increment value by given delta (can be negative).
   * For color type, this lightens or darkens.
   *
   * @param number aDelta
   * @return boolean
   *         True if the value has been modified, false otherwise (eg. invalid)
   */
  incrementBy: function SV_incrementBy(aDelta)
  {
    if (!this._type || this._type == "enumeration") {
      return false;
    }

    if (this._type == "color") {
      switch (this._unit) {
      case "name":
        this._unit = "rgb";
        break;
      case "shorthex":
        aDelta *= 16;
        break;
      }
      for (let i = 0; i < 3; ++i) {
        this._value[i] = clampColor(Math.floor(this._value[i] + aDelta));
      }
      return true;
    }

    this._textValue = roundDecimal(this._textValue + aDelta);
    this._value = this._textValue / CONVERSION_TABLE[this._type][this._unit];
    this._value = roundDecimal(this._value);
    return true;
  },

  /**
   * Multiply value by given ratio (can be fractional).
   * For color type, this lightens or darkens.
   *
   * @param number aRatio
   * @return boolean
   *         True if the value has been modified, false otherwise (eg. invalid)
   */
  multiplyBy: function SV_multiplyBy(aRatio)
  {
    if (!this._type || this._type == "enumeration") {
      return false;
    }

    if (this._type == "color") {
      if (this._unit == "name") {
        this._unit = "rgb";
      }
      for (let i = 0; i < 3; ++i) {
        this._value[i] = clampColor(Math.floor(this._value[i] * aRatio));
      }
      return true;
    }

    this._textValue = roundDecimal(this._textValue * aRatio);
    this._value = this._textValue / CONVERSION_TABLE[this._type][this._unit];
    this._value = roundDecimal(this._value);
    return true;
  },

  /**
   * Cycle value through supported units or enumeration.
   *
   * @param number aDirection
   *        Cycle forward if positive, backwards otherwise.
   * @return boolean
   *         True if the value has been modified, false otherwise (eg. invalid)
   */
  cycle: function SV_cycle(aDirection)
  {
    if (!this._type || this._type == "number") {
      return false;
    }

    let supported;
    let needsConversion = false;
    if (this._type == "color") {
      supported = ["rgb", "rgba", "hex", "shorthex"];
    } else if (this._type == "enumeration") {
      supported = ENUMERATION_TABLE[this._value];
    } else {
      supported = Object.keys(CONVERSION_TABLE[this._type]);
      needsConversion = true;
    }

    // cycle between supported values
    let index = supported.indexOf(this._unit) + aDirection;
    if (index < 0) {
      index = supported.length - 1;
    } else if (index >= supported.length) {
      index = 0;
    }
    this._unit = supported[index];
    if (needsConversion) {
      this._textValue =
        roundDecimal(this._value * CONVERSION_TABLE[this._type][this._unit]);
    }
    return true;
  }
};

/* helper functions */

function hex(aNumber)
{
  let result = aNumber.toString(16);
  return (result.length == 1) ? "0" + result : result;
}

function hexColor(aHex)
{
  aHex = (aHex.length > 1) ? aHex : new Array(3).join(aHex);
  return ("0x" + aHex) & 0xff;
}

function roundDecimal(aNumber)
{
  aNumber = aNumber.toFixed(2);
  return parseFloat(aNumber.replace(/\.0+$/, ""));
}

function clampColor(aColor)
{
  return Math.max(0, Math.min(aColor, 255));
}
