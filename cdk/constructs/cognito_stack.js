const { UserPool, UserPoolClient } = require("aws-cdk-lib/aws-cognito");

class CognitoStack extends Stack {
  /**
   * Creates a Cognito User Pool and User Pool Client
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const userPool = new UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      signInCaseSensitive: false,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireSymbols: true,
        requireUppercase: true,
      },
      autoVerify: {
        email: true,
      },
    });

    const webUserPoolClient = new UserPoolClient(this, "WebUserPoolClient", {
      userPool,
      generateSecret: false,
      preventUserExistenceErrors: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    this.userPool = userPool;
    this.webUserPoolClient = webUserPoolClient;
  }
}

module.exports = {
  CognitoStack,
};