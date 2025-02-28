import {Translation} from "../../UI/i18n/Translation";
import SourceConfig from "./SourceConfig";
import TagRenderingConfig from "./TagRenderingConfig";
import PresetConfig, {PreciseInput} from "./PresetConfig";
import {LayerConfigJson} from "./Json/LayerConfigJson";
import Translations from "../../UI/i18n/Translations";
import {TagUtils} from "../../Logic/Tags/TagUtils";
import FilterConfig from "./FilterConfig";
import {Unit} from "../Unit";
import DeleteConfig from "./DeleteConfig";
import MoveConfig from "./MoveConfig";
import PointRenderingConfig from "./PointRenderingConfig";
import WithContextLoader from "./WithContextLoader";
import LineRenderingConfig from "./LineRenderingConfig";
import PointRenderingConfigJson from "./Json/PointRenderingConfigJson";
import LineRenderingConfigJson from "./Json/LineRenderingConfigJson";
import {TagRenderingConfigJson} from "./Json/TagRenderingConfigJson";
import {UIEventSource} from "../../Logic/UIEventSource";
import BaseUIElement from "../../UI/BaseUIElement";
import Combine from "../../UI/Base/Combine";
import Title from "../../UI/Base/Title";
import List from "../../UI/Base/List";
import Link from "../../UI/Base/Link";
import {Utils} from "../../Utils";

export default class LayerConfig extends WithContextLoader {

    public readonly id: string;
    public readonly name: Translation;
    public readonly description: Translation;
    public readonly source: SourceConfig;
    public readonly calculatedTags: [string, string, boolean][];
    public readonly doNotDownload: boolean;
    public readonly  passAllFeatures: boolean;
    public readonly isShown: TagRenderingConfig;
    public minzoom: number;
    public minzoomVisible: number;
    public readonly  maxzoom: number;
    public readonly title?: TagRenderingConfig;
    public readonly titleIcons: TagRenderingConfig[];

    public readonly mapRendering: PointRenderingConfig[]
    public readonly lineRendering: LineRenderingConfig[]

    public readonly units: Unit[];
    public readonly deletion: DeleteConfig | null;
    public readonly allowMove: MoveConfig | null
    public readonly allowSplit: boolean
    public readonly shownByDefault: boolean;
    /**
     * In seconds
     */
    public readonly maxAgeOfCache: number

    public readonly presets: PresetConfig[];

    public readonly tagRenderings: TagRenderingConfig[];
    public readonly filters: FilterConfig[];

    constructor(
        json: LayerConfigJson,
        context?: string,
        official: boolean = true
    ) {
        context = context + "." + json.id;
        super(json, context)
        this.id = json.id;

        if (json.source === undefined) {
            throw "Layer " + this.id + " does not define a source section (" + context + ")"
        }

        if (json.source.osmTags === undefined) {
            throw "Layer " + this.id + " does not define a osmTags in the source section - these should always be present, even for geojson layers (" + context + ")"
        }

        if(json.id.toLowerCase() !== json.id){
            throw `${context}: The id of a layer should be lowercase: ${json.id}`
        }
        if(json.id.match(/[a-z0-9-_]/) == null){
            throw `${context}: The id of a layer should match [a-z0-9-_]*: ${json.id}`
        }

        this.maxAgeOfCache = json.source.maxCacheAge ?? 24 * 60 * 60 * 30

        const osmTags = TagUtils.Tag(
            json.source.osmTags,
            context + "source.osmTags"
        );

        if (json.source["geoJsonSource"] !== undefined) {
            throw context + "Use 'geoJson' instead of 'geoJsonSource'";
        }

        if (json.source["geojson"] !== undefined) {
            throw context + "Use 'geoJson' instead of 'geojson' (the J is a capital letter)";
        }

        this.source = new SourceConfig(
            {
                osmTags: osmTags,
                geojsonSource: json.source["geoJson"],
                geojsonSourceLevel: json.source["geoJsonZoomLevel"],
                overpassScript: json.source["overpassScript"],
                isOsmCache: json.source["isOsmCache"],
                mercatorCrs: json.source["mercatorCrs"]
            },
            json.id
        );


        this.allowSplit = json.allowSplit ?? false;
        this.name = Translations.T(json.name, context + ".name");
        this.units = (json.units ?? []).map(((unitJson, i) => Unit.fromJson(unitJson, `${context}.unit[${i}]`)))

        if (json.description !== undefined) {
            if (Object.keys(json.description).length === 0) {
                json.description = undefined;
            }
        }

        this.description = Translations.T(
            json.description,
            context + ".description"
        );


        this.calculatedTags = undefined;
        if (json.calculatedTags !== undefined) {
            if (!official) {
                console.warn(
                    `Unofficial theme ${this.id} with custom javascript! This is a security risk`
                );
            }
            this.calculatedTags = [];
            for (const kv of json.calculatedTags) {
                const index = kv.indexOf("=");
                let key = kv.substring(0, index);
                const isStrict = key.endsWith(':')
                if(isStrict){
                    key = key.substr(0, key.length - 1)
                }
                const code = kv.substring(index + 1);

                try {
                    new Function("feat", "return " + code + ";");
                } catch (e) {
                    throw `Invalid function definition: code ${code} is invalid:${e} (at ${context})`
                }


                this.calculatedTags.push([key, code, isStrict]);
            }
        }

        this.doNotDownload = json.doNotDownload ?? false;
        this.passAllFeatures = json.passAllFeatures ?? false;
        this.minzoom = json.minzoom ?? 0;
        this.minzoomVisible = json.minzoomVisible ?? this.minzoom;
        this.shownByDefault = json.shownByDefault ?? true;
        if (json.presets !== undefined && json.presets?.map === undefined) {
            throw "Presets should be a list of items (at " + context + ")"
        }
        this.presets = (json.presets ?? []).map((pr, i) => {
            let preciseInput: PreciseInput = {
                preferredBackground: ["photo"],
                snapToLayers: undefined,
                maxSnapDistance: undefined
            };
            if (pr.preciseInput !== undefined) {
                if (pr.preciseInput === true) {
                    pr.preciseInput = {
                        preferredBackground: undefined
                    }
                }
                
                let snapToLayers: string[];
                if (typeof pr.preciseInput.snapToLayer === "string") {
                    snapToLayers = [pr.preciseInput.snapToLayer]
                } else {
                    snapToLayers = pr.preciseInput.snapToLayer
                }

                let preferredBackground: string[]
                if (typeof pr.preciseInput.preferredBackground === "string") {
                    preferredBackground = [pr.preciseInput.preferredBackground]
                } else {
                    preferredBackground = pr.preciseInput.preferredBackground
                }
                preciseInput = {
                    preferredBackground: preferredBackground,
                    snapToLayers,
                    maxSnapDistance: pr.preciseInput.maxSnapDistance ?? 10
                }
            }

            const config: PresetConfig = {
                title: Translations.T(pr.title, `${context}.presets[${i}].title`),
                tags: pr.tags.map((t) => TagUtils.SimpleTag(t)),
                description: Translations.T(pr.description, `${context}.presets[${i}].description`),
                preciseInput: preciseInput,
            }
            return config;
        });

        if (json.mapRendering === undefined) {
            throw "MapRendering is undefined in " + context
        }

        if (json.mapRendering === null) {
            this.mapRendering = []
            this.lineRendering = []
        } else {
            this.mapRendering = Utils.NoNull(json.mapRendering)
                .filter(r => r["location"] !== undefined)
                .map((r, i) => new PointRenderingConfig(<PointRenderingConfigJson>r, context + ".mapRendering[" + i + "]"))

            this.lineRendering = Utils.NoNull(json.mapRendering)
                .filter(r => r["location"] === undefined)
                .map((r, i) => new LineRenderingConfig(<LineRenderingConfigJson>r, context + ".mapRendering[" + i + "]"))

            const hasCenterRendering = this.mapRendering.some(r => r.location.has("centroid") || r.location.has("start") || r.location.has("end"))

            if (this.lineRendering.length === 0 && this.mapRendering.length === 0) {
                console.log(json.mapRendering)
                throw("The layer " + this.id + " does not have any maprenderings defined and will thus not show up on the map at all. If this is intentional, set maprenderings to 'null' instead of '[]'")
            } else if (!hasCenterRendering && this.lineRendering.length === 0) {
                throw "The layer " + this.id + " might not render ways. This might result in dropped information"
            }
        }

        const missingIds = json.tagRenderings?.filter(tr => typeof tr !== "string" && tr["builtin"] === undefined && tr["id"] === undefined && tr["rewrite"] === undefined) ?? [];
        if (missingIds?.length > 0 && official) {
            console.error("Some tagRenderings of", this.id, "are missing an id:", missingIds)
            throw "Missing ids in tagrenderings"
        }

        this.tagRenderings = (json.tagRenderings ?? []).map((tr, i) => new TagRenderingConfig(<TagRenderingConfigJson>tr, this.id + ".tagRenderings[" + i + "]"))

        this.filters = (json.filter ?? []).map((option, i) => {
            return new FilterConfig(option, `${context}.filter-[${i}]`)
        });

        {
            const duplicateIds = Utils.Dupiclates(this.filters.map(f => f.id))
            if (duplicateIds.length > 0) {
                throw `Some filters have a duplicate id: ${duplicateIds} (at ${context}.filters)`
            }
        }

        if (json["filters"] !== undefined) {
            throw "Error in " + context + ": use 'filter' instead of 'filters'"
        }


        this.titleIcons = this.ParseTagRenderings((<TagRenderingConfigJson[]> json.titleIcons), {
            readOnlyMode: true
        });

        this.title = this.tr("title", undefined);
        this.isShown = this.tr("isShown", "yes");

        this.deletion = null;
        if (json.deletion === true) {
            json.deletion = {};
        }
        if (json.deletion !== undefined && json.deletion !== false) {
            this.deletion = new DeleteConfig(json.deletion, `${context}.deletion`);
        }

        this.allowMove = null
        if (json.allowMove === false) {
            this.allowMove = null;
        } else if (json.allowMove === true) {
            this.allowMove = new MoveConfig({}, context + ".allowMove")
        } else if (json.allowMove !== undefined && json.allowMove !== false) {
            this.allowMove = new MoveConfig(json.allowMove, context + ".allowMove")
        }


        if (json["showIf"] !== undefined) {
            throw (
                "Invalid key on layerconfig " +
                this.id +
                ": showIf. Did you mean 'isShown' instead?"
            );
        }
    }

    public defaultIcon(): BaseUIElement | undefined {
        if (this.mapRendering === undefined || this.mapRendering === null) {
            return undefined;
        }
        const mapRendering = this.mapRendering.filter(r => r.location.has("point"))[0]
        if (mapRendering === undefined) {
            return undefined
        }
        const defaultTags = new UIEventSource(TagUtils.changeAsProperties(this.source.osmTags.asChange({id: "node/-1"})))
        return mapRendering.GenerateLeafletStyle(defaultTags, false, {noSize: true}).html
    }
    public GenerateDocumentation(usedInThemes: string[], layerIsNeededBy: Map<string, string[]>, dependencies: {
        context?: string;
        reason: string;
        neededLayer: string;
    }[], addedByDefault = false, canBeIncluded = true): BaseUIElement {
        const extraProps = []

        if (canBeIncluded) {
            if (addedByDefault) {
                extraProps.push("**This layer is included automatically in every theme. This layer might contain no points**")
            }
            if(this.shownByDefault === false){
                extraProps.push('This layer is not visible by default and must be enabled in the filter by the user. ')
            }
            if (this.title === undefined) {
                extraProps.push("This layer cannot be toggled in the filter view. If you import this layer in your theme, override `title` to make this toggleable.")
            }
            if(this.title === undefined && this.shownByDefault === false){
                extraProps.push("This layer is not visible by default and the visibility cannot be toggled, effectively resulting in a fully hidden layer. This can be useful, e.g. to calculate some metatags. If you want to render this layer (e.g. for debugging), enable it by setting the URL-parameter layer-<id>=true")
            }
            if (this.name === undefined) {
                extraProps.push("Not visible in the layer selection by default. If you want to make this layer toggable, override `name`")
            }
            if (this.mapRendering.length === 0) {
                extraProps.push("Not rendered on the map by default. If you want to rendering this on the map, override `mapRenderings`")
            }
        } else {
            extraProps.push("This layer can **not** be included in a theme. It is solely used by [special renderings](SpecialRenderings.md) showing a minimap with custom data.")
        }


        let usingLayer: BaseUIElement[] = []
        if (usedInThemes?.length > 0 && !addedByDefault) {
            usingLayer = [new Title("Themes using this layer", 4),
                new List((usedInThemes ?? []).map(id => new Link(id, "https://mapcomplete.osm.be/" + id)))
            ]
        }

        for (const dep of dependencies) {
            extraProps.push(new Combine(["This layer will automatically load ", new Link(dep.neededLayer, "#"+dep.neededLayer)," into the layout as it depends on it: ", dep.reason, "("+dep.context+")"]))
        }
        
        for(const revDep of layerIsNeededBy?.get(this.id) ?? []){
            extraProps.push(new Combine(["This layer is needed as dependency for layer",new Link(revDep, "#"+revDep)]))
        }

        return new Combine([
            new Title(this.id, 3),
            this.description,

            new Link("Go to the source code", `../assets/layers/${this.id}/${this.id}.json`),

            new List(extraProps),
            ...usingLayer
        ]).SetClass("flex flex-col")
    }

    public CustomCodeSnippets(): string[] {
        if (this.calculatedTags === undefined) {
            return [];
        }
        return this.calculatedTags.map((code) => code[1]);
    }
    
    AllTagRenderings(): TagRenderingConfig[]{
        return  Utils.NoNull([...this.tagRenderings, ...this.titleIcons, this.title, this.isShown])
}

    public ExtractImages(): Set<string> {
        const parts: Set<string>[] = [];
        parts.push(...this.tagRenderings?.map((tr) => tr.ExtractImages(false)));
        parts.push(...this.titleIcons?.map((tr) => tr.ExtractImages(true)));
        for (const preset of this.presets) {
            parts.push(new Set<string>(preset.description?.ExtractImages(false)));
        }
        for (const pointRenderingConfig of this.mapRendering) {
            parts.push(pointRenderingConfig.ExtractImages())
        }
        const allIcons = new Set<string>();
        for (const part of parts) {
            part?.forEach(allIcons.add, allIcons);
        }

        return allIcons;
    }

    public isLeftRightSensitive(): boolean {
        return this.lineRendering.some(lr => lr.leftRightSensitive)
    }
}