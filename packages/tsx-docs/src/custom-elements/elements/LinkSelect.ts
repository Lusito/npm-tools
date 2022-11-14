import { BaseProps } from "tsx-dom-ssr";

import { scatman } from "../scatman";

class LinkSelect extends HTMLSelectElement {
    onChangeHandler = () => {
        if (this.value) {
            scatman.goTo(this.value);
        }
    };

    connectedCallback() {
        this.addEventListener("change", this.onChangeHandler);
    }

    disconnectedCallback() {
        this.removeEventListener("change", this.onChangeHandler);
    }
}

customElements.define("link-select", LinkSelect, { extends: "select" });

export type LinkSelectProps = BaseProps;
