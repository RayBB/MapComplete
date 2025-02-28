import * as known_themes from "../assets/generated/known_layers_and_themes.json"
import LayoutConfig from "../Models/ThemeConfig/LayoutConfig";
import LayerConfig from "../Models/ThemeConfig/LayerConfig";
import BaseUIElement from "../UI/BaseUIElement";
import Combine from "../UI/Base/Combine";
import Title from "../UI/Base/Title";
import List from "../UI/Base/List";
import DependencyCalculator from "../Models/ThemeConfig/DependencyCalculator";
import Constants from "../Models/Constants";
import {Utils} from "../Utils";

export class AllKnownLayouts {
    // Must be below the list...
    private static sharedLayers: Map<string, LayerConfig> = AllKnownLayouts.getSharedLayers();

    private static getSharedLayers(): Map<string, LayerConfig> {
        const sharedLayers = new Map<string, LayerConfig>();
        for (const layer of known_themes.layers) {
            try {
                // @ts-ignore
                const parsed = new LayerConfig(layer, "shared_layers")
                sharedLayers.set(layer.id, parsed);
            } catch (e) {
                if (!Utils.runningFromConsole) {
                    console.error("CRITICAL: Could not parse a layer configuration!", layer.id, " due to", e)
                }
            }
        }

        return sharedLayers;
    }

    public static allKnownLayouts: Map<string, LayoutConfig> = AllKnownLayouts.AllLayouts();
    public static layoutsList: LayoutConfig[] = AllKnownLayouts.GenerateOrderedList(AllKnownLayouts.allKnownLayouts);

    public static AllPublicLayers() {
        const allLayers: LayerConfig[] = []
        const seendIds = new Set<string>()
        const publicLayouts = AllKnownLayouts.layoutsList.filter(l => !l.hideFromOverview)
        for (const layout of publicLayouts) {
            if (layout.hideFromOverview) {
                continue
            }
            for (const layer of layout.layers) {
                if (seendIds.has(layer.id)) {
                    continue
                }
                seendIds.add(layer.id)
                allLayers.push(layer)
            }

        }
        return allLayers
    }

    public static GenLayerOverviewText(): BaseUIElement {
        for (const id of Constants.priviliged_layers) {
            if (!AllKnownLayouts.sharedLayers.has(id)) {
                throw "Priviliged layer definition not found: " + id
            }
        }

        const allLayers: LayerConfig[] = Array.from(AllKnownLayouts.sharedLayers.values())
            .filter(layer => Constants.priviliged_layers.indexOf(layer.id) < 0)

        const builtinLayerIds: Set<string> = new Set<string>()
        allLayers.forEach(l => builtinLayerIds.add(l.id))

        const themesPerLayer = new Map<string, string[]>()

        for (const layout of Array.from(AllKnownLayouts.allKnownLayouts.values())) {
            if (layout.hideFromOverview) {
                continue
            }
            for (const layer of layout.layers) {
                if (!builtinLayerIds.has(layer.id)) {
                    continue
                }
                if (!themesPerLayer.has(layer.id)) {
                    themesPerLayer.set(layer.id, [])
                }
                themesPerLayer.get(layer.id).push(layout.id)
            }
        }


        let popularLayerCutoff = 2;
        const popuparLayers = allLayers.filter(layer => themesPerLayer.get(layer.id)?.length >= 2)

        const unpopularLayers = allLayers.filter(layer => themesPerLayer.get(layer.id)?.length < 2)

        // Determine the cross-dependencies
        const layerIsNeededBy : Map<string, string[]> = new Map<string, string[]>()

        for (const layer of allLayers) {
            for (const dep of DependencyCalculator.getLayerDependencies(layer)) {
                const dependency = dep.neededLayer
                if(!layerIsNeededBy.has(dependency)){
                    layerIsNeededBy.set(dependency, [])
                }
                layerIsNeededBy.get(dependency).push(layer.id)
            }
            
            
        }
        
        return new Combine([
            new Title("Special and other useful layers", 1),
            "MapComplete has a few data layers available in the theme which have special properties through builtin-hooks. Furthermore, there are some normal layers (which are built from normal Theme-config files) but are so general that they get a mention here.",
            new Title("Priviliged layers", 1),
            new List(Constants.priviliged_layers.map(id => "[" + id + "](#" + id + ")")),
            ...Constants.priviliged_layers
                .map(id => AllKnownLayouts.sharedLayers.get(id))
                .map((l) => l.GenerateDocumentation(themesPerLayer.get(l.id), layerIsNeededBy, DependencyCalculator.getLayerDependencies(l),Constants.added_by_default.indexOf(l.id) >= 0, Constants.no_include.indexOf(l.id) < 0)),
            new Title("Normal layers", 1),
            "The following layers are included in MapComplete",
            new Title("Frequently reused layers", 2),
            "The following layers are used by at least " + popularLayerCutoff + " mapcomplete themes and might be interesting for your custom theme too",
            new List(popuparLayers.map(layer => "[" + layer.id + "](#" + layer.id + ")")),
            ...popuparLayers.map((layer) => layer.GenerateDocumentation(themesPerLayer.get(layer.id),layerIsNeededBy,DependencyCalculator.getLayerDependencies(layer))),
            new List(unpopularLayers.map(layer => "[" + layer.id + "](#" + layer.id + ")")),
            ...unpopularLayers.map(layer => layer.GenerateDocumentation(themesPerLayer.get(layer.id),layerIsNeededBy,DependencyCalculator.getLayerDependencies(layer))
            )
        ])


    }

    private static GenerateOrderedList(allKnownLayouts: Map<string, LayoutConfig>): LayoutConfig[] {
        const list = []
        allKnownLayouts.forEach((layout, key) => {
            list.push(layout)
        })
        return list;
    }

    private static AllLayouts(): Map<string, LayoutConfig> {
        const dict: Map<string, LayoutConfig> = new Map();
        for (const layoutConfigJson of known_themes.themes) {
            // @ts-ignore
            const layout = new LayoutConfig(layoutConfigJson, true)
            dict.set(layout.id, layout)

            for (let i = 0; i < layout.layers.length; i++) {
                let layer = layout.layers[i];
                if (typeof (layer) === "string") {
                    layer = layout.layers[i] = AllKnownLayouts.sharedLayers.get(layer);
                    if (layer === undefined) {
                        console.log("Defined layers are ", AllKnownLayouts.sharedLayers.keys())
                        throw `Layer ${layer} was not found or defined - probably a type was made`
                    }
                }

            }
        }
        return dict;
    }

}
