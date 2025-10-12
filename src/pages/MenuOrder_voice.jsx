import { useNavigate, Link } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import "../styles/MenuOrder.css";
import "../styles/MenuOrder_voice.css";

function MenuOrder_voice() {
  const navigate = useNavigate();
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
const [isTalking, setIsTalking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);


  const scrollRef = useRef(null); // ✅ 자동 스크롤용 참조

  const dummyMenus = [
    { name: "아메리카노", option: "Small / iced\n시럽추가", price: 2000, image: "/images/coffee.png" },
    { name: "카페라떼", option: "Medium / hot", price: 3000, image: "/images/coffee.png" },
    { name: "카푸치노", option: "Large / iced", price: 3500, image: "/images/coffee.png" },
    { name: "콜드브루", option: "Small / iced", price: 4000, image: "/images/coffee.png" },
    { name: "바닐라라떼", option: "Large / hot", price: 4500, image: "/images/coffee.png" },
  ];
 useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 200); // 0.2초 동안 눈 감기
    }, 3000); // 3초마다 깜빡임

    return () => clearInterval(interval);
  }, []);

  // ✅ 자동 스크롤 기능
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    let scrollSpeed = 1; // 픽셀 단위 속도
    const interval = setInterval(() => {
      if (scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight) {
        // 맨 아래 도달 → 다시 맨 위로
        scrollElement.scrollTop = 0;
      } else {
        scrollElement.scrollTop += scrollSpeed;
      }
    }, 50); // 0.05초마다 실행 (속도 조절 가능)

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
  className={`footer-option ${isTouchMode ? 'disabled' : ''}`}
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
      <div className="order-confirm-card-voice">
        <div className="order-card-header-voice">주문 확인</div>
        <div className="order-list-container-voice">
          <h2 className="confirm-title-voice">주문 내역을 확인해주세요</h2>

          {/* ✅ 자동 스크롤 영역 */}
          <div className="order-scroll-voice" ref={scrollRef}>
            {dummyMenus.map((menu, index) => (
              <div className="order-item-card-voice" key={index}>
                <img
                  src={menu.image}
                  alt={menu.name}
                  className="order-item-image-voice"
                />
                <div className="menu-info">
                  <div className="order-item-name-voice">{menu.name}</div>
                  <div className="order-item-option-voice">{menu.option}</div>
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


    </div>
  );
}

export default MenuOrder_voice;
