const { Stack, Fn} = require("aws-cdk-lib");
const {
  Table,
  AttributeType,
  BillingMode,
} = require("aws-cdk-lib/aws-dynamodb");
const {
  RestApi,
  LambdaIntegration,
  Model,
  RequestValidator,
  JsonSchemaVersion,
  JsonSchemaType,
  AuthorizationType,
  CfnAuthorizer,
} = require("aws-cdk-lib/aws-apigateway");
const { Function, Runtime, Code } = require("aws-cdk-lib/aws-lambda");
const { NodejsFunction } = require("aws-cdk-lib/aws-lambda-nodejs");

class UrlShortenerStack extends Stack {
  constructor(id, scope, props) {
    super(id, scope, props);

    const table = new Table(this, "UrlShortenerTable", {
      partitionKey: {
        name: "short_url",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const table_name = table.tableName;

    const api = new RestApi(this, `${props.stageName}-UrlApi`, {
      deployOptions: {
        stageName: props.stageName,
      },
    });

    const apiLogicalId = this.getLogicalId(api.node.defaultChild);

    const indexFuntion = new NodejsFunction(this, "HandlerFunction", {
      runtime: Runtime.NODEJS_18_X,
      handler: "handler",
      entry: "functions/handler.js",
      bundling: {
        commandHooks: {
          afterBundling(inputDir, outputDir) {
            return [
              `mkdir ${outputDir}/static`,
              `cp ${inputDir}/static/index.html ${outputDir}/static/index.html`,
            ];
          },
          beforeBundling() {},
          beforeInstall() {},
        },
      },
      environment:{
        shortenUrl: Fn.sub(
          `https://\${${apiLogicalId}}.execute-api.\${AWS::Region}.amazonaws.com/${props.stageName}/shorten`
        )
      }
    });

    const shortenUrl = new Function(this, "ShortenUrl", {
      runtime: Runtime.NODEJS_18_X,
      handler: "shorten_url.handler",
      code: Code.fromAsset("functions"),
      environment: {
        table_name,
        base_url: Fn.sub(
          `https://\${${apiLogicalId}}.execute-api.\${AWS::Region}.amazonaws.com/${props.stageName}/redirect?short_url=`
        )
      },
    });

    table.grantWriteData(shortenUrl);

    const redirectFunction = new Function(this, "RedirectUrl", {
      runtime: Runtime.NODEJS_18_X,
      handler: "redirect.handler",
      code: Code.fromAsset("functions"),
      environment: {
        table_name,
      },
    });

    table.grantReadData(redirectFunction);

    const shortenUrlLambdaIntegration = new LambdaIntegration(shortenUrl);
    const redirectFunctionLambdaIntegration = new LambdaIntegration(
      redirectFunction
    );
    const indexFuntionLambdaIntegration = new LambdaIntegration(indexFuntion);

    api.root.addMethod("GET", indexFuntionLambdaIntegration);

    const urlValidatorModel = new Model(this, "UrlValidator", {
      restApi: api,
      contentType: "application/json",
      description: "Validate Long Url",
      modelName: "URLValidatorModel",
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: "LongURlValidator",
        type: JsonSchemaType.OBJECT,
        properties: {
          long_url: {
            type: JsonSchemaType.STRING,
            pattern: "^(http://|https://|www\\.).*",
          },
        },
        required: ["long_url"],
      },
    });

    const urlRequestValidator = new RequestValidator(
      this,
      "UrlRequestValidator",
      {
        restApi: api,
        requestValidatorName: "UrlValidator",
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    const cognitoAuthorizer = new CfnAuthorizer(this, 'CognitoAuthorizer', {
      name: 'CognitoAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [props.userPool.userPoolArn],
      restApiId: api.restApiId,
    })

    api.root
      .addResource("shorten")
      .addMethod("POST", shortenUrlLambdaIntegration, {
        authorizationType: AuthorizationType.COGNITO,
        requestModels: {
          "application/json": urlValidatorModel,
        },
        authorizer: {
          authorizerId: cognitoAuthorizer.ref
        },
        requestValidator: urlRequestValidator,
      },
    );

    api.root
      .addResource("redirect")
      .addMethod("GET", redirectFunctionLambdaIntegration, {
        requestParameters: {
          "method.request.querystring.short_url": true,
        },
        requestValidatorOptions: {
          requestValidatorName: "querystring-validator",
          validateRequestParameters: true,
          validateRequestBody: false,
        },
      });
}
}

module.exports = { UrlShortenerStack };
