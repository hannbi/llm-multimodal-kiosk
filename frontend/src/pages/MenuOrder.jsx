import { useNavigate, useLocation } from "react-router-dom";
import React from "react";
import "../styles/MenuOrder.css";

function MenuOrder() {
  const navigate = useNavigate();
  const location = useLocation();

  // MenuCoffee.jsx → navigate("/order", { state: { cartItems, totalPrice } })
  const { cartItems = [], totalPrice = 0 } = location.state || {};

  return (
    <div className="menu-order-wrapper">
      {/* 상단 로고 */}
      <div className="header">
        <div className="logo-text">
          <strong>
            MOMENT
            <br />
            COFFEE
          </strong>
        </div>
      </div>

      {/* 진행 단계 */}
      <div className="stepper">
        {["주문 확인", "이용 방식", "결제 수단", "결제 진행", "주문 완료"].map(
          (label, index) => {
            const currentStep = 0; // 현재 단계
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

      {/* 중앙 카드 */}
      <div className="order-confirm-card">
        {/* 검은색 상단 바 */}
        <div className="order-card-header">주문 확인</div>

        {/* 주문 목록 */}
        <div className="order-list-container">
          <h2 className="confirm-title">주문 내역을 확인해주세요</h2>



          {/* 스크롤 영역 */}
          <div className="order-scroll">
            {cartItems.length === 0 ? (
              <div className="empty-cart-text">장바구니가 비어있습니다.</div>
            ) : (
              cartItems.map((item, index) => (
                <div className="order-item-card" key={index}>
                  {/* 이미지 */}
                  <img
                    src={item.img}
                    alt={item.name}
                    className="order-item-image"
                  />

                  {/* 메뉴 정보 */}
                  <div className="menu-info">
                    <div className="order-item-name">{item.name}</div>

                    <div className="order-item-option">
                      {item.temp} / {item.size}
                      {item.option && ` / ${item.option}`}
                    </div>
                  </div>

                  {/* 수량 */}
                  <div className="menu-qty">
                    <button>-</button>
                    <span>{item.qty}</span>
                    <button>+</button>
                  </div>

                  {/* 가격 */}
                  <div className="menu-price">
                    ₩ {(item.price * item.qty).toLocaleString()}원
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 총 결제 금액 */}
          <div className="order-total-box">
            총 결제금액 :
            <span className="order-total-price">
              ₩ {totalPrice.toLocaleString()}원
            </span>
          </div>

          {/* 버튼 */}
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
