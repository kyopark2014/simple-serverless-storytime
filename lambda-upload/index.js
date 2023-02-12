const aws = require('aws-sdk');
const cd = require('content-disposition');
const {v4: uuidv4} = require('uuid');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });

exports.handler = async (event, context) => {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env));
    // console.log('## EVENT: ' + JSON.stringify(event))
    
    const body = Buffer.from(event["body-json"], "base64");
    console.log('## EVENT: ' + JSON.stringify(event.params));
    console.log('## EVENT: ' + JSON.stringify(event.context));
    
    const uuid = uuidv4();
    console.log('### start upload: ' + uuid);

    var contentType;
    if(event.params.header['Content-Type']) {
        contentType = event.params.header["Content-Type"];
    } 
    else if(event.params.header['content-type']) {
        contentType = event.params.header["content-type"];
    }
    console.log('contentType = '+contentType); 

    var contentDisposition;
    if(event.params.header['Content-Disposition']) {
        contentDisposition = event.params.header["Content-Disposition"];  
    } 
    else if(event.params.header['content-disposition']) {
        contentDisposition = event.params.header["content-disposition"];  
    }
    console.log('disposition = '+contentDisposition);

    var filename = "";
    if(contentDisposition) {
        filename = cd.parse(contentDisposition).parameters.filename;
    }
    else {
        filename = uuid+'.jpeg';
    }
    
    const bucket = 's3-simple-storytime';
    try {
        const destparams = {
            Bucket: bucket, 
            Key: filename,
            Body: body,
            ContentType: contentType
        };
        const {putResult} = await s3.putObject(destparams).promise(); 

        console.log('### finish upload: ' + uuid);
    } catch (error) {
        console.log(error);
        return;
    } 
    
    const fileInfo = {
        Id: uuid,
        Bucket: bucket, 
        Key: filename,
    }; 
    console.log('file info: ' + JSON.stringify(fileInfo));

    var sqs = new aws.SQS({apiVersion: '2012-11-05'});

    var params = {
        DelaySeconds: 10,
        MessageAttributes: {},
        MessageBody: JSON.stringify(fileInfo),  // To-Do: use UUID as a unique id
        QueueUrl: "https://sqs.ap-northeast-2.amazonaws.com/677146750822/sqs-simple-storytime-for-rekognition"
    };
     
    console.log('params: '+JSON.stringify(params));
     
    try {
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
