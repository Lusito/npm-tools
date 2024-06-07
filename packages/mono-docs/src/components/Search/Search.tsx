import { withCss } from "../../utils/withCss";
import classes from "./Search.module.scss";

export const Search = withCss(classes, function Search() {
    return (
        <search-container
            class={classes.searchContainer}
            searchButton={classes.searchButton}
            searchField={classes.searchField}
            searchData={`${this.targetUrl}/search-data.json`}
            searchItems={classes.searchItems}
            overlay={classes.searchOverlay}
            overlayVisible={classes.searchOverlayVisible}
        >
            <button class={classes.searchButton} title="Search" aria-label="Search" />
            <div class={classes.searchOverlay}>
                <label class={classes.searchFieldWrapper}>
                    <span>Search: </span>
                    <input type="search" autofocus class={classes.searchField} />
                </label>
                <h2>Search results:</h2>
                <ul class={classes.searchItems}></ul>
            </div>
        </search-container>
    );
});
