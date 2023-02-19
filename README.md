# 서버리스로 책 읽어주는 서비스를 편리하게 이용하기

[카메라로 사진을 찍으면 번역](https://itslim.tistory.com/302)을 해주거나 [카메라로 찍은 이미지를 읽어주는 앱](https://youtu.be/G4sZSjAxGAQ)은 머신 러닝(Machine Learning) 기술을 활용하고 있습니다. 이런 머신 러닝 모델을 직접 개발하는것은 상당한 기술적 노하우를 요구합니다. Amazon에서는 SageMaker와 같이 머신 러닝 모델을 개발하는 서비스 이외에도 다양한 Managed AI 서비스를 제공하고 있어서 이런 서비스를 쉽게 개발할 수 있습니다. 본 게시글에서는 Amazon의 Managed AI 서비스들을 활용하여 사진에서 문장을 추출해서 읽어주는 서비스인 Story Time을 구현하고자 합나다. 이를 통해 머신러닝 기반으로 이미지에서 텍스트틀 추출하하고 텍스트를 음성으로 변환하는 방법을 이해할 수 있습니다. 


## Storytime의 Architecture

전체적인 Architecture는 아래와 같습니다. Amazon Rekognition을 이용하여 이미지에서 텍스트를 추출하고 Amazon Polly를 이용하여 텍스트를 음성으로 변환합니다. 두 서비스를 구동하기 위해서는 AWS Lambda를 이용하여, 효율적인 시스템을 만들기 위하여 각 서비스 사이에는 Amazon SQS를 두어서 event driven 구조로 시스템을 구성합니다. Amazon Serverless로 시스템을 구성하므로 유지보수 및 모니터링에서 불필요한 자원을 최소화하고 시스템을 안정적으로 운용할 수 있습니다. 

![image](https://user-images.githubusercontent.com/52392004/219944322-18bbcdcf-0f04-4a2a-9a39-8f49c0ed5028.png)


주요 사용 시나리오는 아래와 같습니다.
 
단계 1: 사용자가 CloudFront 도메인으로 Web 화면에 접속을 시도합니다. 

단계 2: CloudFront와 연결된 S3 bucket에서 html 파일을 로드합니다.

단계 3: 사용자는 Web화면에서 음성으로 듣고자 하는 이미지 파일을 선택하여 업로드를 합니다. 

단계 4: 파일 업로드 요청은 API Gateway의 Restful API인 /upload로 POST Method를 이용해 전달됩니다.

단계 5: API Gateway와 연결된 Lambda는 HTTP POST의 body에 있는 binary image를 로드하여 Base64 디코딩후에 S3에 저장합니다. 이후 저장된 파일의 bucket, key와 unique한 request ID를 SQS에 저장합니다.

단계 6: 단계 5에서 SQS에 입력한 event가 Lambda를 trigger하면 Rekognition에 이미지 정보를 전달하여 텍스트를 추출합니다. 이후 텍스트와 request ID를 포함한 정보를 SQS에 저장합니다.

단계 7: 단계 6에서 SQS에 입력한 event가 Lambda를 trigger하면 Polly에 텍스트를 전달하여 음성파일(mp3)을 생성합니다. 음성파일에 대한 정보인 bucket 이름, key값, request ID을 SNS에 전달합니다. 

단계 8: 생성된 mp3는 S3 bucket에 저장됩니다.

단계 9: SNS는 기등록된 이메일 주소로 음성 파일의 URL 정보를 전달합니다. 

단계 10: 사용자는 이메일의 링크를 선택하여 음성파일을 들을 수 있습니다. 


상세 시나리오는 아래의 Sequence Diagram을 참고 부탁드립니다. 

![image](https://user-images.githubusercontent.com/52392004/156734540-1f4115ac-8ebc-436a-8aad-9be354a6b3a3.png)


## 이미지에서 텍스트를 추출

### 파일을 업로드하는 Lambda 함수 구현

[index.js](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/lambda-upload/index.js)에서는 API Gateway로 인입된 이미지 데이터를 Base64로 decoding하고 S3에 저장한 다음에 SQS에 변환하여야 할 이미지 정보를 push합니다. 

Upload lambda로 전달된 event에는 이미지 파일, Contents-Type, 파일이름이 있습니다. 이를 아래와 같이 추출합니다. 파일이름이 없는 경우에는 uuid로 unique한 이름을 부여하는데, uuid는 이벤트의 구분하기 위한 ID로도 활용됩니다. 

```java
const body = Buffer.from(event["body"], "base64");

const header = event['multiValueHeaders'];

let contentType;
if(header['Content-Type']) {
    contentType = String(header['Content-Type']);
} 

let contentDisposition="";
if(header['Content-Disposition']) {
    contentDisposition = String(header['Content-Disposition']);  
} 
    
let filename = "";
const uuid = uuidv4();
    
if(contentDisposition) {
    filename = cd.parse(contentDisposition).parameters.filename;
}
else { 
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

Queue에 file 정보를 event로 push 합니다. 

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

[index.js](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/lambda-rekognition/index.js)에서는 Rekognition을 이용하여 텍스트를 추출하고, SQS에 음성파일로 변환해야할 텍스트 정보를 전달합니다. 


아래와 같이 Lambda로 들어오는 event에서 bucket 이름과 key를 추출하여 아래처럼 Rekognition에 text 추출을 요청합니다. 

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

텍스트를 추출합니다.

```java
let text = "";   
for (let i = 0; i < data.TextDetections.length; i++) {
    if(data.TextDetections[i].Type == 'LINE') {
        text += data.TextDetections[i].DetectedText;
    }
}
```

추출한 텍스트와 event 정보를 모아서 SQS에 push합니다. 

```java
let sqsParams = {
    DelaySeconds: 10,
    MessageAttributes: {},
    MessageBody: JSON.stringify({
        Id: id,
        Bucket: bucket,
        Key: key,
        Name: name,
        Text: text
    }),  
    QueueUrl: sqsPollyUrl
};
await sqs.sendMessage(sqsParams).promise();   
```




## Polly에 보이스로 변환 요청하는 Lambda 구현

[index.js](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/lambda-polly/index.js)에서는 Polly에 음성파일로 변환을 요청하고, 사용자에게 전달해야할 결과를 SQS에 전송합니다. 

아래와 같이 Lambda의 event로부터 text를 추출히야 Polly에 오디오변환 요청을 하고 결과에서 key 값을 추출합니다. 

```java
const body = JSON.parse(event['Records'][0]['body'])
const bucket = body.Bucket;
const text = body.Text;

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

결과를 SNS에 전달힙니다.

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

### AWS CDK로 리소스 생성 코드 준비

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
```

푸쉬 알림을 보내기 위해 SNS를 생성합니다. 

```java
const topic = new sns.Topic(this, 'SNS', {
  topicName: 'sns'
});
topic.addSubscription(new subscriptions.EmailSubscription(email));
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

텍스트를 음성파일로 변환하도록 Polly에 요청하는 Lambda를 생성합니다.

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
```

API Gateway를 통해 외부에서 요청을 받습니다. 이때 요청(request)의 body에 있는 이미지 파일을 API Gateway로 처리할때는 proxy를 사용하였습니다. 

```java
const stage = "dev";

const api = new apiGateway.RestApi(this, 'api-storytime', {
  description: 'API Gateway',
  endpointTypes: [apiGateway.EndpointType.REGIONAL],
  binaryMediaTypes: ['*/*'], 
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
```

CORS 회피를 위해 API Gateway로 구현한 upload API는 CloudFront와 연동됩니다. 

```java
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








## 직접 실습 해보기

### Cloud9 생성

Storytime을 위한 인프라 생성을 위해 Cloud9 개발환경을 이용합니다. AWS Cloud9을 활용하면 브라우저만으로 코드를 작성, 실행 및 디버깅을 쉽게 할 수 있으며, 배포(Deployment)를 위한 편리한 환경을 생성할 수 있습니다. 여기서는 편의상 한국리전을 사용합니다.

Cloud9을 생성하기 위하여 [Cloud9 console](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/)로 진입하여 [Create environment]를 선택한 후에 아래처럼 Name을 입력합니다. 여기서는 "Storytime"이라고 입력하였습니다. 이후 나머지는 기본값을 유지하고 [Create]를 선택합니다.


![noname](https://user-images.githubusercontent.com/52392004/219947047-51cd8be9-c3c1-4d69-9322-b6af1d5b335b.png)

Cloud9이 생성되면 [Open]후 아래처럼 Terminal을 준비합니다. 


![noname](https://user-images.githubusercontent.com/52392004/219947426-13156f52-4e08-437d-87d1-6ff0302a3d95.png)


### CDK로 솔루션 배포하기

Cloud9에서 CDK를 이용해 한번에 배포하는 과정을 설명합니다. 

아래와 같이 소스를 다운로드합니다.

```java
git clone https://github.com/kyopark2014/simple-serverless-storytime
```

CDK 폴더로 이동하여 필요한 라이브러리를 설치합니다. 여기에서는 CDK2.0에서 v2.64.0을 사용하고 있습니다. 

```java
cd simple-serverless-storytime/cdk-storytime && npm install aws-cdk-lib@2.64.0
```

CDK로 전체 인프라를 설치합니다.

```java
cdk deply
```

정상적으로 인프라가 설치가 되면 아래와 같은 화면이 노출됩니다. 여기서 UploadUr은 "https://d1kpgkk8y8p43t.cloudfront.net/upload.html"이고, UpdateCommend는 "aws s3 cp ./html/upload.html s3://cdkstorytimestack-storage8d9329be-1of8fsmmt6vyc"입니다. 



![noname](https://user-images.githubusercontent.com/52392004/219947952-5c0a8b3c-164e-48fd-bf4a-7d78d4f27fe2.png)





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
