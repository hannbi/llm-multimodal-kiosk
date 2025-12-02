from fastapi import APIRouter, HTTPException
import sqlite3
import os
router = APIRouter()

def get_db():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, "kiosk.db")
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row   # ✔ 중요!!
    return conn


# 전체 메뉴 리스트
@router.get("/menu")
def get_menu():
    conn = get_db()
    rows = conn.execute("""
        SELECT m.menu_id, m.name, m.category,
               m.image_url,
               p.product_id, p.size, p.temperature_type, p.price,
               p.calories_kcal, p.sugar_g, p.protein_g, p.caffeine_mg, p.sodium_mg
        FROM MenuItem m
        JOIN Product p ON m.menu_id = p.menu_id
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# 옵션별 상세 정보 (가격, 칼로리 등)
@router.get("/menu/{menu_name}/detail")
def get_product_detail(menu_name: str, size: str, temperature: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            Product.price,
            Product.volume_ml,
            Product.calories_kcal,
            Product.sugar_g,
            Product.protein_g,
            Product.caffeine_mg,
            Product.sodium_mg
        FROM Product
        JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
        WHERE LOWER(MenuItem.name) = LOWER(?) 
          AND LOWER(Product.size) = LOWER(?) 
          AND LOWER(Product.temperature_type) = LOWER(?)
    """, (menu_name, size, temperature))
    
    row = cur.fetchone()
    conn.close()

    if row:
        return dict(row)
    else:
        raise HTTPException(
            status_code=404, 
            detail=f"해당 옵션의 상품 정보를 찾을 수 없습니다. ({menu_name}, {size}, {temperature})"
        )

# 메뉴별 선택 가능한 옵션 반환
@router.get("/menu/{menu_name}/options")
def get_available_options(menu_name: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT size, temperature_type
        FROM Product
        JOIN MenuItem ON Product.menu_id = MenuItem.menu_id
        WHERE LOWER(MenuItem.name) = LOWER(?)
    """, (menu_name,))
    rows = cur.fetchall()
    conn.close()

    if not rows:
        raise HTTPException(status_code=404, detail="해당 메뉴의 옵션 정보를 찾을 수 없습니다.")

    # 첫 글자 대문자화 (프론트 일치)
    sizes = sorted({r["size"].capitalize() for r in rows if r["size"]})
    temps = sorted({r["temperature_type"].capitalize() for r in rows if r["temperature_type"]})

    return {"sizes": sizes, "temperatures": temps}

# ⭐ 스마트 추천 API
@router.get("/smart_filter")
def smart_filter(
    calories_min: int = 0, calories_max: int = 9999,
    caffeine_min: int = 0, caffeine_max: int = 9999,
    sugar_min: int = 0, sugar_max: int = 9999,
    sodium_min: int = 0, sodium_max: int = 9999,
    protein_min: int = 0, protein_max: int = 9999
):
    conn = get_db()
    cur = conn.cursor()

    # ✔ MenuItem × Product JOIN하여 옵션별 nutrition 가져오기
    rows = cur.execute("""
        SELECT 
            m.menu_id, m.name, m.category, m.image_url,
            p.product_id, p.size, p.temperature_type, p.price,
            p.calories_kcal, p.sugar_g, p.protein_g, 
            p.caffeine_mg, p.sodium_mg
        FROM MenuItem m
        JOIN Product p ON m.menu_id = p.menu_id
    """).fetchall()

    conn.close()

    results = []

    for r in rows:
        # ✔ nutrition 필터 조건 검사
        r_caf = r["caffeine_mg"] if r["caffeine_mg"] is not None else 0
          
        if not (calories_min <= r["calories_kcal"] <= calories_max): continue
        if not (caffeine_min <=  r_caf <= caffeine_max): continue
        if not (sugar_min <= r["sugar_g"] <= sugar_max): continue
        if not (sodium_min <= r["sodium_mg"] <= sodium_max): continue
        if not (protein_min <= r["protein_g"] <= protein_max): continue

        # ✔ 프론트로 옵션 포함된 메뉴 반환
        results.append({
            "name": r["name"],
            "category": r["category"],
            "img": r["image_url"],
            "price": r["price"],
            "size": r["size"].capitalize() if r["size"] else None,
"temperature": r["temperature_type"].capitalize() if r["temperature_type"] else None,
            "calories_kcal": r["calories_kcal"],
            "sugar_g": r["sugar_g"],
            "protein_g": r["protein_g"],
            "caffeine_mg": r["caffeine_mg"],
            "sodium_mg": r["sodium_mg"]
        })

    return {"recommend": results}
