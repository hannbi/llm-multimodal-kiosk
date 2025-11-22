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
    speak(answer, output_path)
    next_action = "go_payment" if intent == "Payment" else None
    return {
         "user_text": text,
        "ai_text": answer,
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
    # 1) BuildOrder
    # --------------------
    if intent == "BuildOrder":
        name = slots.get("menu_name")
        qty = slots.get("quantity", 1)

        menu = db_get_menu(name)
        if not menu:
            return f"{name}는 없는 메뉴예요."

        # 옵션 선택이 필요한 경우 → 질문으로 유도
        state["last_menu"] = name
        state["pending"] = {"name": name, "qty": qty}

        if menu["need_temp"]:
            return f"{name}는 HOT / ICE 중 어떤 걸로 드릴까요?"

        if menu["need_size"]:
            return f"{name}는 Small / Large 중 어떤 걸로 드릴까요?"

        # 옵션 필요 없음 → 바로 장바구니
        cart.append({
            "name": name,
            "qty": qty,
            "price": menu["price"]
        })

        state["pending"] = {}
        state["last_menu"] = None

        return f"{name} {qty}잔 장바구니에 담았어요!"

    # --------------------
    # 2) OptionSelect (🔥 새로 추가)
    # --------------------
    if intent == "OptionSelect":
        temp = slots.get("temperature")
        size = slots.get("size")

        if not state.get("last_menu"):
            return "어떤 음료에 옵션을 적용할까요?"

        menu_name = state["last_menu"]
        pending = state["pending"]
        menu = db_get_menu(menu_name)

        # 옵션 저장
        if temp:
            pending["temperature"] = temp
        if size:
            pending["size"] = size

        # 필요한 옵션 확인
        need_temp = menu["need_temp"]
        need_size = menu["need_size"]

        if need_temp and "temperature" not in pending:
            return f"{menu_name}는 HOT / ICE 중 어떤 걸로 드릴까요?"

        if need_size and "size" not in pending:
            return f"{menu_name}는 Small / Large 중 어떤 걸로 드릴까요?"

        # 모든 옵션 선택 완료 → 장바구니 추가
        cart.append({
            "name": menu_name,
            "qty": pending.get("qty", 1),
            "price": menu["price"],
            "temperature": pending.get("temperature"),
            "size": pending.get("size"),
        })

        # 초기화
        state["pending"] = {}
        state["last_menu"] = None

        return f"{menu_name}({pending.get('temperature')}, {pending.get('size')}) 담았어요!"

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


# -----------------------------
# FastAPI 실행
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
