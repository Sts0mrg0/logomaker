!function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = "function" == typeof require && require;
        if (!u && a) return a(o, !0);
        if (i) return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f
      }
      var l = n[o] = {
        exports: {}
      };
      t[o][0].call(l.exports, function(e) {
        var n = t[o][1][e];
        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }
    return n[o].exports
  }
  for (var i = "function" == typeof require && require, o = 0; o < r.length; o++) s(r[o]);
  return s
}({
  1: [function(require, module, exports) {
    "use strict";
    var _pages = require("./pages");
    require("./studio"), require("./imagelib");
    window.pages = _pages.pages
  }, {
    "./imagelib": 5,
    "./pages": 12,
    "./studio": 32
  }],
  2: [function(require, module, exports) {
    "use strict";

    function runWorkerJs_(js, params, callback) {
      var URL = window.URL || window.webkitURL || window.mozURL,
        Worker = window.Worker;
      if (URL && Worker && hasBlobConstructor_()) {
        var bb = new Blob([js], {
            type: "text/javascript"
          }),
          worker = new Worker(URL.createObjectURL(bb));
        return worker.onmessage = function(event) {
          callback(event.data)
        }, worker.postMessage(params), worker
      }
      return function() {
        var __DUMMY_OBJECT__ = {},
          postMessage = function(result) {
            callback(result)
          };
        eval("var self=__DUMMY_OBJECT__;\n" + js), __DUMMY_OBJECT__.onmessage({
          data: params
        })
      }(), {
        terminate: function() {}
      }
    }

    function hasBlobConstructor_() {
      try {
        return !!new Blob
      } catch (e) {
        return !1
      }
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.Analysis = void 0;
    var _Drawing = require("./Drawing"),
      _Promise = "undefined" == typeof Promise ? require("es6-promise").Promise : Promise,
      Analysis = exports.Analysis = {};
    Analysis.TRIM_RECT_WORKER_JS = "\n    self.onmessage = function(event) {\n      var l = event.data.size.w, t = event.data.size.h, r = 0, b = 0;\n\n      var alpha;\n      for (var y = 0; y < event.data.size.h; y++) {\n        for (var x = 0; x < event.data.size.w; x++) {\n          alpha = event.data.imageData.data[\n              ((y * event.data.size.w + x) << 2) + 3];\n          if (alpha >= event.data.minAlpha) {\n            l = Math.min(x, l);\n            t = Math.min(y, t);\n            r = Math.max(x, r);\n            b = Math.max(y, b);\n          }\n        }\n      }\n\n      if (l > r) {\n        // no pixels, couldn't trim\n        postMessage({ x: 0, y: 0, w: event.data.size.w, h: event.data.size.h });\n        return;\n      }\n\n      postMessage({ x: l, y: t, w: r - l + 1, h: b - t + 1 });\n    };", Analysis.MAX_TRIM_SRC_SIZE = 500, Analysis.getTrimRect = function(ctx, size, minAlpha) {
      if (!ctx.canvas) {
        var src = ctx;
        ctx = _Drawing.Drawing.context(size), ctx.drawImage(src, 0, 0)
      }
      var scale = 1;
      if (size.w > Analysis.MAX_TRIM_SRC_SIZE || size.h > Analysis.MAX_TRIM_SRC_SIZE) {
        scale = size.w > Analysis.MAX_TRIM_SRC_SIZE ? Analysis.MAX_TRIM_SRC_SIZE / size.w : Analysis.MAX_TRIM_SRC_SIZE / size.h;
        var scaledSize = {
            w: size.w * scale,
            h: size.h * scale
          },
          tmpCtx = _Drawing.Drawing.context(scaledSize);
        tmpCtx.drawImage(ctx.canvas, 0, 0, size.w, size.h, 0, 0, scaledSize.w, scaledSize.h), ctx = tmpCtx, size = scaledSize
      }
      var worker = void 0,
        promise = new _Promise(function(resolve, reject) {
          0 == minAlpha && resolve({
            x: 0,
            y: 0,
            w: size.w,
            h: size.h
          }), minAlpha = minAlpha || 1, worker = runWorkerJs_(Analysis.TRIM_RECT_WORKER_JS, {
            imageData: ctx.getImageData(0, 0, size.w, size.h),
            size: size,
            minAlpha: minAlpha
          }, function(resultingRect) {
            resultingRect.x /= scale, resultingRect.y /= scale, resultingRect.w /= scale, resultingRect.h /= scale, resolve(resultingRect), worker = null
          })
        });
      return Object.defineProperty(promise, "worker", {
        get: function() {
          return worker
        }
      }), promise
    }, Analysis.getCenterOfMass = function(ctx, size, minAlpha) {
      return new _Promise(function(resolve, reject) {
        if (!ctx.canvas) {
          var src = ctx;
          ctx = _Drawing.Drawing.context(size), ctx.drawImage(src, 0, 0)
        }
        0 == minAlpha && resolve({
          x: size.w / 2,
          y: size.h / 2
        }), minAlpha = minAlpha || 1;
        for (var alpha, imageData = (size.w, size.h, ctx.getImageData(0, 0, size.w, size.h)), sumX = 0, sumY = 0, n = 0, y = 0; y < size.h; y++)
          for (var x = 0; x < size.w; x++) alpha = imageData.data[(y * size.w + x << 2) + 3], alpha >= minAlpha && (sumX += x, sumY += y, ++n);
        n <= 0 && resolve({
          x: size.w / 2,
          h: size.h / 2
        }), resolve({
          x: Math.round(sumX / n),
          y: Math.round(sumY / n)
        })
      })
    }
  }, {
    "./Drawing": 3,
    "es6-promise": 33
  }],
  3: [function(require, module, exports) {
    "use strict";

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      }
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.Drawing = void 0;
    var _tinycolor = require("tinycolor2"),
      _Effects = (_interopRequireDefault(_tinycolor), require("./Effects")),
      Drawing = exports.Drawing = {};
    Drawing.context = function(size) {
      var canvas = document.createElement("canvas");
      return canvas.width = size.w, canvas.height = size.h, canvas.style.setProperty("image-rendering", "optimizeQuality", null), canvas.getContext("2d")
    }, Drawing.drawCenterInside = function(dstCtx, src, dstRect, srcRect) {
      if (srcRect.w / srcRect.h > dstRect.w / dstRect.h) {
        var h = srcRect.h * dstRect.w / srcRect.w;
        Drawing.drawImageScaled(dstCtx, src, srcRect.x, srcRect.y, srcRect.w, srcRect.h, dstRect.x, dstRect.y + (dstRect.h - h) / 2, dstRect.w, h)
      } else {
        var w = srcRect.w * dstRect.h / srcRect.h;
        Drawing.drawImageScaled(dstCtx, src, srcRect.x, srcRect.y, srcRect.w, srcRect.h, dstRect.x + (dstRect.w - w) / 2, dstRect.y, w, dstRect.h)
      }
    }, Drawing.drawCenterCrop = function(dstCtx, src, dstRect, srcRect) {
      if (srcRect.w / srcRect.h > dstRect.w / dstRect.h) {
        var w = srcRect.h * dstRect.w / dstRect.h;
        Drawing.drawImageScaled(dstCtx, src, srcRect.x + (srcRect.w - w) / 2, srcRect.y, w, srcRect.h, dstRect.x, dstRect.y, dstRect.w, dstRect.h)
      } else {
        var h = srcRect.w * dstRect.h / dstRect.w;
        Drawing.drawImageScaled(dstCtx, src, srcRect.x, srcRect.y + (srcRect.h - h) / 2, srcRect.w, h, dstRect.x, dstRect.y, dstRect.w, dstRect.h)
      }
    }, Drawing.drawImageScaled = function(dstCtx, src, sx, sy, sw, sh, dx, dy, dw, dh) {
      if (dw <= 0 || dh <= 0 || sw <= 0 || sh <= 0) return void console.error("Width/height must be at least 0");
      for (src = src.canvas || src; dw < sw / 2 || dh < sh / 2;) {
        var tmpDw = Math.ceil(Math.max(dw, sw / 2)),
          tmpDh = Math.ceil(Math.max(dh, sh / 2)),
          tmpCtx = Drawing.context({
            w: tmpDw,
            h: tmpDh
          });
        tmpCtx.clearRect(0, 0, tmpDw, tmpDh), tmpCtx.drawImage(src, sx, sy, sw, sh, 0, 0, tmpDw, tmpDh), src = tmpCtx.canvas, sx = sy = 0, sw = tmpDw, sh = tmpDh
      }
      dstCtx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh)
    }, Drawing.drawLayers = function(dstCtx, size, layerTree) {
      function drawLayer_(dstCtx, layer) {
        var layerCtx = Drawing.context(size);
        if (layer.children ? drawGroup_(layerCtx, layer) : layer.draw && layer.draw(layerCtx), layer.effects) {
          var effectsCtx = Drawing.context(size);
          _Effects.Effects.fx(layer.effects, effectsCtx, layerCtx, size), layerCtx = effectsCtx
        }
        dstCtx.drawImage(layerCtx.canvas, 0, 0)
      }

      function drawGroup_(dstCtx, group) {
        var dstCtxStack = [dstCtx];
        for (group.children.filter(function(layer) {
            return !!layer
          }).forEach(function(layer) {
            if (drawLayer_(dstCtxStack[dstCtxStack.length - 1], layer), layer.mask) {
              var maskedContentCtx = Drawing.context(size);
              dstCtxStack.push(maskedContentCtx)
            }
          }); dstCtxStack.length > 1;) {
          var targetCtx = dstCtxStack[dstCtxStack.length - 2],
            contentCtx = dstCtxStack[dstCtxStack.length - 1];
          targetCtx.save(), targetCtx.globalCompositeOperation = "source-atop", targetCtx.drawImage(contentCtx.canvas, 0, 0), targetCtx.restore(), dstCtxStack.pop()
        }
      }
      drawLayer_(dstCtx, layerTree)
    }
  }, {
    "./Effects": 4,
    tinycolor2: 35
  }],
  4: [function(require, module, exports) {
    "use strict";

    function renderCastShadow_(ctx, w, h) {
      for (var tmpCtx = _Drawing.Drawing.context({
          w: w,
          h: h
        }), o = 1; o < Math.max(w, h); o++) tmpCtx.drawImage(ctx.canvas, o, o);
      tmpCtx.globalCompositeOperation = "source-in", tmpCtx.fillStyle = "#000", tmpCtx.fillRect(0, 0, w, h);
      var gradient = tmpCtx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "rgba(0, 0, 0, .2)"), gradient.addColorStop(1, "rgba(0, 0, 0, 0)"), tmpCtx.fillStyle = gradient, tmpCtx.fillRect(0, 0, w, h), ctx.clearRect(0, 0, w, h), ctx.drawImage(tmpCtx.canvas, 0, 0)
    }

    function supportsCanvasFilters_() {
      return supportsCanvasFilters_.hasOwnProperty("cached") || (supportsCanvasFilters_.cached = "none" == document.createElement("canvas").getContext("2d").filter), supportsCanvasFilters_.cached
    }

    function canvasShadowBlurForRadius_(radius) {
      return radius * BLUR_MULTIPLIER
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.Effects = void 0;
    var _Drawing = require("./Drawing"),
      OUTER_EFFECTS = new Set(["outer-shadow", "cast-shadow"]),
      INNER_EFFECTS = new Set(["inner-shadow", "score"]),
      FILL_EFFECTS = new Set(["fill-color", "fill-lineargradient", "fill-radialgradient"]),
      BLUR_MULTIPLIER = (exports.Effects = {
        fx: function(effects, dstCtx, src, size) {
          effects = effects || [];
          var outerEffects = effects.filter(function(e) {
              return OUTER_EFFECTS.has(e.effect)
            }),
            innerEffects = effects.filter(function(e) {
              return INNER_EFFECTS.has(e.effect)
            }),
            fillEffects = effects.filter(function(e) {
              return FILL_EFFECTS.has(e.effect)
            }),
            tmpCtx = void 0,
            bufferCtx = void 0,
            padLeft = void 0,
            padRight = void 0,
            padBottom = void 0,
            padTop = void 0;
          padLeft = padRight = padBottom = padTop = outerEffects.reduce(function(r, e) {
            return Math.max(r, e.blur || 0)
          }, 0);
          var paddedSize = {
            w: size.w + padLeft + padRight,
            h: size.h + padTop + padBottom
          };
          tmpCtx = _Drawing.Drawing.context(paddedSize), outerEffects.forEach(function(effect) {
            switch (effect.effect) {
              case "cast-shadow":
                tmpCtx.clearRect(0, 0, paddedSize.w, paddedSize.h), tmpCtx.drawImage(src.canvas || src, padLeft, padTop), renderCastShadow_(tmpCtx, paddedSize.w, paddedSize.h), dstCtx.drawImage(tmpCtx.canvas, padLeft, padTop, size.w, size.h, 0, 0, size.w, size.h);
                break;
              case "outer-shadow":
                var tColor = tinycolor(effect.color || "#000"),
                  alpha = tColor.getAlpha();
                tColor.setAlpha(1), supportsCanvasFilters_() ? (tmpCtx.save(), tmpCtx.clearRect(0, 0, paddedSize.w, paddedSize.h), tmpCtx.filter = "blur(" + (effect.blur || 0) + "px)", tmpCtx.drawImage(src.canvas || src, padLeft, padTop), tmpCtx.globalCompositeOperation = "source-atop", tmpCtx.fillStyle = tColor.toRgbString(), tmpCtx.fillRect(0, 0, paddedSize.w, paddedSize.h), tmpCtx.restore(), dstCtx.save(), dstCtx.translate(effect.translateX || 0, effect.translateY || 0), dstCtx.globalAlpha = alpha, dstCtx.drawImage(tmpCtx.canvas, padLeft, padTop, size.w, size.h, 0, 0, size.w, size.h), dstCtx.restore()) : (dstCtx.save(), dstCtx.globalAlpha = alpha, dstCtx.shadowOffsetX = paddedSize.w, dstCtx.shadowOffsetY = 0, dstCtx.shadowColor = tColor.toRgbString(), dstCtx.shadowBlur = canvasShadowBlurForRadius_(effect.blur || 0), dstCtx.drawImage(src.canvas || src, (effect.translateX || 0) - paddedSize.w, effect.translateY || 0), dstCtx.restore())
            }
          }), bufferCtx = _Drawing.Drawing.context(size), tmpCtx = _Drawing.Drawing.context(size), tmpCtx.drawImage(src.canvas || src, 0, 0), tmpCtx.globalCompositeOperation = "source-atop";
          var fillOpacity = 1;
          if (fillEffects.length) {
            var effect = fillEffects[0];
            switch (fillOpacity = "opacity" in effect ? effect.opacity : 1, tmpCtx.save(), effect.effect) {
              case "fill-color":
                tmpCtx.fillStyle = effect.color;
                break;
              case "fill-lineargradient":
                var _ret = function() {
                  var gradient = tmpCtx.createLinearGradient(effect.fromX, effect.fromY, effect.toX, effect.toY);
                  return effect.colors.forEach(function(_ref) {
                    var offset = _ref.offset,
                      color = _ref.color;
                    return gradient.addColorStop(offset, color)
                  }), tmpCtx.fillStyle = gradient, "break"
                }();
                if ("break" === _ret) break;
              case "fill-radialgradient":
                var _ret2 = function() {
                  var gradient = tmpCtx.createRadialGradient(effect.centerX, effect.centerY, 0, effect.centerX, effect.centerY, effect.radius);
                  return effect.colors.forEach(function(_ref2) {
                    var offset = _ref2.offset,
                      color = _ref2.color;
                    return gradient.addColorStop(offset, color)
                  }), tmpCtx.fillStyle = gradient, "break"
                }();
                if ("break" === _ret2) break
            }
            tmpCtx.fillRect(0, 0, size.w, size.h), tmpCtx.restore()
          }
          bufferCtx.save(), bufferCtx.globalAlpha = fillOpacity, bufferCtx.drawImage(tmpCtx.canvas, 0, 0), bufferCtx.restore(), padLeft = padTop = padRight = padBottom = 0, innerEffects.forEach(function(effect) {
            padLeft = Math.max(padLeft, (effect.blur || 0) + Math.max(0, effect.translateX || 0)), padTop = Math.max(padTop, (effect.blur || 0) + Math.max(0, effect.translateY || 0)), padRight = Math.max(padRight, (effect.blur || 0) + Math.max(0, -(effect.translateX || 0))), padBottom = Math.max(padBottom, (effect.blur || 0) + Math.max(0, -(effect.translateY || 0)))
          }), paddedSize = {
            w: size.w + padLeft + padRight,
            h: size.h + padTop + padBottom
          }, tmpCtx = _Drawing.Drawing.context(paddedSize), innerEffects.forEach(function(effect) {
            switch (effect.effect) {
              case "inner-shadow":
                tmpCtx.save(), tmpCtx.clearRect(0, 0, paddedSize.w, paddedSize.h), supportsCanvasFilters_() ? (tmpCtx.filter = "blur(" + (effect.blur || 0) + "px)", tmpCtx.drawImage(bufferCtx.canvas, padLeft + (effect.translateX || 0), padTop + (effect.translateY || 0))) : (tmpCtx.shadowOffsetX = paddedSize.w, tmpCtx.shadowOffsetY = 0, tmpCtx.shadowColor = "#000", tmpCtx.shadowBlur = canvasShadowBlurForRadius_(effect.blur || 0), tmpCtx.drawImage(bufferCtx.canvas, padLeft + (effect.translateX || 0) - paddedSize.w, padTop + (effect.translateY || 0))), tmpCtx.globalCompositeOperation = "source-out", tmpCtx.fillStyle = effect.color, tmpCtx.fillRect(0, 0, paddedSize.w, paddedSize.h), tmpCtx.restore(), bufferCtx.save(), bufferCtx.globalCompositeOperation = "source-atop", bufferCtx.drawImage(tmpCtx.canvas, -padLeft, -padTop), bufferCtx.restore()
            }
          }), dstCtx.drawImage(bufferCtx.canvas, 0, 0)
        }
      }, [{
        re: /chrome/i,
        mult: 2.7
      }, {
        re: /safari/i,
        mult: 1.8
      }, {
        re: /firefox/i,
        mult: 1.7
      }, {
        re: /./i,
        mult: 1.7
      }].find(function(x) {
        return x.re.test(navigator.userAgent)
      }).mult)
  }, {
    "./Drawing": 3
  }],
  5: [function(require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.imagelib = void 0;
    var _Effects = require("./Effects"),
      _Drawing = require("./Drawing"),
      _Analysis = require("./Analysis");
    exports.imagelib = {
      Drawing: _Drawing.Drawing,
      Effects: _Effects.Effects,
      Analysis: _Analysis.Analysis
    }
  }, {
    "./Analysis": 2,
    "./Drawing": 3,
    "./Effects": 4
  }],
  6: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.ActionBarIconGenerator = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _studio = require("../studio"),
      _imagelib = require("../imagelib"),
      _BaseGenerator2 = require("./BaseGenerator"),
      ICON_SIZE = {
        w: 24,
        h: 24
      },
      TARGET_RECT = {
        x: 0,
        y: 0,
        w: 24,
        h: 24
      },
      GRID_OVERLAY_SVG = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\n        <g fill="none" fill-rule="evenodd">\n            <rect vector-effect="non-scaling-stroke" x="4" y="2" width="16" height="20" rx="2"/>\n            <rect vector-effect="non-scaling-stroke" x="3" y="3" width="18" height="18" rx="2"/>\n            <rect vector-effect="non-scaling-stroke" x="2" y="4" width="20" height="16" rx="2"/>\n            <circle vector-effect="non-scaling-stroke" cx="12" cy="12" r="5"/>\n            <circle vector-effect="non-scaling-stroke" cx="12" cy="12" r="10"/>\n            <path vector-effect="non-scaling-stroke" d="M0 24L24 0M0 0l24 24m-12 0V0M8 0v24m8-24v24m8-12H0m0 4h24M0 8h24"/>\n        </g>\n    </svg>';
    exports.ActionBarIconGenerator = function(_BaseGenerator) {
      function ActionBarIconGenerator() {
        return _classCallCheck(this, ActionBarIconGenerator), _possibleConstructorReturn(this, (ActionBarIconGenerator.__proto__ || Object.getPrototypeOf(ActionBarIconGenerator)).apply(this, arguments))
      }
      return _inherits(ActionBarIconGenerator, _BaseGenerator), _createClass(ActionBarIconGenerator, [{
        key: "setupForm",
        value: function() {
          var _this2 = this;
          _get(ActionBarIconGenerator.prototype.__proto__ || Object.getPrototypeOf(ActionBarIconGenerator.prototype), "setupForm", this).call(this);
          var defaultNameForSourceValue_ = function(v) {
              var name = _studio.studio.Util.sanitizeResourceName(v.name || "example");
              return "ic_action_" + name
            },
            nameField = void 0,
            customColorField = void 0;
          this.form = new _studio.studio.Form({
            id: "iconform",
            container: "#inputs-form",
            fields: [new _studio.studio.ImageField("source", {
              title: "Source",
              helpText: "Must be transparent",
              maxFinalSize: {
                w: 128,
                h: 128
              },
              clipartNoTrimPadding: !0,
              defaultValueClipart: "add_circle",
              dropTarget: document.body,
              onChange: function(newValue, oldValue) {
                nameField.getValue() == defaultNameForSourceValue_(oldValue) && nameField.setValue(defaultNameForSourceValue_(newValue))
              }
            }), nameField = new _studio.studio.TextField("name", {
              newGroup: !0,
              title: "Name",
              helpText: "Used when generating ZIP files.",
              defaultValue: defaultNameForSourceValue_({})
            }), new _studio.studio.EnumField("theme", {
              title: "Theme",
              buttons: !0,
              options: [{
                id: "light",
                title: "Light"
              }, {
                id: "dark",
                title: "Dark"
              }, {
                id: "custom",
                title: "Custom"
              }],
              defaultValue: "light"
            }), customColorField = new _studio.studio.ColorField("color", {
              title: "Color",
              defaultValue: "rgba(33, 150, 243, .6)",
              alpha: !0
            })]
          }), this.form.onChange(function(field) {
            var values = _this2.form.getValues();
            $(".outputs-panel").attr("data-theme", values.theme), customColorField.setEnabled("custom" == values.theme), _this2.regenerateDebounced_()
          })
        }
      }, {
        key: "regenerate",
        value: function() {
          var _this3 = this,
            values = this.form.getValues();
          this.zipper.clear(), this.zipper.setZipFilename(values.name + ".zip"), this.densities.forEach(function(density) {
            var mult = _studio.studio.Util.getMultBaseMdpi(density),
              iconSize = _studio.studio.Util.multRound(ICON_SIZE, mult),
              outCtx = _imagelib.imagelib.Drawing.context(iconSize),
              tmpCtx = _imagelib.imagelib.Drawing.context(iconSize);
            if (values.source.ctx) {
              var srcCtx = values.source.ctx;
              _imagelib.imagelib.Drawing.drawCenterInside(tmpCtx, srcCtx, _studio.studio.Util.mult(TARGET_RECT, mult), {
                x: 0,
                y: 0,
                w: srcCtx.canvas.width,
                h: srcCtx.canvas.height
              })
            }
            var color = values.color;
            "light" == values.theme ? color = tinycolor("rgba(0, 0, 0, .54)") : "dark" == values.theme && (color = tinycolor("#fff"));
            var alpha = color.getAlpha();
            color.setAlpha(1), _imagelib.imagelib.Effects.fx([{
              effect: "fill-color",
              color: color.toRgbString(),
              opacity: alpha
            }], outCtx, tmpCtx, iconSize), color.setAlpha(alpha), _this3.zipper.add({
              name: "res/drawable-" + density + "/" + values.name + ".png",
              canvas: outCtx.canvas
            }), _this3.setImageForSlot_(density, outCtx.canvas.toDataURL())
          })
        }
      }, {
        key: "gridOverlaySvg",
        get: function() {
          return GRID_OVERLAY_SVG
        }
      }]), ActionBarIconGenerator
    }(_BaseGenerator2.BaseGenerator)
  }, {
    "../imagelib": 5,
    "../studio": 32,
    "./BaseGenerator": 8
  }],
  7: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.AppShortcutIconGenerator = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _studio = require("../studio"),
      _imagelib = require("../imagelib"),
      _BaseGenerator2 = require("./BaseGenerator"),
      ICON_SIZE = {
        w: 48,
        h: 48
      },
      TARGET_RECT = {
        x: 12,
        y: 12,
        w: 24,
        h: 24
      },
      GRID_OVERLAY_SVG = '<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">\n        <g fill="none" fill-rule="evenodd">\n            <rect vector-effect="non-scaling-stroke" x="12" y="12" width="24" height="24"/>\n        </g>\n    </svg>';
    exports.AppShortcutIconGenerator = function(_BaseGenerator) {
      function AppShortcutIconGenerator() {
        return _classCallCheck(this, AppShortcutIconGenerator), _possibleConstructorReturn(this, (AppShortcutIconGenerator.__proto__ || Object.getPrototypeOf(AppShortcutIconGenerator)).apply(this, arguments))
      }
      return _inherits(AppShortcutIconGenerator, _BaseGenerator), _createClass(AppShortcutIconGenerator, [{
        key: "setupForm",
        value: function() {
          var _this2 = this;
          _get(AppShortcutIconGenerator.prototype.__proto__ || Object.getPrototypeOf(AppShortcutIconGenerator.prototype), "setupForm", this).call(this);
          var defaultNameForSourceValue_ = function(v) {
              var name = _studio.studio.Util.sanitizeResourceName(v.name || "example");
              return "ic_shortcut_" + name
            },
            nameField = void 0;
          this.form = new _studio.studio.Form({
            id: "iconform",
            container: "#inputs-form",
            fields: [new _studio.studio.ImageField("source", {
              title: "Source",
              helpText: "Must be transparent",
              maxFinalSize: {
                w: 128,
                h: 128
              },
              clipartNoTrimPadding: !0,
              defaultValueClipart: "search",
              dropTarget: document.body,
              onChange: function(newValue, oldValue) {
                nameField.getValue() == defaultNameForSourceValue_(oldValue) && nameField.setValue(defaultNameForSourceValue_(newValue))
              }
            }), nameField = new _studio.studio.TextField("name", {
              newGroup: !0,
              title: "Name",
              helpText: "Used when generating ZIP files.",
              defaultValue: defaultNameForSourceValue_({})
            }), new _studio.studio.ColorField("foreColor", {
              title: "Color",
              defaultValue: "#448aff"
            }), new _studio.studio.ColorField("backColor", {
              title: "Background color",
              defaultValue: "#f5f5f5"
            })]
          }), this.form.onChange(function() {
            return _this2.regenerateDebounced_()
          })
        }
      }, {
        key: "regenerate",
        value: function() {
          var _this3 = this,
            values = this.form.getValues();
          this.zipper.clear(), this.zipper.setZipFilename(values.name + ".zip"), this.densities.forEach(function(density) {
            var mult = _studio.studio.Util.getMultBaseMdpi(density),
              iconSize = _studio.studio.Util.multRound(ICON_SIZE, mult),
              outCtx = _imagelib.imagelib.Drawing.context(iconSize),
              tmpCtx = _imagelib.imagelib.Drawing.context(iconSize);
            if (outCtx.save(), outCtx.beginPath(), outCtx.arc(24 * mult, 24 * mult, 22 * mult, 0, 2 * Math.PI), outCtx.closePath(), values.backColor.setAlpha(1), outCtx.fillStyle = values.backColor.toRgbString(), outCtx.fill(), outCtx.restore(), values.source.ctx) {
              var srcCtx = values.source.ctx;
              _imagelib.imagelib.Drawing.drawCenterInside(tmpCtx, srcCtx, _studio.studio.Util.mult(TARGET_RECT, mult), {
                x: 0,
                y: 0,
                w: srcCtx.canvas.width,
                h: srcCtx.canvas.height
              })
            }
            values.foreColor.setAlpha(1), _imagelib.imagelib.Effects.fx([{
              effect: "fill-color",
              color: values.foreColor.toRgbString()
            }], outCtx, tmpCtx, iconSize), _this3.zipper.add({
              name: "res/drawable-" + density + "/" + values.name + ".png",
              canvas: outCtx.canvas
            }), _this3.setImageForSlot_(density, outCtx.canvas.toDataURL())
          })
        }
      }, {
        key: "gridOverlaySvg",
        get: function() {
          return GRID_OVERLAY_SVG
        }
      }]), AppShortcutIconGenerator
    }(_BaseGenerator2.BaseGenerator)
  }, {
    "../imagelib": 5,
    "../studio": 32,
    "./BaseGenerator": 8
  }],
  8: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.BaseGenerator = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _studio = require("../studio"),
      DENSITIES = (require("../imagelib"), new Set(["xxxhdpi", "xxhdpi", "xhdpi", "hdpi", "mdpi"])),
      REGENERATE_DEBOUNCE_TIME = 200;
    exports.BaseGenerator = function() {
      function BaseGenerator() {
        var _this = this;
        _classCallCheck(this, BaseGenerator), this.regenerateDebounced_ = _studio.studio.Util.debounce(REGENERATE_DEBOUNCE_TIME, function() {
          return _this.regenerate()
        }), this.setupZipper(), this.setupOutputUi(), this.setupOutputSlots(), this.setupForm(), _studio.studio.Hash.bindFormToDocumentHash(this.form), setTimeout(function() {
          return _this.regenerate()
        }, 0)
      }
      return _createClass(BaseGenerator, [{
        key: "setupZipper",
        value: function() {
          this.zipper = _studio.studio.Zip.createDownloadifyZipButton($("#download-zip-button"))
        }
      }, {
        key: "setupOutputUi",
        value: function() {
          if (this.gridOverlaySvg) {
            var defaultChecked = !("assetStudioShowGrid" in localStorage) || "true" === localStorage.assetStudioShowGrid;
            $("#grid-toggle").prop("checked", defaultChecked), $(".outputs-panel").toggleClass("show-grid", defaultChecked), $("#grid-toggle").click(function(ev) {
              var checked = $(ev.currentTarget).is(":checked");
              localStorage.assetStudioShowGrid = String(checked), $(".outputs-panel").toggleClass("show-grid", checked)
            })
          } else $("#grid-toggle-container").hide();
          $(".outputs-additional-toggle").click(function() {
            return $(".outputs-panel").toggleClass("is-showing-all")
          })
        }
      }, {
        key: "setupOutputSlots",
        value: function() {
          var _this2 = this;
          this.densities.forEach(function(density) {
            _this2.createImageOutputSlot_({
              container: "xxxhdpi" == density ? $(".outputs-main") : $(".outputs-additional"),
              id: density,
              label: density
            })
          })
        }
      }, {
        key: "createImageOutputSlot_",
        value: function(params) {
          var $imageContainer = $("<div>").addClass("outputs-image-container").append($("<img>").addClass("outputs-image").attr("data-id", "out-icon-" + params.id));
          this.gridOverlaySvg && $("<div>").addClass("outputs-image-overlay").html(this.gridOverlaySvg).appendTo($imageContainer);
          var $block = $("<div>").addClass("outputs-image-block").append($("<div>").addClass("outputs-label").text(params.label)).append($imageContainer).appendTo(params.container);
          return $block
        }
      }, {
        key: "setImageForSlot_",
        value: function(id, url) {
          _studio.studio.Util.loadImageFromUri(url).then(function(img) {
            return $('[data-id="out-icon-' + id + '"]').attr("src", img.src)
          })
        }
      }, {
        key: "setupForm",
        value: function() {}
      }, {
        key: "regenerate",
        value: function() {}
      }, {
        key: "densities",
        get: function() {
          return DENSITIES
        }
      }]), BaseGenerator
    }()
  }, {
    "../imagelib": 5,
    "../studio": 32
  }],
  9: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.GenericIconGenerator = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _studio = require("../studio"),
      _imagelib = require("../imagelib"),
      _BaseGenerator2 = require("./BaseGenerator");
    exports.GenericIconGenerator = function(_BaseGenerator) {
      function GenericIconGenerator() {
        return _classCallCheck(this, GenericIconGenerator), _possibleConstructorReturn(this, (GenericIconGenerator.__proto__ || Object.getPrototypeOf(GenericIconGenerator)).apply(this, arguments))
      }
      return _inherits(GenericIconGenerator, _BaseGenerator), _createClass(GenericIconGenerator, [{
        key: "setupForm",
        value: function() {
          var _this2 = this;
          _get(GenericIconGenerator.prototype.__proto__ || Object.getPrototypeOf(GenericIconGenerator.prototype), "setupForm", this).call(this);
          var defaultNameForSourceValue_ = function(v) {
              var name = _studio.studio.Util.sanitizeResourceName(v.name || "example");
              return "ic_" + name
            },
            nameField = void 0;
          this.form = new _studio.studio.Form({
            id: "iconform",
            container: "#inputs-form",
            fields: [new _studio.studio.ImageField("source", {
              title: "Source",
              helpText: "Must be transparent",
              maxFinalSize: {
                w: 720,
                h: 720
              },
              defaultValueClipart: "ac_unit",
              dropTarget: document.body,
              onChange: function(newValue, oldValue) {
                nameField.getValue() == defaultNameForSourceValue_(oldValue) && nameField.setValue(defaultNameForSourceValue_(newValue))
              }
            }), new _studio.studio.RangeField("size", {
              newGroup: !0,
              title: "Asset size",
              helpText: "Size of the final asset",
              min: 4,
              max: 200,
              defaultValue: 32,
              textFn: function(d) {
                return d + "dp"
              }
            }), new _studio.studio.RangeField("padding", {
              title: "Asset padding",
              helpText: "Padding around the icon asset",
              defaultValue: 8,
              textFn: function(d) {
                return d + "dp"
              }
            }), new _studio.studio.ColorField("color", {
              title: "Color",
              helpText: "Set to transparent to retain original colors",
              defaultValue: "rgba(0, 0, 0, 0.54)",
              alpha: !0
            }), nameField = new _studio.studio.TextField("name", {
              title: "Name",
              helpText: "Used when generating ZIP files as the resource name.",
              defaultValue: defaultNameForSourceValue_({})
            })]
          }), this.form.onChange(function(field) {
            return _this2.regenerateDebounced_()
          })
        }
      }, {
        key: "regenerate",
        value: function() {
          var _this3 = this,
            values = this.form.getValues();
          this.zipper.clear(), this.zipper.setZipFilename(values.name + ".zip"), this.densities.forEach(function(density) {
            var mult = _studio.studio.Util.getMultBaseMdpi(density),
              totalSize = values.size,
              padding = Math.min(values.size / 2 - 1, values.padding),
              iconSize = _studio.studio.Util.multRound({
                w: totalSize,
                h: totalSize
              }, mult),
              targetRect = _studio.studio.Util.multRound({
                x: padding,
                y: padding,
                w: totalSize - 2 * padding,
                h: totalSize - 2 * padding
              }, mult),
              outCtx = _imagelib.imagelib.Drawing.context(iconSize),
              tmpCtx = _imagelib.imagelib.Drawing.context(iconSize);
            if (values.source.ctx) {
              var srcCtx = values.source.ctx;
              _imagelib.imagelib.Drawing.drawCenterInside(tmpCtx, srcCtx, targetRect, {
                x: 0,
                y: 0,
                w: srcCtx.canvas.width,
                h: srcCtx.canvas.height
              })
            }
            var color = values.color,
              alpha = color.getAlpha();
            alpha > 0 ? (color.setAlpha(1), _imagelib.imagelib.Effects.fx([{
              effect: "fill-color",
              color: color.toRgbString(),
              opacity: alpha
            }], outCtx, tmpCtx, iconSize), color.setAlpha(alpha)) : outCtx.drawImage(tmpCtx.canvas, 0, 0), _this3.zipper.add({
              name: "res/drawable-" + density + "/" + values.name + ".png",
              canvas: outCtx.canvas
            }), _this3.setImageForSlot_(density, outCtx.canvas.toDataURL());
          })
        }
      }]), GenericIconGenerator
    }(_BaseGenerator2.BaseGenerator)
  }, {
    "../imagelib": 5,
    "../studio": 32,
    "./BaseGenerator": 8
  }],
  10: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.LauncherIconGenerator = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _studio = require("../studio"),
      _imagelib = require("../imagelib"),
      _BaseGenerator2 = require("./BaseGenerator"),
      ICON_SIZE = {
        w: 48,
        h: 48
      },
      TARGET_RECTS_BY_SHAPE = {
        none: {
          x: 3,
          y: 3,
          w: 42,
          h: 42
        },
        circle: {
          x: 2,
          y: 2,
          w: 44,
          h: 44
        },
        square: {
          x: 5,
          y: 5,
          w: 38,
          h: 38
        },
        vrect: {
          x: 8,
          y: 2,
          w: 32,
          h: 44
        },
        hrect: {
          x: 2,
          y: 8,
          w: 44,
          h: 32
        }
      },
      GRID_OVERLAY_SVG = '<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">\n        <g fill="none" fill-rule="evenodd">\n            <rect vector-effect="non-scaling-stroke" x="8" y="2" width="32" height="44" rx="3"/>\n            <rect vector-effect="non-scaling-stroke" x="5" y="5" width="38" height="38" rx="3"/>\n            <rect vector-effect="non-scaling-stroke" x="2" y="8" width="44" height="32" rx="3"/>\n            <circle vector-effect="non-scaling-stroke" cx="24" cy="24" r="10"/>\n            <circle vector-effect="non-scaling-stroke" cx="24" cy="24" r="22"/>\n            <path vector-effect="non-scaling-stroke" d="M0 48L48 0M0 0l48 48M24 48V0M17 0v48M31 0v48M48 24H0M0 31h48M0 17h48"/>\n        </g>\n    </svg>',
      DEFAULT_EFFECT_OPTIONS = [{
        id: "none",
        title: "None"
      }, {
        id: "elevate",
        title: "Elevate"
      }, {
        id: "shadow",
        title: "Cast shadow"
      }, {
        id: "score",
        title: "Score"
      }],
      NO_SHAPE_EFFECT_OPTIONS = [{
        id: "none",
        title: "None"
      }, {
        id: "score",
        title: "Score"
      }];
    exports.LauncherIconGenerator = function(_BaseGenerator) {
      function LauncherIconGenerator() {
        return _classCallCheck(this, LauncherIconGenerator), _possibleConstructorReturn(this, (LauncherIconGenerator.__proto__ || Object.getPrototypeOf(LauncherIconGenerator)).apply(this, arguments))
      }
      return _inherits(LauncherIconGenerator, _BaseGenerator), _createClass(LauncherIconGenerator, [{
        key: "setupForm",
        value: function() {
          var _this2 = this,
            backColorField = void 0,
            effectsField = void 0;
          this.form = new _studio.studio.Form({
            id: "iconform",
            container: "#inputs-form",
            fields: [new _studio.studio.ImageField("foreground", {
              title: "Foreground",
              maxFinalSize: {
                w: 720,
                h: 720
              },
              defaultValueTrim: 1,
              defaultValuePadding: .25,
              defaultValueClipart: "android",
              dropTarget: document.body
            }), new _studio.studio.ColorField("foreColor", {
              newGroup: !0,
              title: "Color",
              helpText: "Set to transparent to use original colors",
              alpha: !0,
              defaultValue: "rgba(96, 125, 139, 0)"
            }), backColorField = new _studio.studio.ColorField("backColor", {
              title: "Background color",
              defaultValue: "#448aff"
            }), new _studio.studio.BooleanField("crop", {
              title: "Scaling",
              defaultValue: !1,
              offText: "Center",
              onText: "Crop"
            }), new _studio.studio.EnumField("backgroundShape", {
              title: "Shape",
              options: [{
                id: "none",
                title: "None"
              }, {
                id: "square",
                title: "Square"
              }, {
                id: "circle",
                title: "Circle"
              }, {
                id: "vrect",
                title: "Tall rect"
              }, {
                id: "hrect",
                title: "Wide rect"
              }],
              defaultValue: "square",
              onChange: function(newValue) {
                backColorField.setEnabled("none" != newValue);
                var newEffectsOptions = "none" == newValue ? NO_SHAPE_EFFECT_OPTIONS : DEFAULT_EFFECT_OPTIONS;
                newEffectsOptions.find(function(e) {
                  return e.id == effectsField.getValue()
                }) || effectsField.setValue(newEffectsOptions[0].id), effectsField.setOptions(newEffectsOptions)
              }
            }), effectsField = new _studio.studio.EnumField("effects", {
              title: "Effect",
              buttons: !0,
              options: DEFAULT_EFFECT_OPTIONS,
              defaultValue: "none"
            }), new _studio.studio.TextField("name", {
              title: "Name",
              defaultValue: "ic_launcher"
            })]
          }), this.form.onChange(function(field) {
            return _this2.regenerateDebounced_()
          })
        }
      }, {
        key: "regenerate",
        value: function() {
          var _this3 = this,
            values = this.form.getValues();
          this.zipper.clear(), this.zipper.setZipFilename(values.name + ".zip");
          var xxxhdpiCtx = null;
          this.densities.forEach(function(density) {
            var ctx = void 0;
            if ("xxxhdpi" == density || "web" == density) ctx = _this3.regenerateRawAtDensity_(density), "xxxhdpi" == density && (xxxhdpiCtx = ctx);
            else {
              var mult = _studio.studio.Util.getMultBaseMdpi(density),
                iconSize = _studio.studio.Util.multRound(ICON_SIZE, mult);
              ctx = _imagelib.imagelib.Drawing.context(iconSize), _imagelib.imagelib.Drawing.drawImageScaled(ctx, xxxhdpiCtx, 0, 0, 192, 192, 0, 0, iconSize.w, iconSize.h)
            }
            _this3.zipper.add({
              name: "web" == density ? "web_hi_res_512.png" : "res/mipmap-" + density + "/" + values.name + ".png",
              canvas: ctx.canvas
            }), _this3.setImageForSlot_(density, ctx.canvas.toDataURL())
          })
        }
      }, {
        key: "regenerateRawAtDensity_",
        value: function(density) {
          var values = this.form.getValues(),
            foreSrcCtx = values.foreground ? values.foreground.ctx : null,
            mult = _studio.studio.Util.getMultBaseMdpi(density);
          "web" == density && (mult = 512 / 48);
          var iconSize = _studio.studio.Util.multRound(ICON_SIZE, mult),
            targetRect = TARGET_RECTS_BY_SHAPE[values.backgroundShape],
            outCtx = _imagelib.imagelib.Drawing.context(iconSize),
            roundRectPath_ = function(ctx, _ref, r) {
              var x = _ref.x,
                y = _ref.y,
                w = _ref.w,
                h = _ref.h;
              ctx.beginPath(), ctx.moveTo(x + w - r, y), ctx.arcTo(x + w, y, x + w, y + r, r), ctx.lineTo(x + w, y + h - r), ctx.arcTo(x + w, y + h, x + w - r, y + h, r), ctx.lineTo(x + r, y + h), ctx.arcTo(x, y + h, x, y + h - r, r), ctx.lineTo(x, y + r), ctx.arcTo(x, y, x + r, y, r), ctx.closePath()
            },
            backgroundLayer = {
              draw: function(ctx) {
                ctx.scale(mult, mult), values.backColor.setAlpha(1), ctx.fillStyle = values.backColor.toRgbString();
                var targetRect = TARGET_RECTS_BY_SHAPE[values.backgroundShape];
                switch (values.backgroundShape) {
                  case "square":
                  case "vrect":
                  case "hrect":
                    roundRectPath_(ctx, targetRect, 3), ctx.fill();
                    break;
                  case "circle":
                    ctx.beginPath(), ctx.arc(targetRect.x + targetRect.w / 2, targetRect.y + targetRect.h / 2, targetRect.w / 2, 0, 2 * Math.PI, !1), ctx.closePath(), ctx.fill()
                }
              },
              mask: !0
            },
            foregroundLayer = {
              draw: function(ctx) {
                if (foreSrcCtx) {
                  var drawFn_ = _imagelib.imagelib.Drawing[values.crop ? "drawCenterCrop" : "drawCenterInside"];
                  drawFn_(ctx, foreSrcCtx, _studio.studio.Util.mult(targetRect, mult), {
                    x: 0,
                    y: 0,
                    w: foreSrcCtx.canvas.width,
                    h: foreSrcCtx.canvas.height
                  })
                }
              },
              effects: [],
              mask: !("none" != values.backgroundShape)
            };
          "none" != values.backgroundShape && "shadow" == values.effects && foregroundLayer.effects.push({
            effect: "cast-shadow"
          }), values.foreColor.getAlpha() && foregroundLayer.effects.push({
            effect: "fill-color",
            color: values.foreColor.toRgbString()
          }), "none" == values.backgroundShape || "elevate" != values.effects && "shadow" != values.effects || (foregroundLayer.effects = foregroundLayer.effects.concat([{
            effect: "outer-shadow",
            color: "rgba(0, 0, 0, 0.2)",
            translateY: .25 * mult
          }, {
            effect: "outer-shadow",
            color: "rgba(0, 0, 0, 0.2)",
            blur: 1 * mult,
            translateY: 1 * mult
          }]));
          var scoreLayer = {
            draw: function(ctx) {
              ctx.fillStyle = "rgba(0, 0, 0, .1)", ctx.fillRect(0, 0, iconSize.w, iconSize.h / 2)
            }
          };
          return _imagelib.imagelib.Drawing.drawLayers(outCtx, iconSize, {
            children: ["none" != values.backgroundShape ? backgroundLayer : null, foregroundLayer, "score" == values.effects ? scoreLayer : null],
            effects: [{
              effect: "inner-shadow",
              color: "rgba(255, 255, 255, 0.2)",
              translateY: .25 * mult
            }, {
              effect: "inner-shadow",
              color: "rgba(0, 0, 0, 0.2)",
              translateY: -.25 * mult
            }, {
              effect: "fill-radialgradient",
              centerX: 0,
              centerY: 0,
              radius: iconSize.w,
              colors: [{
                offset: 0,
                color: "rgba(255,255,255,.1)"
              }, {
                offset: 1,
                color: "rgba(255,255,255,0)"
              }]
            }, {
              effect: "outer-shadow",
              color: "rgba(0, 0, 0, 0.3)",
              blur: .7 * mult,
              translateY: .7 * mult
            }]
          }), outCtx
        }
      }, {
        key: "densities",
        get: function() {
          return new Set(["xxxhdpi", "web", "xxhdpi", "xhdpi", "hdpi", "mdpi"])
        }
      }, {
        key: "gridOverlaySvg",
        get: function() {
          return GRID_OVERLAY_SVG
        }
      }]), LauncherIconGenerator
    }(_BaseGenerator2.BaseGenerator)
  }, {
    "../imagelib": 5,
    "../studio": 32,
    "./BaseGenerator": 8
  }],
  11: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.NotificationIconGenerator = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _studio = require("../studio"),
      _imagelib = require("../imagelib"),
      _BaseGenerator2 = require("./BaseGenerator"),
      ICON_SIZE = {
        w: 24,
        h: 24
      },
      TARGET_RECT = {
        x: 1,
        y: 1,
        w: 22,
        h: 22
      };
    exports.NotificationIconGenerator = function(_BaseGenerator) {
      function NotificationIconGenerator() {
        return _classCallCheck(this, NotificationIconGenerator), _possibleConstructorReturn(this, (NotificationIconGenerator.__proto__ || Object.getPrototypeOf(NotificationIconGenerator)).apply(this, arguments))
      }
      return _inherits(NotificationIconGenerator, _BaseGenerator), _createClass(NotificationIconGenerator, [{
        key: "setupForm",
        value: function() {
          var _this2 = this;
          _get(NotificationIconGenerator.prototype.__proto__ || Object.getPrototypeOf(NotificationIconGenerator.prototype), "setupForm", this).call(this), $(".outputs-panel").attr("data-theme", "dark");
          var defaultNameForSourceValue_ = function(v) {
              var name = _studio.studio.Util.sanitizeResourceName(v.name || "example");
              return "ic_stat_" + name
            },
            nameField = void 0;
          this.form = new _studio.studio.Form({
            id: "iconform",
            container: "#inputs-form",
            fields: [new _studio.studio.ImageField("source", {
              title: "Source",
              helpText: "Must be transparent",
              maxFinalSize: {
                w: 128,
                h: 128
              },
              defaultValueClipart: "ac_unit",
              dropTarget: document.body,
              onChange: function(newValue, oldValue) {
                nameField.getValue() == defaultNameForSourceValue_(oldValue) && nameField.setValue(defaultNameForSourceValue_(newValue))
              }
            }), nameField = new _studio.studio.TextField("name", {
              newGroup: !0,
              title: "Name",
              helpText: "Used when generating ZIP files.",
              defaultValue: defaultNameForSourceValue_({})
            })]
          }), this.form.onChange(function(field) {
            return _this2.regenerateDebounced_()
          })
        }
      }, {
        key: "regenerate",
        value: function() {
          var _this3 = this,
            values = this.form.getValues();
          this.zipper.clear(), this.zipper.setZipFilename(values.name + ".zip"), this.densities.forEach(function(density) {
            var mult = _studio.studio.Util.getMultBaseMdpi(density),
              iconSize = _studio.studio.Util.multRound(ICON_SIZE, mult),
              outCtx = _imagelib.imagelib.Drawing.context(iconSize),
              tmpCtx = _imagelib.imagelib.Drawing.context(iconSize);
            if (values.source.ctx) {
              var srcCtx = values.source.ctx;
              _imagelib.imagelib.Drawing.drawCenterInside(tmpCtx, srcCtx, _studio.studio.Util.mult(TARGET_RECT, mult), {
                x: 0,
                y: 0,
                w: srcCtx.canvas.width,
                h: srcCtx.canvas.height
              })
            }
            _imagelib.imagelib.Effects.fx([{
              effect: "fill-color",
              color: "#fff"
            }], outCtx, tmpCtx, iconSize), _this3.zipper.add({
              name: "res/drawable-" + density + "/" + values.name + ".png",
              canvas: outCtx.canvas
            }), _this3.setImageForSlot_(density, outCtx.canvas.toDataURL())
          })
        }
      }]), NotificationIconGenerator
    }(_BaseGenerator2.BaseGenerator)
  }, {
    "../imagelib": 5,
    "../studio": 32,
    "./BaseGenerator": 8
  }],
  12: [function(require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.pages = void 0;
    var _LauncherIconGenerator = require("./LauncherIconGenerator"),
      _AppShortcutIconGenerator = require("./AppShortcutIconGenerator"),
      _ActionBarIconGenerator = require("./ActionBarIconGenerator"),
      _NotificationIconGenerator = require("./NotificationIconGenerator"),
      _GenericIconGenerator = require("./GenericIconGenerator"),
      _NinePatchGenerator = require("./ninepatch/NinePatchGenerator");
    exports.pages = {
      LauncherIconGenerator: _LauncherIconGenerator.LauncherIconGenerator,
      AppShortcutIconGenerator: _AppShortcutIconGenerator.AppShortcutIconGenerator,
      ActionBarIconGenerator: _ActionBarIconGenerator.ActionBarIconGenerator,
      NotificationIconGenerator: _NotificationIconGenerator.NotificationIconGenerator,
      GenericIconGenerator: _GenericIconGenerator.GenericIconGenerator,
      NinePatchGenerator: _NinePatchGenerator.NinePatchGenerator
    }
  }, {
    "./ActionBarIconGenerator": 6,
    "./AppShortcutIconGenerator": 7,
    "./GenericIconGenerator": 9,
    "./LauncherIconGenerator": 10,
    "./NotificationIconGenerator": 11,
    "./ninepatch/NinePatchGenerator": 13
  }],
  13: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.NinePatchGenerator = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _studio = require("../../studio"),
      _imagelib = require("../../imagelib"),
      _BaseGenerator2 = require("../BaseGenerator"),
      _NinePatchStage = require("./NinePatchStage"),
      _NinePatchPreview = require("./NinePatchPreview"),
      _NinePatchLoader = require("./NinePatchLoader"),
      DENSITIES = new Set(["xxxhdpi", "xxhdpi", "xhdpi", "hdpi", "mdpi"]),
      SOURCE_DENSITY_OPTIONS = [{
        id: "160",
        title: "mdpi<br><small>(160)</small>"
      }, {
        id: "240",
        title: "hdpi<br><small>(240)</small>"
      }, {
        id: "320",
        title: "xhdpi<br><small>(320)</small>"
      }, {
        id: "480",
        title: "xxhdpi<br><small>(480)</small>"
      }, {
        id: "640",
        title: "xxxhdpi<br><small>(640)</small>"
      }];
    document.location.search.indexOf("extradensities") >= 0 && (DENSITIES.add("ldpi"), DENSITIES.add("tvdpi"));
    exports.NinePatchGenerator = function(_BaseGenerator) {
      function NinePatchGenerator() {
        _classCallCheck(this, NinePatchGenerator);
        var _this = _possibleConstructorReturn(this, (NinePatchGenerator.__proto__ || Object.getPrototypeOf(NinePatchGenerator)).call(this));
        return _this.stage = new _NinePatchStage.NinePatchStage, _this.preview = new _NinePatchPreview.NinePatchPreview(_this.stage), _this.stage.onChange(function() {
          _this.regenerate(), _this.preview.redraw()
        }), _this.setupOutputsPreviewTabs(), _this
      }
      return _inherits(NinePatchGenerator, _BaseGenerator), _createClass(NinePatchGenerator, [{
        key: "setupOutputsPreviewTabs",
        value: function() {
          $(".outputs-preview-tabs input").on("change", function(ev) {
            $(".outputs-preview-sidebar").attr("data-view", $(ev.currentTarget).val()), $(".outputs-preview-tabs input").prop("checked", !1), $(ev.currentTarget).prop("checked", !0)
          })
        }
      }, {
        key: "setupForm",
        value: function() {
          var _this2 = this;
          _get(NinePatchGenerator.prototype.__proto__ || Object.getPrototypeOf(NinePatchGenerator.prototype), "setupForm", this).call(this);
          var nameField = void 0;
          this.form = new _studio.studio.Form({
            id: "ninepatchform",
            container: "#inputs-form",
            fields: [new _studio.studio.ImageField("source", {
              title: "Source graphic",
              imageOnly: !0,
              noTrimForm: !0,
              noPreview: !0,
              dropTarget: document.body
            }), new _studio.studio.EnumField("sourceDensity", {
              title: "Source density",
              buttons: !0,
              options: SOURCE_DENSITY_OPTIONS,
              defaultValue: "320"
            }), nameField = new _studio.studio.TextField("name", {
              title: "Drawable name",
              helpText: "Used when generating ZIP files. Becomes <code>&lt;name&gt;.9.png</code>.",
              defaultValue: "example"
            })]
          }), this.form.onChange(function(field) {
            var values = _this2.form.getValues();
            if (field && "source" != field.id_) _this2.regenerate();
            else if (values.source) {
              if (!values.source.ctx) return;
              var src = values.source,
                size = {
                  w: src.ctx.canvas.width,
                  h: src.ctx.canvas.height
                };
              if (_this2.stage.name = src.name + "-" + size.w + "x" + size.h, src.name && src.name.match(/\.9\.png$/i) ? _NinePatchLoader.NinePatchLoader.loadNinePatchIntoStage(src.ctx, _this2.stage) : _this2.stage.loadSourceImage(src.ctx), src.name) {
                var name = _studio.studio.Util.sanitizeResourceName(src.name);
                name != nameField.getValue() && nameField.setValue(name)
              }
            } else _this2.stage.loadSourceImage(null)
          })
        }
      }, {
        key: "regenerate",
        value: function() {
          var _this3 = this;
          if (this.stage.srcCtx) {
            var values = this.form.getValues();
            this.zipper.clear(), this.zipper.setZipFilename(values.name + ".9.zip"), this.densities.forEach(function(density) {
              var dpi = _studio.studio.Util.getDpiForDensity(density),
                scale = dpi / values.sourceDensity,
                outSize = {
                  w: Math.ceil(_this3.stage.srcSize.w * scale) + 2,
                  h: Math.ceil(_this3.stage.srcSize.h * scale) + 2
                },
                outCtx = _imagelib.imagelib.Drawing.context(outSize);
              _imagelib.imagelib.Drawing.drawImageScaled(outCtx, _this3.stage.srcCtx, 0, 0, _this3.stage.srcSize.w, _this3.stage.srcSize.h, 1, 1, outSize.w - 2, outSize.h - 2), outCtx.strokeStyle = "#f00", outCtx.lineWidth = 1, outCtx.beginPath(), outCtx.moveTo(1, outSize.h - .5), outCtx.lineTo(1 + Math.floor(scale * _this3.stage.opticalBoundsRect.x), outSize.h - .5), outCtx.stroke(), outCtx.moveTo(Math.ceil(scale * (_this3.stage.opticalBoundsRect.x + _this3.stage.opticalBoundsRect.w)) + 1, outSize.h - .5), outCtx.lineTo(outSize.w - 1, outSize.h - .5), outCtx.stroke(), outCtx.moveTo(outSize.w - .5, 1), outCtx.lineTo(outSize.w - .5, 1 + Math.floor(scale * _this3.stage.opticalBoundsRect.y)), outCtx.stroke(), outCtx.moveTo(outSize.w - .5, Math.ceil(scale * (_this3.stage.opticalBoundsRect.y + _this3.stage.opticalBoundsRect.h)) + 1), outCtx.lineTo(outSize.w - .5, outSize.h - 1), outCtx.stroke(), outCtx.closePath(), outCtx.strokeStyle = "#000", outCtx.beginPath(), outCtx.moveTo(1 + Math.floor(scale * _this3.stage.stretchRect.x), .5), outCtx.lineTo(1 + Math.ceil(scale * (_this3.stage.stretchRect.x + _this3.stage.stretchRect.w)), .5), outCtx.stroke(), outCtx.moveTo(.5, 1 + Math.floor(scale * _this3.stage.stretchRect.y)), outCtx.lineTo(.5, 1 + Math.ceil(scale * (_this3.stage.stretchRect.y + _this3.stage.stretchRect.h))), outCtx.stroke(), outCtx.moveTo(1 + Math.floor(scale * _this3.stage.contentRect.x), outSize.h - .5), outCtx.lineTo(1 + Math.ceil(scale * (_this3.stage.contentRect.x + _this3.stage.contentRect.w)), outSize.h - .5), outCtx.stroke(), outCtx.moveTo(outSize.w - .5, 1 + Math.floor(scale * _this3.stage.contentRect.y)), outCtx.lineTo(outSize.w - .5, 1 + Math.ceil(scale * (_this3.stage.contentRect.y + _this3.stage.contentRect.h))), outCtx.stroke(), outCtx.closePath(), _this3.zipper.add({
                name: "res/drawable-" + density + "/" + values.name + ".9.png",
                canvas: outCtx.canvas
              }), _this3.setImageForSlot_(density, outCtx.canvas.toDataURL())
            })
          }
        }
      }, {
        key: "densities",
        get: function() {
          return DENSITIES
        }
      }]), NinePatchGenerator
    }(_BaseGenerator2.BaseGenerator)
  }, {
    "../../imagelib": 5,
    "../../studio": 32,
    "../BaseGenerator": 8,
    "./NinePatchLoader": 14,
    "./NinePatchPreview": 15,
    "./NinePatchStage": 16
  }],
  14: [function(require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.NinePatchLoader = void 0;
    var _imagelib = require("../../imagelib"),
      numberForRGBA = function(r, g, b, a) {
        return (r << 16) + (g << 8) + (b << 0) + (a << 24)
      },
      BLACK = numberForRGBA(0, 0, 0, 255),
      RED = numberForRGBA(255, 0, 0, 255);
    exports.NinePatchLoader = {
      loadNinePatchIntoStage: function(ctx, stage) {
        function _getPixel(x, y) {
          return (imgData.data[4 * (y * srcSize.w + x) + 0] << 16) + (imgData.data[4 * (y * srcSize.w + x) + 1] << 8) + (imgData.data[4 * (y * srcSize.w + x) + 2] << 0) + (imgData.data[4 * (y * srcSize.w + x) + 3] << 24)
        }
        var srcSize = {
            w: ctx.canvas.width,
            h: ctx.canvas.height
          },
          imgData = ctx.getImageData(0, 0, srcSize.w, srcSize.h),
          size = {
            w: srcSize.w - 2,
            h: srcSize.h - 2
          },
          rects = {
            contentRect: {
              x: 0,
              y: 0,
              w: size.w,
              h: size.h
            },
            stretchRect: {
              x: 0,
              y: 0,
              w: size.w,
              h: size.h
            },
            opticalBoundsRect: {
              x: 0,
              y: 0,
              w: size.w,
              h: size.h
            }
          },
          inRegion = void 0;
        inRegion = !1;
        for (var x = 0; x < size.w; x++) {
          var p = _getPixel(x + 1, 0);
          inRegion || p != BLACK ? inRegion && p != BLACK && (rects.stretchRect.w = x - rects.stretchRect.x, inRegion = !1) : (rects.stretchRect.x = x, inRegion = !0)
        }
        inRegion = !1;
        for (var y = 0; y < size.h; y++) {
          var _p = _getPixel(0, y + 1);
          inRegion || _p != BLACK ? inRegion && _p != BLACK && (rects.stretchRect.h = y - rects.stretchRect.y, inRegion = !1) : (rects.stretchRect.y = y, inRegion = !0)
        }
        inRegion = !1;
        for (var _x = 0; _x < size.w; _x++) {
          var _p2 = _getPixel(_x + 1, srcSize.h - 1);
          inRegion || _p2 != BLACK ? inRegion && _p2 != BLACK && (rects.contentRect.w = _x - rects.contentRect.x, inRegion = !1) : (rects.contentRect.x = _x, inRegion = !0)
        }
        inRegion = !1;
        for (var _y = 0; _y < size.h; _y++) {
          var _p3 = _getPixel(srcSize.w - 1, _y + 1);
          inRegion || _p3 != BLACK ? inRegion && _p3 != BLACK && (rects.contentRect.h = _y - rects.contentRect.y, inRegion = !1) : (rects.contentRect.y = _y, inRegion = !0)
        }
        inRegion = !1;
        for (var _x2 = 0; _x2 < size.w; _x2++) {
          var _p4 = _getPixel(_x2 + 1, srcSize.h - 1);
          inRegion || _p4 == RED ? inRegion && _p4 == RED && (rects.opticalBoundsRect.w = _x2 - rects.opticalBoundsRect.x, inRegion = !1) : (rects.opticalBoundsRect.x = _x2, inRegion = !0)
        }
        for (var _y2 = 0; _y2 < size.h; _y2++) {
          var _p5 = _getPixel(srcSize.w - 1, _y2 + 1);
          inRegion || _p5 == RED ? inRegion && _p5 == RED && (rects.opticalBoundsRect.h = _y2 - rects.opticalBoundsRect.y, inRegion = !1) : (rects.opticalBoundsRect.y = _y2, inRegion = !0)
        }
        var newCtx = _imagelib.imagelib.Drawing.context(size);
        newCtx.drawImage(ctx.canvas, 1, 1, size.w, size.h, 0, 0, size.w, size.h), stage.loadSourceImage(newCtx, rects)
      }
    }
  }, {
    "../../imagelib": 5
  }],
  15: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    });
    var _createClass = function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
        }
      }
      return function(Constructor, protoProps, staticProps) {
        return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
      }
    }();
    exports.NinePatchPreview = function() {
      function NinePatchPreview(stage) {
        _classCallCheck(this, NinePatchPreview), this.stage = stage, this.size = {
          w: 200,
          h: 200
        }, this.setupUi(), this.redraw()
      }
      return _createClass(NinePatchPreview, [{
        key: "setupUi",
        value: function() {
          var _this = this,
            startWidth = void 0,
            startHeight = void 0,
            startX = void 0,
            startY = void 0,
            mouseMoveHandler_ = function(ev) {
              _this.size.w = Math.max(1, startWidth + 2 * (ev.pageX - startX)), _this.size.h = Math.max(1, startHeight + 2 * (ev.pageY - startY)), _this.redraw()
            },
            mouseUpHandler_ = function mouseUpHandler_(ev) {
              $(window).off("mousemove", mouseMoveHandler_).off("mouseup", mouseUpHandler_)
            };
          $(".preview-area").on("mousedown", function(ev) {
            startWidth = _this.size.w, startHeight = _this.size.h, startX = ev.pageX, startY = ev.pageY, $(window).on("mousemove", mouseMoveHandler_).on("mouseup", mouseUpHandler_)
          }), $("#preview-with-content").click(function(ev) {
            return $(".text-preview").toggle($(ev.currentTarget).is(":checked"))
          })
        }
      }, {
        key: "redraw",
        value: function() {
          var canvas = $(".preview-area canvas").get(0);
          if (canvas.width = this.size.w, canvas.height = this.size.h, this.stage.srcCtx) {
            var ctx = canvas.getContext("2d"),
              fixed = {
                l: this.stage.stretchRect.x,
                t: this.stage.stretchRect.y,
                r: this.stage.srcSize.w - this.stage.stretchRect.x - this.stage.stretchRect.w,
                b: this.stage.srcSize.h - this.stage.stretchRect.y - this.stage.stretchRect.h
              };
            fixed.l && fixed.t && ctx.drawImage(this.stage.srcCtx.canvas, 0, 0, fixed.l, fixed.t, 0, 0, fixed.l, fixed.t), fixed.l && fixed.b && ctx.drawImage(this.stage.srcCtx.canvas, 0, this.stage.srcSize.h - fixed.b, fixed.l, fixed.b, 0, this.size.h - fixed.b, fixed.l, fixed.b), fixed.r && fixed.t && ctx.drawImage(this.stage.srcCtx.canvas, this.stage.srcSize.w - fixed.r, 0, fixed.r, fixed.t, this.size.w - fixed.r, 0, fixed.r, fixed.t), fixed.r && fixed.b && ctx.drawImage(this.stage.srcCtx.canvas, this.stage.srcSize.w - fixed.r, this.stage.srcSize.h - fixed.b, fixed.r, fixed.b, this.size.w - fixed.r, this.size.h - fixed.b, fixed.r, fixed.b), fixed.t && ctx.drawImage(this.stage.srcCtx.canvas, fixed.l, 0, this.stage.stretchRect.w, fixed.t, fixed.l, 0, this.size.w - fixed.l - fixed.r, fixed.t), fixed.l && ctx.drawImage(this.stage.srcCtx.canvas, 0, fixed.t, fixed.l, this.stage.stretchRect.h, 0, fixed.t, fixed.l, this.size.h - fixed.t - fixed.b), fixed.r && ctx.drawImage(this.stage.srcCtx.canvas, this.stage.srcSize.w - fixed.r, fixed.t, fixed.r, this.stage.stretchRect.h, this.size.w - fixed.r, fixed.t, fixed.r, this.size.h - fixed.t - fixed.b), fixed.b && ctx.drawImage(this.stage.srcCtx.canvas, fixed.l, this.stage.srcSize.h - fixed.b, this.stage.stretchRect.w, fixed.b, fixed.l, this.size.h - fixed.b, this.size.w - fixed.l - fixed.r, fixed.b), ctx.drawImage(this.stage.srcCtx.canvas, fixed.l, fixed.t, this.stage.stretchRect.w, this.stage.stretchRect.h, fixed.l, fixed.t, this.size.w - fixed.l - fixed.r, this.size.h - fixed.t - fixed.b), $(".preview-area .text-preview").css({
              left: this.stage.contentRect.x + "px",
              top: this.stage.contentRect.y + "px",
              width: this.size.w - this.stage.srcSize.w + this.stage.contentRect.w + "px",
              height: this.size.h - this.stage.srcSize.h + this.stage.contentRect.h + "px"
            })
          }
        }
      }]), NinePatchPreview
    }()
  }, {}],
  16: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function fitRect_(rect, size) {
      var newRect = {};
      return newRect.x = Math.max(0, rect.x), newRect.y = Math.max(0, rect.y), newRect.w = Math.min(size.w - rect.x, rect.w), newRect.h = Math.min(size.h - rect.y, rect.h), newRect
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.NinePatchStage = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _NinePatchTrimming = (require("../../imagelib"), require("./NinePatchTrimming")),
      EMPTY_RECT = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
      },
      SLOP_PIXELS = 10;
    exports.NinePatchStage = function() {
      function NinePatchStage() {
        var _this = this;
        _classCallCheck(this, NinePatchStage), this.zoom = 1, this.matteColor = "light", this.editMode = "stretch", this.stretchRect = Object.assign({}, EMPTY_RECT), this.contentRect = Object.assign({}, EMPTY_RECT), this.opticalBoundsRect = Object.assign({}, EMPTY_RECT), this.name = "default", this.changeListeners_ = [], this.$stage = $(".nine-patch-stage"), this.$canvasContainer = $(".stage-canvas-container"), this.setupUi(), this.setupDragging(), $(window).on("resize", function() {
          _this.relayout(), _this.redrawOverlay()
        })
      }
      return _createClass(NinePatchStage, [{
        key: "onChange",
        value: function(listener) {
          this.changeListeners_.push(listener)
        }
      }, {
        key: "notifyChange_",
        value: function() {
          this.changeListeners_.forEach(function(fn) {
            return fn()
          })
        }
      }, {
        key: "setupUi",
        value: function() {
          var _this2 = this;
          this.$topLabel = $("<div>").addClass("canvas-label label-vertical").hide().appendTo("body"), this.$leftLabel = $("<div>").addClass("canvas-label label-horizontal").hide().appendTo("body"), this.$rightLabel = $("<div>").addClass("canvas-label label-horizontal").hide().appendTo("body"), this.$bottomLabel = $("<div>").addClass("canvas-label label-vertical").hide().appendTo("body"), $(".stage-which input").on("change", function(ev) {
            _this2.editMode = $(ev.currentTarget).val(), $(".trim-button").toggle("stretch" == _this2.editMode), $(".find-region-button").text({
              stretch: "Auto-stretch",
              padding: "Auto-padding",
              opticalbounds: "Auto-bounds"
            }[_this2.editMode]), $(".stage-which input").prop("checked", !1), $(ev.currentTarget).prop("checked", !0), _this2.redrawOverlay()
          }), $(".stage-matte-color input").on("change", function(ev) {
            _this2.matteColor = $(ev.currentTarget).val(), $(document.body).attr("data-theme", _this2.matteColor), $(".stage-matte-color input").prop("checked", !1), $(ev.currentTarget).prop("checked", !0), _this2.redrawImage()
          }), $(".trim-edge-button").click(function() {
            return _NinePatchTrimming.NinePatchTrimming.trimEdges(_this2)
          }), $(".trim-stretch-button").click(function() {
            return _NinePatchTrimming.NinePatchTrimming.trimStretchRegion(_this2)
          }), $(".find-region-button").click(function() {
            var rect = _NinePatchTrimming.NinePatchTrimming.detectRegion(_this2, _this2.editMode);
            rect && ("stretch" == _this2.editMode ? _this2.stretchRect = rect : "opticalbounds" == _this2.editMode ? _this2.opticalBoundsRect = rect : "padding" == _this2.editMode && (_this2.contentRect = rect), _this2.saveRects(), _this2.redrawOverlay(), _this2.notifyChange_())
          })
        }
      }, {
        key: "setupDragging",
        value: function() {
          var _this3 = this,
            _mouseUpHandler_ = void 0,
            draggingMouseMoveHandler_ = void 0,
            getEditRect_ = function() {
              return {
                stretch: _this3.stretchRect,
                padding: _this3.contentRect,
                opticalbounds: _this3.opticalBoundsRect
              }[_this3.editMode]
            };
          this.$canvasContainer.on("mousedown", function(ev) {
            _this3.dragging = !0, _this3.redrawOverlay(), $(window).on("mouseup", _mouseUpHandler_).on("mousemove", draggingMouseMoveHandler_)
          }).on("mousemove", function(ev) {
            if (_this3.$imageCanvas && !_this3.dragging) {
              var editRect = getEditRect_(),
                offs = _this3.$canvasContainer.offset(),
                offsetX = ev.pageX - offs.left,
                offsetY = ev.pageY - offs.top;
              _this3.editLeft = _this3.editRight = _this3.editTop = _this3.editBottom = !1, offsetX >= editRect.x * _this3.zoom - SLOP_PIXELS && offsetX <= editRect.x * _this3.zoom + SLOP_PIXELS ? _this3.editLeft = !0 : offsetX >= (editRect.x + editRect.w) * _this3.zoom - SLOP_PIXELS && offsetX <= (editRect.x + editRect.w) * _this3.zoom + SLOP_PIXELS && (_this3.editRight = !0), offsetY >= editRect.y * _this3.zoom - SLOP_PIXELS && offsetY <= editRect.y * _this3.zoom + SLOP_PIXELS ? _this3.editTop = !0 : offsetY >= (editRect.y + editRect.h) * _this3.zoom - SLOP_PIXELS && offsetY <= (editRect.y + editRect.h) * _this3.zoom + SLOP_PIXELS && (_this3.editBottom = !0);
              var cursor = "default";
              _this3.editLeft ? cursor = _this3.editTop ? "nw-resize" : _this3.editBottom ? "sw-resize" : "w-resize" : _this3.editRight ? cursor = _this3.editTop ? "ne-resize" : _this3.editBottom ? "se-resize" : "e-resize" : _this3.editTop ? cursor = "n-resize" : _this3.editBottom && (cursor = "s-resize"),
                _this3.$canvasContainer.css("cursor", cursor)
            }
          }), _mouseUpHandler_ = function(ev) {
            _this3.dragging && (_this3.dragging = !1, _this3.redrawOverlay(), _this3.saveRects()), $(window).off("mousemove", draggingMouseMoveHandler_).off("mouseup", _mouseUpHandler_)
          }, draggingMouseMoveHandler_ = function(ev) {
            ev.preventDefault(), ev.stopPropagation();
            var editRect = getEditRect_(),
              offs = _this3.$canvasContainer.offset(),
              offsetX = ev.pageX - offs.left,
              offsetY = ev.pageY - offs.top;
            if (_this3.editLeft) {
              var newX = Math.max(0, Math.min(editRect.x + editRect.w - 1, Math.round(offsetX / _this3.zoom)));
              editRect.w = editRect.w + editRect.x - newX, editRect.x = newX
            }
            if (_this3.editTop) {
              var newY = Math.max(0, Math.min(editRect.y + editRect.h - 1, Math.round(offsetY / _this3.zoom)));
              editRect.h = editRect.h + editRect.y - newY, editRect.y = newY
            }
            _this3.editRight && (editRect.w = Math.min(_this3.srcSize.w - editRect.x, Math.max(1, Math.round(offsetX / _this3.zoom) - editRect.x))), _this3.editBottom && (editRect.h = Math.min(_this3.srcSize.h - editRect.y, Math.max(1, Math.round(offsetY / _this3.zoom) - editRect.y))), _this3.redrawOverlay(), _this3.notifyChange_()
          }
        }
      }, {
        key: "loadSourceImage",
        value: function(srcCtx) {
          var initRects = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
          if (this.$canvasContainer.empty(), $(".editor-button").attr("disabled", srcCtx ? null : "disabled"), srcCtx) {
            this.srcCtx = srcCtx;
            var srcSizeChanged = !1,
              newSrcSize = {
                w: this.srcCtx.canvas.width,
                h: this.srcCtx.canvas.height
              };
            srcSizeChanged = !this.srcSize || this.srcSize.w != newSrcSize.w || this.srcSize.h != newSrcSize.h, this.srcSize = newSrcSize, srcSizeChanged && (this.stretchRect = initRects.stretchRect || {
              x: Math.floor(this.srcSize.w / 3),
              y: Math.floor(this.srcSize.h / 3),
              w: Math.ceil(this.srcSize.w / 3),
              h: Math.ceil(this.srcSize.h / 3)
            }, this.contentRect = initRects.contentRect || {
              x: 0,
              y: 0,
              w: this.srcSize.w,
              h: this.srcSize.h
            }, this.opticalBoundsRect = initRects.opticalBoundsRect || {
              x: 0,
              y: 0,
              w: this.srcSize.w,
              h: this.srcSize.h
            }), initRects.stretchRect || this.loadLastRects(), this.$imageCanvas = $("<canvas>").attr({
              width: this.srcSize.w,
              height: this.srcSize.h
            }).appendTo(this.$canvasContainer), this.$overlayCanvas = $("<canvas>").addClass("overlay").appendTo(this.$canvasContainer), this.relayout(), this.redrawImage(), this.redrawOverlay(), this.notifyChange_()
          }
        }
      }, {
        key: "relayout",
        value: function() {
          if (this.$imageCanvas) {
            var horizMaxZoom = Math.floor(this.$stage.width() / this.srcSize.w),
              vertMaxZoom = Math.floor(this.$stage.height() / this.srcSize.h);
            this.zoom = Math.max(1, Math.min(horizMaxZoom, vertMaxZoom)), this.zoomedSize = {
              w: this.srcSize.w * this.zoom,
              h: this.srcSize.h * this.zoom
            }, this.$imageCanvas.css({
              width: this.zoomedSize.w,
              height: this.zoomedSize.h
            }), this.$overlayCanvas.attr({
              width: this.zoomedSize.w,
              height: this.zoomedSize.h
            })
          }
        }
      }, {
        key: "redrawImage",
        value: function() {
          if (this.$imageCanvas) {
            var imgCtx = this.$imageCanvas.get(0).getContext("2d");
            imgCtx.fillStyle = "light" == this.matteColor ? "#eee" : "#555", imgCtx.fillRect(0, 0, this.srcSize.w, this.srcSize.h), imgCtx.drawImage(this.srcCtx.canvas, 0, 0)
          }
        }
      }, {
        key: "redrawOverlay",
        value: function() {
          if (this.srcCtx) {
            var editRect = {
                stretch: this.stretchRect,
                padding: this.contentRect,
                opticalbounds: this.opticalBoundsRect
              }[this.editMode],
              ctx = this.$overlayCanvas.get(0).getContext("2d");
            if (ctx.clearRect(0, 0, this.zoomedSize.w, this.zoomedSize.h), ctx.save(), editRect === this.stretchRect ? (ctx.beginPath(), ctx.moveTo(0, editRect.y * this.zoom + .5), ctx.lineTo(this.zoomedSize.w, editRect.y * this.zoom + .5), ctx.moveTo(0, (editRect.y + editRect.h) * this.zoom - .5), ctx.lineTo(this.zoomedSize.w, (editRect.y + editRect.h) * this.zoom - .5), ctx.moveTo(editRect.x * this.zoom + .5, 0), ctx.lineTo(editRect.x * this.zoom + .5, this.zoomedSize.h), ctx.moveTo((editRect.x + editRect.w) * this.zoom - .5, 0), ctx.lineTo((editRect.x + editRect.w) * this.zoom - .5, this.zoomedSize.h)) : (ctx.beginPath(), ctx.rect(editRect.x * this.zoom + .5, editRect.y * this.zoom + .5, editRect.w * this.zoom - 1, editRect.h * this.zoom - 1), ctx.closePath()), this.dragging ? (ctx.strokeStyle = "rgba(255, 255, 255, 1)", ctx.lineWidth = 3, ctx.stroke(), ctx.strokeStyle = "rgba(255, 23, 68, 1)", ctx.lineWidth = 1, ctx.stroke()) : (ctx.strokeStyle = "rgba(255, 255, 255, .5)", ctx.lineWidth = 3, ctx.stroke(), ctx.strokeStyle = "rgba(0, 0, 0, .5)", ctx.setLineDash([3, 3]), ctx.lineWidth = 1, ctx.stroke()), ctx.restore(), this.dragging) {
              var stageOffset = this.$canvasContainer.offset();
              this.$leftLabel.text(editRect.x).css({
                left: stageOffset.left,
                width: editRect.x * this.zoom,
                top: stageOffset.top + (editRect.y + editRect.h / 2) * this.zoom
              }).show(), this.$rightLabel.text(this.srcSize.w - editRect.x - editRect.w).css({
                left: stageOffset.left + (editRect.x + editRect.w) * this.zoom,
                width: (this.srcSize.w - editRect.x - editRect.w) * this.zoom,
                top: stageOffset.top + (editRect.y + editRect.h / 2) * this.zoom
              }).show(), this.$topLabel.text(editRect.y).css({
                top: stageOffset.top,
                height: editRect.y * this.zoom,
                left: stageOffset.left + (editRect.x + editRect.w / 2) * this.zoom
              }).show(), this.$bottomLabel.text(this.srcSize.h - editRect.y - editRect.h).css({
                top: stageOffset.top + (editRect.y + editRect.h) * this.zoom,
                height: (this.srcSize.h - editRect.y - editRect.h) * this.zoom,
                left: stageOffset.left + (editRect.x + editRect.w / 2) * this.zoom
              }).show()
            } else this.$topLabel.hide(), this.$leftLabel.hide(), this.$rightLabel.hide(), this.$bottomLabel.hide()
          }
        }
      }, {
        key: "saveRects",
        value: function() {
          localStorage[this.localStorageKey] = JSON.stringify({
            stretchRect: this.stretchRect,
            contentRect: this.contentRect,
            opticalBoundsRect: this.opticalBoundsRect
          })
        }
      }, {
        key: "loadLastRects",
        value: function() {
          try {
            var store = JSON.parse(localStorage[this.localStorageKey]);
            store.stretchRect && store.contentRect && store.opticalBoundsRect && (this.stretchRect = fitRect_(store.stretchRect, this.srcSize), this.contentRect = fitRect_(store.contentRect, this.srcSize), this.opticalBoundsRect = fitRect_(store.opticalBoundsRect, this.srcSize))
          } catch (e) {}
        }
      }, {
        key: "localStorageKey",
        get: function() {
          return "assetStudioNinePatchStage-" + this.name
        }
      }]), NinePatchStage
    }()
  }, {
    "../../imagelib": 5,
    "./NinePatchTrimming": 17
  }],
  17: [function(require, module, exports) {
    "use strict";

    function getPixel_(stage, srcData, x, y) {
      return (srcData.data[4 * (y * stage.srcSize.w + x) + 0] << 16) + (srcData.data[4 * (y * stage.srcSize.w + x) + 1] << 8) + (srcData.data[4 * (y * stage.srcSize.w + x) + 2] << 0) + (srcData.data[4 * (y * stage.srcSize.w + x) + 3] << 24)
    }

    function constrain_(size, rect) {
      return rect.x < 0 && (rect.w += rect.x, rect.x += -rect.x), rect.x + rect.w > size.w && (rect.w = size.w - rect.x), rect.y < 0 && (rect.h += rect.y, rect.y += -rect.y), rect.y + rect.h > size.h && (rect.h = size.h - rect.y), rect
    }

    function getEqualRanges_(arr) {
      for (var equalRanges = [], start = -1, startVal = 0, i = 0; i < arr.length; i++) start < 0 ? (start = i, startVal = arr[i]) : arr[i] != startVal && (start != i - 1 && equalRanges.push({
        start: start,
        length: i - start
      }), start = i, startVal = arr[i]);
      return start != arr.length - 1 && equalRanges.push({
        start: start,
        length: arr.length - start
      }), equalRanges.sort(function(x, y) {
        return y.length - x.length
      })
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.NinePatchTrimming = void 0;
    var _imagelib = require("../../imagelib"),
      _Summer = require("./Summer");
    exports.NinePatchTrimming = {
      trimEdges: function(stage) {
        if (stage.srcCtx) {
          var srcData = stage.srcCtx.getImageData(0, 0, stage.srcSize.w, stage.srcSize.h),
            trimPixel = getPixel_(stage, srcData, 0, 0),
            insetRect = {
              l: 0,
              t: 0,
              r: 0,
              b: 0
            },
            x = void 0,
            y = void 0;
          trimTop: for (y = 0; y < stage.srcSize.h; y++)
            for (x = 0; x < stage.srcSize.w; x++)
              if (getPixel_(stage, srcData, x, y) != trimPixel) break trimTop;
          insetRect.t = y;
          trimLeft: for (x = 0; x < stage.srcSize.w; x++)
            for (y = 0; y < stage.srcSize.h; y++)
              if (getPixel_(stage, srcData, x, y) != trimPixel) break trimLeft;
          insetRect.l = x;
          trimBottom: for (y = stage.srcSize.h - 1; y >= 0; y--)
            for (x = 0; x < stage.srcSize.w; x++)
              if (getPixel_(stage, srcData, x, y) != trimPixel) break trimBottom;
          insetRect.b = stage.srcSize.h - y - 1;
          trimRight: for (x = stage.srcSize.w - 1; x >= 0; x--)
            for (y = 0; y < stage.srcSize.h; y++)
              if (getPixel_(stage, srcData, x, y) != trimPixel) break trimRight;
          if (insetRect.r = stage.srcSize.w - x - 1, !(insetRect.l <= 0 && insetRect.t <= 0 && insetRect.r <= 0 && insetRect.b <= 0)) {
            var size = {
                w: stage.srcSize.w - insetRect.l - insetRect.r,
                h: stage.srcSize.h - insetRect.t - insetRect.b
              },
              rects = {
                contentRect: constrain_(size, {
                  x: stage.contentRect.x - insetRect.l,
                  y: stage.contentRect.y - insetRect.t,
                  w: stage.contentRect.w,
                  h: stage.contentRect.h
                }),
                stretchRect: constrain_(size, {
                  x: stage.stretchRect.x - insetRect.l,
                  y: stage.stretchRect.y - insetRect.t,
                  w: stage.stretchRect.w,
                  h: stage.stretchRect.h
                }),
                opticalBoundsRect: constrain_(size, {
                  x: stage.opticalBoundsRect.x - insetRect.l,
                  y: stage.opticalBoundsRect.y - insetRect.t,
                  w: stage.opticalBoundsRect.w,
                  h: stage.opticalBoundsRect.h
                })
              };
            stage.name = stage.name + "-EDGES_TRIMMED";
            var newCtx = _imagelib.imagelib.Drawing.context(size);
            newCtx.drawImage(stage.srcCtx.canvas, insetRect.l, insetRect.t, size.w, size.h, 0, 0, size.w, size.h), stage.loadSourceImage(newCtx, rects)
          }
        }
      },
      trimStretchRegion: function(stage) {
        if (stage.srcCtx) {
          var srcData = stage.srcCtx.getImageData(0, 0, stage.srcSize.w, stage.srcSize.h),
            collapseX = stage.stretchRect.w > 4,
            collapseY = stage.stretchRect.h > 4,
            x = void 0,
            y = void 0,
            summer = new _Summer.Summer,
            first = !0,
            firstSum = -1;
          for (x = stage.stretchRect.x; x < stage.stretchRect.x + stage.stretchRect.w; x++) {
            for (summer.reset(), y = 0; y < stage.srcSize.h; y++) summer.addNext(getPixel_(stage, srcData, x, y));
            if (first) firstSum = summer.compute(), first = !1;
            else if (summer.compute() != firstSum) {
              collapseX = !1;
              break
            }
          }
          for (first = !0, y = stage.stretchRect.y; y < stage.stretchRect.y + stage.stretchRect.h; y++) {
            for (summer.reset(), x = 0; x < stage.srcSize.w; x++) summer.addNext(getPixel_(stage, srcData, x, y));
            if (first) firstSum = summer.compute(), first = !1;
            else if (summer.compute() != firstSum) {
              collapseY = !1;
              break
            }
          }
          if (collapseX || collapseY) {
            var fixed = {
                l: stage.stretchRect.x,
                t: stage.stretchRect.y,
                r: stage.srcSize.w - stage.stretchRect.x - stage.stretchRect.w,
                b: stage.srcSize.h - stage.stretchRect.y - stage.stretchRect.h
              },
              middle = {
                w: collapseX ? 4 : stage.stretchRect.w,
                h: collapseY ? 4 : stage.stretchRect.h
              },
              size = {
                w: fixed.l + middle.w + fixed.r,
                h: fixed.t + middle.h + fixed.b
              },
              ctx = _imagelib.imagelib.Drawing.context(size);
            fixed.l && fixed.t && ctx.drawImage(stage.srcCtx.canvas, 0, 0, fixed.l, fixed.t, 0, 0, fixed.l, fixed.t), fixed.l && fixed.b && ctx.drawImage(stage.srcCtx.canvas, 0, stage.srcSize.h - fixed.b, fixed.l, fixed.b, 0, size.h - fixed.b, fixed.l, fixed.b), fixed.r && fixed.t && ctx.drawImage(stage.srcCtx.canvas, stage.srcSize.w - fixed.r, 0, fixed.r, fixed.t, size.w - fixed.r, 0, fixed.r, fixed.t), fixed.r && fixed.b && ctx.drawImage(stage.srcCtx.canvas, stage.srcSize.w - fixed.r, stage.srcSize.h - fixed.b, fixed.r, fixed.b, size.w - fixed.r, size.h - fixed.b, fixed.r, fixed.b), fixed.t && ctx.drawImage(stage.srcCtx.canvas, fixed.l, 0, stage.stretchRect.w, fixed.t, fixed.l, 0, size.w - fixed.l - fixed.r, fixed.t), fixed.l && ctx.drawImage(stage.srcCtx.canvas, 0, fixed.t, fixed.l, stage.stretchRect.h, 0, fixed.t, fixed.l, size.h - fixed.t - fixed.b), fixed.r && ctx.drawImage(stage.srcCtx.canvas, stage.srcSize.w - fixed.r, fixed.t, fixed.r, stage.stretchRect.h, size.w - fixed.r, fixed.t, fixed.r, size.h - fixed.t - fixed.b), fixed.b && ctx.drawImage(stage.srcCtx.canvas, fixed.l, stage.srcSize.h - fixed.b, stage.stretchRect.w, fixed.b, fixed.l, size.h - fixed.b, size.w - fixed.l - fixed.r, fixed.b), ctx.drawImage(stage.srcCtx.canvas, fixed.l, fixed.t, stage.stretchRect.w, stage.stretchRect.h, fixed.l, fixed.t, size.w - fixed.l - fixed.r, size.h - fixed.t - fixed.b);
            var rects = {
              stretchRect: {
                x: stage.stretchRect.x,
                y: stage.stretchRect.y,
                w: middle.w,
                h: middle.h
              },
              contentRect: {
                x: stage.contentRect.x,
                y: stage.contentRect.y,
                w: stage.contentRect.w + middle.w - stage.stretchRect.w,
                h: stage.contentRect.h + middle.h - stage.stretchRect.h
              },
              opticalBoundsRect: {
                x: stage.opticalBoundsRect.x,
                y: stage.opticalBoundsRect.y,
                w: stage.opticalBoundsRect.w + middle.w - stage.stretchRect.w,
                h: stage.opticalBoundsRect.h + middle.h - stage.stretchRect.h
              }
            };
            stage.name = stage.name + "-STRETCH_TRIMMED", stage.loadSourceImage(ctx, rects)
          }
        }
      },
      detectRegion: function(stage, regionToFind) {
        if (!stage.srcCtx) return null;
        var srcData = stage.srcCtx.getImageData(0, 0, stage.srcSize.w, stage.srcSize.h),
          x = void 0,
          y = void 0,
          alphaHistogram = [];
        for (x = 0; x < stage.srcSize.w; x++)
          for (y = 0; y < stage.srcSize.h; y++) {
            var _alpha = srcData.data[4 * (y * stage.srcSize.w + x) + 3];
            alphaHistogram[_alpha] = alphaHistogram[_alpha] ? alphaHistogram[_alpha] + 1 : 1
          }
        for (var max1 = 0, max1Freq = 0, max2 = 0, max2Freq = 0, i = 0; i < 256; i++) alphaHistogram[i] > max1Freq ? (max2 = max1, max2Freq = max1Freq, max1 = i, max1Freq = alphaHistogram[i]) : alphaHistogram[i] > max2Freq && (max2 = i, max2Freq = alphaHistogram[i]);
        var alphaMax = max1 > max2 ? max1 : max2,
          ALPHA_THRESHOLD = 5,
          opticalBoundsRect = {
            l: -1,
            r: -1,
            t: -1,
            b: -1
          };
        obrLeft: for (x = 0; x < stage.srcSize.w; x++)
          for (y = 0; y < stage.srcSize.h; y++) {
            var alpha = srcData.data[4 * (y * stage.srcSize.w + x) + 3];
            if (alpha >= alphaMax - ALPHA_THRESHOLD) {
              opticalBoundsRect.l = x;
              break obrLeft
            }
          }
        obrRight: for (x = stage.srcSize.w - 1; x >= 0; x--)
          for (y = 0; y < stage.srcSize.h; y++) {
            var alpha = srcData.data[4 * (y * stage.srcSize.w + x) + 3];
            if (alpha >= alphaMax - ALPHA_THRESHOLD) {
              opticalBoundsRect.r = x;
              break obrRight
            }
          }
        obrTop: for (y = 0; y < stage.srcSize.h; y++)
          for (x = 0; x < stage.srcSize.w; x++) {
            var alpha = srcData.data[4 * (y * stage.srcSize.w + x) + 3];
            if (alpha >= alphaMax - ALPHA_THRESHOLD) {
              opticalBoundsRect.t = y;
              break obrTop
            }
          }
        obrBottom: for (y = stage.srcSize.h - 1; y >= 0; y--)
          for (x = 0; x < stage.srcSize.w; x++) {
            var _alpha2 = srcData.data[4 * (y * stage.srcSize.w + x) + 3];
            if (_alpha2 >= alphaMax - ALPHA_THRESHOLD) {
              opticalBoundsRect.b = y;
              break obrBottom
            }
          }
        if (opticalBoundsRect.l >= 0 && opticalBoundsRect.r > opticalBoundsRect.l && opticalBoundsRect.t >= 0 && opticalBoundsRect.b > opticalBoundsRect.t) {
          var rect = {
            x: opticalBoundsRect.l,
            y: opticalBoundsRect.t,
            w: opticalBoundsRect.r - opticalBoundsRect.l + 1,
            h: opticalBoundsRect.b - opticalBoundsRect.t + 1
          };
          if ("opticalbounds" == regionToFind || "padding" == regionToFind) return rect
        }
        if ("stretch" == regionToFind) {
          var newStretchRect = Object.assign({}, stage.stretchRect),
            summer = new _Summer.Summer,
            sums = [];
          for (y = 0; y < stage.srcSize.h; y++) {
            summer.reset();
            for (var _x = 0; _x < stage.srcSize.w; _x++) summer.addNext(getPixel_(stage, srcData, _x, y));
            sums.push(summer.compute())
          }
          for (var ranges = getEqualRanges_(sums), _i = 0; _i < ranges.length; _i++) {
            var range = ranges[_i],
              passesThreshold = !1;
            for (x = 0; x < stage.srcSize.w; x++) {
              var _alpha3 = srcData.data[4 * (range.start * stage.srcSize.w + x) + 3];
              if (_alpha3 >= alphaMax - ALPHA_THRESHOLD) {
                passesThreshold = !0;
                break
              }
            }
            if (passesThreshold) {
              newStretchRect.y = range.start, newStretchRect.h = range.length, range.length >= 4 && (newStretchRect.y++, newStretchRect.h -= 2);
              break
            }
          }
          for (summer.reset(), sums = [], x = 0; x < stage.srcSize.w; x++) {
            for (summer.reset(), y = 0; y < stage.srcSize.h; y++) summer.addNext(getPixel_(stage, srcData, x, y));
            sums.push(summer.compute())
          }
          ranges = getEqualRanges_(sums);
          for (var _i2 = 0; _i2 < ranges.length; _i2++) {
            var _range = ranges[_i2],
              _passesThreshold = !1;
            for (y = 0; y < stage.srcSize.h; y++) {
              var _alpha4 = srcData.data[4 * (y * stage.srcSize.w + _range.start) + 3];
              if (_alpha4 >= alphaMax - ALPHA_THRESHOLD) {
                _passesThreshold = !0;
                break
              }
            }
            if (_passesThreshold) {
              newStretchRect.x = _range.start, newStretchRect.w = _range.length, _range.length >= 4 && (newStretchRect.x++, newStretchRect.w -= 2);
              break
            }
          }
          return newStretchRect
        }
        return null
      }
    }
  }, {
    "../../imagelib": 5,
    "./Summer": 18
  }],
  18: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    });
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      MOD_ADLER = 65521,
      Adler32 = function() {
        function Adler32() {
          _classCallCheck(this, Adler32), this.reset()
        }
        return _createClass(Adler32, [{
          key: "reset",
          value: function() {
            this._a = 1, this._b = 0, this._index = 0
          }
        }, {
          key: "addNext",
          value: function(value) {
            this._a = (this._a + value) % MOD_ADLER, this._b = (this._b + this._a) % MOD_ADLER
          }
        }, {
          key: "compute",
          value: function() {
            return this._b << 16 | this._a
          }
        }]), Adler32
      }();
    exports.Summer = Adler32
  }, {}],
  19: [function(require, module, exports) {
    "use strict";

    function hashToParams_(hash) {
      var params = {};
      return hash = hash.replace(/^[?#]/, ""), hash.split("&").forEach(function(entry) {
        var _entry$split = entry.split("=", 2),
          _entry$split2 = _slicedToArray(_entry$split, 2),
          path = _entry$split2[0],
          val = _entry$split2[1];
        path = decodeURIComponent(path || ""), val = decodeURIComponent(val || "");
        var pathArr = path.split("."),
          obj = params;
        pathArr.slice(0, -1).forEach(function(pathPart) {
          obj[pathPart] = obj[pathPart] || {}, obj = obj[pathPart]
        });
        var key = pathArr[pathArr.length - 1];
        key in obj ? Array.isArray(obj[key]) ? obj[key].push(val) : obj[key] = [obj[key], val] : obj[key] = val
      }), params
    }

    function paramsToHash_(params, prefix) {
      var hashArr = [],
        keyPath_ = function(k) {
          return encodeURIComponent((prefix ? prefix + "." : "") + k)
        },
        pushKeyValue_ = function(k, v) {
          v === !1 && (v = 0), v === !0 && (v = 1), hashArr.push(keyPath_(k) + "=" + encodeURIComponent(v.toString()))
        },
        _loop = function(key) {
          var val = params[key];
          return void 0 === val || null === val ? "continue" : void(Array.isArray(val) ? val.forEach(function(v) {
            return pushKeyValue_(key, v)
          }) : "object" == ("undefined" == typeof val ? "undefined" : _typeof(val)) ? hashArr.push(paramsToHash_(val, keyPath_(key))) : pushKeyValue_(key, val))
        };
      for (var key in params) {
        _loop(key)
      }
      return hashArr.join("&")
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.Hash = void 0;
    var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj) {
        return typeof obj
      } : function(obj) {
        return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj
      },
      _slicedToArray = function() {
        function sliceIterator(arr, i) {
          var _arr = [],
            _n = !0,
            _d = !1,
            _e = void 0;
          try {
            for (var _s, _i = arr[Symbol.iterator](); !(_n = (_s = _i.next()).done) && (_arr.push(_s.value), !i || _arr.length !== i); _n = !0);
          } catch (err) {
            _d = !0, _e = err
          } finally {
            try {
              !_n && _i.return && _i.return()
            } finally {
              if (_d) throw _e
            }
          }
          return _arr
        }
        return function(arr, i) {
          if (Array.isArray(arr)) return arr;
          if (Symbol.iterator in Object(arr)) return sliceIterator(arr, i);
          throw new TypeError("Invalid attempt to destructure non-iterable instance")
        }
      }(),
      _Util = require("./Util");
    exports.Hash = {
      bindFormToDocumentHash: function(form) {
        var _this = this;
        if (this.boundForm_) return void console.error("already bound to a form");
        this.boundForm_ = form, form.onChange(_Util.Util.debounce(100, function() {
          _this.currentHash_ = paramsToHash_(form.getValuesSerialized()), window.history.replaceState({}, "", "#" + _this.currentHash_)
        }));
        var maybeUpdateHash_ = function() {
          var newHash = paramsToHash_(hashToParams_((document.location.href.match(/#.*/) || [""])[0]));
          newHash != _this.currentHash_ && (form.setValuesSerialized(hashToParams_(newHash)), _this.currentHash_ = newHash)
        };
        $(window).on("hashchange", maybeUpdateHash_), maybeUpdateHash_()
      }
    }
  }, {
    "./Util": 20
  }],
  20: [function(require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: !0
    });
    var _Promise = "undefined" == typeof Promise ? require("es6-promise").Promise : Promise,
      Util = exports.Util = {
        getMultBaseMdpi: function(density) {
          switch (density) {
            case "xxxhdpi":
              return 4;
            case "xxhdpi":
              return 3;
            case "xhdpi":
              return 2;
            case "hdpi":
              return 1.5;
            case "tvdpi":
              return 1.33125;
            case "mdpi":
              return 1;
            case "ldpi":
              return .75
          }
          return 1
        },
        getDpiForDensity: function(density) {
          switch (density) {
            case "xxxhdpi":
              return 640;
            case "xxhdpi":
              return 480;
            case "xhdpi":
              return 320;
            case "hdpi":
              return 240;
            case "tvdpi":
              return 213;
            case "mdpi":
              return 160;
            case "ldpi":
              return 120
          }
          return 160
        },
        mult: function(s, _mult) {
          var d = {};
          for (var k in s) d[k] = s[k] * _mult;
          return d
        },
        multRound: function(s, mult) {
          var d = {};
          for (var k in s) d[k] = Math.round(s[k] * mult);
          return d
        },
        sanitizeResourceName: function(s) {
          return s.toLowerCase().replace(/[\s-\.]/g, "_").replace(/[^\w_]/g, "")
        },
        downloadFile: function(content, filename) {
          var anchor = $("<a>").hide().appendTo(document.body),
            blob = content;
          content instanceof Blob || (blob = new Blob([content], {
            type: "application/octet-stream"
          }));
          var url = window.URL.createObjectURL(blob);
          anchor.attr({
            href: url,
            download: filename
          }), anchor.get(0).click(), setTimeout(function() {
            anchor.remove(), window.URL.revokeObjectURL(url)
          }, 5e3)
        },
        loadImageFromUri: function(uri) {
          return new _Promise(function(resolve, reject) {
            var img = document.createElement("img");
            img.onload = function() {
              return resolve(img)
            }, img.onerror = function() {
              return reject()
            }, img.src = uri
          })
        },
        debugCtx: function(ctx) {
          Util.debugCtx.$lastEl && Util.debugCtx.$lastEl.remove(), Util.debugCtx.$lastEl = $("<img>").css({
            position: "fixed",
            top: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: "rgba(255, 0, 0, 0.5)",
            pointerEvents: "none"
          }).attr("src", ctx.canvas.toDataURL()).appendTo(document.body)
        },
        debounce: function(delay, fn) {
          var timeout = void 0;
          return function() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
            timeout && clearTimeout(timeout), timeout = setTimeout(function() {
              fn.apply(void 0, args), timeout = null
            }, delay)
          }
        }
      }
  }, {
    "es6-promise": 33
  }],
  21: [function(require, module, exports) {
    "use strict";

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      }
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.Zip = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _zipjsBrowserify = require("zipjs-browserify"),
      _zipjsBrowserify2 = _interopRequireDefault(_zipjsBrowserify),
      _Util = require("./Util"),
      DownloadZipButton = (window.URL || window.webkitURL || window.mozURL, exports.Zip = {
        createDownloadifyZipButton: function(element, options) {
          return new DownloadZipButton(element, options)
        }
      }, function() {
        function DownloadZipButton(element, options) {
          var _this = this;
          _classCallCheck(this, DownloadZipButton), this.fileSpecs_ = [], this.el_ = element, this.el_.click(function() {
            return _this.generateAndDownloadZipFile_()
          }), this.updateUI_()
        }
        return _createClass(DownloadZipButton, [{
          key: "setZipFilename",
          value: function(zipFilename) {
            this.zipFilename_ = zipFilename
          }
        }, {
          key: "clear",
          value: function() {
            this.fileSpecs_ = [], this.updateUI_()
          }
        }, {
          key: "add",
          value: function(spec) {
            this.fileSpecs_.push(spec), this.updateUI_()
          }
        }, {
          key: "updateUI_",
          value: function() {
            this.fileSpecs_.length && !this.generating_ ? this.el_.removeAttr("disabled") : this.el_.attr("disabled", "disabled")
          }
        }, {
          key: "generateAndDownloadZipFile_",
          value: function() {
            var _this2 = this,
              filename = this.zipFilename_ || "output.zip";
            this.fileSpecs_.length && (this.isGenerating_ = !0, this.updateUI_(), _zipjsBrowserify2.default.createWriter(new _zipjsBrowserify2.default.BlobWriter, function(writer) {
              var i = -1,
                nextFile_ = function nextFile_() {
                  if (++i, i >= _this2.fileSpecs_.length) writer.close(function(blob) {
                    return _Util.Util.downloadFile(blob, filename)
                  }), _this2.isGenerating_ = !1, _this2.updateUI_();
                  else {
                    var fileSpec = _this2.fileSpecs_[i];
                    writer.add(fileSpec.name, fileSpec.canvas ? new _zipjsBrowserify2.default.Data64URIReader(fileSpec.canvas.toDataURL()) : new _zipjsBrowserify2.default.TextReader(fileSpec.textData), nextFile_)
                  }
                };
              nextFile_()
            }, function(error) {
              console.error(error), _this2.isGenerating_ = !1, _this2.updateUI_()
            }))
          }
        }]), DownloadZipButton
      }())
  }, {
    "./Util": 20,
    "zipjs-browserify": 37
  }],
  22: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.BooleanField = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _EnumField2 = require("./EnumField");
    exports.BooleanField = function(_EnumField) {
      function BooleanField(id, params) {
        _classCallCheck(this, BooleanField);
        var _this = _possibleConstructorReturn(this, (BooleanField.__proto__ || Object.getPrototypeOf(BooleanField)).call(this, id, params));
        return params.options = [{
          id: "1",
          title: params.onText || "Yes"
        }, {
          id: "0",
          title: params.offText || "No"
        }], params.defaultValue = params.defaultValue ? "1" : "0", params.buttons = !0, _this
      }
      return _inherits(BooleanField, _EnumField), _createClass(BooleanField, [{
        key: "getValue",
        value: function() {
          return "1" == _get(BooleanField.prototype.__proto__ || Object.getPrototypeOf(BooleanField.prototype), "getValue", this).call(this)
        }
      }, {
        key: "setValue",
        value: function(val, pauseUi) {
          _get(BooleanField.prototype.__proto__ || Object.getPrototypeOf(BooleanField.prototype), "setValue", this).call(this, val ? "1" : "0", pauseUi)
        }
      }, {
        key: "serializeValue",
        value: function() {
          return this.getValue() ? "1" : "0"
        }
      }, {
        key: "deserializeValue",
        value: function(s) {
          this.setValue("1" == s)
        }
      }]), BooleanField
    }(_EnumField2.EnumField)
  }, {
    "./EnumField": 24
  }],
  23: [function(require, module, exports) {
    "use strict";

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      }
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.ColorField = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _tinycolor = require("tinycolor2"),
      _tinycolor2 = _interopRequireDefault(_tinycolor),
      _Field2 = require("./Field");
    exports.ColorField = function(_Field) {
      function ColorField() {
        return _classCallCheck(this, ColorField), _possibleConstructorReturn(this, (ColorField.__proto__ || Object.getPrototypeOf(ColorField)).apply(this, arguments))
      }
      return _inherits(ColorField, _Field), _createClass(ColorField, [{
        key: "createUi",
        value: function(container) {
          var _this2 = this,
            fieldContainer = $(".form-field-container", _get(ColorField.prototype.__proto__ || Object.getPrototypeOf(ColorField.prototype), "createUi", this).call(this, container));
          this.el_ = $("<input>").attr("type", "text").attr("id", this.getHtmlId()).appendTo(fieldContainer);
          var update_ = function(color) {
            return _this2.setValue(color, !0)
          };
          this.el_.spectrum({
            color: this.getValue().toRgbString(),
            showInput: !0,
            showPalette: !0,
            showAlpha: this.params_.alpha,
            preferredFormat: "hex",
            palette: [
              ["#ffffff", "#000000"],
              ["#f44336", "#e91e63"],
              ["#9c27b0", "#673ab7"],
              ["#3f51b5", "#2196f3"],
              ["#03a9f4", "#00bcd4"],
              ["#009688", "#4caf50"],
              ["#8bc34a", "#cddc39"],
              ["#ffeb3b", "#ffc107"],
              ["#ff9800", "#ff5722"],
              ["#9e9e9e", "#607d8b"]
            ],
            localStorageKey: "recentcolors",
            showInitial: !0,
            showButtons: !1,
            change: update_,
            move: update_
          })
        }
      }, {
        key: "getValue",
        value: function() {
          return this.value_ || (0, _tinycolor2.default)(this.params_.defaultValue || "#000")
        }
      }, {
        key: "setValue",
        value: function(val, pauseUi) {
          var oldValue = this.value_;
          this.value_ = val.hasOwnProperty("_r") ? val : (0, _tinycolor2.default)(val || this.params_.defaultValue || "#000"), pauseUi || this.el_.spectrum("set", this.value_.toRgbString()), this.notifyChanged_(val, oldValue)
        }
      }, {
        key: "serializeValue",
        value: function() {
          return this.getValue().toRgbString()
        }
      }, {
        key: "deserializeValue",
        value: function(s) {
          this.setValue(s)
        }
      }]), ColorField
    }(_Field2.Field)
  }, {
    "./Field": 25,
    tinycolor2: 35
  }],
  24: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.EnumField = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _Field2 = require("./Field");
    exports.EnumField = function(_Field) {
      function EnumField() {
        return _classCallCheck(this, EnumField), _possibleConstructorReturn(this, (EnumField.__proto__ || Object.getPrototypeOf(EnumField)).apply(this, arguments))
      }
      return _inherits(EnumField, _Field), _createClass(EnumField, [{
        key: "createUi",
        value: function(container) {
          var _this2 = this,
            fieldContainer = $(".form-field-container", _get(EnumField.prototype.__proto__ || Object.getPrototypeOf(EnumField.prototype), "createUi", this).call(this, container));
          this.params_.buttons ? this.el_ = $("<div>").attr("id", this.getHtmlId()).addClass("form-field-buttonset").appendTo(fieldContainer) : (this.el_ = $("<div>").addClass("form-field-select").attr("id", this.getHtmlId()).appendTo(fieldContainer),
            this.selectEl_ = $("<select>").attr("id", this.getHtmlId()).on("input", function(ev) {
              return _this2.setValueInternal_($(ev.currentTarget).val(), !0)
            }).appendTo(this.el_)), this.setOptions(this.params_.options)
        }
      }, {
        key: "setOptions",
        value: function(options) {
          var _this3 = this;
          this.el_ && (options = (options || []).map(function(option) {
            return "string" == typeof option ? {
              id: option,
              title: String(option)
            } : option
          }), this.params_.buttons ? (this.el_.empty(), (options || []).forEach(function(option) {
            $("<input>").attr({
              type: "radio",
              name: _this3.getHtmlId(),
              id: _this3.getHtmlId() + "-" + option.id,
              value: option.id
            }).on("change", function(ev) {
              return _this3.setValueInternal_($(ev.currentTarget).val(), !1)
            }).appendTo(_this3.el_), $("<label>").attr("for", _this3.getHtmlId() + "-" + option.id).attr("tabindex", 0).html(option.title).appendTo(_this3.el_)
          })) : (this.selectEl_.empty(), (options || []).forEach(function(option) {
            return $("<option>").attr("value", option.id).text(option.title).appendTo(_this3.selectEl_)
          })), this.setValueInternal_(this.getValue()))
        }
      }, {
        key: "getValue",
        value: function() {
          var value = this.value_;
          if (void 0 === value && (value = this.params_.defaultValue, void 0 === value && this.params_.options && this.params_.options.length)) {
            var firstOption = this.params_.options[0];
            value = "id" in firstOption ? firstOption.id : String(firstOption)
          }
          return value
        }
      }, {
        key: "setValue",
        value: function(val, pauseUi) {
          this.setValueInternal_(val, pauseUi)
        }
      }, {
        key: "setValueInternal_",
        value: function(val, pauseUi) {
          var oldValue = this.value_;
          this.value_ = val, pauseUi || (this.params_.buttons ? this.el_.find("input").each(function(i, el) {
            return $(el).prop("checked", $(el).val() == val)
          }) : this.selectEl_.val(val)), this.notifyChanged_(val, oldValue)
        }
      }, {
        key: "serializeValue",
        value: function() {
          return this.getValue()
        }
      }, {
        key: "deserializeValue",
        value: function(s) {
          this.setValue(s)
        }
      }]), EnumField
    }(_Field2.Field)
  }, {
    "./Field": 25
  }],
  25: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    });
    var _createClass = function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
        }
      }
      return function(Constructor, protoProps, staticProps) {
        return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
      }
    }();
    exports.Field = function() {
      function Field(id, params) {
        _classCallCheck(this, Field), this.id_ = id, this.params_ = params, this.params_.onChange && this.onChange(this.params_.onChange), this.enabled_ = !0
      }
      return _createClass(Field, [{
        key: "setForm_",
        value: function(form) {
          var _this = this;
          this.form_ = form, this.onChange(function(newValue, oldValue) {
            _this.form_.notifyChanged_(_this, newValue, oldValue)
          })
        }
      }, {
        key: "getLongId",
        value: function() {
          return this.form_.id_ + "-" + this.id_
        }
      }, {
        key: "getHtmlId",
        value: function() {
          return "_frm-" + this.getLongId()
        }
      }, {
        key: "createUi",
        value: function(container) {
          return container = $(container), this.baseEl_ = $("<div>").addClass("form-field-outer").addClass(this.params_.newGroup ? "is-new-group" : "").append($("<label>").attr("for", this.getHtmlId()).text(this.params_.title).append($("<div>").addClass("form-field-help-text").css("display", this.params_.helpText ? "" : "none").html(this.params_.helpText))).append($("<div>").addClass("form-field-container")).appendTo(container), this.baseEl_
        }
      }, {
        key: "getEnabled",
        value: function() {
          return this.enabled_
        }
      }, {
        key: "setEnabled",
        value: function(enabled) {
          this.enabled_ = enabled, this.baseEl_ && (enabled ? this.baseEl_.removeAttr("disabled") : this.baseEl_.attr("disabled", "disabled"))
        }
      }, {
        key: "onChange",
        value: function(listener) {
          this.changeListeners_ = (this.changeListeners_ || []).concat([listener])
        }
      }, {
        key: "notifyChanged_",
        value: function(newValue, oldValue) {
          (this.changeListeners_ || []).forEach(function(listener) {
            return listener(newValue, oldValue)
          })
        }
      }]), Field
    }()
  }, {}],
  26: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    });
    var _createClass = function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
        }
      }
      return function(Constructor, protoProps, staticProps) {
        return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
      }
    }();
    exports.Form = function() {
      function Form(params) {
        var _this = this;
        _classCallCheck(this, Form), this.id_ = params.id, this.params_ = params, this.fields_ = params.fields, this.fields_.forEach(function(field) {
          return field.setForm_(_this)
        }), this.fields_.forEach(function(field) {
          return field.createUi(params.container)
        })
      }
      return _createClass(Form, [{
        key: "onChange",
        value: function(listener) {
          this.changeListeners_ = (this.changeListeners_ || []).concat([listener])
        }
      }, {
        key: "notifyChanged_",
        value: function(field, newValue, oldValue) {
          this.pauseNotify_ || (this.changeListeners_ || []).forEach(function(listener) {
            return listener(field, newValue, oldValue)
          })
        }
      }, {
        key: "getValues",
        value: function() {
          var values = {};
          return this.fields_.forEach(function(field) {
            return values[field.id_] = field.getValue()
          }), values
        }
      }, {
        key: "getValuesSerialized",
        value: function() {
          var values = {};
          return this.fields_.forEach(function(field) {
            var value = field.serializeValue ? field.serializeValue() : void 0;
            void 0 !== value && (values[field.id_] = field.serializeValue())
          }), values
        }
      }, {
        key: "setValuesSerialized",
        value: function(serializedValues) {
          this.pauseNotify_ = !0, this.fields_.filter(function(field) {
            return field.id_ in serializedValues && field.deserializeValue
          }).forEach(function(field) {
            return field.deserializeValue(serializedValues[field.id_])
          }), this.pauseNotify_ = !1, this.notifyChanged_()
        }
      }]), Form
    }()
  }, {}],
  27: [function(require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: !0
    });
    exports.CLIPART_NAMES = ["3d_rotation", "ac_unit", "access_alarm", "access_alarms", "access_time", "accessibility", "accessible", "account_balance", "account_balance_wallet", "account_box", "account_circle", "adb", "add", "add_a_photo", "add_alarm", "add_alert", "add_box", "add_circle", "add_circle_outline", "add_location", "add_shopping_cart", "add_to_photos", "add_to_queue", "adjust", "airline_seat_flat", "airline_seat_flat_angled", "airline_seat_individual_suite", "airline_seat_legroom_extra", "airline_seat_legroom_normal", "airline_seat_legroom_reduced", "airline_seat_recline_extra", "airline_seat_recline_normal", "airplanemode_active", "airplanemode_inactive", "airplay", "airport_shuttle", "alarm", "alarm_add", "alarm_off", "alarm_on", "album", "all_inclusive", "all_out", "android", "announcement", "apps", "archive", "arrow_back", "arrow_downward", "arrow_drop_down", "arrow_drop_down_circle", "arrow_drop_up", "arrow_forward", "arrow_upward", "art_track", "aspect_ratio", "assessment", "assignment", "assignment_ind", "assignment_late", "assignment_return", "assignment_returned", "assignment_turned_in", "assistant", "assistant_photo", "attach_file", "attach_money", "attachment", "audiotrack", "autorenew", "av_timer", "backspace", "backup", "battery_alert", "battery_charging_full", "battery_full", "battery_std", "battery_unknown", "beach_access", "beenhere", "block", "bluetooth", "bluetooth_audio", "bluetooth_connected", "bluetooth_disabled", "bluetooth_searching", "blur_circular", "blur_linear", "blur_off", "blur_on", "book", "bookmark", "bookmark_border", "border_all", "border_bottom", "border_clear", "border_color", "border_horizontal", "border_inner", "border_left", "border_outer", "border_right", "border_style", "border_top", "border_vertical", "branding_watermark", "brightness_1", "brightness_2", "brightness_3", "brightness_4", "brightness_5", "brightness_6", "brightness_7", "brightness_auto", "brightness_high", "brightness_low", "brightness_medium", "broken_image", "brush", "bubble_chart", "bug_report", "build", "burst_mode", "business", "business_center", "cached", "cake", "call", "call_end", "call_made", "call_merge", "call_missed", "call_missed_outgoing", "call_received", "call_split", "call_to_action", "camera", "camera_alt", "camera_enhance", "camera_front", "camera_rear", "camera_roll", "cancel", "card_giftcard", "card_membership", "card_travel", "casino", "cast", "cast_connected", "center_focus_strong", "center_focus_weak", "change_history", "chat", "chat_bubble", "chat_bubble_outline", "check", "check_box", "check_box_outline_blank", "check_circle", "chevron_left", "chevron_right", "child_care", "child_friendly", "chrome_reader_mode", "class", "clear", "clear_all", "close", "closed_caption", "cloud", "cloud_circle", "cloud_done", "cloud_download", "cloud_off", "cloud_queue", "cloud_upload", "code", "collections", "collections_bookmark", "color_lens", "colorize", "comment", "compare", "compare_arrows", "computer", "confirmation_number", "contact_mail", "contact_phone", "contacts", "content_copy", "content_cut", "content_paste", "control_point", "control_point_duplicate", "copyright", "create", "create_new_folder", "credit_card", "crop", "crop_16_9", "crop_3_2", "crop_5_4", "crop_7_5", "crop_din", "crop_free", "crop_landscape", "crop_original", "crop_portrait", "crop_rotate", "crop_square", "dashboard", "data_usage", "date_range", "dehaze", "delete", "delete_forever", "delete_sweep", "description", "desktop_mac", "desktop_windows", "details", "developer_board", "developer_mode", "device_hub", "devices", "devices_other", "dialer_sip", "dialpad", "directions", "directions_bike", "directions_boat", "directions_bus", "directions_car", "directions_railway", "directions_run", "directions_subway", "directions_transit", "directions_walk", "disc_full", "dns", "do_not_disturb", "do_not_disturb_alt", "do_not_disturb_off", "do_not_disturb_on", "dock", "domain", "done", "done_all", "donut_large", "donut_small", "drafts", "drag_handle", "drive_eta", "dvr", "edit", "edit_location", "eject", "email", "enhanced_encryption", "equalizer", "error", "error_outline", "euro_symbol", "ev_station", "event", "event_available", "event_busy", "event_note", "event_seat", "exit_to_app", "expand_less", "expand_more", "explicit", "explore", "exposure", "exposure_neg_1", "exposure_neg_2", "exposure_plus_1", "exposure_plus_2", "exposure_zero", "extension", "face", "fast_forward", "fast_rewind", "favorite", "favorite_border", "featured_play_list", "featured_video", "feedback", "fiber_dvr", "fiber_manual_record", "fiber_new", "fiber_pin", "fiber_smart_record", "file_download", "file_upload", "filter", "filter_1", "filter_2", "filter_3", "filter_4", "filter_5", "filter_6", "filter_7", "filter_8", "filter_9", "filter_9_plus", "filter_b_and_w", "filter_center_focus", "filter_drama", "filter_frames", "filter_hdr", "filter_list", "filter_none", "filter_tilt_shift", "filter_vintage", "find_in_page", "find_replace", "fingerprint", "first_page", "fitness_center", "flag", "flare", "flash_auto", "flash_off", "flash_on", "flight", "flight_land", "flight_takeoff", "flip", "flip_to_back", "flip_to_front", "folder", "folder_open", "folder_shared", "folder_special", "font_download", "format_align_center", "format_align_justify", "format_align_left", "format_align_right", "format_bold", "format_clear", "format_color_fill", "format_color_reset", "format_color_text", "format_indent_decrease", "format_indent_increase", "format_line_spacing", "format_list_bulleted", "format_list_numbered", "format_paint", "format_quote", "format_shapes", "format_size", "format_strikethrough", "format_textdirection_l_to_r", "format_textdirection_r_to_l", "format_underlined", "forum", "forward", "forward_10", "forward_30", "forward_5", "free_breakfast", "fullscreen", "fullscreen_exit", "functions", "g_translate", "gamepad", "games", "gavel", "gesture", "get_app", "gif", "golf_course", "gps_fixed", "gps_not_fixed", "gps_off", "grade", "gradient", "grain", "grid_off", "grid_on", "group", "group_add", "group_work", "hd", "hdr_off", "hdr_on", "hdr_strong", "hdr_weak", "headset", "healing", "hearing", "help", "help_outline", "high_quality", "highlight", "highlight_off", "history", "home", "hot_tub", "hotel", "hourglass_empty", "hourglass_full", "http", "https", "image", "image_aspect_ratio", "import_contacts", "import_export", "important_devices", "inbox", "indeterminate_check_box", "info", "info_outline", "input", "insert_chart", "insert_comment", "insert_drive_file", "insert_emoticon", "insert_invitation", "insert_link", "insert_photo", "invert_colors", "invert_colors_off", "iso", "keyboard", "keyboard_arrow_down", "keyboard_arrow_left", "keyboard_arrow_right", "keyboard_arrow_up", "keyboard_backspace", "keyboard_capslock", "keyboard_hide", "keyboard_return", "keyboard_tab", "keyboard_voice", "kitchen", "label", "label_outline", "landscape", "language", "laptop", "laptop_chromebook", "laptop_mac", "laptop_windows", "last_page", "launch", "layers", "layers_clear", "leak_add", "leak_remove", "lens", "library_add", "library_books", "lightbulb_outline", "line_style", "line_weight", "linear_scale", "link", "linked_camera", "list", "live_help", "live_tv", "local_activity", "local_airport", "local_atm", "local_bar", "local_cafe", "local_car_wash", "local_convenience_store", "local_dining", "local_drink", "local_florist", "local_gas_station", "local_grocery_store", "local_hospital", "local_hotel", "local_laundry_service", "local_library", "local_mall", "local_movies", "local_offer", "local_parking", "local_pharmacy", "local_phone", "local_pizza", "local_play", "local_post_office", "local_printshop", "local_see", "local_shipping", "local_taxi", "location_city", "location_disabled", "location_off", "location_on", "location_searching", "lock", "lock_open", "lock_outline", "looks", "looks_3", "looks_4", "looks_5", "looks_6", "looks_one", "looks_two", "loop", "loupe", "low_priority", "loyalty", "mail", "mail_outline", "map", "markunread", "markunread_mailbox", "memory", "menu", "merge_type", "message", "mms", "mode_comment", "mode_edit", "monetization_on", "money_off", "monochrome_photos", "mood", "mood_bad", "more", "more_horiz", "more_vert", "motorcycle", "mouse", "move_to_inbox", "movie", "movie_creation", "movie_filter", "multiline_chart", "my_location", "nature", "nature_people", "navigate_before", "navigate_next", "navigation", "near_me", "network_cell", "network_check", "network_locked", "network_wifi", "new_releases", "next_week", "nfc", "no_encryption", "no_sim", "not_interested", "note", "note", "note_add", "notifications", "notifications_active", "notifications_none", "notifications_off", "notifications_paused", "offline_pin", "ondemand_video", "opacity", "open_in_browser", "open_in_new", "open_with", "pages", "pageview", "palette", "pan_tool", "panorama", "panorama_fish_eye", "panorama_horizontal", "panorama_vertical", "panorama_wide_angle", "party_mode", "pause", "pause_circle_filled", "pause_circle_outline", "payment", "people", "people_outline", "perm_contact_calendar", "perm_data_setting", "perm_device_information", "perm_identity", "perm_media", "perm_phone_msg", "perm_scan_wifi", "person", "person_add", "person_outline", "person_pin", "person_pin_circle", "personal_video", "pets", "phone", "phone_android", "phone_bluetooth_speaker", "phone_forwarded", "phone_in_talk", "phone_iphone", "phone_locked", "phone_missed", "phone_paused", "phonelink", "phonelink_erase", "phonelink_lock", "phonelink_off", "phonelink_ring", "phonelink_setup", "photo", "photo_album", "photo_camera", "photo_filter", "photo_library", "photo_size_select_actual", "photo_size_select_large", "photo_size_select_small", "picture_as_pdf", "picture_in_picture", "picture_in_picture_alt", "pie_chart", "pie_chart_outlined", "pin_drop", "place", "play_arrow", "play_circle_filled", "play_circle_outline", "play_for_work", "playlist_add", "playlist_add_check", "playlist_play", "plus_one", "poll", "polymer", "pool", "portable_wifi_off", "portrait", "power", "power_input", "power_settings_new", "pregnant_woman", "present_to_all", "print", "priority_high", "publish", "query_builder", "question_answer", "queue", "queue_play_next", "radio", "radio_button_checked", "radio_button_unchecked", "rate_review", "receipt", "recent_actors", "record_voice_over", "redeem", "redo", "refresh", "remove", "remove_circle", "remove_circle_outline", "remove_from_queue", "remove_red_eye", "remove_shopping_cart", "reorder", "repeat", "repeat_one", "replay", "replay_10", "replay_30", "replay_5", "reply", "reply_all", "report", "report_problem", "restaurant", "restaurant_menu", "restore", "restore_page", "ring_volume", "room", "room_service", "rotate_90_degrees_ccw", "rotate_left", "rotate_right", "rounded_corner", "router", "rowing", "rss_feed", "rv_hookup", "rv_hookup", "satellite", "save", "scanner", "schedule", "school", "screen_lock_landscape", "screen_lock_portrait", "screen_lock_rotation", "screen_rotation", "screen_share", "sd_card", "sd_storage", "search", "security", "select_all", "send", "sentiment_dissatisfied", "sentiment_neutral", "sentiment_satisfied", "sentiment_very_dissatisfied", "sentiment_very_satisfied", "settings", "settings_applications", "settings_backup_restore", "settings_bluetooth", "settings_brightness", "settings_cell", "settings_ethernet", "settings_input_antenna", "settings_input_component", "settings_input_composite", "settings_input_hdmi", "settings_input_svideo", "settings_overscan", "settings_phone", "settings_power", "settings_remote", "settings_system_daydream", "settings_voice", "share", "shop", "shop_two", "shopping_basket", "shopping_cart", "short_text", "show_chart", "shuffle", "signal_cellular_4_bar", "signal_cellular_connected_no_internet_4_bar", "signal_cellular_no_sim", "signal_cellular_null", "signal_cellular_off", "signal_wifi_4_bar", "signal_wifi_4_bar_lock", "signal_wifi_off", "sim_card", "sim_card_alert", "skip_next", "skip_previous", "slideshow", "slow_motion_video", "smartphone", "smoke_free", "smoking_rooms", "sms", "sms_failed", "snooze", "sort", "sort_by_alpha", "spa", "space_bar", "speaker", "speaker_group", "speaker_notes", "speaker_notes_off", "speaker_phone", "spellcheck", "star", "star_border", "star_half", "stars", "stay_current_landscape", "stay_current_portrait", "stay_primary_landscape", "stay_primary_portrait", "stop", "stop_screen_share", "storage", "store", "store_mall_directory", "straighten", "streetview", "strikethrough_s", "style", "subdirectory_arrow_left", "subdirectory_arrow_right", "subject", "subscriptions", "subtitles", "subway", "supervisor_account", "surround_sound", "swap_calls", "swap_horiz", "swap_vert", "swap_vertical_circle", "switch_camera", "switch_video", "sync", "sync_disabled", "sync_problem", "system_update", "system_update_alt", "tab", "tab_unselected", "tablet", "tablet_android", "tablet_mac", "tag_faces", "tap_and_play", "terrain", "text_fields", "text_format", "textsms", "texture", "theaters", "thumb_down", "thumb_up", "thumbs_up_down", "time_to_leave", "timelapse", "timeline", "timer", "timer_10", "timer_3", "timer_off", "title", "toc", "today", "toll", "tonality", "touch_app", "toys", "track_changes", "train", "tram", "transfer_within_a_station", "transform", "translate", "trending_down", "trending_flat", "trending_up", "tune", "turned_in", "turned_in_not", "tv", "unarchive", "undo", "unfold_less", "unfold_more", "update", "usb", "verified_user", "vertical_align_bottom", "vertical_align_center", "vertical_align_top", "vibration", "video_call", "video_label", "video_library", "videocam", "videocam_off", "videogame_asset", "view_agenda", "view_array", "view_carousel", "view_column", "view_comfy", "view_compact", "view_day", "view_headline", "view_list", "view_module", "view_quilt", "view_stream", "view_week", "vignette", "visibility", "visibility_off", "voice_chat", "voicemail", "volume_down", "volume_mute", "volume_off", "volume_up", "vpn_key", "vpn_lock", "wallpaper", "warning", "watch", "watch_later", "wb_auto", "wb_cloudy", "wb_incandescent", "wb_iridescent", "wb_sunny", "wc", "web", "web_asset", "weekend", "whatshot", "widgets", "wifi", "wifi_lock", "wifi_tethering", "work", "wrap_text", "youtube_searched_for", "zoom_in", "zoom_out", "zoom_out_map"]
  }, {}],
  28: [function(require, module, exports) {
    "use strict";

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      }
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.ImageField = void 0;
    var _slicedToArray = function() {
        function sliceIterator(arr, i) {
          var _arr = [],
            _n = !0,
            _d = !1,
            _e = void 0;
          try {
            for (var _s, _i = arr[Symbol.iterator](); !(_n = (_s = _i.next()).done) && (_arr.push(_s.value), !i || _arr.length !== i); _n = !0);
          } catch (err) {
            _d = !0, _e = err
          } finally {
            try {
              !_n && _i.return && _i.return()
            } finally {
              if (_d) throw _e
            }
          }
          return _arr
        }
        return function(arr, i) {
          if (Array.isArray(arr)) return arr;
          if (Symbol.iterator in Object(arr)) return sliceIterator(arr, i);
          throw new TypeError("Invalid attempt to destructure non-iterable instance")
        }
      }(),
      _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _webfontloader = require("webfontloader"),
      _webfontloader2 = _interopRequireDefault(_webfontloader),
      _Form = require("./Form"),
      _Field2 = require("./Field"),
      _TextField = require("./TextField"),
      _RangeField = require("./RangeField"),
      _BooleanField = require("./BooleanField"),
      _EnumField = require("./EnumField"),
      _Util = require("../Util"),
      _imagelib = require("../../imagelib"),
      _ImageFieldClipart = require("./ImageField-clipart"),
      _Promise = "undefined" == typeof Promise ? require("es6-promise").Promise : Promise,
      WEB_FONTS_API_KEY = "AIzaSyATu95ehqBjxvf8Up72oRvOZOqRovRQvXc",
      WEB_FONTS_API_URL = "https://www.googleapis.com/webfonts/v1/webfonts?key=" + WEB_FONTS_API_KEY + "&fields=items(family)",
      WEB_FONTS_CACHE_TIME = 36e5,
      ImageField = exports.ImageField = function(_Field) {
        function ImageField(id, params) {
          _classCallCheck(this, ImageField);
          var _this = _possibleConstructorReturn(this, (ImageField.__proto__ || Object.getPrototypeOf(ImageField)).call(this, id, params));
          return _this.valueType_ = null, _this.textParams_ = {}, _this.imageParams_ = {}, _this.clipartSrc_ = null, _this.lastNotifiedValue_ = {}, _this.spaceFormValues_ = {}, _this
        }
        return _inherits(ImageField, _Field), _createClass(ImageField, [{
          key: "createUi",
          value: function(container) {
            var _this2 = this,
              fieldUI = _get(ImageField.prototype.__proto__ || Object.getPrototypeOf(ImageField.prototype), "createUi", this).call(this, container),
              fieldContainer = $(".form-field-container", fieldUI);
            fieldUI.addClass("form-field-image"), this.setupDropTarget_(fieldUI), this.el_ = $("<div>").attr("id", this.getHtmlId()).addClass("form-field-buttonset").appendTo(fieldContainer);
            var types;
            types = this.params_.imageOnly ? [
              ["image", "Select image"]
            ] : [
              ["image", "Image"],
              ["clipart", "Clipart"],
              ["text", "Text"]
            ];
            var typeEls = {};
            if (types.forEach(function(_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                  id = _ref2[0],
                  label = _ref2[1];
                $("<input>").attr({
                  type: "radio",
                  name: _this2.getHtmlId(),
                  id: _this2.getHtmlId() + "-" + id,
                  value: id
                }).appendTo(_this2.el_), typeEls[id] = $("<label>").attr("for", _this2.getHtmlId() + "-" + id).attr("tabindex", 0).text(label).appendTo(_this2.el_)
              }), this.fileEl_ = $("<input>").addClass("form-image-hidden-file-field").attr({
                id: this.getHtmlId(),
                type: "file",
                accept: "image/*"
              }).on("change", function() {
                return _this2.loadImage_(_this2.fileEl_.get(0).files)
              }).appendTo(this.el_), typeEls.image.click(function(evt) {
                return _this2.fileEl_.trigger("click"), _this2.setValueType_(null), _this2.renderValueAndNotifyChanged_(), evt.preventDefault(), !1
              }), !this.params_.imageOnly) {
              var clipartAttributionEl, textParamsEl;
              !function() {
                var clipartParamsEl = $("<div>").addClass("form-image-type-params form-image-type-params-clipart is-hidden").appendTo(fieldContainer),
                  clipartListEl = $("<div>").addClass("form-image-clipart-list").addClass("cancel-parent-scroll").appendTo(clipartParamsEl);
                _ImageFieldClipart.CLIPART_NAMES.forEach(function(clipartSrc) {
                  $("<div>").addClass("form-image-clipart-item").attr("data-name", clipartSrc).attr("title", clipartSrc).text(clipartSrc).click(function() {
                    return _this2.loadClipart_(clipartSrc)
                  }).appendTo(clipartListEl)
                }), _this2.$clipartItems = clipartListEl.find(".form-image-clipart-item");
                $("<input>").addClass("form-image-clipart-filter").attr("placeholder", "Find clipart").on("input", function(ev) {
                  var $filter = $(ev.currentTarget),
                    val = $filter.val().toLowerCase().replace(/[^\w]+/g, "");
                  val ? _this2.$clipartItems.each(function(_, item) {
                    $(item).toggle($(item).attr("title").indexOf(val) >= 0)
                  }) : _this2.$clipartItems.show()
                }).prependTo(clipartParamsEl);
                clipartAttributionEl = $("<div>").addClass("form-image-clipart-attribution").html('\n              For clipart sources, visit\n              <a target="_blank"\n                 class="external-link"\n                 href="https://github.com/google/material-design-icons">\n              Material Design Icons on GitHub</a>\n              ').appendTo(clipartParamsEl), typeEls.clipart.click(function(evt) {
                  _this2.setValueType_("clipart"), _this2.renderValueAndNotifyChanged_()
                }), textParamsEl = $("<div>").addClass("form-subform form-image-type-params form-image-type-params-text is-hidden").appendTo(fieldContainer);
                var fontFamilyField = void 0;
                _this2.textForm_ = new _Form.Form({
                  id: _this2.form_.id_ + "-" + _this2.id_ + "-textform",
                  container: textParamsEl,
                  fields: [new _TextField.TextField("text", {
                    title: "Text"
                  }), fontFamilyField = new _EnumField.EnumField("font", {
                    title: "Font",
                    helpText: "From fonts.google.com"
                  })]
                }), _this2.loadGoogleWebFontsList_().then(function(fonts) {
                  return fontFamilyField.setOptions([""].concat(fonts))
                });
                var tryLoadWebFontDebounced_ = _Util.Util.debounce(500, function() {
                  return _this2.tryLoadWebFont_()
                });
                _this2.textForm_.onChange(function() {
                  var values = _this2.textForm_.getValues();
                  _this2.textParams_.text = values.text, _this2.textParams_.fontStack = values.font || "Roboto, sans-serif", tryLoadWebFontDebounced_(), _this2.renderValueAndNotifyChanged_()
                }), typeEls.text.click(function(evt) {
                  _this2.setValueType_("text"), _this2.renderValueAndNotifyChanged_()
                })
              }()
            }
            if (this.params_.noTrimForm) this.spaceFormValues_ = {};
            else {
              var spaceFormContainer = $("<div>").addClass("form-subform").appendTo(fieldContainer);
              this.spaceFormValues_ = {}, this.spaceForm_ = new _Form.Form({
                id: this.form_.id_ + "-" + this.id_ + "-spaceform",
                container: spaceFormContainer,
                fields: [this.spaceFormTrimField_ = new _BooleanField.BooleanField("trim", {
                  title: "Trim whitespace",
                  defaultValue: !0,
                  offText: "Don't trim",
                  onText: "Trim"
                }), this.spaceFormPaddingField_ = new _RangeField.RangeField("pad", {
                  title: "Padding",
                  defaultValue: this.params_.defaultValuePadding || 0,
                  min: -.1,
                  max: .5,
                  step: .05,
                  textFn: function(v) {
                    return (100 * v).toFixed(0) + "%"
                  }
                })]
              }), this.spaceForm_.onChange(function() {
                _this2.spaceFormValues_ = _this2.spaceForm_.getValues(), _this2.renderValueAndNotifyChanged_()
              }), this.spaceFormValues_ = this.spaceForm_.getValues()
            }
            this.params_.noPreview || (this.imagePreview_ = $("<canvas>").addClass("form-image-preview").hide().appendTo(fieldContainer.parent())), this.params_.defaultValueClipart && setTimeout(function() {
              _this2.valueType_ || _this2.loadClipart_(_this2.params_.defaultValueClipart)
            }, 0)
          }
        }, {
          key: "setupDropTarget_",
          value: function(el) {
            var _this3 = this,
              $el = this.params_.dropTarget ? $(this.params_.dropTarget) : $(el),
              enterLeaveTimeout = void 0;
            $el.addClass("form-field-drop-target").on("dragenter", function(ev) {
              ev.preventDefault(), enterLeaveTimeout && (clearTimeout(enterLeaveTimeout), enterLeaveTimeout = null), $el.addClass("drag-hover")
            }).on("dragleave", function(ev) {
              ev.preventDefault(), enterLeaveTimeout && clearTimeout(enterLeaveTimeout), enterLeaveTimeout = setTimeout(function() {
                return $el.removeClass("drag-hover")
              }, 100)
            }).on("dragover", function(ev) {
              ev.preventDefault(), enterLeaveTimeout && (clearTimeout(enterLeaveTimeout), enterLeaveTimeout = null), ev.originalEvent.dataTransfer.dropEffect = "copy"
            }).on("drop", function(ev) {
              $el.removeClass("drag-hover"), ev.stopPropagation(), ev.preventDefault(), _this3.loadImage_(ev.originalEvent.dataTransfer.files)
            })
          }
        }, {
          key: "loadImage_",
          value: function(fileList) {
            var _this4 = this;
            ImageField.loadImageFromFileList(fileList).then(function(ret) {
              ret && (_this4.setValueType_("image"), _this4.imageParams_ = ret, _this4.imageFilename_ = ret.name.replace(/\.[^.]+?$/, ""), _this4.renderValueAndNotifyChanged_())
            })
          }
        }, {
          key: "loadGoogleWebFontsList_",
          value: function() {
            return new _Promise(function(resolve, reject) {
              if ("assetStudioWebFontsCache" in localStorage) {
                var _JSON$parse = JSON.parse(localStorage.assetStudioWebFontsCache),
                  fetchTime = _JSON$parse.fetchTime,
                  fonts = _JSON$parse.fonts;
                if (Number(new Date) - fetchTime < WEB_FONTS_CACHE_TIME) return void resolve(fonts)
              }
              $.ajax({
                url: WEB_FONTS_API_URL,
                dataType: "json"
              }).then(function(data) {
                var fonts = data.items.map(function(item) {
                  return item.family
                });
                localStorage.assetStudioWebFontsCache = JSON.stringify({
                  fetchTime: Number(new Date),
                  fonts: fonts
                }), resolve(fonts)
              }, function(e) {
                return reject(e)
              })
            })
          }
        }, {
          key: "tryLoadWebFont_",
          value: function() {
            var _this5 = this,
              desiredFont = this.textForm_.getValues().font;
            this.loadedWebFont_ != desiredFont && desiredFont && _webfontloader2.default.load({
              google: {
                families: [desiredFont]
              },
              active: function() {
                _this5.loadedWebFont_ = desiredFont, _this5.renderValueAndNotifyChanged_()
              }
            })
          }
        }, {
          key: "setValueType_",
          value: function(type) {
            this.valueType_ = type, $("input", this.el_).prop("checked", !1), $(".form-image-type-params", this.el_.parent()).addClass("is-hidden"), type && ($("#" + this.getHtmlId() + "-" + type).prop("checked", !0), $(".form-image-type-params-" + type, this.el_.parent()).removeClass("is-hidden")), this.spaceForm_ && (this.spaceFormTrimField_.setEnabled(!0), this.spaceFormPaddingField_.setEnabled(!0), "clipart" == type ? this.params_.clipartNoTrimPadding && (this.spaceFormTrimField_.setEnabled(!1), this.spaceFormTrimField_.setValue(!1), this.spaceFormPaddingField_.setEnabled(!1), this.spaceFormPaddingField_.setValue(0)) : "text" == type && (this.spaceFormTrimField_.setEnabled(!1), this.spaceFormTrimField_.setValue(!0)))
          }
        }, {
          key: "loadClipart_",
          value: function(clipartSrc) {
            this.$clipartItems.removeClass("is-selected"), this.$clipartItems.filter('[data-name="' + clipartSrc + '"]').addClass("is-selected"), this.setValueType_("clipart"), this.clipartSrc_ = clipartSrc, this.renderValueAndNotifyChanged_()
          }
        }, {
          key: "clearValue",
          value: function() {
            this.valueType_ = null, this.valueCtx_ = null, this.valueOrigImg_ = null, this.fileEl_.val(""), this.imagePreview_ && this.imagePreview_.hide()
          }
        }, {
          key: "getValue",
          value: function() {
            var name = null;
            switch (this.valueType_) {
              case "image":
                name = this.imageFilename_;
                break;
              case "clipart":
                name = this.clipartSrc_;
                break;
              case "text":
                name = this.textParams_.text
            }
            return {
              ctx: this.valueCtx_,
              origImg: this.valueOrigImg_,
              type: this.valueType_,
              name: name
            }
          }
        }, {
          key: "notifyChanged_",
          value: function(newValue, oldValue) {
            _get(ImageField.prototype.__proto__ || Object.getPrototypeOf(ImageField.prototype), "notifyChanged_", this).call(this, newValue, oldValue), this.lastNotifiedValue_ = Object.assign({}, newValue)
          }
        }, {
          key: "renderValueAndNotifyChanged_",
          value: function() {
            var _this6 = this;
            return this.valueType_ ? (this.renderTimeout_ && (clearTimeout(this.renderTimeout_), this.renderTimeout_ = null), this.rendering_ ? void(this.renderTimeout_ = setTimeout(function() {
              return _this6.renderValueAndNotifyChanged_()
            }, 100)) : (this.rendering_ = !0, void this.renderSource_().then(function(_ref3) {
              var ctx = _ref3.ctx,
                size = _ref3.size;
              _this6.computeTrimRect_(ctx, size).then(function(trimRect) {
                var pad = _this6.spaceFormValues_.pad || 0,
                  padPx = Math.round(pad * Math.min(trimRect.w, trimRect.h));
                if (_this6.valueCtx_ = _imagelib.imagelib.Drawing.context({
                    w: trimRect.w + 2 * padPx,
                    h: trimRect.h + 2 * padPx
                  }), _this6.valueCtx_.drawImage(ctx.canvas, trimRect.x, trimRect.y, trimRect.w, trimRect.h, padPx, padPx, trimRect.w, trimRect.h), _this6.imagePreview_) {
                  _this6.imagePreview_.attr({
                    width: _this6.valueCtx_.canvas.width,
                    height: _this6.valueCtx_.canvas.height
                  });
                  var previewCtx = _this6.imagePreview_.get(0).getContext("2d");
                  previewCtx.drawImage(_this6.valueCtx_.canvas, 0, 0), _this6.imagePreview_.show()
                }
                _this6.rendering_ = !1, _this6.notifyChanged_(_this6.getValue(), _this6.lastNotifiedValue_)
              })
            }).catch(function(e) {
              console.error("Error: " + e), _this6.rendering_ = !1, _this6.notifyChanged_(_this6.getValue(), _this6.lastNotifiedValue_)
            }))) : (this.valueCtx_ = null, this.valueOrigImg_ = null, void this.notifyChanged_(this.getValue(), this.lastNotifiedValue_))
          }
        }, {
          key: "renderSource_",
          value: function() {
            var _this7 = this;
            return new _Promise(function(resolve, reject) {
              switch (_this7.valueType_) {
                case "image":
                  _this7.imageParams_.uri ? _Util.Util.loadImageFromUri(_this7.imageParams_.uri).then(function(img) {
                    _this7.valueOrigImg_ = img;
                    var origSize = {
                        w: img.naturalWidth,
                        h: img.naturalHeight
                      },
                      size = Object.assign({}, origSize);
                    _this7.imageParams_.isSvg && _this7.params_.maxFinalSize && (size.w / size.h > _this7.params_.maxFinalSize.w / _this7.params_.maxFinalSize.h ? (size.w = _this7.params_.maxFinalSize.w, size.h = size.w * origSize.h / origSize.w) : (size.h = _this7.params_.maxFinalSize.h, size.w = size.h * origSize.w / origSize.h));
                    var ctx = _imagelib.imagelib.Drawing.context(size);
                    ctx.drawImage(img, 0, 0, origSize.w, origSize.h, 0, 0, size.w, size.h), resolve({
                      ctx: ctx,
                      size: size
                    })
                  }) : reject("no uri");
                  break;
                case "clipart":
                  var size = {
                      w: 1536,
                      h: 1536
                    },
                    ctx = _imagelib.imagelib.Drawing.context(size),
                    text = _this7.clipartSrc_;
                  ctx.fillStyle = "#000", ctx.font = size.h + "px/" + size.h + "px 'Material Icons'", ctx.textBaseline = "alphabetic", ctx.fillText(text, 0, size.h), resolve({
                    ctx: ctx,
                    size: size
                  });
                  break;
                case "text":
                  var size = {
                      w: 6144,
                      h: 1536
                    },
                    textHeight = .75 * size.h,
                    ctx = _imagelib.imagelib.Drawing.context(size),
                    text = _this7.textParams_.text || "";
                  text = " " + text + " ", ctx.fillStyle = "#000", ctx.font = "bold " + textHeight + "px/" + size.h + "px " + _this7.textParams_.fontStack, ctx.textBaseline = "alphabetic", ctx.fillText(text, 0, textHeight), size.w = Math.ceil(Math.min(ctx.measureText(text).width, size.w) || size.w), resolve({
                    ctx: ctx,
                    size: size
                  });
                  break;
                default:
                  reject("No value type")
              }
            })
          }
        }, {
          key: "computeTrimRect_",
          value: function(ctx, size) {
            var _this8 = this;
            return new _Promise(function(resolve, reject) {
              _this8.spaceFormValues_.trim ? (_this8.trimPromise_ && _this8.trimPromise_.worker && _this8.trimPromise_.worker.terminate(), _this8.trimPromise_ = _imagelib.imagelib.Analysis.getTrimRect(ctx, size, 1).then(function(trimRect) {
                var pad = .01 * Math.min(size.w, size.h);
                Object.assign(trimRect, {
                  x: Math.max(Math.floor(trimRect.x - pad), 0),
                  y: Math.max(Math.floor(trimRect.y - pad), 0),
                  w: Math.ceil(trimRect.w + 2 * pad),
                  h: Math.ceil(trimRect.h + 2 * pad)
                }), trimRect.w = Math.min(trimRect.w, size.w - trimRect.x), trimRect.h = Math.min(trimRect.h, size.h - trimRect.y), resolve(trimRect)
              }).catch(reject)) : resolve({
                x: 0,
                y: 0,
                w: size.w,
                h: size.h
              })
            })
          }
        }, {
          key: "serializeValue",
          value: function() {
            var vals = {
              type: this.valueType_,
              clipart: "clipart" == this.valueType_ ? this.clipartSrc_ : null,
              text: "text" == this.valueType_ ? this.textForm_.getValuesSerialized() : null
            };
            return this.spaceForm_ && (vals.space = this.spaceForm_.getValuesSerialized()), vals
          }
        }, {
          key: "deserializeValue",
          value: function(o) {
            o.type && this.setValueType_(o.type), o.space && (this.spaceForm_.setValuesSerialized(o.space), this.spaceFormValues_ = this.spaceForm_.getValues()), o.clipart && "clipart" == this.valueType_ && this.loadClipart_(o.clipart), o.text && "text" == this.valueType_ && (this.textForm_.setValuesSerialized(o.text), this.tryLoadWebFont_())
          }
        }]), ImageField
      }(_Field2.Field);
    ImageField.loadImageFromFileList = function(fileList) {
      return new _Promise(function(resolve, reject) {
        fileList = fileList || [];
        var file = Array.from(fileList).find(function(file) {
          return ImageField.isValidFile_(file)
        });
        if (!file) return alert("Please choose a valid image file (PNG, JPG, GIF, SVG, etc.)"), void resolve(null);
        var isSvg = "image/svg+xml" == file.type,
          fileReader = new FileReader;
        fileReader.onload = function(e) {
          return resolve({
            isSvg: isSvg,
            uri: e.target.result,
            name: file.name
          })
        }, fileReader.onerror = function(e) {
          switch (e.target.error.code) {
            case e.target.error.NOT_FOUND_ERR:
              alert("File not found!");
              break;
            case e.target.error.NOT_READABLE_ERR:
              alert("File is not readable");
              break;
            case e.target.error.ABORT_ERR:
              break;
            default:
              alert("An error occurred reading this file.")
          }
          resolve(null)
        }, fileReader.onabort = function(e) {
          alert("File read cancelled"), resolve(null)
        }, fileReader.readAsDataURL(file)
      })
    }, ImageField.isValidFile_ = function(file) {
      return !!file.type.toLowerCase().match(/^image\//)
    }, $(document).ready(function() {
      $(".cancel-parent-scroll").on("mousewheel DOMMouseScroll", function(e) {
        var delta = e.originalEvent.wheelDelta || -e.originalEvent.detail;
        e.currentTarget.scrollTop -= delta, e.preventDefault()
      })
    })
  }, {
    "../../imagelib": 5,
    "../Util": 20,
    "./BooleanField": 22,
    "./EnumField": 24,
    "./Field": 25,
    "./Form": 26,
    "./ImageField-clipart": 27,
    "./RangeField": 29,
    "./TextField": 30,
    "es6-promise": 33,
    webfontloader: 36
  }],
  29: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.RangeField = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _Field2 = require("./Field");
    exports.RangeField = function(_Field) {
      function RangeField() {
        return _classCallCheck(this, RangeField), _possibleConstructorReturn(this, (RangeField.__proto__ || Object.getPrototypeOf(RangeField)).apply(this, arguments))
      }
      return _inherits(RangeField, _Field), _createClass(RangeField, [{
        key: "createUi",
        value: function(container) {
          var _this2 = this,
            fieldContainer = $(".form-field-container", _get(RangeField.prototype.__proto__ || Object.getPrototypeOf(RangeField.prototype), "createUi", this).call(this, container));
          this.el_ = $("<div>").addClass("form-field-range").attr("id", this.getHtmlId()).appendTo(fieldContainer), this.rangeEl_ = $("<input>").attr("type", "range").attr("min", this.params_.min || 0).attr("max", this.params_.max || 100).attr("step", this.params_.step || 1).on("input", function() {
            return _this2.setValue(Number(_this2.rangeEl_.val()) || 0, !0)
          }).val(this.getValue()).appendTo(this.el_), (this.params_.textFn || this.params_.showText) && (this.params_.textFn = this.params_.textFn || function(d) {
            return d
          }, this.textEl_ = $("<div>").addClass("form-field-range-text").text(this.params_.textFn(this.getValue())).appendTo(this.el_))
        }
      }, {
        key: "getValue",
        value: function() {
          var value = this.value_;
          return "number" != typeof value && (value = this.params_.defaultValue, "number" != typeof value && (value = 0)), value
        }
      }, {
        key: "setValue",
        value: function(val, pauseUi) {
          var oldValue = this.value_;
          this.value_ = val, pauseUi || this.rangeEl_.val(val), this.textEl_ && this.textEl_.text(this.params_.textFn(val)), this.notifyChanged_(val, oldValue)
        }
      }, {
        key: "serializeValue",
        value: function() {
          return this.getValue()
        }
      }, {
        key: "deserializeValue",
        value: function(s) {
          this.setValue(Number(s))
        }
      }]), RangeField
    }(_Field2.Field)
  }, {
    "./Field": 25
  }],
  30: [function(require, module, exports) {
    "use strict";

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) throw new TypeError("Cannot call a class as a function")
    }

    function _possibleConstructorReturn(self, call) {
      if (!self) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return !call || "object" != typeof call && "function" != typeof call ? self : call
    }

    function _inherits(subClass, superClass) {
      if ("function" != typeof superClass && null !== superClass) throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }), superClass && (Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass)
    }
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.TextField = void 0;
    var _createClass = function() {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || !1, descriptor.configurable = !0, "value" in descriptor && (descriptor.writable = !0), Object.defineProperty(target, descriptor.key, descriptor)
          }
        }
        return function(Constructor, protoProps, staticProps) {
          return protoProps && defineProperties(Constructor.prototype, protoProps), staticProps && defineProperties(Constructor, staticProps), Constructor
        }
      }(),
      _get = function get(object, property, receiver) {
        null === object && (object = Function.prototype);
        var desc = Object.getOwnPropertyDescriptor(object, property);
        if (void 0 === desc) {
          var parent = Object.getPrototypeOf(object);
          return null === parent ? void 0 : get(parent, property, receiver)
        }
        if ("value" in desc) return desc.value;
        var getter = desc.get;
        if (void 0 !== getter) return getter.call(receiver)
      },
      _Field2 = require("./Field");
    exports.TextField = function(_Field) {
      function TextField() {
        return _classCallCheck(this, TextField), _possibleConstructorReturn(this, (TextField.__proto__ || Object.getPrototypeOf(TextField)).apply(this, arguments))
      }
      return _inherits(TextField, _Field), _createClass(TextField, [{
        key: "createUi",
        value: function(container) {
          var _this2 = this,
            fieldContainer = $(".form-field-container", _get(TextField.prototype.__proto__ || Object.getPrototypeOf(TextField.prototype), "createUi", this).call(this, container));
          this.el_ = $("<input>").attr("type", "text").attr("placeholder", this.params_.placeholder).addClass("form-field-text").val(this.getValue()).on("input", function(ev) {
            var oldVal = _this2.getValue(),
              newVal = $(ev.currentTarget).val();
            oldVal != newVal && _this2.setValue(newVal, !0)
          }).appendTo(fieldContainer)
        }
      }, {
        key: "getValue",
        value: function() {
          var value = this.value_;
          return "string" != typeof value && (value = this.params_.defaultValue || ""), value
        }
      }, {
        key: "setValue",
        value: function(val, pauseUi) {
          var oldValue = this.value_;
          this.value_ = val, pauseUi || this.el_.val(val), this.notifyChanged_(val, oldValue)
        }
      }, {
        key: "serializeValue",
        value: function() {
          return this.getValue()
        }
      }, {
        key: "deserializeValue",
        value: function(s) {
          this.setValue(s)
        }
      }]), TextField
    }(_Field2.Field)
  }, {
    "./Field": 25
  }],
  31: [function(require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.forms = void 0;
    var _BooleanField = require("./BooleanField"),
      _ColorField = require("./ColorField"),
      _EnumField = require("./EnumField"),
      _Field = require("./Field"),
      _Form = require("./Form"),
      _ImageField = require("./ImageField"),
      _RangeField = require("./RangeField"),
      _TextField = require("./TextField");
    exports.forms = {
      BooleanField: _BooleanField.BooleanField,
      ColorField: _ColorField.ColorField,
      EnumField: _EnumField.EnumField,
      Field: _Field.Field,
      Form: _Form.Form,
      ImageField: _ImageField.ImageField,
      RangeField: _RangeField.RangeField,
      TextField: _TextField.TextField
    }
  }, {
    "./BooleanField": 22,
    "./ColorField": 23,
    "./EnumField": 24,
    "./Field": 25,
    "./Form": 26,
    "./ImageField": 28,
    "./RangeField": 29,
    "./TextField": 30
  }],
  32: [function(require, module, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: !0
    }), exports.studio = void 0;
    var _Hash = require("./Hash"),
      _Util = require("./Util"),
      _Zip = require("./Zip"),
      _forms = require("./forms"),
      studio = exports.studio = {
        Hash: _Hash.Hash,
        Util: _Util.Util,
        Zip: _Zip.Zip
      };
    Object.assign(studio, _forms.forms)
  }, {
    "./Hash": 19,
    "./Util": 20,
    "./Zip": 21,
    "./forms": 31
  }],
  33: [function(require, module, exports) {
    (function(process, global) {
      !function(global, factory) {
        "object" == typeof exports && "undefined" != typeof module ? module.exports = factory() : "function" == typeof define && define.amd ? define(factory) : global.ES6Promise = factory()
      }(this, function() {
        "use strict";

        function objectOrFunction(x) {
          return "function" == typeof x || "object" == typeof x && null !== x
        }

        function isFunction(x) {
          return "function" == typeof x
        }

        function setScheduler(scheduleFn) {
          customSchedulerFn = scheduleFn
        }

        function setAsap(asapFn) {
          asap = asapFn
        }

        function useNextTick() {
          return function() {
            return process.nextTick(flush)
          }
        }

        function useVertxTimer() {
          return "undefined" != typeof vertxNext ? function() {
            vertxNext(flush)
          } : useSetTimeout()
        }

        function useMutationObserver() {
          var iterations = 0,
            observer = new BrowserMutationObserver(flush),
            node = document.createTextNode("");
          return observer.observe(node, {
              characterData: !0
            }),
            function() {
              node.data = iterations = ++iterations % 2
            }
        }

        function useMessageChannel() {
          var channel = new MessageChannel;
          return channel.port1.onmessage = flush,
            function() {
              return channel.port2.postMessage(0)
            }
        }

        function useSetTimeout() {
          var globalSetTimeout = setTimeout;
          return function() {
            return globalSetTimeout(flush, 1)
          }
        }

        function flush() {
          for (var i = 0; i < len; i += 2) {
            var callback = queue[i],
              arg = queue[i + 1];
            callback(arg), queue[i] = void 0, queue[i + 1] = void 0
          }
          len = 0
        }

        function attemptVertx() {
          try {
            var r = require,
              vertx = r("vertx");
            return vertxNext = vertx.runOnLoop || vertx.runOnContext, useVertxTimer()
          } catch (e) {
            return useSetTimeout()
          }
        }

        function then(onFulfillment, onRejection) {
          var _arguments = arguments,
            parent = this,
            child = new this.constructor(noop);
          void 0 === child[PROMISE_ID] && makePromise(child);
          var _state = parent._state;
          return _state ? !function() {
            var callback = _arguments[_state - 1];
            asap(function() {
              return invokeCallback(_state, child, callback, parent._result)
            })
          }() : subscribe(parent, child, onFulfillment, onRejection), child
        }

        function resolve(object) {
          var Constructor = this;
          if (object && "object" == typeof object && object.constructor === Constructor) return object;
          var promise = new Constructor(noop);
          return _resolve(promise, object), promise
        }

        function noop() {}

        function selfFulfillment() {
          return new TypeError("You cannot resolve a promise with itself")
        }

        function cannotReturnOwn() {
          return new TypeError("A promises callback cannot return that same promise.")
        }

        function getThen(promise) {
          try {
            return promise.then
          } catch (error) {
            return GET_THEN_ERROR.error = error, GET_THEN_ERROR
          }
        }

        function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
          try {
            then.call(value, fulfillmentHandler, rejectionHandler)
          } catch (e) {
            return e
          }
        }

        function handleForeignThenable(promise, thenable, then) {
          asap(function(promise) {
            var sealed = !1,
              error = tryThen(then, thenable, function(value) {
                sealed || (sealed = !0, thenable !== value ? _resolve(promise, value) : fulfill(promise, value))
              }, function(reason) {
                sealed || (sealed = !0, _reject(promise, reason))
              }, "Settle: " + (promise._label || " unknown promise"));
            !sealed && error && (sealed = !0, _reject(promise, error))
          }, promise)
        }

        function handleOwnThenable(promise, thenable) {
          thenable._state === FULFILLED ? fulfill(promise, thenable._result) : thenable._state === REJECTED ? _reject(promise, thenable._result) : subscribe(thenable, void 0, function(value) {
            return _resolve(promise, value)
          }, function(reason) {
            return _reject(promise, reason)
          })
        }

        function handleMaybeThenable(promise, maybeThenable, then$$) {
          maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve ? handleOwnThenable(promise, maybeThenable) : then$$ === GET_THEN_ERROR ? _reject(promise, GET_THEN_ERROR.error) : void 0 === then$$ ? fulfill(promise, maybeThenable) : isFunction(then$$) ? handleForeignThenable(promise, maybeThenable, then$$) : fulfill(promise, maybeThenable)
        }

        function _resolve(promise, value) {
          promise === value ? _reject(promise, selfFulfillment()) : objectOrFunction(value) ? handleMaybeThenable(promise, value, getThen(value)) : fulfill(promise, value)
        }

        function publishRejection(promise) {
          promise._onerror && promise._onerror(promise._result), publish(promise)
        }

        function fulfill(promise, value) {
          promise._state === PENDING && (promise._result = value, promise._state = FULFILLED, 0 !== promise._subscribers.length && asap(publish, promise))
        }

        function _reject(promise, reason) {
          promise._state === PENDING && (promise._state = REJECTED, promise._result = reason, asap(publishRejection, promise))
        }

        function subscribe(parent, child, onFulfillment, onRejection) {
          var _subscribers = parent._subscribers,
            length = _subscribers.length;
          parent._onerror = null, _subscribers[length] = child, _subscribers[length + FULFILLED] = onFulfillment, _subscribers[length + REJECTED] = onRejection, 0 === length && parent._state && asap(publish, parent)
        }

        function publish(promise) {
          var subscribers = promise._subscribers,
            settled = promise._state;
          if (0 !== subscribers.length) {
            for (var child = void 0, callback = void 0, detail = promise._result, i = 0; i < subscribers.length; i += 3) child = subscribers[i], callback = subscribers[i + settled], child ? invokeCallback(settled, child, callback, detail) : callback(detail);
            promise._subscribers.length = 0
          }
        }

        function ErrorObject() {
          this.error = null
        }

        function tryCatch(callback, detail) {
          try {
            return callback(detail)
          } catch (e) {
            return TRY_CATCH_ERROR.error = e, TRY_CATCH_ERROR
          }
        }

        function invokeCallback(settled, promise, callback, detail) {
          var hasCallback = isFunction(callback),
            value = void 0,
            error = void 0,
            succeeded = void 0,
            failed = void 0;
          if (hasCallback) {
            if (value = tryCatch(callback, detail), value === TRY_CATCH_ERROR ? (failed = !0, error = value.error, value = null) : succeeded = !0, promise === value) return void _reject(promise, cannotReturnOwn())
          } else value = detail, succeeded = !0;
          promise._state !== PENDING || (hasCallback && succeeded ? _resolve(promise, value) : failed ? _reject(promise, error) : settled === FULFILLED ? fulfill(promise, value) : settled === REJECTED && _reject(promise, value))
        }

        function initializePromise(promise, resolver) {
          try {
            resolver(function(value) {
              _resolve(promise, value)
            }, function(reason) {
              _reject(promise, reason)
            })
          } catch (e) {
            _reject(promise, e)
          }
        }

        function nextId() {
          return id++
        }

        function makePromise(promise) {
          promise[PROMISE_ID] = id++, promise._state = void 0, promise._result = void 0, promise._subscribers = []
        }

        function Enumerator(Constructor, input) {
          this._instanceConstructor = Constructor, this.promise = new Constructor(noop), this.promise[PROMISE_ID] || makePromise(this.promise), isArray(input) ? (this._input = input, this.length = input.length, this._remaining = input.length, this._result = new Array(this.length), 0 === this.length ? fulfill(this.promise, this._result) : (this.length = this.length || 0, this._enumerate(), 0 === this._remaining && fulfill(this.promise, this._result))) : _reject(this.promise, validationError())
        }

        function validationError() {
          return new Error("Array Methods must be provided an Array")
        }

        function all(entries) {
          return new Enumerator(this, entries).promise
        }

        function race(entries) {
          var Constructor = this;
          return new Constructor(isArray(entries) ? function(resolve, reject) {
            for (var length = entries.length, i = 0; i < length; i++) Constructor.resolve(entries[i]).then(resolve, reject)
          } : function(_, reject) {
            return reject(new TypeError("You must pass an array to race."))
          })
        }

        function reject(reason) {
          var Constructor = this,
            promise = new Constructor(noop);
          return _reject(promise, reason), promise
        }

        function needsResolver() {
          throw new TypeError("You must pass a resolver function as the first argument to the promise constructor")
        }

        function needsNew() {
          throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.")
        }

        function Promise(resolver) {
          this[PROMISE_ID] = nextId(), this._result = this._state = void 0, this._subscribers = [], noop !== resolver && ("function" != typeof resolver && needsResolver(), this instanceof Promise ? initializePromise(this, resolver) : needsNew())
        }

        function polyfill() {
          var local = void 0;
          if ("undefined" != typeof global) local = global;
          else if ("undefined" != typeof self) local = self;
          else try {
            local = Function("return this")()
          } catch (e) {
            throw new Error("polyfill failed because global object is unavailable in this environment")
          }
          var P = local.Promise;
          if (P) {
            var promiseToString = null;
            try {
              promiseToString = Object.prototype.toString.call(P.resolve())
            } catch (e) {}
            if ("[object Promise]" === promiseToString && !P.cast) return
          }
          local.Promise = Promise
        }
        var _isArray = void 0;
        _isArray = Array.isArray ? Array.isArray : function(x) {
          return "[object Array]" === Object.prototype.toString.call(x)
        };
        var isArray = _isArray,
          len = 0,
          vertxNext = void 0,
          customSchedulerFn = void 0,
          asap = function(callback, arg) {
            queue[len] = callback, queue[len + 1] = arg, len += 2, 2 === len && (customSchedulerFn ? customSchedulerFn(flush) : scheduleFlush())
          },
          browserWindow = "undefined" != typeof window ? window : void 0,
          browserGlobal = browserWindow || {},
          BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver,
          isNode = "undefined" == typeof self && "undefined" != typeof process && "[object process]" === {}.toString.call(process),
          isWorker = "undefined" != typeof Uint8ClampedArray && "undefined" != typeof importScripts && "undefined" != typeof MessageChannel,
          queue = new Array(1e3),
          scheduleFlush = void 0;
        scheduleFlush = isNode ? useNextTick() : BrowserMutationObserver ? useMutationObserver() : isWorker ? useMessageChannel() : void 0 === browserWindow && "function" == typeof require ? attemptVertx() : useSetTimeout();
        var PROMISE_ID = Math.random().toString(36).substring(16),
          PENDING = void 0,
          FULFILLED = 1,
          REJECTED = 2,
          GET_THEN_ERROR = new ErrorObject,
          TRY_CATCH_ERROR = new ErrorObject,
          id = 0;
        return Enumerator.prototype._enumerate = function() {
          for (var length = this.length, _input = this._input, i = 0; this._state === PENDING && i < length; i++) this._eachEntry(_input[i], i)
        }, Enumerator.prototype._eachEntry = function(entry, i) {
          var c = this._instanceConstructor,
            resolve$$ = c.resolve;
          if (resolve$$ === resolve) {
            var _then = getThen(entry);
            if (_then === then && entry._state !== PENDING) this._settledAt(entry._state, i, entry._result);
            else if ("function" != typeof _then) this._remaining--, this._result[i] = entry;
            else if (c === Promise) {
              var promise = new c(noop);
              handleMaybeThenable(promise, entry, _then), this._willSettleAt(promise, i)
            } else this._willSettleAt(new c(function(resolve$$) {
              return resolve$$(entry)
            }), i)
          } else this._willSettleAt(resolve$$(entry), i)
        }, Enumerator.prototype._settledAt = function(state, i, value) {
          var promise = this.promise;
          promise._state === PENDING && (this._remaining--, state === REJECTED ? _reject(promise, value) : this._result[i] = value), 0 === this._remaining && fulfill(promise, this._result)
        }, Enumerator.prototype._willSettleAt = function(promise, i) {
          var enumerator = this;
          subscribe(promise, void 0, function(value) {
            return enumerator._settledAt(FULFILLED, i, value)
          }, function(reason) {
            return enumerator._settledAt(REJECTED, i, reason)
          })
        }, Promise.all = all, Promise.race = race, Promise.resolve = resolve, Promise.reject = reject, Promise._setScheduler = setScheduler, Promise._setAsap = setAsap, Promise._asap = asap, Promise.prototype = {
          constructor: Promise,
          then: then,
          catch: function(onRejection) {
            return this.then(null, onRejection)
          }
        }, Promise.polyfill = polyfill, Promise.Promise = Promise, Promise
      })
    }).call(this, require("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
  }, {
    _process: 34
  }],
  34: [function(require, module, exports) {
    function defaultSetTimout() {
      throw new Error("setTimeout has not been defined")
    }

    function defaultClearTimeout() {
      throw new Error("clearTimeout has not been defined")
    }

    function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) return setTimeout(fun, 0);
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) return cachedSetTimeout = setTimeout, setTimeout(fun, 0);
      try {
        return cachedSetTimeout(fun, 0)
      } catch (e) {
        try {
          return cachedSetTimeout.call(null, fun, 0)
        } catch (e) {
          return cachedSetTimeout.call(this, fun, 0)
        }
      }
    }

    function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) return clearTimeout(marker);
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) return cachedClearTimeout = clearTimeout, clearTimeout(marker);
      try {
        return cachedClearTimeout(marker)
      } catch (e) {
        try {
          return cachedClearTimeout.call(null, marker)
        } catch (e) {
          return cachedClearTimeout.call(this, marker)
        }
      }
    }

    function cleanUpNextTick() {
      draining && currentQueue && (draining = !1, currentQueue.length ? queue = currentQueue.concat(queue) : queueIndex = -1, queue.length && drainQueue())
    }

    function drainQueue() {
      if (!draining) {
        var timeout = runTimeout(cleanUpNextTick);
        draining = !0;
        for (var len = queue.length; len;) {
          for (currentQueue = queue, queue = []; ++queueIndex < len;) currentQueue && currentQueue[queueIndex].run();
          queueIndex = -1, len = queue.length
        }
        currentQueue = null, draining = !1, runClearTimeout(timeout)
      }
    }

    function Item(fun, array) {
      this.fun = fun, this.array = array
    }

    function noop() {}
    var cachedSetTimeout, cachedClearTimeout, process = module.exports = {};
    !function() {
      try {
        cachedSetTimeout = "function" == typeof setTimeout ? setTimeout : defaultSetTimout
      } catch (e) {
        cachedSetTimeout = defaultSetTimout
      }
      try {
        cachedClearTimeout = "function" == typeof clearTimeout ? clearTimeout : defaultClearTimeout
      } catch (e) {
        cachedClearTimeout = defaultClearTimeout
      }
    }();
    var currentQueue, queue = [],
      draining = !1,
      queueIndex = -1;
    process.nextTick = function(fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1)
        for (var i = 1; i < arguments.length; i++) args[i - 1] = arguments[i];
      queue.push(new Item(fun, args)), 1 !== queue.length || draining || runTimeout(drainQueue)
    }, Item.prototype.run = function() {
      this.fun.apply(null, this.array)
    }, process.title = "browser", process.browser = !0, process.env = {}, process.argv = [], process.version = "", process.versions = {}, process.on = noop, process.addListener = noop, process.once = noop, process.off = noop, process.removeListener = noop, process.removeAllListeners = noop, process.emit = noop, process.binding = function(name) {
      throw new Error("process.binding is not supported")
    }, process.cwd = function() {
      return "/"
    }, process.chdir = function(dir) {
      throw new Error("process.chdir is not supported")
    }, process.umask = function() {
      return 0
    }
  }, {}],
  35: [function(require, module, exports) {
    !function(Math) {
      function tinycolor(color, opts) {
        if (color = color ? color : "", opts = opts || {}, color instanceof tinycolor) return color;
        if (!(this instanceof tinycolor)) return new tinycolor(color, opts);
        var rgb = inputToRGB(color);
        this._originalInput = color, this._r = rgb.r, this._g = rgb.g, this._b = rgb.b, this._a = rgb.a, this._roundA = mathRound(100 * this._a) / 100, this._format = opts.format || rgb.format, this._gradientType = opts.gradientType, this._r < 1 && (this._r = mathRound(this._r)), this._g < 1 && (this._g = mathRound(this._g)), this._b < 1 && (this._b = mathRound(this._b)), this._ok = rgb.ok, this._tc_id = tinyCounter++
      }

      function inputToRGB(color) {
        var rgb = {
            r: 0,
            g: 0,
            b: 0
          },
          a = 1,
          s = null,
          v = null,
          l = null,
          ok = !1,
          format = !1;
        return "string" == typeof color && (color = stringInputToObject(color)), "object" == typeof color && (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b) ? (rgb = rgbToRgb(color.r, color.g, color.b), ok = !0, format = "%" === String(color.r).substr(-1) ? "prgb" : "rgb") : isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v) ? (s = convertToPercentage(color.s), v = convertToPercentage(color.v), rgb = hsvToRgb(color.h, s, v), ok = !0, format = "hsv") : isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l) && (s = convertToPercentage(color.s), l = convertToPercentage(color.l), rgb = hslToRgb(color.h, s, l), ok = !0, format = "hsl"), color.hasOwnProperty("a") && (a = color.a)), a = boundAlpha(a), {
          ok: ok,
          format: color.format || format,
          r: mathMin(255, mathMax(rgb.r, 0)),
          g: mathMin(255, mathMax(rgb.g, 0)),
          b: mathMin(255, mathMax(rgb.b, 0)),
          a: a
        }
      }

      function rgbToRgb(r, g, b) {
        return {
          r: 255 * bound01(r, 255),
          g: 255 * bound01(g, 255),
          b: 255 * bound01(b, 255)
        }
      }

      function rgbToHsl(r, g, b) {
        r = bound01(r, 255), g = bound01(g, 255), b = bound01(b, 255);
        var h, s, max = mathMax(r, g, b),
          min = mathMin(r, g, b),
          l = (max + min) / 2;
        if (max == min) h = s = 0;
        else {
          var d = max - min;
          switch (s = l > .5 ? d / (2 - max - min) : d / (max + min), max) {
            case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4
          }
          h /= 6
        }
        return {
          h: h,
          s: s,
          l: l
        }
      }

      function hslToRgb(h, s, l) {
        function hue2rgb(p, q, t) {
          return t < 0 && (t += 1), t > 1 && (t -= 1), t < 1 / 6 ? p + 6 * (q - p) * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
        }
        var r, g, b;
        if (h = bound01(h, 360), s = bound01(s, 100), l = bound01(l, 100), 0 === s) r = g = b = l;
        else {
          var q = l < .5 ? l * (1 + s) : l + s - l * s,
            p = 2 * l - q;
          r = hue2rgb(p, q, h + 1 / 3), g = hue2rgb(p, q, h), b = hue2rgb(p, q, h - 1 / 3)
        }
        return {
          r: 255 * r,
          g: 255 * g,
          b: 255 * b
        }
      }

      function rgbToHsv(r, g, b) {
        r = bound01(r, 255), g = bound01(g, 255), b = bound01(b, 255);
        var h, s, max = mathMax(r, g, b),
          min = mathMin(r, g, b),
          v = max,
          d = max - min;
        if (s = 0 === max ? 0 : d / max, max == min) h = 0;
        else {
          switch (max) {
            case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4
          }
          h /= 6
        }
        return {
          h: h,
          s: s,
          v: v
        }
      }

      function hsvToRgb(h, s, v) {
        h = 6 * bound01(h, 360), s = bound01(s, 100), v = bound01(v, 100);
        var i = Math.floor(h),
          f = h - i,
          p = v * (1 - s),
          q = v * (1 - f * s),
          t = v * (1 - (1 - f) * s),
          mod = i % 6,
          r = [v, q, p, p, t, v][mod],
          g = [t, v, v, q, p, p][mod],
          b = [p, p, t, v, v, q][mod];
        return {
          r: 255 * r,
          g: 255 * g,
          b: 255 * b
        }
      }

      function rgbToHex(r, g, b, allow3Char) {
        var hex = [pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16))];
        return allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) ? hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) : hex.join("")
      }

      function rgbaToHex(r, g, b, a, allow4Char) {
        var hex = [pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16)), pad2(convertDecimalToHex(a))];
        return allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1) ? hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0) : hex.join("")
      }

      function rgbaToArgbHex(r, g, b, a) {
        var hex = [pad2(convertDecimalToHex(a)), pad2(mathRound(r).toString(16)), pad2(mathRound(g).toString(16)), pad2(mathRound(b).toString(16))];
        return hex.join("")
      }

      function desaturate(color, amount) {
        amount = 0 === amount ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        return hsl.s -= amount / 100, hsl.s = clamp01(hsl.s), tinycolor(hsl)
      }

      function saturate(color, amount) {
        amount = 0 === amount ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        return hsl.s += amount / 100, hsl.s = clamp01(hsl.s), tinycolor(hsl)
      }

      function greyscale(color) {
        return tinycolor(color).desaturate(100)
      }

      function lighten(color, amount) {
        amount = 0 === amount ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        return hsl.l += amount / 100, hsl.l = clamp01(hsl.l), tinycolor(hsl)
      }

      function brighten(color, amount) {
        amount = 0 === amount ? 0 : amount || 10;
        var rgb = tinycolor(color).toRgb();
        return rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * -(amount / 100)))), rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * -(amount / 100)))), rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * -(amount / 100)))), tinycolor(rgb)
      }

      function darken(color, amount) {
        amount = 0 === amount ? 0 : amount || 10;
        var hsl = tinycolor(color).toHsl();
        return hsl.l -= amount / 100, hsl.l = clamp01(hsl.l), tinycolor(hsl)
      }

      function spin(color, amount) {
        var hsl = tinycolor(color).toHsl(),
          hue = (hsl.h + amount) % 360;
        return hsl.h = hue < 0 ? 360 + hue : hue, tinycolor(hsl)
      }

      function complement(color) {
        var hsl = tinycolor(color).toHsl();
        return hsl.h = (hsl.h + 180) % 360, tinycolor(hsl)
      }

      function triad(color) {
        var hsl = tinycolor(color).toHsl(),
          h = hsl.h;
        return [tinycolor(color), tinycolor({
          h: (h + 120) % 360,
          s: hsl.s,
          l: hsl.l
        }), tinycolor({
          h: (h + 240) % 360,
          s: hsl.s,
          l: hsl.l
        })]
      }

      function tetrad(color) {
        var hsl = tinycolor(color).toHsl(),
          h = hsl.h;
        return [tinycolor(color), tinycolor({
          h: (h + 90) % 360,
          s: hsl.s,
          l: hsl.l
        }), tinycolor({
          h: (h + 180) % 360,
          s: hsl.s,
          l: hsl.l
        }), tinycolor({
          h: (h + 270) % 360,
          s: hsl.s,
          l: hsl.l
        })]
      }

      function splitcomplement(color) {
        var hsl = tinycolor(color).toHsl(),
          h = hsl.h;
        return [tinycolor(color), tinycolor({
          h: (h + 72) % 360,
          s: hsl.s,
          l: hsl.l
        }), tinycolor({
          h: (h + 216) % 360,
          s: hsl.s,
          l: hsl.l
        })]
      }

      function analogous(color, results, slices) {
        results = results || 6, slices = slices || 30;
        var hsl = tinycolor(color).toHsl(),
          part = 360 / slices,
          ret = [tinycolor(color)];
        for (hsl.h = (hsl.h - (part * results >> 1) + 720) % 360; --results;) hsl.h = (hsl.h + part) % 360, ret.push(tinycolor(hsl));
        return ret
      }

      function monochromatic(color, results) {
        results = results || 6;
        for (var hsv = tinycolor(color).toHsv(), h = hsv.h, s = hsv.s, v = hsv.v, ret = [], modification = 1 / results; results--;) ret.push(tinycolor({
          h: h,
          s: s,
          v: v
        })), v = (v + modification) % 1;
        return ret
      }

      function flip(o) {
        var flipped = {};
        for (var i in o) o.hasOwnProperty(i) && (flipped[o[i]] = i);
        return flipped
      }

      function boundAlpha(a) {
        return a = parseFloat(a), (isNaN(a) || a < 0 || a > 1) && (a = 1), a
      }

      function bound01(n, max) {
        isOnePointZero(n) && (n = "100%");
        var processPercent = isPercentage(n);
        return n = mathMin(max, mathMax(0, parseFloat(n))), processPercent && (n = parseInt(n * max, 10) / 100), Math.abs(n - max) < 1e-6 ? 1 : n % max / parseFloat(max)
      }

      function clamp01(val) {
        return mathMin(1, mathMax(0, val))
      }

      function parseIntFromHex(val) {
        return parseInt(val, 16)
      }

      function isOnePointZero(n) {
        return "string" == typeof n && n.indexOf(".") != -1 && 1 === parseFloat(n)
      }

      function isPercentage(n) {
        return "string" == typeof n && n.indexOf("%") != -1
      }

      function pad2(c) {
        return 1 == c.length ? "0" + c : "" + c
      }

      function convertToPercentage(n) {
        return n <= 1 && (n = 100 * n + "%"), n
      }

      function convertDecimalToHex(d) {
        return Math.round(255 * parseFloat(d)).toString(16)
      }

      function convertHexToDecimal(h) {
        return parseIntFromHex(h) / 255
      }

      function isValidCSSUnit(color) {
        return !!matchers.CSS_UNIT.exec(color)
      }

      function stringInputToObject(color) {
        color = color.replace(trimLeft, "").replace(trimRight, "").toLowerCase();
        var named = !1;
        if (names[color]) color = names[color], named = !0;
        else if ("transparent" == color) return {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
          format: "name"
        };
        var match;
        return (match = matchers.rgb.exec(color)) ? {
          r: match[1],
          g: match[2],
          b: match[3]
        } : (match = matchers.rgba.exec(color)) ? {
          r: match[1],
          g: match[2],
          b: match[3],
          a: match[4]
        } : (match = matchers.hsl.exec(color)) ? {
          h: match[1],
          s: match[2],
          l: match[3]
        } : (match = matchers.hsla.exec(color)) ? {
          h: match[1],
          s: match[2],
          l: match[3],
          a: match[4]
        } : (match = matchers.hsv.exec(color)) ? {
          h: match[1],
          s: match[2],
          v: match[3]
        } : (match = matchers.hsva.exec(color)) ? {
          h: match[1],
          s: match[2],
          v: match[3],
          a: match[4]
        } : (match = matchers.hex8.exec(color)) ? {
          r: parseIntFromHex(match[1]),
          g: parseIntFromHex(match[2]),
          b: parseIntFromHex(match[3]),
          a: convertHexToDecimal(match[4]),
          format: named ? "name" : "hex8"
        } : (match = matchers.hex6.exec(color)) ? {
          r: parseIntFromHex(match[1]),
          g: parseIntFromHex(match[2]),
          b: parseIntFromHex(match[3]),
          format: named ? "name" : "hex"
        } : (match = matchers.hex4.exec(color)) ? {
          r: parseIntFromHex(match[1] + "" + match[1]),
          g: parseIntFromHex(match[2] + "" + match[2]),
          b: parseIntFromHex(match[3] + "" + match[3]),
          a: convertHexToDecimal(match[4] + "" + match[4]),
          format: named ? "name" : "hex8"
        } : !!(match = matchers.hex3.exec(color)) && {
          r: parseIntFromHex(match[1] + "" + match[1]),
          g: parseIntFromHex(match[2] + "" + match[2]),
          b: parseIntFromHex(match[3] + "" + match[3]),
          format: named ? "name" : "hex"
        }
      }

      function validateWCAG2Parms(parms) {
        var level, size;
        return parms = parms || {
          level: "AA",
          size: "small"
        }, level = (parms.level || "AA").toUpperCase(), size = (parms.size || "small").toLowerCase(), "AA" !== level && "AAA" !== level && (level = "AA"), "small" !== size && "large" !== size && (size = "small"), {
          level: level,
          size: size
        }
      }
      var trimLeft = /^\s+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        mathRound = Math.round,
        mathMin = Math.min,
        mathMax = Math.max,
        mathRandom = Math.random;
      tinycolor.prototype = {
        isDark: function() {
          return this.getBrightness() < 128
        },
        isLight: function() {
          return !this.isDark()
        },
        isValid: function() {
          return this._ok
        },
        getOriginalInput: function() {
          return this._originalInput
        },
        getFormat: function() {
          return this._format
        },
        getAlpha: function() {
          return this._a
        },
        getBrightness: function() {
          var rgb = this.toRgb();
          return (299 * rgb.r + 587 * rgb.g + 114 * rgb.b) / 1e3
        },
        getLuminance: function() {
          var RsRGB, GsRGB, BsRGB, R, G, B, rgb = this.toRgb();
          return RsRGB = rgb.r / 255, GsRGB = rgb.g / 255, BsRGB = rgb.b / 255, R = RsRGB <= .03928 ? RsRGB / 12.92 : Math.pow((RsRGB + .055) / 1.055, 2.4), G = GsRGB <= .03928 ? GsRGB / 12.92 : Math.pow((GsRGB + .055) / 1.055, 2.4), B = BsRGB <= .03928 ? BsRGB / 12.92 : Math.pow((BsRGB + .055) / 1.055, 2.4), .2126 * R + .7152 * G + .0722 * B
        },
        setAlpha: function(value) {
          return this._a = boundAlpha(value), this._roundA = mathRound(100 * this._a) / 100, this
        },
        toHsv: function() {
          var hsv = rgbToHsv(this._r, this._g, this._b);
          return {
            h: 360 * hsv.h,
            s: hsv.s,
            v: hsv.v,
            a: this._a
          }
        },
        toHsvString: function() {
          var hsv = rgbToHsv(this._r, this._g, this._b),
            h = mathRound(360 * hsv.h),
            s = mathRound(100 * hsv.s),
            v = mathRound(100 * hsv.v);
          return 1 == this._a ? "hsv(" + h + ", " + s + "%, " + v + "%)" : "hsva(" + h + ", " + s + "%, " + v + "%, " + this._roundA + ")"
        },
        toHsl: function() {
          var hsl = rgbToHsl(this._r, this._g, this._b);
          return {
            h: 360 * hsl.h,
            s: hsl.s,
            l: hsl.l,
            a: this._a
          }
        },
        toHslString: function() {
          var hsl = rgbToHsl(this._r, this._g, this._b),
            h = mathRound(360 * hsl.h),
            s = mathRound(100 * hsl.s),
            l = mathRound(100 * hsl.l);
          return 1 == this._a ? "hsl(" + h + ", " + s + "%, " + l + "%)" : "hsla(" + h + ", " + s + "%, " + l + "%, " + this._roundA + ")"
        },
        toHex: function(allow3Char) {
          return rgbToHex(this._r, this._g, this._b, allow3Char)
        },
        toHexString: function(allow3Char) {
          return "#" + this.toHex(allow3Char)
        },
        toHex8: function(allow4Char) {
          return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char)
        },
        toHex8String: function(allow4Char) {
          return "#" + this.toHex8(allow4Char)
        },
        toRgb: function() {
          return {
            r: mathRound(this._r),
            g: mathRound(this._g),
            b: mathRound(this._b),
            a: this._a
          }
        },
        toRgbString: function() {
          return 1 == this._a ? "rgb(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" : "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")"
        },
        toPercentageRgb: function() {
          return {
            r: mathRound(100 * bound01(this._r, 255)) + "%",
            g: mathRound(100 * bound01(this._g, 255)) + "%",
            b: mathRound(100 * bound01(this._b, 255)) + "%",
            a: this._a
          }
        },
        toPercentageRgbString: function() {
          return 1 == this._a ? "rgb(" + mathRound(100 * bound01(this._r, 255)) + "%, " + mathRound(100 * bound01(this._g, 255)) + "%, " + mathRound(100 * bound01(this._b, 255)) + "%)" : "rgba(" + mathRound(100 * bound01(this._r, 255)) + "%, " + mathRound(100 * bound01(this._g, 255)) + "%, " + mathRound(100 * bound01(this._b, 255)) + "%, " + this._roundA + ")"
        },
        toName: function() {
          return 0 === this._a ? "transparent" : !(this._a < 1) && (hexNames[rgbToHex(this._r, this._g, this._b, !0)] || !1)
        },
        toFilter: function(secondColor) {
          var hex8String = "#" + rgbaToArgbHex(this._r, this._g, this._b, this._a),
            secondHex8String = hex8String,
            gradientType = this._gradientType ? "GradientType = 1, " : "";
          if (secondColor) {
            var s = tinycolor(secondColor);
            secondHex8String = "#" + rgbaToArgbHex(s._r, s._g, s._b, s._a)
          }
          return "progid:DXImageTransform.Microsoft.gradient(" + gradientType + "startColorstr=" + hex8String + ",endColorstr=" + secondHex8String + ")"
        },
        toString: function(format) {
          var formatSet = !!format;
          format = format || this._format;
          var formattedString = !1,
            hasAlpha = this._a < 1 && this._a >= 0,
            needsAlphaFormat = !formatSet && hasAlpha && ("hex" === format || "hex6" === format || "hex3" === format || "hex4" === format || "hex8" === format || "name" === format);
          return needsAlphaFormat ? "name" === format && 0 === this._a ? this.toName() : this.toRgbString() : ("rgb" === format && (formattedString = this.toRgbString()), "prgb" === format && (formattedString = this.toPercentageRgbString()), "hex" !== format && "hex6" !== format || (formattedString = this.toHexString()), "hex3" === format && (formattedString = this.toHexString(!0)), "hex4" === format && (formattedString = this.toHex8String(!0)), "hex8" === format && (formattedString = this.toHex8String()), "name" === format && (formattedString = this.toName()), "hsl" === format && (formattedString = this.toHslString()), "hsv" === format && (formattedString = this.toHsvString()), formattedString || this.toHexString())
        },
        clone: function() {
          return tinycolor(this.toString())
        },
        _applyModification: function(fn, args) {
          var color = fn.apply(null, [this].concat([].slice.call(args)));
          return this._r = color._r, this._g = color._g, this._b = color._b, this.setAlpha(color._a), this
        },
        lighten: function() {
          return this._applyModification(lighten, arguments)
        },
        brighten: function() {
          return this._applyModification(brighten, arguments)
        },
        darken: function() {
          return this._applyModification(darken, arguments)
        },
        desaturate: function() {
          return this._applyModification(desaturate, arguments)
        },
        saturate: function() {
          return this._applyModification(saturate, arguments)
        },
        greyscale: function() {
          return this._applyModification(greyscale, arguments)
        },
        spin: function() {
          return this._applyModification(spin, arguments)
        },
        _applyCombination: function(fn, args) {
          return fn.apply(null, [this].concat([].slice.call(args)))
        },
        analogous: function() {
          return this._applyCombination(analogous, arguments)
        },
        complement: function() {
          return this._applyCombination(complement, arguments)
        },
        monochromatic: function() {
          return this._applyCombination(monochromatic, arguments)
        },
        splitcomplement: function() {
          return this._applyCombination(splitcomplement, arguments)
        },
        triad: function() {
          return this._applyCombination(triad, arguments)
        },
        tetrad: function() {
          return this._applyCombination(tetrad, arguments)
        }
      }, tinycolor.fromRatio = function(color, opts) {
        if ("object" == typeof color) {
          var newColor = {};
          for (var i in color) color.hasOwnProperty(i) && ("a" === i ? newColor[i] = color[i] : newColor[i] = convertToPercentage(color[i]));
          color = newColor
        }
        return tinycolor(color, opts)
      }, tinycolor.equals = function(color1, color2) {
        return !(!color1 || !color2) && tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString()
      }, tinycolor.random = function() {
        return tinycolor.fromRatio({
          r: mathRandom(),
          g: mathRandom(),
          b: mathRandom()
        })
      }, tinycolor.mix = function(color1, color2, amount) {
        amount = 0 === amount ? 0 : amount || 50;
        var rgb1 = tinycolor(color1).toRgb(),
          rgb2 = tinycolor(color2).toRgb(),
          p = amount / 100,
          rgba = {
            r: (rgb2.r - rgb1.r) * p + rgb1.r,
            g: (rgb2.g - rgb1.g) * p + rgb1.g,
            b: (rgb2.b - rgb1.b) * p + rgb1.b,
            a: (rgb2.a - rgb1.a) * p + rgb1.a
          };
        return tinycolor(rgba)
      }, tinycolor.readability = function(color1, color2) {
        var c1 = tinycolor(color1),
          c2 = tinycolor(color2);
        return (Math.max(c1.getLuminance(), c2.getLuminance()) + .05) / (Math.min(c1.getLuminance(), c2.getLuminance()) + .05)
      }, tinycolor.isReadable = function(color1, color2, wcag2) {
        var wcag2Parms, out, readability = tinycolor.readability(color1, color2);
        switch (out = !1, wcag2Parms = validateWCAG2Parms(wcag2), wcag2Parms.level + wcag2Parms.size) {
          case "AAsmall":
          case "AAAlarge":
            out = readability >= 4.5;
            break;
          case "AAlarge":
            out = readability >= 3;
            break;
          case "AAAsmall":
            out = readability >= 7
        }
        return out
      }, tinycolor.mostReadable = function(baseColor, colorList, args) {
        var readability, includeFallbackColors, level, size, bestColor = null,
          bestScore = 0;
        args = args || {}, includeFallbackColors = args.includeFallbackColors, level = args.level, size = args.size;
        for (var i = 0; i < colorList.length; i++) readability = tinycolor.readability(baseColor, colorList[i]), readability > bestScore && (bestScore = readability, bestColor = tinycolor(colorList[i]));
        return tinycolor.isReadable(baseColor, bestColor, {
          level: level,
          size: size
        }) || !includeFallbackColors ? bestColor : (args.includeFallbackColors = !1, tinycolor.mostReadable(baseColor, ["#fff", "#000"], args))
      };
      var names = tinycolor.names = {
          aliceblue: "f0f8ff",
          antiquewhite: "faebd7",
          aqua: "0ff",
          aquamarine: "7fffd4",
          azure: "f0ffff",
          beige: "f5f5dc",
          bisque: "ffe4c4",
          black: "000",
          blanchedalmond: "ffebcd",
          blue: "00f",
          blueviolet: "8a2be2",
          brown: "a52a2a",
          burlywood: "deb887",
          burntsienna: "ea7e5d",
          cadetblue: "5f9ea0",
          chartreuse: "7fff00",
          chocolate: "d2691e",
          coral: "ff7f50",
          cornflowerblue: "6495ed",
          cornsilk: "fff8dc",
          crimson: "dc143c",
          cyan: "0ff",
          darkblue: "00008b",
          darkcyan: "008b8b",
          darkgoldenrod: "b8860b",
          darkgray: "a9a9a9",
          darkgreen: "006400",
          darkgrey: "a9a9a9",
          darkkhaki: "bdb76b",
          darkmagenta: "8b008b",
          darkolivegreen: "556b2f",
          darkorange: "ff8c00",
          darkorchid: "9932cc",
          darkred: "8b0000",
          darksalmon: "e9967a",
          darkseagreen: "8fbc8f",
          darkslateblue: "483d8b",
          darkslategray: "2f4f4f",
          darkslategrey: "2f4f4f",
          darkturquoise: "00ced1",
          darkviolet: "9400d3",
          deeppink: "ff1493",
          deepskyblue: "00bfff",
          dimgray: "696969",
          dimgrey: "696969",
          dodgerblue: "1e90ff",
          firebrick: "b22222",
          floralwhite: "fffaf0",
          forestgreen: "228b22",
          fuchsia: "f0f",
          gainsboro: "dcdcdc",
          ghostwhite: "f8f8ff",
          gold: "ffd700",
          goldenrod: "daa520",
          gray: "808080",
          green: "008000",
          greenyellow: "adff2f",
          grey: "808080",
          honeydew: "f0fff0",
          hotpink: "ff69b4",
          indianred: "cd5c5c",
          indigo: "4b0082",
          ivory: "fffff0",
          khaki: "f0e68c",
          lavender: "e6e6fa",
          lavenderblush: "fff0f5",
          lawngreen: "7cfc00",
          lemonchiffon: "fffacd",
          lightblue: "add8e6",
          lightcoral: "f08080",
          lightcyan: "e0ffff",
          lightgoldenrodyellow: "fafad2",
          lightgray: "d3d3d3",
          lightgreen: "90ee90",
          lightgrey: "d3d3d3",
          lightpink: "ffb6c1",
          lightsalmon: "ffa07a",
          lightseagreen: "20b2aa",
          lightskyblue: "87cefa",
          lightslategray: "789",
          lightslategrey: "789",
          lightsteelblue: "b0c4de",
          lightyellow: "ffffe0",
          lime: "0f0",
          limegreen: "32cd32",
          linen: "faf0e6",
          magenta: "f0f",
          maroon: "800000",
          mediumaquamarine: "66cdaa",
          mediumblue: "0000cd",
          mediumorchid: "ba55d3",
          mediumpurple: "9370db",
          mediumseagreen: "3cb371",
          mediumslateblue: "7b68ee",
          mediumspringgreen: "00fa9a",
          mediumturquoise: "48d1cc",
          mediumvioletred: "c71585",
          midnightblue: "191970",
          mintcream: "f5fffa",
          mistyrose: "ffe4e1",
          moccasin: "ffe4b5",
          navajowhite: "ffdead",
          navy: "000080",
          oldlace: "fdf5e6",
          olive: "808000",
          olivedrab: "6b8e23",
          orange: "ffa500",
          orangered: "ff4500",
          orchid: "da70d6",
          palegoldenrod: "eee8aa",
          palegreen: "98fb98",
          paleturquoise: "afeeee",
          palevioletred: "db7093",
          papayawhip: "ffefd5",
          peachpuff: "ffdab9",
          peru: "cd853f",
          pink: "ffc0cb",
          plum: "dda0dd",
          powderblue: "b0e0e6",
          purple: "800080",
          rebeccapurple: "663399",
          red: "f00",
          rosybrown: "bc8f8f",
          royalblue: "4169e1",
          saddlebrown: "8b4513",
          salmon: "fa8072",
          sandybrown: "f4a460",
          seagreen: "2e8b57",
          seashell: "fff5ee",
          sienna: "a0522d",
          silver: "c0c0c0",
          skyblue: "87ceeb",
          slateblue: "6a5acd",
          slategray: "708090",
          slategrey: "708090",
          snow: "fffafa",
          springgreen: "00ff7f",
          steelblue: "4682b4",
          tan: "d2b48c",
          teal: "008080",
          thistle: "d8bfd8",
          tomato: "ff6347",
          turquoise: "40e0d0",
          violet: "ee82ee",
          wheat: "f5deb3",
          white: "fff",
          whitesmoke: "f5f5f5",
          yellow: "ff0",
          yellowgreen: "9acd32"
        },
        hexNames = tinycolor.hexNames = flip(names),
        matchers = function() {
          var CSS_INTEGER = "[-\\+]?\\d+%?",
            CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?",
            CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")",
            PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?",
            PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
          return {
            CSS_UNIT: new RegExp(CSS_UNIT),
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
            hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
            hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
          }
        }();
      "undefined" != typeof module && module.exports ? module.exports = tinycolor : "function" == typeof define && define.amd ? define(function() {
        return tinycolor
      }) : window.tinycolor = tinycolor
    }(Math)
  }, {}],
  36: [function(require, module, exports) {
    !function() {
      function aa(a, b, c) {
        return a.call.apply(a.bind, arguments)
      }

      function ba(a, b, c) {
        if (!a) throw Error();
        if (2 < arguments.length) {
          var d = Array.prototype.slice.call(arguments, 2);
          return function() {
            var c = Array.prototype.slice.call(arguments);
            return Array.prototype.unshift.apply(c, d), a.apply(b, c)
          }
        }
        return function() {
          return a.apply(b, arguments)
        }
      }

      function p(a, b, c) {
        return p = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? aa : ba, p.apply(null, arguments)
      }

      function ca(a, b) {
        this.a = a, this.m = b || a, this.c = this.m.document
      }

      function t(a, b, c, d) {
        if (b = a.c.createElement(b), c)
          for (var e in c) c.hasOwnProperty(e) && ("style" == e ? b.style.cssText = c[e] : b.setAttribute(e, c[e]));
        return d && b.appendChild(a.c.createTextNode(d)), b
      }

      function u(a, b, c) {
        a = a.c.getElementsByTagName(b)[0], a || (a = document.documentElement), a.insertBefore(c, a.lastChild)
      }

      function v(a) {
        a.parentNode && a.parentNode.removeChild(a)
      }

      function w(a, b, c) {
        b = b || [], c = c || [];
        for (var d = a.className.split(/\s+/), e = 0; e < b.length; e += 1) {
          for (var f = !1, g = 0; g < d.length; g += 1)
            if (b[e] === d[g]) {
              f = !0;
              break
            }
          f || d.push(b[e])
        }
        for (b = [], e = 0; e < d.length; e += 1) {
          for (f = !1, g = 0; g < c.length; g += 1)
            if (d[e] === c[g]) {
              f = !0;
              break
            }
          f || b.push(d[e])
        }
        a.className = b.join(" ").replace(/\s+/g, " ").replace(/^\s+|\s+$/, "")
      }

      function y(a, b) {
        for (var c = a.className.split(/\s+/), d = 0, e = c.length; d < e; d++)
          if (c[d] == b) return !0;
        return !1
      }

      function z(a) {
        if ("string" == typeof a.f) return a.f;
        var b = a.m.location.protocol;
        return "about:" == b && (b = a.a.location.protocol), "https:" == b ? "https:" : "http:"
      }

      function ea(a) {
        return a.m.location.hostname || a.a.location.hostname
      }

      function A(a, b, c) {
        function d() {
          k && e && f && (k(g), k = null)
        }
        b = t(a, "link", {
          rel: "stylesheet",
          href: b,
          media: "all"
        });
        var e = !1,
          f = !0,
          g = null,
          k = c || null;
        da ? (b.onload = function() {
          e = !0, d()
        }, b.onerror = function() {
          e = !0, g = Error("Stylesheet failed to load"), d()
        }) : setTimeout(function() {
          e = !0, d()
        }, 0), u(a, "head", b)
      }

      function B(a, b, c, d) {
        var e = a.c.getElementsByTagName("head")[0];
        if (e) {
          var f = t(a, "script", {
              src: b
            }),
            g = !1;
          return f.onload = f.onreadystatechange = function() {
            g || this.readyState && "loaded" != this.readyState && "complete" != this.readyState || (g = !0, c && c(null), f.onload = f.onreadystatechange = null, "HEAD" == f.parentNode.tagName && e.removeChild(f))
          }, e.appendChild(f), setTimeout(function() {
            g || (g = !0, c && c(Error("Script load timeout")))
          }, d || 5e3), f
        }
        return null
      }

      function C() {
        this.a = 0, this.c = null
      }

      function D(a) {
        return a.a++,
          function() {
            a.a--, E(a)
          }
      }

      function F(a, b) {
        a.c = b, E(a)
      }

      function E(a) {
        0 == a.a && a.c && (a.c(), a.c = null)
      }

      function G(a) {
        this.a = a || "-"
      }

      function H(a, b) {
        this.c = a, this.f = 4, this.a = "n";
        var c = (b || "n4").match(/^([nio])([1-9])$/i);
        c && (this.a = c[1], this.f = parseInt(c[2], 10))
      }

      function fa(a) {
        return I(a) + " " + (a.f + "00") + " 300px " + J(a.c)
      }

      function J(a) {
        var b = [];
        a = a.split(/,\s*/);
        for (var c = 0; c < a.length; c++) {
          var d = a[c].replace(/['"]/g, ""); - 1 != d.indexOf(" ") || /^\d/.test(d) ? b.push("'" + d + "'") : b.push(d)
        }
        return b.join(",")
      }

      function K(a) {
        return a.a + a.f
      }

      function I(a) {
        var b = "normal";
        return "o" === a.a ? b = "oblique" : "i" === a.a && (b = "italic"), b
      }

      function ga(a) {
        var b = 4,
          c = "n",
          d = null;
        return a && ((d = a.match(/(normal|oblique|italic)/i)) && d[1] && (c = d[1].substr(0, 1).toLowerCase()), (d = a.match(/([1-9]00|normal|bold)/i)) && d[1] && (/bold/i.test(d[1]) ? b = 7 : /[1-9]00/.test(d[1]) && (b = parseInt(d[1].substr(0, 1), 10)))), c + b
      }

      function ha(a, b) {
        this.c = a, this.f = a.m.document.documentElement, this.h = b, this.a = new G("-"), this.j = !1 !== b.events, this.g = !1 !== b.classes
      }

      function ia(a) {
        a.g && w(a.f, [a.a.c("wf", "loading")]), L(a, "loading")
      }

      function M(a) {
        if (a.g) {
          var b = y(a.f, a.a.c("wf", "active")),
            c = [],
            d = [a.a.c("wf", "loading")];
          b || c.push(a.a.c("wf", "inactive")), w(a.f, c, d)
        }
        L(a, "inactive")
      }

      function L(a, b, c) {
        a.j && a.h[b] && (c ? a.h[b](c.c, K(c)) : a.h[b]())
      }

      function ja() {
        this.c = {}
      }

      function ka(a, b, c) {
        var e, d = [];
        for (e in b)
          if (b.hasOwnProperty(e)) {
            var f = a.c[e];
            f && d.push(f(b[e], c))
          }
        return d
      }

      function N(a, b) {
        this.c = a, this.f = b, this.a = t(this.c, "span", {
          "aria-hidden": "true"
        }, this.f)
      }

      function O(a) {
        u(a.c, "body", a.a)
      }

      function P(a) {
        return "display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:" + J(a.c) + ";" + ("font-style:" + I(a) + ";font-weight:" + (a.f + "00") + ";")
      }

      function Q(a, b, c, d, e, f) {
        this.g = a, this.j = b, this.a = d, this.c = c, this.f = e || 3e3, this.h = f || void 0
      }

      function R(a, b, c, d, e, f, g) {
        this.v = a, this.B = b, this.c = c, this.a = d, this.s = g || "BESbswy", this.f = {}, this.w = e || 3e3, this.u = f || null, this.o = this.j = this.h = this.g = null, this.g = new N(this.c, this.s), this.h = new N(this.c, this.s), this.j = new N(this.c, this.s), this.o = new N(this.c, this.s), a = new H(this.a.c + ",serif", K(this.a)), a = P(a), this.g.a.style.cssText = a, a = new H(this.a.c + ",sans-serif", K(this.a)), a = P(a), this.h.a.style.cssText = a, a = new H("serif", K(this.a)), a = P(a), this.j.a.style.cssText = a, a = new H("sans-serif", K(this.a)), a = P(a), this.o.a.style.cssText = a, O(this.g), O(this.h), O(this.j), O(this.o)
      }

      function U() {
        if (null === T) {
          var a = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);
          T = !!a && (536 > parseInt(a[1], 10) || 536 === parseInt(a[1], 10) && 11 >= parseInt(a[2], 10))
        }
        return T
      }

      function ma(a, b, c) {
        for (var d in S)
          if (S.hasOwnProperty(d) && b === a.f[S[d]] && c === a.f[S[d]]) return !0;
        return !1
      }

      function la(a) {
        var d, b = a.g.a.offsetWidth,
          c = a.h.a.offsetWidth;
        (d = b === a.f.serif && c === a.f["sans-serif"]) || (d = U() && ma(a, b, c)), d ? q() - a.A >= a.w ? U() && ma(a, b, c) && (null === a.u || a.u.hasOwnProperty(a.a.c)) ? V(a, a.v) : V(a, a.B) : na(a) : V(a, a.v)
      }

      function na(a) {
        setTimeout(p(function() {
          la(this)
        }, a), 50)
      }

      function V(a, b) {
        setTimeout(p(function() {
          v(this.g.a), v(this.h.a), v(this.j.a), v(this.o.a), b(this.a)
        }, a), 0)
      }

      function W(a, b, c) {
        this.c = a, this.a = b, this.f = 0, this.o = this.j = !1, this.s = c
      }

      function oa(a) {
        0 == --a.f && a.j && (a.o ? (a = a.a, a.g && w(a.f, [a.a.c("wf", "active")], [a.a.c("wf", "loading"), a.a.c("wf", "inactive")]), L(a, "active")) : M(a.a))
      }

      function pa(a) {
        this.j = a, this.a = new ja, this.h = 0, this.f = this.g = !0
      }

      function ra(a, b, c, d, e) {
        var f = 0 == --a.h;
        (a.f || a.g) && setTimeout(function() {
          var a = e || null,
            k = d || null || {};
          if (0 === c.length && f) M(b.a);
          else {
            b.f += c.length, f && (b.j = f);
            var h, m = [];
            for (h = 0; h < c.length; h++) {
              var l = c[h],
                n = k[l.c],
                r = b.a,
                x = l;
              if (r.g && w(r.f, [r.a.c("wf", x.c, K(x).toString(), "loading")]), L(r, "fontloading", x), r = null, null === X)
                if (window.FontFace) {
                  var x = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent),
                    ya = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);
                  X = x ? 42 < parseInt(x[1], 10) : !ya
                } else X = !1;
              r = X ? new Q(p(b.g, b), p(b.h, b), b.c, l, b.s, n) : new R(p(b.g, b), p(b.h, b), b.c, l, b.s, a, n), m.push(r)
            }
            for (h = 0; h < m.length; h++) m[h].start()
          }
        }, 0)
      }

      function qa(a, b, c) {
        var d = [],
          e = c.timeout;
        ia(b);
        var d = ka(a.a, c, a.c),
          f = new W(a.c, b, e);
        for (a.h = d.length, b = 0, c = d.length; b < c; b++) d[b].load(function(b, d, c) {
          ra(a, f, b, d, c)
        })
      }

      function sa(a, b) {
        this.c = a, this.a = b
      }

      function ta(a, b, c) {
        var d = z(a.c);
        return a = (a.a.api || "fast.fonts.net/jsapi").replace(/^.*http(s?):(\/\/)?/, ""), d + "//" + a + "/" + b + ".js" + (c ? "?v=" + c : "")
      }

      function ua(a, b) {
        this.c = a, this.a = b
      }

      function va(a, b, c) {
        a ? this.c = a : this.c = b + wa, this.a = [], this.f = [], this.g = c || ""
      }

      function xa(a, b) {
        for (var c = b.length, d = 0; d < c; d++) {
          var e = b[d].split(":");
          3 == e.length && a.f.push(e.pop());
          var f = "";
          2 == e.length && "" != e[1] && (f = ":"), a.a.push(e.join(f))
        }
      }

      function za(a) {
        if (0 == a.a.length) throw Error("No fonts to load!");
        if (-1 != a.c.indexOf("kit=")) return a.c;
        for (var b = a.a.length, c = [], d = 0; d < b; d++) c.push(a.a[d].replace(/ /g, "+"));
        return b = a.c + "?family=" + c.join("%7C"), 0 < a.f.length && (b += "&subset=" + a.f.join(",")), 0 < a.g.length && (b += "&text=" + encodeURIComponent(a.g)), b
      }

      function Aa(a) {
        this.f = a, this.a = [], this.c = {}
      }

      function Fa(a) {
        for (var b = a.f.length, c = 0; c < b; c++) {
          var d = a.f[c].split(":"),
            e = d[0].replace(/\+/g, " "),
            f = ["n4"];
          if (2 <= d.length) {
            var g, k = d[1];
            if (g = [], k)
              for (var k = k.split(","), h = k.length, m = 0; m < h; m++) {
                var l;
                if (l = k[m], l.match(/^[\w-]+$/)) {
                  var n = Ea.exec(l.toLowerCase());
                  if (null == n) l = "";
                  else {
                    if (l = n[2], l = null == l || "" == l ? "n" : Da[l], n = n[1], null == n || "" == n) n = "4";
                    else var r = Ca[n],
                      n = r ? r : isNaN(n) ? "4" : n.substr(0, 1);
                    l = [l, n].join("")
                  }
                } else l = "";
                l && g.push(l)
              }
            0 < g.length && (f = g), 3 == d.length && (d = d[2], g = [], d = d ? d.split(",") : g, 0 < d.length && (d = Ba[d[0]]) && (a.c[e] = d))
          }
          for (a.c[e] || (d = Ba[e]) && (a.c[e] = d), d = 0; d < f.length; d += 1) a.a.push(new H(e, f[d]))
        }
      }

      function Ga(a, b) {
        this.c = a, this.a = b
      }

      function Ia(a, b) {
        this.c = a, this.a = b
      }

      function Ja(a, b) {
        this.c = a, this.f = b, this.a = []
      }
      var q = Date.now || function() {
          return +new Date
        },
        da = !!window.FontFace;
      G.prototype.c = function(a) {
        for (var b = [], c = 0; c < arguments.length; c++) b.push(arguments[c].replace(/[\W_]+/g, "").toLowerCase());
        return b.join(this.a)
      }, Q.prototype.start = function() {
        var a = this.c.m.document,
          b = this,
          c = q(),
          d = new Promise(function(d, e) {
            function k() {
              q() - c >= b.f ? e() : a.fonts.load(fa(b.a), b.h).then(function(a) {
                1 <= a.length ? d() : setTimeout(k, 25)
              }, function() {
                e()
              })
            }
            k()
          }),
          e = new Promise(function(a, d) {
            setTimeout(d, b.f)
          });
        Promise.race([e, d]).then(function() {
          b.g(b.a)
        }, function() {
          b.j(b.a)
        })
      };
      var S = {
          D: "serif",
          C: "sans-serif"
        },
        T = null;
      R.prototype.start = function() {
        this.f.serif = this.j.a.offsetWidth, this.f["sans-serif"] = this.o.a.offsetWidth, this.A = q(), la(this)
      };
      var X = null;
      W.prototype.g = function(a) {
        var b = this.a;
        b.g && w(b.f, [b.a.c("wf", a.c, K(a).toString(), "active")], [b.a.c("wf", a.c, K(a).toString(), "loading"), b.a.c("wf", a.c, K(a).toString(), "inactive")]), L(b, "fontactive", a), this.o = !0, oa(this)
      }, W.prototype.h = function(a) {
        var b = this.a;
        if (b.g) {
          var c = y(b.f, b.a.c("wf", a.c, K(a).toString(), "active")),
            d = [],
            e = [b.a.c("wf", a.c, K(a).toString(), "loading")];
          c || d.push(b.a.c("wf", a.c, K(a).toString(), "inactive")), w(b.f, d, e)
        }
        L(b, "fontinactive", a), oa(this)
      }, pa.prototype.load = function(a) {
        this.c = new ca(this.j, a.context || this.j), this.g = !1 !== a.events, this.f = !1 !== a.classes, qa(this, new ha(this.c, a), a)
      }, sa.prototype.load = function(a) {
        function b() {
          if (f["__mti_fntLst" + d]) {
            var h, c = f["__mti_fntLst" + d](),
              e = [];
            if (c)
              for (var m = 0; m < c.length; m++) {
                var l = c[m].fontfamily;
                void 0 != c[m].fontStyle && void 0 != c[m].fontWeight ? (h = c[m].fontStyle + c[m].fontWeight, e.push(new H(l, h))) : e.push(new H(l))
              }
            a(e)
          } else setTimeout(function() {
            b()
          }, 50)
        }
        var c = this,
          d = c.a.projectId,
          e = c.a.version;
        if (d) {
          var f = c.c.m;
          B(this.c, ta(c, d, e), function(e) {
            e ? a([]) : (f["__MonotypeConfiguration__" + d] = function() {
              return c.a
            }, b())
          }).id = "__MonotypeAPIScript__" + d
        } else a([])
      }, ua.prototype.load = function(a) {
        var b, c, d = this.a.urls || [],
          e = this.a.families || [],
          f = this.a.testStrings || {},
          g = new C;
        for (b = 0, c = d.length; b < c; b++) A(this.c, d[b], D(g));
        var k = [];
        for (b = 0, c = e.length; b < c; b++)
          if (d = e[b].split(":"), d[1])
            for (var h = d[1].split(","), m = 0; m < h.length; m += 1) k.push(new H(d[0], h[m]));
          else k.push(new H(d[0]));
        F(g, function() {
          a(k, f)
        })
      };
      var wa = "//fonts.googleapis.com/css",
        Ba = {
          latin: "BESbswy",
          "latin-ext": "çöüğş",
          cyrillic: "йяЖ",
          greek: "αβΣ",
          khmer: "កខគ",
          Hanuman: "កខគ"
        },
        Ca = {
          thin: "1",
          extralight: "2",
          "extra-light": "2",
          ultralight: "2",
          "ultra-light": "2",
          light: "3",
          regular: "4",
          book: "4",
          medium: "5",
          "semi-bold": "6",
          semibold: "6",
          "demi-bold": "6",
          demibold: "6",
          bold: "7",
          "extra-bold": "8",
          extrabold: "8",
          "ultra-bold": "8",
          ultrabold: "8",
          black: "9",
          heavy: "9",
          l: "3",
          r: "4",
          b: "7"
        },
        Da = {
          i: "i",
          italic: "i",
          n: "n",
          normal: "n"
        },
        Ea = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/,
        Ha = {
          Arimo: !0,
          Cousine: !0,
          Tinos: !0
        };
      Ga.prototype.load = function(a) {
        var b = new C,
          c = this.c,
          d = new va(this.a.api, z(c), this.a.text),
          e = this.a.families;
        xa(d, e);
        var f = new Aa(e);
        Fa(f), A(c, za(d), D(b)), F(b, function() {
          a(f.a, f.c, Ha)
        })
      }, Ia.prototype.load = function(a) {
        var b = this.a.id,
          c = this.c.m;
        b ? B(this.c, (this.a.api || "https://use.typekit.net") + "/" + b + ".js", function(b) {
          if (b) a([]);
          else if (c.Typekit && c.Typekit.config && c.Typekit.config.fn) {
            b = c.Typekit.config.fn;
            for (var e = [], f = 0; f < b.length; f += 2)
              for (var g = b[f], k = b[f + 1], h = 0; h < k.length; h++) e.push(new H(g, k[h]));
            try {
              c.Typekit.load({
                events: !1,
                classes: !1,
                async: !0
              })
            } catch (m) {}
            a(e)
          }
        }, 2e3) : a([])
      }, Ja.prototype.load = function(a) {
        var b = this.f.id,
          c = this.c.m,
          d = this;
        b ? (c.__webfontfontdeckmodule__ || (c.__webfontfontdeckmodule__ = {}), c.__webfontfontdeckmodule__[b] = function(b, c) {
          for (var g = 0, k = c.fonts.length; g < k; ++g) {
            var h = c.fonts[g];
            d.a.push(new H(h.name, ga("font-weight:" + h.weight + ";font-style:" + h.style)))
          }
          a(d.a)
        }, B(this.c, z(this.c) + (this.f.api || "//f.fontdeck.com/s/css/js/") + ea(this.c) + "/" + b + ".js", function(b) {
          b && a([])
        })) : a([])
      };
      var Y = new pa(window);
      Y.a.c.custom = function(a, b) {
        return new ua(b, a)
      }, Y.a.c.fontdeck = function(a, b) {
        return new Ja(b, a)
      }, Y.a.c.monotype = function(a, b) {
        return new sa(b, a)
      }, Y.a.c.typekit = function(a, b) {
        return new Ia(b, a)
      }, Y.a.c.google = function(a, b) {
        return new Ga(b, a)
      };
      var Z = {
        load: p(Y.load, Y)
      };
      "function" == typeof define && define.amd ? define(function() {
        return Z
      }) : "undefined" != typeof module && module.exports ? module.exports = Z : (window.WebFont = Z, window.WebFontConfig && Y.load(window.WebFontConfig))
    }()
  }, {}],
  37: [function(require, module, exports) {
    function createUrl(src) {
      var blob = new Blob([src], {
        type: "application/javascript"
      });
      return URL.createObjectURL(blob)
    }
    var zip = require("zip"),
      zWorker = createUrl("/* jshint worker:true */\n(function main(global) {\n\t\"use strict\";\n\n\tif (global.zWorkerInitialized)\n\t\tthrow new Error('z-worker.js should be run only once');\n\tglobal.zWorkerInitialized = true;\n\n\taddEventListener(\"message\", function(event) {\n\t\tvar message = event.data, type = message.type, sn = message.sn;\n\t\tvar handler = handlers[type];\n\t\tif (handler) {\n\t\t\ttry {\n\t\t\t\thandler(message);\n\t\t\t} catch (e) {\n\t\t\t\tonError(type, sn, e);\n\t\t\t}\n\t\t}\n\t\t//for debug\n\t\t//postMessage({type: 'echo', originalType: type, sn: sn});\n\t});\n\n\tvar handlers = {\n\t\timportScripts: doImportScripts,\n\t\tnewTask: newTask,\n\t\tappend: processData,\n\t\tflush: processData,\n\t};\n\n\t// deflater/inflater tasks indexed by serial numbers\n\tvar tasks = {};\n\n\tfunction doImportScripts(msg) {\n\t\tif (msg.scripts && msg.scripts.length > 0)\n\t\t\timportScripts.apply(undefined, msg.scripts);\n\t\tpostMessage({type: 'importScripts'});\n\t}\n\n\tfunction newTask(msg) {\n\t\tvar CodecClass = global[msg.codecClass];\n\t\tvar sn = msg.sn;\n\t\tif (tasks[sn])\n\t\t\tthrow Error('duplicated sn');\n\t\ttasks[sn] =  {\n\t\t\tcodec: new CodecClass(msg.options),\n\t\t\tcrcInput: msg.crcType === 'input',\n\t\t\tcrcOutput: msg.crcType === 'output',\n\t\t\tcrc: new Crc32(),\n\t\t};\n\t\tpostMessage({type: 'newTask', sn: sn});\n\t}\n\n\t// performance may not be supported\n\tvar now = global.performance ? global.performance.now.bind(global.performance) : Date.now;\n\n\tfunction processData(msg) {\n\t\tvar sn = msg.sn, type = msg.type, input = msg.data;\n\t\tvar task = tasks[sn];\n\t\t// allow creating codec on first append\n\t\tif (!task && msg.codecClass) {\n\t\t\tnewTask(msg);\n\t\t\ttask = tasks[sn];\n\t\t}\n\t\tvar isAppend = type === 'append';\n\t\tvar start = now();\n\t\tvar output;\n\t\tif (isAppend) {\n\t\t\ttry {\n\t\t\t\toutput = task.codec.append(input, function onprogress(loaded) {\n\t\t\t\t\tpostMessage({type: 'progress', sn: sn, loaded: loaded});\n\t\t\t\t});\n\t\t\t} catch (e) {\n\t\t\t\tdelete tasks[sn];\n\t\t\t\tthrow e;\n\t\t\t}\n\t\t} else {\n\t\t\tdelete tasks[sn];\n\t\t\toutput = task.codec.flush();\n\t\t}\n\t\tvar codecTime = now() - start;\n\n\t\tstart = now();\n\t\tif (input && task.crcInput)\n\t\t\ttask.crc.append(input);\n\t\tif (output && task.crcOutput)\n\t\t\ttask.crc.append(output);\n\t\tvar crcTime = now() - start;\n\n\t\tvar rmsg = {type: type, sn: sn, codecTime: codecTime, crcTime: crcTime};\n\t\tvar transferables = [];\n\t\tif (output) {\n\t\t\trmsg.data = output;\n\t\t\ttransferables.push(output.buffer);\n\t\t}\n\t\tif (!isAppend && (task.crcInput || task.crcOutput))\n\t\t\trmsg.crc = task.crc.get();\n\t\t\n\t\t// posting a message with transferables will fail on IE10\n\t\ttry {\n\t\t\tpostMessage(rmsg, transferables);\n\t\t} catch(ex) {\n\t\t\tpostMessage(rmsg); // retry without transferables\n\t\t}\n\t}\n\n\tfunction onError(type, sn, e) {\n\t\tvar msg = {\n\t\t\ttype: type,\n\t\t\tsn: sn,\n\t\t\terror: formatError(e)\n\t\t};\n\t\tpostMessage(msg);\n\t}\n\n\tfunction formatError(e) {\n\t\treturn { message: e.message, stack: e.stack };\n\t}\n\n\t// Crc32 code copied from file zip.js\n\tfunction Crc32() {\n\t\tthis.crc = -1;\n\t}\n\tCrc32.prototype.append = function append(data) {\n\t\tvar crc = this.crc | 0, table = this.table;\n\t\tfor (var offset = 0, len = data.length | 0; offset < len; offset++)\n\t\t\tcrc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];\n\t\tthis.crc = crc;\n\t};\n\tCrc32.prototype.get = function get() {\n\t\treturn ~this.crc;\n\t};\n\tCrc32.prototype.table = (function() {\n\t\tvar i, j, t, table = []; // Uint32Array is actually slower than []\n\t\tfor (i = 0; i < 256; i++) {\n\t\t\tt = i;\n\t\t\tfor (j = 0; j < 8; j++)\n\t\t\t\tif (t & 1)\n\t\t\t\t\tt = (t >>> 1) ^ 0xEDB88320;\n\t\t\t\telse\n\t\t\t\t\tt = t >>> 1;\n\t\t\ttable[i] = t;\n\t\t}\n\t\treturn table;\n\t})();\n\n\t// \"no-op\" codec\n\tfunction NOOP() {}\n\tglobal.NOOP = NOOP;\n\tNOOP.prototype.append = function append(bytes, onprogress) {\n\t\treturn bytes;\n\t};\n\tNOOP.prototype.flush = function flush() {};\n})(this);\n");
    zip.workerScripts = {
      deflater: [zWorker, createUrl('/*\n Copyright (c) 2013 Gildas Lormeau. All rights reserved.\n\n Redistribution and use in source and binary forms, with or without\n modification, are permitted provided that the following conditions are met:\n\n 1. Redistributions of source code must retain the above copyright notice,\n this list of conditions and the following disclaimer.\n\n 2. Redistributions in binary form must reproduce the above copyright \n notice, this list of conditions and the following disclaimer in \n the documentation and/or other materials provided with the distribution.\n\n 3. The names of the authors may not be used to endorse or promote products\n derived from this software without specific prior written permission.\n\n THIS SOFTWARE IS PROVIDED ``AS IS\'\' AND ANY EXPRESSED OR IMPLIED WARRANTIES,\n INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND\n FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,\n INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,\n INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,\n OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF\n LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING\n NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,\n EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n/*\n * This program is based on JZlib 1.0.2 ymnk, JCraft,Inc.\n * JZlib is based on zlib-1.1.3, so all credit should go authors\n * Jean-loup Gailly(jloup@gzip.org) and Mark Adler(madler@alumni.caltech.edu)\n * and contributors of zlib.\n */\n\n(function(global) {\n\t"use strict";\n\n\t// Global\n\n\tvar MAX_BITS = 15;\n\tvar D_CODES = 30;\n\tvar BL_CODES = 19;\n\n\tvar LENGTH_CODES = 29;\n\tvar LITERALS = 256;\n\tvar L_CODES = (LITERALS + 1 + LENGTH_CODES);\n\tvar HEAP_SIZE = (2 * L_CODES + 1);\n\n\tvar END_BLOCK = 256;\n\n\t// Bit length codes must not exceed MAX_BL_BITS bits\n\tvar MAX_BL_BITS = 7;\n\n\t// repeat previous bit length 3-6 times (2 bits of repeat count)\n\tvar REP_3_6 = 16;\n\n\t// repeat a zero length 3-10 times (3 bits of repeat count)\n\tvar REPZ_3_10 = 17;\n\n\t// repeat a zero length 11-138 times (7 bits of repeat count)\n\tvar REPZ_11_138 = 18;\n\n\t// The lengths of the bit length codes are sent in order of decreasing\n\t// probability, to avoid transmitting the lengths for unused bit\n\t// length codes.\n\n\tvar Buf_size = 8 * 2;\n\n\t// JZlib version : "1.0.2"\n\tvar Z_DEFAULT_COMPRESSION = -1;\n\n\t// compression strategy\n\tvar Z_FILTERED = 1;\n\tvar Z_HUFFMAN_ONLY = 2;\n\tvar Z_DEFAULT_STRATEGY = 0;\n\n\tvar Z_NO_FLUSH = 0;\n\tvar Z_PARTIAL_FLUSH = 1;\n\tvar Z_FULL_FLUSH = 3;\n\tvar Z_FINISH = 4;\n\n\tvar Z_OK = 0;\n\tvar Z_STREAM_END = 1;\n\tvar Z_NEED_DICT = 2;\n\tvar Z_STREAM_ERROR = -2;\n\tvar Z_DATA_ERROR = -3;\n\tvar Z_BUF_ERROR = -5;\n\n\t// Tree\n\n\t// see definition of array dist_code below\n\tvar _dist_code = [ 0, 1, 2, 3, 4, 4, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10,\n\t\t\t10, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,\n\t\t\t12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,\n\t\t\t13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,\n\t\t\t14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14,\n\t\t\t14, 14, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,\n\t\t\t15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 0, 16, 17, 18, 18, 19, 19,\n\t\t\t20, 20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n\t\t\t24, 24, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,\n\t\t\t26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27,\n\t\t\t27, 27, 27, 27, 27, 27, 27, 27, 27, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,\n\t\t\t28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 29,\n\t\t\t29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29,\n\t\t\t29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29 ];\n\n\tfunction Tree() {\n\t\tvar that = this;\n\n\t\t// dyn_tree; // the dynamic tree\n\t\t// max_code; // largest code with non zero frequency\n\t\t// stat_desc; // the corresponding static tree\n\n\t\t// Compute the optimal bit lengths for a tree and update the total bit\n\t\t// length\n\t\t// for the current block.\n\t\t// IN assertion: the fields freq and dad are set, heap[heap_max] and\n\t\t// above are the tree nodes sorted by increasing frequency.\n\t\t// OUT assertions: the field len is set to the optimal bit length, the\n\t\t// array bl_count contains the frequencies for each bit length.\n\t\t// The length opt_len is updated; static_len is also updated if stree is\n\t\t// not null.\n\t\tfunction gen_bitlen(s) {\n\t\t\tvar tree = that.dyn_tree;\n\t\t\tvar stree = that.stat_desc.static_tree;\n\t\t\tvar extra = that.stat_desc.extra_bits;\n\t\t\tvar base = that.stat_desc.extra_base;\n\t\t\tvar max_length = that.stat_desc.max_length;\n\t\t\tvar h; // heap index\n\t\t\tvar n, m; // iterate over the tree elements\n\t\t\tvar bits; // bit length\n\t\t\tvar xbits; // extra bits\n\t\t\tvar f; // frequency\n\t\t\tvar overflow = 0; // number of elements with bit length too large\n\n\t\t\tfor (bits = 0; bits <= MAX_BITS; bits++)\n\t\t\t\ts.bl_count[bits] = 0;\n\n\t\t\t// In a first pass, compute the optimal bit lengths (which may\n\t\t\t// overflow in the case of the bit length tree).\n\t\t\ttree[s.heap[s.heap_max] * 2 + 1] = 0; // root of the heap\n\n\t\t\tfor (h = s.heap_max + 1; h < HEAP_SIZE; h++) {\n\t\t\t\tn = s.heap[h];\n\t\t\t\tbits = tree[tree[n * 2 + 1] * 2 + 1] + 1;\n\t\t\t\tif (bits > max_length) {\n\t\t\t\t\tbits = max_length;\n\t\t\t\t\toverflow++;\n\t\t\t\t}\n\t\t\t\ttree[n * 2 + 1] = bits;\n\t\t\t\t// We overwrite tree[n*2+1] which is no longer needed\n\n\t\t\t\tif (n > that.max_code)\n\t\t\t\t\tcontinue; // not a leaf node\n\n\t\t\t\ts.bl_count[bits]++;\n\t\t\t\txbits = 0;\n\t\t\t\tif (n >= base)\n\t\t\t\t\txbits = extra[n - base];\n\t\t\t\tf = tree[n * 2];\n\t\t\t\ts.opt_len += f * (bits + xbits);\n\t\t\t\tif (stree)\n\t\t\t\t\ts.static_len += f * (stree[n * 2 + 1] + xbits);\n\t\t\t}\n\t\t\tif (overflow === 0)\n\t\t\t\treturn;\n\n\t\t\t// This happens for example on obj2 and pic of the Calgary corpus\n\t\t\t// Find the first bit length which could increase:\n\t\t\tdo {\n\t\t\t\tbits = max_length - 1;\n\t\t\t\twhile (s.bl_count[bits] === 0)\n\t\t\t\t\tbits--;\n\t\t\t\ts.bl_count[bits]--; // move one leaf down the tree\n\t\t\t\ts.bl_count[bits + 1] += 2; // move one overflow item as its brother\n\t\t\t\ts.bl_count[max_length]--;\n\t\t\t\t// The brother of the overflow item also moves one step up,\n\t\t\t\t// but this does not affect bl_count[max_length]\n\t\t\t\toverflow -= 2;\n\t\t\t} while (overflow > 0);\n\n\t\t\tfor (bits = max_length; bits !== 0; bits--) {\n\t\t\t\tn = s.bl_count[bits];\n\t\t\t\twhile (n !== 0) {\n\t\t\t\t\tm = s.heap[--h];\n\t\t\t\t\tif (m > that.max_code)\n\t\t\t\t\t\tcontinue;\n\t\t\t\t\tif (tree[m * 2 + 1] != bits) {\n\t\t\t\t\t\ts.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];\n\t\t\t\t\t\ttree[m * 2 + 1] = bits;\n\t\t\t\t\t}\n\t\t\t\t\tn--;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Reverse the first len bits of a code, using straightforward code (a\n\t\t// faster\n\t\t// method would use a table)\n\t\t// IN assertion: 1 <= len <= 15\n\t\tfunction bi_reverse(code, // the value to invert\n\t\tlen // its bit length\n\t\t) {\n\t\t\tvar res = 0;\n\t\t\tdo {\n\t\t\t\tres |= code & 1;\n\t\t\t\tcode >>>= 1;\n\t\t\t\tres <<= 1;\n\t\t\t} while (--len > 0);\n\t\t\treturn res >>> 1;\n\t\t}\n\n\t\t// Generate the codes for a given tree and bit counts (which need not be\n\t\t// optimal).\n\t\t// IN assertion: the array bl_count contains the bit length statistics for\n\t\t// the given tree and the field len is set for all tree elements.\n\t\t// OUT assertion: the field code is set for all tree elements of non\n\t\t// zero code length.\n\t\tfunction gen_codes(tree, // the tree to decorate\n\t\tmax_code, // largest code with non zero frequency\n\t\tbl_count // number of codes at each bit length\n\t\t) {\n\t\t\tvar next_code = []; // next code value for each\n\t\t\t// bit length\n\t\t\tvar code = 0; // running code value\n\t\t\tvar bits; // bit index\n\t\t\tvar n; // code index\n\t\t\tvar len;\n\n\t\t\t// The distribution counts are first used to generate the code values\n\t\t\t// without bit reversal.\n\t\t\tfor (bits = 1; bits <= MAX_BITS; bits++) {\n\t\t\t\tnext_code[bits] = code = ((code + bl_count[bits - 1]) << 1);\n\t\t\t}\n\n\t\t\t// Check that the bit counts in bl_count are consistent. The last code\n\t\t\t// must be all ones.\n\t\t\t// Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,\n\t\t\t// "inconsistent bit counts");\n\t\t\t// Tracev((stderr,"\\ngen_codes: max_code %d ", max_code));\n\n\t\t\tfor (n = 0; n <= max_code; n++) {\n\t\t\t\tlen = tree[n * 2 + 1];\n\t\t\t\tif (len === 0)\n\t\t\t\t\tcontinue;\n\t\t\t\t// Now reverse the bits\n\t\t\t\ttree[n * 2] = bi_reverse(next_code[len]++, len);\n\t\t\t}\n\t\t}\n\n\t\t// Construct one Huffman tree and assigns the code bit strings and lengths.\n\t\t// Update the total bit length for the current block.\n\t\t// IN assertion: the field freq is set for all tree elements.\n\t\t// OUT assertions: the fields len and code are set to the optimal bit length\n\t\t// and corresponding code. The length opt_len is updated; static_len is\n\t\t// also updated if stree is not null. The field max_code is set.\n\t\tthat.build_tree = function(s) {\n\t\t\tvar tree = that.dyn_tree;\n\t\t\tvar stree = that.stat_desc.static_tree;\n\t\t\tvar elems = that.stat_desc.elems;\n\t\t\tvar n, m; // iterate over heap elements\n\t\t\tvar max_code = -1; // largest code with non zero frequency\n\t\t\tvar node; // new node being created\n\n\t\t\t// Construct the initial heap, with least frequent element in\n\t\t\t// heap[1]. The sons of heap[n] are heap[2*n] and heap[2*n+1].\n\t\t\t// heap[0] is not used.\n\t\t\ts.heap_len = 0;\n\t\t\ts.heap_max = HEAP_SIZE;\n\n\t\t\tfor (n = 0; n < elems; n++) {\n\t\t\t\tif (tree[n * 2] !== 0) {\n\t\t\t\t\ts.heap[++s.heap_len] = max_code = n;\n\t\t\t\t\ts.depth[n] = 0;\n\t\t\t\t} else {\n\t\t\t\t\ttree[n * 2 + 1] = 0;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\t// The pkzip format requires that at least one distance code exists,\n\t\t\t// and that at least one bit should be sent even if there is only one\n\t\t\t// possible code. So to avoid special checks later on we force at least\n\t\t\t// two codes of non zero frequency.\n\t\t\twhile (s.heap_len < 2) {\n\t\t\t\tnode = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;\n\t\t\t\ttree[node * 2] = 1;\n\t\t\t\ts.depth[node] = 0;\n\t\t\t\ts.opt_len--;\n\t\t\t\tif (stree)\n\t\t\t\t\ts.static_len -= stree[node * 2 + 1];\n\t\t\t\t// node is 0 or 1 so it does not have extra bits\n\t\t\t}\n\t\t\tthat.max_code = max_code;\n\n\t\t\t// The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,\n\t\t\t// establish sub-heaps of increasing lengths:\n\n\t\t\tfor (n = Math.floor(s.heap_len / 2); n >= 1; n--)\n\t\t\t\ts.pqdownheap(tree, n);\n\n\t\t\t// Construct the Huffman tree by repeatedly combining the least two\n\t\t\t// frequent nodes.\n\n\t\t\tnode = elems; // next internal node of the tree\n\t\t\tdo {\n\t\t\t\t// n = node of least frequency\n\t\t\t\tn = s.heap[1];\n\t\t\t\ts.heap[1] = s.heap[s.heap_len--];\n\t\t\t\ts.pqdownheap(tree, 1);\n\t\t\t\tm = s.heap[1]; // m = node of next least frequency\n\n\t\t\t\ts.heap[--s.heap_max] = n; // keep the nodes sorted by frequency\n\t\t\t\ts.heap[--s.heap_max] = m;\n\n\t\t\t\t// Create a new node father of n and m\n\t\t\t\ttree[node * 2] = (tree[n * 2] + tree[m * 2]);\n\t\t\t\ts.depth[node] = Math.max(s.depth[n], s.depth[m]) + 1;\n\t\t\t\ttree[n * 2 + 1] = tree[m * 2 + 1] = node;\n\n\t\t\t\t// and insert the new node in the heap\n\t\t\t\ts.heap[1] = node++;\n\t\t\t\ts.pqdownheap(tree, 1);\n\t\t\t} while (s.heap_len >= 2);\n\n\t\t\ts.heap[--s.heap_max] = s.heap[1];\n\n\t\t\t// At this point, the fields freq and dad are set. We can now\n\t\t\t// generate the bit lengths.\n\n\t\t\tgen_bitlen(s);\n\n\t\t\t// The field len is now set, we can generate the bit codes\n\t\t\tgen_codes(tree, that.max_code, s.bl_count);\n\t\t};\n\n\t}\n\n\tTree._length_code = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16,\n\t\t\t16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20,\n\t\t\t20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,\n\t\t\t22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,\n\t\t\t24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25,\n\t\t\t25, 25, 25, 25, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26,\n\t\t\t26, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 28 ];\n\n\tTree.base_length = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 0 ];\n\n\tTree.base_dist = [ 0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096, 6144, 8192, 12288, 16384,\n\t\t\t24576 ];\n\n\t// Mapping from a distance to a distance code. dist is the distance - 1 and\n\t// must not have side effects. _dist_code[256] and _dist_code[257] are never\n\t// used.\n\tTree.d_code = function(dist) {\n\t\treturn ((dist) < 256 ? _dist_code[dist] : _dist_code[256 + ((dist) >>> 7)]);\n\t};\n\n\t// extra bits for each length code\n\tTree.extra_lbits = [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0 ];\n\n\t// extra bits for each distance code\n\tTree.extra_dbits = [ 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13 ];\n\n\t// extra bits for each bit length code\n\tTree.extra_blbits = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7 ];\n\n\tTree.bl_order = [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];\n\n\t// StaticTree\n\n\tfunction StaticTree(static_tree, extra_bits, extra_base, elems, max_length) {\n\t\tvar that = this;\n\t\tthat.static_tree = static_tree;\n\t\tthat.extra_bits = extra_bits;\n\t\tthat.extra_base = extra_base;\n\t\tthat.elems = elems;\n\t\tthat.max_length = max_length;\n\t}\n\n\tStaticTree.static_ltree = [ 12, 8, 140, 8, 76, 8, 204, 8, 44, 8, 172, 8, 108, 8, 236, 8, 28, 8, 156, 8, 92, 8, 220, 8, 60, 8, 188, 8, 124, 8, 252, 8, 2, 8,\n\t\t\t130, 8, 66, 8, 194, 8, 34, 8, 162, 8, 98, 8, 226, 8, 18, 8, 146, 8, 82, 8, 210, 8, 50, 8, 178, 8, 114, 8, 242, 8, 10, 8, 138, 8, 74, 8, 202, 8, 42,\n\t\t\t8, 170, 8, 106, 8, 234, 8, 26, 8, 154, 8, 90, 8, 218, 8, 58, 8, 186, 8, 122, 8, 250, 8, 6, 8, 134, 8, 70, 8, 198, 8, 38, 8, 166, 8, 102, 8, 230, 8,\n\t\t\t22, 8, 150, 8, 86, 8, 214, 8, 54, 8, 182, 8, 118, 8, 246, 8, 14, 8, 142, 8, 78, 8, 206, 8, 46, 8, 174, 8, 110, 8, 238, 8, 30, 8, 158, 8, 94, 8,\n\t\t\t222, 8, 62, 8, 190, 8, 126, 8, 254, 8, 1, 8, 129, 8, 65, 8, 193, 8, 33, 8, 161, 8, 97, 8, 225, 8, 17, 8, 145, 8, 81, 8, 209, 8, 49, 8, 177, 8, 113,\n\t\t\t8, 241, 8, 9, 8, 137, 8, 73, 8, 201, 8, 41, 8, 169, 8, 105, 8, 233, 8, 25, 8, 153, 8, 89, 8, 217, 8, 57, 8, 185, 8, 121, 8, 249, 8, 5, 8, 133, 8,\n\t\t\t69, 8, 197, 8, 37, 8, 165, 8, 101, 8, 229, 8, 21, 8, 149, 8, 85, 8, 213, 8, 53, 8, 181, 8, 117, 8, 245, 8, 13, 8, 141, 8, 77, 8, 205, 8, 45, 8,\n\t\t\t173, 8, 109, 8, 237, 8, 29, 8, 157, 8, 93, 8, 221, 8, 61, 8, 189, 8, 125, 8, 253, 8, 19, 9, 275, 9, 147, 9, 403, 9, 83, 9, 339, 9, 211, 9, 467, 9,\n\t\t\t51, 9, 307, 9, 179, 9, 435, 9, 115, 9, 371, 9, 243, 9, 499, 9, 11, 9, 267, 9, 139, 9, 395, 9, 75, 9, 331, 9, 203, 9, 459, 9, 43, 9, 299, 9, 171, 9,\n\t\t\t427, 9, 107, 9, 363, 9, 235, 9, 491, 9, 27, 9, 283, 9, 155, 9, 411, 9, 91, 9, 347, 9, 219, 9, 475, 9, 59, 9, 315, 9, 187, 9, 443, 9, 123, 9, 379,\n\t\t\t9, 251, 9, 507, 9, 7, 9, 263, 9, 135, 9, 391, 9, 71, 9, 327, 9, 199, 9, 455, 9, 39, 9, 295, 9, 167, 9, 423, 9, 103, 9, 359, 9, 231, 9, 487, 9, 23,\n\t\t\t9, 279, 9, 151, 9, 407, 9, 87, 9, 343, 9, 215, 9, 471, 9, 55, 9, 311, 9, 183, 9, 439, 9, 119, 9, 375, 9, 247, 9, 503, 9, 15, 9, 271, 9, 143, 9,\n\t\t\t399, 9, 79, 9, 335, 9, 207, 9, 463, 9, 47, 9, 303, 9, 175, 9, 431, 9, 111, 9, 367, 9, 239, 9, 495, 9, 31, 9, 287, 9, 159, 9, 415, 9, 95, 9, 351, 9,\n\t\t\t223, 9, 479, 9, 63, 9, 319, 9, 191, 9, 447, 9, 127, 9, 383, 9, 255, 9, 511, 9, 0, 7, 64, 7, 32, 7, 96, 7, 16, 7, 80, 7, 48, 7, 112, 7, 8, 7, 72, 7,\n\t\t\t40, 7, 104, 7, 24, 7, 88, 7, 56, 7, 120, 7, 4, 7, 68, 7, 36, 7, 100, 7, 20, 7, 84, 7, 52, 7, 116, 7, 3, 8, 131, 8, 67, 8, 195, 8, 35, 8, 163, 8,\n\t\t\t99, 8, 227, 8 ];\n\n\tStaticTree.static_dtree = [ 0, 5, 16, 5, 8, 5, 24, 5, 4, 5, 20, 5, 12, 5, 28, 5, 2, 5, 18, 5, 10, 5, 26, 5, 6, 5, 22, 5, 14, 5, 30, 5, 1, 5, 17, 5, 9, 5,\n\t\t\t25, 5, 5, 5, 21, 5, 13, 5, 29, 5, 3, 5, 19, 5, 11, 5, 27, 5, 7, 5, 23, 5 ];\n\n\tStaticTree.static_l_desc = new StaticTree(StaticTree.static_ltree, Tree.extra_lbits, LITERALS + 1, L_CODES, MAX_BITS);\n\n\tStaticTree.static_d_desc = new StaticTree(StaticTree.static_dtree, Tree.extra_dbits, 0, D_CODES, MAX_BITS);\n\n\tStaticTree.static_bl_desc = new StaticTree(null, Tree.extra_blbits, 0, BL_CODES, MAX_BL_BITS);\n\n\t// Deflate\n\n\tvar MAX_MEM_LEVEL = 9;\n\tvar DEF_MEM_LEVEL = 8;\n\n\tfunction Config(good_length, max_lazy, nice_length, max_chain, func) {\n\t\tvar that = this;\n\t\tthat.good_length = good_length;\n\t\tthat.max_lazy = max_lazy;\n\t\tthat.nice_length = nice_length;\n\t\tthat.max_chain = max_chain;\n\t\tthat.func = func;\n\t}\n\n\tvar STORED = 0;\n\tvar FAST = 1;\n\tvar SLOW = 2;\n\tvar config_table = [ new Config(0, 0, 0, 0, STORED), new Config(4, 4, 8, 4, FAST), new Config(4, 5, 16, 8, FAST), new Config(4, 6, 32, 32, FAST),\n\t\t\tnew Config(4, 4, 16, 16, SLOW), new Config(8, 16, 32, 32, SLOW), new Config(8, 16, 128, 128, SLOW), new Config(8, 32, 128, 256, SLOW),\n\t\t\tnew Config(32, 128, 258, 1024, SLOW), new Config(32, 258, 258, 4096, SLOW) ];\n\n\tvar z_errmsg = [ "need dictionary", // Z_NEED_DICT\n\t// 2\n\t"stream end", // Z_STREAM_END 1\n\t"", // Z_OK 0\n\t"", // Z_ERRNO (-1)\n\t"stream error", // Z_STREAM_ERROR (-2)\n\t"data error", // Z_DATA_ERROR (-3)\n\t"", // Z_MEM_ERROR (-4)\n\t"buffer error", // Z_BUF_ERROR (-5)\n\t"",// Z_VERSION_ERROR (-6)\n\t"" ];\n\n\t// block not completed, need more input or more output\n\tvar NeedMore = 0;\n\n\t// block flush performed\n\tvar BlockDone = 1;\n\n\t// finish started, need only more output at next deflate\n\tvar FinishStarted = 2;\n\n\t// finish done, accept no more input or output\n\tvar FinishDone = 3;\n\n\t// preset dictionary flag in zlib header\n\tvar PRESET_DICT = 0x20;\n\n\tvar INIT_STATE = 42;\n\tvar BUSY_STATE = 113;\n\tvar FINISH_STATE = 666;\n\n\t// The deflate compression method\n\tvar Z_DEFLATED = 8;\n\n\tvar STORED_BLOCK = 0;\n\tvar STATIC_TREES = 1;\n\tvar DYN_TREES = 2;\n\n\tvar MIN_MATCH = 3;\n\tvar MAX_MATCH = 258;\n\tvar MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);\n\n\tfunction smaller(tree, n, m, depth) {\n\t\tvar tn2 = tree[n * 2];\n\t\tvar tm2 = tree[m * 2];\n\t\treturn (tn2 < tm2 || (tn2 == tm2 && depth[n] <= depth[m]));\n\t}\n\n\tfunction Deflate() {\n\n\t\tvar that = this;\n\t\tvar strm; // pointer back to this zlib stream\n\t\tvar status; // as the name implies\n\t\t// pending_buf; // output still pending\n\t\tvar pending_buf_size; // size of pending_buf\n\t\t// pending_out; // next pending byte to output to the stream\n\t\t// pending; // nb of bytes in the pending buffer\n\t\tvar method; // STORED (for zip only) or DEFLATED\n\t\tvar last_flush; // value of flush param for previous deflate call\n\n\t\tvar w_size; // LZ77 window size (32K by default)\n\t\tvar w_bits; // log2(w_size) (8..16)\n\t\tvar w_mask; // w_size - 1\n\n\t\tvar window;\n\t\t// Sliding window. Input bytes are read into the second half of the window,\n\t\t// and move to the first half later to keep a dictionary of at least wSize\n\t\t// bytes. With this organization, matches are limited to a distance of\n\t\t// wSize-MAX_MATCH bytes, but this ensures that IO is always\n\t\t// performed with a length multiple of the block size. Also, it limits\n\t\t// the window size to 64K, which is quite useful on MSDOS.\n\t\t// To do: use the user input buffer as sliding window.\n\n\t\tvar window_size;\n\t\t// Actual size of window: 2*wSize, except when the user input buffer\n\t\t// is directly used as sliding window.\n\n\t\tvar prev;\n\t\t// Link to older string with same hash index. To limit the size of this\n\t\t// array to 64K, this link is maintained only for the last 32K strings.\n\t\t// An index in this array is thus a window index modulo 32K.\n\n\t\tvar head; // Heads of the hash chains or NIL.\n\n\t\tvar ins_h; // hash index of string to be inserted\n\t\tvar hash_size; // number of elements in hash table\n\t\tvar hash_bits; // log2(hash_size)\n\t\tvar hash_mask; // hash_size-1\n\n\t\t// Number of bits by which ins_h must be shifted at each input\n\t\t// step. It must be such that after MIN_MATCH steps, the oldest\n\t\t// byte no longer takes part in the hash key, that is:\n\t\t// hash_shift * MIN_MATCH >= hash_bits\n\t\tvar hash_shift;\n\n\t\t// Window position at the beginning of the current output block. Gets\n\t\t// negative when the window is moved backwards.\n\n\t\tvar block_start;\n\n\t\tvar match_length; // length of best match\n\t\tvar prev_match; // previous match\n\t\tvar match_available; // set if previous match exists\n\t\tvar strstart; // start of string to insert\n\t\tvar match_start; // start of matching string\n\t\tvar lookahead; // number of valid bytes ahead in window\n\n\t\t// Length of the best match at previous step. Matches not greater than this\n\t\t// are discarded. This is used in the lazy match evaluation.\n\t\tvar prev_length;\n\n\t\t// To speed up deflation, hash chains are never searched beyond this\n\t\t// length. A higher limit improves compression ratio but degrades the speed.\n\t\tvar max_chain_length;\n\n\t\t// Attempt to find a better match only when the current match is strictly\n\t\t// smaller than this value. This mechanism is used only for compression\n\t\t// levels >= 4.\n\t\tvar max_lazy_match;\n\n\t\t// Insert new strings in the hash table only if the match length is not\n\t\t// greater than this length. This saves time but degrades compression.\n\t\t// max_insert_length is used only for compression levels <= 3.\n\n\t\tvar level; // compression level (1..9)\n\t\tvar strategy; // favor or force Huffman coding\n\n\t\t// Use a faster search when the previous match is longer than this\n\t\tvar good_match;\n\n\t\t// Stop searching when current match exceeds this\n\t\tvar nice_match;\n\n\t\tvar dyn_ltree; // literal and length tree\n\t\tvar dyn_dtree; // distance tree\n\t\tvar bl_tree; // Huffman tree for bit lengths\n\n\t\tvar l_desc = new Tree(); // desc for literal tree\n\t\tvar d_desc = new Tree(); // desc for distance tree\n\t\tvar bl_desc = new Tree(); // desc for bit length tree\n\n\t\t// that.heap_len; // number of elements in the heap\n\t\t// that.heap_max; // element of largest frequency\n\t\t// The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.\n\t\t// The same heap array is used to build all trees.\n\n\t\t// Depth of each subtree used as tie breaker for trees of equal frequency\n\t\tthat.depth = [];\n\n\t\tvar l_buf; // index for literals or lengths */\n\n\t\t// Size of match buffer for literals/lengths. There are 4 reasons for\n\t\t// limiting lit_bufsize to 64K:\n\t\t// - frequencies can be kept in 16 bit counters\n\t\t// - if compression is not successful for the first block, all input\n\t\t// data is still in the window so we can still emit a stored block even\n\t\t// when input comes from standard input. (This can also be done for\n\t\t// all blocks if lit_bufsize is not greater than 32K.)\n\t\t// - if compression is not successful for a file smaller than 64K, we can\n\t\t// even emit a stored file instead of a stored block (saving 5 bytes).\n\t\t// This is applicable only for zip (not gzip or zlib).\n\t\t// - creating new Huffman trees less frequently may not provide fast\n\t\t// adaptation to changes in the input data statistics. (Take for\n\t\t// example a binary file with poorly compressible code followed by\n\t\t// a highly compressible string table.) Smaller buffer sizes give\n\t\t// fast adaptation but have of course the overhead of transmitting\n\t\t// trees more frequently.\n\t\t// - I can\'t count above 4\n\t\tvar lit_bufsize;\n\n\t\tvar last_lit; // running index in l_buf\n\n\t\t// Buffer for distances. To simplify the code, d_buf and l_buf have\n\t\t// the same number of elements. To use different lengths, an extra flag\n\t\t// array would be necessary.\n\n\t\tvar d_buf; // index of pendig_buf\n\n\t\t// that.opt_len; // bit length of current block with optimal trees\n\t\t// that.static_len; // bit length of current block with static trees\n\t\tvar matches; // number of string matches in current block\n\t\tvar last_eob_len; // bit length of EOB code for last block\n\n\t\t// Output buffer. bits are inserted starting at the bottom (least\n\t\t// significant bits).\n\t\tvar bi_buf;\n\n\t\t// Number of valid bits in bi_buf. All bits above the last valid bit\n\t\t// are always zero.\n\t\tvar bi_valid;\n\n\t\t// number of codes at each bit length for an optimal tree\n\t\tthat.bl_count = [];\n\n\t\t// heap used to build the Huffman trees\n\t\tthat.heap = [];\n\n\t\tdyn_ltree = [];\n\t\tdyn_dtree = [];\n\t\tbl_tree = [];\n\n\t\tfunction lm_init() {\n\t\t\tvar i;\n\t\t\twindow_size = 2 * w_size;\n\n\t\t\thead[hash_size - 1] = 0;\n\t\t\tfor (i = 0; i < hash_size - 1; i++) {\n\t\t\t\thead[i] = 0;\n\t\t\t}\n\n\t\t\t// Set the default configuration parameters:\n\t\t\tmax_lazy_match = config_table[level].max_lazy;\n\t\t\tgood_match = config_table[level].good_length;\n\t\t\tnice_match = config_table[level].nice_length;\n\t\t\tmax_chain_length = config_table[level].max_chain;\n\n\t\t\tstrstart = 0;\n\t\t\tblock_start = 0;\n\t\t\tlookahead = 0;\n\t\t\tmatch_length = prev_length = MIN_MATCH - 1;\n\t\t\tmatch_available = 0;\n\t\t\tins_h = 0;\n\t\t}\n\n\t\tfunction init_block() {\n\t\t\tvar i;\n\t\t\t// Initialize the trees.\n\t\t\tfor (i = 0; i < L_CODES; i++)\n\t\t\t\tdyn_ltree[i * 2] = 0;\n\t\t\tfor (i = 0; i < D_CODES; i++)\n\t\t\t\tdyn_dtree[i * 2] = 0;\n\t\t\tfor (i = 0; i < BL_CODES; i++)\n\t\t\t\tbl_tree[i * 2] = 0;\n\n\t\t\tdyn_ltree[END_BLOCK * 2] = 1;\n\t\t\tthat.opt_len = that.static_len = 0;\n\t\t\tlast_lit = matches = 0;\n\t\t}\n\n\t\t// Initialize the tree data structures for a new zlib stream.\n\t\tfunction tr_init() {\n\n\t\t\tl_desc.dyn_tree = dyn_ltree;\n\t\t\tl_desc.stat_desc = StaticTree.static_l_desc;\n\n\t\t\td_desc.dyn_tree = dyn_dtree;\n\t\t\td_desc.stat_desc = StaticTree.static_d_desc;\n\n\t\t\tbl_desc.dyn_tree = bl_tree;\n\t\t\tbl_desc.stat_desc = StaticTree.static_bl_desc;\n\n\t\t\tbi_buf = 0;\n\t\t\tbi_valid = 0;\n\t\t\tlast_eob_len = 8; // enough lookahead for inflate\n\n\t\t\t// Initialize the first block of the first file:\n\t\t\tinit_block();\n\t\t}\n\n\t\t// Restore the heap property by moving down the tree starting at node k,\n\t\t// exchanging a node with the smallest of its two sons if necessary,\n\t\t// stopping\n\t\t// when the heap property is re-established (each father smaller than its\n\t\t// two sons).\n\t\tthat.pqdownheap = function(tree, // the tree to restore\n\t\tk // node to move down\n\t\t) {\n\t\t\tvar heap = that.heap;\n\t\t\tvar v = heap[k];\n\t\t\tvar j = k << 1; // left son of k\n\t\t\twhile (j <= that.heap_len) {\n\t\t\t\t// Set j to the smallest of the two sons:\n\t\t\t\tif (j < that.heap_len && smaller(tree, heap[j + 1], heap[j], that.depth)) {\n\t\t\t\t\tj++;\n\t\t\t\t}\n\t\t\t\t// Exit if v is smaller than both sons\n\t\t\t\tif (smaller(tree, v, heap[j], that.depth))\n\t\t\t\t\tbreak;\n\n\t\t\t\t// Exchange v with the smallest son\n\t\t\t\theap[k] = heap[j];\n\t\t\t\tk = j;\n\t\t\t\t// And continue down the tree, setting j to the left son of k\n\t\t\t\tj <<= 1;\n\t\t\t}\n\t\t\theap[k] = v;\n\t\t};\n\n\t\t// Scan a literal or distance tree to determine the frequencies of the codes\n\t\t// in the bit length tree.\n\t\tfunction scan_tree(tree,// the tree to be scanned\n\t\tmax_code // and its largest code of non zero frequency\n\t\t) {\n\t\t\tvar n; // iterates over all tree elements\n\t\t\tvar prevlen = -1; // last emitted length\n\t\t\tvar curlen; // length of current code\n\t\t\tvar nextlen = tree[0 * 2 + 1]; // length of next code\n\t\t\tvar count = 0; // repeat count of the current code\n\t\t\tvar max_count = 7; // max repeat count\n\t\t\tvar min_count = 4; // min repeat count\n\n\t\t\tif (nextlen === 0) {\n\t\t\t\tmax_count = 138;\n\t\t\t\tmin_count = 3;\n\t\t\t}\n\t\t\ttree[(max_code + 1) * 2 + 1] = 0xffff; // guard\n\n\t\t\tfor (n = 0; n <= max_code; n++) {\n\t\t\t\tcurlen = nextlen;\n\t\t\t\tnextlen = tree[(n + 1) * 2 + 1];\n\t\t\t\tif (++count < max_count && curlen == nextlen) {\n\t\t\t\t\tcontinue;\n\t\t\t\t} else if (count < min_count) {\n\t\t\t\t\tbl_tree[curlen * 2] += count;\n\t\t\t\t} else if (curlen !== 0) {\n\t\t\t\t\tif (curlen != prevlen)\n\t\t\t\t\t\tbl_tree[curlen * 2]++;\n\t\t\t\t\tbl_tree[REP_3_6 * 2]++;\n\t\t\t\t} else if (count <= 10) {\n\t\t\t\t\tbl_tree[REPZ_3_10 * 2]++;\n\t\t\t\t} else {\n\t\t\t\t\tbl_tree[REPZ_11_138 * 2]++;\n\t\t\t\t}\n\t\t\t\tcount = 0;\n\t\t\t\tprevlen = curlen;\n\t\t\t\tif (nextlen === 0) {\n\t\t\t\t\tmax_count = 138;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else if (curlen == nextlen) {\n\t\t\t\t\tmax_count = 6;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else {\n\t\t\t\t\tmax_count = 7;\n\t\t\t\t\tmin_count = 4;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Construct the Huffman tree for the bit lengths and return the index in\n\t\t// bl_order of the last bit length code to send.\n\t\tfunction build_bl_tree() {\n\t\t\tvar max_blindex; // index of last bit length code of non zero freq\n\n\t\t\t// Determine the bit length frequencies for literal and distance trees\n\t\t\tscan_tree(dyn_ltree, l_desc.max_code);\n\t\t\tscan_tree(dyn_dtree, d_desc.max_code);\n\n\t\t\t// Build the bit length tree:\n\t\t\tbl_desc.build_tree(that);\n\t\t\t// opt_len now includes the length of the tree representations, except\n\t\t\t// the lengths of the bit lengths codes and the 5+5+4 bits for the\n\t\t\t// counts.\n\n\t\t\t// Determine the number of bit length codes to send. The pkzip format\n\t\t\t// requires that at least 4 bit length codes be sent. (appnote.txt says\n\t\t\t// 3 but the actual value used is 4.)\n\t\t\tfor (max_blindex = BL_CODES - 1; max_blindex >= 3; max_blindex--) {\n\t\t\t\tif (bl_tree[Tree.bl_order[max_blindex] * 2 + 1] !== 0)\n\t\t\t\t\tbreak;\n\t\t\t}\n\t\t\t// Update opt_len to include the bit length tree and counts\n\t\t\tthat.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;\n\n\t\t\treturn max_blindex;\n\t\t}\n\n\t\t// Output a byte on the stream.\n\t\t// IN assertion: there is enough room in pending_buf.\n\t\tfunction put_byte(p) {\n\t\t\tthat.pending_buf[that.pending++] = p;\n\t\t}\n\n\t\tfunction put_short(w) {\n\t\t\tput_byte(w & 0xff);\n\t\t\tput_byte((w >>> 8) & 0xff);\n\t\t}\n\n\t\tfunction putShortMSB(b) {\n\t\t\tput_byte((b >> 8) & 0xff);\n\t\t\tput_byte((b & 0xff) & 0xff);\n\t\t}\n\n\t\tfunction send_bits(value, length) {\n\t\t\tvar val, len = length;\n\t\t\tif (bi_valid > Buf_size - len) {\n\t\t\t\tval = value;\n\t\t\t\t// bi_buf |= (val << bi_valid);\n\t\t\t\tbi_buf |= ((val << bi_valid) & 0xffff);\n\t\t\t\tput_short(bi_buf);\n\t\t\t\tbi_buf = val >>> (Buf_size - bi_valid);\n\t\t\t\tbi_valid += len - Buf_size;\n\t\t\t} else {\n\t\t\t\t// bi_buf |= (value) << bi_valid;\n\t\t\t\tbi_buf |= (((value) << bi_valid) & 0xffff);\n\t\t\t\tbi_valid += len;\n\t\t\t}\n\t\t}\n\n\t\tfunction send_code(c, tree) {\n\t\t\tvar c2 = c * 2;\n\t\t\tsend_bits(tree[c2] & 0xffff, tree[c2 + 1] & 0xffff);\n\t\t}\n\n\t\t// Send a literal or distance tree in compressed form, using the codes in\n\t\t// bl_tree.\n\t\tfunction send_tree(tree,// the tree to be sent\n\t\tmax_code // and its largest code of non zero frequency\n\t\t) {\n\t\t\tvar n; // iterates over all tree elements\n\t\t\tvar prevlen = -1; // last emitted length\n\t\t\tvar curlen; // length of current code\n\t\t\tvar nextlen = tree[0 * 2 + 1]; // length of next code\n\t\t\tvar count = 0; // repeat count of the current code\n\t\t\tvar max_count = 7; // max repeat count\n\t\t\tvar min_count = 4; // min repeat count\n\n\t\t\tif (nextlen === 0) {\n\t\t\t\tmax_count = 138;\n\t\t\t\tmin_count = 3;\n\t\t\t}\n\n\t\t\tfor (n = 0; n <= max_code; n++) {\n\t\t\t\tcurlen = nextlen;\n\t\t\t\tnextlen = tree[(n + 1) * 2 + 1];\n\t\t\t\tif (++count < max_count && curlen == nextlen) {\n\t\t\t\t\tcontinue;\n\t\t\t\t} else if (count < min_count) {\n\t\t\t\t\tdo {\n\t\t\t\t\t\tsend_code(curlen, bl_tree);\n\t\t\t\t\t} while (--count !== 0);\n\t\t\t\t} else if (curlen !== 0) {\n\t\t\t\t\tif (curlen != prevlen) {\n\t\t\t\t\t\tsend_code(curlen, bl_tree);\n\t\t\t\t\t\tcount--;\n\t\t\t\t\t}\n\t\t\t\t\tsend_code(REP_3_6, bl_tree);\n\t\t\t\t\tsend_bits(count - 3, 2);\n\t\t\t\t} else if (count <= 10) {\n\t\t\t\t\tsend_code(REPZ_3_10, bl_tree);\n\t\t\t\t\tsend_bits(count - 3, 3);\n\t\t\t\t} else {\n\t\t\t\t\tsend_code(REPZ_11_138, bl_tree);\n\t\t\t\t\tsend_bits(count - 11, 7);\n\t\t\t\t}\n\t\t\t\tcount = 0;\n\t\t\t\tprevlen = curlen;\n\t\t\t\tif (nextlen === 0) {\n\t\t\t\t\tmax_count = 138;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else if (curlen == nextlen) {\n\t\t\t\t\tmax_count = 6;\n\t\t\t\t\tmin_count = 3;\n\t\t\t\t} else {\n\t\t\t\t\tmax_count = 7;\n\t\t\t\t\tmin_count = 4;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\t// Send the header for a block using dynamic Huffman trees: the counts, the\n\t\t// lengths of the bit length codes, the literal tree and the distance tree.\n\t\t// IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.\n\t\tfunction send_all_trees(lcodes, dcodes, blcodes) {\n\t\t\tvar rank; // index in bl_order\n\n\t\t\tsend_bits(lcodes - 257, 5); // not +255 as stated in appnote.txt\n\t\t\tsend_bits(dcodes - 1, 5);\n\t\t\tsend_bits(blcodes - 4, 4); // not -3 as stated in appnote.txt\n\t\t\tfor (rank = 0; rank < blcodes; rank++) {\n\t\t\t\tsend_bits(bl_tree[Tree.bl_order[rank] * 2 + 1], 3);\n\t\t\t}\n\t\t\tsend_tree(dyn_ltree, lcodes - 1); // literal tree\n\t\t\tsend_tree(dyn_dtree, dcodes - 1); // distance tree\n\t\t}\n\n\t\t// Flush the bit buffer, keeping at most 7 bits in it.\n\t\tfunction bi_flush() {\n\t\t\tif (bi_valid == 16) {\n\t\t\t\tput_short(bi_buf);\n\t\t\t\tbi_buf = 0;\n\t\t\t\tbi_valid = 0;\n\t\t\t} else if (bi_valid >= 8) {\n\t\t\t\tput_byte(bi_buf & 0xff);\n\t\t\t\tbi_buf >>>= 8;\n\t\t\t\tbi_valid -= 8;\n\t\t\t}\n\t\t}\n\n\t\t// Send one empty static block to give enough lookahead for inflate.\n\t\t// This takes 10 bits, of which 7 may remain in the bit buffer.\n\t\t// The current inflate code requires 9 bits of lookahead. If the\n\t\t// last two codes for the previous block (real code plus EOB) were coded\n\t\t// on 5 bits or less, inflate may have only 5+3 bits of lookahead to decode\n\t\t// the last real code. In this case we send two empty static blocks instead\n\t\t// of one. (There are no problems if the previous block is stored or fixed.)\n\t\t// To simplify the code, we assume the worst case of last real code encoded\n\t\t// on one bit only.\n\t\tfunction _tr_align() {\n\t\t\tsend_bits(STATIC_TREES << 1, 3);\n\t\t\tsend_code(END_BLOCK, StaticTree.static_ltree);\n\n\t\t\tbi_flush();\n\n\t\t\t// Of the 10 bits for the empty block, we have already sent\n\t\t\t// (10 - bi_valid) bits. The lookahead for the last real code (before\n\t\t\t// the EOB of the previous block) was thus at least one plus the length\n\t\t\t// of the EOB plus what we have just sent of the empty static block.\n\t\t\tif (1 + last_eob_len + 10 - bi_valid < 9) {\n\t\t\t\tsend_bits(STATIC_TREES << 1, 3);\n\t\t\t\tsend_code(END_BLOCK, StaticTree.static_ltree);\n\t\t\t\tbi_flush();\n\t\t\t}\n\t\t\tlast_eob_len = 7;\n\t\t}\n\n\t\t// Save the match info and tally the frequency counts. Return true if\n\t\t// the current block must be flushed.\n\t\tfunction _tr_tally(dist, // distance of matched string\n\t\tlc // match length-MIN_MATCH or unmatched char (if dist==0)\n\t\t) {\n\t\t\tvar out_length, in_length, dcode;\n\t\t\tthat.pending_buf[d_buf + last_lit * 2] = (dist >>> 8) & 0xff;\n\t\t\tthat.pending_buf[d_buf + last_lit * 2 + 1] = dist & 0xff;\n\n\t\t\tthat.pending_buf[l_buf + last_lit] = lc & 0xff;\n\t\t\tlast_lit++;\n\n\t\t\tif (dist === 0) {\n\t\t\t\t// lc is the unmatched char\n\t\t\t\tdyn_ltree[lc * 2]++;\n\t\t\t} else {\n\t\t\t\tmatches++;\n\t\t\t\t// Here, lc is the match length - MIN_MATCH\n\t\t\t\tdist--; // dist = match distance - 1\n\t\t\t\tdyn_ltree[(Tree._length_code[lc] + LITERALS + 1) * 2]++;\n\t\t\t\tdyn_dtree[Tree.d_code(dist) * 2]++;\n\t\t\t}\n\n\t\t\tif ((last_lit & 0x1fff) === 0 && level > 2) {\n\t\t\t\t// Compute an upper bound for the compressed length\n\t\t\t\tout_length = last_lit * 8;\n\t\t\t\tin_length = strstart - block_start;\n\t\t\t\tfor (dcode = 0; dcode < D_CODES; dcode++) {\n\t\t\t\t\tout_length += dyn_dtree[dcode * 2] * (5 + Tree.extra_dbits[dcode]);\n\t\t\t\t}\n\t\t\t\tout_length >>>= 3;\n\t\t\t\tif ((matches < Math.floor(last_lit / 2)) && out_length < Math.floor(in_length / 2))\n\t\t\t\t\treturn true;\n\t\t\t}\n\n\t\t\treturn (last_lit == lit_bufsize - 1);\n\t\t\t// We avoid equality with lit_bufsize because of wraparound at 64K\n\t\t\t// on 16 bit machines and because stored blocks are restricted to\n\t\t\t// 64K-1 bytes.\n\t\t}\n\n\t\t// Send the block data compressed using the given Huffman trees\n\t\tfunction compress_block(ltree, dtree) {\n\t\t\tvar dist; // distance of matched string\n\t\t\tvar lc; // match length or unmatched char (if dist === 0)\n\t\t\tvar lx = 0; // running index in l_buf\n\t\t\tvar code; // the code to send\n\t\t\tvar extra; // number of extra bits to send\n\n\t\t\tif (last_lit !== 0) {\n\t\t\t\tdo {\n\t\t\t\t\tdist = ((that.pending_buf[d_buf + lx * 2] << 8) & 0xff00) | (that.pending_buf[d_buf + lx * 2 + 1] & 0xff);\n\t\t\t\t\tlc = (that.pending_buf[l_buf + lx]) & 0xff;\n\t\t\t\t\tlx++;\n\n\t\t\t\t\tif (dist === 0) {\n\t\t\t\t\t\tsend_code(lc, ltree); // send a literal byte\n\t\t\t\t\t} else {\n\t\t\t\t\t\t// Here, lc is the match length - MIN_MATCH\n\t\t\t\t\t\tcode = Tree._length_code[lc];\n\n\t\t\t\t\t\tsend_code(code + LITERALS + 1, ltree); // send the length\n\t\t\t\t\t\t// code\n\t\t\t\t\t\textra = Tree.extra_lbits[code];\n\t\t\t\t\t\tif (extra !== 0) {\n\t\t\t\t\t\t\tlc -= Tree.base_length[code];\n\t\t\t\t\t\t\tsend_bits(lc, extra); // send the extra length bits\n\t\t\t\t\t\t}\n\t\t\t\t\t\tdist--; // dist is now the match distance - 1\n\t\t\t\t\t\tcode = Tree.d_code(dist);\n\n\t\t\t\t\t\tsend_code(code, dtree); // send the distance code\n\t\t\t\t\t\textra = Tree.extra_dbits[code];\n\t\t\t\t\t\tif (extra !== 0) {\n\t\t\t\t\t\t\tdist -= Tree.base_dist[code];\n\t\t\t\t\t\t\tsend_bits(dist, extra); // send the extra distance bits\n\t\t\t\t\t\t}\n\t\t\t\t\t} // literal or match pair ?\n\n\t\t\t\t\t// Check that the overlay between pending_buf and d_buf+l_buf is\n\t\t\t\t\t// ok:\n\t\t\t\t} while (lx < last_lit);\n\t\t\t}\n\n\t\t\tsend_code(END_BLOCK, ltree);\n\t\t\tlast_eob_len = ltree[END_BLOCK * 2 + 1];\n\t\t}\n\n\t\t// Flush the bit buffer and align the output on a byte boundary\n\t\tfunction bi_windup() {\n\t\t\tif (bi_valid > 8) {\n\t\t\t\tput_short(bi_buf);\n\t\t\t} else if (bi_valid > 0) {\n\t\t\t\tput_byte(bi_buf & 0xff);\n\t\t\t}\n\t\t\tbi_buf = 0;\n\t\t\tbi_valid = 0;\n\t\t}\n\n\t\t// Copy a stored block, storing first the length and its\n\t\t// one\'s complement if requested.\n\t\tfunction copy_block(buf, // the input data\n\t\tlen, // its length\n\t\theader // true if block header must be written\n\t\t) {\n\t\t\tbi_windup(); // align on byte boundary\n\t\t\tlast_eob_len = 8; // enough lookahead for inflate\n\n\t\t\tif (header) {\n\t\t\t\tput_short(len);\n\t\t\t\tput_short(~len);\n\t\t\t}\n\n\t\t\tthat.pending_buf.set(window.subarray(buf, buf + len), that.pending);\n\t\t\tthat.pending += len;\n\t\t}\n\n\t\t// Send a stored block\n\t\tfunction _tr_stored_block(buf, // input block\n\t\tstored_len, // length of input block\n\t\teof // true if this is the last block for a file\n\t\t) {\n\t\t\tsend_bits((STORED_BLOCK << 1) + (eof ? 1 : 0), 3); // send block type\n\t\t\tcopy_block(buf, stored_len, true); // with header\n\t\t}\n\n\t\t// Determine the best encoding for the current block: dynamic trees, static\n\t\t// trees or store, and output the encoded block to the zip file.\n\t\tfunction _tr_flush_block(buf, // input block, or NULL if too old\n\t\tstored_len, // length of input block\n\t\teof // true if this is the last block for a file\n\t\t) {\n\t\t\tvar opt_lenb, static_lenb;// opt_len and static_len in bytes\n\t\t\tvar max_blindex = 0; // index of last bit length code of non zero freq\n\n\t\t\t// Build the Huffman trees unless a stored block is forced\n\t\t\tif (level > 0) {\n\t\t\t\t// Construct the literal and distance trees\n\t\t\t\tl_desc.build_tree(that);\n\n\t\t\t\td_desc.build_tree(that);\n\n\t\t\t\t// At this point, opt_len and static_len are the total bit lengths\n\t\t\t\t// of\n\t\t\t\t// the compressed block data, excluding the tree representations.\n\n\t\t\t\t// Build the bit length tree for the above two trees, and get the\n\t\t\t\t// index\n\t\t\t\t// in bl_order of the last bit length code to send.\n\t\t\t\tmax_blindex = build_bl_tree();\n\n\t\t\t\t// Determine the best encoding. Compute first the block length in\n\t\t\t\t// bytes\n\t\t\t\topt_lenb = (that.opt_len + 3 + 7) >>> 3;\n\t\t\t\tstatic_lenb = (that.static_len + 3 + 7) >>> 3;\n\n\t\t\t\tif (static_lenb <= opt_lenb)\n\t\t\t\t\topt_lenb = static_lenb;\n\t\t\t} else {\n\t\t\t\topt_lenb = static_lenb = stored_len + 5; // force a stored block\n\t\t\t}\n\n\t\t\tif ((stored_len + 4 <= opt_lenb) && buf != -1) {\n\t\t\t\t// 4: two words for the lengths\n\t\t\t\t// The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.\n\t\t\t\t// Otherwise we can\'t have processed more than WSIZE input bytes\n\t\t\t\t// since\n\t\t\t\t// the last block flush, because compression would have been\n\t\t\t\t// successful. If LIT_BUFSIZE <= WSIZE, it is never too late to\n\t\t\t\t// transform a block into a stored block.\n\t\t\t\t_tr_stored_block(buf, stored_len, eof);\n\t\t\t} else if (static_lenb == opt_lenb) {\n\t\t\t\tsend_bits((STATIC_TREES << 1) + (eof ? 1 : 0), 3);\n\t\t\t\tcompress_block(StaticTree.static_ltree, StaticTree.static_dtree);\n\t\t\t} else {\n\t\t\t\tsend_bits((DYN_TREES << 1) + (eof ? 1 : 0), 3);\n\t\t\t\tsend_all_trees(l_desc.max_code + 1, d_desc.max_code + 1, max_blindex + 1);\n\t\t\t\tcompress_block(dyn_ltree, dyn_dtree);\n\t\t\t}\n\n\t\t\t// The above check is made mod 2^32, for files larger than 512 MB\n\t\t\t// and uLong implemented on 32 bits.\n\n\t\t\tinit_block();\n\n\t\t\tif (eof) {\n\t\t\t\tbi_windup();\n\t\t\t}\n\t\t}\n\n\t\tfunction flush_block_only(eof) {\n\t\t\t_tr_flush_block(block_start >= 0 ? block_start : -1, strstart - block_start, eof);\n\t\t\tblock_start = strstart;\n\t\t\tstrm.flush_pending();\n\t\t}\n\n\t\t// Fill the window when the lookahead becomes insufficient.\n\t\t// Updates strstart and lookahead.\n\t\t//\n\t\t// IN assertion: lookahead < MIN_LOOKAHEAD\n\t\t// OUT assertions: strstart <= window_size-MIN_LOOKAHEAD\n\t\t// At least one byte has been read, or avail_in === 0; reads are\n\t\t// performed for at least two bytes (required for the zip translate_eol\n\t\t// option -- not supported here).\n\t\tfunction fill_window() {\n\t\t\tvar n, m;\n\t\t\tvar p;\n\t\t\tvar more; // Amount of free space at the end of the window.\n\n\t\t\tdo {\n\t\t\t\tmore = (window_size - lookahead - strstart);\n\n\t\t\t\t// Deal with !@#$% 64K limit:\n\t\t\t\tif (more === 0 && strstart === 0 && lookahead === 0) {\n\t\t\t\t\tmore = w_size;\n\t\t\t\t} else if (more == -1) {\n\t\t\t\t\t// Very unlikely, but possible on 16 bit machine if strstart ==\n\t\t\t\t\t// 0\n\t\t\t\t\t// and lookahead == 1 (input done one byte at time)\n\t\t\t\t\tmore--;\n\n\t\t\t\t\t// If the window is almost full and there is insufficient\n\t\t\t\t\t// lookahead,\n\t\t\t\t\t// move the upper half to the lower one to make room in the\n\t\t\t\t\t// upper half.\n\t\t\t\t} else if (strstart >= w_size + w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\twindow.set(window.subarray(w_size, w_size + w_size), 0);\n\n\t\t\t\t\tmatch_start -= w_size;\n\t\t\t\t\tstrstart -= w_size; // we now have strstart >= MAX_DIST\n\t\t\t\t\tblock_start -= w_size;\n\n\t\t\t\t\t// Slide the hash table (could be avoided with 32 bit values\n\t\t\t\t\t// at the expense of memory usage). We slide even when level ==\n\t\t\t\t\t// 0\n\t\t\t\t\t// to keep the hash table consistent if we switch back to level\n\t\t\t\t\t// > 0\n\t\t\t\t\t// later. (Using level 0 permanently is not an optimal usage of\n\t\t\t\t\t// zlib, so we don\'t care about this pathological case.)\n\n\t\t\t\t\tn = hash_size;\n\t\t\t\t\tp = n;\n\t\t\t\t\tdo {\n\t\t\t\t\t\tm = (head[--p] & 0xffff);\n\t\t\t\t\t\thead[p] = (m >= w_size ? m - w_size : 0);\n\t\t\t\t\t} while (--n !== 0);\n\n\t\t\t\t\tn = w_size;\n\t\t\t\t\tp = n;\n\t\t\t\t\tdo {\n\t\t\t\t\t\tm = (prev[--p] & 0xffff);\n\t\t\t\t\t\tprev[p] = (m >= w_size ? m - w_size : 0);\n\t\t\t\t\t\t// If n is not on any hash chain, prev[n] is garbage but\n\t\t\t\t\t\t// its value will never be used.\n\t\t\t\t\t} while (--n !== 0);\n\t\t\t\t\tmore += w_size;\n\t\t\t\t}\n\n\t\t\t\tif (strm.avail_in === 0)\n\t\t\t\t\treturn;\n\n\t\t\t\t// If there was no sliding:\n\t\t\t\t// strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&\n\t\t\t\t// more == window_size - lookahead - strstart\n\t\t\t\t// => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)\n\t\t\t\t// => more >= window_size - 2*WSIZE + 2\n\t\t\t\t// In the BIG_MEM or MMAP case (not yet supported),\n\t\t\t\t// window_size == input_size + MIN_LOOKAHEAD &&\n\t\t\t\t// strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.\n\t\t\t\t// Otherwise, window_size == 2*WSIZE so more >= 2.\n\t\t\t\t// If there was sliding, more >= WSIZE. So in all cases, more >= 2.\n\n\t\t\t\tn = strm.read_buf(window, strstart + lookahead, more);\n\t\t\t\tlookahead += n;\n\n\t\t\t\t// Initialize the hash value now that we have some input:\n\t\t\t\tif (lookahead >= MIN_MATCH) {\n\t\t\t\t\tins_h = window[strstart] & 0xff;\n\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[strstart + 1] & 0xff)) & hash_mask;\n\t\t\t\t}\n\t\t\t\t// If the whole input has less than MIN_MATCH bytes, ins_h is\n\t\t\t\t// garbage,\n\t\t\t\t// but this is not important since only literal bytes will be\n\t\t\t\t// emitted.\n\t\t\t} while (lookahead < MIN_LOOKAHEAD && strm.avail_in !== 0);\n\t\t}\n\n\t\t// Copy without compression as much as possible from the input stream,\n\t\t// return\n\t\t// the current block state.\n\t\t// This function does not insert new strings in the dictionary since\n\t\t// uncompressible data is probably not useful. This function is used\n\t\t// only for the level=0 compression option.\n\t\t// NOTE: this function should be optimized to avoid extra copying from\n\t\t// window to pending_buf.\n\t\tfunction deflate_stored(flush) {\n\t\t\t// Stored blocks are limited to 0xffff bytes, pending_buf is limited\n\t\t\t// to pending_buf_size, and each stored block has a 5 byte header:\n\n\t\t\tvar max_block_size = 0xffff;\n\t\t\tvar max_start;\n\n\t\t\tif (max_block_size > pending_buf_size - 5) {\n\t\t\t\tmax_block_size = pending_buf_size - 5;\n\t\t\t}\n\n\t\t\t// Copy as much as possible from input to output:\n\t\t\twhile (true) {\n\t\t\t\t// Fill the window as much as possible:\n\t\t\t\tif (lookahead <= 1) {\n\t\t\t\t\tfill_window();\n\t\t\t\t\tif (lookahead === 0 && flush == Z_NO_FLUSH)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\tif (lookahead === 0)\n\t\t\t\t\t\tbreak; // flush the current block\n\t\t\t\t}\n\n\t\t\t\tstrstart += lookahead;\n\t\t\t\tlookahead = 0;\n\n\t\t\t\t// Emit a stored block if pending_buf will be full:\n\t\t\t\tmax_start = block_start + max_block_size;\n\t\t\t\tif (strstart === 0 || strstart >= max_start) {\n\t\t\t\t\t// strstart === 0 is possible when wraparound on 16-bit machine\n\t\t\t\t\tlookahead = (strstart - max_start);\n\t\t\t\t\tstrstart = max_start;\n\n\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\n\t\t\t\t}\n\n\t\t\t\t// Flush if we may have to slide, otherwise block_start may become\n\t\t\t\t// negative and the data will be gone:\n\t\t\t\tif (strstart - block_start >= w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tflush_block_only(flush == Z_FINISH);\n\t\t\tif (strm.avail_out === 0)\n\t\t\t\treturn (flush == Z_FINISH) ? FinishStarted : NeedMore;\n\n\t\t\treturn flush == Z_FINISH ? FinishDone : BlockDone;\n\t\t}\n\n\t\tfunction longest_match(cur_match) {\n\t\t\tvar chain_length = max_chain_length; // max hash chain length\n\t\t\tvar scan = strstart; // current string\n\t\t\tvar match; // matched string\n\t\t\tvar len; // length of current match\n\t\t\tvar best_len = prev_length; // best match length so far\n\t\t\tvar limit = strstart > (w_size - MIN_LOOKAHEAD) ? strstart - (w_size - MIN_LOOKAHEAD) : 0;\n\t\t\tvar _nice_match = nice_match;\n\n\t\t\t// Stop when cur_match becomes <= limit. To simplify the code,\n\t\t\t// we prevent matches with the string of window index 0.\n\n\t\t\tvar wmask = w_mask;\n\n\t\t\tvar strend = strstart + MAX_MATCH;\n\t\t\tvar scan_end1 = window[scan + best_len - 1];\n\t\t\tvar scan_end = window[scan + best_len];\n\n\t\t\t// The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of\n\t\t\t// 16.\n\t\t\t// It is easy to get rid of this optimization if necessary.\n\n\t\t\t// Do not waste too much time if we already have a good match:\n\t\t\tif (prev_length >= good_match) {\n\t\t\t\tchain_length >>= 2;\n\t\t\t}\n\n\t\t\t// Do not look for matches beyond the end of the input. This is\n\t\t\t// necessary\n\t\t\t// to make deflate deterministic.\n\t\t\tif (_nice_match > lookahead)\n\t\t\t\t_nice_match = lookahead;\n\n\t\t\tdo {\n\t\t\t\tmatch = cur_match;\n\n\t\t\t\t// Skip to next match if the match length cannot increase\n\t\t\t\t// or if the match length is less than 2:\n\t\t\t\tif (window[match + best_len] != scan_end || window[match + best_len - 1] != scan_end1 || window[match] != window[scan]\n\t\t\t\t\t\t|| window[++match] != window[scan + 1])\n\t\t\t\t\tcontinue;\n\n\t\t\t\t// The check at best_len-1 can be removed because it will be made\n\t\t\t\t// again later. (This heuristic is not always a win.)\n\t\t\t\t// It is not necessary to compare scan[2] and match[2] since they\n\t\t\t\t// are always equal when the other bytes match, given that\n\t\t\t\t// the hash keys are equal and that HASH_BITS >= 8.\n\t\t\t\tscan += 2;\n\t\t\t\tmatch++;\n\n\t\t\t\t// We check for insufficient lookahead only every 8th comparison;\n\t\t\t\t// the 256th check will be made at strstart+258.\n\t\t\t\tdo {\n\t\t\t\t} while (window[++scan] == window[++match] && window[++scan] == window[++match] && window[++scan] == window[++match]\n\t\t\t\t\t\t&& window[++scan] == window[++match] && window[++scan] == window[++match] && window[++scan] == window[++match]\n\t\t\t\t\t\t&& window[++scan] == window[++match] && window[++scan] == window[++match] && scan < strend);\n\n\t\t\t\tlen = MAX_MATCH - (strend - scan);\n\t\t\t\tscan = strend - MAX_MATCH;\n\n\t\t\t\tif (len > best_len) {\n\t\t\t\t\tmatch_start = cur_match;\n\t\t\t\t\tbest_len = len;\n\t\t\t\t\tif (len >= _nice_match)\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tscan_end1 = window[scan + best_len - 1];\n\t\t\t\t\tscan_end = window[scan + best_len];\n\t\t\t\t}\n\n\t\t\t} while ((cur_match = (prev[cur_match & wmask] & 0xffff)) > limit && --chain_length !== 0);\n\n\t\t\tif (best_len <= lookahead)\n\t\t\t\treturn best_len;\n\t\t\treturn lookahead;\n\t\t}\n\n\t\t// Compress as much as possible from the input stream, return the current\n\t\t// block state.\n\t\t// This function does not perform lazy evaluation of matches and inserts\n\t\t// new strings in the dictionary only for unmatched strings or for short\n\t\t// matches. It is used only for the fast compression options.\n\t\tfunction deflate_fast(flush) {\n\t\t\t// short hash_head = 0; // head of the hash chain\n\t\t\tvar hash_head = 0; // head of the hash chain\n\t\t\tvar bflush; // set if current block must be flushed\n\n\t\t\twhile (true) {\n\t\t\t\t// Make sure that we always have enough lookahead, except\n\t\t\t\t// at the end of the input file. We need MAX_MATCH bytes\n\t\t\t\t// for the next match, plus MIN_MATCH bytes to insert the\n\t\t\t\t// string following the next match.\n\t\t\t\tif (lookahead < MIN_LOOKAHEAD) {\n\t\t\t\t\tfill_window();\n\t\t\t\t\tif (lookahead < MIN_LOOKAHEAD && flush == Z_NO_FLUSH) {\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\t}\n\t\t\t\t\tif (lookahead === 0)\n\t\t\t\t\t\tbreak; // flush the current block\n\t\t\t\t}\n\n\t\t\t\t// Insert the string window[strstart .. strstart+2] in the\n\t\t\t\t// dictionary, and set hash_head to the head of the hash chain:\n\t\t\t\tif (lookahead >= MIN_MATCH) {\n\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\n\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\thead[ins_h] = strstart;\n\t\t\t\t}\n\n\t\t\t\t// Find the longest match, discarding those <= prev_length.\n\t\t\t\t// At this point we have always match_length < MIN_MATCH\n\n\t\t\t\tif (hash_head !== 0 && ((strstart - hash_head) & 0xffff) <= w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\t// To simplify the code, we prevent matches with the string\n\t\t\t\t\t// of window index 0 (in particular we have to avoid a match\n\t\t\t\t\t// of the string with itself at the start of the input file).\n\t\t\t\t\tif (strategy != Z_HUFFMAN_ONLY) {\n\t\t\t\t\t\tmatch_length = longest_match(hash_head);\n\t\t\t\t\t}\n\t\t\t\t\t// longest_match() sets match_start\n\t\t\t\t}\n\t\t\t\tif (match_length >= MIN_MATCH) {\n\t\t\t\t\t// check_match(strstart, match_start, match_length);\n\n\t\t\t\t\tbflush = _tr_tally(strstart - match_start, match_length - MIN_MATCH);\n\n\t\t\t\t\tlookahead -= match_length;\n\n\t\t\t\t\t// Insert new strings in the hash table only if the match length\n\t\t\t\t\t// is not too large. This saves time but degrades compression.\n\t\t\t\t\tif (match_length <= max_lazy_match && lookahead >= MIN_MATCH) {\n\t\t\t\t\t\tmatch_length--; // string at strstart already in hash table\n\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\tstrstart++;\n\n\t\t\t\t\t\t\tins_h = ((ins_h << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\t\t\thead[ins_h] = strstart;\n\n\t\t\t\t\t\t\t// strstart never exceeds WSIZE-MAX_MATCH, so there are\n\t\t\t\t\t\t\t// always MIN_MATCH bytes ahead.\n\t\t\t\t\t\t} while (--match_length !== 0);\n\t\t\t\t\t\tstrstart++;\n\t\t\t\t\t} else {\n\t\t\t\t\t\tstrstart += match_length;\n\t\t\t\t\t\tmatch_length = 0;\n\t\t\t\t\t\tins_h = window[strstart] & 0xff;\n\n\t\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[strstart + 1] & 0xff)) & hash_mask;\n\t\t\t\t\t\t// If lookahead < MIN_MATCH, ins_h is garbage, but it does\n\t\t\t\t\t\t// not\n\t\t\t\t\t\t// matter since it will be recomputed at next deflate call.\n\t\t\t\t\t}\n\t\t\t\t} else {\n\t\t\t\t\t// No match, output a literal byte\n\n\t\t\t\t\tbflush = _tr_tally(0, window[strstart] & 0xff);\n\t\t\t\t\tlookahead--;\n\t\t\t\t\tstrstart++;\n\t\t\t\t}\n\t\t\t\tif (bflush) {\n\n\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tflush_block_only(flush == Z_FINISH);\n\t\t\tif (strm.avail_out === 0) {\n\t\t\t\tif (flush == Z_FINISH)\n\t\t\t\t\treturn FinishStarted;\n\t\t\t\telse\n\t\t\t\t\treturn NeedMore;\n\t\t\t}\n\t\t\treturn flush == Z_FINISH ? FinishDone : BlockDone;\n\t\t}\n\n\t\t// Same as above, but achieves better compression. We use a lazy\n\t\t// evaluation for matches: a match is finally adopted only if there is\n\t\t// no better match at the next window position.\n\t\tfunction deflate_slow(flush) {\n\t\t\t// short hash_head = 0; // head of hash chain\n\t\t\tvar hash_head = 0; // head of hash chain\n\t\t\tvar bflush; // set if current block must be flushed\n\t\t\tvar max_insert;\n\n\t\t\t// Process the input block.\n\t\t\twhile (true) {\n\t\t\t\t// Make sure that we always have enough lookahead, except\n\t\t\t\t// at the end of the input file. We need MAX_MATCH bytes\n\t\t\t\t// for the next match, plus MIN_MATCH bytes to insert the\n\t\t\t\t// string following the next match.\n\n\t\t\t\tif (lookahead < MIN_LOOKAHEAD) {\n\t\t\t\t\tfill_window();\n\t\t\t\t\tif (lookahead < MIN_LOOKAHEAD && flush == Z_NO_FLUSH) {\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\t}\n\t\t\t\t\tif (lookahead === 0)\n\t\t\t\t\t\tbreak; // flush the current block\n\t\t\t\t}\n\n\t\t\t\t// Insert the string window[strstart .. strstart+2] in the\n\t\t\t\t// dictionary, and set hash_head to the head of the hash chain:\n\n\t\t\t\tif (lookahead >= MIN_MATCH) {\n\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\thead[ins_h] = strstart;\n\t\t\t\t}\n\n\t\t\t\t// Find the longest match, discarding those <= prev_length.\n\t\t\t\tprev_length = match_length;\n\t\t\t\tprev_match = match_start;\n\t\t\t\tmatch_length = MIN_MATCH - 1;\n\n\t\t\t\tif (hash_head !== 0 && prev_length < max_lazy_match && ((strstart - hash_head) & 0xffff) <= w_size - MIN_LOOKAHEAD) {\n\t\t\t\t\t// To simplify the code, we prevent matches with the string\n\t\t\t\t\t// of window index 0 (in particular we have to avoid a match\n\t\t\t\t\t// of the string with itself at the start of the input file).\n\n\t\t\t\t\tif (strategy != Z_HUFFMAN_ONLY) {\n\t\t\t\t\t\tmatch_length = longest_match(hash_head);\n\t\t\t\t\t}\n\t\t\t\t\t// longest_match() sets match_start\n\n\t\t\t\t\tif (match_length <= 5 && (strategy == Z_FILTERED || (match_length == MIN_MATCH && strstart - match_start > 4096))) {\n\n\t\t\t\t\t\t// If prev_match is also MIN_MATCH, match_start is garbage\n\t\t\t\t\t\t// but we will ignore the current match anyway.\n\t\t\t\t\t\tmatch_length = MIN_MATCH - 1;\n\t\t\t\t\t}\n\t\t\t\t}\n\n\t\t\t\t// If there was a match at the previous step and the current\n\t\t\t\t// match is not better, output the previous match:\n\t\t\t\tif (prev_length >= MIN_MATCH && match_length <= prev_length) {\n\t\t\t\t\tmax_insert = strstart + lookahead - MIN_MATCH;\n\t\t\t\t\t// Do not insert strings in hash table beyond this.\n\n\t\t\t\t\t// check_match(strstart-1, prev_match, prev_length);\n\n\t\t\t\t\tbflush = _tr_tally(strstart - 1 - prev_match, prev_length - MIN_MATCH);\n\n\t\t\t\t\t// Insert in hash table all strings up to the end of the match.\n\t\t\t\t\t// strstart-1 and strstart are already inserted. If there is not\n\t\t\t\t\t// enough lookahead, the last two strings are not inserted in\n\t\t\t\t\t// the hash table.\n\t\t\t\t\tlookahead -= prev_length - 1;\n\t\t\t\t\tprev_length -= 2;\n\t\t\t\t\tdo {\n\t\t\t\t\t\tif (++strstart <= max_insert) {\n\t\t\t\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(strstart) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\t\t\t\t// prev[strstart&w_mask]=hash_head=head[ins_h];\n\t\t\t\t\t\t\thash_head = (head[ins_h] & 0xffff);\n\t\t\t\t\t\t\tprev[strstart & w_mask] = head[ins_h];\n\t\t\t\t\t\t\thead[ins_h] = strstart;\n\t\t\t\t\t\t}\n\t\t\t\t\t} while (--prev_length !== 0);\n\t\t\t\t\tmatch_available = 0;\n\t\t\t\t\tmatch_length = MIN_MATCH - 1;\n\t\t\t\t\tstrstart++;\n\n\t\t\t\t\tif (bflush) {\n\t\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t\t}\n\t\t\t\t} else if (match_available !== 0) {\n\n\t\t\t\t\t// If there was no match at the previous position, output a\n\t\t\t\t\t// single literal. If there was a match but the current match\n\t\t\t\t\t// is longer, truncate the previous match to a single literal.\n\n\t\t\t\t\tbflush = _tr_tally(0, window[strstart - 1] & 0xff);\n\n\t\t\t\t\tif (bflush) {\n\t\t\t\t\t\tflush_block_only(false);\n\t\t\t\t\t}\n\t\t\t\t\tstrstart++;\n\t\t\t\t\tlookahead--;\n\t\t\t\t\tif (strm.avail_out === 0)\n\t\t\t\t\t\treturn NeedMore;\n\t\t\t\t} else {\n\t\t\t\t\t// There is no previous match to compare with, wait for\n\t\t\t\t\t// the next step to decide.\n\n\t\t\t\t\tmatch_available = 1;\n\t\t\t\t\tstrstart++;\n\t\t\t\t\tlookahead--;\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tif (match_available !== 0) {\n\t\t\t\tbflush = _tr_tally(0, window[strstart - 1] & 0xff);\n\t\t\t\tmatch_available = 0;\n\t\t\t}\n\t\t\tflush_block_only(flush == Z_FINISH);\n\n\t\t\tif (strm.avail_out === 0) {\n\t\t\t\tif (flush == Z_FINISH)\n\t\t\t\t\treturn FinishStarted;\n\t\t\t\telse\n\t\t\t\t\treturn NeedMore;\n\t\t\t}\n\n\t\t\treturn flush == Z_FINISH ? FinishDone : BlockDone;\n\t\t}\n\n\t\tfunction deflateReset(strm) {\n\t\t\tstrm.total_in = strm.total_out = 0;\n\t\t\tstrm.msg = null; //\n\t\t\t\n\t\t\tthat.pending = 0;\n\t\t\tthat.pending_out = 0;\n\n\t\t\tstatus = BUSY_STATE;\n\n\t\t\tlast_flush = Z_NO_FLUSH;\n\n\t\t\ttr_init();\n\t\t\tlm_init();\n\t\t\treturn Z_OK;\n\t\t}\n\n\t\tthat.deflateInit = function(strm, _level, bits, _method, memLevel, _strategy) {\n\t\t\tif (!_method)\n\t\t\t\t_method = Z_DEFLATED;\n\t\t\tif (!memLevel)\n\t\t\t\tmemLevel = DEF_MEM_LEVEL;\n\t\t\tif (!_strategy)\n\t\t\t\t_strategy = Z_DEFAULT_STRATEGY;\n\n\t\t\t// byte[] my_version=ZLIB_VERSION;\n\n\t\t\t//\n\t\t\t// if (!version || version[0] != my_version[0]\n\t\t\t// || stream_size != sizeof(z_stream)) {\n\t\t\t// return Z_VERSION_ERROR;\n\t\t\t// }\n\n\t\t\tstrm.msg = null;\n\n\t\t\tif (_level == Z_DEFAULT_COMPRESSION)\n\t\t\t\t_level = 6;\n\n\t\t\tif (memLevel < 1 || memLevel > MAX_MEM_LEVEL || _method != Z_DEFLATED || bits < 9 || bits > 15 || _level < 0 || _level > 9 || _strategy < 0\n\t\t\t\t\t|| _strategy > Z_HUFFMAN_ONLY) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\n\t\t\tstrm.dstate = that;\n\n\t\t\tw_bits = bits;\n\t\t\tw_size = 1 << w_bits;\n\t\t\tw_mask = w_size - 1;\n\n\t\t\thash_bits = memLevel + 7;\n\t\t\thash_size = 1 << hash_bits;\n\t\t\thash_mask = hash_size - 1;\n\t\t\thash_shift = Math.floor((hash_bits + MIN_MATCH - 1) / MIN_MATCH);\n\n\t\t\twindow = new Uint8Array(w_size * 2);\n\t\t\tprev = [];\n\t\t\thead = [];\n\n\t\t\tlit_bufsize = 1 << (memLevel + 6); // 16K elements by default\n\n\t\t\t// We overlay pending_buf and d_buf+l_buf. This works since the average\n\t\t\t// output size for (length,distance) codes is <= 24 bits.\n\t\t\tthat.pending_buf = new Uint8Array(lit_bufsize * 4);\n\t\t\tpending_buf_size = lit_bufsize * 4;\n\n\t\t\td_buf = Math.floor(lit_bufsize / 2);\n\t\t\tl_buf = (1 + 2) * lit_bufsize;\n\n\t\t\tlevel = _level;\n\n\t\t\tstrategy = _strategy;\n\t\t\tmethod = _method & 0xff;\n\n\t\t\treturn deflateReset(strm);\n\t\t};\n\n\t\tthat.deflateEnd = function() {\n\t\t\tif (status != INIT_STATE && status != BUSY_STATE && status != FINISH_STATE) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\t// Deallocate in reverse order of allocations:\n\t\t\tthat.pending_buf = null;\n\t\t\thead = null;\n\t\t\tprev = null;\n\t\t\twindow = null;\n\t\t\t// free\n\t\t\tthat.dstate = null;\n\t\t\treturn status == BUSY_STATE ? Z_DATA_ERROR : Z_OK;\n\t\t};\n\n\t\tthat.deflateParams = function(strm, _level, _strategy) {\n\t\t\tvar err = Z_OK;\n\n\t\t\tif (_level == Z_DEFAULT_COMPRESSION) {\n\t\t\t\t_level = 6;\n\t\t\t}\n\t\t\tif (_level < 0 || _level > 9 || _strategy < 0 || _strategy > Z_HUFFMAN_ONLY) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\n\t\t\tif (config_table[level].func != config_table[_level].func && strm.total_in !== 0) {\n\t\t\t\t// Flush the last buffer:\n\t\t\t\terr = strm.deflate(Z_PARTIAL_FLUSH);\n\t\t\t}\n\n\t\t\tif (level != _level) {\n\t\t\t\tlevel = _level;\n\t\t\t\tmax_lazy_match = config_table[level].max_lazy;\n\t\t\t\tgood_match = config_table[level].good_length;\n\t\t\t\tnice_match = config_table[level].nice_length;\n\t\t\t\tmax_chain_length = config_table[level].max_chain;\n\t\t\t}\n\t\t\tstrategy = _strategy;\n\t\t\treturn err;\n\t\t};\n\n\t\tthat.deflateSetDictionary = function(strm, dictionary, dictLength) {\n\t\t\tvar length = dictLength;\n\t\t\tvar n, index = 0;\n\n\t\t\tif (!dictionary || status != INIT_STATE)\n\t\t\t\treturn Z_STREAM_ERROR;\n\n\t\t\tif (length < MIN_MATCH)\n\t\t\t\treturn Z_OK;\n\t\t\tif (length > w_size - MIN_LOOKAHEAD) {\n\t\t\t\tlength = w_size - MIN_LOOKAHEAD;\n\t\t\t\tindex = dictLength - length; // use the tail of the dictionary\n\t\t\t}\n\t\t\twindow.set(dictionary.subarray(index, index + length), 0);\n\n\t\t\tstrstart = length;\n\t\t\tblock_start = length;\n\n\t\t\t// Insert all strings in the hash table (except for the last two bytes).\n\t\t\t// s->lookahead stays null, so s->ins_h will be recomputed at the next\n\t\t\t// call of fill_window.\n\n\t\t\tins_h = window[0] & 0xff;\n\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[1] & 0xff)) & hash_mask;\n\n\t\t\tfor (n = 0; n <= length - MIN_MATCH; n++) {\n\t\t\t\tins_h = (((ins_h) << hash_shift) ^ (window[(n) + (MIN_MATCH - 1)] & 0xff)) & hash_mask;\n\t\t\t\tprev[n & w_mask] = head[ins_h];\n\t\t\t\thead[ins_h] = n;\n\t\t\t}\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.deflate = function(_strm, flush) {\n\t\t\tvar i, header, level_flags, old_flush, bstate;\n\n\t\t\tif (flush > Z_FINISH || flush < 0) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\n\t\t\tif (!_strm.next_out || (!_strm.next_in && _strm.avail_in !== 0) || (status == FINISH_STATE && flush != Z_FINISH)) {\n\t\t\t\t_strm.msg = z_errmsg[Z_NEED_DICT - (Z_STREAM_ERROR)];\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\tif (_strm.avail_out === 0) {\n\t\t\t\t_strm.msg = z_errmsg[Z_NEED_DICT - (Z_BUF_ERROR)];\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\t}\n\n\t\t\tstrm = _strm; // just in case\n\t\t\told_flush = last_flush;\n\t\t\tlast_flush = flush;\n\n\t\t\t// Write the zlib header\n\t\t\tif (status == INIT_STATE) {\n\t\t\t\theader = (Z_DEFLATED + ((w_bits - 8) << 4)) << 8;\n\t\t\t\tlevel_flags = ((level - 1) & 0xff) >> 1;\n\n\t\t\t\tif (level_flags > 3)\n\t\t\t\t\tlevel_flags = 3;\n\t\t\t\theader |= (level_flags << 6);\n\t\t\t\tif (strstart !== 0)\n\t\t\t\t\theader |= PRESET_DICT;\n\t\t\t\theader += 31 - (header % 31);\n\n\t\t\t\tstatus = BUSY_STATE;\n\t\t\t\tputShortMSB(header);\n\t\t\t}\n\n\t\t\t// Flush as much pending output as possible\n\t\t\tif (that.pending !== 0) {\n\t\t\t\tstrm.flush_pending();\n\t\t\t\tif (strm.avail_out === 0) {\n\t\t\t\t\t// console.log(" avail_out==0");\n\t\t\t\t\t// Since avail_out is 0, deflate will be called again with\n\t\t\t\t\t// more output space, but possibly with both pending and\n\t\t\t\t\t// avail_in equal to zero. There won\'t be anything to do,\n\t\t\t\t\t// but this is not an error situation so make sure we\n\t\t\t\t\t// return OK instead of BUF_ERROR at next call of deflate:\n\t\t\t\t\tlast_flush = -1;\n\t\t\t\t\treturn Z_OK;\n\t\t\t\t}\n\n\t\t\t\t// Make sure there is something to do and avoid duplicate\n\t\t\t\t// consecutive\n\t\t\t\t// flushes. For repeated and useless calls with Z_FINISH, we keep\n\t\t\t\t// returning Z_STREAM_END instead of Z_BUFF_ERROR.\n\t\t\t} else if (strm.avail_in === 0 && flush <= old_flush && flush != Z_FINISH) {\n\t\t\t\tstrm.msg = z_errmsg[Z_NEED_DICT - (Z_BUF_ERROR)];\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\t}\n\n\t\t\t// User must not provide more input after the first FINISH:\n\t\t\tif (status == FINISH_STATE && strm.avail_in !== 0) {\n\t\t\t\t_strm.msg = z_errmsg[Z_NEED_DICT - (Z_BUF_ERROR)];\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\t}\n\n\t\t\t// Start a new block or continue the current one.\n\t\t\tif (strm.avail_in !== 0 || lookahead !== 0 || (flush != Z_NO_FLUSH && status != FINISH_STATE)) {\n\t\t\t\tbstate = -1;\n\t\t\t\tswitch (config_table[level].func) {\n\t\t\t\tcase STORED:\n\t\t\t\t\tbstate = deflate_stored(flush);\n\t\t\t\t\tbreak;\n\t\t\t\tcase FAST:\n\t\t\t\t\tbstate = deflate_fast(flush);\n\t\t\t\t\tbreak;\n\t\t\t\tcase SLOW:\n\t\t\t\t\tbstate = deflate_slow(flush);\n\t\t\t\t\tbreak;\n\t\t\t\tdefault:\n\t\t\t\t}\n\n\t\t\t\tif (bstate == FinishStarted || bstate == FinishDone) {\n\t\t\t\t\tstatus = FINISH_STATE;\n\t\t\t\t}\n\t\t\t\tif (bstate == NeedMore || bstate == FinishStarted) {\n\t\t\t\t\tif (strm.avail_out === 0) {\n\t\t\t\t\t\tlast_flush = -1; // avoid BUF_ERROR next call, see above\n\t\t\t\t\t}\n\t\t\t\t\treturn Z_OK;\n\t\t\t\t\t// If flush != Z_NO_FLUSH && avail_out === 0, the next call\n\t\t\t\t\t// of deflate should use the same flush parameter to make sure\n\t\t\t\t\t// that the flush is complete. So we don\'t have to output an\n\t\t\t\t\t// empty block here, this will be done at next call. This also\n\t\t\t\t\t// ensures that for a very small output buffer, we emit at most\n\t\t\t\t\t// one empty block.\n\t\t\t\t}\n\n\t\t\t\tif (bstate == BlockDone) {\n\t\t\t\t\tif (flush == Z_PARTIAL_FLUSH) {\n\t\t\t\t\t\t_tr_align();\n\t\t\t\t\t} else { // FULL_FLUSH or SYNC_FLUSH\n\t\t\t\t\t\t_tr_stored_block(0, 0, false);\n\t\t\t\t\t\t// For a full flush, this empty block will be recognized\n\t\t\t\t\t\t// as a special marker by inflate_sync().\n\t\t\t\t\t\tif (flush == Z_FULL_FLUSH) {\n\t\t\t\t\t\t\t// state.head[s.hash_size-1]=0;\n\t\t\t\t\t\t\tfor (i = 0; i < hash_size/*-1*/; i++)\n\t\t\t\t\t\t\t\t// forget history\n\t\t\t\t\t\t\t\thead[i] = 0;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tstrm.flush_pending();\n\t\t\t\t\tif (strm.avail_out === 0) {\n\t\t\t\t\t\tlast_flush = -1; // avoid BUF_ERROR at next call, see above\n\t\t\t\t\t\treturn Z_OK;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tif (flush != Z_FINISH)\n\t\t\t\treturn Z_OK;\n\t\t\treturn Z_STREAM_END;\n\t\t};\n\t}\n\n\t// ZStream\n\n\tfunction ZStream() {\n\t\tvar that = this;\n\t\tthat.next_in_index = 0;\n\t\tthat.next_out_index = 0;\n\t\t// that.next_in; // next input byte\n\t\tthat.avail_in = 0; // number of bytes available at next_in\n\t\tthat.total_in = 0; // total nb of input bytes read so far\n\t\t// that.next_out; // next output byte should be put there\n\t\tthat.avail_out = 0; // remaining free space at next_out\n\t\tthat.total_out = 0; // total nb of bytes output so far\n\t\t// that.msg;\n\t\t// that.dstate;\n\t}\n\n\tZStream.prototype = {\n\t\tdeflateInit : function(level, bits) {\n\t\t\tvar that = this;\n\t\t\tthat.dstate = new Deflate();\n\t\t\tif (!bits)\n\t\t\t\tbits = MAX_BITS;\n\t\t\treturn that.dstate.deflateInit(that, level, bits);\n\t\t},\n\n\t\tdeflate : function(flush) {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate) {\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\treturn that.dstate.deflate(that, flush);\n\t\t},\n\n\t\tdeflateEnd : function() {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tvar ret = that.dstate.deflateEnd();\n\t\t\tthat.dstate = null;\n\t\t\treturn ret;\n\t\t},\n\n\t\tdeflateParams : function(level, strategy) {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.dstate.deflateParams(that, level, strategy);\n\t\t},\n\n\t\tdeflateSetDictionary : function(dictionary, dictLength) {\n\t\t\tvar that = this;\n\t\t\tif (!that.dstate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.dstate.deflateSetDictionary(that, dictionary, dictLength);\n\t\t},\n\n\t\t// Read a new buffer from the current input stream, update the\n\t\t// total number of bytes read. All deflate() input goes through\n\t\t// this function so some applications may wish to modify it to avoid\n\t\t// allocating a large strm->next_in buffer and copying from it.\n\t\t// (See also flush_pending()).\n\t\tread_buf : function(buf, start, size) {\n\t\t\tvar that = this;\n\t\t\tvar len = that.avail_in;\n\t\t\tif (len > size)\n\t\t\t\tlen = size;\n\t\t\tif (len === 0)\n\t\t\t\treturn 0;\n\t\t\tthat.avail_in -= len;\n\t\t\tbuf.set(that.next_in.subarray(that.next_in_index, that.next_in_index + len), start);\n\t\t\tthat.next_in_index += len;\n\t\t\tthat.total_in += len;\n\t\t\treturn len;\n\t\t},\n\n\t\t// Flush as much pending output as possible. All deflate() output goes\n\t\t// through this function so some applications may wish to modify it\n\t\t// to avoid allocating a large strm->next_out buffer and copying into it.\n\t\t// (See also read_buf()).\n\t\tflush_pending : function() {\n\t\t\tvar that = this;\n\t\t\tvar len = that.dstate.pending;\n\n\t\t\tif (len > that.avail_out)\n\t\t\t\tlen = that.avail_out;\n\t\t\tif (len === 0)\n\t\t\t\treturn;\n\n\t\t\t// if (that.dstate.pending_buf.length <= that.dstate.pending_out || that.next_out.length <= that.next_out_index\n\t\t\t// || that.dstate.pending_buf.length < (that.dstate.pending_out + len) || that.next_out.length < (that.next_out_index +\n\t\t\t// len)) {\n\t\t\t// console.log(that.dstate.pending_buf.length + ", " + that.dstate.pending_out + ", " + that.next_out.length + ", " +\n\t\t\t// that.next_out_index + ", " + len);\n\t\t\t// console.log("avail_out=" + that.avail_out);\n\t\t\t// }\n\n\t\t\tthat.next_out.set(that.dstate.pending_buf.subarray(that.dstate.pending_out, that.dstate.pending_out + len), that.next_out_index);\n\n\t\t\tthat.next_out_index += len;\n\t\t\tthat.dstate.pending_out += len;\n\t\t\tthat.total_out += len;\n\t\t\tthat.avail_out -= len;\n\t\t\tthat.dstate.pending -= len;\n\t\t\tif (that.dstate.pending === 0) {\n\t\t\t\tthat.dstate.pending_out = 0;\n\t\t\t}\n\t\t}\n\t};\n\n\t// Deflater\n\n\tfunction Deflater(options) {\n\t\tvar that = this;\n\t\tvar z = new ZStream();\n\t\tvar bufsize = 512;\n\t\tvar flush = Z_NO_FLUSH;\n\t\tvar buf = new Uint8Array(bufsize);\n\t\tvar level = options ? options.level : Z_DEFAULT_COMPRESSION;\n\t\tif (typeof level == "undefined")\n\t\t\tlevel = Z_DEFAULT_COMPRESSION;\n\t\tz.deflateInit(level);\n\t\tz.next_out = buf;\n\n\t\tthat.append = function(data, onprogress) {\n\t\t\tvar err, buffers = [], lastIndex = 0, bufferIndex = 0, bufferSize = 0, array;\n\t\t\tif (!data.length)\n\t\t\t\treturn;\n\t\t\tz.next_in_index = 0;\n\t\t\tz.next_in = data;\n\t\t\tz.avail_in = data.length;\n\t\t\tdo {\n\t\t\t\tz.next_out_index = 0;\n\t\t\t\tz.avail_out = bufsize;\n\t\t\t\terr = z.deflate(flush);\n\t\t\t\tif (err != Z_OK)\n\t\t\t\t\tthrow new Error("deflating: " + z.msg);\n\t\t\t\tif (z.next_out_index)\n\t\t\t\t\tif (z.next_out_index == bufsize)\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf));\n\t\t\t\t\telse\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));\n\t\t\t\tbufferSize += z.next_out_index;\n\t\t\t\tif (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) {\n\t\t\t\t\tonprogress(z.next_in_index);\n\t\t\t\t\tlastIndex = z.next_in_index;\n\t\t\t\t}\n\t\t\t} while (z.avail_in > 0 || z.avail_out === 0);\n\t\t\tarray = new Uint8Array(bufferSize);\n\t\t\tbuffers.forEach(function(chunk) {\n\t\t\t\tarray.set(chunk, bufferIndex);\n\t\t\t\tbufferIndex += chunk.length;\n\t\t\t});\n\t\t\treturn array;\n\t\t};\n\t\tthat.flush = function() {\n\t\t\tvar err, buffers = [], bufferIndex = 0, bufferSize = 0, array;\n\t\t\tdo {\n\t\t\t\tz.next_out_index = 0;\n\t\t\t\tz.avail_out = bufsize;\n\t\t\t\terr = z.deflate(Z_FINISH);\n\t\t\t\tif (err != Z_STREAM_END && err != Z_OK)\n\t\t\t\t\tthrow new Error("deflating: " + z.msg);\n\t\t\t\tif (bufsize - z.avail_out > 0)\n\t\t\t\t\tbuffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));\n\t\t\t\tbufferSize += z.next_out_index;\n\t\t\t} while (z.avail_in > 0 || z.avail_out === 0);\n\t\t\tz.deflateEnd();\n\t\t\tarray = new Uint8Array(bufferSize);\n\t\t\tbuffers.forEach(function(chunk) {\n\t\t\t\tarray.set(chunk, bufferIndex);\n\t\t\t\tbufferIndex += chunk.length;\n\t\t\t});\n\t\t\treturn array;\n\t\t};\n\t}\n\n\t// \'zip\' may not be defined in z-worker and some tests\n\tvar env = global.zip || global;\n\tenv.Deflater = env._jzlib_Deflater = Deflater;\n})(this);\n')],
      inflater: [zWorker, createUrl('/*\n Copyright (c) 2013 Gildas Lormeau. All rights reserved.\n\n Redistribution and use in source and binary forms, with or without\n modification, are permitted provided that the following conditions are met:\n\n 1. Redistributions of source code must retain the above copyright notice,\n this list of conditions and the following disclaimer.\n\n 2. Redistributions in binary form must reproduce the above copyright \n notice, this list of conditions and the following disclaimer in \n the documentation and/or other materials provided with the distribution.\n\n 3. The names of the authors may not be used to endorse or promote products\n derived from this software without specific prior written permission.\n\n THIS SOFTWARE IS PROVIDED ``AS IS\'\' AND ANY EXPRESSED OR IMPLIED WARRANTIES,\n INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND\n FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,\n INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,\n INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,\n OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF\n LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING\n NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,\n EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n/*\n * This program is based on JZlib 1.0.2 ymnk, JCraft,Inc.\n * JZlib is based on zlib-1.1.3, so all credit should go authors\n * Jean-loup Gailly(jloup@gzip.org) and Mark Adler(madler@alumni.caltech.edu)\n * and contributors of zlib.\n */\n\n(function(global) {\n\t"use strict";\n\n\t// Global\n\tvar MAX_BITS = 15;\n\n\tvar Z_OK = 0;\n\tvar Z_STREAM_END = 1;\n\tvar Z_NEED_DICT = 2;\n\tvar Z_STREAM_ERROR = -2;\n\tvar Z_DATA_ERROR = -3;\n\tvar Z_MEM_ERROR = -4;\n\tvar Z_BUF_ERROR = -5;\n\n\tvar inflate_mask = [ 0x00000000, 0x00000001, 0x00000003, 0x00000007, 0x0000000f, 0x0000001f, 0x0000003f, 0x0000007f, 0x000000ff, 0x000001ff, 0x000003ff,\n\t\t\t0x000007ff, 0x00000fff, 0x00001fff, 0x00003fff, 0x00007fff, 0x0000ffff ];\n\n\tvar MANY = 1440;\n\n\t// JZlib version : "1.0.2"\n\tvar Z_NO_FLUSH = 0;\n\tvar Z_FINISH = 4;\n\n\t// InfTree\n\tvar fixed_bl = 9;\n\tvar fixed_bd = 5;\n\n\tvar fixed_tl = [ 96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9, 192, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 160, 0, 8, 0,\n\t\t\t0, 8, 128, 0, 8, 64, 0, 9, 224, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 144, 83, 7, 59, 0, 8, 120, 0, 8, 56, 0, 9, 208, 81, 7, 17, 0, 8, 104, 0, 8, 40,\n\t\t\t0, 9, 176, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 240, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8, 227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 200, 81, 7, 13,\n\t\t\t0, 8, 100, 0, 8, 36, 0, 9, 168, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 232, 80, 7, 8, 0, 8, 92, 0, 8, 28, 0, 9, 152, 84, 7, 83, 0, 8, 124, 0, 8, 60,\n\t\t\t0, 9, 216, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 184, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9, 248, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7,\n\t\t\t35, 0, 8, 114, 0, 8, 50, 0, 9, 196, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 164, 0, 8, 2, 0, 8, 130, 0, 8, 66, 0, 9, 228, 80, 7, 7, 0, 8, 90, 0, 8,\n\t\t\t26, 0, 9, 148, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 212, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9, 180, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 244, 80,\n\t\t\t7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 204, 81, 7, 15, 0, 8, 102, 0, 8, 38, 0, 9, 172, 0, 8, 6, 0, 8, 134, 0,\n\t\t\t8, 70, 0, 9, 236, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 156, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9, 220, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 188, 0,\n\t\t\t8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 252, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0, 8, 113, 0, 8, 49, 0, 9, 194, 80, 7, 10, 0, 8, 97,\n\t\t\t0, 8, 33, 0, 9, 162, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 226, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9, 146, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 210,\n\t\t\t81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 178, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 242, 80, 7, 4, 0, 8, 85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117,\n\t\t\t0, 8, 53, 0, 9, 202, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 170, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9, 234, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 154,\n\t\t\t84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 218, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 186, 0, 8, 13, 0, 8, 141, 0, 8, 77, 0, 9, 250, 80, 7, 3, 0, 8, 83,\n\t\t\t0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 198, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9, 166, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 230,\n\t\t\t80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 150, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 214, 82, 7, 19, 0, 8, 107, 0, 8, 43, 0, 9, 182, 0, 8, 11, 0, 8, 139,\n\t\t\t0, 8, 75, 0, 9, 246, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9, 206, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 174,\n\t\t\t0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 238, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 158, 84, 7, 99, 0, 8, 127, 0, 8, 63, 0, 9, 222, 82, 7, 27, 0, 8, 111,\n\t\t\t0, 8, 47, 0, 9, 190, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 254, 96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9,\n\t\t\t193, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 161, 0, 8, 0, 0, 8, 128, 0, 8, 64, 0, 9, 225, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 145, 83, 7, 59, 0, 8,\n\t\t\t120, 0, 8, 56, 0, 9, 209, 81, 7, 17, 0, 8, 104, 0, 8, 40, 0, 9, 177, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 241, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8,\n\t\t\t227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 201, 81, 7, 13, 0, 8, 100, 0, 8, 36, 0, 9, 169, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 233, 80, 7, 8, 0, 8,\n\t\t\t92, 0, 8, 28, 0, 9, 153, 84, 7, 83, 0, 8, 124, 0, 8, 60, 0, 9, 217, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 185, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9,\n\t\t\t249, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7, 35, 0, 8, 114, 0, 8, 50, 0, 9, 197, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 165, 0, 8, 2, 0, 8,\n\t\t\t130, 0, 8, 66, 0, 9, 229, 80, 7, 7, 0, 8, 90, 0, 8, 26, 0, 9, 149, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 213, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9,\n\t\t\t181, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 245, 80, 7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 205, 81, 7, 15, 0, 8,\n\t\t\t102, 0, 8, 38, 0, 9, 173, 0, 8, 6, 0, 8, 134, 0, 8, 70, 0, 9, 237, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 157, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9,\n\t\t\t221, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 189, 0, 8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 253, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0,\n\t\t\t8, 113, 0, 8, 49, 0, 9, 195, 80, 7, 10, 0, 8, 97, 0, 8, 33, 0, 9, 163, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 227, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9,\n\t\t\t147, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 211, 81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 179, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 243, 80, 7, 4, 0, 8,\n\t\t\t85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117, 0, 8, 53, 0, 9, 203, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 171, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9,\n\t\t\t235, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 155, 84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 219, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 187, 0, 8, 13, 0, 8,\n\t\t\t141, 0, 8, 77, 0, 9, 251, 80, 7, 3, 0, 8, 83, 0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 199, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9,\n\t\t\t167, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 231, 80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 151, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 215, 82, 7, 19, 0, 8,\n\t\t\t107, 0, 8, 43, 0, 9, 183, 0, 8, 11, 0, 8, 139, 0, 8, 75, 0, 9, 247, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9,\n\t\t\t207, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 175, 0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 239, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 159, 84, 7, 99, 0, 8,\n\t\t\t127, 0, 8, 63, 0, 9, 223, 82, 7, 27, 0, 8, 111, 0, 8, 47, 0, 9, 191, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 255 ];\n\tvar fixed_td = [ 80, 5, 1, 87, 5, 257, 83, 5, 17, 91, 5, 4097, 81, 5, 5, 89, 5, 1025, 85, 5, 65, 93, 5, 16385, 80, 5, 3, 88, 5, 513, 84, 5, 33, 92, 5,\n\t\t\t8193, 82, 5, 9, 90, 5, 2049, 86, 5, 129, 192, 5, 24577, 80, 5, 2, 87, 5, 385, 83, 5, 25, 91, 5, 6145, 81, 5, 7, 89, 5, 1537, 85, 5, 97, 93, 5,\n\t\t\t24577, 80, 5, 4, 88, 5, 769, 84, 5, 49, 92, 5, 12289, 82, 5, 13, 90, 5, 3073, 86, 5, 193, 192, 5, 24577 ];\n\n\t// Tables for deflate from PKZIP\'s appnote.txt.\n\tvar cplens = [ // Copy lengths for literal codes 257..285\n\t3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0 ];\n\n\t// see note #13 above about 258\n\tvar cplext = [ // Extra bits for literal codes 257..285\n\t0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 112, 112 // 112==invalid\n\t];\n\n\tvar cpdist = [ // Copy offsets for distance codes 0..29\n\t1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577 ];\n\n\tvar cpdext = [ // Extra bits for distance codes\n\t0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13 ];\n\n\t// If BMAX needs to be larger than 16, then h and x[] should be uLong.\n\tvar BMAX = 15; // maximum bit length of any code\n\n\tfunction InfTree() {\n\t\tvar that = this;\n\n\t\tvar hn; // hufts used in space\n\t\tvar v; // work area for huft_build\n\t\tvar c; // bit length count table\n\t\tvar r; // table entry for structure assignment\n\t\tvar u; // table stack\n\t\tvar x; // bit offsets, then code stack\n\n\t\tfunction huft_build(b, // code lengths in bits (all assumed <=\n\t\t// BMAX)\n\t\tbindex, n, // number of codes (assumed <= 288)\n\t\ts, // number of simple-valued codes (0..s-1)\n\t\td, // list of base values for non-simple codes\n\t\te, // list of extra bits for non-simple codes\n\t\tt, // result: starting table\n\t\tm, // maximum lookup bits, returns actual\n\t\thp,// space for trees\n\t\thn,// hufts used in space\n\t\tv // working area: values in order of bit length\n\t\t) {\n\t\t\t// Given a list of code lengths and a maximum table size, make a set of\n\t\t\t// tables to decode that set of codes. Return Z_OK on success,\n\t\t\t// Z_BUF_ERROR\n\t\t\t// if the given code set is incomplete (the tables are still built in\n\t\t\t// this\n\t\t\t// case), Z_DATA_ERROR if the input is invalid (an over-subscribed set\n\t\t\t// of\n\t\t\t// lengths), or Z_MEM_ERROR if not enough memory.\n\n\t\t\tvar a; // counter for codes of length k\n\t\t\tvar f; // i repeats in table every f entries\n\t\t\tvar g; // maximum code length\n\t\t\tvar h; // table level\n\t\t\tvar i; // counter, current code\n\t\t\tvar j; // counter\n\t\t\tvar k; // number of bits in current code\n\t\t\tvar l; // bits per table (returned in m)\n\t\t\tvar mask; // (1 << w) - 1, to avoid cc -O bug on HP\n\t\t\tvar p; // pointer into c[], b[], or v[]\n\t\t\tvar q; // points to current table\n\t\t\tvar w; // bits before this table == (l * h)\n\t\t\tvar xp; // pointer into x\n\t\t\tvar y; // number of dummy codes added\n\t\t\tvar z; // number of entries in current table\n\n\t\t\t// Generate counts for each bit length\n\n\t\t\tp = 0;\n\t\t\ti = n;\n\t\t\tdo {\n\t\t\t\tc[b[bindex + p]]++;\n\t\t\t\tp++;\n\t\t\t\ti--; // assume all entries <= BMAX\n\t\t\t} while (i !== 0);\n\n\t\t\tif (c[0] == n) { // null input--all zero length codes\n\t\t\t\tt[0] = -1;\n\t\t\t\tm[0] = 0;\n\t\t\t\treturn Z_OK;\n\t\t\t}\n\n\t\t\t// Find minimum and maximum length, bound *m by those\n\t\t\tl = m[0];\n\t\t\tfor (j = 1; j <= BMAX; j++)\n\t\t\t\tif (c[j] !== 0)\n\t\t\t\t\tbreak;\n\t\t\tk = j; // minimum code length\n\t\t\tif (l < j) {\n\t\t\t\tl = j;\n\t\t\t}\n\t\t\tfor (i = BMAX; i !== 0; i--) {\n\t\t\t\tif (c[i] !== 0)\n\t\t\t\t\tbreak;\n\t\t\t}\n\t\t\tg = i; // maximum code length\n\t\t\tif (l > i) {\n\t\t\t\tl = i;\n\t\t\t}\n\t\t\tm[0] = l;\n\n\t\t\t// Adjust last length count to fill out codes, if needed\n\t\t\tfor (y = 1 << j; j < i; j++, y <<= 1) {\n\t\t\t\tif ((y -= c[j]) < 0) {\n\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\t}\n\t\t\t}\n\t\t\tif ((y -= c[i]) < 0) {\n\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t}\n\t\t\tc[i] += y;\n\n\t\t\t// Generate starting offsets into the value table for each length\n\t\t\tx[1] = j = 0;\n\t\t\tp = 1;\n\t\t\txp = 2;\n\t\t\twhile (--i !== 0) { // note that i == g from above\n\t\t\t\tx[xp] = (j += c[p]);\n\t\t\t\txp++;\n\t\t\t\tp++;\n\t\t\t}\n\n\t\t\t// Make a table of values in order of bit lengths\n\t\t\ti = 0;\n\t\t\tp = 0;\n\t\t\tdo {\n\t\t\t\tif ((j = b[bindex + p]) !== 0) {\n\t\t\t\t\tv[x[j]++] = i;\n\t\t\t\t}\n\t\t\t\tp++;\n\t\t\t} while (++i < n);\n\t\t\tn = x[g]; // set n to length of v\n\n\t\t\t// Generate the Huffman codes and for each, make the table entries\n\t\t\tx[0] = i = 0; // first Huffman code is zero\n\t\t\tp = 0; // grab values in bit order\n\t\t\th = -1; // no tables yet--level -1\n\t\t\tw = -l; // bits decoded == (l * h)\n\t\t\tu[0] = 0; // just to keep compilers happy\n\t\t\tq = 0; // ditto\n\t\t\tz = 0; // ditto\n\n\t\t\t// go through the bit lengths (k already is bits in shortest code)\n\t\t\tfor (; k <= g; k++) {\n\t\t\t\ta = c[k];\n\t\t\t\twhile (a-- !== 0) {\n\t\t\t\t\t// here i is the Huffman code of length k bits for value *p\n\t\t\t\t\t// make tables up to required level\n\t\t\t\t\twhile (k > w + l) {\n\t\t\t\t\t\th++;\n\t\t\t\t\t\tw += l; // previous table always l bits\n\t\t\t\t\t\t// compute minimum size table less than or equal to l bits\n\t\t\t\t\t\tz = g - w;\n\t\t\t\t\t\tz = (z > l) ? l : z; // table size upper limit\n\t\t\t\t\t\tif ((f = 1 << (j = k - w)) > a + 1) { // try a k-w bit table\n\t\t\t\t\t\t\t// too few codes for\n\t\t\t\t\t\t\t// k-w bit table\n\t\t\t\t\t\t\tf -= a + 1; // deduct codes from patterns left\n\t\t\t\t\t\t\txp = k;\n\t\t\t\t\t\t\tif (j < z) {\n\t\t\t\t\t\t\t\twhile (++j < z) { // try smaller tables up to z bits\n\t\t\t\t\t\t\t\t\tif ((f <<= 1) <= c[++xp])\n\t\t\t\t\t\t\t\t\t\tbreak; // enough codes to use up j bits\n\t\t\t\t\t\t\t\t\tf -= c[xp]; // else deduct codes from patterns\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tz = 1 << j; // table entries for j-bit table\n\n\t\t\t\t\t\t// allocate new table\n\t\t\t\t\t\tif (hn[0] + z > MANY) { // (note: doesn\'t matter for fixed)\n\t\t\t\t\t\t\treturn Z_DATA_ERROR; // overflow of MANY\n\t\t\t\t\t\t}\n\t\t\t\t\t\tu[h] = q = /* hp+ */hn[0]; // DEBUG\n\t\t\t\t\t\thn[0] += z;\n\n\t\t\t\t\t\t// connect to last table, if there is one\n\t\t\t\t\t\tif (h !== 0) {\n\t\t\t\t\t\t\tx[h] = i; // save pattern for backing up\n\t\t\t\t\t\t\tr[0] = /* (byte) */j; // bits in this table\n\t\t\t\t\t\t\tr[1] = /* (byte) */l; // bits to dump before this table\n\t\t\t\t\t\t\tj = i >>> (w - l);\n\t\t\t\t\t\t\tr[2] = /* (int) */(q - u[h - 1] - j); // offset to this table\n\t\t\t\t\t\t\thp.set(r, (u[h - 1] + j) * 3);\n\t\t\t\t\t\t\t// to\n\t\t\t\t\t\t\t// last\n\t\t\t\t\t\t\t// table\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tt[0] = q; // first table is returned result\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t// set up table entry in r\n\t\t\t\t\tr[1] = /* (byte) */(k - w);\n\t\t\t\t\tif (p >= n) {\n\t\t\t\t\t\tr[0] = 128 + 64; // out of values--invalid code\n\t\t\t\t\t} else if (v[p] < s) {\n\t\t\t\t\t\tr[0] = /* (byte) */(v[p] < 256 ? 0 : 32 + 64); // 256 is\n\t\t\t\t\t\t// end-of-block\n\t\t\t\t\t\tr[2] = v[p++]; // simple code is just the value\n\t\t\t\t\t} else {\n\t\t\t\t\t\tr[0] = /* (byte) */(e[v[p] - s] + 16 + 64); // non-simple--look\n\t\t\t\t\t\t// up in lists\n\t\t\t\t\t\tr[2] = d[v[p++] - s];\n\t\t\t\t\t}\n\n\t\t\t\t\t// fill code-like entries with r\n\t\t\t\t\tf = 1 << (k - w);\n\t\t\t\t\tfor (j = i >>> w; j < z; j += f) {\n\t\t\t\t\t\thp.set(r, (q + j) * 3);\n\t\t\t\t\t}\n\n\t\t\t\t\t// backwards increment the k-bit code i\n\t\t\t\t\tfor (j = 1 << (k - 1); (i & j) !== 0; j >>>= 1) {\n\t\t\t\t\t\ti ^= j;\n\t\t\t\t\t}\n\t\t\t\t\ti ^= j;\n\n\t\t\t\t\t// backup over finished tables\n\t\t\t\t\tmask = (1 << w) - 1; // needed on HP, cc -O bug\n\t\t\t\t\twhile ((i & mask) != x[h]) {\n\t\t\t\t\t\th--; // don\'t need to update q\n\t\t\t\t\t\tw -= l;\n\t\t\t\t\t\tmask = (1 << w) - 1;\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t\t// Return Z_BUF_ERROR if we were given an incomplete table\n\t\t\treturn y !== 0 && g != 1 ? Z_BUF_ERROR : Z_OK;\n\t\t}\n\n\t\tfunction initWorkArea(vsize) {\n\t\t\tvar i;\n\t\t\tif (!hn) {\n\t\t\t\thn = []; // []; //new Array(1);\n\t\t\t\tv = []; // new Array(vsize);\n\t\t\t\tc = new Int32Array(BMAX + 1); // new Array(BMAX + 1);\n\t\t\t\tr = []; // new Array(3);\n\t\t\t\tu = new Int32Array(BMAX); // new Array(BMAX);\n\t\t\t\tx = new Int32Array(BMAX + 1); // new Array(BMAX + 1);\n\t\t\t}\n\t\t\tif (v.length < vsize) {\n\t\t\t\tv = []; // new Array(vsize);\n\t\t\t}\n\t\t\tfor (i = 0; i < vsize; i++) {\n\t\t\t\tv[i] = 0;\n\t\t\t}\n\t\t\tfor (i = 0; i < BMAX + 1; i++) {\n\t\t\t\tc[i] = 0;\n\t\t\t}\n\t\t\tfor (i = 0; i < 3; i++) {\n\t\t\t\tr[i] = 0;\n\t\t\t}\n\t\t\t// for(int i=0; i<BMAX; i++){u[i]=0;}\n\t\t\tu.set(c.subarray(0, BMAX), 0);\n\t\t\t// for(int i=0; i<BMAX+1; i++){x[i]=0;}\n\t\t\tx.set(c.subarray(0, BMAX + 1), 0);\n\t\t}\n\n\t\tthat.inflate_trees_bits = function(c, // 19 code lengths\n\t\tbb, // bits tree desired/actual depth\n\t\ttb, // bits tree result\n\t\thp, // space for trees\n\t\tz // for messages\n\t\t) {\n\t\t\tvar result;\n\t\t\tinitWorkArea(19);\n\t\t\thn[0] = 0;\n\t\t\tresult = huft_build(c, 0, 19, 19, null, null, tb, bb, hp, hn, v);\n\n\t\t\tif (result == Z_DATA_ERROR) {\n\t\t\t\tz.msg = "oversubscribed dynamic bit lengths tree";\n\t\t\t} else if (result == Z_BUF_ERROR || bb[0] === 0) {\n\t\t\t\tz.msg = "incomplete dynamic bit lengths tree";\n\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t}\n\t\t\treturn result;\n\t\t};\n\n\t\tthat.inflate_trees_dynamic = function(nl, // number of literal/length codes\n\t\tnd, // number of distance codes\n\t\tc, // that many (total) code lengths\n\t\tbl, // literal desired/actual bit depth\n\t\tbd, // distance desired/actual bit depth\n\t\ttl, // literal/length tree result\n\t\ttd, // distance tree result\n\t\thp, // space for trees\n\t\tz // for messages\n\t\t) {\n\t\t\tvar result;\n\n\t\t\t// build literal/length tree\n\t\t\tinitWorkArea(288);\n\t\t\thn[0] = 0;\n\t\t\tresult = huft_build(c, 0, nl, 257, cplens, cplext, tl, bl, hp, hn, v);\n\t\t\tif (result != Z_OK || bl[0] === 0) {\n\t\t\t\tif (result == Z_DATA_ERROR) {\n\t\t\t\t\tz.msg = "oversubscribed literal/length tree";\n\t\t\t\t} else if (result != Z_MEM_ERROR) {\n\t\t\t\t\tz.msg = "incomplete literal/length tree";\n\t\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t\t}\n\t\t\t\treturn result;\n\t\t\t}\n\n\t\t\t// build distance tree\n\t\t\tinitWorkArea(288);\n\t\t\tresult = huft_build(c, nl, nd, 0, cpdist, cpdext, td, bd, hp, hn, v);\n\n\t\t\tif (result != Z_OK || (bd[0] === 0 && nl > 257)) {\n\t\t\t\tif (result == Z_DATA_ERROR) {\n\t\t\t\t\tz.msg = "oversubscribed distance tree";\n\t\t\t\t} else if (result == Z_BUF_ERROR) {\n\t\t\t\t\tz.msg = "incomplete distance tree";\n\t\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t\t} else if (result != Z_MEM_ERROR) {\n\t\t\t\t\tz.msg = "empty distance tree with lengths";\n\t\t\t\t\tresult = Z_DATA_ERROR;\n\t\t\t\t}\n\t\t\t\treturn result;\n\t\t\t}\n\n\t\t\treturn Z_OK;\n\t\t};\n\n\t}\n\n\tInfTree.inflate_trees_fixed = function(bl, // literal desired/actual bit depth\n\tbd, // distance desired/actual bit depth\n\ttl,// literal/length tree result\n\ttd// distance tree result\n\t) {\n\t\tbl[0] = fixed_bl;\n\t\tbd[0] = fixed_bd;\n\t\ttl[0] = fixed_tl;\n\t\ttd[0] = fixed_td;\n\t\treturn Z_OK;\n\t};\n\n\t// InfCodes\n\n\t// waiting for "i:"=input,\n\t// "o:"=output,\n\t// "x:"=nothing\n\tvar START = 0; // x: set up for LEN\n\tvar LEN = 1; // i: get length/literal/eob next\n\tvar LENEXT = 2; // i: getting length extra (have base)\n\tvar DIST = 3; // i: get distance next\n\tvar DISTEXT = 4;// i: getting distance extra\n\tvar COPY = 5; // o: copying bytes in window, waiting\n\t// for space\n\tvar LIT = 6; // o: got literal, waiting for output\n\t// space\n\tvar WASH = 7; // o: got eob, possibly still output\n\t// waiting\n\tvar END = 8; // x: got eob and all data flushed\n\tvar BADCODE = 9;// x: got error\n\n\tfunction InfCodes() {\n\t\tvar that = this;\n\n\t\tvar mode; // current inflate_codes mode\n\n\t\t// mode dependent information\n\t\tvar len = 0;\n\n\t\tvar tree; // pointer into tree\n\t\tvar tree_index = 0;\n\t\tvar need = 0; // bits needed\n\n\t\tvar lit = 0;\n\n\t\t// if EXT or COPY, where and how much\n\t\tvar get = 0; // bits to get for extra\n\t\tvar dist = 0; // distance back to copy from\n\n\t\tvar lbits = 0; // ltree bits decoded per branch\n\t\tvar dbits = 0; // dtree bits decoder per branch\n\t\tvar ltree; // literal/length/eob tree\n\t\tvar ltree_index = 0; // literal/length/eob tree\n\t\tvar dtree; // distance tree\n\t\tvar dtree_index = 0; // distance tree\n\n\t\t// Called with number of bytes left to write in window at least 258\n\t\t// (the maximum string length) and number of input bytes available\n\t\t// at least ten. The ten bytes are six bytes for the longest length/\n\t\t// distance pair plus four bytes for overloading the bit buffer.\n\n\t\tfunction inflate_fast(bl, bd, tl, tl_index, td, td_index, s, z) {\n\t\t\tvar t; // temporary pointer\n\t\t\tvar tp; // temporary pointer\n\t\t\tvar tp_index; // temporary pointer\n\t\t\tvar e; // extra bits or operation\n\t\t\tvar b; // bit buffer\n\t\t\tvar k; // bits in bit buffer\n\t\t\tvar p; // input data pointer\n\t\t\tvar n; // bytes available there\n\t\t\tvar q; // output window write pointer\n\t\t\tvar m; // bytes to end of window or read pointer\n\t\t\tvar ml; // mask for literal/length tree\n\t\t\tvar md; // mask for distance tree\n\t\t\tvar c; // bytes to copy\n\t\t\tvar d; // distance back to copy from\n\t\t\tvar r; // copy source pointer\n\n\t\t\tvar tp_index_t_3; // (tp_index+t)*3\n\n\t\t\t// load input, output, bit values\n\t\t\tp = z.next_in_index;\n\t\t\tn = z.avail_in;\n\t\t\tb = s.bitb;\n\t\t\tk = s.bitk;\n\t\t\tq = s.write;\n\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t// initialize masks\n\t\t\tml = inflate_mask[bl];\n\t\t\tmd = inflate_mask[bd];\n\n\t\t\t// do until not enough input or output space for fast loop\n\t\t\tdo { // assume called with m >= 258 && n >= 10\n\t\t\t\t// get literal/length code\n\t\t\t\twhile (k < (20)) { // max bits for literal/length code\n\t\t\t\t\tn--;\n\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\tk += 8;\n\t\t\t\t}\n\n\t\t\t\tt = b & ml;\n\t\t\t\ttp = tl;\n\t\t\t\ttp_index = tl_index;\n\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\tif ((e = tp[tp_index_t_3]) === 0) {\n\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\ts.window[q++] = /* (byte) */tp[tp_index_t_3 + 2];\n\t\t\t\t\tm--;\n\t\t\t\t\tcontinue;\n\t\t\t\t}\n\t\t\t\tdo {\n\n\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\tif ((e & 16) !== 0) {\n\t\t\t\t\t\te &= 15;\n\t\t\t\t\t\tc = tp[tp_index_t_3 + 2] + (/* (int) */b & inflate_mask[e]);\n\n\t\t\t\t\t\tb >>= e;\n\t\t\t\t\t\tk -= e;\n\n\t\t\t\t\t\t// decode distance base of block to copy\n\t\t\t\t\t\twhile (k < (15)) { // max bits for distance code\n\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tt = b & md;\n\t\t\t\t\t\ttp = td;\n\t\t\t\t\t\ttp_index = td_index;\n\t\t\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\t\t\te = tp[tp_index_t_3];\n\n\t\t\t\t\t\tdo {\n\n\t\t\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\t\t\tif ((e & 16) !== 0) {\n\t\t\t\t\t\t\t\t// get extra bits to add to distance base\n\t\t\t\t\t\t\t\te &= 15;\n\t\t\t\t\t\t\t\twhile (k < (e)) { // get extra bits (up to 13)\n\t\t\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\td = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]);\n\n\t\t\t\t\t\t\t\tb >>= (e);\n\t\t\t\t\t\t\t\tk -= (e);\n\n\t\t\t\t\t\t\t\t// do the copy\n\t\t\t\t\t\t\t\tm -= c;\n\t\t\t\t\t\t\t\tif (q >= d) { // offset before dest\n\t\t\t\t\t\t\t\t\t// just copy\n\t\t\t\t\t\t\t\t\tr = q - d;\n\t\t\t\t\t\t\t\t\tif (q - r > 0 && 2 > (q - r)) {\n\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++]; // minimum\n\t\t\t\t\t\t\t\t\t\t// count is\n\t\t\t\t\t\t\t\t\t\t// three,\n\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++]; // so unroll\n\t\t\t\t\t\t\t\t\t\t// loop a\n\t\t\t\t\t\t\t\t\t\t// little\n\t\t\t\t\t\t\t\t\t\tc -= 2;\n\t\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\t\ts.window.set(s.window.subarray(r, r + 2), q);\n\t\t\t\t\t\t\t\t\t\tq += 2;\n\t\t\t\t\t\t\t\t\t\tr += 2;\n\t\t\t\t\t\t\t\t\t\tc -= 2;\n\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t} else { // else offset after destination\n\t\t\t\t\t\t\t\t\tr = q - d;\n\t\t\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\t\t\tr += s.end; // force pointer in window\n\t\t\t\t\t\t\t\t\t} while (r < 0); // covers invalid distances\n\t\t\t\t\t\t\t\t\te = s.end - r;\n\t\t\t\t\t\t\t\t\tif (c > e) { // if source crosses,\n\t\t\t\t\t\t\t\t\t\tc -= e; // wrapped copy\n\t\t\t\t\t\t\t\t\t\tif (q - r > 0 && e > (q - r)) {\n\t\t\t\t\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++];\n\t\t\t\t\t\t\t\t\t\t\t} while (--e !== 0);\n\t\t\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\t\t\ts.window.set(s.window.subarray(r, r + e), q);\n\t\t\t\t\t\t\t\t\t\t\tq += e;\n\t\t\t\t\t\t\t\t\t\t\tr += e;\n\t\t\t\t\t\t\t\t\t\t\te = 0;\n\t\t\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\t\t\tr = 0; // copy rest from start of window\n\t\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\t// copy all or what\'s left\n\t\t\t\t\t\t\t\tif (q - r > 0 && c > (q - r)) {\n\t\t\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\t\t\ts.window[q++] = s.window[r++];\n\t\t\t\t\t\t\t\t\t} while (--c !== 0);\n\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\ts.window.set(s.window.subarray(r, r + c), q);\n\t\t\t\t\t\t\t\t\tq += c;\n\t\t\t\t\t\t\t\t\tr += c;\n\t\t\t\t\t\t\t\t\tc = 0;\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t\t} else if ((e & 64) === 0) {\n\t\t\t\t\t\t\t\tt += tp[tp_index_t_3 + 2];\n\t\t\t\t\t\t\t\tt += (b & inflate_mask[e]);\n\t\t\t\t\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\t\t\t\t\te = tp[tp_index_t_3];\n\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\tz.msg = "invalid distance code";\n\n\t\t\t\t\t\t\t\tc = z.avail_in - n;\n\t\t\t\t\t\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\t\t\t\t\t\tn += c;\n\t\t\t\t\t\t\t\tp -= c;\n\t\t\t\t\t\t\t\tk -= c << 3;\n\n\t\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\ts.write = q;\n\n\t\t\t\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t} while (true);\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ((e & 64) === 0) {\n\t\t\t\t\t\tt += tp[tp_index_t_3 + 2];\n\t\t\t\t\t\tt += (b & inflate_mask[e]);\n\t\t\t\t\t\ttp_index_t_3 = (tp_index + t) * 3;\n\t\t\t\t\t\tif ((e = tp[tp_index_t_3]) === 0) {\n\n\t\t\t\t\t\t\tb >>= (tp[tp_index_t_3 + 1]);\n\t\t\t\t\t\t\tk -= (tp[tp_index_t_3 + 1]);\n\n\t\t\t\t\t\t\ts.window[q++] = /* (byte) */tp[tp_index_t_3 + 2];\n\t\t\t\t\t\t\tm--;\n\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t}\n\t\t\t\t\t} else if ((e & 32) !== 0) {\n\n\t\t\t\t\t\tc = z.avail_in - n;\n\t\t\t\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\t\t\t\tn += c;\n\t\t\t\t\t\tp -= c;\n\t\t\t\t\t\tk -= c << 3;\n\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\n\t\t\t\t\t\treturn Z_STREAM_END;\n\t\t\t\t\t} else {\n\t\t\t\t\t\tz.msg = "invalid literal/length code";\n\n\t\t\t\t\t\tc = z.avail_in - n;\n\t\t\t\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\t\t\t\tn += c;\n\t\t\t\t\t\tp -= c;\n\t\t\t\t\t\tk -= c << 3;\n\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\n\t\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\t\t}\n\t\t\t\t} while (true);\n\t\t\t} while (m >= 258 && n >= 10);\n\n\t\t\t// not enough input or output--restore pointers and return\n\t\t\tc = z.avail_in - n;\n\t\t\tc = (k >> 3) < c ? k >> 3 : c;\n\t\t\tn += c;\n\t\t\tp -= c;\n\t\t\tk -= c << 3;\n\n\t\t\ts.bitb = b;\n\t\t\ts.bitk = k;\n\t\t\tz.avail_in = n;\n\t\t\tz.total_in += p - z.next_in_index;\n\t\t\tz.next_in_index = p;\n\t\t\ts.write = q;\n\n\t\t\treturn Z_OK;\n\t\t}\n\n\t\tthat.init = function(bl, bd, tl, tl_index, td, td_index) {\n\t\t\tmode = START;\n\t\t\tlbits = /* (byte) */bl;\n\t\t\tdbits = /* (byte) */bd;\n\t\t\tltree = tl;\n\t\t\tltree_index = tl_index;\n\t\t\tdtree = td;\n\t\t\tdtree_index = td_index;\n\t\t\ttree = null;\n\t\t};\n\n\t\tthat.proc = function(s, z, r) {\n\t\t\tvar j; // temporary storage\n\t\t\tvar tindex; // temporary pointer\n\t\t\tvar e; // extra bits or operation\n\t\t\tvar b = 0; // bit buffer\n\t\t\tvar k = 0; // bits in bit buffer\n\t\t\tvar p = 0; // input data pointer\n\t\t\tvar n; // bytes available there\n\t\t\tvar q; // output window write pointer\n\t\t\tvar m; // bytes to end of window or read pointer\n\t\t\tvar f; // pointer to copy strings from\n\n\t\t\t// copy input/output information to locals (UPDATE macro restores)\n\t\t\tp = z.next_in_index;\n\t\t\tn = z.avail_in;\n\t\t\tb = s.bitb;\n\t\t\tk = s.bitk;\n\t\t\tq = s.write;\n\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t// process input and output based on current state\n\t\t\twhile (true) {\n\t\t\t\tswitch (mode) {\n\t\t\t\t// waiting for "i:"=input, "o:"=output, "x:"=nothing\n\t\t\t\tcase START: // x: set up for LEN\n\t\t\t\t\tif (m >= 258 && n >= 10) {\n\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\tr = inflate_fast(lbits, dbits, ltree, ltree_index, dtree, dtree_index, s, z);\n\n\t\t\t\t\t\tp = z.next_in_index;\n\t\t\t\t\t\tn = z.avail_in;\n\t\t\t\t\t\tb = s.bitb;\n\t\t\t\t\t\tk = s.bitk;\n\t\t\t\t\t\tq = s.write;\n\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\t\tif (r != Z_OK) {\n\t\t\t\t\t\t\tmode = r == Z_STREAM_END ? WASH : BADCODE;\n\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tneed = lbits;\n\t\t\t\t\ttree = ltree;\n\t\t\t\t\ttree_index = ltree_index;\n\n\t\t\t\t\tmode = LEN;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase LEN: // i: get length/literal/eob next\n\t\t\t\t\tj = need;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\ttindex = (tree_index + (b & inflate_mask[j])) * 3;\n\n\t\t\t\t\tb >>>= (tree[tindex + 1]);\n\t\t\t\t\tk -= (tree[tindex + 1]);\n\n\t\t\t\t\te = tree[tindex];\n\n\t\t\t\t\tif (e === 0) { // literal\n\t\t\t\t\t\tlit = tree[tindex + 2];\n\t\t\t\t\t\tmode = LIT;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 16) !== 0) { // length\n\t\t\t\t\t\tget = e & 15;\n\t\t\t\t\t\tlen = tree[tindex + 2];\n\t\t\t\t\t\tmode = LENEXT;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 64) === 0) { // next table\n\t\t\t\t\t\tneed = e;\n\t\t\t\t\t\ttree_index = tindex / 3 + tree[tindex + 2];\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 32) !== 0) { // end of block\n\t\t\t\t\t\tmode = WASH;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tmode = BADCODE; // invalid code\n\t\t\t\t\tz.msg = "invalid literal/length code";\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tcase LENEXT: // i: getting length extra (have base)\n\t\t\t\t\tj = get;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\tlen += (b & inflate_mask[j]);\n\n\t\t\t\t\tb >>= j;\n\t\t\t\t\tk -= j;\n\n\t\t\t\t\tneed = dbits;\n\t\t\t\t\ttree = dtree;\n\t\t\t\t\ttree_index = dtree_index;\n\t\t\t\t\tmode = DIST;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DIST: // i: get distance next\n\t\t\t\t\tj = need;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\ttindex = (tree_index + (b & inflate_mask[j])) * 3;\n\n\t\t\t\t\tb >>= tree[tindex + 1];\n\t\t\t\t\tk -= tree[tindex + 1];\n\n\t\t\t\t\te = (tree[tindex]);\n\t\t\t\t\tif ((e & 16) !== 0) { // distance\n\t\t\t\t\t\tget = e & 15;\n\t\t\t\t\t\tdist = tree[tindex + 2];\n\t\t\t\t\t\tmode = DISTEXT;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((e & 64) === 0) { // next table\n\t\t\t\t\t\tneed = e;\n\t\t\t\t\t\ttree_index = tindex / 3 + tree[tindex + 2];\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tmode = BADCODE; // invalid code\n\t\t\t\t\tz.msg = "invalid distance code";\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tcase DISTEXT: // i: getting distance extra\n\t\t\t\t\tj = get;\n\n\t\t\t\t\twhile (k < (j)) {\n\t\t\t\t\t\tif (n !== 0)\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\telse {\n\n\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\tdist += (b & inflate_mask[j]);\n\n\t\t\t\t\tb >>= j;\n\t\t\t\t\tk -= j;\n\n\t\t\t\t\tmode = COPY;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase COPY: // o: copying bytes in window, waiting for space\n\t\t\t\t\tf = q - dist;\n\t\t\t\t\twhile (f < 0) { // modulo window size-"while" instead\n\t\t\t\t\t\tf += s.end; // of "if" handles invalid distances\n\t\t\t\t\t}\n\t\t\t\t\twhile (len !== 0) {\n\n\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\t\tr = s.inflate_flush(z, r);\n\t\t\t\t\t\t\t\tq = s.write;\n\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\ts.window[q++] = s.window[f++];\n\t\t\t\t\t\tm--;\n\n\t\t\t\t\t\tif (f == s.end)\n\t\t\t\t\t\t\tf = 0;\n\t\t\t\t\t\tlen--;\n\t\t\t\t\t}\n\t\t\t\t\tmode = START;\n\t\t\t\t\tbreak;\n\t\t\t\tcase LIT: // o: got literal, waiting for output space\n\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\tr = s.inflate_flush(z, r);\n\t\t\t\t\t\t\tq = s.write;\n\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\t\t\tif (q == s.end && s.read !== 0) {\n\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tr = Z_OK;\n\n\t\t\t\t\ts.window[q++] = /* (byte) */lit;\n\t\t\t\t\tm--;\n\n\t\t\t\t\tmode = START;\n\t\t\t\t\tbreak;\n\t\t\t\tcase WASH: // o: got eob, possibly more output\n\t\t\t\t\tif (k > 7) { // return unused byte, if any\n\t\t\t\t\t\tk -= 8;\n\t\t\t\t\t\tn++;\n\t\t\t\t\t\tp--; // can always return one\n\t\t\t\t\t}\n\n\t\t\t\t\ts.write = q;\n\t\t\t\t\tr = s.inflate_flush(z, r);\n\t\t\t\t\tq = s.write;\n\t\t\t\t\tm = q < s.read ? s.read - q - 1 : s.end - q;\n\n\t\t\t\t\tif (s.read != s.write) {\n\t\t\t\t\t\ts.bitb = b;\n\t\t\t\t\t\ts.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\ts.write = q;\n\t\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tmode = END;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase END:\n\t\t\t\t\tr = Z_STREAM_END;\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tcase BADCODE: // x: got error\n\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\n\t\t\t\tdefault:\n\t\t\t\t\tr = Z_STREAM_ERROR;\n\n\t\t\t\t\ts.bitb = b;\n\t\t\t\t\ts.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\ts.write = q;\n\t\t\t\t\treturn s.inflate_flush(z, r);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthat.free = function() {\n\t\t\t// ZFREE(z, c);\n\t\t};\n\n\t}\n\n\t// InfBlocks\n\n\t// Table for deflate from PKZIP\'s appnote.txt.\n\tvar border = [ // Order of the bit length code lengths\n\t16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];\n\n\tvar TYPE = 0; // get type bits (3, including end bit)\n\tvar LENS = 1; // get lengths for stored\n\tvar STORED = 2;// processing stored block\n\tvar TABLE = 3; // get table lengths\n\tvar BTREE = 4; // get bit lengths tree for a dynamic\n\t// block\n\tvar DTREE = 5; // get length, distance trees for a\n\t// dynamic block\n\tvar CODES = 6; // processing fixed or dynamic block\n\tvar DRY = 7; // output remaining window bytes\n\tvar DONELOCKS = 8; // finished last block, done\n\tvar BADBLOCKS = 9; // ot a data error--stuck here\n\n\tfunction InfBlocks(z, w) {\n\t\tvar that = this;\n\n\t\tvar mode = TYPE; // current inflate_block mode\n\n\t\tvar left = 0; // if STORED, bytes left to copy\n\n\t\tvar table = 0; // table lengths (14 bits)\n\t\tvar index = 0; // index into blens (or border)\n\t\tvar blens; // bit lengths of codes\n\t\tvar bb = [ 0 ]; // bit length tree depth\n\t\tvar tb = [ 0 ]; // bit length decoding tree\n\n\t\tvar codes = new InfCodes(); // if CODES, current state\n\n\t\tvar last = 0; // true if this block is the last block\n\n\t\tvar hufts = new Int32Array(MANY * 3); // single malloc for tree space\n\t\tvar check = 0; // check on output\n\t\tvar inftree = new InfTree();\n\n\t\tthat.bitk = 0; // bits in bit buffer\n\t\tthat.bitb = 0; // bit buffer\n\t\tthat.window = new Uint8Array(w); // sliding window\n\t\tthat.end = w; // one byte after sliding window\n\t\tthat.read = 0; // window read pointer\n\t\tthat.write = 0; // window write pointer\n\n\t\tthat.reset = function(z, c) {\n\t\t\tif (c)\n\t\t\t\tc[0] = check;\n\t\t\t// if (mode == BTREE || mode == DTREE) {\n\t\t\t// }\n\t\t\tif (mode == CODES) {\n\t\t\t\tcodes.free(z);\n\t\t\t}\n\t\t\tmode = TYPE;\n\t\t\tthat.bitk = 0;\n\t\t\tthat.bitb = 0;\n\t\t\tthat.read = that.write = 0;\n\t\t};\n\n\t\tthat.reset(z, null);\n\n\t\t// copy as much as possible from the sliding window to the output area\n\t\tthat.inflate_flush = function(z, r) {\n\t\t\tvar n;\n\t\t\tvar p;\n\t\t\tvar q;\n\n\t\t\t// local copies of source and destination pointers\n\t\t\tp = z.next_out_index;\n\t\t\tq = that.read;\n\n\t\t\t// compute number of bytes to copy as far as end of window\n\t\t\tn = /* (int) */((q <= that.write ? that.write : that.end) - q);\n\t\t\tif (n > z.avail_out)\n\t\t\t\tn = z.avail_out;\n\t\t\tif (n !== 0 && r == Z_BUF_ERROR)\n\t\t\t\tr = Z_OK;\n\n\t\t\t// update counters\n\t\t\tz.avail_out -= n;\n\t\t\tz.total_out += n;\n\n\t\t\t// copy as far as end of window\n\t\t\tz.next_out.set(that.window.subarray(q, q + n), p);\n\t\t\tp += n;\n\t\t\tq += n;\n\n\t\t\t// see if more to copy at beginning of window\n\t\t\tif (q == that.end) {\n\t\t\t\t// wrap pointers\n\t\t\t\tq = 0;\n\t\t\t\tif (that.write == that.end)\n\t\t\t\t\tthat.write = 0;\n\n\t\t\t\t// compute bytes to copy\n\t\t\t\tn = that.write - q;\n\t\t\t\tif (n > z.avail_out)\n\t\t\t\t\tn = z.avail_out;\n\t\t\t\tif (n !== 0 && r == Z_BUF_ERROR)\n\t\t\t\t\tr = Z_OK;\n\n\t\t\t\t// update counters\n\t\t\t\tz.avail_out -= n;\n\t\t\t\tz.total_out += n;\n\n\t\t\t\t// copy\n\t\t\t\tz.next_out.set(that.window.subarray(q, q + n), p);\n\t\t\t\tp += n;\n\t\t\t\tq += n;\n\t\t\t}\n\n\t\t\t// update pointers\n\t\t\tz.next_out_index = p;\n\t\t\tthat.read = q;\n\n\t\t\t// done\n\t\t\treturn r;\n\t\t};\n\n\t\tthat.proc = function(z, r) {\n\t\t\tvar t; // temporary storage\n\t\t\tvar b; // bit buffer\n\t\t\tvar k; // bits in bit buffer\n\t\t\tvar p; // input data pointer\n\t\t\tvar n; // bytes available there\n\t\t\tvar q; // output window write pointer\n\t\t\tvar m; // bytes to end of window or read pointer\n\n\t\t\tvar i;\n\n\t\t\t// copy input/output information to locals (UPDATE macro restores)\n\t\t\t// {\n\t\t\tp = z.next_in_index;\n\t\t\tn = z.avail_in;\n\t\t\tb = that.bitb;\n\t\t\tk = that.bitk;\n\t\t\t// }\n\t\t\t// {\n\t\t\tq = that.write;\n\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t// }\n\n\t\t\t// process input based on current state\n\t\t\t// DEBUG dtree\n\t\t\twhile (true) {\n\t\t\t\tswitch (mode) {\n\t\t\t\tcase TYPE:\n\n\t\t\t\t\twhile (k < (3)) {\n\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\t\t\t\t\tt = /* (int) */(b & 7);\n\t\t\t\t\tlast = t & 1;\n\n\t\t\t\t\tswitch (t >>> 1) {\n\t\t\t\t\tcase 0: // stored\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\t\t\t\t\t\tt = k & 7; // go to byte boundary\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (t);\n\t\t\t\t\t\tk -= (t);\n\t\t\t\t\t\t// }\n\t\t\t\t\t\tmode = LENS; // get length of stored block\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tcase 1: // fixed\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tvar bl = []; // new Array(1);\n\t\t\t\t\t\tvar bd = []; // new Array(1);\n\t\t\t\t\t\tvar tl = [ [] ]; // new Array(1);\n\t\t\t\t\t\tvar td = [ [] ]; // new Array(1);\n\n\t\t\t\t\t\tInfTree.inflate_trees_fixed(bl, bd, tl, td);\n\t\t\t\t\t\tcodes.init(bl[0], bd[0], tl[0], 0, td[0], 0);\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\tmode = CODES;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tcase 2: // dynamic\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\tmode = TABLE;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tcase 3: // illegal\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\tz.msg = "invalid block type";\n\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tbreak;\n\t\t\t\tcase LENS:\n\n\t\t\t\t\twhile (k < (32)) {\n\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ((((~b) >>> 16) & 0xffff) != (b & 0xffff)) {\n\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\tz.msg = "invalid stored block lengths";\n\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tleft = (b & 0xffff);\n\t\t\t\t\tb = k = 0; // dump bits\n\t\t\t\t\tmode = left !== 0 ? STORED : (last !== 0 ? DRY : TYPE);\n\t\t\t\t\tbreak;\n\t\t\t\tcase STORED:\n\t\t\t\t\tif (n === 0) {\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\n\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\tif (q == that.end && that.read !== 0) {\n\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\tr = that.inflate_flush(z, r);\n\t\t\t\t\t\t\tq = that.write;\n\t\t\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\t\t\tif (q == that.end && that.read !== 0) {\n\t\t\t\t\t\t\t\tq = 0;\n\t\t\t\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tif (m === 0) {\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t\tr = Z_OK;\n\n\t\t\t\t\tt = left;\n\t\t\t\t\tif (t > n)\n\t\t\t\t\t\tt = n;\n\t\t\t\t\tif (t > m)\n\t\t\t\t\t\tt = m;\n\t\t\t\t\tthat.window.set(z.read_buf(p, t), q);\n\t\t\t\t\tp += t;\n\t\t\t\t\tn -= t;\n\t\t\t\t\tq += t;\n\t\t\t\t\tm -= t;\n\t\t\t\t\tif ((left -= t) !== 0)\n\t\t\t\t\t\tbreak;\n\t\t\t\t\tmode = last !== 0 ? DRY : TYPE;\n\t\t\t\t\tbreak;\n\t\t\t\tcase TABLE:\n\n\t\t\t\t\twhile (k < (14)) {\n\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tn--;\n\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\tk += 8;\n\t\t\t\t\t}\n\n\t\t\t\t\ttable = t = (b & 0x3fff);\n\t\t\t\t\tif ((t & 0x1f) > 29 || ((t >> 5) & 0x1f) > 29) {\n\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\tz.msg = "too many length or distance symbols";\n\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tt = 258 + (t & 0x1f) + ((t >> 5) & 0x1f);\n\t\t\t\t\tif (!blens || blens.length < t) {\n\t\t\t\t\t\tblens = []; // new Array(t);\n\t\t\t\t\t} else {\n\t\t\t\t\t\tfor (i = 0; i < t; i++) {\n\t\t\t\t\t\t\tblens[i] = 0;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\t// {\n\t\t\t\t\tb >>>= (14);\n\t\t\t\t\tk -= (14);\n\t\t\t\t\t// }\n\n\t\t\t\t\tindex = 0;\n\t\t\t\t\tmode = BTREE;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase BTREE:\n\t\t\t\t\twhile (index < 4 + (table >>> 10)) {\n\t\t\t\t\t\twhile (k < (3)) {\n\t\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tblens[border[index++]] = b & 7;\n\n\t\t\t\t\t\t// {\n\t\t\t\t\t\tb >>>= (3);\n\t\t\t\t\t\tk -= (3);\n\t\t\t\t\t\t// }\n\t\t\t\t\t}\n\n\t\t\t\t\twhile (index < 19) {\n\t\t\t\t\t\tblens[border[index++]] = 0;\n\t\t\t\t\t}\n\n\t\t\t\t\tbb[0] = 7;\n\t\t\t\t\tt = inftree.inflate_trees_bits(blens, bb, tb, hufts, z);\n\t\t\t\t\tif (t != Z_OK) {\n\t\t\t\t\t\tr = t;\n\t\t\t\t\t\tif (r == Z_DATA_ERROR) {\n\t\t\t\t\t\t\tblens = null;\n\t\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\n\t\t\t\t\tindex = 0;\n\t\t\t\t\tmode = DTREE;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DTREE:\n\t\t\t\t\twhile (true) {\n\t\t\t\t\t\tt = table;\n\t\t\t\t\t\tif (index >= 258 + (t & 0x1f) + ((t >> 5) & 0x1f)) {\n\t\t\t\t\t\t\tbreak;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tvar j, c;\n\n\t\t\t\t\t\tt = bb[0];\n\n\t\t\t\t\t\twhile (k < (t)) {\n\t\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\t// if (tb[0] == -1) {\n\t\t\t\t\t\t// System.err.println("null...");\n\t\t\t\t\t\t// }\n\n\t\t\t\t\t\tt = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 1];\n\t\t\t\t\t\tc = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 2];\n\n\t\t\t\t\t\tif (c < 16) {\n\t\t\t\t\t\t\tb >>>= (t);\n\t\t\t\t\t\t\tk -= (t);\n\t\t\t\t\t\t\tblens[index++] = c;\n\t\t\t\t\t\t} else { // c == 16..18\n\t\t\t\t\t\t\ti = c == 18 ? 7 : c - 14;\n\t\t\t\t\t\t\tj = c == 18 ? 11 : 3;\n\n\t\t\t\t\t\t\twhile (k < (t + i)) {\n\t\t\t\t\t\t\t\tif (n !== 0) {\n\t\t\t\t\t\t\t\t\tr = Z_OK;\n\t\t\t\t\t\t\t\t} else {\n\t\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t\t}\n\t\t\t\t\t\t\t\tn--;\n\t\t\t\t\t\t\t\tb |= (z.read_byte(p++) & 0xff) << k;\n\t\t\t\t\t\t\t\tk += 8;\n\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\tb >>>= (t);\n\t\t\t\t\t\t\tk -= (t);\n\n\t\t\t\t\t\t\tj += (b & inflate_mask[i]);\n\n\t\t\t\t\t\t\tb >>>= (i);\n\t\t\t\t\t\t\tk -= (i);\n\n\t\t\t\t\t\t\ti = index;\n\t\t\t\t\t\t\tt = table;\n\t\t\t\t\t\t\tif (i + j > 258 + (t & 0x1f) + ((t >> 5) & 0x1f) || (c == 16 && i < 1)) {\n\t\t\t\t\t\t\t\tblens = null;\n\t\t\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\t\t\tz.msg = "invalid bit length repeat";\n\t\t\t\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\tc = c == 16 ? blens[i - 1] : 0;\n\t\t\t\t\t\t\tdo {\n\t\t\t\t\t\t\t\tblens[i++] = c;\n\t\t\t\t\t\t\t} while (--j !== 0);\n\t\t\t\t\t\t\tindex = i;\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\n\t\t\t\t\ttb[0] = -1;\n\t\t\t\t\t// {\n\t\t\t\t\tvar bl_ = []; // new Array(1);\n\t\t\t\t\tvar bd_ = []; // new Array(1);\n\t\t\t\t\tvar tl_ = []; // new Array(1);\n\t\t\t\t\tvar td_ = []; // new Array(1);\n\t\t\t\t\tbl_[0] = 9; // must be <= 9 for lookahead assumptions\n\t\t\t\t\tbd_[0] = 6; // must be <= 9 for lookahead assumptions\n\n\t\t\t\t\tt = table;\n\t\t\t\t\tt = inftree.inflate_trees_dynamic(257 + (t & 0x1f), 1 + ((t >> 5) & 0x1f), blens, bl_, bd_, tl_, td_, hufts, z);\n\n\t\t\t\t\tif (t != Z_OK) {\n\t\t\t\t\t\tif (t == Z_DATA_ERROR) {\n\t\t\t\t\t\t\tblens = null;\n\t\t\t\t\t\t\tmode = BADBLOCKS;\n\t\t\t\t\t\t}\n\t\t\t\t\t\tr = t;\n\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tcodes.init(bl_[0], bd_[0], hufts, tl_[0], hufts, td_[0]);\n\t\t\t\t\t// }\n\t\t\t\t\tmode = CODES;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase CODES:\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\n\t\t\t\t\tif ((r = codes.proc(that, z, r)) != Z_STREAM_END) {\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tr = Z_OK;\n\t\t\t\t\tcodes.free(z);\n\n\t\t\t\t\tp = z.next_in_index;\n\t\t\t\t\tn = z.avail_in;\n\t\t\t\t\tb = that.bitb;\n\t\t\t\t\tk = that.bitk;\n\t\t\t\t\tq = that.write;\n\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\n\t\t\t\t\tif (last === 0) {\n\t\t\t\t\t\tmode = TYPE;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tmode = DRY;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DRY:\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\tr = that.inflate_flush(z, r);\n\t\t\t\t\tq = that.write;\n\t\t\t\t\tm = /* (int) */(q < that.read ? that.read - q - 1 : that.end - q);\n\t\t\t\t\tif (that.read != that.write) {\n\t\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\t\tthat.write = q;\n\t\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t\t}\n\t\t\t\t\tmode = DONELOCKS;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DONELOCKS:\n\t\t\t\t\tr = Z_STREAM_END;\n\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\tcase BADBLOCKS:\n\t\t\t\t\tr = Z_DATA_ERROR;\n\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\treturn that.inflate_flush(z, r);\n\n\t\t\t\tdefault:\n\t\t\t\t\tr = Z_STREAM_ERROR;\n\n\t\t\t\t\tthat.bitb = b;\n\t\t\t\t\tthat.bitk = k;\n\t\t\t\t\tz.avail_in = n;\n\t\t\t\t\tz.total_in += p - z.next_in_index;\n\t\t\t\t\tz.next_in_index = p;\n\t\t\t\t\tthat.write = q;\n\t\t\t\t\treturn that.inflate_flush(z, r);\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthat.free = function(z) {\n\t\t\tthat.reset(z, null);\n\t\t\tthat.window = null;\n\t\t\thufts = null;\n\t\t\t// ZFREE(z, s);\n\t\t};\n\n\t\tthat.set_dictionary = function(d, start, n) {\n\t\t\tthat.window.set(d.subarray(start, start + n), 0);\n\t\t\tthat.read = that.write = n;\n\t\t};\n\n\t\t// Returns true if inflate is currently at the end of a block generated\n\t\t// by Z_SYNC_FLUSH or Z_FULL_FLUSH.\n\t\tthat.sync_point = function() {\n\t\t\treturn mode == LENS ? 1 : 0;\n\t\t};\n\n\t}\n\n\t// Inflate\n\n\t// preset dictionary flag in zlib header\n\tvar PRESET_DICT = 0x20;\n\n\tvar Z_DEFLATED = 8;\n\n\tvar METHOD = 0; // waiting for method byte\n\tvar FLAG = 1; // waiting for flag byte\n\tvar DICT4 = 2; // four dictionary check bytes to go\n\tvar DICT3 = 3; // three dictionary check bytes to go\n\tvar DICT2 = 4; // two dictionary check bytes to go\n\tvar DICT1 = 5; // one dictionary check byte to go\n\tvar DICT0 = 6; // waiting for inflateSetDictionary\n\tvar BLOCKS = 7; // decompressing blocks\n\tvar DONE = 12; // finished check, done\n\tvar BAD = 13; // got an error--stay here\n\n\tvar mark = [ 0, 0, 0xff, 0xff ];\n\n\tfunction Inflate() {\n\t\tvar that = this;\n\n\t\tthat.mode = 0; // current inflate mode\n\n\t\t// mode dependent information\n\t\tthat.method = 0; // if FLAGS, method byte\n\n\t\t// if CHECK, check values to compare\n\t\tthat.was = [ 0 ]; // new Array(1); // computed check value\n\t\tthat.need = 0; // stream check value\n\n\t\t// if BAD, inflateSync\'s marker bytes count\n\t\tthat.marker = 0;\n\n\t\t// mode independent information\n\t\tthat.wbits = 0; // log2(window size) (8..15, defaults to 15)\n\n\t\t// this.blocks; // current inflate_blocks state\n\n\t\tfunction inflateReset(z) {\n\t\t\tif (!z || !z.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\n\t\t\tz.total_in = z.total_out = 0;\n\t\t\tz.msg = null;\n\t\t\tz.istate.mode = BLOCKS;\n\t\t\tz.istate.blocks.reset(z, null);\n\t\t\treturn Z_OK;\n\t\t}\n\n\t\tthat.inflateEnd = function(z) {\n\t\t\tif (that.blocks)\n\t\t\t\tthat.blocks.free(z);\n\t\t\tthat.blocks = null;\n\t\t\t// ZFREE(z, z->state);\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.inflateInit = function(z, w) {\n\t\t\tz.msg = null;\n\t\t\tthat.blocks = null;\n\n\t\t\t// set window size\n\t\t\tif (w < 8 || w > 15) {\n\t\t\t\tthat.inflateEnd(z);\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t}\n\t\t\tthat.wbits = w;\n\n\t\t\tz.istate.blocks = new InfBlocks(z, 1 << w);\n\n\t\t\t// reset state\n\t\t\tinflateReset(z);\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.inflate = function(z, f) {\n\t\t\tvar r;\n\t\t\tvar b;\n\n\t\t\tif (!z || !z.istate || !z.next_in)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tf = f == Z_FINISH ? Z_BUF_ERROR : Z_OK;\n\t\t\tr = Z_BUF_ERROR;\n\t\t\twhile (true) {\n\t\t\t\t// System.out.println("mode: "+z.istate.mode);\n\t\t\t\tswitch (z.istate.mode) {\n\t\t\t\tcase METHOD:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tif (((z.istate.method = z.read_byte(z.next_in_index++)) & 0xf) != Z_DEFLATED) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.msg = "unknown compression method";\n\t\t\t\t\t\tz.istate.marker = 5; // can\'t try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif ((z.istate.method >> 4) + 8 > z.istate.wbits) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.msg = "invalid window size";\n\t\t\t\t\t\tz.istate.marker = 5; // can\'t try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tz.istate.mode = FLAG;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase FLAG:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tb = (z.read_byte(z.next_in_index++)) & 0xff;\n\n\t\t\t\t\tif ((((z.istate.method << 8) + b) % 31) !== 0) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.msg = "incorrect header check";\n\t\t\t\t\t\tz.istate.marker = 5; // can\'t try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\n\t\t\t\t\tif ((b & PRESET_DICT) === 0) {\n\t\t\t\t\t\tz.istate.mode = BLOCKS;\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tz.istate.mode = DICT4;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT4:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need = ((z.read_byte(z.next_in_index++) & 0xff) << 24) & 0xff000000;\n\t\t\t\t\tz.istate.mode = DICT3;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT3:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need += ((z.read_byte(z.next_in_index++) & 0xff) << 16) & 0xff0000;\n\t\t\t\t\tz.istate.mode = DICT2;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT2:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need += ((z.read_byte(z.next_in_index++) & 0xff) << 8) & 0xff00;\n\t\t\t\t\tz.istate.mode = DICT1;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DICT1:\n\n\t\t\t\t\tif (z.avail_in === 0)\n\t\t\t\t\t\treturn r;\n\t\t\t\t\tr = f;\n\n\t\t\t\t\tz.avail_in--;\n\t\t\t\t\tz.total_in++;\n\t\t\t\t\tz.istate.need += (z.read_byte(z.next_in_index++) & 0xff);\n\t\t\t\t\tz.istate.mode = DICT0;\n\t\t\t\t\treturn Z_NEED_DICT;\n\t\t\t\tcase DICT0:\n\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\tz.msg = "need dictionary";\n\t\t\t\t\tz.istate.marker = 0; // can try inflateSync\n\t\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t\tcase BLOCKS:\n\n\t\t\t\t\tr = z.istate.blocks.proc(z, r);\n\t\t\t\t\tif (r == Z_DATA_ERROR) {\n\t\t\t\t\t\tz.istate.mode = BAD;\n\t\t\t\t\t\tz.istate.marker = 0; // can try inflateSync\n\t\t\t\t\t\tbreak;\n\t\t\t\t\t}\n\t\t\t\t\tif (r == Z_OK) {\n\t\t\t\t\t\tr = f;\n\t\t\t\t\t}\n\t\t\t\t\tif (r != Z_STREAM_END) {\n\t\t\t\t\t\treturn r;\n\t\t\t\t\t}\n\t\t\t\t\tr = f;\n\t\t\t\t\tz.istate.blocks.reset(z, z.istate.was);\n\t\t\t\t\tz.istate.mode = DONE;\n\t\t\t\t\t/* falls through */\n\t\t\t\tcase DONE:\n\t\t\t\t\treturn Z_STREAM_END;\n\t\t\t\tcase BAD:\n\t\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t\tdefault:\n\t\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\t\t}\n\t\t\t}\n\t\t};\n\n\t\tthat.inflateSetDictionary = function(z, dictionary, dictLength) {\n\t\t\tvar index = 0;\n\t\t\tvar length = dictLength;\n\t\t\tif (!z || !z.istate || z.istate.mode != DICT0)\n\t\t\t\treturn Z_STREAM_ERROR;\n\n\t\t\tif (length >= (1 << z.istate.wbits)) {\n\t\t\t\tlength = (1 << z.istate.wbits) - 1;\n\t\t\t\tindex = dictLength - length;\n\t\t\t}\n\t\t\tz.istate.blocks.set_dictionary(dictionary, index, length);\n\t\t\tz.istate.mode = BLOCKS;\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\tthat.inflateSync = function(z) {\n\t\t\tvar n; // number of bytes to look at\n\t\t\tvar p; // pointer to bytes\n\t\t\tvar m; // number of marker bytes found in a row\n\t\t\tvar r, w; // temporaries to save total_in and total_out\n\n\t\t\t// set up\n\t\t\tif (!z || !z.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tif (z.istate.mode != BAD) {\n\t\t\t\tz.istate.mode = BAD;\n\t\t\t\tz.istate.marker = 0;\n\t\t\t}\n\t\t\tif ((n = z.avail_in) === 0)\n\t\t\t\treturn Z_BUF_ERROR;\n\t\t\tp = z.next_in_index;\n\t\t\tm = z.istate.marker;\n\n\t\t\t// search\n\t\t\twhile (n !== 0 && m < 4) {\n\t\t\t\tif (z.read_byte(p) == mark[m]) {\n\t\t\t\t\tm++;\n\t\t\t\t} else if (z.read_byte(p) !== 0) {\n\t\t\t\t\tm = 0;\n\t\t\t\t} else {\n\t\t\t\t\tm = 4 - m;\n\t\t\t\t}\n\t\t\t\tp++;\n\t\t\t\tn--;\n\t\t\t}\n\n\t\t\t// restore\n\t\t\tz.total_in += p - z.next_in_index;\n\t\t\tz.next_in_index = p;\n\t\t\tz.avail_in = n;\n\t\t\tz.istate.marker = m;\n\n\t\t\t// return no joy or set up to restart on a new block\n\t\t\tif (m != 4) {\n\t\t\t\treturn Z_DATA_ERROR;\n\t\t\t}\n\t\t\tr = z.total_in;\n\t\t\tw = z.total_out;\n\t\t\tinflateReset(z);\n\t\t\tz.total_in = r;\n\t\t\tz.total_out = w;\n\t\t\tz.istate.mode = BLOCKS;\n\t\t\treturn Z_OK;\n\t\t};\n\n\t\t// Returns true if inflate is currently at the end of a block generated\n\t\t// by Z_SYNC_FLUSH or Z_FULL_FLUSH. This function is used by one PPP\n\t\t// implementation to provide an additional safety check. PPP uses\n\t\t// Z_SYNC_FLUSH\n\t\t// but removes the length bytes of the resulting empty stored block. When\n\t\t// decompressing, PPP checks that at the end of input packet, inflate is\n\t\t// waiting for these length bytes.\n\t\tthat.inflateSyncPoint = function(z) {\n\t\t\tif (!z || !z.istate || !z.istate.blocks)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn z.istate.blocks.sync_point();\n\t\t};\n\t}\n\n\t// ZStream\n\n\tfunction ZStream() {\n\t}\n\n\tZStream.prototype = {\n\t\tinflateInit : function(bits) {\n\t\t\tvar that = this;\n\t\t\tthat.istate = new Inflate();\n\t\t\tif (!bits)\n\t\t\t\tbits = MAX_BITS;\n\t\t\treturn that.istate.inflateInit(that, bits);\n\t\t},\n\n\t\tinflate : function(f) {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.istate.inflate(that, f);\n\t\t},\n\n\t\tinflateEnd : function() {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\tvar ret = that.istate.inflateEnd(that);\n\t\t\tthat.istate = null;\n\t\t\treturn ret;\n\t\t},\n\n\t\tinflateSync : function() {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.istate.inflateSync(that);\n\t\t},\n\t\tinflateSetDictionary : function(dictionary, dictLength) {\n\t\t\tvar that = this;\n\t\t\tif (!that.istate)\n\t\t\t\treturn Z_STREAM_ERROR;\n\t\t\treturn that.istate.inflateSetDictionary(that, dictionary, dictLength);\n\t\t},\n\t\tread_byte : function(start) {\n\t\t\tvar that = this;\n\t\t\treturn that.next_in.subarray(start, start + 1)[0];\n\t\t},\n\t\tread_buf : function(start, size) {\n\t\t\tvar that = this;\n\t\t\treturn that.next_in.subarray(start, start + size);\n\t\t}\n\t};\n\n\t// Inflater\n\n\tfunction Inflater() {\n\t\tvar that = this;\n\t\tvar z = new ZStream();\n\t\tvar bufsize = 512;\n\t\tvar flush = Z_NO_FLUSH;\n\t\tvar buf = new Uint8Array(bufsize);\n\t\tvar nomoreinput = false;\n\n\t\tz.inflateInit();\n\t\tz.next_out = buf;\n\n\t\tthat.append = function(data, onprogress) {\n\t\t\tvar err, buffers = [], lastIndex = 0, bufferIndex = 0, bufferSize = 0, array;\n\t\t\tif (data.length === 0)\n\t\t\t\treturn;\n\t\t\tz.next_in_index = 0;\n\t\t\tz.next_in = data;\n\t\t\tz.avail_in = data.length;\n\t\t\tdo {\n\t\t\t\tz.next_out_index = 0;\n\t\t\t\tz.avail_out = bufsize;\n\t\t\t\tif ((z.avail_in === 0) && (!nomoreinput)) { // if buffer is empty and more input is available, refill it\n\t\t\t\t\tz.next_in_index = 0;\n\t\t\t\t\tnomoreinput = true;\n\t\t\t\t}\n\t\t\t\terr = z.inflate(flush);\n\t\t\t\tif (nomoreinput && (err === Z_BUF_ERROR)) {\n\t\t\t\t\tif (z.avail_in !== 0)\n\t\t\t\t\t\tthrow new Error("inflating: bad input");\n\t\t\t\t} else if (err !== Z_OK && err !== Z_STREAM_END)\n\t\t\t\t\tthrow new Error("inflating: " + z.msg);\n\t\t\t\tif ((nomoreinput || err === Z_STREAM_END) && (z.avail_in === data.length))\n\t\t\t\t\tthrow new Error("inflating: bad input");\n\t\t\t\tif (z.next_out_index)\n\t\t\t\t\tif (z.next_out_index === bufsize)\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf));\n\t\t\t\t\telse\n\t\t\t\t\t\tbuffers.push(new Uint8Array(buf.subarray(0, z.next_out_index)));\n\t\t\t\tbufferSize += z.next_out_index;\n\t\t\t\tif (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) {\n\t\t\t\t\tonprogress(z.next_in_index);\n\t\t\t\t\tlastIndex = z.next_in_index;\n\t\t\t\t}\n\t\t\t} while (z.avail_in > 0 || z.avail_out === 0);\n\t\t\tarray = new Uint8Array(bufferSize);\n\t\t\tbuffers.forEach(function(chunk) {\n\t\t\t\tarray.set(chunk, bufferIndex);\n\t\t\t\tbufferIndex += chunk.length;\n\t\t\t});\n\t\t\treturn array;\n\t\t};\n\t\tthat.flush = function() {\n\t\t\tz.inflateEnd();\n\t\t};\n\t}\n\n\t// \'zip\' may not be defined in z-worker and some tests\n\tvar env = global.zip || global;\n\tenv.Inflater = env._jzlib_Inflater = Inflater;\n})(this);\n')]
    }, module.exports = zip
  }, {
    zip: 38
  }],
  38: [function(require, module, exports) {
    (function(global) {
      (function(module, exports, require, define, browserify_shim__define__module__export__) {
        !function(obj) {
          "use strict";

          function Crc32() {
            this.crc = -1
          }

          function NOOP() {}

          function blobSlice(blob, index, length) {
            if (index < 0 || length < 0 || index + length > blob.size) throw new RangeError("offset:" + index + ", length:" + length + ", size:" + blob.size);
            return blob.slice ? blob.slice(index, index + length) : blob.webkitSlice ? blob.webkitSlice(index, index + length) : blob.mozSlice ? blob.mozSlice(index, index + length) : blob.msSlice ? blob.msSlice(index, index + length) : void 0
          }

          function getDataHelper(byteLength, bytes) {
            var dataBuffer, dataArray;
            return dataBuffer = new ArrayBuffer(byteLength), dataArray = new Uint8Array(dataBuffer), bytes && dataArray.set(bytes, 0), {
              buffer: dataBuffer,
              array: dataArray,
              view: new DataView(dataBuffer)
            }
          }

          function Reader() {}

          function TextReader(text) {
            function init(callback, onerror) {
              var blob = new Blob([text], {
                type: TEXT_PLAIN
              });
              blobReader = new BlobReader(blob), blobReader.init(function() {
                that.size = blobReader.size, callback()
              }, onerror)
            }

            function readUint8Array(index, length, callback, onerror) {
              blobReader.readUint8Array(index, length, callback, onerror)
            }
            var blobReader, that = this;
            that.size = 0, that.init = init, that.readUint8Array = readUint8Array
          }

          function Data64URIReader(dataURI) {
            function init(callback) {
              for (var dataEnd = dataURI.length;
                "=" == dataURI.charAt(dataEnd - 1);) dataEnd--;
              dataStart = dataURI.indexOf(",") + 1, that.size = Math.floor(.75 * (dataEnd - dataStart)), callback()
            }

            function readUint8Array(index, length, callback) {
              var i, data = getDataHelper(length),
                start = 4 * Math.floor(index / 3),
                end = 4 * Math.ceil((index + length) / 3),
                bytes = obj.atob(dataURI.substring(start + dataStart, end + dataStart)),
                delta = index - 3 * Math.floor(start / 4);
              for (i = delta; i < delta + length; i++) data.array[i - delta] = bytes.charCodeAt(i);
              callback(data.array)
            }
            var dataStart, that = this;
            that.size = 0, that.init = init, that.readUint8Array = readUint8Array
          }

          function BlobReader(blob) {
            function init(callback) {
              that.size = blob.size, callback()
            }

            function readUint8Array(index, length, callback, onerror) {
              var reader = new FileReader;
              reader.onload = function(e) {
                callback(new Uint8Array(e.target.result))
              }, reader.onerror = onerror;
              try {
                reader.readAsArrayBuffer(blobSlice(blob, index, length))
              } catch (e) {
                onerror(e)
              }
            }
            var that = this;
            that.size = 0, that.init = init, that.readUint8Array = readUint8Array
          }

          function Writer() {}

          function TextWriter(encoding) {
            function init(callback) {
              blob = new Blob([], {
                type: TEXT_PLAIN
              }), callback()
            }

            function writeUint8Array(array, callback) {
              blob = new Blob([blob, appendABViewSupported ? array : array.buffer], {
                type: TEXT_PLAIN
              }), callback()
            }

            function getData(callback, onerror) {
              var reader = new FileReader;
              reader.onload = function(e) {
                callback(e.target.result)
              }, reader.onerror = onerror, reader.readAsText(blob, encoding)
            }
            var blob, that = this;
            that.init = init, that.writeUint8Array = writeUint8Array, that.getData = getData
          }

          function Data64URIWriter(contentType) {
            function init(callback) {
              data += "data:" + (contentType || "") + ";base64,", callback()
            }

            function writeUint8Array(array, callback) {
              var i, delta = pending.length,
                dataString = pending;
              for (pending = "", i = 0; i < 3 * Math.floor((delta + array.length) / 3) - delta; i++) dataString += String.fromCharCode(array[i]);
              for (; i < array.length; i++) pending += String.fromCharCode(array[i]);
              dataString.length > 2 ? data += obj.btoa(dataString) : pending = dataString, callback()
            }

            function getData(callback) {
              callback(data + obj.btoa(pending))
            }
            var that = this,
              data = "",
              pending = "";
            that.init = init, that.writeUint8Array = writeUint8Array, that.getData = getData
          }

          function BlobWriter(contentType) {
            function init(callback) {
              blob = new Blob([], {
                type: contentType
              }), callback()
            }

            function writeUint8Array(array, callback) {
              blob = new Blob([blob, appendABViewSupported ? array : array.buffer], {
                type: contentType
              }), callback()
            }

            function getData(callback) {
              callback(blob)
            }
            var blob, that = this;
            that.init = init, that.writeUint8Array = writeUint8Array, that.getData = getData
          }

          function launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror) {
            function onflush() {
              worker.removeEventListener("message", onmessage, !1), onend(outputSize, crc)
            }

            function onmessage(event) {
              var message = event.data,
                data = message.data,
                err = message.error;
              if (err) return err.toString = function() {
                return "Error: " + this.message
              }, void onreaderror(err);
              if (message.sn === sn) switch ("number" == typeof message.codecTime && (worker.codecTime += message.codecTime), "number" == typeof message.crcTime && (worker.crcTime += message.crcTime), message.type) {
                case "append":
                  data ? (outputSize += data.length, writer.writeUint8Array(data, function() {
                    step()
                  }, onwriteerror)) : step();
                  break;
                case "flush":
                  crc = message.crc, data ? (outputSize += data.length, writer.writeUint8Array(data, function() {
                    onflush()
                  }, onwriteerror)) : onflush();
                  break;
                case "progress":
                  onprogress && onprogress(index + message.loaded, size);
                  break;
                case "importScripts":
                case "newTask":
                case "echo":
                  break;
                default:
                  console.warn("zip.js:launchWorkerProcess: unknown message: ", message)
              }
            }

            function step() {
              index = chunkIndex * CHUNK_SIZE, index <= size ? reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(array) {
                onprogress && onprogress(index, size);
                var msg = 0 === index ? initialMessage : {
                  sn: sn
                };
                msg.type = "append", msg.data = array;
                try {
                  worker.postMessage(msg, [array.buffer])
                } catch (ex) {
                  worker.postMessage(msg)
                }
                chunkIndex++
              }, onreaderror) : worker.postMessage({
                sn: sn,
                type: "flush"
              })
            }
            var index, outputSize, crc, chunkIndex = 0,
              sn = initialMessage.sn;
            outputSize = 0, worker.addEventListener("message", onmessage, !1), step()
          }

          function launchProcess(process, reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror) {
            function step() {
              var outputData;
              if (index = chunkIndex * CHUNK_SIZE, index < size) reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(inputData) {
                var outputData;
                try {
                  outputData = process.append(inputData, function(loaded) {
                    onprogress && onprogress(index + loaded, size)
                  })
                } catch (e) {
                  return void onreaderror(e)
                }
                outputData ? (outputSize += outputData.length, writer.writeUint8Array(outputData, function() {
                  chunkIndex++, setTimeout(step, 1)
                }, onwriteerror), crcOutput && crc.append(outputData)) : (chunkIndex++, setTimeout(step, 1)), crcInput && crc.append(inputData), onprogress && onprogress(index, size)
              }, onreaderror);
              else {
                try {
                  outputData = process.flush()
                } catch (e) {
                  return void onreaderror(e)
                }
                outputData ? (crcOutput && crc.append(outputData), outputSize += outputData.length, writer.writeUint8Array(outputData, function() {
                  onend(outputSize, crc.get())
                }, onwriteerror)) : onend(outputSize, crc.get())
              }
            }
            var index, chunkIndex = 0,
              outputSize = 0,
              crcInput = "input" === crcType,
              crcOutput = "output" === crcType,
              crc = new Crc32;
            step()
          }

          function inflate(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
            var crcType = computeCrc32 ? "output" : "none";
            if (obj.zip.useWebWorkers) {
              var initialMessage = {
                sn: sn,
                codecClass: "Inflater",
                crcType: crcType
              };
              launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror)
            } else launchProcess(new obj.zip.Inflater, reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror)
          }

          function deflate(worker, sn, reader, writer, level, onend, onprogress, onreaderror, onwriteerror) {
            var crcType = "input";
            if (obj.zip.useWebWorkers) {
              var initialMessage = {
                sn: sn,
                options: {
                  level: level
                },
                codecClass: "Deflater",
                crcType: crcType
              };
              launchWorkerProcess(worker, initialMessage, reader, writer, 0, reader.size, onprogress, onend, onreaderror, onwriteerror)
            } else launchProcess(new obj.zip.Deflater, reader, writer, 0, reader.size, crcType, onprogress, onend, onreaderror, onwriteerror)
          }

          function copy(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
            var crcType = "input";
            if (obj.zip.useWebWorkers && computeCrc32) {
              var initialMessage = {
                sn: sn,
                codecClass: "NOOP",
                crcType: crcType
              };
              launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror)
            } else launchProcess(new NOOP, reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror)
          }

          function decodeASCII(str) {
            var i, charCode, out = "",
              extendedASCII = ["Ç", "ü", "é", "â", "ä", "à", "å", "ç", "ê", "ë", "è", "ï", "î", "ì", "Ä", "Å", "É", "æ", "Æ", "ô", "ö", "ò", "û", "ù", "ÿ", "Ö", "Ü", "ø", "£", "Ø", "×", "ƒ", "á", "í", "ó", "ú", "ñ", "Ñ", "ª", "º", "¿", "®", "¬", "½", "¼", "¡", "«", "»", "_", "_", "_", "¦", "¦", "Á", "Â", "À", "©", "¦", "¦", "+", "+", "¢", "¥", "+", "+", "-", "-", "+", "-", "+", "ã", "Ã", "+", "+", "-", "-", "¦", "-", "+", "¤", "ð", "Ð", "Ê", "Ë", "È", "i", "Í", "Î", "Ï", "+", "+", "_", "_", "¦", "Ì", "_", "Ó", "ß", "Ô", "Ò", "õ", "Õ", "µ", "þ", "Þ", "Ú", "Û", "Ù", "ý", "Ý", "¯", "´", "­", "±", "_", "¾", "¶", "§", "÷", "¸", "°", "¨", "·", "¹", "³", "²", "_", " "];
            for (i = 0; i < str.length; i++) charCode = 255 & str.charCodeAt(i), out += charCode > 127 ? extendedASCII[charCode - 128] : String.fromCharCode(charCode);
            return out
          }

          function decodeUTF8(string) {
            return decodeURIComponent(escape(string))
          }

          function getString(bytes) {
            var i, str = "";
            for (i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
            return str
          }

          function getDate(timeRaw) {
            var date = (4294901760 & timeRaw) >> 16,
              time = 65535 & timeRaw;
            try {
              return new Date(1980 + ((65024 & date) >> 9), ((480 & date) >> 5) - 1, 31 & date, (63488 & time) >> 11, (2016 & time) >> 5, 2 * (31 & time), 0)
            } catch (e) {}
          }

          function readCommonHeader(entry, data, index, centralDirectory, onerror) {
            return entry.version = data.view.getUint16(index, !0), entry.bitFlag = data.view.getUint16(index + 2, !0), entry.compressionMethod = data.view.getUint16(index + 4, !0), entry.lastModDateRaw = data.view.getUint32(index + 6, !0), entry.lastModDate = getDate(entry.lastModDateRaw), 1 === (1 & entry.bitFlag) ? void onerror(ERR_ENCRYPTED) : ((centralDirectory || 8 != (8 & entry.bitFlag)) && (entry.crc32 = data.view.getUint32(index + 10, !0), entry.compressedSize = data.view.getUint32(index + 14, !0), entry.uncompressedSize = data.view.getUint32(index + 18, !0)), 4294967295 === entry.compressedSize || 4294967295 === entry.uncompressedSize ? void onerror(ERR_ZIP64) : (entry.filenameLength = data.view.getUint16(index + 22, !0), void(entry.extraFieldLength = data.view.getUint16(index + 24, !0))))
          }

          function createZipReader(reader, callback, onerror) {
            function Entry() {}

            function seekEOCDR(eocdrCallback) {
              function doSeek(length, eocdrNotFoundCallback) {
                reader.readUint8Array(reader.size - length, length, function(bytes) {
                  for (var i = bytes.length - EOCDR_MIN; i >= 0; i--)
                    if (80 === bytes[i] && 75 === bytes[i + 1] && 5 === bytes[i + 2] && 6 === bytes[i + 3]) return void eocdrCallback(new DataView(bytes.buffer, i, EOCDR_MIN));
                  eocdrNotFoundCallback()
                }, function() {
                  onerror(ERR_READ)
                })
              }
              var EOCDR_MIN = 22;
              if (reader.size < EOCDR_MIN) return void onerror(ERR_BAD_FORMAT);
              var ZIP_COMMENT_MAX = 65536,
                EOCDR_MAX = EOCDR_MIN + ZIP_COMMENT_MAX;
              doSeek(EOCDR_MIN, function() {
                doSeek(Math.min(EOCDR_MAX, reader.size), function() {
                  onerror(ERR_BAD_FORMAT)
                })
              })
            }
            var inflateSN = 0;
            Entry.prototype.getData = function(writer, onend, onprogress, checkCrc32) {
              function testCrc32(crc32) {
                var dataCrc32 = getDataHelper(4);
                return dataCrc32.view.setUint32(0, crc32), that.crc32 == dataCrc32.view.getUint32(0)
              }

              function getWriterData(uncompressedSize, crc32) {
                checkCrc32 && !testCrc32(crc32) ? onerror(ERR_CRC) : writer.getData(function(data) {
                  onend(data)
                })
              }

              function onreaderror(err) {
                onerror(err || ERR_READ_DATA)
              }

              function onwriteerror(err) {
                onerror(err || ERR_WRITE_DATA)
              }
              var that = this;
              reader.readUint8Array(that.offset, 30, function(bytes) {
                var dataOffset, data = getDataHelper(bytes.length, bytes);
                return 1347093252 != data.view.getUint32(0) ? void onerror(ERR_BAD_FORMAT) : (readCommonHeader(that, data, 4, !1, onerror), dataOffset = that.offset + 30 + that.filenameLength + that.extraFieldLength, void writer.init(function() {
                  0 === that.compressionMethod ? copy(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror) : inflate(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror)
                }, onwriteerror))
              }, onreaderror)
            };
            var zipReader = {
              getEntries: function(callback) {
                var worker = this._worker;
                seekEOCDR(function(dataView) {
                  var datalength, fileslength;
                  return datalength = dataView.getUint32(16, !0), fileslength = dataView.getUint16(8, !0), datalength < 0 || datalength >= reader.size ? void onerror(ERR_BAD_FORMAT) : void reader.readUint8Array(datalength, reader.size - datalength, function(bytes) {
                    var i, entry, filename, comment, index = 0,
                      entries = [],
                      data = getDataHelper(bytes.length, bytes);
                    for (i = 0; i < fileslength; i++) {
                      if (entry = new Entry, entry._worker = worker, 1347092738 != data.view.getUint32(index)) return void onerror(ERR_BAD_FORMAT);
                      readCommonHeader(entry, data, index + 6, !0, onerror), entry.commentLength = data.view.getUint16(index + 32, !0), entry.directory = 16 == (16 & data.view.getUint8(index + 38)), entry.offset = data.view.getUint32(index + 42, !0), filename = getString(data.array.subarray(index + 46, index + 46 + entry.filenameLength)), entry.filename = 2048 === (2048 & entry.bitFlag) ? decodeUTF8(filename) : decodeASCII(filename), entry.directory || "/" != entry.filename.charAt(entry.filename.length - 1) || (entry.directory = !0), comment = getString(data.array.subarray(index + 46 + entry.filenameLength + entry.extraFieldLength, index + 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength)), entry.comment = 2048 === (2048 & entry.bitFlag) ? decodeUTF8(comment) : decodeASCII(comment), entries.push(entry), index += 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength
                    }
                    callback(entries)
                  }, function() {
                    onerror(ERR_READ)
                  })
                })
              },
              close: function(callback) {
                this._worker && (this._worker.terminate(), this._worker = null), callback && callback()
              },
              _worker: null
            };
            obj.zip.useWebWorkers ? createWorker("inflater", function(worker) {
              zipReader._worker = worker, callback(zipReader)
            }, function(err) {
              onerror(err)
            }) : callback(zipReader)
          }

          function encodeUTF8(string) {
            return unescape(encodeURIComponent(string))
          }

          function getBytes(str) {
            var i, array = [];
            for (i = 0; i < str.length; i++) array.push(str.charCodeAt(i));
            return array
          }

          function createZipWriter(writer, callback, onerror, dontDeflate) {
            function onwriteerror(err) {
              onerror(err || ERR_WRITE)
            }

            function onreaderror(err) {
              onerror(err || ERR_READ_DATA)
            }
            var files = {},
              filenames = [],
              datalength = 0,
              deflateSN = 0,
              zipWriter = {
                add: function(name, reader, onend, onprogress, options) {
                  function writeHeader(callback) {
                    var data;
                    date = options.lastModDate || new Date, header = getDataHelper(26), files[name] = {
                      headerArray: header.array,
                      directory: options.directory,
                      filename: filename,
                      offset: datalength,
                      comment: getBytes(encodeUTF8(options.comment || ""))
                    }, header.view.setUint32(0, 335546376), options.version && header.view.setUint8(0, options.version), dontDeflate || 0 === options.level || options.directory || header.view.setUint16(4, 2048), header.view.setUint16(6, (date.getHours() << 6 | date.getMinutes()) << 5 | date.getSeconds() / 2, !0), header.view.setUint16(8, (date.getFullYear() - 1980 << 4 | date.getMonth() + 1) << 5 | date.getDate(), !0), header.view.setUint16(22, filename.length, !0), data = getDataHelper(30 + filename.length), data.view.setUint32(0, 1347093252), data.array.set(header.array, 4), data.array.set(filename, 30), datalength += data.array.length, writer.writeUint8Array(data.array, callback, onwriteerror)
                  }

                  function writeFooter(compressedLength, crc32) {
                    var footer = getDataHelper(16);
                    datalength += compressedLength || 0, footer.view.setUint32(0, 1347094280), "undefined" != typeof crc32 && (header.view.setUint32(10, crc32, !0), footer.view.setUint32(4, crc32, !0)), reader && (footer.view.setUint32(8, compressedLength, !0), header.view.setUint32(14, compressedLength, !0), footer.view.setUint32(12, reader.size, !0), header.view.setUint32(18, reader.size, !0)), writer.writeUint8Array(footer.array, function() {
                      datalength += 16, onend()
                    }, onwriteerror)
                  }

                  function writeFile() {
                    return options = options || {}, name = name.trim(), options.directory && "/" != name.charAt(name.length - 1) && (name += "/"), files.hasOwnProperty(name) ? void onerror(ERR_DUPLICATED_NAME) : (filename = getBytes(encodeUTF8(name)), filenames.push(name), void writeHeader(function() {
                      reader ? dontDeflate || 0 === options.level ? copy(worker, deflateSN++, reader, writer, 0, reader.size, !0, writeFooter, onprogress, onreaderror, onwriteerror) : deflate(worker, deflateSN++, reader, writer, options.level, writeFooter, onprogress, onreaderror, onwriteerror) : writeFooter()
                    }, onwriteerror))
                  }
                  var header, filename, date, worker = this._worker;
                  reader ? reader.init(writeFile, onreaderror) : writeFile()
                },
                close: function(callback) {
                  this._worker && (this._worker.terminate(), this._worker = null);
                  var data, indexFilename, file, length = 0,
                    index = 0;
                  for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) file = files[filenames[indexFilename]], length += 46 + file.filename.length + file.comment.length;
                  for (data = getDataHelper(length + 22), indexFilename = 0; indexFilename < filenames.length; indexFilename++) file = files[filenames[indexFilename]], data.view.setUint32(index, 1347092738), data.view.setUint16(index + 4, 5120), data.array.set(file.headerArray, index + 6), data.view.setUint16(index + 32, file.comment.length, !0), file.directory && data.view.setUint8(index + 38, 16), data.view.setUint32(index + 42, file.offset, !0), data.array.set(file.filename, index + 46), data.array.set(file.comment, index + 46 + file.filename.length), index += 46 + file.filename.length + file.comment.length;
                  data.view.setUint32(index, 1347093766), data.view.setUint16(index + 8, filenames.length, !0), data.view.setUint16(index + 10, filenames.length, !0), data.view.setUint32(index + 12, length, !0), data.view.setUint32(index + 16, datalength, !0), writer.writeUint8Array(data.array, function() {
                    writer.getData(callback)
                  }, onwriteerror)
                },
                _worker: null
              };
            obj.zip.useWebWorkers ? createWorker("deflater", function(worker) {
              zipWriter._worker = worker, callback(zipWriter)
            }, function(err) {
              onerror(err)
            }) : callback(zipWriter)
          }

          function resolveURLs(urls) {
            var a = document.createElement("a");
            return urls.map(function(url) {
              return a.href = url, a.href
            })
          }

          function createWorker(type, callback, onerror) {
            function onmessage(ev) {
              var msg = ev.data;
              return msg.error ? (worker.terminate(), void onerror(msg.error)) : void("importScripts" === msg.type && (worker.removeEventListener("message", onmessage), worker.removeEventListener("error", errorHandler), callback(worker)))
            }

            function errorHandler(err) {
              worker.terminate(), onerror(err)
            }
            if (null !== obj.zip.workerScripts && null !== obj.zip.workerScriptsPath) return void onerror(new Error("Either zip.workerScripts or zip.workerScriptsPath may be set, not both."));
            var scripts;
            if (obj.zip.workerScripts) {
              if (scripts = obj.zip.workerScripts[type], !Array.isArray(scripts)) return void onerror(new Error("zip.workerScripts." + type + " is not an array!"));
              scripts = resolveURLs(scripts)
            } else scripts = DEFAULT_WORKER_SCRIPTS[type].slice(0), scripts[0] = (obj.zip.workerScriptsPath || "") + scripts[0];
            var worker = new Worker(scripts[0]);
            worker.codecTime = worker.crcTime = 0, worker.postMessage({
              type: "importScripts",
              scripts: scripts.slice(1)
            }), worker.addEventListener("message", onmessage), worker.addEventListener("error", errorHandler)
          }

          function onerror_default(error) {
            console.error(error)
          }
          var appendABViewSupported, ERR_BAD_FORMAT = "File format is not recognized.",
            ERR_CRC = "CRC failed.",
            ERR_ENCRYPTED = "File contains encrypted entry.",
            ERR_ZIP64 = "File is using Zip64 (4gb+ file size).",
            ERR_READ = "Error while reading zip file.",
            ERR_WRITE = "Error while writing zip file.",
            ERR_WRITE_DATA = "Error while writing file data.",
            ERR_READ_DATA = "Error while reading file data.",
            ERR_DUPLICATED_NAME = "File already exists.",
            CHUNK_SIZE = 524288,
            TEXT_PLAIN = "text/plain";
          try {
            appendABViewSupported = 0 === new Blob([new DataView(new ArrayBuffer(0))]).size
          } catch (e) {}
          Crc32.prototype.append = function(data) {
            for (var crc = 0 | this.crc, table = this.table, offset = 0, len = 0 | data.length; offset < len; offset++) crc = crc >>> 8 ^ table[255 & (crc ^ data[offset])];
            this.crc = crc
          }, Crc32.prototype.get = function() {
            return ~this.crc
          }, Crc32.prototype.table = function() {
            var i, j, t, table = [];
            for (i = 0; i < 256; i++) {
              for (t = i, j = 0; j < 8; j++) 1 & t ? t = t >>> 1 ^ 3988292384 : t >>>= 1;
              table[i] = t
            }
            return table
          }(), NOOP.prototype.append = function(bytes, onprogress) {
            return bytes
          }, NOOP.prototype.flush = function() {}, TextReader.prototype = new Reader, TextReader.prototype.constructor = TextReader, Data64URIReader.prototype = new Reader, Data64URIReader.prototype.constructor = Data64URIReader, BlobReader.prototype = new Reader, BlobReader.prototype.constructor = BlobReader, Writer.prototype.getData = function(callback) {
            callback(this.data)
          }, TextWriter.prototype = new Writer, TextWriter.prototype.constructor = TextWriter, Data64URIWriter.prototype = new Writer, Data64URIWriter.prototype.constructor = Data64URIWriter, BlobWriter.prototype = new Writer, BlobWriter.prototype.constructor = BlobWriter;
          var DEFAULT_WORKER_SCRIPTS = {
            deflater: ["z-worker.js", "deflate.js"],
            inflater: ["z-worker.js", "inflate.js"]
          };
          obj.zip = {
            Reader: Reader,
            Writer: Writer,
            BlobReader: BlobReader,
            Data64URIReader: Data64URIReader,
            TextReader: TextReader,
            BlobWriter: BlobWriter,
            Data64URIWriter: Data64URIWriter,
            TextWriter: TextWriter,
            createReader: function(reader, callback, onerror) {
              onerror = onerror || onerror_default, reader.init(function() {
                createZipReader(reader, callback, onerror)
              }, onerror)
            },
            createWriter: function(writer, callback, onerror, dontDeflate) {
              onerror = onerror || onerror_default, dontDeflate = !!dontDeflate, writer.init(function() {
                createZipWriter(writer, callback, onerror, dontDeflate)
              }, onerror)
            },
            useWebWorkers: !0,
            workerScriptsPath: null,
            workerScripts: null
          }
        }(this), browserify_shim__define__module__export__("undefined" != typeof zip ? zip : window.zip)
      }).call(global, void 0, void 0, void 0, void 0, function(ex) {
        module.exports = ex
      })
    }).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {})
  }, {}]
}, {}, [1]);