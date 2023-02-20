# 완전관리형 AI 서비스를 활용하여 서버리스로 책 읽어주는 서비스 이용하기

[카메라로 사진을 찍으면 번역](https://itslim.tistory.com/302)을 해주거나 [카메라로 찍은 이미지를 읽어주는 앱](https://youtu.be/G4sZSjAxGAQ)은 머신 러닝(Machine Learning) 기술을 활용하고 있습니다. 이런 머신 러닝 모델을 직접 개발하는것은 상당한 기술적 노하우를 요구합니다. Amazon에서는 SageMaker와 같이 머신 러닝 모델을 개발하는 서비스 이외에도 다양한 완전관리형 AI(Managed AI) 서비스를 제공하고 있어서 머신 러닝에 숙련된 인력이 없더라도 머신 러닝 기반의 서비스를 쉽게 개발할 수 있습니다. 본 게시글에서는 Amazon의 완전관리형 AI 서비스들을 활용하여 사진에서 문장을 추출해서 읽어주는 서비스인 Story Time을 구현하고자 합니다. 이를 통해 머신러닝 기반으로 이미지에서 텍스트틀 추출하고 텍스트를 음성으로 변환하는 방법을 이해할 수 있습니다. 


## Story Time의 Architecture

전체적인 Architecture는 아래와 같습니다. Amazon Rekognition을 이용하여 이미지에서 텍스트를 추출하고 Amazon Polly를 이용하여 텍스트를 음성으로 변환합니다. 두 완전관리형 AI 서비스를 [event driven 형태](https://aws.amazon.com/ko/blogs/compute/building-event-driven-architectures-with-amazon-sns-fifo/)의 효율적인 시스템으로 구현하기 위하여 AWS Lambda와 Amazon SQS를 사용합니다. Amazon Serverless로 시스템을 구성하므로 유지보수면에서 효율적일 뿐 아니라, 변동하는 트래픽에서도 auto scaling 통해 시스템을 안정적으로 운용할 수 있습니다. 여기서 제안하는 Architecture는 API Gateway를 Endpoint로 하는 API 서버로도 활용가능하지만 일반적인 사용자의 사용성을 고려하여 CloudFront를 이용해 Web 방식으로 구현하였습니다. 

![image](https://user-images.githubusercontent.com/52392004/219974834-784347ea-709f-4cb5-80e9-2c9dd3ee0140.png)

주요 사용 시나리오는 아래와 같습니다.
 
단계 1: 사용자가 웹브라우저를 이용하여 CloudFront의 도메인으로 접속을 시도합니다. 

단계 2: CloudFront와 연결된 S3 bucket에서 html 파일을 로드합니다.

단계 3: 사용자는 음성으로 듣고자 하는 이미지 파일을 선택하여 업로드를 시작합니다. 

단계 4: 파일 업로드 요청은 RESTful 방식이므로 API Gateway의 "/upload" 리소스로 POST Method 방식으로 전달됩니다.

단계 5: API Gateway와 연결된 Lambda는 HTTPS POST의 body에 있는 binary image를 로드하여 Base64로 디코딩후에 S3에 저장합니다. 이후 저장된 파일의 bucket, key와 unique한 request ID를 SQS에 전송합니다.

단계 6: 단계 5에서 SQS에 전달한 event가 Lambda를 trigger하면 Rekognition에 이미지 정보를 전달하여 텍스트를 추출합니다. 이후 추출된 텍스트와 request ID를 포함한 정보를 SQS에 전달합니다.

단계 7: 단계 6에서 SQS에 입력한 event가 Lambda를 trigger하면 Polly에 텍스트를 전달하여 음성파일(mp3)을 생성합니다. 생성된 음성파일에 대한 정보인 bucket 이름, key값, request ID을 SNS에 전달합니다. 

단계 8: Polly는 생성한 음성파일(mp3)을 지정된 S3 bucket에 저장합니다. 이 S3 bucket은 CloudFront를 통해 외부에 공유 될 수 있습니다. 

단계 9: SNS는 기등록된 이메일 주소로 음성 파일의 URL 정보를 전달합니다. 

단계 10: 사용자는 이메일의 링크를 선택하여 음성파일을 들을 수 있습니다. 


시스템 동작은 [Sequence Diagram](https://user-images.githubusercontent.com/52392004/156734540-1f4115ac-8ebc-436a-8aad-9be354a6b3a3.png)을 참고합니다.

![image](https://user-images.githubusercontent.com/52392004/156734540-1f4115ac-8ebc-436a-8aad-9be354a6b3a3.png)



## 상세 시스템 구성

### 파일을 업로드하는 Lambda의 구현

[index.js](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/lambda-upload/index.js)에서는 API Gateway로 인입된 이미지 데이터를 base64로 decoding한 후에 S3에 저장합니다. 이후 사용자의 요청(Request)를 json 형태의 event로 만들어서 SQS에 전송합니다. 

API Gateway가 lambda로 전달한 event에는 바이너리 이미지 파일, Contents-Type, 파일 이름과 같은 정보가 있습니다. 이를 아래와 같이 추출합니다. 또한, [uuid](https://en.wikipedia.org/wiki/Universally_unique_identifier)를 생성하여 event를 구분하기 위한 ID로 활용하고, 사용자의 요청에 파일이름이 없는 경우에는 uuid를 파일 이름으로 사용합니다.

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

[S3 putObject](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property)을 이용하여 아래와 같이 파일을 업로드합니다.

```java
const destparams = {
    Bucket: bucketName, 
    Key: filename,
    Body: body,
    ContentType: contentType
};
await s3.putObject(destparams).promise(); 
```

업로드된 파일의 정보를 [SQS로 전송](https://docs.aws.amazon.com/ko_kr/sdk-for-javascript/v2/developer-guide/sqs-examples-send-receive-messages.html)합니다. 이때 파일의 정보는 uuid로 만든 unique한 ID와 이미지 파일에 대한 bucket 이름 및 파일 이름입니다. 

```java
const fileInfo = {
    Id: uuid,
    Bucket: bucketName, 
    Key: filename,
}; 

let params = {
    DelaySeconds: 10,
    MessageAttributes: {},
    MessageBody: JSON.stringify(fileInfo), 
    QueueUrl: sqsRekognitionUrl
};         
await sqs.sendMessage(params).promise();  
```

## Rekognition에 텍스트 추출을 요청하는 Lambda의 구현

[index.js](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/lambda-rekognition/index.js)에서는 Rekognition을 이용하여 텍스트를 추출하고, SQS에 음성 파일로 변환해야 할 텍스트 정보를 전달합니다. 


SQS로 부터 Lambda로 전달된 event에서 bucket 이름과 key를 추출하여 아래처럼 [Rekognition에 text 추출](https://docs.aws.amazon.com/ko_kr/rekognition/latest/dg/text-detection.html)을 요청합니다. 

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

Rekognition이 전달한 text 정보는 위치 정보를 포함하고 있습니다. 이를 읽어주기 위해서는 아래와 같이 하나의 문장으로 변환하여야 합니다. 여기에서는 Rekognition이 LINE으로 분류한 text를 모아서 문장을 생성합니다.  

```java
let text = "";   
for (let i = 0; i < data.TextDetections.length; i++) {
    if(data.TextDetections[i].Type == 'LINE') {
        text += data.TextDetections[i].DetectedText;
    }
}
```

Rekognition을 통해 추출한 문장과 이미지 파일에 대한 bucket 이름 및 key등을 아래와 같이 SQS에 전송합니다. 

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


## Polly에 텍스트를 음성으로 변환을 요청하는 Lambda의 구현

[index.js](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/lambda-polly/index.js)에서는 이미지에서 추출한 문장을 Polly에 음성 파일로 변환을 요청하고, 결과를 사용자에게 보내기 위해서 SNS로 전송합니다. 

SQS로 부터 얻은 event에서 text와 bucket 이름을 추출하여 [Polly에게 음성으로 변환](https://docs.aws.amazon.com/polly/latest/dg/API_StartSpeechSynthesisTask.html)을 요청합니다. 

```java
const body = JSON.parse(event['Records'][0]['body'])
const bucket = body.Bucket;
const text = body.Text;

let pollyParams = {
    OutputFormat: "mp3",
    OutputS3BucketName: bucket,
    Text: text,
    TextType: "text",
    VoiceId: "Ivy",  // child girl
    Engine: 'neural',
};

pollyResult = await polly.startSpeechSynthesisTask(pollyParams).promise();       
const pollyUrl = pollyResult.SynthesisTask.OutputUri;
const fileInfo = path.parse(pollyUrl);
key = fileInfo.name + fileInfo.ext;
```

추출된 음성파일 결과를 사용자에게 URL로 전달하기 위해서 CloudFront의 도메인 정보를 이용하여 URL을 생성합니다. 또한 메시지에는 추출된 텍스트 결과도 아래와 같이 [SNS에 message로 publish](https://docs.aws.amazon.com/sns/latest/api/API_Publish.html)합니다. 

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

### 웹브라우저에서 파일 업로드 구현

[upload.html](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/html/upload.html)의 java script는 바이너리 타입으로 이미지 파일을 업로드하기 위하여 [Blob](https://developer.mozilla.org/ko/docs/Web/API/Blob)을 사용합니다. 

```java
const uri = "https://d1kpgkk8y8p43t.cloudfront.net/upload";
const xhr = new XMLHttpRequest();

xhr.open("POST", uri, true);
var blob = new Blob([file], {type: 'image/jpeg'});
xhr.send(blob);
```

### AWS CDK로 리소스 생성 코드 준비

AWS 리소스를 효과적으로 배포하기 위하여 [IaC 툴](https://en.wikipedia.org/wiki/Infrastructure_as_code)인 CDK를 이용해 배포하고자 합니다. 여기서 CDK는 Typescript를 이용해 구현합니다. 

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

결과를 사용자에게 전달하기 위하여 SNS를 생성합니다. 

```java
const topic = new sns.Topic(this, 'SNS', {
  topicName: 'sns'
});
topic.addSubscription(new subscriptions.EmailSubscription(email));
```

Rekognition과 Polly를 위한 SQS를 정의합니다.
```java
const queueRekognition = new sqs.Queue(this, 'QueueRekognition', {
  queueName: "queue-rekognition",
});

const queuePolly = new sqs.Queue(this, 'QueuePolly', {
  queueName: "queue-polly",
});
```

파일 업로드를 처리하는 Lambda를 생성하고 SQS와 S3에 대한 퍼미션을 부여합니다. 

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

Rekognition에 텍스트 추출을 의뢰하는 Lambda를 정의합니다. Upload Lambda가 SQS에 저장한 event를 받기위하여 [SQS Event Source]를 등록하고, SQS 전송, S3 읽기, Rekogrnition에 대한 퍼미션을 부여합니다. 

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

텍스트를 음성파일로 변환하도록 Polly에 요청하는 Lambda를 생성합니다. 이때 Lambda는 Rekognition의 결과가 전달되는 SQS를 Event Souce로 등록하고 SNS(topic)에 대한 Publish, S3에 대한 쓰기, 그리고 Polly를 사용할 수 있도록 퍼미션을 추가합니다. 

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

const PollyPolicy = new iam.PolicyStatement({  // polloy policy
  actions: ['polly:*'],
  resources: ['*'],
});
lambdaPolly.role?.attachInlinePolicy(
  new iam.Policy(this, 'polly-policy', {
    statements: [PollyPolicy],
  }),
);
```

API Gateway를 통해 외부에서 요청을 받습니다. 이때 요청(request)의 body에 있는 이미지 파일을 API Gateway에서 받기 위하여 아래처럼 binaryMediaTypes를 설정하고 proxy 모드로 동작합니다.

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

[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) 회피를 위해 API Gateway로 구현한 Upload API는 CloudFront를 이용해 URL Routing을 수행합니다. 파일 업로드는 POST method를 사용하므로 allowedMethods를 cloudFront.AllowedMethods.ALLOW_ALL로 설정하여 POST method를 허용하여야 합니다. 

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

<!--
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

-->






## 직접 실습 해보기

### Cloud9 생성

AWS Cloud9을 활용하면 브라우저만으로 코드를 작성, 실행 및 디버깅을 쉽게 할 수 있으며, 배포(Deployment)를 위한 편리한 환경을 생성할 수 있습니다. 여기서는 편의상 한국리전을 사용하여 Cloud9 으로 인프라를 생성합니다.

[Cloud9 console](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/)로 진입하여 [Create environment]를 선택한 후에 아래처럼 Name을 입력합니다. 여기서는 "Storytime"이라고 입력하였습니다. 이후 나머지는 기본값을 유지하고 [Create]를 선택합니다.


![noname](https://user-images.githubusercontent.com/52392004/219947047-51cd8be9-c3c1-4d69-9322-b6af1d5b335b.png)

Cloud9이 생성되면 [Open]후 아래처럼 Terminal을 준비합니다. 

![noname](https://user-images.githubusercontent.com/52392004/219947426-13156f52-4e08-437d-87d1-6ff0302a3d95.png)


### CDK로 솔루션 배포하기

아래와 같이 소스를 다운로드합니다.

```java
git clone https://github.com/kyopark2014/simple-serverless-storytime
```

"cdk-storytime/lib/cdk-storytime-stack.ts"을 열어서, email 주소를 업데이트 합니다.

![noname](https://user-images.githubusercontent.com/52392004/219948651-c724d298-aac6-427c-b072-5ed6edea6fcb.png)


터미널로 돌아가서, CDK 폴더로 이동한 후에 CDK v2.64.0을 설치합니다.

```java
cd simple-serverless-storytime/cdk-storytime && npm install aws-cdk-lib@2.64.0
```

CDK를 처음 사용하는 경우에는 아래와 같이 bootstrap을 실행하여야 합니다. 여기서 account-id은 12자리의 Account Number를 의미합니다. AWS 콘솔화면에서 확인하거나, "aws sts get-caller-identity --query account-id --output text" 명령어로 확인할 수 있습니다.

```java
cdk bootstrap aws://account-id/ap-northeast-2
```

이제 CDK로 전체 인프라를 생성합니다.

```java
cdk deploy
```

정상적으로 인프라가 설치가 되면 아래와 같은 화면이 노출됩니다. 여기서 UploadUrl은 "https://d1kpgkk8y8p43t.cloudfront.net/upload.html" 이고, UpdateCommend는 "aws s3 cp ../html/upload.html s3://cdkstorytimestack-storage8d9329be-1of8fsmmt6vyc"입니다. 

![noname](https://user-images.githubusercontent.com/52392004/219975807-e13508f8-2e80-4620-ad84-3b63021bd3f0.png)



아래와 같이 "html/upload.html" 파일을 오픈하여 UploadUrl 정보를 이용하여 url을 업데이트 합니다. 

![noname](https://user-images.githubusercontent.com/52392004/219948314-514d5c3c-8e9e-4682-9bdc-a41c00d381a4.png)

이제 수정한 upload.html 파일을 아래와 같이 S3 bucket에 복사합니다. 이때의 명령어는 UpdateCommend를 참고합니다.

```java
aws s3 cp ../html/upload.html s3://cdkstorytimestack-storage8d9329be-1of8fsmmt6vyc
```

인프라를 설치하고 나면, CDK 라이브러리에 등록한 이메일 주소로 Confirmation 메시지가 전달됩니다. 이메일을 열어서 아래와 같이 [Confirm subscription]을 선택합니다.

![noname](https://user-images.githubusercontent.com/52392004/219817649-108b5c81-8460-49e3-a4bd-9af1dd5b091b.png)

정상적으로 진행되면 아래와 같은 결과를 얻습니다.

![noname](https://user-images.githubusercontent.com/52392004/219817719-ea749a1a-1b90-406b-94e0-6c28eddb928e.png)



### 실행하기 

로컬 PC에서 [sample.jpeg](https://raw.githubusercontent.com/kyopark2014/simple-serverless-storytime/main/sample.jpeg)을 다운로드 합니다. 이후 웹브라우저를 열어서 CDK 배포시 얻은 UploadUrl로 접속합니다. 여기서는 "https://d1kpgkk8y8p43t.cloudfront.net/upload.html" 로 접속합니다. 아래와 같이 [Choose File] 버튼을 선택하여 sample.jpeg을 선택합니다. 이후, [Send] 버튼을 선택하면 파일이 업로드됩니다. 업로드된 그림에서 아래의 text 영역을 음성으로 변환하고자 합니다.

![noname](https://user-images.githubusercontent.com/52392004/219922550-19eb73f5-ff9f-4dce-96c7-95bb64248c36.png)


### 실행결과

파일을 업로드 한 후에 수십 초가 지나면 아래와 같이 등록한 이메일로 결과가 전달됩니다. Link에는 MP3 파일의 URL 경로가 있어서 사용자가 선택하면 Play할 수 있습니다. 또한 Link 아래에 추출된 텍스트 정보가 전달됩니다. 

![noname](https://user-images.githubusercontent.com/52392004/219922655-92deefd3-4d84-4f5d-bdb7-040bd16553f2.png)

"sample.jpeg"로 부터 텍스트를 추출하여 생성한 음성은 [sample-result.mp3](https://raw.githubusercontent.com/kyopark2014/simple-serverless-storytime/main/sample-result.mp3)에서 확인할 수 있습니다.


## 리소스 정리하기 

더이상 인프라를 사용하지 않는 경우에 아래처럼 모든 리소스를 삭제할 수 있습니다. 

```java
cdk destroy
```


## Reference

[Enabling binary support using the API Gateway console](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings-configure-with-console.html)

[HTML 강의](https://opentutorials.org/module/1892/10966)
