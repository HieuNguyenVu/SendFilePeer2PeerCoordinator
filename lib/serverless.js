import hello from '@functions/hello';
import getAllPeer from '@functions/get-all-peer';
import initializeAndCreateChanel from '@functions/initialize-and-create-chanel';
import getNextPeer from '@functions/get-next-peer';
const serverlessConfiguration = {
    service: 'signaling-server',
    frameworkVersion: '2',
    custom: {
        webpack: {
            webpackConfig: './webpack.config.js',
            includeModules: true,
        },
    },
    plugins: ['serverless-webpack'],
    provider: {
        name: 'aws',
        stage: 'dev',
        region: 'us-east-2',
        runtime: 'nodejs14.x',
        apiGateway: {
            minimumCompressionSize: 1024,
            shouldStartNameWithService: true,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            SIGNALING_TABLE: 'SIGNALINGCHANEL',
            REGION: 'us-east-2',
            ACCESS_KEY_ID: 'AKIAZL3T7W5MNY6IVUUI',
            SECRET_ACCESS_KEY: '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',
        },
        lambdaHashingVersion: '20201221',
    },
    functions: { hello, getAllPeer, initializeAndCreateChanel, getNextPeer },
};
module.exports = serverlessConfiguration;
//# sourceMappingURL=serverless.js.map