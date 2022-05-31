const aws = require('aws-sdk');
var sqs = new aws.SQS({apiVersion: '2012-11-05'});

exports.handler = async (event) => {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env));
    console.log('## EVENT: ' + JSON.stringify(event))
    
    const receiptHandle = event['Records'][0]['receiptHandle'];
    console.log('receiptHandle: '+receiptHandle);
    
    const body = event['Records'][0]['body'];
    console.log('body = '+body);

    const obj = JSON.parse(body);
    const id = obj.Id;
    const bucket = obj.Bucket;
    const key = obj.Key;
    const name = obj.Name;

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

    try {
        let data = await rekognition.detectText(rekognitionParams).promise();
        console.log('data: '+JSON.stringify(data));
        console.log('### finish rekognition: ' + id);
        
        try {
            var deleteParams = {
                QueueUrl: "https://sqs.ap-northeast-2.amazonaws.com/677146750822/sqs-simple-storytime-for-rekognition",
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
        var sqsParams = {
            DelaySeconds: 10,
            MessageAttributes: {},
            MessageBody: JSON.stringify({
                Id: id,
                Bucket: bucket,
                Key: key,
                Name: name,
                Data: JSON.stringify(data)
            }),  
            QueueUrl: "https://sqs.ap-northeast-2.amazonaws.com/677146750822/sqs-simple-storytime-for-polly"
        };
        
        console.log('sqsParams: '+JSON.stringify(sqsParams));
        console.log('### start sqs for rekognition: ' + id);
        
        try {
            let result = await sqs.sendMessage(sqsParams).promise();   
            console.log('result:'+JSON.stringify(result));
            
            console.log('### finish sqs for rekognition: ' + id);
        } catch (err) {
            console.log(err);
        } 

        const response = {
            statusCode: 200,
        //    body: JSON.stringify(data)
        };
        return response;

    } catch (error) {
        console.log(error);
        return error;
    } 
};
