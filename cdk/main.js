#!/usr/bin/env node

const cdk = require('aws-cdk-lib')
const { UrlShortenerStack } = require('./constructs/url_shortener_stack')
const { CognitoStack } = require('./constructs/cognito_stack')

const app = new cdk.App()
let stageName = app.node.tryGetContext("stageName");

if (!stageName) {
  console.log("Defaulting stage name to dev");
  stageName = "dev";
}

const cognitoStack = new CognitoStack(app, `CognitoStack-${stageName}`, {
  stageName
})

new UrlShortenerStack(app, `UrlShortenerStack-${stageName}`, {
    stageName,
    webUserPool: cognitoStack.webUserPoolClient,
    userPool: cognitoStack.userPool
})