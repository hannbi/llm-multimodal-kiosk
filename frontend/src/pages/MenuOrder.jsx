import { useNavigate } from "react-router-dom";
import React from "react";
import "../styles/MenuOrder.css";

function MenuOrder() {
  const navigate = useNavigate();
  const dummyMenus = [
    {
      name: "아메리카노",
      option: "Small / iced\n시럽추가",
      price: 2000,
      image: "/images/coffee.png",
    },
    {
      name: "아메리카노",
      option: "Small / iced\n시럽추가",
      price: 2000,
      image: "/images/coffee.png",
    },
    {
      name: "아메리카노",
      option: "Small / iced\n시럽추가",
      price: 2000,
      image: "/images/coffee.png",
    },
        {
      name: "아메리카노",
      option: "Small / iced\n시럽추가",
      price: 2000,
      image: "/images/coffee.png",
    },
            {
      name: "아메리카노",
      option: "Small / iced\n시럽추가",
      price: 2000,
      image: "/images/coffee.png",
    },
            {
      name: "아메리카노",
      option: "Small / iced\n시럽추가",
      price: 2000,
      image: "/images/coffee.png",
    },
    
  ];

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
      const currentStep = 0; // 현재 단계 (0부터 시작)
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
          {/* 안내 문구 */}
          <h2 className="confirm-title">주문 내역을 확인해주세요</h2>

          <div className="order-scroll">
            {dummyMenus.map((menu, index) => (
              <div className="order-item-card" key={index}>
                <img
                  src={menu.image}
                  alt={menu.name}
                  className="order-item-image"
                />
                <div className="menu-info">
                  <div className="order-item-name">{menu.name}</div>
                  <div className="order-item-option">{menu.option}</div>
                </div>
                <div className="menu-qty">
                  <button>-</button>
                  <span>1</span>
                  <button>+</button>
                </div>
                <div className="menu-price">
                  <span>₩ {menu.price.toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </div>

          {/* 버튼들: 취소 / 완료 */}
          <div className="menu-order-buttons">
            <button className="order-back" onClick={() => navigate("/menu_coffee")}>
              이전
            </button>
             <button className="order-confirm" onClick={() => navigate("/usage")}>
        다음
      </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuOrder;
//https://www.behance.net/moodboard/199637741/progress-bar-ui