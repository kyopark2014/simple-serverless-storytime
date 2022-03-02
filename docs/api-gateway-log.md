# API Gateway Log 설정


 
1. IAM console에 접속 

https://console.aws.amazon.com/iamv2/home#/roles


2. [Create roles]를 선택

![Create role](/static/module8-2.png)

3. [Use case]에서 “API Gateway”를 선택하고 “Allows API Gateway to push logs to CloudWatch Logs”를 enable 한후에 [Next]를 선택한다.

![Use casemo](/static/module8-3.png)

4. [Add permissions]에서 AmazonAPIGatewayPushToCloudWatchLogs를 확인하고 [Next]를 선택한다.

![Add permission](/static/module8-4.png)

5. [Role details]에서 [Role name]으로 “api-gateway-logs-seoul”을 입력하고 스크롤하여 [Create role]을 선택한다.  

![Role detail](/static/module8-5.png)

6. [IAM] - [Roles] 에서 “api-gateway-logs-seoul”을 검색하여, 아래의 ARN 을 확인한다.

![Access management](/static/module8-6.png)

## Configure the IAM Role in API Gateway
  
1. API Gateway의 console로 이동한다.

  https://ap-northeast-2.console.aws.amazon.com/apigateway/main/apis?region=ap-northeast-2

2. 왼쪽 메뉴 마지막의 [Settings]를 선택후, 아래와 같이 CloudWatch log role ARN을 입력하고 [Save]를 선택한다.

![Settings](/static/module8-7.png)

  
## Configure logging in each API

1. [API: api-filestore] - [Stages] - [dev] - [dev Stage Editor] - [Logs/Tracing]에서 [Enable CloudWatch Logs]를 enable, [log lever]은 INFO로, [Log full requests/responses data], [Enable Detailed CloudWatch Metrics]을 모두 enable 한다.

![Configure logging](/static/module8-8.png)

  
## Trouble shooting

[Save Changes]를 선택했는데 아래와 같이 “CloudWatch Logs role ARN must be set in account settings to enable logging” 에러가 발생하는 경우는 상기와 같이 Roles의 API Gateway log에 대한 ARN이 [Settings]에 잘 설정되어 있는지 확인한다.  


![Error message](/static/module8-9.png) 
 
