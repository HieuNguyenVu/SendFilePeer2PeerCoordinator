import "source-map-support/register";

import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/apiGateway";
import { generateUUID, middyfy } from "@libs/lambda";
// import AWS object without services
import DynamoDB from "aws-sdk/clients/dynamodb";
import {
  ChanelActor,
  ChanelActors,
  HighPiorityPart,
  IFileContent,
  IPayloads,
  PayloadState,
  SignalingChanel,
} from "@libs/chanelModel";
import schema from "./schema";

// import schema from './schema';
const TABLE_NAME = process.env.SIGNALING_TABLE;
const REGION = process.env.REGION;

const docClient = new DynamoDB.DocumentClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

const initializeAndCreateChanel: ValidatedEventAPIGatewayProxyEvent<
  typeof schema
> = async (event) => {
  const body = event.body;
  const peerId = body.peerId;
  const files: IFileContent[] = body.files;

  const chanelId = generateUUID();
  const accessKey = generateUUID();

  const mapPayload: IPayloads = {};
  const highPiorityPart: HighPiorityPart = {};
  files.forEach((file) => {
    const total = file.totalPart;
    let parts = {};
    for (let partNumber = 0; partNumber < total; partNumber++) {
      parts[partNumber] = {
        fileId: file.fileId,
        totalPart: file.totalPart,
        partId: partNumber,
        state: PayloadState.IDLE,
      };
    }
    mapPayload[file.fileId] = parts;
    // mark all part is high priority
    console.log("mapPayload[file.fileId]", mapPayload[file.fileId]);
    highPiorityPart[file.fileId] = Object.keys(mapPayload[file.fileId]).map(
      (partIdStr) => parseInt(partIdStr)
    );
  });
  const ownerActor: ChanelActor = {
    id: peerId,
    isSourceOwner: true,
    payloads: mapPayload,
    numberOnSharingWith: 0,
  };
  const actors: ChanelActors = {};
  actors[ownerActor.id] = ownerActor;

  let params: { TableName: string; Item: SignalingChanel } = {
    TableName: TABLE_NAME,
    Item: {
      chanelId: chanelId,
      sourceOwnerId: peerId,
      accessKey: accessKey,
      actors,
      highPiorityPart: highPiorityPart,
    },
  };
  try {
    console.log("PARAM", params);
    await docClient.put(params).promise();
  } catch (err) {
    console.log(err);
    return formatJSONResponse({ statusCode: 500, err });
  }

  const resultData = {
    chanelId,
    accessKey,
  };
  return formatJSONResponse(resultData);
};

export const main = middyfy(initializeAndCreateChanel);
