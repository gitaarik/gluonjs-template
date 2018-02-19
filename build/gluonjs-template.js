import { GluonElement, html } from '../node_modules/gluonjs/gluon.js';

class GluonjsTemplate extends GluonElement {
  get template() {
    return html`<div>GluonJS is working!</div>`;
  }
  static get is() {
    return 'gluonjs-template';
  }
}

customElements.define(GluonjsTemplate.is, GluonjsTemplate);

export { GluonjsTemplate };
