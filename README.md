# 서버리스로 책 읽어주는 서비스를 편리하게 이용하기

## Introduction

[카메라로 사진을 찍으면 번역](https://itslim.tistory.com/302)을 해주거나 [카메라로 찍은 이미지를 읽어주는 앱](https://youtu.be/G4sZSjAxGAQ)은 머신 러닝(Machine Learning) 기술을 활용하고 있습니다. 이런 머신 러닝 모델을 직접 개발하는것은 상당한 기술적 노하우를 요구합니다. Amazon에서는 SageMaker와 같이 머신 러닝 모델을 개발하는 서비스 이외에도 다양한 Managed AI 서비스를 제공하고 있어서 이런 서비스를 쉽게 개발할수 있습니다. 본 게시글에서는 Amazon의 Managed AI 서비스들을 활용하여 사진에서 문장을 추출해서 읽어주는 서비스인 Story Time을 구현하고자 합나다. 이를 통해 머신러닝 기반으로 이미지에서 텍스트틀 추출하하고 텍스트를 음성으로 변환하는 방법을 이해할 수 있습니다. 

아래에서 전체적인 Architecture를 설명하고 있습니다. Amazon Rekognition을 이용하여 이미지에서 텍스트를 추출하고 Amazon Polly를 이용하여 텍스트를 음성으로 변환합니다. 두 서비스를 구동하기 위해서는 AWS Lambda를 이용하여, 효율적인 시스템을 만들기 위하여 각 서비스 사이에는 Amazon SQS를 두어서 event driven 구조로 시스템을 구성합니다. Amazon Serverless로 시스템을 구성하므로 유지보수 및 모니터링에서 불필요한 자원을 최소화하고 시스템을 안정적으로 운용할 수 있습니다. 

<img width="800" alt="image" src="https://user-images.githubusercontent.com/52392004/154789870-4c21323d-6c01-4999-aac1-0119fdb71c02.png">


주요 사용 시나리오는 아래와 같습니다.
 
1) 사용자가 동화책과 같은 읽고자 하는 책을 카메라로 찍습니다.

2) 이미지를 RESTful API를 이용해 API Gateway를 통해 업로드를 합니다. 통신 프로토콜은 https를 이용합니다. 
이후, Lambda for upload는 S3에 파일을 저장하고, Bucket 이름과 Key와 같은 정보를 event로 SQS에 전달합니다. 

3) SQS의 event는 Lambda for Rekognition에 전달되고, 이 정보는 AWS Rekognition를 통해 JSON 형태의 텍스트 정보를 추울합니다. 

4) 텍스트 정보는 다시 SQS를 통해 Lambda for Polly로 전달되는데, JSON 형식의 event에서 텍스트틑 추출하여, AWS Polly를 통해 음성파일로 변환하게 됩니다.

5) 음성파일은 S3에 저장되는데, Lambda for Polly를 이 정보를 CloudForont를 통해 외부에 공유할 수 있는 URL로 변환후, AWS SNS를 통해 사용자에게 이메일로 정보를 전달합니다. 

상세 시나리오는 아래의 Sequence Diagram을 참고 부탁드립니다. 

![image](https://user-images.githubusercontent.com/52392004/156734540-1f4115ac-8ebc-436a-8aad-9be354a6b3a3.png)


## 파일을 업로드하는 Lambda 함수 구현

event로 부터 이미지 데이터와 파일이름을 추출합니다.

```java
const body = Buffer.from(event["body"], "base64");
const header = event['multiValueHeaders'];

if(contentDisposition) {
    filename = cd.parse(contentDisposition).parameters.filename;
}
else { 
    const uuid = uuidv4();
    filename = uuid+'.jpeg';
}
```

S3에 파일을 업로드합니다.

```java
const destparams = {
    Bucket: bucketName, 
    Key: filename,
    Body: body,
    ContentType: contentType
};
await s3.putObject(destparams).promise(); 
```

Queue에 file정보를 event로 넣습니다. 

```java
const fileInfo = {
    Id: uuid,
    Bucket: bucketName, 
    Key: filename,
}; 

let params = {
    DelaySeconds: 10,
    MessageAttributes: {},
    MessageBody: JSON.stringify(fileInfo),  // To-Do: use UUID as a unique id
    QueueUrl: sqsRekognitionUrl
};         
await sqs.sendMessage(params).promise();  
```

## Rekognition에 요청하는 Lambda 구현

Lambda로 들어오는 event에서 bucket 이름과 key를 추출하여 아래처럼 Rekognition에 text 추출을 요청합니다. 

```java
const body = JSON.parse(event['Records'][0]['body']);
const bucket = body.Bucket;
const key = body.Key;

const rekognition = new aws.Rekognition();
const rekognitionParams = {
    Image: {
        S3Object: {
            Bucket: bucket,
            Name: key
        },
    },
}
let data = await rekognition.detectText(rekognitionParams).promise();
```

이미지 추출 결과를 SQS에 저장합니다. 

```java
let sqsParams = {
    DelaySeconds: 10,
    MessageAttributes: {},
    MessageBody: JSON.stringify({
        Id: id,
        Bucket: bucket,
        Key: key,
        Name: name,
        Data: JSON.stringify(data)
    }),  
    QueueUrl: sqsPollyUrl
};
await sqs.sendMessage(sqsParams).promise();   
```

## Polly에 보이스로 변환 요청하는 Lambda 구현

Lambda의 event로부터 text를 추출합니다. 

```java
const body = JSON.parse(event['Records'][0]['body']);
const data = JSON.parse(body.Data);
let text = "";
for (let i = 0; i < data.TextDetections.length; i++) {
    if(data.TextDetections[i].Type == 'LINE') {
        text += data.TextDetections[i].DetectedText;
    }
}
```

Polly에 오디오변환 요청을 하고 결과에서 key 값을 추출합니다. 

```java
let polyParams = {
    OutputFormat: "mp3",
    OutputS3BucketName: bucket,
    Text: text,
    TextType: "text",
    VoiceId: "Ivy",  // child girl
    Engine: 'neural',
};

pollyResult = await polly.startSpeechSynthesisTask(polyParams).promise();       
const pollyUrl = pollyResult.SynthesisTask.OutputUri;
const fileInfo = path.parse(pollyUrl);
key = fileInfo.name + fileInfo.ext;
```

SNS에 결과를 전달하도록 요청합니다.

```java
const CDN = process.env.CDN; 
const topicArn = process.env.topicArn;

let url = CDN+key
let snsParams = {
    Subject: 'Get your voice book generated from '+name,
    Message: '('+id+') Link: '+url+'\n'+text,         
    TopicArn: topicArn
}; 
await sns.publish(snsParams).promise();
```

## CDK로 배포 준비

S3를 생성하고 CloudFront와 연결합니다. 

```java
const s3Bucket = new s3.Bucket(this, "storage",{
    // bucketName: bucketName,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    publicReadAccess: false,
    versioned: false,
});

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
```

푸쉬 알림을 보내기 위해 SNS를 생성합니다. 

```java
const topic = new sns.Topic(this, 'SNS', {
  topicName: 'sns'
});
topic.addSubscription(new subscriptions.EmailSubscription(email));
new cdk.CfnOutput(this, 'snsTopicArn', {
  value: topic.topicArn,
  description: 'The arn of the SNS topic',
});
```

아래와 같이 Rekognition과 Polly를 위한 SQS를 정의합니다.
```java
const queueRekognition = new sqs.Queue(this, 'QueueRekognition', {
  queueName: "queue-rekognition",
});

const queuePolly = new sqs.Queue(this, 'QueuePolly', {
  queueName: "queue-polly",
});
```


파일 업로드를 처리하는 lambda를 생성하고 SQS와 S3에 대한 퍼미션을 부여합니다. 

```java
const lambdaUpload = new lambda.Function(this, "LambdaUpload", {
  runtime: lambda.Runtime.NODEJS_16_X, 
  functionName: "lambda-for-upload",
  code: lambda.Code.fromAsset("../lambda-upload"), 
  handler: "index.handler", 
  timeout: cdk.Duration.seconds(10),
  environment: {
    sqsRekognitionUrl: queueRekognition.queueUrl,
    topicArn: topic.topicArn,
    bucketName: s3Bucket.bucketName
  }
});  
queueRekognition.grantSendMessages(lambdaUpload);
s3Bucket.grantReadWrite(lambdaUpload);
```

Rekognition에 텍스트 추출을 의뢰하는 Lambda를 정의합니다. 

```java
const lambdaRekognition = new lambda.Function(this, "LambdaRekognition", {
  runtime: lambda.Runtime.NODEJS_16_X, 
  functionName: "lambda-for-rekognition",
  code: lambda.Code.fromAsset("../lambda-rekognition"), 
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

const RekognitionPolicy = new iam.PolicyStatement({  // rekognition policy
  actions: ['rekognition:*'],
  resources: ['*'],
});
lambdaRekognition.role?.attachInlinePolicy(
  new iam.Policy(this, 'rekognition-policy', {
    statements: [RekognitionPolicy],
  }),
);
```

Poly에 텍스트를 보이스로 변환하도록 요청하는 Lambda를 생성합니다.

```java
const lambdaPolly = new lambda.Function(this, "LambdaPolly", {
  runtime: lambda.Runtime.NODEJS_16_X, 
  functionName: "lambda-for-poly",
  code: lambda.Code.fromAsset("../lambda-polly"), 
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

const PollyPolicy = new iam.PolicyStatement({  // poloy policy
  actions: ['polly:*'],
  resources: ['*'],
});
lambdaPolly.role?.attachInlinePolicy(
  new iam.Policy(this, 'polly-policy', {
    statements: [PollyPolicy],
  }),
);
```

API Gateway를 통해 외부에서 요청을 받습니다. 이때 요청(request)의 body에 있는 이미지 파일을 API Gateway로 처리할때는 proxy를 사용하였습니다. 

```java
const stage = "dev";

const api = new apiGateway.RestApi(this, 'api-storytime', {
  description: 'API Gateway',
  endpointTypes: [apiGateway.EndpointType.REGIONAL],
  binaryMediaTypes: ['image/*'], 
  deployOptions: {
    stageName: stage,
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
```



## 왜 이런 Architecture를 선택했는가?

#### Why Event Driven?

Event 방식의 다른 예를 설명합니다.

Event 방식의 장점과 단점은?

Concurrency 방식의 Lambda에도 Event 방식이 여전히 유효한가?


#### Rekognition && Textract

[서버리스로 이미지에서 텍스트 추출하기](https://github.com/kyopark2014/serverless-textextraction)에서 Textract로 동일한 결과를 얻었습니다. (비교 예정)



#### Synchronous && Asynchronous

Synchronous와 Asynchronous를 비교합니다. 

Event를 Synchronous하게 사용했는데 왜? Aysnchrnous하게 하지 않은 이유는? 

Textract 케이스를 보면 Async로 요청하고 Textract가 결과가 나오면 SNS가 받아서 Lambda를 Trigger 시킬수 있어서 SQS 유사함

#### Step Function을 이용하는 경우

Lambda -> SQS -> Lambda 대신에 Step Function을 썼을 때와 비교합니다.

[Blur faces in videos automatically with Amazon Rekognition Video](https://aws.amazon.com/ko/blogs/machine-learning/blur-faces-in-videos-automatically-with-amazon-rekognition-video/)와 비교하여 설명합니다. 








## 배포하기

### AWS Console로 구현하기

[AWS Console로 구현하기](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/deployment-guide-console.md)에서는 각 컴포넌트를 AWS Console에서 구현합니다.

### CDK로 배포하기

Cloud9에서 CDK를 이용해 한번에 배포하는 과정을 설명합니다. 

소스를 다운로드하고 해당 폴더로 이동합니다.

```java
git clone https://github.com/kyopark2014/simple-serverless-storytime
cd simple-serverless-storytime/cdk-storytime 
```

필요한 라이브러리를 설치하고 CDK로 전체 인프라를 설치합니다.

```java
npm install aws-cdk-lib
cdk deply
```

#### 이메일 설정

![noname](https://user-images.githubusercontent.com/52392004/219817649-108b5c81-8460-49e3-a4bd-9af1dd5b091b.png)


![noname](https://user-images.githubusercontent.com/52392004/219817719-ea749a1a-1b90-406b-94e0-6c28eddb928e.png)

#### Curl로 실행하기

#### Web Browser에서 실행하기 

아래와 같이 [Choose File]버튼을 선택하여 [sample.jpeg](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/sample.jpeg)을 선택합니다. 이후, [Send] 버튼을 선택하면 파일이 업로드됩니다. 

![noname](https://user-images.githubusercontent.com/52392004/219922550-19eb73f5-ff9f-4dce-96c7-95bb64248c36.png)


## 실행결과

파일을 업로드 한 후에 수십 초가 지나면 아래와 같이 등록한 이메일로 결과가 전달됩니다. Link에는 MP3 파일의 경로가 있어서 선택하여 Play 할 수 있습니다. Link 아래에는 추출된 텍스트 정보가 전달됩니다. 

![noname](https://user-images.githubusercontent.com/52392004/219922655-92deefd3-4d84-4f5d-bdb7-040bd16553f2.png)

[Sample.jpeg에 대한 결과](https://raw.githubusercontent.com/kyopark2014/simple-serverless-storytime/main/sample-result.mp3)를 선택해서 생성된 MP3를 확인할 수 있습니다. 


## 정리하기 

서버를 더이상 사용하지 않는 경우에 삭제 방법에 대해 기술합니다. 

```java
cdk destroy
```


## Reference

[Enabling binary support using the API Gateway console](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings-configure-with-console.html)
