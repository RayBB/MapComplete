import {InputElement} from "./InputElement";
import {UIEventSource} from "../../Logic/UIEventSource";
import BaseUIElement from "../BaseUIElement";
import {VariableUiElement} from "../Base/VariableUIElement";

export default class VariableInputElement<T> extends InputElement<T> {

    public readonly IsSelected: UIEventSource<boolean>;
    private readonly value: UIEventSource<T>;
    private readonly element: BaseUIElement
    private readonly upstream: UIEventSource<InputElement<T>>;

    constructor(upstream: UIEventSource<InputElement<T>>) {

        super()
        this.upstream = upstream;
        this.value = upstream.bind(v => v.GetValue())
        this.element = new VariableUiElement(upstream)
        this.IsSelected = upstream.bind(v => v.IsSelected)
    }

    GetValue(): UIEventSource<T> {
        return this.value;
    }

    IsValid(t: T): boolean {
        return this.upstream.data.IsValid(t);
    }

    protected InnerConstructElement(): HTMLElement {
        return this.element.ConstructElement();
    }

}