import { Container } from "../components/Container/Container";
import { DefaultLayout } from "../layouts/DefaultLayout";

export const NotFoundPage = () => (
    <DefaultLayout>
        <article>
            <Container>
                <p>Could not find the file you were looking for!</p>
            </Container>
        </article>
    </DefaultLayout>
);
