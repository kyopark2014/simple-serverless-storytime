# 서버 삭제

더이상 서버를 사용하지 않는 경우에 서버를 삭제하는 방법에 대해 기술합니다. 

## 1. SQS 삭제

1) SQS Console에 접속합니다. 

https://ap-northeast-2.console.aws.amazon.com/sqs/v2/home?region=ap-northeast-2#/queues


2) [sqs-simple-storytime-for-polly]와 [sqs-simple-storytime-for-rekognition]을 차례로 선택후, [Delete]를 선택합니다. 

<img width="1317" alt="image" src="https://user-images.githubusercontent.com/52392004/156905831-74869469-b611-4bf0-b0e3-f5d1c6751061.png">

3) 팝업이 나오면, [Delete]를 선택하여 삭제합니다. 

<img width="593" alt="image" src="https://user-images.githubusercontent.com/52392004/156905856-2f56e374-9f05-4c13-8929-12f88e9dc77a.png">


## 2. SNS 삭제 

1) SNS Console에 접속합니다. 

https://ap-northeast-2.console.aws.amazon.com/sns/v3/home?region=ap-northeast-2#/topics

2) [sns-simple-storytime]를 선택후 [Delete]를 선택합니다. 

![noname](https://user-images.githubusercontent.com/52392004/156905939-afa7a87c-85b8-4403-bd50-b0e717de5857.png)

3) 팝업에서 [Delete]를 선택하여 삭제합니다. 

<img width="596" alt="image" src="https://user-images.githubusercontent.com/52392004/156905959-f33a0b24-5256-4282-a9d4-760de2c0d0d6.png">

## 3. Lambda 삭제

1) Lambda Console에 접속합니다. 

https://ap-northeast-2.console.aws.amazon.com/lambda/home?region=ap-northeast-2#/functions

2) [lambda-simple-storytime-for-upload], [lambda-simple-storytime-for-rekognition], [lambda-simple-storytime-for-polly]을 선택후 [Actions]에서 [Delete]를 선택합니다. 

<img width="1362" alt="image" src="https://user-images.githubusercontent.com/52392004/156906011-5b362234-9532-45e9-9764-ccfaa536ed36.png">


3) 팝업에서 Delete를 선택하여 삭제합니다. 

<img width="814" alt="image" src="https://user-images.githubusercontent.com/52392004/156906022-1508026b-cc4a-47c1-9ef1-554af4f06186.png">


## 4. CloudFront 삭제

1) CloudFront Console에 접속합니다. 

https://console.aws.amazon.com/cloudfront/v3/home?region=ap-northeast-2#/distributions

2) Simple Storytime과 관련된 CloudFront를 선택하여 먼저 [Disable] 합니다. Origins가 "s3-simple-storytime"로 시작하므로 쉽게 찾을 수 있습니다. 

<img width="1408" alt="image" src="https://user-images.githubusercontent.com/52392004/156906083-5fd1698f-a627-46f5-80d1-74c33f7f91d5.png">

Disable 되는데 수분이상이 소요됩니다. [Detail]에서 "Deploying"이면 대기합니다.

![noname](https://user-images.githubusercontent.com/52392004/156906126-4a55e580-e8d5-4e7f-9bc5-aad63f9cb039.png)

Deploying이 완료되면, [Delete]를 선택합니다. 

<img width="1414" alt="image" src="https://user-images.githubusercontent.com/52392004/156906155-a644cc28-2807-4725-b494-058a6fd335c1.png">

팝업에서 [Delete]를 선택하여 삭제합니다. 

<img width="592" alt="image" src="https://user-images.githubusercontent.com/52392004/156906168-f49d41f3-51f6-4144-9306-25b5cd6bb150.png">

## 5. S3 삭제

1) S3 Console에 접속합니다.

https://s3.console.aws.amazon.com/s3/home?region=ap-northeast-2

2) [s3-simple-storytime]에 진입하여 남아있는 Objects를 모두 선택하여 [Delete] 합니다. 

![image](https://user-images.githubusercontent.com/52392004/156906260-ab42a276-7f1a-4ddb-985c-1fe11a042a19.png)

3) [Amazon S3] - [Buckets]에서 [s3-simple-storytime]을 선택하여 [Delete]를 선택합니다. 

![image](https://user-images.githubusercontent.com/52392004/156906325-cc71de94-405d-496e-bb47-072111f7c4fe.png)

4) [Delete bucket]을 선택하여 삭제합니다. 

![image](https://user-images.githubusercontent.com/52392004/156906342-d1a9ffeb-14c1-4798-9bf6-5a69e9112821.png)


## 6. API Gateway 삭제

1) API Gateway Console에 접속합니다. 

https://ap-northeast-2.console.aws.amazon.com/apigateway/main/apis?region=ap-northeast-2

2) [api-simple-storytime]을 선택한 후에 [Actions]에서 [Delete]를 선택합니다. 

<img width="1408" alt="image" src="https://user-images.githubusercontent.com/52392004/156906378-94ef8d2a-b8ba-43e3-abd0-b56747821eca.png">

3) 팝업에서 [Delete]를 선택하여 삭제합니다. 

<img width="595" alt="image" src="https://user-images.githubusercontent.com/52392004/156906385-c3b6edd2-9096-4c84-b72c-04ddb65c2469.png">


