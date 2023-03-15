const aws = require('aws-sdk');
let sqs = new aws.SQS({apiVersion: '2012-11-05'});

const sqsRekognitionUrl = process.env.sqsRekognitionUrl;
const sqsPollyUrl= process.env.sqsPollyUrl;

exports.handler = async (event) => {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env));
    console.log('## EVENT: ' + JSON.stringify(event))
    
    for(let i in event['Records']) {
        const receiptHandle = event['Records'][i]['receiptHandle'];
        console.log('receiptHandle: '+receiptHandle);
        
        const body = JSON.parse(event['Records'][i]['body']);
        console.log('body = '+JSON.stringify(body));

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
            };
            console.log('rekognitionParams = '+JSON.stringify(rekognitionParams));

            let data = await rekognition.detectText(rekognitionParams).promise();
            // console.log('data: '+JSON.stringify(data));
            
            // text extraction
            let text = "";   
            for (let i = 0; i < data.TextDetections.length; i++) {
                if(data.TextDetections[i].Type == 'LINE') {
                    text += data.TextDetections[i].DetectedText;
                }
            }
            console.log('text: ' + text);

            console.log('### finish rekognition: ' + id);
            
            // delete the queue message
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
                        Text: text
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
        } catch (error) {
            console.log(error);
            return error;
        }
    } 

    const response = {
        statusCode: 200,
    };
    return response;
};
