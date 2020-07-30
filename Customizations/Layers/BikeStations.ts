import {LayerDefinition} from "../LayerDefinition";
import {And, Tag, TagsFilter, Or, Not} from "../../Logic/TagsFilter";
import BikeStationChain from "../Questions/bike/StationChain";
import BikeStationPumpTools from "../Questions/bike/StationPumpTools";
import BikeStationStand from "../Questions/bike/StationStand";
import PumpManual from "../Questions/bike/PumpManual";
import BikeStationOperator from "../Questions/bike/StationOperator";
import BikeStationBrand from "../Questions/bike/StationBrand";
import FixedText from "../Questions/FixedText";
import PumpManometer from "../Questions/bike/PumpManometer";
import {ImageCarouselWithUploadConstructor} from "../../UI/Image/ImageCarouselWithUpload";
import PumpOperational from "../Questions/bike/PumpOperational";
import PumpValves from "../Questions/bike/PumpValves";
import Translations from "../../UI/i18n/Translations";
import { TagRenderingOptions } from "../TagRendering";


export default class BikeStations extends LayerDefinition {
    private readonly repairStation = new Tag("amenity", "bicycle_repair_station");
    private readonly pump = new Tag("service:bicycle:pump", "yes");
    private readonly nopump = new Tag("service:bicycle:pump", "no");
    private readonly pumpOperationalAny = new Tag("service:bicycle:pump:operational_status", "yes");
    private readonly pumpOperationalOk = new Or([new Tag("service:bicycle:pump:operational_status", "yes"), new Tag("service:bicycle:pump:operational_status", "operational"), new Tag("service:bicycle:pump:operational_status", "ok"), new Tag("service:bicycle:pump:operational_status", "")]);
    private readonly tools = new Tag("service:bicycle:tools", "yes");
    private readonly notools = new Tag("service:bicycle:tools", "no");

    private readonly to = Translations.t.cyclofix.station

    constructor() {
        super();
        this.name = Translations.t.cyclofix.station.name;
        this.icon = "./assets/bike/repair_station_pump.svg";

        const tr = Translations.t.cyclofix.station
        this.overpassFilter = this.repairStation;
        this.presets = [
            {
                title: tr.titlePump,
                description: tr.services.pump,
                tags: [this.repairStation, this.pump, this.notools]
            },
            {
                title: tr.titleRepair,
                description: tr.services.tools,
                tags: [this.repairStation, this.tools, this.nopump]
            },
            {
                title: tr.titlePumpAndRepair,
                description: tr.services.both,
                tags: [this.repairStation, this.tools, this.pump]
            },

        ]

        this.maxAllowedOverlapPercentage = 10;

        this.minzoom = 13;
        this.style = this.generateStyleFunction();
        this.title = new TagRenderingOptions({
            mappings: [
                {
                    k: new And([this.pump, this.tools]),
                    txt: this.to.titlePumpAndRepair
                },
                {
                    k: new And([this.pump]),
                    txt: this.to.titlePump
                },
                {k: null, txt: this.to.titleRepair},
            ]
        })
        this.wayHandling = LayerDefinition.WAYHANDLING_CENTER_AND_WAY

        this.elementsToShow = [
            new ImageCarouselWithUploadConstructor(),

            new BikeStationPumpTools(),
            new BikeStationChain().OnlyShowIf(this.tools),
            new BikeStationStand().OnlyShowIf(this.tools),

            new PumpManual().OnlyShowIf(this.pump),
            new PumpManometer().OnlyShowIf(this.pump),
            new PumpValves().OnlyShowIf(this.pump),
            new PumpOperational().OnlyShowIf(this.pump),

            // new BikeStationOperator(),
            // new BikeStationBrand()   DISABLED
        ];
    }

    private generateStyleFunction() {
        const self = this;
        return function (properties: any) {
            const hasPump = self.pump.matchesProperties(properties)
            const isOperational = self.pumpOperationalOk.matchesProperties(properties)
            const hasTools = self.tools.matchesProperties(properties)
            let iconName = "repair_station.svg";
            if (hasTools && hasPump && isOperational) {
                iconName = "repair_station_pump.svg"
            } else if(hasTools) {
                    iconName = "repair_station.svg"
            } else if(hasPump) {
                if (isOperational) {
                    iconName = "pump.svg"
                } else {
                    iconName = "broken_pump_2.svg"
                }
            }

            const iconUrl = `./assets/bike/${iconName}`
            return {
                color: "#00bb00",
                icon: {
                    iconUrl: iconUrl,
                    iconSize: [50, 50],
                    iconAnchor: [25, 50]
                }
            };
        };
    }
}
