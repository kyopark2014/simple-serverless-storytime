# simple-serverless-voicebookcreater

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



![image](https://user-images.githubusercontent.com/52392004/154795646-bf3ba7c8-f10d-43f7-bb4d-f11d63ba35e8.png)


아래 github를 다운로드하여 “deploy.zip” 파일을 lambda에 [Deploy] 합니다.

``c
git clone https://github.com/kyopark2014/simple-severless-voicebookcreator-upload
```


## Lambda for Rekognition 설정 

아래 문서를 참조하여 “lambda-simple-voicebookcreator-forupload”을 생성합니다. 
https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/lambda-upload.md

SQS를 위한 Permission을 추가합니다. 

``c
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

아래 github를 다운로드하여 “deploy.zip” 파일을 lambda에 [Deploy] 합니다.

``c
git clone https://github.com/kyopark2014/simple-serverless-voicebookcreator-for-rekognition
```





## S3 설정 

아래 문서를 참조하여 “s3-simple-serverless-voicebookcreator” 이름의 S3을 생성합니다. 
https://github.com/kyopark2014/simple-serverless-filesharing/blob/main/docs/S3.md


## SQS 설정      

아래 문서에 따라 “sqs-simple-voicebookcreator-for-rekognition”을 생성합니다. 

SQS 설정 : https://github.com/kyopark2014/simple-serverless-voicebookcreator/blob/main/docs/sqs.md

또한, "sqs-simple-voicebookcreator-for-poly

     
  
  

