import 'source-map-support/register';

import { formatJSONResponse, ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { middyfy, updateKeyInDB } from '@libs/lambda';
// import AWS object without services
import { PayloadState } from '@libs/chanelModel';
import schema from './schema';

const putPartDone: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  const body = event.body;
  console.log('body', body);
  const chanelId = event.pathParameters.chanelId;
  const peerId = body.peerId;
  const fileId = body.fileId;
  const partId = body.partId;
  try {

    await updateKeyInDB(chanelId, `actors.${peerId}.payloads.${fileId}.#${partId}.part.#state`, PayloadState.IDLE, ['state', partId.toString()]);
  } catch (err) {
    console.log(err);
  }
  return formatJSONResponse({});
}

export const main = middyfy(putPartDone);
