import { SearchEntry } from "../../utils/types";

function debounce(func: () => void, timeout = 300) {
    let timer: ReturnType<typeof setTimeout>;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(func, timeout);
    };
}

function createLink(url: string, text: string) {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = text;

    return link;
}

class SearchContainer extends HTMLElement {
    data?: SearchEntry[];

    private getAttributeChecked(key: keyof SearchContainerProps) {
        const value = this.getAttribute(key);
        if (value === null) throw new Error(`Missing attribute ${key} on SearchContainer`);

        return value;
    }

    private getElementByAttribute(key: keyof SearchContainerProps) {
        const clazz = this.getAttributeChecked(key);
        const element = this.querySelector(`.${clazz}`);
        if (element === null) throw new Error(`Element .${clazz} not found within SearchContainer`);
        return element;
    }

    connectedCallback() {
        const searchField = this.getElementByAttribute("searchField") as HTMLInputElement;
        searchField.addEventListener("input", this.onInput);

        const searchButton = this.getElementByAttribute("searchButton");
        const overlay = this.getElementByAttribute("overlay");
        const overlayVisibleClass = this.getAttributeChecked("overlayVisible");
        const searchItems = this.getElementByAttribute("searchItems");
        searchButton.addEventListener("click", () => {
            searchField.value = "";
            searchItems.innerHTML = "";
            overlay.classList.toggle(overlayVisibleClass);
            if (overlay.classList.contains(overlayVisibleClass)) {
                searchField.focus();
            }
            if (!this.data) {
                this.fetchData();
            }
        });

        document.addEventListener("click", this.onDocumentClick);
    }

    disconnectedCallback() {
        const searchField = this.getElementByAttribute("searchField") as HTMLInputElement;
        searchField.removeEventListener("input", this.onInput);
        document.removeEventListener("click", this.onDocumentClick);
    }

    private async fetchData() {
        try {
            const url = this.getAttributeChecked("searchData");
            const req = await fetch(url);
            if (!req.ok) {
                throw new Error("Failed getting search data");
            }
            this.data = await req.json();
            this.updateSearchResult();
        } catch (e) {
            console.error(e);
        }
    }

    private updateSearchResult() {
        if (this.data) {
            const searchField = this.getElementByAttribute("searchField") as HTMLInputElement;
            const searchItems = this.getElementByAttribute("searchItems");
            const terms = searchField.value
                .toLocaleLowerCase()
                .split(" ")
                .filter((v) => v.trim());

            searchItems.innerHTML = "";
            if (!terms.length) {
                return;
            }

            for (const entry of this.data) {
                const title = entry.title.toLowerCase();
                const text = entry.content.toLowerCase();
                if (
                    (text && terms.every((term) => text.includes(term))) ||
                    (title && terms.every((term) => title.includes(term)))
                ) {
                    const li = document.createElement("li");
                    searchItems.appendChild(li);

                    if (entry.projectIndex && entry.projectIndex.url !== entry.url) {
                        li.appendChild(createLink(entry.projectIndex.url, entry.projectIndex.title));
                        li.appendChild(document.createTextNode(" / "));
                    }

                    li.appendChild(createLink(entry.url, entry.title));
                }
            }
        }
    }

    private onInput = debounce(() => this.updateSearchResult());

    private onDocumentClick = ({ target }: MouseEvent) => {
        const overlayVisibleClass = this.getAttributeChecked("overlayVisible");
        // Hide if clicked on a link or if clicked outside of search-container
        if (target instanceof Element && (target.closest("a") || !target.closest("search-container"))) {
            this.getElementByAttribute("overlay").classList.toggle(overlayVisibleClass, false);
        }
    };
}

customElements.define("search-container", SearchContainer);

export type SearchContainerProps = {
    searchButton: string;
    searchField: string;
    searchData: string;
    searchItems: string;
    overlay: string;
    overlayVisible: string;
};
