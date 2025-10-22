import React, { useState, useEffect } from 'react';
import '../styles/Menu.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function MenuCoffee() {
  const [activeCategory, setActiveCategory] = useState('커피');
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
  const [selectedTemp, setSelectedTemp] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
const [isTalking, setIsTalking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
const [showStaffCallModal, setShowStaffCallModal] = useState(false);
const [isStaffCalling, setIsStaffCalling] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 200); // 0.2초 동안 눈 감기
    }, 3000); // 3초마다 깜빡임

    return () => clearInterval(interval);
  }, []);

const handleMenuClick = () => {
  if (!isTouchMode) {
    setShowSwitchModal(true); // 음성 모드일 때는 모드 전환 모달 띄우기
  } else {
    setShowModal(true); // 터치 모드일 때만 상세 옵션 모달 띄우기
  }
};
  const handleCloseModal = () => {
    setShowModal(false);
    setShowDetail(false);
    setSelectedTemp(null);
    setSelectedSize(null);
    setSelectedOption(null);
  };

  const handleAddToCart = () => {
    console.log("✅ 선택된 주문 옵션");
    console.log("온도:", selectedTemp);
    console.log("사이즈:", selectedSize);
    console.log("추가옵션:", selectedOption);
    handleCloseModal();
  };

  const renderFooterOptions = (onVoiceClick) => (
    <div className="footer-options">
      <Link to="/" className="footer-option">
        <img src="/images/home_icon.png" alt="처음으로" />
        <span>처음으로</span>
      </Link>
 <div
  className={`footer-option ${!isTouchMode ? 'disabled' : ''}`}
  onClick={() => {
    if (isTouchMode) setShowVoiceSwitchModal(true);
  }}
>
  <img src="/images/order_icon.png" alt="음성주문" />
  <span>음성주문</span>
</div>

<div
  className={`footer-option ${isTouchMode ? 'disabled' : ''}`}
  onClick={() => {
    if (!isTouchMode) setShowSwitchModal(true);
  }}
>
  <img src="/images/touch_icon.png" alt="터치주문" />
  <span>터치주문</span>
</div>
<div
  className="footer-option"
  onClick={() => setShowStaffCallModal(true)}  // 모달 열기
>
  <img src="/images/bell_icon.png" alt="직원호출" />
  <span>직원호출</span>
</div>
    </div>
  );

 const menuData = {
  '커피': Array(14).fill({ name: '아메리카노', price: 3900, img: '/images/coffee.png' }),
  '티 · 에이드': Array(16).fill({ name: '복숭아 아이스티', price: 4200, img: '/images/coffee.png' }),
  '주스 · 라떼': Array(15).fill({ name: '망고주스', price: 4500, img: '/images/coffee.png' }),
  '쉐이크 · 스무디': Array(15).fill({ name: '딸기 스무디', price: 4800, img: '/images/coffee.png' }),
  '빙수 · 아이스크림': Array(4).fill({ name: '팥빙수', price: 5500, img: '/images/coffee.png' }),
  '베이커리': Array(14).fill({ name: '크로와상', price: 3000, img: '/images/coffee.png' }),
  '스낵': Array(14).fill({ name: '쿠키', price: 2000, img: '/images/coffee.png' }),
  '★ 스마트 추천': Array(14).fill({ name: '바닐라라떼', price: 4000, img: '/images/coffee.png' }),
};

return (
  <div className="menu-wrapper">
    <aside className="menu-sidebar">
      <h2 className="logo">MOMENT COFFEE</h2>
      <ul>
        {Object.keys(menuData).map((category) => (
          <li
  key={category}
  className={activeCategory === category ? 'active' : ''}
  onClick={() => {
    setActiveCategory(category);
    // 스크롤 영역 맨 위로 이동
    const scrollArea = document.querySelector('.menu-scroll-area');
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
  }}
>
  {category}
</li>

        ))}
      </ul>
    </aside>

    <main className="menu-content">
      <div className="menu-fixed-bar">{activeCategory}</div>

      <div className="menu-scroll-area">
        <div className="menu-grid">
          {menuData[activeCategory].map((item, i) => (
            <div className="menu-item" key={i} onClick={handleMenuClick}>
              <img src={item.img} alt={item.name} />
              <p>{item.name}<br /><strong>{item.price.toLocaleString()}원</strong></p>
            </div>
          ))}
        </div>
      </div>
    </main>



      <footer className="menu-footer">
        {!isTouchMode ? (
          <>
<img
  src={isBlinking ? '/images/staff_eyes.png' : '/images/staff.png'}
  alt="staff"
  className={`staff-img ${isBlinking ? 'eyes' : ''}`}
/>


            <div className="welcome-message">
              어서오세요<br />
              음성주문 모드 사용중입니다<br />
              원하시는 음료를 말씀해주세요.
            </div>
            {renderFooterOptions(() => setShowVoiceSwitchModal(true))}
          </>
        ) : (
         <div className="touch-mode-footer">

  {/* ✅ 카드들을 감싸는 회색 박스 */}
  <div className="cart-box-wrapper">
    <div className="cart-slider-area">
        <button className="arrow left">◀</button>
      {[
        { name: '아메리카노', qty: 1 },
        { name: '아메리카노', qty: 2 },
        { name: '아메리카노', qty: 1 },
      ].map((item, idx) => (
        <div className="cart-card" key={idx}>
          <img src="/images/coffee.png" alt={item.name} />
          <p>{item.name}</p>
          <div className="qty-controller">
            <button>-</button>
            <span>{item.qty}</span>
            <button>+</button>
          </div>
          <button className="remove-btn">X</button>
        </div>
      ))}
        <button className="arrow right">▶</button>
    </div>
  </div>

  {/* ✅ 결제 정보 박스 */}
  <div className="summary-box">
    <div className="summary-title">총 결제금액</div>
    <div className="summary-price">₩12,000원</div>
    <div className="summary-buttons">
      <button className="cancel-order">전체 취소</button>
      <button className="confirm-order" onClick={() => navigate('/order')}>
        주문 하기
      </button>
    </div>
  </div>

  {renderFooterOptions(() => setShowSwitchModal(true))}
</div>
        )}
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

      {showVoiceSwitchModal && (
        <div className="modal-overlay">
          <div className="modal-box switch-modal">
            <h3>음성 모드로 전환하시겠습니까?</h3>
            <p>현재 터치주문 모드입니다. <br/>음성으로 주문하시려면 전환이 필요합니다.</p>
             <div className="modal-buttons switch-buttons">
              <button onClick={() => setShowVoiceSwitchModal(false)} className="cancel-btn switch-cancel">아니오</button>
              <button
                onClick={() => {
                  setShowVoiceSwitchModal(false);
                  setIsTouchMode(false);
                }}
                className="add-btn switch-confirm"
              >예</button>
            </div>
          </div>
        </div>
      )}

     {showModal && (
  <div className="modal-overlay">
    <div className="option-modal-box">
            <h3>옵션 메뉴 선택</h3>
            <img src="/images/coffee.png" alt="coffee" style={{ width: '100px' }} />
            <p><strong>아메리카노</strong></p>
            <p>V3X만의 특별한 원두로 제작한 아메리카노</p>

            <div className="option-section">
              <p><strong>온도</strong></p>
              <button className={selectedTemp === 'HOT' ? 'active' : ''} onClick={() => setSelectedTemp('HOT')}>HOT</button>
              <button className={selectedTemp === 'ICE' ? 'active' : ''} onClick={() => setSelectedTemp('ICE')}>ICE</button>
            </div>

            <div className="option-section">
              <p><strong>사이즈</strong></p>
              <button className={selectedSize === 'Small' ? 'active' : ''} onClick={() => setSelectedSize('Small')}>Small</button>
              <button className={selectedSize === 'Regular' ? 'active' : ''} onClick={() => setSelectedSize('Regular')}>Regular</button>
              <button className={selectedSize === 'Large' ? 'active' : ''} onClick={() => setSelectedSize('Large')}>Large</button>
            </div>

            <div className="option-section">
              <p><strong>추가 옵션</strong></p>
              <button className={selectedOption === '연하게' ? 'active' : ''} onClick={() => setSelectedOption('연하게')}>연하게</button>
              <button className={selectedOption === '기본' ? 'active' : ''} onClick={() => setSelectedOption('기본')}>기본</button>
              <button className={selectedOption === '진하게' ? 'active' : ''} onClick={() => setSelectedOption('진하게')}>진하게</button>
            </div>

            <div className="option-section">
              <p
                onClick={() => setShowDetail(!showDetail)}
                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#555', marginTop: '10px' }}
              >
                {showDetail ? '상세정보 닫기' : '상세정보 보기'}
              </p>
              {showDetail && (
                <div className="nutrition-box">
                  <p>칼로리: 120 kcal</p>
                  <p>카페인: 85 mg</p>
                  <p>당류: 8 g</p>
                  <p>나트륨: 30 mg</p>
                </div>
              )}
            </div>

             <div className="modal-buttons option-buttons">
              <button onClick={handleCloseModal} className="cancel-btn option-cancel">취소</button>
              <button onClick={handleAddToCart} className="add-btn option-add">담기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuCoffee;
