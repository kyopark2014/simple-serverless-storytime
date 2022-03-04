# Simple Serverless Storytime: AWS 서버리스로 간단하게 책 읽어주는 서비스 만들기

## Introduction

여기에서는 AWS Serverless Architecture에 기반하여 책을 읽어주는 서비스(Storytime)을 구현하고자 합니다.
이번을 통해 이미지에서 텍스트를 추출하는 AWS Rekognition과 텍스트를 음성으로 변환하는 AWS Polly를 사용할 수 있게 됩니다. 더불어 AWS Lambda를 이용해 Serverless로 개발되므로 초기 투자없이 auto scaling이 가능한 비용 효율적인 아키텍트를 설계할 수 있습니다. 아래 그림은 전체적인 Severless Architecture에 구조에 대해 기술하고 있습니다. 

<img width="1195" alt="image" src="https://user-images.githubusercontent.com/52392004/154789870-4c21323d-6c01-4999-aac1-0119fdb71c02.png">


주요 사용 시나리오는 아래와 같습니다.
 
1) 사용자가 동화책과 같은 읽고자 하는 책을 카메라로 찍습니다.

2) 이미지를 RESTful API를 이용해 API Gateway를 통해 업로드를 합니다. 통신 프로토콜은 https를 이용합니다. 
이후, Lambda for upload는 S3에 파일을 저장하고, Bucket 이름과 Key와 같은 정보를 event로 SQS에 전달합니다. 

3) SQS의 event는 Lambda for Rekognition에 전달되고, 이 정보는 AWS Rekognition를 통해 JSON 형태의 텍스트 정보를 추울합니다. 

4) 텍스트 정보는 다시 SQS를 통해 Lambda for Polly로 전달되는데, JSON 형식의 event에서 텍스트틑 추출하여, AWS Polly를 통해 음성파일로 변환하게 됩니다.

5) 음성파일은 S3에 저장되는데, Lambda for Polly를 이 정보를 CloudForont를 통해 외부에 공유할 수 있는 URL로 변환후, AWS SNS를 통해 사용자에게 이메일로 정보를 전달합니다. 

상세 시나리오는 아래의 Sequence Diagram을 참고 부탁드립니다. 

![image](https://user-images.githubusercontent.com/52392004/156734231-3de877e5-4148-428b-850a-f74d38f60520.png)


## Modules

1) [Lambda for upload 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/lambda-for-upload.md)
 
AWS Lambda를 이용해 파일을 업로드하는 코드를 Node.js를 이용해 구현 합니다.

2) [API Gateway 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/api-gateway.md)

RESTful API를 구현하기 위하여 Endpoint로 API Gateway를 구현합니다. 

3) [Lambda for Rekognition 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/lambda-for-rekognition.md)

이미지에서 텍스트를 추출합니다. 

4) [S3 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/s3.md)

Amazon S3를 사용하기 위한 Bucket을 생성합니다. 

5) [CloudFront 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/cloudfront.md)

컨텐츠를 공유하기 위한 CDN으로 CloudFront를 구현합니다. 

6) [Lambda for Polly 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/lambda-for-polly.md)

AWS Polly를 이용해 텍스트틀 mp3로 변환하여 S3에 저장합니다. 

7) [Amazon SNS 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/sns.md)

업로드한 파일을 다운로드 링크를 email로 전달합니다. 

8) [Amazon SQS 구현](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/sqs.md)

각 서비스는 SQS를 통해 버퍼링 됩니다.

9) [테스트 및 결과](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/test.md)

파일을 업로드하여 테스트틑 하는 방법과 예상되는 결과를 검토합니다. 

참고: [API Gateway Log 설정](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/api-gateway-log.md)은
API Gataway에 대한 로그를 CloudWatch에서 확인하기 위한 설정 방법입니다. 

## Source Codes
본 워크샵에 필요한 Lambda upload와 notification 에 대한 코드 및 설명은 아래를 참조 바랍니다. 

[[Github: Lambda-upload]](https://github.com/kyopark2014/simple-serverless-storytime-for-upload)

https://github.com/kyopark2014/simple-serverless-storytime-for-upload

[[Github: Lambda-rekognition]](https://github.com/kyopark2014/simple-serverless-storytime-for-rekognition)

https://github.com/kyopark2014/simple-serverless-storytime-for-rekognition


[[Github: Lambda-polly]](https://github.com/kyopark2014/simple-serverless-storytime-for-polly)

https://github.com/kyopark2014/simple-serverless-storytime-for-polly 

