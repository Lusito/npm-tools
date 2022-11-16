import { ComponentThis } from "tsx-dom-ssr";

import { Container } from "../components/Container/Container";
import { MarkdownContent } from "../components/MarkdownContent/MarkdownContent";
import { DefaultLayout } from "../layouts/DefaultLayout";

export function MarkdownPage(this: ComponentThis) {
    return (
        <DefaultLayout>
            <article>
                <Container>
                    <MarkdownContent html={this.currentPage.body} />
                </Container>
            </article>
        </DefaultLayout>
    );
}
