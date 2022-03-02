# 9. 테스트 및 결과

 
## 시험방법

1) Postman에서 시험하는 경우에 아래와 같이 Content-Type과 Content-Disposition을 설정후, Binary를 첨부하여 테스트 합니다. 

![Postman](/static/test-1.png)


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

![Android](/static/test-2.png)



아래와 같이 서버주소를 입력하고, Params에서 Binary를 선택한다음 원하는 사진을 선택합니다. 여기서 Headers의 Content-Type은 application/octet-stream을 그래도 유지하여도 정상적으로 동작합니다.

![Android](/static/test-3.png)


상단의 화살표 모양의 아이콘을 선택하여 발송하고 메일로 정상적으로 mp3로 된 음성파일이 들어오는지 확인합니다.

## 결과 

아래와 같이 지정된 메일로 링크를 포함한 결과가 전달됩니다. 링크 선택시 CloudFront를 통해 다운로드된 컨텐츠가 정상적으로 재생되는것을 확인합니다.


![Android](/static/test-4.png)


Sample : https://github.com/kyopark2014/simple-serverless-voicebookcreator/blob/main/sample.jpeg

![Android](/static/test-5.png)


Result : https://github.com/kyopark2014/simple-serverless-voicebookcreator/blob/main/sample-result.mp3
      