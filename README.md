# Simple Serverless Voice Book Creater

serverless architecture에 기반한 voice book creator를 간단하게 구현하고자 합니다.
이를 위한 구조는 아래와 같습니다.



<img width="1195" alt="image" src="https://user-images.githubusercontent.com/52392004/154789870-4c21323d-6c01-4999-aac1-0119fdb71c02.png">




## API Gateway 설정

아래의 가이드 문서를 참조하여 “api-simple-voicebookcreator” 생성합니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/api-gateway.md

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/api-gateway-log.md

생성된 URL은 아래와 같습니다. 

Invoke URL: https://spzxqv5ftg.execute-api.ap-northeast-2.amazonaws.com/dev
 
 
 
![image](https://user-images.githubusercontent.com/52392004/154822165-12cc6d89-0645-4d65-9f27-03244f28f21f.png)



## Lambda for Upload 설정 

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
            "Resource": "arn:aws:sqs:ap-northeast-2:677146750822:sqs-simple-voicebookcreator-for-rekognition"
        }
```


![image](https://user-images.githubusercontent.com/52392004/154795646-bf3ba7c8-f10d-43f7-bb4d-f11d63ba35e8.png)


아래 github를 다운로드하여 “deploy.zip” 파일을 lambda에 [Deploy] 합니다.

```c
git clone https://github.com/kyopark2014/simple-severless-voicebookcreator-upload
```



## S3 구현

아래 문서를 참조하여 “s3-simple-serverless-voicebookcreator” 이름의 S3을 생성합니다. 다만, 아래 문서에서는 S3 put event를 통해 Lambda를 호출하고 있지, 본 문서에서는 event notification trigger를 사용하지 않습니다. 
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

아래 github를 다운로드하여 “deploy.zip” 파일을 lambda에 [Deploy] 합니다.

```c
$ git clone https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-polly
```


## SNS 구현 

아래 문서를 참조하여 “sns-simple-voicebookcreator”을 생성합니다. 

https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/sns.md






## SQS 설정      

아래 문서에 따라 “sqs-simple-voicebookcreator-for-rekognition”을 생성합니다. 

https://github.com/kyopark2014/simple-serverless-voicebookcreator/blob/main/docs/sqs.md

또한, “sqs-simple-voicebookcreator-for-poly”를 추가로 생성합니다. Trigger AWS Lambda function에는 “lambda-simple-voicebookcreator-for-polly”를 선택하여야 하므로, 아래와 같이 “arn:aws:lambda:ap-northeast-2:*****:function:lambda-simple-voicebookcreator-for-polly”을 선택하고 [Save] 합니다.



<img width="955" alt="image" src="https://user-images.githubusercontent.com/52392004/154823982-cfb18c73-2ace-431c-bfa4-f8809efb2c52.png">


생성된 URL 정보는 https://sqs.ap-northeast-2.amazonaws.com/677146750822/sqs-simple-voicebookcreator-for-polly 입니다. 





     
  
  
