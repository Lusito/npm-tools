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
    searchField?: HTMLInputElement;

    searchItems?: HTMLElement | null;

    overlayVisibleClass?: string;

    data?: SearchEntry[];

    connectedCallback() {
        const searchItemsClass = this.getAttribute("searchItems");
        this.searchItems = this.querySelector(searchItemsClass ? `.${searchItemsClass}` : "ul");
        const searchDataUrl = this.getAttribute("searchData") ?? "";
        const searchFieldId = this.getAttribute("searchField") ?? "";
        this.overlayVisibleClass = this.getAttribute("overlayVisible") ?? "";
        const searchField = document.querySelector(`#${searchFieldId}`);
        if (this.searchItems && searchDataUrl && searchField instanceof HTMLInputElement) {
            this.searchField = searchField;
            searchField.addEventListener("input", this.onInput);
            this.searchField.value = "";

            searchField.addEventListener("focus", () => {
                if (!this.data) {
                    this.fetchData(searchDataUrl);
                }
            });
        }

        document.addEventListener("click", this.onClick);
    }

    disconnectedCallback() {
        this.searchField?.removeEventListener("input", this.onInput);
        document.removeEventListener("click", this.onClick);
    }

    private async fetchData(url: string) {
        try {
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
        if (this.searchItems && this.searchField && this.data && this.overlayVisibleClass) {
            const terms = this.searchField.value
                .toLocaleLowerCase()
                .split(" ")
                .filter((v) => v.trim());

            this.searchItems.innerHTML = "";
            if (!terms.length) {
                this.classList.remove(this.overlayVisibleClass);
                return;
            }

            this.classList.add(this.overlayVisibleClass);
            for (const entry of this.data) {
                const title = entry.title.toLowerCase();
                const text = entry.content.toLowerCase();
                if (
                    (text && terms.every((term) => text.includes(term))) ||
                    (title && terms.every((term) => title.includes(term)))
                ) {
                    const li = document.createElement("li");
                    this.searchItems.appendChild(li);

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

    private onClick = ({ target }: MouseEvent) => {
        if (this.searchField && target instanceof Element) {
            // Hide if clicked on a link or if clicked outside of searchfield and overlay
            if (target.closest("a") || !target.closest(`#${this.searchField?.id},.${this.overlayVisibleClass}`)) {
                this.searchField.value = "";
                this.updateSearchResult();
            }
        }
    };
}

customElements.define("search-container", SearchContainer);

export type SearchContainerProps = {
    searchField: string;
    searchData: string;
    searchItems: string;
    overlayVisible: string;
};
