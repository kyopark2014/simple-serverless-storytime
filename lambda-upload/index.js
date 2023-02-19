const aws = require('aws-sdk');
const cd = require('content-disposition');
const {v4: uuidv4} = require('uuid');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const sqs = new aws.SQS({apiVersion: '2012-11-05'});

const sqsRekognitionUrl = process.env.sqsRekognitionUrl;
const bucketName = process.env.bucketName;

// cloudfront setting for api gateway
const myOriginRequestPolicy = new cloudFront.OriginRequestPolicy(this, 'OriginRequestPolicyCloudfront', {
    originRequestPolicyName: 'QueryStringPolicyCloudfront',
    comment: 'Query string policy for cloudfront',
    cookieBehavior: cloudFront.OriginRequestCookieBehavior.none(),
    headerBehavior: cloudFront.OriginRequestHeaderBehavior.none(),
    queryStringBehavior: cloudFront.OriginRequestQueryStringBehavior.allowList('deviceid'),
});

distribution.addBehavior("/upload", new origins.RestApiOrigin(api), {
    cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
    originRequestPolicy: myOriginRequestPolicy,
    allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,  
    viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
});    

let contentType;
if(header['Content-Type']) {
    contentType = String(header['Content-Type']);
} 

let contentDisposition="";
if(header['Content-Disposition']) {
    contentDisposition = String(header['Content-Disposition']);  
} 
    
let filename = "";
const uuid = uuidv4();
    
if(contentDisposition) {
    filename = cd.parse(contentDisposition).parameters.filename;
}
else { 
    filename = uuid+'.jpeg';
}


exports.handler = async (event, context) => {
    //console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env));
    //console.log('## EVENT: ' + JSON.stringify(event))
    
    const body = Buffer.from(event["body"], "base64");
    console.log('body: ' + body)
    const header = event['multiValueHeaders'];
    console.log('header: ' + JSON.stringify(header));
            
    let contentType;
    if(header['Content-Type']) {
        contentType = String(header['Content-Type']);
    } 
    console.log('contentType = '+contentType); 

    let contentDisposition="";
    if(header['Content-Disposition']) {
        contentDisposition = String(header['Content-Disposition']);  
    } 
    console.log('disposition = '+contentDisposition);
    

    let filename = "";
    const uuid = uuidv4();
    
    if(contentDisposition) {
        filename = cd.parse(contentDisposition).parameters.filename;
    }
    else { 
        filename = uuid+'.jpeg';
    }
    console.log('filename = '+filename);
    
    try {
        const destparams = {
            Bucket: bucketName, 
            Key: filename,
            Body: body,
            ContentType: contentType
        };
        
      //  console.log('destparams: ' + JSON.stringify(destparams));
        const {putResult} = await s3.putObject(destparams).promise(); 

        console.log('### finish upload: ' + uuid);
    } catch (error) {
        console.log(error);
        return;
    } 
    
    const fileInfo = {
        Id: uuid,
        Bucket: bucketName, 
        Key: filename,
    }; 
    console.log('file info: ' + JSON.stringify(fileInfo));
    
    try {
        let params = {
            DelaySeconds: 10,
            MessageAttributes: {},
            MessageBody: JSON.stringify(fileInfo), 
            QueueUrl: sqsRekognitionUrl
        };         
        console.log('params: '+JSON.stringify(params));

        let result = await sqs.sendMessage(params).promise();  
        console.log("result="+JSON.stringify(result));
    } catch (err) {
        console.log(err);
    } 

    const response = {
        statusCode: 200,
        body: JSON.stringify(fileInfo)
    };
    return response;
};
