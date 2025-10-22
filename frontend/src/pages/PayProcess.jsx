// src/pages/PayProcess.jsx
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "../styles/PayProcess.css";

function PayProcess() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true); // 로딩 시작
    setTimeout(() => {
      navigate("/complete"); // 3초 뒤 완료 페이지로 이동
    }, 3000);
  };

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
      const currentStep = 3; // ✅ 현재 4단계: 결제 진행
      const isActive = index === currentStep;
      const isCompleted = index < currentStep;

      return (
        <div className="step-wrapper" key={index}>
          <div
            className={`step-circle ${
              isActive ? "active" : isCompleted ? "completed" : ""
            }`}
          >
            {isCompleted ? "✔" : index + 1} {/* 완료단계 체크 표시 */}
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
        <div className="order-card-header">결제 진행</div>

        <div className="order-list-container">
          <h3 className="payprocess-subtitle">신용카드 결제</h3>
          <h2 className="payprocess-title">신용카드를 투입구에 넣어주세요</h2>
          <p className="payprocess-desc">
            결제가 완료될 때까지 카드를 빼지 마세요 !
          </p>

          {/* 카드 삽입 or 로딩 애니메이션 */}
          <div className="payprocess-image">
            {loading ? (
              <div className="loading-spinner"></div> // ✅ 로딩 표시
            ) : (
              <img
                src="/images/card_insert.png"
                alt="카드 삽입"
              />
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="menu-order-buttons">
            <button className="order-back" onClick={() => navigate("/paychoice")}>
              이전
            </button>
            <button
              className="order-confirm"
              disabled={loading} // 로딩 중엔 비활성화
              onClick={handleNext}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayProcess;
