const { Stack } = require("aws-cdk-lib");
const {
  Table,
  AttributeType,
  BillingMode,
} = require("aws-cdk-lib/aws-dynamodb");
const { RestApi, LambdaIntegration } = require("aws-cdk-lib/aws-apigateway");
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

    const shortenUrl = new Function(this, "ShortenUrl", {
      runtime: Runtime.NODEJS_18_X,
      handler: "shorten_url.handler",
      code: Code.fromAsset("functions"),
      environment: {
        table_name,
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

    const api = new RestApi(this, `${props.stageName}-UrlApi`, {
      deployOptions: {
        stageName: props.stageName,
      },
    });

    const shortenUrlLambdaIntegration = new LambdaIntegration(shortenUrl);
    const redirectFunctionLambdaIntegration = new LambdaIntegration(
      redirectFunction
    );
    const indexFuntionLambdaIntegration = new LambdaIntegration(indexFuntion);

    api.root.addMethod("GET", indexFuntionLambdaIntegration);

    api.root
      .addResource("shorten")
      .addMethod("POST", shortenUrlLambdaIntegration);
// .addResource("{short_url}")
    api.root
      .addResource("redirect")
      .addMethod("GET", redirectFunctionLambdaIntegration);
  }
}

module.exports = { UrlShortenerStack };
