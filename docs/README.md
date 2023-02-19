# AWS Console에서 Storytime 배포

아래와 같이 AWS Console에서 각 코드를 작성하는 절차에 대해 설명하고 있습니다.

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


## 실행결과

[테스트 및 결과](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/test.md)

파일을 업로드하여 테스트틑 하는 방법과 예상되는 결과를 검토합니다. 

참고: [API Gateway Log 설정](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/api-gateway-log.md)은
API Gataway에 대한 로그를 CloudWatch에서 확인하기 위한 설정 방법입니다. 

## 정리하기 

[서버 삭제](https://github.com/kyopark2014/simple-serverless-storytime/blob/main/docs/clean-up.md)에 따라 사용한 리소스를 정리합니다.

## Source Codes
Lambda upload와 notification 에 대한 코드 및 설명은 아래를 참조 바랍니다. 

[[Github: Lambda-upload]](https://github.com/kyopark2014/simple-serverless-storytime-for-upload)

[[Github: Lambda-rekognition]](https://github.com/kyopark2014/simple-serverless-storytime-for-rekognition)

[[Github: Lambda-polly]](https://github.com/kyopark2014/simple-serverless-storytime-for-polly)

