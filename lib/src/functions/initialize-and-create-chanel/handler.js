import 'source-map-support/register';
import { formatJSONResponse } from '@libs/apiGateway';
import { generateUUID, middyfy } from '@libs/lambda';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { PayloadState } from '@libs/chanelModel';
const TABLE_NAME = process.env.SIGNALING_TABLE;
const REGION = process.env.REGION;
const docClient = new DynamoDB.DocumentClient({ region: REGION, credentials: { accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY } });
const initializeAndCreateChanel = async (event) => {
    const body = event.body;
    const peerId = body.peerId;
    const files = body.files;
    const chanelId = generateUUID();
    const accessKey = generateUUID();
    const mapPayload = {};
    const highPiorityPart = {};
    files.forEach(file => {
        const total = file.totalPart;
        const parts = [];
        for (let i = 0; i < total; i++) {
            parts.push({ fileId: file.fileId, totalPart: file.totalPart, part: { partId: i, state: PayloadState.IDLE } });
        }
        mapPayload[file.fileId] = parts;
        highPiorityPart[file.fileId] = parts.map(payload => payload.part.partId);
    });
    const ownerActor = {
        id: peerId,
        isSourceOwner: true,
        payloads: mapPayload,
        numberOnSharingWith: 0
    };
    const actors = {};
    actors[ownerActor.id] = ownerActor;
    let params = {
        TableName: TABLE_NAME,
        Item: {
            chanelId: chanelId,
            sourceOwnerId: peerId,
            accessKey: accessKey,
            actors,
            highPiorityPart: highPiorityPart
        }
    };
    try {
        console.log('PARAM', params);
        await docClient.put(params).promise();
    }
    catch (err) {
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
//# sourceMappingURL=handler.js.map