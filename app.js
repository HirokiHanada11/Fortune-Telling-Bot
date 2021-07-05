const { App } = require('@slack/bolt');
const { MongoClient } = require('mongodb');

const dotenv = require("dotenv");
dotenv.config();

//mongoDB setup
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@clusterforslackapp.qqx16.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const dbclient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbName = "slackAppUsers";

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

//import set of functions for handling commands and actions 
const FortuneHandler = require("./fortuneHandling"); 
const dbHandler = require('./dbHandling');

//listens for /fortune command and opens a modal
app.command('/fortune', async({ ack, command, body, client }) => {
  await ack();
  try {
    if (command.text === "me"){
      await FortuneHandler.personalizedFortune(body, client, dbName, dbclient);
      console.log("Success: posted personalized fortune for", body.user_name);
    }else if(command.text === "set"){
      await FortuneHandler.setupPersonalizedFortune(body, client);
      console.log("success: personalization setting modal opened for", body.user_name);
    } else if(command.text === "del"){
      await FortuneHandler.managePersonalizedFortune(body, client, dbName, dbclient);
      console.log("success: opened manage modal")
    } else{
      await FortuneHandler.defaultFortune(body, client);
      console.log("success: opened default menu for",body.user_name)
    }
  }
  catch (error) {
    console.error(error);
  }
});

//when one of the buttons on the modal is clicked, it pushes another modal with fortune telling results
app.action('select_horo', async({ ack, body, client}) => {
  await ack();
  try{
    const horoscope = body.actions[0].selected_option.value;
    const result = await FortuneHandler.fetchFortune(horoscope);
    // Call views.open with the built-in client
    await client.views.push({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: {
        type: 'modal',
        // View identifier
        callback_id: 'view_2',
        title: {
          type: 'plain_text',
          text: '今日の運勢'
        },
        blocks: [
          {
            "type": "header",
            "text": {
              "type": "plain_text",
              "text": `${result["matched"].sign}の今日の運勢は、、、${result["matched"].rank}位${result["emojiFace"]}`,
              "emoji": true
            }
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "plain_text",
                "text": result["matched"].content,
                "emoji": true
              }
            ]
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "plain_text",
                "text": `ラッキーアイテムは${result["matched"].item}`,
                "emoji": true
              }
            ]
          },
          {
            "type": "divider"
          },
          {
            "type": "image",
            "image_url": `https://quickchart.io/chart?c=${result["encodedRadarChart"]}`,
            "alt_text": "radar chart"
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "plain_text",
                "text": `金運：${result["matched"].money}  恋愛運：${result["matched"].love}　職運：${result["matched"].job}`,
                "emoji": true
              }
            ]
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "plain_text",
                "text": '今日も一日頑張ろう！！',
                "emoji": true
              }
            ]
          }
        ]
      }
    });
    console.log("Success: posted today's fortune for", result["matched"].sign);
  } catch(err) {
    console.error(err)
  }  
});


//submit handling for modal form and saving it to the mongodb database
app.view("modal-with-inputs", async({ ack, body, client}) => {
  await ack();
  try{
    const userId = await body.user.id;
    const username = await body.user.username;
    const horoscope = await body.view.state.values.static_select.static_select_horoscope.selected_option.value;
    const favPhotoUrlstr = await body.view.state.values.multi_line_input.plain_text_input_photo.value;
    const favPhotoUrlArr = await favPhotoUrlstr.split('\n');
    console.log("successfully received submission"); 

    console.log(favPhotoUrlArr);
    await dbHandler.storeUserInfo(userId, username, horoscope, favPhotoUrlArr, dbName, dbclient);
    console.log("Success: stored user information in the database.")
    await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      "trigger_id": body.trigger_id,
      // View payload
      "view": {
        "type": 'modal',
        // View identifier
        "callback_id": 'view_end',
        "title": {
          "type": 'plain_text',
          "text": 'ご記入ありがとうございました！'
        },
        "blocks": [
          {
            "type": "section",
            "block_id": "section_pick_horo",
            "text": {
              "type": "mrkdwn",
              "text": "/fortune me で自分宛ての占いを見てみましょう！"
            }
          }
        ]
      }
    })
  } catch(err){
    console.error(err);
  }
});

//delete handler
app.view("manage_images", async({ ack, body, client}) => {
  await ack();
  try{
    const userId = await body.user.id;
    const checkedUrlArr = await body.view.state.values.checkboxes_for_delete.checkboxes_action.selected_options;
    console.log("successfully received submission"); 
    console.log(body.view.state.values.checkboxes_for_delete.checkboxes_action.selected_options);
    // call handler to delete the urls from the database
    await dbHandler.deleteUserInfo(userId, checkedUrlArr, dbName, dbclient);
    console.log("Success: deleted checked urls from the database.")
    await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      "trigger_id": body.trigger_id,
      // View payload
      "view": {
        "type": 'modal',
        // View identifier
        "callback_id": 'view_end',
        "title": {
          "type": 'plain_text',
          "text": 'ご記入ありがとうございました！'
        },
        "blocks": [
          {
            "type": "section",
            "block_id": "section_pick_horo",
            "text": {
              "type": "mrkdwn",
              "text": "/fortune set で写真は追加できます！"
            }
          }
        ]
      }
    })
  } catch(err){
    console.error(err);
  }
});


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

(async () => {
  try{
    await dbclient.connect();
    console.log("Connected correctly to MongoDB server");
  } catch(error) {
    console.error(error);
  }
})();

process.on('SIGTERM', async () => {
  try{
    await dbclient.close();
    console.log("Correctly closed connection to server");
  } catch(error) {
    console.error(error);
  }
});