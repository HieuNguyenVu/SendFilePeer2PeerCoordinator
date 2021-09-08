import type { AWS } from '@serverless/typescript';
import getAllPeer from '@functions/get-all-peer';
import initializeAndCreateChanel from '@functions/initialize-and-create-chanel';
import getNextPart from '@functions/get-next-part';
import putPartDone from '@functions/put-part-done';

const serverlessConfiguration: AWS = {
  service: 'signaling-server',
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
    serverlessOffline: {
      useDocker: true,
      httpPort: 9231
    }
  },
  plugins: ['serverless-webpack','serverless-offline'],
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
      ACCESS_KEY_ID: 'AKIAZL3T7W5MLWEOBCFC',
      SECRET_ACCESS_KEY: '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',
    },
    lambdaHashingVersion: '20201221',
  },
  // import the function via paths
  functions: { getAllPeer, initializeAndCreateChanel, getNextPart, putPartDone }
};

module.exports = serverlessConfiguration;
