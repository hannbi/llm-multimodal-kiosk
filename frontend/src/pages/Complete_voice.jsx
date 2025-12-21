// src/pages/Complete_voice.jsx
import { useNavigate, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../styles/MenuOrder.css";
import "../styles/MenuOrder_voice.css";

function Complete_voice() {
  const navigate = useNavigate();
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);

  // 🔥 페이지 열리자마자 TTS 자동 재생
  useEffect(() => {
    const playCompleteVoice = async () => {
      const res = await fetch("http://localhost:5000/complete_voice_tts", {
        method: "POST",
      });
      const data = await res.json();

      if (data.audio_url) {
        const audio = new Audio("http://localhost:5000/" + data.audio_url);
        audio.play();
      }
    };
    playCompleteVoice();
  }, []);

  // 눈 깜빡임
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 10초 뒤 자동 홈 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 10000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const renderFooterOptions = () => (
    <div className="footer-options">
      <Link to="/" className="footer-option">
        <img src="/images/home_icon.png" alt="처음으로" />
        <span>처음으로</span>
      </Link>

      <div
        className={`footer-option ${!isTouchMode ? "disabled" : ""}`}
        onClick={() => {
          if (isTouchMode) setShowVoiceSwitchModal(true);
        }}
      >
        <img src="/images/order_icon.png" alt="음성주문" />
        <span>음성주문</span>
      </div>

      <div
        className={`footer-option ${isTouchMode ? "disabled" : ""}`}
        onClick={() => {
          if (!isTouchMode) setShowSwitchModal(true);
        }}
      >
        <img src="/images/touch_icon.png" alt="터치주문" />
        <span>터치주문</span>
      </div>

      <div
        className="footer-option"
        onClick={() => setShowStaffCallModal(true)}
      >
        <img src="/images/bell_icon.png" alt="직원호출" />
        <span>직원호출</span>
      </div>
    </div>
  );

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
          (label, index) => (
            <div className="step-wrapper" key={index}>
              <div className="step-circle completed">✔</div>
              <div className="step-label completed">{label}</div>
              {index !== 4 && <div className="step-line completed" />}
            </div>
          )
        )}
      </div>

      <div className="order-confirm-card-voice">
        <div className="order-card-header-voice">주문 완료</div>
        <div className="order-list-container-voice">
          <h2 className="complete-title">결제가 완료되었습니다</h2>
          <h3 className="complete-subtitle">대기번호</h3>
          {/* <p className="complete-time">예상 소요시간: 5분</p> */}

          <div className="complete-number">27</div>

          <div className="paycomplete-image paycomplete-image-voice">
            <img src="/images/receipt.png" alt="영수증" />
          </div>
        </div>
      </div>

      <footer className="menu-footer">
        <img
          src={isBlinking ? "/images/staff_eyes.png" : "/images/staff.png"}
          alt="staff"
          className={`staff-img ${isBlinking ? "eyes" : ""}`}
        />
        <div className="welcome-message">
          결제가 정상적으로 완료되었습니다. <br />
          잠시 후 주문이 준비됩니다.
        </div>
        {renderFooterOptions()}
      </footer>

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

export default Complete_voice;
