import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import {SqsEventSource} from 'aws-cdk-lib/aws-lambda-event-sources';

const stage = "dev";

export class CdkStorytimeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SQS - Rekognition
    const queueRekognition = new sqs.Queue(this, 'QueueRekognition');
    new cdk.CfnOutput(this, 'sqsRekognitionUrl', {
      value: queueRekognition.queueUrl,
      description: 'The url of the Rekognition Queue',
    });
    
    // SQS - Polly
    const queuePolly = new sqs.Queue(this, 'QueuePolly');
    new cdk.CfnOutput(this, 'sqsPollyUrl', {
      value: queuePolly.queueUrl,
      description: 'The url of the Polly Queue',
    });

    // SNS
    const topic = new sns.Topic(this, 'sns-storytime', {
      topicName: 'sns-storytime'
    });
    topic.addSubscription(new subscriptions.EmailSubscription('storytimebot21@gmail.com'));
    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });

    // s3 
    const s3Bucket = new s3.Bucket(this, "storage",{
      // bucketName: bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
      description: 'The nmae of bucket',
    });
    new cdk.CfnOutput(this, 's3Arn', {
      value: s3Bucket.bucketArn,
      description: 'The arn of s3',
    });
    new cdk.CfnOutput(this, 's3Path', {
      value: 's3://'+s3Bucket.bucketName,
      description: 'The path of s3',
    });

    // cloudfront
    const distribution = new cloudFront.Distribution(this, 'cloudfront', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudFront.PriceClass.PRICE_CLASS_200,  
    });
    new cdk.CfnOutput(this, 'distributionDomainName', {
      value: distribution.domainName,
      description: 'The domain name of the Distribution',
    });

    // Lambda - Upload
    const lambdaUpload = new lambda.Function(this, "LambdaUpload", {
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../../lambda-upload"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      environment: {
        sqsRekognitionUrl: queueRekognition.queueUrl,
        topicArn: topic.topicArn,
        bucketName: s3Bucket.bucketName
      }
    });  
    queueRekognition.grantSendMessages(lambdaUpload);
    topic.grantPublish(lambdaUpload);
    s3Bucket.grantReadWrite(lambdaUpload);


    // Lambda - Rekognition
    const lambdaRekognition = new lambda.Function(this, "LambdaRekognition", {
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../serverless-storytime-for-rekognition"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      environment: {
        sqsRekognitionUrl: queueRekognition.queueUrl,
        sqsPollyUrl: queuePolly.queueUrl,
      }
    });   
    lambdaRekognition.addEventSource(new SqsEventSource(queueRekognition)); 
    queuePolly.grantSendMessages(lambdaRekognition);
    s3Bucket.grantRead(lambdaRekognition);

    // create a policy statement
    const RekognitionPolicy = new iam.PolicyStatement({
      actions: ['rekognition:*'],
      resources: ['*'],
    });
    // add the policy to the Function's role
    lambdaRekognition.role?.attachInlinePolicy(
      new iam.Policy(this, 'rekognition-policy', {
        statements: [RekognitionPolicy],
      }),
    );
 
    // Lambda - Polly
    const lambdaPolly = new lambda.Function(this, "LambdaPolly", {
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../serverless-storytime-for-polly"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      environment: {
        CDN: 'https://'+distribution.domainName+'/',
        sqsPollyUrl: queuePolly.queueUrl,
        topicArn: topic.topicArn
      }
    }); 
    lambdaPolly.addEventSource(new SqsEventSource(queuePolly)); 
    topic.grantPublish(lambdaPolly);
    s3Bucket.grantWrite(lambdaPolly);

    // create a policy statement
    const PollyPolicy = new iam.PolicyStatement({
      actions: ['polly:*'],
      resources: ['*'],
    });
    // add the policy to the Function's role
    lambdaPolly.role?.attachInlinePolicy(
      new iam.Policy(this, 'polly-policy', {
        statements: [PollyPolicy],
      }),
    );

    // Lambda - Retrieve
    const lambdaRetrieve = new lambda.Function(this, "LambdaRetrieve", {
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../serverless-storytime-for-retrieve"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      environment: {
         bucket: s3Bucket.bucketName,
         sqsRekognitionUri: queueRekognition.queueUrl
      }
    }); 
    topic.grantPublish(lambdaRetrieve);

    // role
    const role = new iam.Role(this, "api-role", {
      roleName: "ApiRole",
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });
    role.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['lambda:InvokeFunction']
    }));
    role.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AWSLambdaExecute',
    }); 

    const templateString: string = `##  See http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
    ##  This template will pass through all parameters including path, querystring, header, stage variables, and context through to the integration endpoint via the body/payload
    #set($allParams = $input.params())
    {
    "body-json" : $input.json('$'),
    "params" : {
    #foreach($type in $allParams.keySet())
        #set($params = $allParams.get($type))
    "$type" : {
        #foreach($paramName in $params.keySet())
        "$paramName" : "$util.escapeJavaScript($params.get($paramName))"
            #if($foreach.hasNext),#end
        #end
    }
        #if($foreach.hasNext),#end
    #end
    },
    "stage-variables" : {
    #foreach($key in $stageVariables.keySet())
    "$key" : "$util.escapeJavaScript($stageVariables.get($key))"
        #if($foreach.hasNext),#end
    #end
    },
    "context" : {
        "account-id" : "$context.identity.accountId",
        "api-id" : "$context.apiId",
        "api-key" : "$context.identity.apiKey",
        "authorizer-principal-id" : "$context.authorizer.principalId",
        "caller" : "$context.identity.caller",
        "cognito-authentication-provider" : "$context.identity.cognitoAuthenticationProvider",
        "cognito-authentication-type" : "$context.identity.cognitoAuthenticationType",
        "cognito-identity-id" : "$context.identity.cognitoIdentityId",
        "cognito-identity-pool-id" : "$context.identity.cognitoIdentityPoolId",
        "http-method" : "$context.httpMethod",
        "stage" : "$context.stage",
        "source-ip" : "$context.identity.sourceIp",
        "user" : "$context.identity.user",
        "user-agent" : "$context.identity.userAgent",
        "user-arn" : "$context.identity.userArn",
        "request-id" : "$context.requestId",
        "resource-id" : "$context.resourceId",
        "resource-path" : "$context.resourcePath"
        }
    }`    
    const requestTemplates = { // path through
      "image/jpeg": templateString,
      "image/jpg": templateString,
      "application/octet-stream": templateString,
      "image/png" : templateString
    }
 
    // API Gateway
    const api = new apiGateway.RestApi(this, 'api-stable-diffusion', {
      description: 'API Gateway',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: stage,
      },
    });  

    // POST method
    const text2image = api.root.addResource('text2image');
    text2image.addMethod('POST', new apiGateway.LambdaIntegration(lambdaUpload, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestTemplates: requestTemplates,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [   // API Gateway sends to the client that called a method.
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 
    new cdk.CfnOutput(this, 'apiUrl', {
      value: api.url,
      description: 'The url of API Gateway',
    }); 
    new cdk.CfnOutput(this, 'curlUrl', {
      value: "curl -X POST "+api.url+'text2image -H "Content-Type: application/json" -d \'{"text":"astronaut on a horse"}\'',
      description: 'The url of API Gateway',
    }); 
  }
}
