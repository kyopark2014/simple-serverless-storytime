# Simple Serverless Voice Book Creater

serverless architecture에 기반한 voice book creator를 간단하게 구현하고자 합니다.
이를 위한 구조는 아래와 같습니다.



<img width="1195" alt="image" src="https://user-images.githubusercontent.com/52392004/154789870-4c21323d-6c01-4999-aac1-0119fdb71c02.png">




## API Gateway 구현

아래의 가이드 문서를 참조하여 “api-simple-voicebookcreator” 생성합니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/api-gateway.md

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/api-gateway-log.md

생성된 URL은 아래와 같습니다. 

Invoke URL: https://spzxqv5ftg.execute-api.ap-northeast-2.amazonaws.com/dev
 
 
 
![image](https://user-images.githubusercontent.com/52392004/154822165-12cc6d89-0645-4d65-9f27-03244f28f21f.png)

Mapping Templates 등록시, image/jpeg 뿐 아니라, application/octet-stream, image/jpg, image/png도 아래와 같이 추가합니다.

<img width="686" alt="image" src="https://user-images.githubusercontent.com/52392004/155043574-9489624b-c4dd-4c4a-8f0b-252d77d36e2d.png">


## Lambda for Upload 구현

아래 문서를 참조하여 “lambda-simple-voicebookcreator-upload”을 생성합니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/lambda-upload.md

SQS를 위한 Permission을 추가합니다. 

```c
        {
            "Effect": "Allow",
            "Action": [
              "sqs:SendMessage",
              "sqs:DeleteMessage",
              "sqs:ChangeMessageVisibility",
              "sqs:ReceiveMessage",
              "sqs:TagQueue",
              "sqs:UntagQueue",
              "sqs:PurgeQueue",
              “sqs:GetQueueAttributes”
            ],
            "Resource": "arn:aws:sqs:ap-northeast-2:****:sqs-simple-voicebookcreator-for-rekognition"
        }
```

<img width="945" alt="image" src="https://user-images.githubusercontent.com/52392004/154827019-799cb155-fa67-4880-9c5d-6f8e89df91fc.png">

아래 github를 다운로드하여 “deploy.zip” 파일을 lambda에 [Deploy] 합니다.

```c
$ git clone https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-upload
```


## S3 구현

아래 문서를 참조하여 “s3-simple-serverless-voicebookcreator” 이름의 S3을 생성합니다. 다만, 아래 문서에서는 S3 put event를 통해 Lambda를 호출하고 있지만, 여기에서는 event notification trigger를 사용하지 않습니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/S3.md



## Lambda for Rekognition 구현

아래 문서를 참조하여 “lambda-simple-voicebookcreator-for-rekognition”을 생성합니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/lambda-upload.md

SQS를 위한 Permission을 추가합니다. 

```java
        {
            "Effect": "Allow",
            "Action": [
              "sqs:SendMessage",
              "sqs:DeleteMessage",
              "sqs:ChangeMessageVisibility",
              "sqs:ReceiveMessage",
              "sqs:TagQueue",
              "sqs:UntagQueue",
              "sqs:PurgeQueue",
              "sqs:GetQueueAttributes"
            ],
            "Resource": "arn:aws:sqs:ap-northeast-2:****:sqs-simple-voicebookcreator-for-polly"
        }
```

아래 github를 다운로드하여 “deploy.zip” 파일을 lambda에 [Deploy] 합니다.

```c
$ git clone https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-rekognition
```


## Lambda for Polly 구현

아래 문서를 참조하여 “lambda-simple-voicebookcreator-for-polly”을 생성합니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/lambda-upload.md

SQS를 위한 Permission을 추가합니다. 

```java
        {
            "Effect": "Allow",
            "Action": [
              "sqs:SendMessage",
              "sqs:DeleteMessage",
              "sqs:ChangeMessageVisibility",
              "sqs:ReceiveMessage",
              "sqs:TagQueue",
              "sqs:UntagQueue",
              "sqs:PurgeQueue",
              "sqs:GetQueueAttributes"
            ],
            "Resource": "arn:aws:sqs:ap-northeast-2:****:sqs-simple-voicebookcreator-for-polly"
        }
```            
        
SNS을 위한 Permission을 추가합니다.

```java
	{
            "Effect": "Allow",
            "Action": [
                "sns:Publish",
                "sns:Subscribe",
                "sns:CreateTopic",
                "sns:GetTopicAttributes",
                "sns:SetTopicAttributes",
                "sns:TagResource",
                "sns:UntagResource",
                "sns:ListTagsForResource",
                "sns:ListSubscriptionsByTopic"
            ],
            "Resource": [
                "arn:aws:sns:ap-northeast-2:****:sns-simple-voicebookcreator"
            ]
        }
```


Polly가 S3에 mp3 파일을 저장하기 위한 퍼미션을 추가합니다.  이때, Resource는 “*"로 하여야 합니다. 

```java
        {
            "Effect": "Allow",
            "Action": [
                "s3:Put*",
                "s3:Get*",
                "s3:List*",
                "s3:Delete*"
            ],
            "Resource": [
                "*"
            ]
        }
```

아래 github를 다운로드하여 “deploy.zip” 파일을 lambda에 [Deploy] 합니다.

```c
$ git clone https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-polly
```


## SNS 구현 

아래 문서를 참조하여 “sns-simple-voicebookcreator”을 생성합니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/sns.md






## SQS 구현       

아래 문서에 따라 “sqs-simple-voicebookcreator-for-rekognition”을 생성합니다. 

https://github.com/kyopark2014/simple-serverless-voicebookcreator/blob/main/docs/sqs.md

또한, “sqs-simple-voicebookcreator-for-poly”를 추가로 생성합니다. Trigger AWS Lambda function에는 “lambda-simple-voicebookcreator-for-polly”를 선택하여야 하므로, 아래와 같이 “arn:aws:lambda:ap-northeast-2:*****:function:lambda-simple-voicebookcreator-for-polly”을 선택하고 [Save] 합니다.



<img width="955" alt="image" src="https://user-images.githubusercontent.com/52392004/154823982-cfb18c73-2ace-431c-bfa4-f8809efb2c52.png">


생성된 URL 정보는 https://sqs.ap-northeast-2.amazonaws.com/****/sqs-simple-voicebookcreator-for-polly 입니다. 



## Related lambda projects

### Save image into S3 and push to SQS
https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-upload

### AWS Rekognition
https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-rekognition

### AWS Poly
https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-polly


## 시험방법

1) Postman에서 시험하는 경우에 아래와 같이 Content-Type과 Content-Disposition을 설정후, Binary를 첨부하여 테스트 합니다. 


![image](https://user-images.githubusercontent.com/52392004/154842185-1ca3ecfb-0081-4977-bca4-e499cb1149b2.png)


2) Curl로 시험하는 경우 

```c
$ curl -i https://spzxqv5ftg.execute-api.ap-northeast-2.amazonaws.com/dev/upload -X POST --data-binary '@sample.jpeg' -H 'Content-Type: image/jpeg' -H 'Content-Disposition: form-data; name="sample"; filename="sample.jpeg"'
HTTP/2 200
date: Sun, 20 Feb 2022 12:23:41 GMT
content-type: application/json
content-length: 127
x-amzn-requestid: 554a5b3b-859b-41eb-90b2-fdf83ef13339
x-amz-apigw-id: N1zfrFXuIE0FvJw=
x-amzn-trace-id: Root=1-621232c8-37a90762301f99e01dc8c15e;Sampled=0

{"statusCode":200,"body":"{\"Bucket\":\"s3-simple-voicebookcreator\",\"Key\":\"sample3.jpeg\",\"ContentType\":\"image/jpeg\"}"}
```

3) 안드로이드 앱에서 하는 방법

아래의 "API Tester: Debug requests"을 다운받습니다.

<img width="327" alt="image" src="https://user-images.githubusercontent.com/52392004/154988722-d2a1c1bd-6db9-4c7e-9bb2-65d010e0bcfe.png">

아래와 같이 서버주소를 입력하고, Params에서 Binary를 선택한다음 원하는 사진을 선택합니다. 여기서 Headers의 Content-Type은 application/octet-stream을 그래도 유지하여도 정상적으로 동작합니다.

<img width="331" alt="image" src="https://user-images.githubusercontent.com/52392004/154989248-b01fa100-076f-4895-a8c1-d4fef7dac2dc.png">

상단의 화살표 모양의 아이콘을 선택하여 발송하고 메일로 정상적으로 mp3로 된 음성파일이 들어오는지 확인합니다.

## 결과 

아래와 같이 지정된 메일로 링크를 포함한 결과가 전달됩니다. 링크 선택시 CloudFront를 통해 다운로드된 컨텐츠가 정상적으로 재생되는것을 확인합니다.


<img width="1017" alt="image" src="https://user-images.githubusercontent.com/52392004/154885543-97323489-9d01-45c4-8d96-f62012448889.png">


Sample : https://github.com/kyopark2014/simple-serverless-voicebookcreator/blob/main/sample.jpeg

<img width="1267" alt="image" src="https://user-images.githubusercontent.com/52392004/154887184-977b2876-144a-4b22-9bfa-1e71933172e3.png">


Result : https://github.com/kyopark2014/simple-serverless-voicebookcreator/blob/main/sample-result.mp3
      
  
  

