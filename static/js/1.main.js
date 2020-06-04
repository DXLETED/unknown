(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[1],{

/***/ "./src/components/cookies.js":
/*!***********************************!*\
  !*** ./src/components/cookies.js ***!
  \***********************************/
/*! exports provided: default, CookieManager */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CookieManager", function() { return CookieManager; });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_redux__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-redux */ "./node_modules/react-redux/es/index.js");
/* harmony import */ var react_cookie__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-cookie */ "./node_modules/react-cookie/es6/index.js");
/* harmony import */ var react_cookies__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-cookies */ "./node_modules/react-cookies/build/cookie.js");
/* harmony import */ var react_cookies__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_cookies__WEBPACK_IMPORTED_MODULE_3__);
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





var defaultCookies = {
  settings: {
    colored_ranks: false
  }
};
var maxAge = 5184000;
/* harmony default export */ __webpack_exports__["default"] = (function (store, cookiesSync) {
  cookiesSync.map(function (el) {
    store.dispatch({
      type: 'SET',
      data: _defineProperty({}, el, react_cookies__WEBPACK_IMPORTED_MODULE_3___default.a.load(el))
    });
    store.subscribe(function () {
      react_cookies__WEBPACK_IMPORTED_MODULE_3___default.a.save(el, store.getState()[el], {
        path: '/',
        maxAge: maxAge
      });
    });
  });
});
var CookieManager = function CookieManager() {
  var _useCookies = Object(react_cookie__WEBPACK_IMPORTED_MODULE_2__["useCookies"])(['settings']),
      _useCookies2 = _slicedToArray(_useCookies, 2),
      cookies = _useCookies2[0],
      setCookie = _useCookies2[1];

  var store = Object(react_redux__WEBPACK_IMPORTED_MODULE_1__["useSelector"])(function (state) {
    return state;
  });
  var dispatch = Object(react_redux__WEBPACK_IMPORTED_MODULE_1__["useDispatch"])();
  var cookiesOptions = {
    path: '/',
    maxAge: 2419200
  };
  Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(function () {
    console.log(cookies);

    for (var name in defaultCookies) {
      if (_typeof(cookies[name]) === 'object') {
        for (var el in defaultCookies[name]) {
          if (!(el in cookies[name])) {
            setCookie(name, _objectSpread({}, cookies[name], _defineProperty({}, el, defaultCookies[name][el])), cookiesOptions);
          }
        }

        for (var _el in cookies[name]) {
          if (!(_el in defaultCookies[name])) {
            setCookie(name, _objectSpread({}, cookies[name], _defineProperty({}, _el, undefined)), cookiesOptions);
          }
        }
      } else {
        setCookie(name, defaultCookies[name], cookiesOptions);
      }
    }

    dispatch({
      type: 'UPDATE_SETTINGS',
      data: cookies.settings
    });
  }, []);
  Object(react__WEBPACK_IMPORTED_MODULE_0__["useEffect"])(function () {
    setCookie('settings', store.settings, cookiesOptions);
  }, [store.settings]);
  return null;
};

/***/ })

}]);
//# sourceMappingURL=1.main.js.map