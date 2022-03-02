---
# 8. Amazon SQS

 
### Aamazon SQS for rekognition 구현 

1) AWS 콘솔에서 Amazon SQS 서비스로 이동합니다. 리전은 서울(ap-northeast-2)을 사용합니다.

https://ap-northeast-2.console.aws.amazon.com/sqs/v2/home?region=ap-northeast-2#/homepage



2) AWS SQS console에 접속해서 [Create queue]를 선택한후, Name에 “sqs-simple-storytime-for-rekognition”로 입력후, 아래로 스크롤하여 [Create queue]를 선택하여 SQS를 생성합니다.

![Create queue](/static/sqs-rekognition-1.png)


3) SQS 생성후 모습은 아래와 같습니다. URL 정보는 Lambda 에서 SQS에 접속하기 위해 사용합니다. 또한 아래와 같이 [Amazon SQS] - [Queues] - [sqs-simple-storytime-for-rekognition]에서 하단의 [Lambda triggers] - [Configure Lambda function trigger]를 선택하여 SQS의 응답을 수신할 Lambda를 지정합니다.

![Lambda tiggers](/static/sqs-rekognition-2.png)


4) [Lambda function]에서 기생성한 "lambda-simple-storytime-for-rekognition”의 arn을 아래와 같이 선택하고 [Save]를 선택합니다.

![Lambda tiggers](/static/sqs-rekognition-3.png)


### Aamazon SQS for polly 구현 

1) AWS 콘솔에서 Amazon SQS 서비스로 이동합니다. 리전은 서울(ap-northeast-2)을 사용합니다.

https://ap-northeast-2.console.aws.amazon.com/sqs/v2/home?region=ap-northeast-2#/homepage



2) AWS SQS console에 접속해서 [Create queue]를 선택한후, Name에 “sqs-simple-storytime-for-polly”로 입력후, 아래로 스크롤하여 [Create queue]를 선택하여 SQS를 생성합니다.

![Create queue](/static/sqs-polly-1.png)


3) SQS 생성후 모습은 아래와 같습니다. URL 정보는 Lambda 에서 SQS에 접속하기 위해 사용합니다. 또한 아래와 같이 [Amazon SQS] - [Queues] - [sqs-simple-storytime-for-polly]에서 하단의 [Lambda triggers] - [Configure Lambda function trigger]를 선택하여 SQS의 응답을 수신할 Lambda를 지정합니다.

![Lambda tiggers](/static/sqs-polly-2.png)


4) [Lambda function]에서 기생성한 "lambda-simple-storytime-for-polly”의 arn을 아래와 같이 선택하고 [Save]를 선택합니다.

![Lambda tiggers](/static/sqs-polly-3.png)
