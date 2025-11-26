from dotenv import load_dotenv
load_dotenv()

import time
from speech_to_text import transcribe_from_mic

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
    if not t:
        return None
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
    s = s.lower()

    if "small" in s or "스몰" in s or "작" in s:
        return "Small"

    if "large" in s or "라지" in s or "큰" in s:
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
        "recommend": answer["recommend"] if isinstance(answer, dict) else None,
        "audio_url": output_path,
        "next_action": next_action
    }


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
        category = slots.get("category")

        if not category:
            return "어떤 화면을 보여드릴까요? 커피, 티/에이드, 빙수 같은 카테고리를 말씀해주세요."

        # 프론트 카테고리 이름과 매핑
        mapping = {
            "커피": "커피",
            "coffee": "커피",
            "티": "티/에이드",
            "에이드": "티/에이드",
            "티/에이드": "티/에이드",
            "티 에이드": "티/에이드",
            "주스": "주스/라떼",
            "라떼": "주스/라떼",
            "주스라떼": "주스/라떼",
            "쉐이크": "쉐이크/스무디",
            "스무디": "쉐이크/스무디",
            "빙수": "빙수/아이스크림",
            "아이스크림": "빙수/아이스크림",
            "빙수/아이스크림": "빙수/아이스크림",
            "빵": "빵/케이크",
            "케이크": "빵/케이크",
            "스낵": "스낵",
        }

        normalized = mapping.get(category.lower())

        if not normalized:
            return f"{category} 카테고리를 찾지 못했어요."

        # React로 전달할 상태 저장
        state["target_category"] = normalized

        return f"{normalized} 화면으로 이동할게요."

    
    
    # --------------------
    # 1) BuildOrder
    # --------------------
    if intent == "BuildOrder":
        name = slots.get("menu_name")
        qty = slots.get("quantity", 1)
        temp = normalize_temperature(slots.get("temperature"))
        size = normalize_size(slots.get("size"))


        menu = db_get_menu(name)
        if not menu:
            return f"{name}는 없는 메뉴예요."

    # 실제 존재하는 옵션 목록
        valid_temps = [normalize_temperature(t) for t in menu["temperatures"]]
        valid_sizes = [normalize_size(s) for s in menu["sizes"]]
        
        if temp and temp not in valid_temps:
            temp = None

        if size and size not in valid_sizes:
            size = None
    # 🔥 pending 저장
        pending = {"name": name, "qty": qty}
        if temp:
            pending["temperature"] = temp
        if size:
            pending["size"] = size

        state["last_menu"] = name
        state["pending"] = pending

    # 🔥 3) 존재 가능한 옵션 기반 응답 로직
    #   temp + size 둘 다 완성됨
        if temp and size:
            return "선택이 완료되었어요. 담을까요?"

    #   온도 필요하고 temp 없음
        if len(valid_temps) > 1 and not temp:
            return "원하시는 온도를 말씀해주세요."

    #   사이즈 필요하고 size 없음
        if len(valid_sizes) > 1 and not size:
            return "사이즈를 말씀해주세요."

    #   온도는 하나뿐이고 자동 결정 (예: Hot만 존재)
        if len(valid_temps) == 1 and not temp:
            pending["temperature"] = valid_temps[0]
            
            if len(valid_sizes) <= 1:
                if len(valid_sizes) == 1:
                    pending["size"] = valid_sizes[0]
                return "선택지가 하나뿐이라 자동으로 선택됐어요. 담을까요?"
            return "온도는 자동으로 선택됐어요. 사이즈를 말씀해주세요."


    #   사이즈도 하나만 존재할 때
        if len(valid_sizes) == 1 and not size:
            pending["size"] = valid_sizes[0]
            if "temperature" in pending:
                return "선택지가 하나뿐이라 자동으로 선택됐어요. 담을까요?"
            return "사이즈는 자동으로 선택됐어요. 온도를 말씀해주세요."

    # --------------------
    # 2) OptionSelect
    # --------------------
    if intent == "OptionSelect":
        temp = normalize_temperature(slots.get("temperature"))
        size = normalize_size(slots.get("size"))


        if not state.get("last_menu"):
            return "어떤 음료에 옵션을 적용할까요?"

        pending = state["pending"]
        name = pending["name"]

    # 🔥 실제 메뉴 옵션 불러오기
        menu = db_get_menu(name)
        valid_temps = [normalize_temperature(t) for t in menu["temperatures"]]  # 예: ['Hot']
        valid_sizes = [normalize_size(s) for s in menu["sizes"]]           # 예: ['Small','Large'] 또는 ['Hot']

# 🔥 온도 검증
        if temp:
            if temp not in valid_temps:
                return f"{name}는 {temp}로 제공되지 않아요. 가능한 온도는 {', '.join(valid_temps)} 입니다."
            pending["temperature"] = temp

# 🔥 사이즈 검증
        if size:
            if size not in valid_sizes:
                return f"{name}는 {size} 사이즈가 없어요. 가능한 사이즈는 {', '.join(valid_sizes)} 입니다."
            pending["size"] = size

        has_temp = "temperature" in pending
        has_size = "size" in pending

        if has_temp and has_size:
            return "선택이 완료되었어요. 담을까요?"

        if has_temp and not has_size:
            return f"{pending['temperature']} 선택되었어요. 사이즈도 말씀해주세요."

        if has_size and not has_temp:
            return f"{pending['size']} 선택되었어요. 온도도 말씀해주세요."

        return "원하시는 옵션을 말씀해주세요."

    # --------------------
# NutritionQuery
# --------------------
    if intent == "NutritionQuery":
        name = slots.get("menu_name")
        nutrient = slots.get("nutrient")

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
                f"칼로리는 {detail['calories_kcal']} kcal, "
                f"당류는 {detail['sugar_g']} g, "
                f"단백질은 {detail['protein_g']} g, "
                f"카페인은 {detail['caffeine_mg']} mg, "
                f"나트륨은 {detail['sodium_mg']} mg 입니다."
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
        }.get(nutrient, "해당 값은")

        return f"{name}의 {readable} {value} 입니다."
    
    
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
# SmartRecommend (완성본 TOP5 + 가격 + 랜덤 지원)
# --------------------
    if intent == "SmartRecommend":
        nutrient = slots.get("nutrient")
        compare = slots.get("compare")

        if not nutrient:
            nutrient = "random"
            compare = "any"

    # 1) 랜덤 추천
        if nutrient == "random":
            import random
            items = db_get_all_menu_with_price()
            random.shuffle(items)
            results = items[:5]

            return {
                "message": "아무거나 5개 랜덤으로 추천해드릴게요!",
                "recommend": results
            }

    # 2) 가격 추천
        if nutrient == "price":
            items = db_get_all_menu_with_price()
            reverse_sort = (compare == "max")
            sorted_items = sorted(items, key=lambda x: x["price"], reverse=reverse_sort)
            results = sorted_items[:5]

            msg = "가격이 가장 높은 메뉴 TOP5입니다." if compare == "max" \
                else "가격이 가장 낮은 메뉴 TOP5입니다."

            return {
                "message": msg,
                "recommend": results
            }

    # 3) 영양소 기반 추천 (칼로리/당류/단백질/카페인/나트륨)
        items = db_get_all_menu_with_price()
        valid_items = [item for item in items if item.get(nutrient) is not None]

        reverse_sort = (compare == "max")
        sorted_items = sorted(valid_items, key=lambda x: x[nutrient], reverse=reverse_sort)

        results = sorted_items[:5]

        readable = {
            "calories_kcal": "칼로리",
            "sugar_g": "당류",
            "protein_g": "단백질",
            "caffeine_mg": "카페인",
            "sodium_mg": "나트륨",
        }.get(nutrient, "영양소")

        msg = f"{readable}가 {'높은' if compare=='max' else '낮은'} 메뉴 TOP5입니다."

        return {
            "message": msg,
            "recommend": results
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
            "size": size
        })

        state["pending"] = {}

        return f"{name} {qty}잔 담았어요."

    # --------------------
    # 장바구니 보기
    # --------------------
    if intent == "ShowOrder":
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

    temperatures = set(r[2] for r in rows)
    sizes = set(r[3] for r in rows)

    return {
        "name": name,
        "price": rows[0][1],
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
            sodium_mg
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
            sodium_mg
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
            "sodium_mg": r[5]
        })

    return items

def db_get_all_menu_with_price():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "kiosk.db")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            MenuItem.name,
            Product.price,
            MenuItem.image_url,
            calories_kcal,
            sugar_g,
            protein_g,
            caffeine_mg,
            sodium_mg
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
            "calories_kcal": r[3],
            "sugar_g": r[4],
            "protein_g": r[5],
            "caffeine_mg": r[6],
            "sodium_mg": r[7],
        })

    return results


# -----------------------------
# FastAPI 실행
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
