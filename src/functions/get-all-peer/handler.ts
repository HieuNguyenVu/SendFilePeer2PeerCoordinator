import 'source-map-support/register';

import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
// import AWS object without services
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { SignalingChanel } from '@libs/chanelModel';

// import schema from './schema';
const TABLE_NAME = process.env.SIGNALING_TABLE;
const REGION = process.env.REGION;

var docClient = new DynamoDB.DocumentClient({ region: REGION, credentials: { accessKeyId: process.env.ACCESS_KEY_ID, secretAccessKey: process.env.SECRET_ACCESS_KEY } });

const getAllPeer = async (event) => {
  const id = event.pathParameters.chanelId;
  var params = {
    TableName: TABLE_NAME,
    Key: {
      'chanelId': id
    }
  };

  let data = null;

  try {
    const result = await docClient.get(params).promise();
    console.log("GetItem succeeded:", JSON.stringify(result, null, 2));
    const item: SignalingChanel = result.Item;
    data = item.actors;
  } catch (error) {
    console.error(" Error HIEUNV JSON:", JSON.stringify(error));
    return formatJSONResponse({ error, params });
  }

  return formatJSONResponse(data);
}

export const main = middyfy(getAllPeer);
