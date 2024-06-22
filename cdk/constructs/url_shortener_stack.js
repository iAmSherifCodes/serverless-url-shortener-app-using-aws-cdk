const { Stack } = require("aws-cdk-lib");
const {
  Table,
  AttributeType,
  BillingMode,
} = require("aws-cdk-lib/aws-dynamodb");
const { Function } = require("aws-cdk-lib/aws-lambda");

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

    const shortenUrl = new Function(this, "ShortenUrl", {
      runtime: Runtime.NODEJS_18_X,
      handler: "shorten_url.handler",
      code: Code.fromAsset("functions"),
      environment: {
        table_name: table.tableName,
      },
    });

    table.grantWriteData(shortenUrl);
  }
}
