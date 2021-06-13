import 'source-map-support/register';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { PayloadState } from '@libs/chanelModel';
const TABLE_NAME = process.env.SIGNALING_TABLE;
const REGION = process.env.REGION;
const docClient = new DynamoDB.DocumentClient({ region: REGION, credentials: { accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY } });
const getNextPeer = async (event) => {
    const chanelId = event.pathParameters.chanelId;
    const fileId = event.queryStringParameters.fileId;
    const peerId = event.queryStringParameters.peerId;
    var params = {
        TableName: TABLE_NAME,
        Key: {
            'chanelId': chanelId
        }
    };
    let data = null;
    try {
        const result = await docClient.get(params).promise();
        console.log("GetItem succeeded:", JSON.stringify(result, null, 2));
        const signalingChanel = result.Item;
        const suitRes = findSuitablePartner(fileId, peerId, signalingChanel);
        data = { actorId: suitRes.actorId, partId: suitRes.partId };
    }
    catch (err) {
        console.log('Get nex peer error: ', err);
    }
    return formatJSONResponse(data);
};
function findSuitablePartner(fileId, peerId, chanel) {
    const ownerId = chanel.sourceOwnerId;
    const owner = chanel.actors[ownerId];
    const finder = chanel.actors[peerId];
    const fileLook = owner.payloads[fileId];
    const totalPart = fileLook[0].totalPart;
    const partsAlreadyHave = [];
    const partsMissing = [];
    finder.payloads[fileId].forEach((filePart) => {
        if (filePart.part) {
            partsAlreadyHave.push(filePart.part.partId);
        }
    });
    for (let i = 0; i < totalPart; i++) {
        if (!partsAlreadyHave.includes(i)) {
            partsMissing.push(i);
        }
    }
    const partMapper = {};
    let minCost = 10;
    let avaiableActor = null;
    Object.keys(chanel.actors).forEach(actorId => {
        const actor = chanel.actors[actorId];
        if (Object.keys(actor.payloads).includes(fileId)) {
            const fileParts = actor.payloads[fileId].map(content => content.part).filter(part => partsMissing.includes(part.partId) && (part.state === PayloadState.IDLE)).map(item => item.partId);
            partMapper[actor.id] = fileParts;
            if (actor.numberOnSharingWith <= minCost) {
                avaiableActor = actor;
                minCost = actor.numberOnSharingWith;
            }
        }
    });
    let partIds = chanel.highPiorityPart[fileId].filter(part => partMapper[avaiableActor.id].includes(part));
    if (partIds && partIds.length > 0) {
        let params = {
            TableName: TABLE_NAME,
            Key: {
                "id": chanel.chanelId
            },
            UpdateExpression: "set highPiorityPart = :p",
            ExpressionAttributeValues: {
                ":p": chanel.highPiorityPart[fileId].filter(part => part !== partIds[0])
            }
        };
        return { actorId: avaiableActor.id, partId: partIds[0] };
    }
    return { actorId: avaiableActor.id, partId: partMapper[avaiableActor.id][0] };
}
export const main = middyfy(getNextPeer);
//# sourceMappingURL=handler.js.map