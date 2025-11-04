# from speech_to_text import record_audio, save_temp_wav, transcribe   # 🔥 녹음 관련 제거
from gpt_response import get_gpt_response
from text_to_speech import speak
import sqlite3

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router 

from fastapi.staticfiles import StaticFiles
from fastapi import UploadFile, File
import shutil, uuid

app = FastAPI(title="llm-multimodal-API", version="1.0")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 대화 상태 저장 (맥락 유지용)
state = {
    "last_menu": None,
    "order_list": []
}

# CORS 추가 (React랑 통신되게)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 또는 ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_kiosk():
    print("🎤 V3X 키오스크 텍스트 테스트 모드 시작 ('종료' 입력시 종료)")

    intro_message = "어서오세요. V three X 카페입니다. 주문 도와드리겠습니다."
    print(f"🤖 안내: {intro_message}")
    # speak(intro_message)   # 음성 출력 필요하면 살리세요

    while True:
        # 1. 사용자 입력
        text = input("👉 주문 문장을 입력하세요: ")

        if "종료" in text or "그만" in text:
            print("👋 키오스크를 종료합니다.")
            break

        # 2. GPT 의도 추출
        gpt_reply = get_gpt_response(text)
        print(f"🤖 GPT 응답: {gpt_reply}")

        intent = gpt_reply.get("intent")
        slots = gpt_reply.get("slots", {})

        conn = sqlite3.connect("kiosk.db")
        cur = conn.cursor()

        # 3. 의도 분기 처리
        if intent == "BuildOrder":
            menu_name = slots.get("menu_name")
            quantity = slots.get("quantity", 1)

            cur.execute("""
                SELECT Product.price 
                FROM Product
                JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
                WHERE MenuItem.name = ?
            """, (menu_name,))
            row = cur.fetchone()
            price = row[0] if row else "알 수 없음"

            # 상태 업데이트
            state["last_menu"] = menu_name
            state["order_list"].append((menu_name, quantity, price))

            final_response = f"{menu_name} {quantity}잔을 장바구니에 담았습니다. 가격은 {price}원입니다."

        elif intent == "MenuQuery":
            menu_name = slots.get("menu_name")

            cur.execute("""
                SELECT Product.price, Product.sugar_g, Product.caffeine_mg, Product.calories_kcal
                FROM Product
                JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
                WHERE MenuItem.name = ?
            """, (menu_name,))
            row = cur.fetchone()

            if row:
                price, sugar, caffeine, calories = row
                final_response = f"{menu_name} 가격은 {price}원, 당 {sugar}g, 카페인 {caffeine}mg, 칼로리 {calories}kcal 입니다."
                state["last_menu"] = menu_name
            else:
                final_response = f"{menu_name} 정보를 찾을 수 없습니다."

        elif intent == "NutritionFilter":
            sugar_max = slots.get("sugar_max")
            caffeine_max = slots.get("caffeine_max")
            calories_max = slots.get("calories_max")

            where = []
            params = []

            if sugar_max is not None:
                where.append("sugar_g <= ?")
                params.append(sugar_max)
            if caffeine_max is not None:
                where.append("caffeine_mg <= ?")
                params.append(caffeine_max)
            if calories_max is not None:
                where.append("calories_kcal <= ?")
                params.append(calories_max)

            sql = f"""
                SELECT MenuItem.name, Product.size, Product.temperature_type, Product.sugar_g, Product.caffeine_mg
                FROM Product
                JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
                WHERE {" AND ".join(where) if where else "1=1"}
            """   
            print("🛠 SQL:", sql, params)

            cur.execute(sql, tuple(params))
            rows = cur.fetchall()

            if rows:
                result_text = ", ".join([f"{r[0]}({r[1]}/{r[2]})" for r in rows])
                final_response = f"조건에 맞는 음료는 {result_text} 입니다."
            else:
                final_response = "조건에 맞는 음료가 없습니다."

        elif intent == "ShowOrder":
            if state["order_list"]:
                result_text = ", ".join([f"{m} {q}잔({p}원)" for m, q, p in state["order_list"]])
                final_response = f"현재 장바구니에는 {result_text}가 있습니다."
            else:
                final_response = "장바구니가 비어 있습니다."

        elif intent == "ResetOrder":
            state["order_list"] = []
            state["last_menu"] = None
            final_response = "장바구니를 초기화했습니다."

        elif intent == "Payment":
            if state["order_list"]:
                total = sum(q * (p if isinstance(p, int) else 0) for m, q, p in state["order_list"])
                final_response = f"총 결제 금액은 {total}원입니다. 결제를 진행합니다."
                # TODO: 결제 로직 추가
                state["order_list"] = []  # 결제 완료 후 장바구니 초기화
            else:
                final_response = "결제할 주문이 없습니다."

        else:
            final_response = "죄송합니다. 잘 이해하지 못했어요."

        conn.close()

        # 4. 최종 출력
        print(f"🤖 최종 멘트: {final_response}")
        # speak(final_response)
        
        
        
@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = f"uploads/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"http://localhost:5000/uploads/{filename}"

    conn = sqlite3.connect("kiosk.db")
    cur = conn.cursor()
    cur.execute("INSERT INTO SpotImage (image_url) VALUES (?)", (image_url,))
    conn.commit()
    conn.close()

    return {"image_url": image_url}

app.include_router(router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
