class CodeCopyButton extends HTMLElement {
    connectedCallback() {
        this.setAttribute("tabindex", "0");
        this.className = this.getAttribute("enhancedClass") ?? "";
        this.addEventListener("click", this.onClick);
    }

    disconnectedCallback() {
        this.removeAttribute("tabindex");
        this.removeEventListener("click", this.onClick);
    }

    private onClick = () => {
        const code = this.getAttribute("code");
        if (code) {
            navigator.clipboard.writeText(code);
        }
    };
}

customElements.define("code-copy-button", CodeCopyButton);

export type CodeCopyButtonProps = {
    enhancedClass: string;
};
