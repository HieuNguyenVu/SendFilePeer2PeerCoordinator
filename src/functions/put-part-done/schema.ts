export default {
  type: "object",
  properties: {
    peerId: { type: "string" },
    fileId: { type: "string" },
    partId: { type: "string" }
  },
  required: ["peerId", "fileId", "partId"]
} as const;
