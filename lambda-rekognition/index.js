const aws = require('aws-sdk');
let sqs = new aws.SQS({apiVersion: '2012-11-05'});

const sqsRekognitionUrl = process.env.sqsRekognitionUrl;
const sqsPollyUrl= process.env.sqsPollyUrl;

exports.handler = async (event) => {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env));
    console.log('## EVENT: ' + JSON.stringify(event))
    
    const receiptHandle = event['Records'][0]['receiptHandle'];
    console.log('receiptHandle: '+receiptHandle);
    
    const body = JSON.parse(event['Records'][0]['body']);
    console.log('body = '+body);

    const id = body.Id;
    const bucket = body.Bucket;
    const key = body.Key;
    const name = body.Name;
    
    try {
        const rekognition = new aws.Rekognition();
        const rekognitionParams = {
            Image: {
                S3Object: {
                    Bucket: bucket,
                    Name: key
                },
            },
        }
        console.log('rekognitionParams = '+JSON.stringify(rekognitionParams))

        let data = await rekognition.detectText(rekognitionParams).promise();
        console.log('data: '+JSON.stringify(data));
        console.log('### finish rekognition: ' + id);
        
        try {
            let deleteParams = {
                QueueUrl: sqsRekognitionUrl,
                ReceiptHandle: receiptHandle
            };
        
            console.log('### delete messageQueue for ' + id);
            sqs.deleteMessage(deleteParams, function(err, data) {
                if (err) {
                    console.log("Error", err);
                } else {
                    console.log("Success to delete messageQueue: "+id+", deleting messagQueue: ", data.ResponseMetadata.RequestId);
                }
            });
        } catch (err) {
            console.log(err);
        } 

        // push the Json file to to SQS         
        try {
            let sqsParams = {
                DelaySeconds: 10,
                MessageAttributes: {},
                MessageBody: JSON.stringify({
                    Id: id,
                    Bucket: bucket,
                    Key: key,
                    Name: name,
                    Data: JSON.stringify(data)
                }),  
                QueueUrl: sqsPollyUrl
            };
            
            console.log('sqsParams: '+JSON.stringify(sqsParams));
            console.log('### start sqs for rekognition: ' + id);
            
            let result = await sqs.sendMessage(sqsParams).promise();   
            console.log('result:'+JSON.stringify(result));
            
            console.log('### finish sqs for rekognition: ' + id);
        } catch (err) {
            console.log(err);
        } 

        const response = {
            statusCode: 200,
            body: JSON.stringify(data)
        };
        return response;

    } catch (error) {
        console.log(error);
        return error;
    } 
};
