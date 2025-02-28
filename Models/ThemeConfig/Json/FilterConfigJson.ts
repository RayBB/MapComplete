import {AndOrTagConfigJson} from "./TagConfigJson";

export default interface FilterConfigJson {
    /**
     * An id/name for this filter, used to set the URL parameters
     */
    id: string,
    /**
     * The options for a filter
     * If there are multiple options these will be a list of radio buttons
     * If there is only one option this will be a checkbox
     * Filtering is done based on the given osmTags that are compared to the objects in that layer.
     */
    options: {
        question: string | any; 
        osmTags?: AndOrTagConfigJson | string, 
        fields?: {
            name: string,
            type?: string | "string"
        }[]
    }[];
}