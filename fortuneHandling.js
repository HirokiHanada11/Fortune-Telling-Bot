const fetch = require("node-fetch");
const block = require('./slackBlocks')

//personalized fortune, uses user's id to retrieve their horoscope and photo
const personalizedFortuneMethod = async (body, client, dbName, dbclient) => {
    try {
      const slackAppUsersdb = dbclient.db(dbName);
      // Use the collection "users"
      const usersCol = slackAppUsersdb.collection("users");
      //query to retrieve user data 
      let query = { "id": body.user_id };
      let userDoc = await usersCol.findOne(query); //retrieving data from db
      if (userDoc != null){
        const horoscope = await userDoc.horoscope;
        const randomIndex = await Math.floor(Math.random() * userDoc.favPhoto.length)
        const favPhotoUrl = await userDoc.favPhoto[randomIndex];
        const result = await fetchFortuneMethod(horoscope);
        await client.views.open({
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
                  "text": `${userDoc.username}さんの今日の運勢は、、、${result["matched"].rank}位${result["emojiFace"]}\n(${result["matched"].sign})`,
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
                "type": "image",
                "image_url": favPhotoUrl,
                "alt_text": "radar chart"
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
        console.log("Success: posted today's personalized fortune");
      } else {
        await client.views.open({
          trigger_id: body.trigger_id,
          // View payload
          view: {
            type: 'modal',
            // View identifier
            callback_id: 'view_error',
            title: {
              type: 'plain_text',
              text: '今日の運勢'
            },
            blocks: [
              {
                "type": "header",
                "text": {
                  "type": "plain_text",
                  "text": `${body.user_id}さんの星座、好きな写真が登録されていません:thinking_face:\n/fortune set で登録しましょう！`,
                  "emoji": true
                }
              }
            ]
          }
        })
      }
    } catch (error) {
      console.error(error);
    }
  }
//fetch fortune, create chart
const fetchFortuneMethod = async (horoscope) => {
    try{
      const date_ob = new Date();
      let date = ("0" + date_ob.getDate()).slice(-2);
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      let year = date_ob.getFullYear();
  
      const url = `http://api.jugemkey.jp/api/horoscope/free/${year}/${month}/${date}`;
      const response = await fetch(url);
      const responsejson = await response.json();
      const fortune = await responsejson.horoscope[`${year}/${month}/${date}`];
      const matched = await fortune.find((fort, index) => {return fort.sign == horoscope});
      
      const emojiFace = await emojiSwtich(matched.rank);
      const colorCode = await japToColorCode(matched.color);
      const radarChart = await createRadarChart(matched.money, matched.job, matched.love, colorCode);
      const encodedRadarChart = await encodeURIComponent(JSON.stringify(radarChart));
  
      return {
        "matched": matched,
        "emojiFace": emojiFace,
        "encodedRadarChart": encodedRadarChart
      }
    } catch(err){
        console.error(err);
    }
  }  

  //function for sending different emojis for different ranks 
const emojiSwtich = async (rank) => {
  let faceEmoji ='';
  switch(rank) {
    case 11: case 12:
      faceEmoji = ':scream:';
      break;
    case 9: case 10:
      faceEmoji = ':dizzy_face:';
      break;
    case 7: case 8:
      faceEmoji = ':slightly_frowning_face:';
      break;
    case 4: case 5: case 6:
      faceEmoji = ':relieved:';
      break;
    case 2: case 3:
      faceEmoji = ':blush:';
      break; 
    case 1:
      faceEmoji = ':satisfied:';
      break;
  }
  return faceEmoji;
}

//creates radar chart for the money, job, and love fortune
const createRadarChart = async (money, job, love, color) => {
  const data = {
    labels: [
      '金運',
      '職運',
      '恋愛運'
    ],
    datasets: [{
      label: 'ラッキーカラー',
      data: [money, job, love],
      fill: true,
      backgroundColor: `rgba(${color}, 0.2)`,
      borderColor: 'rgb(${color})',
      pointBackgroundColor: 'rgb(${color})',
      pointBorderColor: '#fff'
    },
    {
      label: '',
      data: [5, 5, 5],
      fill: false,
      borderColor: 'rgba(0, 0, 0, 0)',
      pointBackgroundColor: 'rgba(0, 0, 0, 0)',
      pointBorderColor: 'rgba(0, 0, 0, 0)'
    },
    {
      label: '',
      data: [0, 0, 0],
      fill: false,
      borderColor: 'rgba(0, 0, 0, 0)',
      pointBackgroundColor: 'rgba(0, 0, 0, 0)',
      pointBorderColor: 'rgba(0, 0, 0, 0)'
    }
  ]
  }
  const config = {
    type: 'radar',
    data: data,
    options: {
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1
          }
        }
      }
    },
  }
  return config;
}

//converts colors in katakana to rgb components
const japToColorCode = async (color) => {
  const obj = {
    'ブラック':'30, 30, 30',
    'ホワイト':'220, 220, 220',
    'ブルー':'0, 0, 255',
    'グリーン':'0, 255, 0',
    'レッド':'255, 0, 0',
    'ピンク':'255, 105, 180',
    'パープル':'128, 0, 128',
    'イエロー':'255, 255, 0',
    'オレンジ':'255, 165, 0',
    'グレイ':'128, 128, 128',
    'ゴールド':'255, 215, 0',
    'シルバー':'192, 192, 192'
  }
  return obj[color];
}

//show the modal for setting up personalized fortune by 
const setupPersonalizedFortuneMethod = async (body, client) => {
  try {
    // Call views.open with the built-in client
    await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      "trigger_id": body.trigger_id,
      // View payload
      "view": {
        "type": "modal",
        "callback_id": "modal-with-inputs",
        "title": {
          "type": "plain_text",
          "text": "星座占い設定"
        },
        "blocks": block.setting_modal_block,
        "submit": {
          "type": "plain_text",
          "text": "Submit"
        }
      }
    });
    console.log("posted settings Modal");
  }
  catch (error) {
    console.error(error);
  }
}

//show the modal for managing photos
const managePersonalizedFortuneMethod = async (body, client, dbName, dbclient) => {
  try {
    const slackAppUsersdb = dbclient.db(dbName);
    // Use the collection "users"
    const usersCol = slackAppUsersdb.collection("users");
    //query to retrieve user data 
    let query = { "id": body.user_id };
    let userDoc = await usersCol.findOne(query); //retrieving data from db
    const imageBlock = await createImageBlock(userDoc.favPhoto);
    await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      "trigger_id": body.trigger_id,
      // View payload
      "view": {
        "type": 'modal',
        // View identifier
        "callback_id": 'manage_images',
        "title": {
          "type": 'plain_text',
          "text": '削除したい画像に☑'
        },
        "blocks": imageBlock,
        "submit": {
          "type": "plain_text",
          "text": "Delete"
        }
      }
    });
    console.log("Success: posted today's personalized fortune");
  } catch (error) {
    console.error(error);
  }
}

//modal for selecting horoscope
const defaultFortuneMethod = async (body, client) => {
  try {
    await client.views.open({
      // Pass a valid trigger_id within 3 seconds of receiving it
      trigger_id: body.trigger_id,
      // View payload
      view: {
        type: 'modal',
        // View identifier
        callback_id: 'view_1',
        title: {
          type: 'plain_text',
          text: '今日の運勢チェック！'
        },
        blocks: [
          {
            "type": "section",
            "block_id": "section_pick_horo",
            "text": {
              "type": "mrkdwn",
              "text": "星座を選んで今日の運勢を確認しよう！"
            },
            "accessory": block.selection_block
          }
        ]
      }
    });
    console.log("Success: posted modal for picking horoscope");
  } catch (error) {
    console.error(error);
  }
}

//creating block that contain all the images
const createImageBlock = async (favPhotoArr) => {
  const options = new Array();
  favPhotoArr.forEach((url) => {
    let option = {
      "text": {
        "type": "plain_text",
        "text": url,
        "emoji": true
      },
      "value": url
    }
    options.push(option);
  });
  const block = [
		{
			"type": "input",
      "block_id": "checkboxes_for_delete",
			"element": {
				"type": "checkboxes",
				"options": options,
				"action_id": "checkboxes_action"
			},
			"label": {
				"type": "plain_text",
				"text": "削除したいURLに☑",
				"emoji": true
			}
		}
	]
  return block;
}

  module.exports = {
    personalizedFortune: personalizedFortuneMethod,
    defaultFortune: defaultFortuneMethod,
    setupPersonalizedFortune:setupPersonalizedFortuneMethod,
    fetchFortune: fetchFortuneMethod,
    managePersonalizedFortune: managePersonalizedFortuneMethod
  }