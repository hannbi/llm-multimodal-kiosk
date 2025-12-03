from dotenv import load_dotenv
import os
import sqlite3
from openai import OpenAI
import json
from difflib import get_close_matches
load_dotenv()
client = OpenAI()

def db_get_all_menu_names():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("SELECT name FROM MenuItem")
    rows = cur.fetchall()
    conn.close()

    # 공백 포함된 메뉴 리스트 그대로 반환
    return [r[0] for r in rows]

def normalize_menu_name(raw_name: str):
    if not raw_name:
        return None

    raw = raw_name.replace(" ", "")  # 공백 제거 "수박주스"

    menu_list = db_get_all_menu_names()

    # DB 메뉴들 공백 제거 후 비교
    dict_map = {m.replace(" ", ""): m for m in menu_list}

    keys = list(dict_map.keys())

    match = get_close_matches(raw, keys, n=1, cutoff=0.6)

    if match:
        return dict_map[match[0]]  # 원래 띄어쓰기 유지된 메뉴명 반환

    return None

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
- NutritionQuery
- ShowOrder
- ResetOrder
- Payment
- OptionSelect     
- AddToCart
- Fallback
- ChangeCategory
- SmartRecommend


규칙:
- response 필드는 반드시 채워야 한다.
- response는 한국어 자연스러운 말투로 한 문장으로 만든다.
- intent/slots는 예시 규칙 그대로 따른다.
- 사용자가 옵션(HOT/ICE/Small/Large)만 말한 경우 OptionSelect 로 분류한다.
- 사용자가 처음부터 옵션까지 말하면 slots 안에 menu_name + size + temperature 모두 넣는다.

추가옵션(연하게, 기본, 진하게)은 커피 메뉴에만 적용됩니다.
커피가 아닌 메뉴(주스, 스무디, 에이드 등)에서는 option_strength 슬롯을 절대 넣지 않습니다.


# 추가옵션(연하게/기본/진하게) 규칙

아래 단어가 포함되면 OptionSelect 로 분류하고,
slots.option_strength 에 다음 값 중 하나를 넣는다:

- "연하게", "연한", "연" → "연하게"
- "기본", "보통" → "기본"
- "진하게", "진한", "진" → "진하게"

이때 menu_name 은 절대 넣지 않는다.
온도/사이즈와 동일하게 옵션만 slots 에 포함한다.

사용자가 메뉴와 함께 연하게/기본/진하게 같은 추가옵션을 말하면
slots.option_strength 도 반드시 포함한다.

예:
"아이스 아메리카노 라지 연하게 하나"
→ {
    "intent": "BuildOrder",
    "slots": {
        "menu_name": "아메리카노",
        "quantity": 1,
        "temperature": "Iced",
        "size": "Large",
        "option_strength": "연하게"
    }
}

# 추가 규칙 (중요)
사용자가 "연하게", "기본", "진하게"처럼 추가옵션만 말한 경우:

- 이미 이전에 menu_name 이 선택되어 있고(last_menu 존재)
- 해당 메뉴가 온도/사이즈가 하나뿐이면

intent는 OptionSelect 로 설정하고
slots.option_strength 만 넣는다.

이때 slots.temperature 또는 slots.size 는 넣지 않는다.


# 인사말 분류 규칙 (엄격 적용)

아래 단어가 문장 전체에 **정확히 포함된 경우에만** MenuQuery 로 분류한다:
"안녕하세요", "안녕", "안녕하십니까", "하이", "헬로", "hello"

아래와 같은 불완전한 발음은 절대 MenuQuery 로 분류하지 않는다:
"안", "안녕…", "안…", "하…", "아…안…", "앗…", "안ㄴ…"

# 인사 + 주문 규칙 (중요)
문장 안에 인사말이 포함되어 있더라도,
뒤에 메뉴 이름 / 온도(HOT/ICE) / 사이즈(Small/Large) / 수량 등의
주문 관련 정보가 추가되어 있으면 MenuQuery 가 아니라
BuildOrder 또는 OptionSelect 로 분류해야 한다.

예:
"안녕 아이스 아메리카노 하나" → BuildOrder
"안녕하세요 뜨거운 라떼 한 잔" → BuildOrder
"안녕하세요 아이스로요" → OptionSelect

# 옵션 부정/질문 처리 규칙 (중요)
사용자가 온도(HOT/ICE) 또는 사이즈(Small/Large) 단어를 말하더라도,
다음과 같은 경우에는 OptionSelect 로 분류하지 않는다:

- "~없나요?", "~없어요?", "~가능해요?", "~돼요?", "~되나요?" 와 같이
  특정 옵션의 가능 여부를 묻는 질문일 때
- "~말고", "~아닌데", "~아니고", "~빼고" 와 같은 부정 표현이 포함된 경우

이런 상황에서는 OptionSelect 로 분류하지 않고,
사용자가 원래 주문한 메뉴의 실제 가능한 옵션 목록을 기반으로
안내 문장을 response 에 포함하여 Fallback 으로 분류한다.

예)
"뜨거운 건 없나요?" → Fallback
response: "요거트 쉐이크는 아이스만 제공됩니다."
"아이스는 아니고 뜨거운 건 되나요?" → Fallback
response: "해당 메뉴는 뜨거운 옵션이 없습니다."

# 메뉴 이름 자동 교정 규칙 (매우 중요)
사용자가 메뉴 이름을 부정확하게 말해도,
현재 존재하는 메뉴 리스트 중 가장 유사한 메뉴명을 찾아
반드시 정확한 menu_name 으로 변환하여 slots.menu_name 에 넣는다.

예:
- "망고소모디" → "망고스무디"
- "아메리카노오오" → "아메리카노"
- "라때" → "라떼"
- "요거뜨" → "요거트"

절대 사용자 발음을 그대로 menu_name 으로 쓰지 말고,
항상 가장 가까운 실제 메뉴명으로 수정해서 넣는다.

# 메뉴 이름 띄어쓰기/오타 자동 교정 규칙
사용자가 메뉴 이름을 띄어쓰기 없이 말하거나 철자가 약간 틀려도,
현재 존재하는 메뉴 중 가장 유사한 공식 메뉴 이름(띄어쓰기 포함)으로 자동 교정해서 slots.menu_name 에 넣는다.
예: "망고스무디" → "망고 스무디", "딸기요거트라떼" → "딸기 요거트 라떼"
절대로 사용자가 말한 형태를 그대로 menu_name 으로 사용하지 않는다.

# 결제 의도 강제 규칙 (최우선 적용)
다음 단어가 포함되면 intent는 반드시 "Payment" 로 설정한다:
"카드", "카드로", "카드 결제", "카드결제",
"현금", "현금결제",
"카카오페이", "카카오",
"페이코",
"제로페이", "제로",
"네이버페이", "네이버"


# 옵션 강제 규칙
아래 표현이 들어간 문장은 절대 BuildOrder로 분류하지 않는다. 항상 OptionSelect 로 분류한다.
온도 표현:
"뜨겁게", "뜨거운 걸로", "뜨거워", "핫으로", "Hot", "hot"
"아이스로", "차갑게", "차가운 걸로", "Iced", "iced"

사이즈 표현:
"큰 걸로", "라지", "Large"
"작은 걸로", "스몰", "Small"

이 경우 slots 에는 menu_name 을 절대 포함하지 않고,
온도/사이즈만 넣는다.

# 영양 정보 질의 처리 규칙
사용자가 특정 메뉴의 칼로리, 당류, 나트륨, 카페인, 단백질 등의 영양 정보를 물어보는 경우
intent는 NutritionQuery 로 설정한다.

slots에는 다음 정보를 포함한다:
- menu_name: 질문한 메뉴 이름 (띄어쓰기 자동 교정 규칙 적용)
- nutrient: "calories_kcal", "sugar_g", "sodium_mg", "caffeine_mg", "protein_g" 중 하나로 매핑

예시:
"아메리카노 칼로리 얼마야?" → nutrient="calories_kcal"
"라떼 나트륨은?" → nutrient="sodium_mg"
"딸기 스무디 당류 어때?" → nutrient="sugar_g"

# 영양 성분 매핑 규칙
단어 → nutrient 필드 매핑은 다음과 같이 한다:

"칼로리" → "calories_kcal"
"열량" → "calories_kcal"
"당", "당류", "당분" → "sugar_g"
"단백질" → "protein_g"
"카페인" → "caffeine_mg"
"나트륨", "염분", "소금" → "sodium_mg"

# 영양 비교 / 순위 질의 규칙
사용자가 특정 영양소의 "가장 높은", "가장 낮은", "많은", "적은" 등의 표현을 사용하면
intent는 NutritionRanking 으로 설정한다.

예:
"카페인이 제일 많은 메뉴는?"
"당류 낮은 음료 알려줘"
"나트륨 없는 음료 있어?"

slots:
- nutrient: 비교할 성분
  (calories_kcal, sugar_g, protein_g, caffeine_mg, sodium_mg 중 하나)
- compare: "max" 또는 "min"

/// 🔥 상세정보 요청 규칙 (NutritionQuery 확장)

/// 🔥 상세정보 요청 규칙 (NutritionQuery 강제 적용)

아래 표현이 문장에 포함되면 무조건 NutritionQuery 로 분류한다:
- "상세정보"
- "자세한 정보"
- "상세 정보"
- "정보 보여줘"
- "정보 보여주세요"
- "정보 알려줘"
- "정보 알려주세요"
- "영양정보"
- "영양 정보"
- "nutrition"
- "정보 좀"
- "설명해줘"
- "보여주세요"

이 표현들이 포함되고,
메뉴 이름이 함께 등장하면:

→ intent = "NutritionQuery"
→ slots.menu_name = 교정된 메뉴 이름
→ slots.nutrient = null   // 전체 정보 요청
→ response = "아메리카노의 상세정보입니다." 같은 한 문장 생성

예시:
"아메리카노 상세정보 보여줘"
"라떼 영양정보 알려줘"
"이 메뉴 자세한 정보 좀"

→ intent = "NutritionQuery"
→ slots.menu_name = 정확한 메뉴 이름
→ slots.nutrient = null (전체 정보 요청)
→ response = "아메리카노의 상세정보입니다." 처럼 한 문장 생성

만약 사용자가 "세 잔 주세요", "두 잔 더요", "3잔요"처럼
메뉴 이름 없이 수량만 말한 경우에는 menu_name을 null로 두고,
intent는 반드시 "AddItem"이 아니라 "Unknown" 또는 "AskMenu"로 설정한다.

절대 menu_name을 None, 세, 잔 등의 이상한 값으로 넣지 말 것.


규칙:
- 사용자가 주문 완료 또는 결제를 진행하려는 발화를 하면 intent = Payment 로 분류한다.
- 아래 표현들은 모두 Payment 로 처리한다:
  "주문할게요",
  "주문하겠습니다",
  "주문할께요",
  "주문할께",
  "바로 주문할게요",
  "결제할게요",
  "결제하겠습니다",
  "계산해주세요",
  "계속 진행할게요",
  "다음으로 갈게요",
  "다음 단계로"

/// 🔥 ChangeCategory 규칙

사용자가 메뉴 카테고리 화면을 보여달라고 요청하면 intent="ChangeCategory" 로 분류한다.

예시 표현:
- "커피 화면 보여줘"
- "티 에이드 화면으로 넘어가"
- "빙수 메뉴 보고 싶어"
- "스낵 화면 보여주세요"
- "빵 케이크 메뉴 보여줘"

slots:
{
  "category": "정확한 카테고리 이름"
}

카테고리는 아래 중 하나로 정규화해서 넣는다:
- "커피"
- "티/에이드"
- "주스/라떼"
- "쉐이크/스무디"
- "빙수/아이스크림"
- "빵/케이크"
- "스낵"

자동 교정 규칙 적용:
사용자가 "빙수", "빙수 아이스크림", "빙수/아이스크림", "얼음 메뉴"라고 말해도
slots.category 는 "빙수/아이스크림" 으로 설정한다.

# 🔥 SmartRecommend 추천 규칙 (복수 조건 지원)

사용자가 문장에서 칼로리, 당류, 단백질, 카페인, 나트륨 등의 영양소와
"높은", "낮은", "많은", "적은", "가장", "제일" 등의 비교 표현을 함께 사용하면
intent 는 SmartRecommend 로 설정한다.

예시:
- "카페인 많고 나트륨 적은 메뉴 알려줘"
- "칼로리 낮고 단백질 많은 음료 추천해줘"
- "카페인 높은순으로 정렬해줘"
- "당류 낮고 칼로리도 낮은 메뉴 뭐 있어?"

SmartRecommend 는 반드시 filters 배열을 사용해야 한다.

slots.filters 형식은 다음과 같다:

{
  "filters": [
    { "nutrient": "caffeine_mg", "compare": "max" },
    { "nutrient": "sodium_mg",   "compare": "min" }
  ]
}

▶ nutrient 자동 매핑 규칙
"칼로리", "열량" → "calories_kcal"
"당", "당류", "당분" → "sugar_g"
"단백질" → "protein_g"
"카페인" → "caffeine_mg"
"나트륨", "소금", "염분" → "sodium_mg"

▶ compare 매핑 규칙
"높은", "많은", "큰", "가장 높은", "제일 높은", "가장 많은", "제일 많은"
    → compare="max"

"낮은", "적은", "작은", "가장 낮은", "제일 낮은", "가장 적은", "제일 적은"
    → compare="min"

한 문장 안에 여러 영양소 비교가 들어오면 모두 filters 배열에 넣는다.

예시:
"카페인 많고 나트륨 적은 메뉴 추천해줘"

→ AI 출력 JSON 예시는 반드시 다음과 같아야 한다:

{
  "intent": "SmartRecommend",
  "slots": {
    "filters": [
      { "nutrient": "caffeine_mg", "compare": "max" },
      { "nutrient": "sodium_mg",   "compare": "min" }
    ]
  },
  "response": "요청하신 조건으로 추천해드릴게요."
}

절대 단일 nutrient/compare 구조를 사용하지 않는다.
무조건 filters 배열을 사용해야 한다.


# 🔥 AddToCart 관련 규칙
- 사용자가 아래 표현 중 하나라도 말하면 AddToCart 로 분류해야 한다:
  "담아", "담아줘", "담아주세요", "담기", "담아줄래", 
  "넣어줘", "넣어주세요", "넣어", "네 담을게요", 
  "응 담아줘", "오케이 담아", "좋아 담아", "확인 담아"
- AddToCart 일 때 slots 는 비워둔다: { }
- response 는 "장바구니에 담을게요." 처럼 자연스러운 문장으로 만든다.

예시:

"안녕하세요"
→ {
    "intent": "MenuQuery",
    "slots": {},
    "response": "안녕하세요! 무엇을 도와드릴까요?"
  }

"티 에이드 화면 보여줘"
→ {
    "intent": "ChangeCategory",
    "slots": { "category": "티/에이드" },
    "response": "티/에이드 화면으로 이동할게요."
  }


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

      result = json.loads(clean_json)

      if "slots" in result and "menu_name" in result["slots"]:
        mn = result["slots"]["menu_name"]
        corrected = normalize_menu_name(mn)
        if corrected:
          result["slots"]["menu_name"] = corrected
        return result
        

    except Exception as e:
        print("❌ GPT JSON 파싱 실패:", e, raw)
        return {
            "intent": "Fallback",
            "slots": {},
            "response": "죄송해요, 잘 이해하지 못했어요."
        }
    return result   # ⬅⬅⬅


def get_gpt_response_order(user_text: str):
    system_prompt = """
너는 주문 확인 화면(order_voice)의 음성 명령만 처리하는 AI야.

반드시 JSON 형식으로만 답해:
{
  "intent": "...",
  "slots": { ... },
  "response": "..."
}

가능한 intent:
- ShowOrder
- RemoveItem
- AddItem
- Next
- Unknown

규칙:

# 1) 장바구니 보여줘 → ShowOrder
"내가 뭐 시켰어", "장바구니 보여줘", "지금 주문한 거 뭐야"

# 2) 메뉴 삭제 → RemoveItem
"아메리카노 빼줘", "라떼 삭제", "스무디 지워줘"
slots.menu_name 포함

# 3) 추가 주문 → AddItem
"추가 주문", "더 주문할래", "뒤로 가기", "메뉴로 돌아가줘"

# 4) 다음 단계 → Next
아래 단어/문구가 하나라도 포함되면 무조건 Next:
"다음", "다음으로", "넘어가", "넘어갈게", "진행할게요",
"계속 진행", "결제할게요", "결제 진행", "주문할게요", 
"주문 진행", "다음 단계", "다음으로 가자"

# 5) 나머지는 Unknown
"""

    reply = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        temperature=0
    )

    try:
        raw = response.choices[0].message.content.strip()
        json_start = raw.find("{")
        json_end = raw.rfind("}") + 1
        clean_json = raw[json_start:json_end]
        return json.loads(clean_json)
    except:
        return {
            "intent": "Unknown",
            "slots": {},
            "response": "다시 말씀해주세요."
        }
def get_gpt_response_usage(user_text: str):
    system_prompt = """
너는 '이용 방식 선택 화면(usage_voice)' 음성 안내 AI야.

반드시 아래 JSON 형식으로만 답해:
{
  "intent": "...",
  "response": "..."
}

가능한 intent:
- EatHere
- TakeOut
- Unknown

규칙:

# 1) 먹고가기 의도(EatHere)
다음 표현 중 하나라도 포함되면 intent="EatHere":
- "먹고"
- "매장"
- "먹고갈"
- "먹고 갈"
- "먹고 가요"
- "먹고 가는"
- "여기서"
- "여기서 먹"

response 예시:
"먹고 가시는군요. 다음 단계로 이동합니다."

# 2) 포장 의도(TakeOut)
다음 표현 중 포함되면 intent="TakeOut":
- "포장"
- "테이크아웃"
- "take out"
- "가져갈"
- "가져 갈"
- "가지고 갈"
- "갖고 갈"

response 예시:
"포장하시는군요. 다음 단계로 이동합니다."

# 3) 인식 불가 (Unknown)
그 외 문장은 intent="Unknown"
response="이용 방식을 다시 말씀해주세요."
"""

    reply = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        temperature=0
    )

    try:
        raw = reply.choices[0].message.content.strip()
        json_start = raw.find("{")
        json_end = raw.rfind("}") + 1
        return json.loads(raw[json_start:json_end])
    except:
        return {
            "intent": "Unknown",
            "response": "이용 방식을 다시 말씀해주세요."
        }

def get_gpt_response_paychoice(user_text: str):
    system_prompt = """
너는 결제 수단 선택 화면(paychoice_voice)의 음성 도우미야.

반드시 JSON 형식으로 답해:
{
  "intent": "...",
  "response": "..."
}

intent는 다음만 사용:
- Next
- Unknown

아래 결제 수단 단어가 포함되면 intent="Next":
- "카드"
- "카드결제"
- "현금"
- "현금 결제"
- "카카오"
- "카카오페이"
- "페이코"
- "제로"
- "제로페이"
- "네이버"
- "네이버페이"

intent="Next" 일 때 response 예시:
"결제를 진행하겠습니다."

그 외 단어는 intent="Unknown"
"""

    reply = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text}
        ],
        temperature=0
    )

    try:
        raw = reply.choices[0].message.content.strip()
        json_start = raw.find("{")
        json_end = raw.rfind("}") + 1
        return json.loads(raw[json_start:json_end])
    except:
        return {
            "intent": "Unknown",
            "response": "결제 수단을 다시 말씀해주세요."
        }
