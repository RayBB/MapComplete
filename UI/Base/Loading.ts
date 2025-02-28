import {Translation} from "../i18n/Translation";
import Combine from "./Combine";
import Svg from "../../Svg";
import Translations from "../i18n/Translations";

export default class Loading extends Combine {
    constructor(msg?: Translation | string) {
        const t = Translations.T(msg) ?? Translations.t.general.loading.Clone();
        t.SetClass("pl-2")
        super([
            Svg.loading_svg().SetClass("animate-spin").SetStyle("width: 1.5rem; height: 1.5rem;"),
            t
        ])
        this.SetClass("flex p-1")
    }
}