export default {
    definitions: {
        fileItem: {
            type: "object",
            properties: {
                fileId: { type: "string" },
                totalPart: { type: "number" }
            }
        }
    },
    type: "object",
    properties: {
        peerId: { type: "string" },
        files: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            uniqueItems: true,
            title: "The question array holding file item",
            items: { "$ref": "#/definitions/fileItem" }
        }
    },
    required: ["peerId", "files"]
};
//# sourceMappingURL=schema.js.map