from dotenv import load_dotenv
from openai import OpenAI

load_dotenv() 
client = OpenAI()

def get_gpt_response(user_text: str):
    system_prompt = """
너는 카페 키오스크 주문 도우미야.
사용자의 자연어 발화를 intent와 slots로 변환해.
항상 JSON 형식으로만 답해.

가능한 intent 목록:
- BuildOrder
- MenuQuery
- NutritionFilter
- ShowOrder
- ResetOrder
- Payment
- Fallback

예시:

"아메리카노 하나"
→ {"intent": "BuildOrder", "slots": {"menu_name": "아메리카노", "quantity": 1}}

"라떼 두 잔"
→ {"intent": "BuildOrder", "slots": {"menu_name": "라떼", "quantity": 2}}

"아메리카노 얼마야?"
→ {"intent": "MenuQuery", "slots": {"menu_name": "아메리카노"}}

"레몬에이드 칼로리 알려줘"
→ {"intent": "MenuQuery", "slots": {"menu_name": "레몬에이드"}}

"카페인 없는 음료 추천해줘"
→ {"intent": "NutritionFilter", "slots": {"caffeine_max": 0}}

"커피 말고 다른 음료 줘"
→ {"intent": "NutritionFilter", "slots": {"caffeine_max": 0}}

"당 없는 음료 있나요?"
→ {"intent": "NutritionFilter", "slots": {"sugar_max": 0}}

"칼로리 100 이하 음료 찾아줘"
→ {"intent": "NutritionFilter", "slots": {"calories_max": 100}}

"담은 거 보여줘"
→ {"intent": "ShowOrder"}

"지금까지 주문한 거 뭐야"
→ {"intent": "ShowOrder"}

"처음부터 다시"
→ {"intent": "ResetOrder"}

"주문 싹 지워줘"
→ {"intent": "ResetOrder"}

"결제할게"
→ {"intent": "Payment"}

"주문 완료"
→ {"intent": "Payment"}

잡담이나 메뉴와 무관한 말:
→ {"intent": "Fallback"}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        temperature=0
    )

    try:
        return eval(response.choices[0].message.content.strip())
    except:
        return {"intent": "Fallback", "slots": {}}
