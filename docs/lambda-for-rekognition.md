# 3. Lambda for Rekognition 구현

1) AWS 콘솔 에서 AWS Lambda 서비스로 이동합니다.

https://ap-northeast-2.console.aws.amazon.com/lambda/home?region=ap-northeast-2#/functions

2) [Create function]의 [Basic information]에서 [Function name]은 “lambda-simple-storytime-for-rekognition"으로 입력하고 [Runtime]으로 Node.js를 선택합니다. 이후 아래로 스크롤하여 [Create function]을 선택합니다.

![image](https://user-images.githubusercontent.com/52392004/156878712-a0bf6e29-c376-42f1-beb5-fce44510deb4.png)

3) [Lambda] - [Funtions] - [lambda-storytime-for-rekognition]에서 아래와 같이 [Configuration] - [Permissions]을 선택후, [Execution role]의 [Role name]을 아래와 같이 선택합니다. 본 워크샵의 예제에서는 아래와 같이 “lambda-storytime-for-rekognition-role-yu6ey6bm”을 선택합니다.

![image](https://user-images.githubusercontent.com/52392004/156878769-0d90cfb9-d94f-4250-b753-cbf592965771.png)

4) 이때 IAM의 [Roles]로 이동하는데, Policy를 수정하기 위하여 아래와 같이 [Permissions policies]에 있는 “AWSLambdaBasicExecutionRole-56cf70a6-4f67-4228-91e1-667c3beaacf6”을 선택합니다.

![noname](https://user-images.githubusercontent.com/52392004/156878841-c6ee8bee-8b24-47ab-9f9e-6f4959754c99.png)



5) [IAM]의 [Policies]로 이동하면, [Permissions]에서 [Edit policy]를 선택합니다.

![noname](https://user-images.githubusercontent.com/52392004/156878895-dc53cc68-46ce-429c-92f5-c8b8e6b10695.png)



6) [JSON]에서 아래와 같이 SQS에 대한 퍼미션을 추가합니다. Lambda for Rekognition은 양쪽에 SQS가 2개이므로  resource에 SQS 2개를 모두 등록하여야 하며, Rekognition과 S3에 대한 Permission도 아래와 같이 추가 합니다. 아례 예시에서 "****"은 AWS 계정 번호를 다른 퍼미션과 비교하여 입력하여야 합니다. 

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
            "Resource": [
                "arn:aws:sqs:ap-northeast-2:****:sqs-storytime-for-polly",
                "arn:aws:sqs:ap-northeast-2:****:sqs-storytime-for-rekognition"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "rekognition:*",
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:Put*",
                "s3:Get*",
                "s3:List*",
                "s3:Delete*"
            ],
            "Resource": "*"
        }
```        


SQS에 대한 Permission을 추가후 [Review policy]를 선택합니다.

![noname](https://user-images.githubusercontent.com/52392004/156878957-96cf1c8c-7199-4aea-bc34-a37c502c7677.png)



7) SQS에 대한 Policy를 확인후 [Save changes] 선택하여 저장합니다.

8) Rekognition을 통해 이미지로부터 추출한 텍스트를 SQS에 Json 형태로 전달하기 위한 코드를 다운로드 합니다. 아래와 같이 내려 받습니다.
 
```c
$ git clone https://github.com/kyopark2014/serverless-storytime-for-rekognition
```
해당 repository에는 이미 압축된 파일이 있지만, 추후 수정시 폴더로 이동하여 압축을 합니다. 이때 압축 명령어는 아래와 같습니다.

```c
$ zip -r deploy.zip *
```

9) Lambda console에서 [Functions] - [lambda-storytime-for-rekognition]을 선택한후, 코드를 업로드 합니다.

[rekognition from] 버튼을 누른후에 아래처럼 [.zip file]을 선택합니다. 이후 다운로드한 파일에서 “deploy.zip” 을 선택합니다.

10) 업로드 후에는 자동으로 [Deploy]이 됩니다. 하지만 추후 console에서 바로 수정시에는 아래와 같이 [Deploy]를 선택하여 배포하여야 합니다.


![image](https://user-images.githubusercontent.com/52392004/156879075-de7bba53-d7de-4de2-9257-5e847e2631da.png)
