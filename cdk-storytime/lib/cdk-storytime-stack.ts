import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
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
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";
import * as logs from "aws-cdk-lib/aws-logs"

const stage = "dev";
const email = "storytimebot21@gmail.com";

export class CdkStorytimeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SQS - Rekognition
    const queueRekognition = new sqs.Queue(this, 'QueueRekognition', {
      queueName: "queue-rekognition",
    });
    new cdk.CfnOutput(this, 'sqsRekognitionUrl', {
      value: queueRekognition.queueUrl,
      description: 'The url of the Rekognition Queue',
    });
    
    // SQS - Polly
    const queuePolly = new sqs.Queue(this, 'QueuePolly', {
      queueName: "queue-polly",
    });
    new cdk.CfnOutput(this, 'sqsPollyUrl', {
      value: queuePolly.queueUrl,
      description: 'The url of the Polly Queue',
    });

    // SNS
    const topic = new sns.Topic(this, 'SNS', {
      topicName: 'sns'
    });
    topic.addSubscription(new subscriptions.EmailSubscription(email));
    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });

    // S3 
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

    // copy html files into s3 bucket
    new s3Deploy.BucketDeployment(this, "UploadHtml", {
      sources: [s3Deploy.Source.asset("../html")],
      destinationBucket: s3Bucket,
    });

    // CloudFront
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
      runtime: lambda.Runtime.NODEJS_16_X, 
      functionName: "lambda-for-upload",
      code: lambda.Code.fromAsset("../lambda-upload"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        sqsRekognitionUrl: queueRekognition.queueUrl,
        bucketName: s3Bucket.bucketName
      }
    });  
    queueRekognition.grantSendMessages(lambdaUpload);
    s3Bucket.grantReadWrite(lambdaUpload);

    // Lambda - Rekognition
    const lambdaRekognition = new lambda.Function(this, "LambdaRekognition", {
      runtime: lambda.Runtime.NODEJS_16_X, 
      functionName: "lambda-for-rekognition",
      code: lambda.Code.fromAsset("../lambda-rekognition"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        sqsRekognitionUrl: queueRekognition.queueUrl,
        sqsPollyUrl: queuePolly.queueUrl,
      }
    });   
    lambdaRekognition.addEventSource(new SqsEventSource(queueRekognition)); 
    queuePolly.grantSendMessages(lambdaRekognition);
    s3Bucket.grantRead(lambdaRekognition);

    const RekognitionPolicy = new iam.PolicyStatement({  // rekognition policy
      actions: ['rekognition:*'],
      resources: ['*'],
    });
    lambdaRekognition.role?.attachInlinePolicy(
      new iam.Policy(this, 'rekognition-policy', {
        statements: [RekognitionPolicy],
      }),
    );
 
    // Lambda - Polly
    const lambdaPolly = new lambda.Function(this, "LambdaPolly", {
      runtime: lambda.Runtime.NODEJS_16_X, 
      functionName: "lambda-for-poly",
      code: lambda.Code.fromAsset("../lambda-polly"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        CDN: 'https://'+distribution.domainName+'/',
        sqsPollyUrl: queuePolly.queueUrl,
        topicArn: topic.topicArn,
        bucketName: s3Bucket.bucketName
      }
    }); 
    lambdaPolly.addEventSource(new SqsEventSource(queuePolly)); 
    topic.grantPublish(lambdaPolly);
    s3Bucket.grantWrite(lambdaPolly);

    const PollyPolicy = new iam.PolicyStatement({  // poloy policy
      actions: ['polly:*'],
      resources: ['*'],
    });
    lambdaPolly.role?.attachInlinePolicy(
      new iam.Policy(this, 'polly-policy', {
        statements: [PollyPolicy],
      }),
    );

    // role
    const role = new iam.Role(this, "ApiRole", {
      roleName: "api-role-storytime",
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });
    role.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['lambda:InvokeFunction']
    }));
    role.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AWSLambdaExecute',
    }); 
 
    // access log
    const logGroup = new logs.LogGroup(this, 'AccessLogs', {
      logGroupName: `/aws/api-gateway/accesslog-storytime`, 
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
    logGroup.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com')); 
    
    // API Gateway
    const api = new apiGateway.RestApi(this, 'api-storytime', {
      description: 'API Gateway',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      binaryMediaTypes: ['*/*'], 
      deployOptions: {
        stageName: stage,
        
        // logging for debug
        loggingLevel: apiGateway.MethodLoggingLevel.INFO, 
        dataTraceEnabled: true,

        // trace access log
        accessLogDestination: new apiGateway.LogGroupLogDestination(logGroup),    
        accessLogFormat: apiGateway.AccessLogFormat.jsonWithStandardFields()  
      },
    });  

    // POST method
    const resourceName = "upload";
    const upload = api.root.addResource(resourceName);
    upload.addMethod('POST', new apiGateway.LambdaIntegration(lambdaUpload, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:true, 
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
      value: api.url+'upload',
      description: 'The url of API Gateway',
    }); 

    // register api gateway into cloudfront 
    const myOriginRequestPolicy = new cloudFront.OriginRequestPolicy(this, 'OriginRequestPolicyCloudfront', {
      originRequestPolicyName: 'QueryStringPolicyCloudfront',
      comment: 'Query string policy for cloudfront',
      cookieBehavior: cloudFront.OriginRequestCookieBehavior.none(),
      headerBehavior: cloudFront.OriginRequestHeaderBehavior.none(),
      queryStringBehavior: cloudFront.OriginRequestQueryStringBehavior.allowList('deviceid'),
    });

    distribution.addBehavior("/upload", new origins.RestApiOrigin(api), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: myOriginRequestPolicy,
      allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,  
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      // viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.ALLOW_ALL,
    });    

    new cdk.CfnOutput(this, 'uploadUrl', {
      value: 'https://'+distribution.domainName+'/upload.html',
      description: 'The url of file upload',
    }); 
  } 
}