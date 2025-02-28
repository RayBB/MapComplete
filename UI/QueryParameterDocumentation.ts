import BaseUIElement from "./BaseUIElement";
import Combine from "./Base/Combine";
import Title from "./Base/Title";
import List from "./Base/List";
import Translations from "./i18n/Translations";
import {QueryParameters} from "../Logic/Web/QueryParameters";

export default class QueryParameterDocumentation {

    private static QueryParamDocsIntro = ([
        new Title("URL-parameters and URL-hash", 1),
        "This document gives an overview of which URL-parameters can be used to influence MapComplete.",
        new Title("What is a URL parameter?", 2),
        "\"URL-parameters are extra parts of the URL used to set the state.",
        "For example, if the url is `https://mapcomplete.osm.be/cyclofix?lat=51.0&lon=4.3&z=5&test=true#node/1234`, " +
        "the URL-parameters are stated in the part between the `?` and the `#`. There are multiple, all separated by `&`, namely: ",
        new List([
                "The url-parameter `lat` is `51.0` in this instance",
                "The url-parameter `lon` is `4.3` in this instance",
                "The url-parameter `z` is `5` in this instance",
                "The url-parameter `test` is `true` in this instance"
            ].map(s => Translations.W(s))
        ),
        "Finally, the URL-hash is the part after the `#`. It is `node/1234` in this case."
    ])
    
    public static GenerateQueryParameterDocs(): BaseUIElement {
        const docs : (string | BaseUIElement)[] = [...QueryParameterDocumentation.QueryParamDocsIntro];
        for (const key in QueryParameters.documentation) {
            const c = new Combine([
                new Title(key, 2),
                QueryParameters.documentation[key],
                QueryParameters.defaults[key] === undefined ? "No default value set" : `The default value is _${QueryParameters.defaults[key]}_`

            ])
            docs.push(c)
        }
        return new Combine(docs).SetClass("flex flex-col")
    }
}