import { useNavigate, useLocation } from "react-router-dom";
import React, { useState } from "react";
import "../styles/MenuOrder.css";

function MenuOrder() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cartItems: initialItems = [], totalPrice: initialPrice = 0 } = location.state || {};

  // ✔ cartItems를 state로 관리해야 + / - 버튼이 동작함
  const [cartItems, setCartItems] = useState(initialItems);

  // ✔ 총 금액 자동 계산
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // ✔ 수량 변경 함수
  const updateQty = (index, diff) => {
    setCartItems(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qty: Math.max(1, item.qty + diff) }
          : item
      )
    );
  };

  return (
    <div className="menu-order-wrapper">
      <div className="header">
        <div className="logo-text">
          <strong>
            MOMENT
            <br />
            COFFEE
          </strong>
        </div>
      </div>

      <div className="stepper">
        {["주문 확인", "이용 방식", "결제 수단", "결제 진행", "주문 완료"].map(
          (label, index) => {
            const currentStep = 0;
            const isActive = index === currentStep;

            return (
              <div className="step-wrapper" key={index}>
                <div className={`step-circle ${isActive ? "active" : ""}`}>
                  {index + 1}
                </div>
                <div className={`step-label ${isActive ? "active" : ""}`}>
                  {label}
                </div>
                {index !== 4 && <div className="step-line" />}
              </div>
            );
          }
        )}
      </div>

      <div className="order-confirm-card">
        <div className="order-card-header">주문 확인</div>

        <div className="order-list-container">
          <h2 className="confirm-title">주문 내역을 확인해주세요</h2>

          <div className="order-scroll">
            {cartItems.length === 0 ? (
              <div className="empty-cart-text">장바구니가 비어있습니다.</div>
            ) : (
              cartItems.map((item, index) => (
                <div className="order-item-card" key={index}>
                  <img src={item.img} alt={item.name} className="order-item-image" />

                  <div className="menu-info">
                    <div className="order-item-name">{item.name}</div>

                    <div className="order-item-option">
                      {[item.temp, item.size, item.option]
                        .filter(Boolean)
                        .join(" / ")}
                    </div>
                  </div>

                  <div className="menu-qty">
                    <button onClick={() => updateQty(index, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(index, 1)}>+</button>
                  </div>

                  <div className="menu-price">
                    ₩ {(item.price * item.qty).toLocaleString()}원
                  </div>
                </div>
              ))
            )}
          </div>

<div className="order-total-box">
            총 결제금액
            <span className="order-total-price" style={{ marginLeft: "50px" }}>
              ₩ {totalPrice.toLocaleString()}원
            </span>
          </div>

          <div className="menu-order-buttons">
            <button
              className="order-back"
              onClick={() =>
                navigate("/menu_coffee", {
                  replace: false,
                  state: { cartItems, totalPrice, forceTouch: true }
                })
              }
            >
              이전
            </button>

            <button
              className="order-confirm"
              onClick={() =>
                navigate("/usage", {
                  state: { cartItems, totalPrice, forceTouch: true }
                })
              }
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuOrder;
