import { handlerPath } from '@libs/handlerResolver';
export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    events: [
        {
            http: {
                method: 'get',
                path: 'chanel/{chanelId}/partner',
                parameters: {
                    fileId: { type: 'string' },
                    peerId: { type: 'string' }
                }
            }
        }
    ]
};
//# sourceMappingURL=index.js.map