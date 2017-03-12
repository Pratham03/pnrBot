var builder = require('botbuilder');
var restify = require('restify');
var pnrClient = require('./pnr-client.js');
var dotenv = require("dotenv-extended");

//Load environment variables
dotenv.load();
//Create a connector for the bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
//Creating the bot
var pnrBot = new builder.UniversalBot(connector);

var dialog = new builder.IntentDialog();

dialog.matches(/^get status/i, [
    function (session, args, next) {
        if (session.message.text.toLowerCase() == 'get status') 
        {
            builder.Prompts.text(session, 'Which PNR number are you looking for?');
        } 
        else
        {
            var query = session.message.text.substring(11);
            next({ response: query });
        }
    },
    function (session, result, next) {
        var query = result.response;
        if (!query) {
            session.endDialog('Request cancelled');
        }
        else
        {
            pnrClient.getPNRStatus(query, function(pnrStatus){
                if(pnrStatus.response_code == "410")
                {
                    session.endDialog("PNR flushed or not generated");
                }
                else if(pnrStatus.response_code == "404")
                {
                    session.endDialog("Source not responding");
                }
                else
                {
                    var card = new builder.HeroCard(session);
                    card.title(pnrStatus.pnr);
                    card.subtitle("Train Number: " + pnrStatus.train_num);
                    var text = '';
                    text += '*Train Name:' + pnrStatus.train_name + ' \n';
                    text += '*Date of Journey:' + pnrStatus.doj + ' \n';
                    text +=  '*From Station:' + pnrStatus.from_station.name + ' \n';
                    text += '*To Station:' + pnrStatus.to_station.name + ' \n';
                    for(var i = 0; i < pnrStatus.passengers.length; i++)
                    {
                        text += '*Passenger ' + i+1 + ' Status:' +  pnrStatus.passengers[i].current_status + ' \n';
                        text += '*Passenger ' + i+1 + ' Coach Position:' +  pnrStatus.passengers[i].coach_position + ' \n';
                    }
                    card.text(text);
                    var message = new builder.Message(session).attachments([card]);
                    session.send(message);

                }

            });
        }
    }
    ]);
dialog.onDefault(builder.DialogAction.send("Sorry I did not understand. Please type 'get status' or 'get status <10 digit PNR Number>'"));
pnrBot.dialog('/', dialog);
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());
