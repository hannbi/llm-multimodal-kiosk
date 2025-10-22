// PayChoice.jsx
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import "../styles/PayChoice.css";

function PayChoice() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

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
      const currentStep = 2; // ✅ 현재 3단계: 결제 수단
      const isActive = index === currentStep;
      const isCompleted = index < currentStep;

      return (
        <div className="step-wrapper" key={index}>
          <div
            className={`step-circle ${
              isActive ? "active" : isCompleted ? "completed" : ""
            }`}
          >
            {isCompleted ? "✔" : index + 1} {/* ✅ 완료된 단계는 체크 표시 */}
          </div>
          <div
            className={`step-label ${
              isActive ? "active" : isCompleted ? "completed" : ""
            }`}
          >
            {label}
          </div>

          {index !== 4 && (
            <div
              className={`step-line ${
                isCompleted ? "completed" : isActive ? "active" : ""
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
        {/* 상단 바 */}
        <div className="order-card-header">결제 수단</div>

        {/* 본문 */}
        <div className="order-list-container">
          <h2 className="usage-title">결제수단을 선택해주세요</h2>

          {/* 결제 수단 버튼 영역 */}
<div className="paychoice-grid">
  {/* 카드결제 */}
  <div
    className={`paychoice-option ${selected === "card" ? "selected" : ""}`}
    onClick={() => setSelected("card")}
  >
    <img className="pay-img-card" src="/images/card.png" alt="카드결제" />
    <span className="paychoice-text">카드결제</span>
    <span className="paychoice-sub">신용카드/삼성페이</span>
  </div>

  {/* 현금결제 */}
  <div
    className={`paychoice-option ${selected === "cash" ? "selected" : ""}`}
    onClick={() => setSelected("cash")}
  >
    <img className="pay-img-cash" src="/images/cash.png" alt="현금결제" />
    <span className="paychoice-text">현금결제</span>
    <span className="paychoice-sub">지류상품권 불가</span>
  </div>

  {/* 카카오페이 */}
  <div
    className={`paychoice-option ${selected === "kakao" ? "selected" : ""}`}
    onClick={() => setSelected("kakao")}
  >
    <img className="pay-img-kakao" src="/images/kakao.png" alt="카카오페이" />
    <span className="paychoice-text">카카오페이</span>
  </div>

  {/* 페이코 */}
  <div
    className={`paychoice-option ${selected === "payco" ? "selected" : ""}`}
    onClick={() => setSelected("payco")}
  >
    <img className="pay-img-payco" src="/images/payco.png" alt="페이코" />
    <span className="paychoice-text">페이코</span>
  </div>

  {/* 제로페이 */}
  <div
    className={`paychoice-option ${selected === "zero" ? "selected" : ""}`}
    onClick={() => setSelected("zero")}
  >
    <img className="pay-img-zero" src="/images/zeropay.png" alt="제로페이" />
    <span className="paychoice-text">제로페이</span>
  </div>

  {/* 네이버페이 */}
  <div
    className={`paychoice-option ${selected === "naver" ? "selected" : ""}`}
    onClick={() => setSelected("naver")}
  >
    <img className="pay-img-naver" src="/images/naverpay.png" alt="네이버페이" />
    <span className="paychoice-text">네이버페이</span>
  </div>
</div>


          {/* 버튼 영역 */}
          <div className="menu-order-buttons">
            <button className="order-back" onClick={() => navigate("/usage")}>
              이전
            </button>
            <button
              className="order-confirm"
              disabled={!selected}
              onClick={() => navigate("/payprocess")}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayChoice;
