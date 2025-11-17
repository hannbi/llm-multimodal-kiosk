// UsagePage.jsx
import React, { useState } from "react";
import "../styles/MenuOrder.css";
import "../styles/Usage.css"; // 새 CSS 추가
import { useNavigate, useLocation } from "react-router-dom";

function UsagePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const location = useLocation();
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
            const currentStep = 1; // 현재 단계 (0부터 시작 → 1은 '이용 방식')
            const isActive = index === currentStep;
            const isCompleted = index < currentStep; // 이전 단계는 완료 처리

            return (
              <div className="step-wrapper" key={index}>
                <div
                  className={`step-circle ${isActive ? "active" : isCompleted ? "completed" : ""
                    }`}
                >
                  {isCompleted ? "✔" : index + 1} {/* 완료 단계는 체크 표시 */}
                </div>
                <div
                  className={`step-label ${isActive ? "active" : isCompleted ? "completed" : ""
                    }`}
                >
                  {label}
                </div>
                {index !== 4 && (
                  <div
                    className={`step-line ${isCompleted ? "completed" : isActive ? "active" : ""
                      }`}
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      {/* 중앙 카드 */}
      <div className="order-confirm-card">
        <div className="order-card-header">이용 방식</div>

        <div className="order-list-container">
          <h2 className="usage-title">이용 방식을 선택해주세요</h2>

          {/* 이용 방식 선택 영역 */}
          <div className="usage-options">
            {/* 먹고가기 */}
            <div
              className={`usage-option ${selected === "eat" ? "active" : ""}`}
              onClick={() => setSelected("eat")}
            >
              <img src="/images/staff_eat.png" alt="먹고가기" />
              <span>먹고 가기</span>
            </div>

            {/* 포장하기 */}
            <div
              className={`usage-option ${selected === "takeout" ? "active" : ""}`}
              onClick={() => setSelected("takeout")}
            >
              <img src="/images/staff_pojang.png" alt="포장하기" />
              <span>포장 하기</span>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="menu-order-buttons">
            <button className="order-back" onClick={() =>
              navigate("/order", { state: { cartItems, totalPrice } })
            }>
              이전
            </button>
            <button
              className="order-confirm"
              disabled={!selected}
              onClick={() => navigate("/paychoice")}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsagePage;
