import { ComponentThis } from "tsx-dom-ssr";

import { Container } from "../components/Container/Container";
import { DefaultLayout } from "../layouts/DefaultLayout";

export function ListAllPage(this: ComponentThis) {
    const { targetUrl } = this;

    return (
        <DefaultLayout>
            <article>
                <Container>
                    <ul>
                        {this.pages.map((page) => (
                            <li>
                                <a href={`${targetUrl}${page.path}`}>{page.path}</a>
                            </li>
                        ))}
                    </ul>
                </Container>
            </article>
        </DefaultLayout>
    );
}
