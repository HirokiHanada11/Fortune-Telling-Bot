//slack block for options in select inputs
const options_horo = [
    {
      "text": {
        "type": "plain_text",
        "text": "牡羊座"
      },
      "value": "牡羊座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "牡牛座"
      },
      "value": "牡牛座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "双子座"
      },
      "value": "双子座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "蟹座"
      },
      "value": "蟹座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "獅子座"
      },
      "value": "獅子座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "乙女座"
      },
      "value": "乙女座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "天秤座"
      },
      "value": "天秤座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "蠍座"
      },
      "value": "蠍座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "射手座"
      },
      "value": "射手座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "山羊座"
      },
      "value": "山羊座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "水瓶座"
      },
      "value": "水瓶座"
    },
    {
      "text": {
        "type": "plain_text",
        "text": "魚座"
      },
      "value": "魚座"
    }
]
  
  //slack block for select input
const selection_block = {
    "action_id": "select_horo",
    "type": "static_select",
    "placeholder": {
      "type": "plain_text",
      "text": "星座"
    },
    "options": options_horo
}
  
  //slack block for setting modal
const setting_modal_block = [
    {
      "type": "input",
      "block_id": "static_select",
      "element": {
        "type": "static_select",
        "placeholder": {
          "type": "plain_text",
          "text": "星座",
          "emoji": true
        },
        "options": options_horo,
        "action_id": "static_select_horoscope"
      },
      "label": {
        "type": "plain_text",
        "text": "あなたの星座",
        "emoji": true
      }
    },
    {
      "type": "input",
      "block_id": "multi_line_input",
      "element": {
        "type": "plain_text_input",
        "multiline": true,
        "placeholder": {
          "type": "plain_text",
          "text": "複数送れます！（複数送る場合は改行区切りで）",
          "emoji": true
        },
        "action_id": "plain_text_input_photo"
      },
      "label": {
        "type": "plain_text",
        "text": "不運な時に励ましてくれる写真のURL",
        "emoji": true
      }
    }
]

module.exports = {
    selection_block: selection_block,
    setting_modal_block: setting_modal_block
}