const aws = require('aws-sdk');
const sqs = new aws.SQS({apiVersion: '2012-11-05'});
const sns = new aws.SNS();
const polly = new aws.Polly();

const path = require('path');

aws.config.update({ region: process.env.AWS_REGION })

const CDN = process.env.CDN; 
const sqsPollyUrl = process.env.sqsPollyUrl;
const topicArn = process.env.topicArn;

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
    const name = obj.Name;
    
    console.log('### start text extraction: ' + id);
    // text extraction without post processing
    const data = JSON.parse(obj.Data);
    var text = "";
    for (var i = 0; i < data.TextDetections.length; i++) {
        if(data.TextDetections[i].Type == 'LINE') {
            text += data.TextDetections[i].DetectedText;
        }
    }
    console.log('text: '+text);
    console.log('### finish text extraction: ' + id);

    console.log('### start polly: ' + id);         
    let pollyResult, key;
    try {
        let polyParams = {
            OutputFormat: "mp3",
            OutputS3BucketName: bucket,
            Text: text,
            TextType: "text",
            //VoiceId: "Joanna",  // adult women
            VoiceId: "Ivy",  // child girl
            // VoiceId: "Kevin", // child man
            // VoiceId: "Matthew", // adul man
            // Engine: 'standard',
            Engine: 'neural',
            // SampleRate: "22050",
        };

        pollyResult = await polly.startSpeechSynthesisTask(polyParams).promise();       
        console.log('pollyResult:', pollyResult);

        const pollyUrl = pollyResult.SynthesisTask.OutputUri;
        console.log('url: '+pollyUrl);

        const fileInfo = path.parse(pollyUrl);
        key = fileInfo.name + fileInfo.ext;
        console.log('key: ', key);
        console.log('### finish polly: ' + id); 

        // delete messageQueue
        console.log('### delete messageQueue for ' + id);
        try {
            let deleteParams = {
                QueueUrl: sqsPollyUrl,
                ReceiptHandle: receiptHandle
            };

            sqs.deleteMessage(deleteParams, function(err, data) {
                if (err) {
                  console.log("Delete Error", err);
                } else {
                  console.log("Success to delete messageQueue: "+id+", deleting messagQueue: ", data.ResponseMetadata.RequestId);
                }
            });
        } catch (err) {
            console.log(err);
        }   
    } catch (err) {
        console.log(err);
    } 
    
    console.log('### start sns: ' + id);
    let url = CDN+key
    let snsParams = {
        Subject: 'Get your voice book generated from '+name,
        Message: '('+id+') Link: '+url+'\n'+text,         
        TopicArn: topicArn
    }; 
    console.log('snsParams: '+JSON.stringify(snsParams));
    
    let snsResult;
    try {
        snsResult = await sns.publish(snsParams).promise();
        console.log('snsResult:', snsResult);

        console.log('### finish sns: ' + id);
    } catch (err) {
        console.log(err);
    } 

    const fileInfo = {
        Id: id,
        Name: name,
        Url: url
    }; 
    console.log('Info: ' + JSON.stringify(fileInfo)) 

    const response = {
        statusCode: 200,
        body: fileInfo,
    };
    return response;
};
