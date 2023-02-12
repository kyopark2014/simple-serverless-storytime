const aws = require('aws-sdk');
const cd = require('content-disposition');
const {v4: uuidv4} = require('uuid');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const sqs = new aws.SQS({apiVersion: '2012-11-05'});

const sqsRekognitionUrl = process.env.sqsRekognitionUrl;
const bucketName = process.env.bucketName;

exports.handler = async (event, context) => {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env));
    console.log('## EVENT: ' + JSON.stringify(event))
    
    const body = Buffer.from(event["body"], "base64");
    console.log('## EVENT: ' + JSON.stringify(event.params));
    const header = event['multiValueHeaders'];
    console.log('header: ' + JSON.stringify(header));
    
    
    const uuid = uuidv4();
    console.log('### start upload: ' + uuid);

    var contentType;
    if(header['Content-Type']) {
        contentType = header["Content-Type"];
    } 
    else if(header['content-type']) {
        contentType = header["content-type"];
    }
    console.log('contentType = '+contentType); 

    var contentDisposition;
    if(header['Content-Disposition']) {
        contentDisposition = header["Content-Disposition"];  
    } 
    else if(header['content-disposition']) {
        contentDisposition = header["content-disposition"];  
    }
    console.log('disposition = '+contentDisposition);

    var filename = "";/*
    if(contentDisposition) {
        filename = cd.parse(contentDisposition).parameters.filename;
    }
    else { */
        filename = uuid+'.jpeg';
    //}
    console.log('filename = '+filename);
    
    try {
        const destparams = {
            Bucket: bucketName, 
            Key: filename,
            Body: body,
            ContentType: contentType
        };
        
        console.log('destparams: ' + JSON.stringify(destparams));
        //const {putResult} = await s3.putObject(destparams).promise(); 

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

    
    var params = {
        DelaySeconds: 10,
        MessageAttributes: {},
        MessageBody: JSON.stringify(fileInfo),  // To-Do: use UUID as a unique id
        QueueUrl: sqsRekognitionUrl
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
