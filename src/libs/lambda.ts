import middy from "@middy/core";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import DynamoDB from "aws-sdk/clients/dynamodb";
import * as uuid from "uuid";

const uuidv4 = uuid.v4;

export const middyfy = (handler) => {
  return middy(handler).use(middyJsonBodyParser());
};

export const generateUUID = () => {
  return uuidv4().substring(0, 16);
};

const TABLE_NAME = process.env.SIGNALING_TABLE;
const REGION = process.env.REGION;

const docClient = new DynamoDB.DocumentClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export const updateKeyInDB = async (
  chanelId: string,
  key: string,
  value: any,
  parVariable?: string[]
) => {
  let params = {
    TableName: TABLE_NAME,
    Key: {
      chanelId: chanelId,
    },
    UpdateExpression: `set ${key} = :p`,
    ExpressionAttributeValues: {
      ":p": value,
    },
  };
  if (parVariable && parVariable.length > 0) {
    params["ExpressionAttributeNames"] = {};
    parVariable.forEach((myvar: string) => {
      const varName = "#" + myvar;
      params["ExpressionAttributeNames"][varName] = myvar;
    });
  }
  console.log("updateKeyInDB", params);
  await docClient.update(params).promise();
};

export const getRecordInDB = async (chanelId) => {
  var paramsSearch = {
    TableName: TABLE_NAME,
    Key: {
      chanelId: chanelId,
    },
  };
  return await docClient.get(paramsSearch).promise();
};