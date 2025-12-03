from dotenv import load_dotenv
load_dotenv()

import time
from speech_to_text import transcribe_from_mic
from fastapi import Form
import json
from gpt_response import get_gpt_response
from text_to_speech import speak
import sqlite3

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

from fastapi.staticfiles import StaticFiles
import shutil, uuid
import os

# 웰컴멘트 중복 재생 방지
last_welcome_time = 0
WELCOME_COOLDOWN = 5

app = FastAPI(title="llm-multimodal-API", version="1.0")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 대화 상태 저장
state = {
    "last_menu": None,
    "order_list": [],
    "pending": {}  # 🔥 옵션 선택 임시 저장 공간 추가
}

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def normalize_temperature(t):
    if t is None:
        return None
    
    if isinstance(t, int):
        # 0을 Hot, 1을 Iced 로 가정
        return "Hot" if t == 0 else "Iced"

    t = t.lower()

    # Hot 인식
    if "hot" in t or "뜨" in t or "데" in t or "핫" in t:
        return "Hot"

    # Iced 인식
    if "ice" in t or "차" in t or "아이스" in t:
        return "Iced"

    return None


def normalize_size(s):
    if not s:
        return None

    s = s.lower().replace(" ", "")  # 공백 제거: "작은 걸로" → "작은걸로"

    # Small 패턴
    small_keywords = [
        "small", "스몰", "작", "작게", "작은", "작은거", "작은걸로",
        "소", "소자", "조그만", "조금만"  # 실제 사용자 발화 대응
    ]
    for kw in small_keywords:
        if kw in s:
            return "Small"

    # Large 패턴
    large_keywords = [
        "large", "라지", "큰", "큰거", "큰걸로", "대", "대자"
    ]
    for kw in large_keywords:
        if kw in s:
            return "Large"

    return None



# -----------------------------
# 텍스트 모드 테스트
# -----------------------------
def run_kiosk():
    print("🎤 V3X 키오스크 텍스트 테스트 모드 시작 ('종료' 입력시 종료)")

    intro_message = "어서오세요. V three X 카페입니다. 주문 도와드리겠습니다."
    print(f"🤖 안내: {intro_message}")

    while True:
        text = input("👉 주문 문장을 입력하세요: ")

        if "종료" in text or "그만" in text:
            print("👋 키오스크를 종료합니다.")
            break

        gpt_reply = get_gpt_response(text)
        print(f"🤖 GPT 응답: {gpt_reply}")

        intent = gpt_reply.get("intent")
        slots = gpt_reply.get("slots", {})
        response = process_intent(intent, slots)

        print(f"🤖 최종 멘트: {response}")

@app.post("/voice_usage_page")
async def process_voice_usage_page(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}.webm"
    filepath = f"uploads/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = transcribe_from_mic(filepath)
    print("🎤 [usage_voice] STT ===>", text)

    from gpt_response import get_gpt_response_usage
    gpt_reply = get_gpt_response_usage(text)

    intent = gpt_reply.get("intent")
    answer = gpt_reply.get("response")

    output = f"uploads/{uuid.uuid4()}.mp3"
    speak(answer, output)

    return {
        "user_text": text,
        "ai_text": answer,
        "intent": intent,
        "audio_url": output
    }

@app.post("/usage_voice_tts_intro")
async def usage_voice_tts_intro():
    text = "이용 방식을 말씀해주세요."
    output = f"uploads/{uuid.uuid4()}.mp3"
    speak(text, output)

    return {
        "ai_text": text,
        "audio_url": output
    }

@app.post("/paychoice_voice_tts_intro")
async def paychoice_voice_tts_intro():
    text = "결제 수단을 말씀해주세요."
    output = f"uploads/{uuid.uuid4()}.mp3"
    speak(text, output)

    return {
        "ai_text": text,
        "audio_url": output
    }


@app.post("/voice_paychoice_page")
async def process_voice_paychoice_page(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}.webm"
    filepath = f"uploads/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = transcribe_from_mic(filepath)
    print("🎤 [paychoice_voice] STT ===>", text)

    from gpt_response import get_gpt_response_paychoice
    gpt_reply = get_gpt_response_paychoice(text)

    intent = gpt_reply.get("intent")
    answer = gpt_reply.get("response")

    output = f"uploads/{uuid.uuid4()}.mp3"
    speak(answer, output)

    return {
        "user_text": text,
        "ai_text": answer,
        "intent": intent,
        "audio_url": output
    }

@app.post("/pay_process_voice_tts")
async def pay_process_voice_tts():
    text = "결제를 진행중입니다. 신용카드를 투입구에 넣어주세요."
    output = f"uploads/{uuid.uuid4()}.mp3"
    speak(text, output)

    return {
        "ai_text": text,
        "audio_url": output
    }

@app.post("/complete_voice_tts")
async def complete_voice_tts():
    global cart
    state["pending"] = {}
    state["last_menu"] = None
    cart = []  # 🔥 주문 전체 초기화

    text = "결제가 완료되었습니다. 잠시 후 주문이 준비됩니다."
    output = f"uploads/{uuid.uuid4()}.mp3"
    speak(text, output)

    return {
        "ai_text": text,
        "audio_url": output
    }

# -----------------------------
# 이미지 업로드
# -----------------------------
@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = f"uploads/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"http://localhost:5000/uploads/{filename}"

    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")
    conn = sqlite3.connect(db_path)

    cur = conn.cursor()
    cur.execute("INSERT INTO SpotImage (image_url) VALUES (?)", (image_url,))
    conn.commit()
    conn.close()

    return {"image_url": image_url}

@app.get("/recommend")
def recommend(nutrient: str, compare: str):
    items = db_get_all_menu_details()
    if not items:
        return {"ai_text": "메뉴 정보를 불러올 수 없어요.", "recommend": []}

    # --- 랜덤 추천 ---
    if nutrient == "random":
        import random
        random_items = random.sample(items, min(5, len(items)))

        # DB 연결
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, "kiosk.db")
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        results = []
        for m in random_items:
            cur.execute("""
                SELECT Product.price, MenuItem.image_url
                FROM Product
                JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
                WHERE MenuItem.name = ?
                LIMIT 1
            """, (m["name"],))
            row = cur.fetchone()

            results.append({
                "name": m["name"],
                "calories_kcal": m["calories_kcal"],
                "sugar_g": m["sugar_g"],
                "protein_g": m["protein_g"],
                "caffeine_mg": m["caffeine_mg"],
                "sodium_mg": m["sodium_mg"],
                "price": row[0] if row else 0,
                "img": row[1] if row else ""
            })

        conn.close()
        return {
            "ai_text": "랜덤으로 메뉴 5개를 추천해드릴게요!",
            "recommend": results
        }

    # --- 가격 필터 ---
    if nutrient == "price":
        # Product 테이블에서 가격 + 기본 정보 가져오도록 확장 필요
        enriched = db_get_all_menu_with_price()

        reverse_sort = (compare == "max")
        sorted_items = sorted(enriched, key=lambda x: x["price"], reverse=reverse_sort)
        top_items = sorted_items[:5]

        return {
            "ai_text": f"가격이 {'높은' if compare=='max' else '낮은'} 메뉴 TOP 5를 추천해드릴게요.",
            "recommend": top_items
        }

    # --- 일반 영양소 필터 ---
    valid_items = [item for item in items if item[nutrient] is not None]

    reverse_sort = (compare == "max")
    sorted_items = sorted(valid_items, key=lambda x: x[nutrient], reverse=reverse_sort)

    # TOP 5
    top_items = sorted_items[:5]

    # DB 연결
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    results = []
    for m in top_items:
        cur.execute("""
            SELECT Product.price, MenuItem.image_url
            FROM Product
            JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
            WHERE MenuItem.name = ?
            LIMIT 1
        """, (m["name"],))
        row = cur.fetchone()

        results.append({
            "name": m["name"],
            "calories_kcal": m["calories_kcal"],
            "sugar_g": m["sugar_g"],
            "protein_g": m["protein_g"],
            "caffeine_mg": m["caffeine_mg"],
            "sodium_mg": m["sodium_mg"],
            "price": row[0] if row else 0,
            "img": row[1] if row else ""
        })

    conn.close()

    readable = {
        "calories_kcal": "칼로리",
        "sugar_g": "당류",
        "protein_g": "단백질",
        "caffeine_mg": "카페인",
        "sodium_mg": "나트륨",
    }.get(nutrient, "영양소")

    direction = "낮은" if compare == "min" else "높은"
    ai_msg = f"{readable}가 {direction} 메뉴 TOP 5를 추천해드릴게요."

    return {
        "ai_text": ai_msg,
        "recommend": results
    }

# -----------------------------
# 음성 처리 엔드포인트
# -----------------------------
@app.post("/voice")
async def process_voice(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}.webm"
    filepath = f"uploads/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2) STT
    text = transcribe_from_mic(filepath)
    print("🎤 STT 결과 ===>", text)

    # 3) GPT 응답
    gpt_reply = get_gpt_response(text)
    intent = gpt_reply.get("intent")
    slots = gpt_reply.get("slots", {})

    answer = process_intent(intent, slots)

    # 4) TTS 생성
    output_path = f"uploads/{uuid.uuid4()}.mp3"
    tts_text = answer["message"] if isinstance(answer, dict) else answer
    speak(tts_text, output_path)

    next_action = "go_payment" if intent == "Payment" else None

    return {
        "user_text": text,
        "ai_text": answer["message"] if isinstance(answer, dict) else answer,
        "intent": intent,
        "slots": slots,
        "recommend": answer.get("recommend") if isinstance(answer, dict) else None,
        "audio_url": output_path,
        "next_action": next_action
    }


# order_voice 단계 음성 처리 엔드포인트 (🔥 수정완료)
# -----------------------------
@app.post("/voice_order_page")
async def process_voice_in_order_page(
    file: UploadFile = File(...),
    cart: str = Form("")   # ← 반드시 cart 로 수정!
):
    global cart_items

    try:
        cart_items = json.loads(cart) if cart else []
    except:
        cart_items = []

    filename = f"{uuid.uuid4()}.webm"
    filepath = f"uploads/{filename}"


    # 파일 저장
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 1) STT
    text = transcribe_from_mic(filepath)
    print("🎤 [order_voice] STT 결과 ===>", text)
    t = text.replace(" ", "")
    NEXT_KEYWORDS = [
        "다음", "다음으로", "다음단계",
        "넘어가", "넘어갈게", "넘어갈게요", "넘어갑시다",
        "주문할게요", "주문하겠습니다", "결제할게요", "결제하러",
        "계속진행", "바로진행", "다음으로가자", "다음가자"
    ]
    if any(kw in t for kw in NEXT_KEYWORDS):
        print("🎯 [order_voice] 사용자 발화로 Next intent 강제 적용됨!")
        return {
            "ai_text": "다음 단계로 이동할게요.",
            "intent": "Next",
            "cart": enrich_cart(cart_items),
            "audio_url": speak_and_return("다음 단계로 이동할게요.")
        }

    # 2) GPT 해석
    from gpt_response import get_gpt_response_order

    gpt_reply = get_gpt_response_order(text)
    intent = gpt_reply.get("intent")
    slots = gpt_reply.get("slots", {})

    print("🧠 [order_voice] GPT intent =", intent, "slots =", slots)

    # -------------------------------------------------------
    # 🔥 order_voice 전용 intent 처리
    # -------------------------------------------------------

    # 1) 음료 삭제
    if intent == "RemoveItem":
        return {
            "ai_text": f"{slots.get('menu_name')} 삭제할게요.",
            "intent": "RemoveItem",
            "slots": slots,
            "cart": enrich_cart(cart_items),
            "audio_url": speak_and_return("삭제했습니다.")
        }

    # 2) 장바구니 보여줘
    if intent == "ShowOrder":

        if not cart_items:
            msg = "장바구니에 담긴 메뉴가 없어요."
        else:
            items_text = ", ".join([
                f"{item['name']} {item['qty']}잔"
                for item in cart_items   # ← 여기가 진짜 cart!!!!!
            ])
            msg = f"현재 주문하신 메뉴는 {items_text} 입니다."

        return {
            "ai_text": msg,
            "intent": "ShowOrder",
            "cart": enrich_cart(cart_items),
            "audio_url": speak_and_return(msg)
        }

    # 3) 음료 추가
    if intent == "AddItem":
        return {
            "ai_text": f"{slots.get('menu_name')} 한 잔 더 추가할게요.",
            "intent": "AddItem",
            "slots": slots,
            "cart": enrich_cart(cart_items),   # 현재 장바구니 함께 리턴
            "audio_url": speak_and_return(
                f"{slots.get('menu_name')} 한 잔 더 추가했습니다."
            )
        }

    # 4) 다음 단계
    if intent == "Next":
        return {
            "ai_text": "다음 단계로 이동할게요.",
            "intent": "Next",
            "cart": enrich_cart(cart_items),
            "audio_url": speak_and_return("다음 단계로 이동합니다.")
        }

    # 5) 기본 응답
    return {
        "ai_text": "현재 화면에서 할 수 있는 명령은 삭제, 추가, 다음 입니다.",
        "intent": "Unknown",
        "cart": enrich_cart(cart_items),
        "audio_url": speak_and_return("명령을 다시 말씀해주세요.")
    }

# -----------------------------
# 공용 TTS 함수 (간편용)
# -----------------------------
def speak_and_return(text):
    output_path = f"uploads/{uuid.uuid4()}.mp3"
    speak(text, output_path)
    return output_path

def enrich_cart(cart):
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    enriched = []
    for item in cart:
        cur.execute("""
            SELECT Product.price, MenuItem.image_url
            FROM Product
            JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
            WHERE MenuItem.name = ?
            LIMIT 1
        """, (item["name"],))

        row = cur.fetchone()
        price = row[0] if row else 0
        img = row[1] if row else ""

        enriched.append({
            "name": item["name"],
            "qty": item.get("qty", 1),
            "price": price,
            "img": img,
            "temp": item.get("temperature") or item.get("temp"),
            "size": item.get("size"),
            "option": item.get("option")
        })

    conn.close()
    return enriched

# -----------------------------
# 웰컴 멘트
# -----------------------------
@app.get("/speak/welcome")
def speak_welcome():
    global last_welcome_time
    now = time.time()

    if now - last_welcome_time < WELCOME_COOLDOWN:
        print("⏳ 쿨다운 중 → 무시")
        return {"status": "ignored"}

    last_welcome_time = now

    output_path = f"uploads/{uuid.uuid4()}.mp3"
    speak("어서오세요. 모멘트 커피입니다.", output_path)

    return {
        "status": "played",
        "audio_url": output_path
    }


app.include_router(router, prefix="/api")

# -----------------------------
# 주문 처리 엔진
# -----------------------------
cart = []

def to_int(v):
    return int(v) if v is not None else 0


def process_intent(intent, slots):
    global cart

     # --------------------
    # 0) MenuQuery
    # --------------------
    if intent == "MenuQuery":
        return "안녕하세요! 주문 도와드릴게요."

        # --------------------
    # ChangeCategory (🔥 신규 추가)
    # --------------------
    
    if intent == "ChangeCategory":
        category = slots.get("category", "").lower()

        if not category:
            return "어떤 화면을 보여드릴까요? 커피, 티/에이드, 빙수 같은 카테고리를 말씀해주세요."

    # 부분 매칭 방식
        if "커피" in category or "coffee" in category:
            normalized = "커피"

        elif "티" in category or "에이드" in category:
            normalized = "티/에이드"

        elif "주스" in category or "라떼" in category:
            normalized = "주스/라떼"

        elif "쉐이크" in category or "스무디" in category:
            normalized = "쉐이크/스무디"

        elif "빙수" in category or "아이스크림" in category:
            normalized = "빙수/아이스크림"

        elif "빵" in category or "케이크" in category:
            normalized = "빵/케이크"

        elif "스낵" in category:
            normalized = "스낵"

        else:
            return f"{category} 카테고리를 찾지 못했어요."

    # React로 전달할 상태 저장
        state["target_category"] = normalized

        return f"{normalized} 화면으로 이동할게요."


    
    
    # --------------------
    # 1) BuildOrder
    # --------------------
# --------------------
# 1) BuildOrder
# --------------------
    if intent == "BuildOrder":
        name = slots.get("menu_name")
        if not name:
            return "어떤 메뉴를 원하시는지 말씀해주세요."

        qty = slots.get("quantity", 1)
        temp = normalize_temperature(slots.get("temperature"))
        size = normalize_size(slots.get("size"))
        strength = slots.get("option_strength")   # ⭐ 추가됨 (연하게/기본/진하게)

        menu = db_get_menu(name)
        if not menu:
            return f"{name}는 없는 메뉴예요."

        valid_temps = [normalize_temperature(t) for t in menu["temperatures"]]
        valid_sizes = [normalize_size(s) for s in menu["sizes"]]

        if temp and temp not in valid_temps:
            temp = None
        if size and size not in valid_sizes:
            size = None

    # ⭐ pending에 옵션 전부 저장
        pending = {"name": name, "qty": qty}
        if temp:
            pending["temperature"] = temp
        if size:
            pending["size"] = size
        if strength:
            pending["strength"] = strength   # ⭐ 추가됨
            
        # ⭐⭐⭐ 온도/사이즈/옵션이 전혀 필요 없는 메뉴는 바로 완료 처리
        if len(valid_temps) == 0 and len(valid_sizes) == 0:
    # 예: 감자쿠키 같은 빵류
            state["pending"] = {
                "name": name,
                "qty": qty,
                "temperature": None,
                "size": None,
                "strength": None
            }
            return "선택이 완료되었어요. 담을까요?"


        state["last_menu"] = name
        state["pending"] = pending

        has_temp = "temperature" in pending
        has_size = "size" in pending
        has_strength = "strength" in pending   # ⭐ 추가됨

    # ⭐⭐⭐ temp + size + strength → 모두 선택됨
        if has_temp and has_size and has_strength:
            return "선택이 완료되었어요. 담을까요?"

    # 기존 메시지 그대로 유지
        if len(valid_temps) > 1 and not has_temp:
            return "원하시는 온도를 말씀해주세요."
        if len(valid_sizes) > 1 and not has_size:
            return "사이즈를 말씀해주세요."
    
        category = menu.get("category", "")
        is_coffee = category == "커피"

# 온도 1개일 때 → None이면 옵션 없는 메뉴 처리
        if len(valid_temps) == 1 and not has_temp:
            if valid_temps[0] is None:
                pending["temperature"] = None
            else:
                pending["temperature"] = valid_temps[0]
                state["pending"] = pending
                return f"{name}는 온도가 {valid_temps[0]} 하나뿐이라 자동으로 선택했어요."
            state["pending"] = pending

# 사이즈 1개일 때 → None이면 옵션 없는 메뉴 처리
        if len(valid_sizes) == 1 and not has_size:
            if valid_sizes[0] is None:
                pending["size"] = None
            else:
                pending["size"] = valid_sizes[0]
                state["pending"] = pending
                return f"{name}는 사이즈가 {valid_sizes[0]} 하나뿐이라 자동으로 선택했어요."
            state["pending"] = pending

# 온도/사이즈 모두 None → 옵션 없는 메뉴 → 바로 선택 완료
        if pending.get("temperature") is None and pending.get("size") is None:
            return f"{name} 담을까요?"


# 커피는 strength 필요
        if is_coffee:
            if not has_strength:
                return "연하게, 기본, 진하게 중에서 선택해주세요."
        else:
    # ☕ 커피가 아닐 경우 strength 필요 없음 → 옵션 완료 판정
            if has_temp and has_size:
                return "선택이 완료되었어요. 담을까요?"

    # --------------------
    # 2) OptionSelect
    # --------------------
    if intent == "OptionSelect":
        temp = normalize_temperature(slots.get("temperature"))
        size = normalize_size(slots.get("size"))
        strength = slots.get("option_strength")

    # ⭐ 메뉴 이름이 없으면 마지막 메뉴로 자동 설정
        if not slots.get("menu_name"):
            if state.get("last_menu"):
                slots["menu_name"] = state["last_menu"]

    # ⭐ pending 초기값 설정
        pending = state.get("pending", {})
        if "name" not in pending:
            pending["name"] = slots["menu_name"]
            pending["qty"] = 1

        name = pending["name"]


        menu = db_get_menu(name)
        valid_temps = [normalize_temperature(t) for t in menu["temperatures"]]
        valid_sizes = [normalize_size(s) for s in menu["sizes"]]
        if len(valid_temps) == 1 and "temperature" not in pending:
            pending["temperature"] = valid_temps[0]

    # 🔥 사이즈가 1개뿐이면 자동 적용
        if len(valid_sizes) == 1 and "size" not in pending:
            pending["size"] = valid_sizes[0]
        if temp:
            if temp not in valid_temps:
                return f"{name}는 {temp}로 제공되지 않아요."
            pending["temperature"] = temp

        if size:
            if size not in valid_sizes:
                return f"{name}는 {size} 사이즈가 없어요."
            pending["size"] = size

        if strength:
            pending["strength"] = strength    # ⭐ 추가됨

        has_temp = "temperature" in pending
        has_size = "size" in pending
        has_strength = "strength" in pending  # ⭐ 추가됨

    # ⭐⭐⭐ 모든 옵션 선택됨
        if has_temp and has_size and has_strength:
            return "선택이 완료되었어요. 담을까요?"

        if not has_temp:
            return "원하시는 온도를 말씀해주세요."

        if not has_size:
            return "사이즈도 말씀해주세요."

# strength는 커피만
        category = menu.get("category", "")
        is_coffee = category == "커피"
        if is_coffee:
            if not has_strength:
                return "연하게, 기본, 진하게 중에서 골라주세요."
        else:
    # 커피가 아니면 strength 필요 없음 → temp+size 선택 완료 시 종료
            if has_temp and has_size:
                return "선택이 완료되었어요. 담을까요?"


    # --------------------
# NutritionQuery
# --------------------
    if intent == "NutritionQuery":
        name = slots.get("menu_name")
        nutrient = slots.get("nutrient")
        
        state["last_menu"] = name
        state["pending"] = {"name": name, "qty": 1}

        menu = db_get_menu(name)
        if not menu:
            return f"{name}는 없는 메뉴예요."

    # DB 상세 정보 가져오기
        detail = db_get_menu_detail(name)
        if not detail:
            return f"{name}의 상세 정보를 찾을 수 없어요."
        
        if nutrient is None:
            return (
                f"{name}의 상세정보입니다. "
                f"칼로리는 {to_int(detail['calories_kcal'])} kcal, "
                f"당류는 {to_int(detail['sugar_g'])} g, "
                f"단백질은 {to_int(detail['protein_g'])} g, "
                f"카페인은 {to_int(detail['caffeine_mg'])} mg, "
                f"나트륨은 {to_int(detail['sodium_mg'])} mg 입니다."
                f"용량은 {to_int(detail['volume'])} ml 입니다."
        )

        value = detail.get(nutrient)
        if value is None:
            return f"{name}의 {nutrient} 정보를 찾을 수 없어요."

    # 사람말로 바꾸기
        readable = {
            "calories_kcal": "칼로리는",
            "sugar_g": "당류는",
            "sodium_mg": "나트륨은",
            "caffeine_mg": "카페인은",
            "protein_g": "단백질은",
            "volume": "용량은",
        }.get(nutrient, "해당 값은")

        return f"{name}의 {readable} {to_int(value)} 입니다."
    
    
    # --------------------
# NutritionRanking
# --------------------
    if intent == "NutritionRanking":
        nutrient = slots.get("nutrient")
        compare = slots.get("compare")  # "max" 또는 "min"

        if not nutrient or not compare:
            return "어떤 영양소를 비교할지 알려주세요."

        items = db_get_all_menu_details()
        if not items:
            return "메뉴 정보를 불러올 수 없어요."

        values = [item[nutrient] for item in items if item[nutrient] is not None]
        if not values:
            return "해당 영양소 정보가 있는 메뉴가 없어요."
        target_value = max(values) if compare == "max" else min(values)
        
        

    # 해당 값을 가진 모든 메뉴 찾기
        matched = [item["name"] for item in items if item[nutrient] == target_value]

        readable = {
            "calories_kcal": "칼로리",
            "sugar_g": "당류",
            "protein_g": "단백질",
            "caffeine_mg": "카페인",
            "sodium_mg": "나트륨",
        }.get(nutrient, "해당 영양소")

        if len(matched) == 1:
            return f"{readable}가 가장 { '높은' if compare=='max' else '낮은' } 메뉴는 {matched[0]}이며 {target_value} 입니다."

        menu_list = ", ".join(matched)
        return f"{readable}가 가장 { '높은' if compare=='max' else '낮은' } 메뉴는 {menu_list}이며 모두 {target_value} 입니다."
# --------------------

    # --------------------
    # SmartRecommend (터치 모드와 동일한 범위 필터 버전)
    # --------------------
    if intent == "SmartRecommend":
        filters = slots.get("filters")
        items = db_get_all_menu_with_price()

        # -----------------------
        # filters 없으면 단일 nutrient 로 구성
        # -----------------------
        if not filters:
            nutrient = slots.get("nutrient")
            compare = slots.get("compare")

            if nutrient:
                filters = [{ "nutrient": nutrient, "compare": compare }]
            else:
                return { "message": "추천 조건을 이해하지 못했어요.", "recommend": [] }

        # -----------------------
        # 범위 매핑 함수 (터치 모드와 동일)
        # -----------------------
        def get_range(nutrient, compare):
            if nutrient == "caffeine_mg":
                return (150, None) if compare == "max" else (0, 100)
            if nutrient == "sodium_mg":
                return (200, None) if compare == "max" else (0, 100)
            if nutrient == "sugar_g":
                return (50, None) if compare == "max" else (0, 25)
            if nutrient == "protein_g":
                return (10, None) if compare == "max" else (0, 10)
            if nutrient == "calories_kcal":
                return (220, None) if compare == "max" else (0, 130)
            return (None, None)

        # -----------------------
        # 각 조건 AND 필터링
        # -----------------------
        for cond in filters:
            n = cond["nutrient"]
            c = cond["compare"]

            min_v, max_v = get_range(n, c)
            new_items = []

            for item in items:
                val = item[n]
                if val is None:
                    continue

                ok = True
                if min_v is not None and val < min_v:
                    ok = False
                if max_v is not None and val > max_v:
                    ok = False

                if ok:
                    new_items.append(item)

            items = new_items

        # -----------------------
        # 정렬: 첫 번째 조건 기준
        # -----------------------
        first = filters[0]
        n0 = first["nutrient"]
        reverse_order = (first["compare"] == "max")
        items = sorted(items, key=lambda x: x[n0], reverse=reverse_order)

        results = items[:10]

        # -----------------------
        # 메시지 생성
        # -----------------------
        readable_map = {
            "calories_kcal": "칼로리",
            "sugar_g": "당류",
            "protein_g": "단백질",
            "caffeine_mg": "카페인",
            "sodium_mg": "나트륨",
        }

        cond_texts = []
        for cond in filters:
            nu = readable_map.get(cond["nutrient"], cond["nutrient"])
            cp = "높은" if cond["compare"] == "max" else "낮은"
            cond_texts.append(f"{nu} {cp}")

        msg = f"{' · '.join(cond_texts)} 조건에 맞는 메뉴를 추천해드릴게요."

        return {
            "message": msg,
            "recommend": results,
            "filters": filters
        }

 # --------------------
    # 3) AddToCart (🔥 신규 추가)
    # --------------------
    if intent == "AddToCart":
        pending = state.get("pending")

        if not pending or not pending.get("name"):
            return "담을 메뉴가 없어요."

        name = pending.get("name")
        qty = pending.get("qty", 1)
        temp = pending.get("temperature")
        size = pending.get("size")

        cart.append({
            "name": name,
            "qty": qty,
            "temperature": temp,
            "size": size,
            "strength": pending.get("strength")
        })

        state["pending"] = {}

        return f"{name} {qty}개 담았어요."

    # --------------------
    # 장바구니 보기
    # --------------------
    if intent == "ShowOrder":
    # cart_items가 현재 환경에 없으면 주문 단계가 아니므로 무시
        if 'cart_items' not in globals() and 'cart' not in globals():
            return "주문 단계가 아닙니다."

        if not cart:
            return "장바구니가 비어 있어요."

        text = "현재 담긴 메뉴는 "
        for item in cart:
            text += f"{item['name']} {item['qty']}잔, "
        return text


    # --------------------
    # 장바구니 초기화
    # --------------------
    if intent == "ResetOrder":
        cart = []
        return "장바구니를 비웠어요."

    # --------------------
    # 결제
    # --------------------
    if intent == "Payment":
        if not cart:
            return "아직 담긴 메뉴가 없어요."
        return "결제를 진행할게요."

    return "죄송해요, 이해하지 못했어요."


# -----------------------------
# DB 조회 함수
# -----------------------------
def db_get_menu(name):
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))   # backend/
    db_path = os.path.join(base_dir, "kiosk.db")            # backend/kiosk.db

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            MenuItem.name,
            MenuItem.category,
            Product.price,
            Product.temperature_type,
            Product.size
        FROM Product
        JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
        WHERE MenuItem.name = ?
    """, (name,))

    rows = cur.fetchall()
    conn.close()

    if not rows:
        return None

    temperatures = set(r[3] for r in rows)   # Product.temperature_type
    sizes = set(r[4] for r in rows)          # Product.size


    return {
        "name": name,
        "category": rows[0][1], 
        "price": rows[0][2],
        "need_temp": len(temperatures) > 1,
        "need_size": len(sizes) > 1,
        "temperatures": list(temperatures),
        "sizes": list(sizes),
    }

def db_get_menu_detail(name):
    import os
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            calories_kcal,
            sugar_g,
            protein_g,
            caffeine_mg,
            sodium_mg,
            volume_ml
        FROM Product
        JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
        WHERE MenuItem.name = ?
        LIMIT 1
    """, (name,))

    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "calories_kcal": row[0],
        "sugar_g": row[1],
        "protein_g": row[2],
        "caffeine_mg": row[3],
        "sodium_mg": row[4],
        "volume": row[5]
    }

def db_get_all_menu_details():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            MenuItem.name,
            calories_kcal,
            sugar_g,
            protein_g,
            caffeine_mg,
            sodium_mg,
            volume_ml
        FROM Product
        JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
        GROUP BY MenuItem.name
    """)

    rows = cur.fetchall()
    conn.close()

    items = []
    for r in rows:
        items.append({
            "name": r[0],
            "calories_kcal": r[1],
            "sugar_g": r[2],
            "protein_g": r[3],
            "caffeine_mg": r[4],
            "sodium_mg": r[5],
            "volume": r[6]
        })

    return items

def db_get_all_menu_with_price():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            MenuItem.name,          -- r[0]
            Product.price,          -- r[1]
            MenuItem.image_url,     -- r[2]
            Product.temperature_type,  -- r[3]
            Product.size,           -- r[4]
            calories_kcal,          -- r[5]
            sugar_g,                -- r[6]
            protein_g,              -- r[7]
            caffeine_mg,            -- r[8]
            sodium_mg,             -- r[9]
            volume_ml                -- r[10] 
        FROM Product
        JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
        GROUP BY MenuItem.name
    """)

    rows = cur.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "name": r[0],
            "price": r[1],
            "img": r[2],
            "temperature": r[3],
            "size": r[4],

            # ✅ 인덱스 정상 매핑됨
            "calories_kcal": r[5],
            "sugar_g": r[6],
            "protein_g": r[7],
            "caffeine_mg": r[8],
            "sodium_mg": r[9],
            "volume_ml": r[10]
        })

    return results



# -----------------------------
# FastAPI 실행
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
