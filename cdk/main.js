#!/usr/bin/env node

const cdk = require('aws-cdk-lib')
const { UrlShortenerStack } = require('./constructs/url_shortener_stack')

const app = new cdk.App()
let stageName = app.node.tryGetContext("stageName");

if (!stageName) {
  console.log("Defaulting stage name to dev");
  stageName = "dev";
}

new UrlShortenerStack(app, `UrlShortenerStack-${stageName}`, {
    stageName
})