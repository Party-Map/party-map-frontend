// Whether the page was reached without following a link: through the history (Back, Forward, a reload) or as the
// document's first page. A page that came with such a navigation republishes what its URL says (a query, a focus)
// quietly, so the map keeps the view and card the user had; a link (push or replace) is the user's intent.
import { NavigationType, useNavigationType } from "react-router";

export function useFromHistory(): boolean {
    return useNavigationType() === NavigationType.Pop;
}
