import "source-map-support/register";

import { formatJSONResponse } from "@libs/apiGateway";
import { getRecordInDB, middyfy, updateKeyInDB } from "@libs/lambda";
// import AWS object without services
import {
  ChanelActor,
  IFileContent,
  IPayloads,
  PayloadState,
  SignalingChanel,
} from "@libs/chanelModel";
import { APIGatewayProxyEvent } from "aws-lambda/trigger/api-gateway-proxy";

// For clean code
interface SuitableSeeder {
  actorId: string;
  fileId: string;
  partId: Number;
  totalPart: Number;
}

/**
 * Main serverless handler of this API
 * @param event
 * @returns
 */
const getNextPart = async (event: APIGatewayProxyEvent) => {
  const chanelId = event.pathParameters.chanelId;
  let fileId = event.queryStringParameters.fileId;
  const peerId = event.queryStringParameters.peerId;

  let data = null;
  try {
    const result = await getRecordInDB(chanelId);
    const signalingChanel: SignalingChanel = result.Item;
    if (!signalingChanel) {
      //404
      return formatJSONResponse({ message: "Chanel not found" }, 404);
    }

    if (!fileId || fileId.trim().length == 0) {
      fileId = Object.keys(signalingChanel.highPiorityPart)[0];
    }
    console.log("fileId", fileId);

    await putIfPeerNotExist(signalingChanel, peerId, fileId);
    const suitRes = await findSuitableSeeder(fileId, peerId, signalingChanel);
    console.log("findSuitablePartner success");
    if (suitRes && suitRes.hasOwnProperty("partId")) {
      await updatePeerInfo(
        chanelId,
        peerId,
        suitRes.actorId,
        fileId,
        suitRes.partId,
        suitRes.totalPart
      );
    } else {
      return formatJSONResponse({ message: "All are completed" }, 202);
    }
    data = { peerId: suitRes.actorId, fileId, partId: suitRes.partId };
  } catch (err) {
    console.log("Get nex peer error: ", err);
    return formatJSONResponse(err, 500);
  }

  return formatJSONResponse(data);
};

/**
 * Update DB that leecher on taking and seeder on sharing
 * @param chanelId
 * @param leecherId
 * @param seederId
 * @param fileId
 * @param partId
 * @param totalPart
 */
async function updatePeerInfo(
  chanelId: string,
  leecherId: string,
  seederId: string,
  fileId: string,
  partId: Number,
  totalPart: Number
) {
  const result = await getRecordInDB(chanelId);
  const signalingChanel: SignalingChanel = result.Item;
  const peerPartObj = signalingChanel.actors[leecherId].payloads[fileId] || {};
  console.log(
    `Update partId: ${partId} of fileId: ${fileId} of peer: ${leecherId} to taking`
  );

  peerPartObj[partId.toString()] = {
    fileId,
    partId,
    state: PayloadState.ON_TAKING,
    totalPart,
  };
  await updateKeyInDB(
    chanelId,
    `actors.${leecherId}.payloads.${fileId}`,
    peerPartObj
  );
  // prettier-ignore
  const seedPartobj: IFileContent = signalingChanel.actors[seederId].payloads[fileId] || {};

  if (seedPartobj) {
    console.log(
      `Update partId: ${partId} of fileId: ${fileId} of peer: ${seederId} to taking`
    );
    seedPartobj[partId.toString()] = {
      fileId,
      partId,
      state: PayloadState.ON_SHARING,
      totalPart,
    };
    await updateKeyInDB(
      chanelId,
      `actors.${seederId}.payloads.${fileId}`,
      seedPartobj
    );
  }
}

/**
 * put peer to chanel if it not exist
 * @param signalingChanel
 * @param peerId
 * @param fileId
 */
async function putIfPeerNotExist(
  signalingChanel: SignalingChanel,
  peerId: string,
  fileId: string
) {
  if (!signalingChanel.actors[peerId]) {
    const peerActor: ChanelActor = {
      id: peerId,
      isSourceOwner: false,
      numberOnSharingWith: 0,
      payloads: {
        [fileId]: {},
      },
    };
    signalingChanel.actors[peerId] = peerActor;
    await updateKeyInDB(
      signalingChanel.chanelId,
      `actors`,
      signalingChanel.actors
    );
    console.log("putIfPeerNotExist success");
  }
}

/**
 * Find a appropriate seeder and part
 * @param fileId
 * @param leecherId
 * @param chanel
 * @returns Promise<SuitableSeeder>
 */
async function findSuitableSeeder(
  fileId: string,
  leecherId: string,
  chanel: SignalingChanel
): Promise<SuitableSeeder> {
  const ownerId = chanel.sourceOwnerId;
  const owner = chanel.actors[ownerId];
  const finder = chanel.actors[leecherId];
  const fileLook: IFileContent = owner.payloads[fileId];
  const totalPart = fileLook[0].totalPart;
  console.log("totalPart", totalPart);
  console.log("finder", JSON.stringify(finder));
  console.log("fileLook", JSON.stringify(fileLook));

  const partsAlreadyHave = [];
  const partsMissing = [];
  if (finder.payloads[fileId]) {
    Object.keys(finder.payloads[fileId]).forEach((partId) => {
      partsAlreadyHave.push(partId);
    });
  }
  for (let i = 0; i < totalPart; i++) {
    if (!partsAlreadyHave.includes(i)) {
      partsMissing.push(i);
    }
  }
  console.log("partsMissing", partsMissing, partsAlreadyHave);
  if (partsMissing.length == 0) return;

  const partMapper: { [actorId: string]: Number[] } = {};
  let minCost = 10;
  let seeder: ChanelActor = null;
  Object.keys(chanel.actors).forEach((actorId) => {
    const actor = chanel.actors[actorId];
    if (Object.keys(actor.payloads).includes(fileId) && leecherId !== actorId) {
      // Find all parts avaiable
      const fileParts = Object.keys(actor.payloads[fileId])
        .map((partId) => actor.payloads[fileId][partId])
        .filter(
          (part) =>
            partsMissing.includes(part.partId) &&
            (part.state === PayloadState.IDLE ||
              part.state === PayloadState.ON_SHARING)
        )
        .map((item) => item.partId);
      console.log(
        "fileParts",
        Object.keys(actor.payloads[fileId]).map(
          (partId) => actor.payloads[fileId][partId]
        )
      );
      // You will get a list part map as A(1,2,3) B(5,6,7)
      partMapper[actor.id] = fileParts;
      if (actor.numberOnSharingWith <= minCost) {
        seeder = actor;
        minCost = actor.numberOnSharingWith;
      }
    }
  });
  let partIds = chanel.highPiorityPart[fileId].filter((part) =>
    partMapper[seeder.id].includes(part)
  );
  console.log("List seeder:", partMapper);

  console.log(`The leecherId: ${leecherId} can download ${partIds.toString()}`);
  if (partIds && partIds.length > 0) {
    const highPiorityPart = chanel.highPiorityPart[fileId].filter(
      (part) => part !== partIds[0]
    );
    const partReturn = partIds[0];
    await updateKeyInDB(
      chanel.chanelId,
      `highPiorityPart.${fileId}`,
      highPiorityPart
    );
    return {
      actorId: seeder.id,
      fileId: fileId,
      partId: partReturn,
      totalPart,
    };
  }
  return {
    actorId: seeder.id,
    fileId: fileId,
    partId: partMapper[seeder.id][0],
    totalPart,
  };
}

export const main = middyfy(getNextPart);
