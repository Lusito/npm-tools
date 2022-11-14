import { Window } from "happy-dom";

const window = new Window();
export const fakeDocument = window.document as unknown as Document;

export const createElement = fakeDocument.createElement.bind(fakeDocument);
