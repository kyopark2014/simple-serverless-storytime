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
