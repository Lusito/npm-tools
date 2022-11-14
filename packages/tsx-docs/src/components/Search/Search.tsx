import { withCss } from "../../utils/withCss";
import classes from "./Search.module.scss";

export const Search = withCss(classes, function Search() {
    return (
        <>
            <input class={classes.search} type="search" placeholder="Search..." id="search-field" />
            <search-container
                class={classes.searchOverlay}
                searchField="search-field"
                searchData={`${this.currentPage.frontMatter.siteUrl}/search-data.json`}
                searchItems={classes.searchItems}
                overlayVisible={classes.searchOverlayVisible}
            >
                <h2>Search results:</h2>
                <ul class={classes.searchItems}></ul>
            </search-container>
        </>
    );
});
