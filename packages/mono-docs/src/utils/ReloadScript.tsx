import { ComponentThis } from "tsx-dom-ssr";

function initSSE() {
    let delay = 500;
    let lastId = "";
    function connect() {
        const evtSource = new EventSource("/hot-sse");
        evtSource.onmessage = (event) => {
            if (lastId && lastId !== event.data) {
                window.location.reload();
            }
            lastId = event.data;
        };
        evtSource.onerror = () => {
            evtSource.close();
            setTimeout(connect, delay);
            if (delay < 3000) {
                delay *= 2;
            }
        };
    }
    connect();
}

export function ReloadScript(this: ComponentThis) {
    return this.devMode ? <script dangerouslySetInnerHTML={`(${initSSE})()`} /> : null;
}
