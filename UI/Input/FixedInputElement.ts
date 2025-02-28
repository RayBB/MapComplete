import {InputElement} from "./InputElement";
import {UIEventSource} from "../../Logic/UIEventSource";
import Translations from "../i18n/Translations";
import BaseUIElement from "../BaseUIElement";

export class FixedInputElement<T> extends InputElement<T> {
    public readonly IsSelected: UIEventSource<boolean> = new UIEventSource<boolean>(false);
    private readonly value: UIEventSource<T>;
    private readonly _comparator: (t0: T, t1: T) => boolean;

    private readonly _el: HTMLElement;

    constructor(rendering: BaseUIElement | string,
                value: T | UIEventSource<T>,
                comparator: ((t0: T, t1: T) => boolean) = undefined) {
        super();
        this._comparator = comparator ?? ((t0, t1) => t0 == t1);
        if (value instanceof UIEventSource) {
            this.value = value
        } else {
            this.value = new UIEventSource<T>(value);
        }

        const selected = this.IsSelected;
        this._el = document.createElement("span")
        this._el.addEventListener("mouseout", () => selected.setData(false))
        const e = Translations.W(rendering)?.ConstructElement()
        if (e) {
            this._el.appendChild(e)
        }

        this.onClick(() => {
            selected.setData(true)
        })
    }

    GetValue(): UIEventSource<T> {
        return this.value;
    }

    IsValid(t: T): boolean {
        return this._comparator(t, this.value.data);
    }

    protected InnerConstructElement(): HTMLElement {
        return this._el;
    }
}
