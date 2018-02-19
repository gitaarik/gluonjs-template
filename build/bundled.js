var gluon_js = GluonJS;
(function (gluon_js) {
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(['<div>GluonJS is working!</div>'], ['<div>GluonJS is working!</div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GluonjsTemplate = function (_GluonElement) {
  _inherits(GluonjsTemplate, _GluonElement);

  function GluonjsTemplate() {
    _classCallCheck(this, GluonjsTemplate);

    return _possibleConstructorReturn(this, (GluonjsTemplate.__proto__ || Object.getPrototypeOf(GluonjsTemplate)).apply(this, arguments));
  }

  _createClass(GluonjsTemplate, [{
    key: 'template',
    get: function get() {
      return gluon_js.html(_templateObject);
    }
  }]);

  return GluonjsTemplate;
}(gluon_js.GluonElement);

customElements.define(GluonjsTemplate.is, GluonjsTemplate);

}(gluon_js));
