from dotenv import load_dotenv
from openai import OpenAI
import json

load_dotenv()
client = OpenAI()

def get_gpt_response(user_text: str):
    system_prompt = """
너는 카페 키오스크 주문 도우미야.
사용자의 자연어 발화를 intent, slots, response 로 변환해.
항상 아래 JSON 형식으로만 답해.

{
  "intent": "...",
  "slots": { ... },
  "response": "사용자에게 말해줄 자연스러운 한 문장"
}

가능한 intent 목록:
- BuildOrder
- MenuQuery
- NutritionFilter
- ShowOrder
- ResetOrder
- Payment
- OptionSelect        # 🔥 추가됨!
- Fallback

규칙:
- response 필드는 반드시 채워야 한다.
- response는 한국어 자연스러운 말투로 한 문장으로 만든다.
- intent/slots는 예시 규칙 그대로 따른다.
- 사용자가 옵션(HOT/ICE/Small/Large)만 말한 경우 OptionSelect 로 분류한다.
- 사용자가 처음부터 옵션까지 말하면 slots 안에 menu_name + size + temperature 모두 넣는다.

예시:

"아메리카노 하나"
→ {
    "intent": "BuildOrder",
    "slots": { "menu_name": "아메리카노", "quantity": 1 },
    "response": "아메리카노 한 잔 담아드릴게요."
  }

"아이스 라지 아메리카노 하나"
→ {
    "intent": "BuildOrder",
    "slots": {
      "menu_name": "아메리카노",
      "quantity": 1,
      "temperature": "Iced",
      "size": "Large"
    },
    "response": "아이스 라지 아메리카노 한 잔 바로 담아드릴게요."
  }

"아이스로요"
→ {
    "intent": "OptionSelect",
    "slots": { "temperature": "Iced" },
    "response": "아이스로 준비할게요."
  }

"뜨겁게"
→ {
    "intent": "OptionSelect",
    "slots": { "temperature": "Hot" },
    "response": "뜨겁게 준비하겠습니다."
  }

"큰 걸로"
→ {
    "intent": "OptionSelect",
    "slots": { "size": "Large" },
    "response": "Large 사이즈로 선택하셨어요."
  }
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        temperature=0
    )

    # ⬇⬇⬇ JSON 파싱
    try:
        raw = response.choices[0].message.content.strip()

        json_start = raw.find("{")
        json_end = raw.rfind("}") + 1
        clean_json = raw[json_start:json_end]

        return json.loads(clean_json)

    except Exception as e:
        print("❌ GPT JSON 파싱 실패:", e, raw)
        return {
            "intent": "Fallback",
            "slots": {},
            "response": "죄송해요, 잘 이해하지 못했어요."
        }
