# 3. Lambda for Rekognition 구현"

1) AWS 콘솔 에서 AWS Lambda 서비스로 이동합니다.

[[Console]](https://ap-northeast-2.console.aws.amazon.com/lambda/home?region=ap-northeast-2#/functions) 

https://ap-northeast-2.console.aws.amazon.com/lambda/home?region=ap-northeast-2#/functions

2) [Create function]의 [Basic information]에서 [Function name]은 “lambda-simple-storytime-for-rekognition"으로 입력하고 [Runtime]으로 Node.js를 선택합니다. 이후 아래로 스크롤하여 [Create function]을 선택합니다.

![Create function](/static/lambda-rekognition-1.png)

3) [Lambda] - [Funtions] - [lambda-simple-storytime-for-rekognition]에서 아래와 같이 [Configuration] - [Permissions]을 선택후, [Execution role]의 [Role name]을 아래와 같이 선택합니다. 본 워크샵의 예제에서는 아래와 같이 “lambda-simple-storytime-for-rekognition-role-7wl1cajq”을 선택합니다.

![Function Overview](/static/lambda-rekognition-2.png)

4) 이때 IAM의 [Roles]로 이동하는데, Policy를 수정하기 위하여 아래와 같이 [Permissions policies]에 있는 “AWSLambdaBasicExecutionRole-1970fa69-65c9-484e-8ca1-f833e69cf0e9”을 선택합니다.

![Lambda Pollicy](/static/lambda-rekognition-3.png)

5) [IAM]의 [Policies]로 이동하면, [Permissions]에서 [Edit policy]를 선택합니다.

![Edit Policy](/static/lambda-rekognition-4.png)

6) [JSON]에서 아래와 같이 SQS에 대한 퍼미션을 추가합니다. Lambda for Rekognition은 양쪽에 SQS가 2개이므로 2개 등록합니다. 아례 예시에서 "****"은 AWS 계정 번호를 다른 퍼미션과 비교하여 입력하여야 합니다. 

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
            "Resource": "arn:aws:sqs:ap-northeast-2:****:sqs-simple-storytime-for-polly"
        },
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
            "Resource": "arn:aws:sqs:ap-northeast-2:****:sqs-simple-storytime-for-rekognition"
        } 
```
SQS에 대한 Permission을 추가후 [Review policy]를 선택합니다.

![Permission](/static/lambda-rekognition-5.png)


7) SQS에 대한 Policy를 확인후 [Save changes] 선택하여 저장합니다.

8) Rekognition을 통해 이미지로부터 추출한 텍스트를 SQS에 Json 형태로 전달하기 위한 코드를 다운로드 합니다. 아래와 같이 내려 받습니다.
 
```c
$ git clone https://github.com/kyopark2014/simple-serverless-storytime-for-rekognition
```
해당 repository에는 이미 압축된 파일이 있지만, 추후 수정시 폴더로 이동하여 압축을 합니다. 이때 압축 명령어는 아래와 같습니다.

```c
$ zip -r deploy.zip *
```

9) Lambda console에서 [Functions] - [lambda-simple-storytime-for-rekognition]을 선택한후, 코드를 업로드 합니다.

[rekognition from] 버튼을 누른후에 아래처럼 [.zip file]을 선택합니다. 이후 다운로드한 파일에서 “deploy.zip” 을 선택합니다.

10) 업로드 후에는 자동으로 [Deploy]이 됩니다. 하지만 추후 console에서 바로 수정시에는 아래와 같이 [Deploy]를 선택하여 배포하여야 합니다.


![code](/static/lambda-rekognition-6.png)

