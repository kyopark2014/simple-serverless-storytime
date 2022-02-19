# Simple Voice Book Creator

## SQS 설정 

1. AWS SQS console에 접속해서 [Create queue]를 선택한후, Name에 “sqs-simple-voicebookcreator-for-rekognition”로 입력후, 아래로 스크롤하여 [Create queue]를 선택하여 SQS를 생성합니다. 

![image](https://user-images.githubusercontent.com/52392004/154795483-43216c51-0962-492f-9fbf-abd4de1cb3da.png)

2. SQS 생성후 모습은 아래와 같습니다. URL 정보는 Lambda 에서 SQS에 접속하기 위해 사용합니다. 또한 아래와 같이  [Amazon SQS] - [Queues] - [sqs-simple-voicebookcreator-for-rekognition]에서 하단의 [Lambda triggers] - [Configure Lambda function trigger]를 선택하여 SQS의 응답을 수신할 Lambda를 지정합니다.

<img width="910" alt="image" src="https://user-images.githubusercontent.com/52392004/154822622-d9e3c65b-1976-45a5-a483-4a595749874a.png">

3. [Lambda function]에서 기생성한 “arn:aws:lambda:ap-northeast-2:***********:function:lambda-simple-voicebookcreator-for-rekognition”을 아래와 같이 선택하고 [Save]를 선택합니다. 

<img width="966" alt="image" src="https://user-images.githubusercontent.com/52392004/154822823-c061e21f-99a2-4640-8182-ceaa0a767b31.png">



### SQS 를 Access 하기 위한 Permission

Lambda에서 SQS에 접속하기 위해서는 아래의 Permission을 등록하여야 합니다. 

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
                "sqs:GetQueueAttributes"
            ],
            "Resource": "arn:aws:sqs:ap-northeast-2:677146750822:sqs-simple-voicebookcreator-for-rekognition"
        }



![image](https://user-images.githubusercontent.com/52392004/154795646-bf3ba7c8-f10d-43f7-bb4d-f11d63ba35e8.png)


### SQS에서 Lambda로 전달되는 event 메시지 형태 예
       
Lambda는 Rekognition에 필요한 데이터를 SQS가 전달한 event에서 정보를 추출하는데, 관련정보는 "body", "messageAttributes/Bucket", "messageAttributes/Name"가 있습니다.

```c
2022-02-19T17:03:48.373Z	c9ce7eba-602c-5be2-9f85-2431450714f2	INFO	## EVENT: {
    "Records": [
        {
            "messageId": "087430e7-ded4-44ee-bf3b-b5b2020930a9",
            "receiptHandle": "AQEBFB/w4PEVHl2F1HoKxCJvuEiYrm+S/0/OJAxXcyXtBQUWsRM/ZOlMlzHMtuaFJW90+PS8uTSvQBqqxyLMg6wGF0J4H8TCFMh2zRys09U0jtcBqavycAi/2ACWUKbeUmtxSeTpyiGuG8ND0FSfmVnGZYHbfI8CRu3ZGt/TYbGpGhGg+bihRg08eZafYNvn69x8x7JXRbi0EZgADWgkCGOiyYJBERszRJOPT/PCb9gmBnT1MeWx2l7hB1fSXArwsWaFeWxxcULYMTPs63BN77EHABA+nGDZXedxRiF5a2RpNKpKeGH5p6QiDTVAI0W3IK5EEnkFnmAeyHPOZoX0GNm4+PKM2qm314xg13eVMEud13UI2Uf39m2LLWj2wrNFwK8yDwZFPD3suvnNhkfE2nwb4cpKYCzbUKSEao9wxZemeS2st9O7AHoDpnXykCcPSaBX",
            "body": "UUID",
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": "1645290214757",
                "SenderId": "AROAZ3KIXN5TFMFD6AEYI:lambda-simple-voicebookcreator-upload",
                "ApproximateFirstReceiveTimestamp": "1645290224757"
            },
            "messageAttributes": {
                "Bucket": {
                    "stringValue": "s3-simple-voicebookcreator",
                    "stringListValues": [],
                    "binaryListValues": [],
                    "dataType": "String"
                },
                "Name": {
                    "stringValue": "sample2.jpeg",
                    "stringListValues": [],
                    "binaryListValues": [],
                    "dataType": "String"
                }
            },
            "md5OfMessageAttributes": "3dd51a16c4e172dcf33861a1c8245e84",
            "md5OfBody": "5a54d9ad87f7c4c1c70c8f05b9515d5a",
            "eventSource": "aws:sqs",
            "eventSourceARN": "arn:aws:sqs:ap-northeast-2:677146750822:sqs-simple-voicebookcreator-for-rekognition",
            "awsRegion": "ap-northeast-2"
        }
    ]
}
```

