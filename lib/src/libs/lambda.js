import middy from "@middy/core";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import * as uuid from 'uuid';
const uuidv4 = uuid.v4;
export const middyfy = (handler) => {
    return middy(handler).use(middyJsonBodyParser());
};
export const generateUUID = () => {
    return uuidv4().substring(0, 16);
};
//# sourceMappingURL=lambda.js.map