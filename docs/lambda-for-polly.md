# 6. Lambda for Polly 구현

 
1) Lambda console에서 [Functions] - [Create function]을 선택하여, [Basic information]에서 [Function name]으로 아래와 같이 “lambda-simple-storytime-for-polly”을 입력하고, [Create function]을 선택하여 생성합니다. 

https://ap-northeast-2.console.aws.amazon.com/lambda/home?region=ap-northeast-2#/create/function


![image](https://user-images.githubusercontent.com/52392004/156879476-16a4a980-e213-47d8-a137-368be29d6511.png)



2) [AWS Lambda] - [Functions] - [lambda-simple-storytime-for-polly]에서 [Configuration] - [Permission]을 선택한후, [Execution role]에서 “lambda-storytime-for-polly-role-htcdm06y”을 선택하여 진입합니다. 


![image](https://user-images.githubusercontent.com/52392004/156879519-92b2220a-f1ad-49cd-bae7-777047d60fec.png)



3) [IAM] - [Roles]로 화면이 전환된 후에, 아래와 같이 [Permissions policies]에서 “AWSLambdaBasicExecutionRole-36a2d018-70cb-472f-a0fd-2dd950ff2880”을 선택합니다. 


![noname](https://user-images.githubusercontent.com/52392004/156879573-0ffd69dd-125d-4abc-a705-cf401a0ce9a2.png)


4) [IAM] - [Policies]로 전환된 후, 새로 생성한 Lambda의 Policy를 수정하기 위하여 아래와 같이 [Ediit policy]를 눌러서, 수정화면으로 이동합니다. 

![noname](https://user-images.githubusercontent.com/52392004/156879633-ef32296a-0451-4172-bd15-c1ef81ea07c0.png)

 
이후 아래와 같이 Polly, SQS, SNS, S3에 대한 Permission을 삽입합니다. 여기서 Polly가 S3에 mp3 파일을 저장하기 위하여 S3에 대한 write 퍼미션이 필요합니다. 이때, Resources는 "*"로 하여야 합니다. 

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
            "Resource": "arn:aws:sns:ap-northeast-2:****:sns-simple-storytime"
        },
        {
            "Effect": "Allow",
            "Action": "polly:*",
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



![noname](https://user-images.githubusercontent.com/52392004/156879718-12b373cf-7a02-4a04-aa97-dc527574a681.png)



5. AWS Lambda console로 이동하여, [Functions] - [lambda-storytime-for-polly]의 [Code]에서 [Upload form]을 선택하여, “deploy.zip” 파일을 업로드 합니다. 업로드후 자동으로 Deply 되지만, 코드 수정시에는 [Deploy] 버튼을 눌러서 수동으로 Deploy 하여야 합니다.  관련된 코드는 아래와 같이 clone 하여 사용 합니다. 

```c
$ git clone https://github.com/kyopark2014/simple-serverless-storytime-for-polly 
```







