import { useNavigate, Link, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import "../styles/MenuOrder.css";
import "../styles/MenuOrder_voice.css";

function MenuOrder_voice() {
  const navigate = useNavigate();
  const location = useLocation();

  // MenuCoffee → navigate("/order_voice", { state: { cartItems, totalPrice } })
  const { cartItems: initialCart = [], totalPrice: initialTotal = 0 } = location.state || {};
  const [cartItems, setCartItems] = useState(initialCart);
  const [totalPrice, setTotalPrice] = useState(initialTotal);


  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);
  const [aiText, setAiText] = useState("음성으로 주문을 수정하거나 진행할 수 있어요.");


  const scrollRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm; codecs=opus" });

    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm; codecs=opus" });
      sendVoice(blob); // 🔥 아래에 함수 또 만들거야
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 5000);
  };

  // ⭐ 여기도 추가
  const sendVoice = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("cart", JSON.stringify(cartItems));

    const res = await fetch("http://localhost:5000/voice_order_page", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

// 🔥 AI 텍스트 먼저 업데이트
setAiText(data.ai_text || "명령을 이해하지 못했어요.");

// 🔥 음성 재생 먼저 처리
if (data.audio_url) {
  const audio = new Audio("http://localhost:5000/" + data.audio_url);
  audio.play();

  // 🔥 navigate는 오디오 재생 끝난 후 실행되도록 처리
  audio.onended = () => {
    
    // 삭제 처리
    if (data.intent === "RemoveItem" && data.slots?.menu_name) {
      const name = data.slots.menu_name;
      const updated = cartItems.filter((item) => item.name !== name);
      setCartItems(updated);
      setTotalPrice(updated.reduce((s, i) => s + i.price * i.qty, 0));
    }

    // 추가 → 메뉴커피로 이동
// 🔥 추가(수량 증가)
if (data.intent === "AddItem" && data.slots?.menu_name) {
  const name = data.slots.menu_name;

  // 기존에 있는지 찾고
  const updated = cartItems.map(item => {
    if (item.name === name) {
      return { ...item, qty: item.qty + 1 };
    }
    return item;
  });

  // 없으면 새로 추가
  const found = cartItems.find(item => item.name === name);
  const finalCart = found
    ? updated
    : [...cartItems, { name, qty: 1, price: data.price || 0 }];

  setCartItems(finalCart);
  setTotalPrice(finalCart.reduce((s, i) => s + i.price * i.qty, 0));

  return; // 이동 X
}


    // 다음 → usage_voice 이동
    if (data.intent === "Next") {
      navigate("/paychoice_voice", { state: { cartItems, totalPrice } });
    }
  };
}

  };


  // 눈 깜빡임
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 자동 스크롤
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const interval = setInterval(() => {
      if (scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight) {
        scrollElement.scrollTop = 0;
      } else {
        scrollElement.scrollTop += 1; // 스크롤 속도
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Footer 공통 버튼
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
        onClick={() => setShowStaffCallModal(true)}
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
            const isActive = index === 0;
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

          {/* 자동 스크롤 영역 */}
          <div className="order-scroll-voice" ref={scrollRef}>
            {cartItems.length === 0 ? (
              <div className="empty-cart-text-voice">
                장바구니가 비어 있습니다.
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div className="order-item-card-voice" key={index}>
                  <img
                    src={item.img}
                    alt={item.name}
                    className="order-item-image-voice"
                  />
                  <div className="menu-info">
                    <div className="order-item-name-voice">{item.name}</div>
                    <div className="order-item-option-voice">
                      {item.temp} / {item.size}
                      {item.option && ` / ${item.option}`}
                    </div>
                  </div>
                  <div className="menu-qty">
                    <span>{item.qty}</span>
                  </div>
                  <div className="menu-price">
                    <span>
                      ₩ {(item.price * item.qty).toLocaleString()}원
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="order-total-box-voice">
            총 결제금액 :
            <span className="order-total-price-voice">
              ₩ {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="menu-footer">
        <img
          src={isBlinking ? "/images/staff_eyes.png" : "/images/staff.png"}
          alt="staff"
          className={`staff-img ${isBlinking ? "eyes" : ""}`}
        />
        <div className="welcome-message">
          {aiText}
        </div>
        <button
          className="voice-record-btn"
          onClick={startRecording}
          style={{ background: "red", zIndex: 9999 }}
        >
          🎤 말하기
        </button>
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

      {/* 직원 호출 중 모달 */}
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

export default MenuOrder_voice;
