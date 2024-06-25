const { Stack, Fn } = require("aws-cdk-lib");
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
} = require("aws-cdk-lib/aws-apigateway");
const { Function, Runtime, Code } = require("aws-cdk-lib/aws-lambda");

class UrlShortenerStack extends Stack {
  constructor(id, scope, props) {
    super(id, scope, props);

    const indexFuntion = new Function(this, "HandlerFunction", {
      runtime: Runtime.NODEJS_18_X,
      handler: "handler.hello",
      code: Code.fromAsset("functions"),
    });

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

    api.root
      .addResource("shorten")
      .addMethod("POST", shortenUrlLambdaIntegration, {
        requestModels: {
          "application/json": urlValidatorModel,
        },
        requestValidator: urlRequestValidator,
      });

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

    this.api = api;
  }
}

module.exports = { UrlShortenerStack };
