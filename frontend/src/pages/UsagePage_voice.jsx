import { useNavigate, Link } from "react-router-dom";
import React, { useState , useEffect } from "react";
import "../styles/MenuOrder.css";
import "../styles/MenuOrder_voice.css";

function PayChoice_voice() {
  const navigate = useNavigate();
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
const [isTalking, setIsTalking] = useState(false);
const [showStaffCallModal, setShowStaffCallModal] = useState(false);
const [isStaffCalling, setIsStaffCalling] = useState(false);

  const [isBlinking, setIsBlinking] = useState(false);
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
      const currentStep = 1; // 현재 단계 (0부터 시작 → 1은 '이용 방식')
      const isActive = index === currentStep;
      const isCompleted = index < currentStep; // 이전 단계는 완료 처리

      return (
        <div className="step-wrapper" key={index}>
          <div
            className={`step-circle ${
              isActive ? "active" : isCompleted ? "completed" : ""
            }`}
          >
            {isCompleted ? "✔" : index + 1} {/* ✅ 완료 단계는 체크 표시 */}
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
        <div className="order-card-header-voice">이용 방식</div>
        <div className="order-list-container-voice">
          <h2 className="confirm-title-voice">이용 방식을 말씀해주세요</h2>

          {/* ✅ 이용 방식 선택 영역 (voice 네이밍) */}
          <div className="usage-options-voice">
            {/* 먹고가기 */}
            <div
              className={`usage-option-voice ${selected === "eat" ? "active" : ""}`}
              onClick={() => setSelected("eat")}
            >
              <img src="/images/staff_eat.png" alt="먹고가기" />
              <span>먹고 가기</span>
            </div>

            {/* 포장하기 */}
            <div
              className={`usage-option-voice ${selected === "takeout" ? "active" : ""}`}
              onClick={() => setSelected("takeout")}
            >
              <img src="/images/staff_pojang.png" alt="포장하기" />
              <span>포장 하기</span>
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
          원하시는 음료를 말씀해주세요.
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


      {showSwitchModal && (
        <div className="modal-overlay">
          <div className="modal-box switch-modal">
  <h3>터치 모드로 전환하시겠습니까?</h3>
            <p>현재 음성주문 모드입니다.<br />터치로 주문하시려면 전환이 필요합니다.</p>
            <div className="modal-buttons switch-buttons">
              <button onClick={() => setShowSwitchModal(false)} className="cancel-btn switch-cancel">아니오</button>
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  setIsTouchMode(true);
                
                }}
                className="add-btn switch-confirm"
              >예</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default PayChoice_voice;
