# 7. Amazon SNS 구현
 
AWS Lambda 가 이벤트를 처리한 결과를 email 로 전송할 때 사용할 Amazon SNS 를 구성하고자 합니다.

1) AWS 콘솔  에서 Amazon SNS 서비스로 이동합니다. 리전은 서울(ap-northeast-2)을 사용합니다.

https://ap-northeast-2.console.aws.amazon.com/sns/v3/home?region=ap-northeast-2#/homepage

2) SNS console - [Topics]에서 아래와 같이 [Standard]을 선택하고, [Name]은 “sns-simple-storytime”을 입력합니다. 스크롤을 내려서 [Create topic] 을 선택하여 topic을 생성합니다. 


![Create topic](/static/sns-1.png)



3) [Amazon SNS] - [Topics] - [sns-simple-storytime] - [Subscription]에서 [Create subscription]을 선택합니다. 


![Create subscription](/static/sns-2.png)


4) [Protocol]은 “Email”을 선택하고, Endpoint로 이메일 주소를 입력 합니다. [Create subscription]을 선택하여 subscription을 마무리 합니다. 



![Register Endpoint](/static/sns-3.png)



5) 입력한 메일주소로 “AWS Notification Subscription Confirmation”라는 메일이 아래와 같이 도착하면 “Confirm subscription” 링크를 선택하여 Confirm 합니다. 

![Subscription Check](/static/sns-4.png)

이후 아래와 같이 Confirm 됩니다. 

![Subscription Confirmation](/static/sns-5.png)
