import { useNavigate, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../styles/MenuOrder.css";
import "../styles/MenuOrder_voice.css";
import "../styles/PayChoice_voice.css";

function PayChoice_voice() {
  const navigate = useNavigate();
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
const [isTalking, setIsTalking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);
  // ✅ 선택 상태
  const [selected, setSelected] = useState(null);
useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 200); // 0.2초 동안 눈 감기
    }, 3000); // 3초마다 깜빡임

    return () => clearInterval(interval);
  }, []);
  // ✅ Footer 공용 옵션
  const renderFooterOptions = () => (
    <div className="footer-options">
      <Link to="/" className="footer-option">
        <img src="/images/home_icon.png" alt="처음으로" />
        <span>처음으로</span>
      </Link>

      {/* 음성주문 버튼 */}
      <div
        className={`footer-option ${!isTouchMode ? "disabled" : ""}`}
        onClick={() => {
          if (isTouchMode) setShowVoiceSwitchModal(true);
        }}
      >
        <img src="/images/order_icon.png" alt="음성주문" />
        <span>음성주문</span>
      </div>

      {/* 터치주문 버튼 */}
      <div
        className={`footer-option ${isTouchMode ? "disabled" : ""}`}
        onClick={() => {
          if (!isTouchMode) setShowSwitchModal(true);
        }}
      >
        <img src="/images/touch_icon.png" alt="터치주문" />
        <span>터치주문</span>
      </div>

      {/* 직원 호출 */}
<div
  className="footer-option"
  onClick={() => setShowStaffCallModal(true)}  // 모달 열기
>
  <img src="/images/bell_icon.png" alt="직원호출" />
  <span>직원호출</span>
</div>
    </div>
  );

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
<div className="order-confirm-card-voice">
  <div className="order-card-header-voice">결제 수단</div>
  <div className="order-list-container-voice">
    <h2 className="confirm-title-voice">결제 수단을 말씀해주세요</h2>

    {/* ✅ 결제 수단 선택 영역 */}
    <div className="paychoice-grid-voice">
      {/* 카드결제 */}
      <div
        className={`paychoice-option-voice ${selected === "card" ? "selected" : ""}`}
        onClick={() => setSelected("card")}
      >
        <img src="/images/card.png" alt="카드결제" />
        <span className="paychoice-text-voice">카드결제</span>
        <span className="paychoice-sub-voice">신용카드/삼성페이</span>
      </div>

      {/* 현금결제 */}
      <div
        className={`paychoice-option-voice ${selected === "cash" ? "selected" : ""}`}
        onClick={() => setSelected("cash")}
      >
        <img src="/images/cash.png" alt="현금결제" />
        <span className="paychoice-text-voice">현금결제</span>
        <span className="paychoice-sub-voice">지류상품권 불가</span>
      </div>

      {/* 카카오페이 */}
      <div
        className={`paychoice-option-voice ${selected === "kakao" ? "selected" : ""}`}
        onClick={() => setSelected("kakao")}
      >
        <img src="/images/kakao.png" alt="카카오페이" />
        <span className="paychoice-text-voice">카카오페이</span>
      </div>

      {/* 페이코 */}
      <div
        className={`paychoice-option-voice ${selected === "payco" ? "selected" : ""}`}
        onClick={() => setSelected("payco")}
      >
        <img src="/images/payco.png" alt="페이코" />
        <span className="paychoice-text-voice">페이코</span>
      </div>

      {/* 제로페이 */}
      <div
        className={`paychoice-option-voice ${selected === "zero" ? "selected" : ""}`}
        onClick={() => setSelected("zero")}
      >
        <img src="/images/zeropay.png" alt="제로페이" />
        <span className="paychoice-text-voice">제로페이</span>
      </div>

      {/* 네이버페이 */}
      <div
        className={`paychoice-option-voice ${selected === "naver" ? "selected" : ""}`}
        onClick={() => setSelected("naver")}
      >
        <img src="/images/naverpay.png" alt="네이버페이" />
        <span className="paychoice-text-voice">네이버페이</span>
      </div>
    </div>
  </div>
</div>


      {/* ✅ 음성 모드 Footer */}
      <footer className="menu-footer">
       <img
  src={isBlinking ? '/images/staff_eyes.png' : '/images/staff.png'}
  alt="staff"
  className={`staff-img ${isBlinking ? 'eyes' : ''}`}
/>
        <div className="welcome-message">
          어서오세요 <br />
          음성주문 모드 사용중입니다 <br />
          결제 방법을 말씀해주세요.
        </div>
        {renderFooterOptions()}
      </footer>


{/* 직원 호출 모달 */}
{showStaffCallModal && !isStaffCalling && (
  <div className="modal-overlay">
    <div className="modal-box switch-modal">
      <h3>직원을 호출하시겠습니까?</h3>
      <p>직원 호출 후 잠시 기다려주세요.</p>
      <div className="modal-buttons switch-buttons">
        <button
          onClick={() => setShowStaffCallModal(false)}
          className="switch-cancel"
        >
          아니오
        </button>
        <button
          onClick={() => {
            setShowStaffCallModal(false);
            setIsStaffCalling(true);
            setTimeout(() => setIsStaffCalling(false), 5000);
          }}
          className="switch-confirm"
        >
          예
        </button>
      </div>
    </div>
  </div>
)}

{/* 호출 중 모달 */}
{isStaffCalling && (
  <div className="modal-overlay">
    <div className="modal-box switch-modal">
      <h3>직원 호출중입니다...</h3>
      <p>직원 호출중이니 기다려주세요.</p>
    </div>
  </div>
)}


    </div>
  );
}

export default PayChoice_voice;
