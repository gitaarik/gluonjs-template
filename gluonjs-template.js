import { GluonElement, html } from './node_modules/gluonjs/gluon.js';

class GluonjsTemplate extends GluonElement {

  set loading(value) {
    this._loading = value;
    this.render();
  }

  get loading() {
    return this._loading;
  }

  get template() {

    console.log('rendering with loading: ', this.loading);

    return html`
      <div>

        <my-button on-click=${this.switchLoading.bind(this)} loading?=${this.loading}>
          click me
        </my-button>

        <my-button on-click=${this.switchLoading.bind(this)} loading?=${!this.loading}>
          click me
        </my-button>

      </div>
    `;

  }

  switchLoading() {
    this.loading = !this.loading;
  }

}

customElements.define(GluonjsTemplate.is, GluonjsTemplate);


class MyButton extends GluonElement {

  get template() {

    console.log('loading attribute: ', this.hasAttribute('loading'));

    return html`
      <div>
        <slot></slot>
        (loading: ${this.hasAttribute('loading') ? 'yes' : 'no'})
      </div>
    `;

  }

}

customElements.define(MyButton.is, MyButton);
