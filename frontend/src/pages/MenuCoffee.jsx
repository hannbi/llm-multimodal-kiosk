import React, { useState, useEffect } from 'react';
import '../styles/Menu.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

function MenuCoffee() {
  const [activeCategory, setActiveCategory] = useState('커피');
  const navigate = useNavigate();
  // 🔥 음성 녹음 + 서버 전송 함수 추가 (필수)
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const options = { mimeType: "audio/webm; codecs=opus" };
    const recorder = new MediaRecorder(stream, options);

    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };


    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm; codecs=opus" });

      sendVoice(blob);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 6000);
  };

  const sendVoice = async (blob) => {
    const formData = new FormData();
    formData.append("file", blob, "audio.webm");

    const res = await fetch("http://localhost:5000/voice", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setAiText(data.ai_text);

    // 🔥 menuData가 로딩되지 않았다면 모달 띄우기 중단
    if (!menuData || Object.keys(menuData).length === 0) {
      console.log("⚠ menuData 아직 로딩 안됨");
      return;
    }

    // 🔥 음성으로 카테고리 변경
    if (data.intent === "ChangeCategory" && data.slots?.category) {
      const category = data.slots.category;

      // 프론트 카테고리 이름과 매핑
      const mapping = {
        "커피": "커피",
        "티/에이드": "티/에이드",
        "주스/라떼": "주스/라떼",
        "쉐이크/스무디": "쉐이크/스무디",
        "빙수/아이스크림": "빙수/아이스크림",
        "빵/케이크": "빵/케이크",
        "스낵": "스낵",
      };

      const normalized = mapping[category];

      if (normalized && menuData[normalized]) {
        setActiveCategory(normalized);
        setAiText(`${normalized} 화면입니다.`);

        // 스크롤 맨 위로 이동
        setTimeout(() => {
          const scrollArea = document.querySelector('.menu-scroll-area');
          if (scrollArea) scrollArea.scrollTop = 0;
        }, 50);
      }

      return; // 더 이상 아래로 내려가지 않게
    }


    // 🔥 GPT가 BuildOrder + menu_name을 보냈으면 옵션 모달 자동 오픈
    // 🔥 GPT가 BuildOrder + menu_name을 보냈으면 옵션 모달 자동 오픈
    if (data.intent === "BuildOrder" && data.slots?.menu_name) {
      const menuName = data.slots.menu_name;

      const foundMenu = Object.values(menuData)
        .flat()
        .find((m) => m.name === menuName);

      if (foundMenu) {
        setSelectedMenu(foundMenu);
        setShowModal(true);

        fetch(`http://localhost:5000/api/menu/${foundMenu.name}/options`)
          .then((res) => res.json())
          .then((opt) => {
            setAvailableSizes(opt.sizes || []);
            setAvailableTemps(opt.temperatures || []);

            // 🔥 온도 옵션 자동 선택
            if (opt.temperatures && opt.temperatures.length === 1) {
              setSelectedTemp(opt.temperatures[0]);  // 자동 선택
            } else {
              // 음성으로 온도가 들어온 경우 적용
              if (data.slots.temperature) {
                const t = data.slots.temperature.toLowerCase();
                if (t.includes("ice")) setSelectedTemp("Iced");
                else if (t.includes("hot") || t.includes("뜨") || t.includes("핫"))
                  setSelectedTemp("Hot");
              }
            }

            // 🔥 사이즈도 자동 선택할지 (있으면)
            if (opt.sizes && opt.sizes.length === 1) {
              setSelectedSize(opt.sizes[0]);
            }
          });
      }
    }




    if (data.intent === "OptionSelect") {
      const { temperature, size } = data.slots;

      // ⚠ 서버가 '제공되지 않아요'라고 말한 경우 → 선택 초기화
      if (data.ai_text.includes("제공되지 않아요")) {
        setSelectedTemp(null);
        setSelectedSize(null);
        return;
      }

      // 🔥 온도 정규화 후 적용
      if (temperature) {
        let normalizedTemp = null;
        const t = temperature.toLowerCase();

        if (t.includes("ice")) normalizedTemp = "Iced";
        else if (t.includes("hot") || t.includes("뜨") || t.includes("핫")) normalizedTemp = "Hot";

        if (normalizedTemp) {
          setSelectedTemp(normalizedTemp);
        }
      }

      // 🔥 사이즈 정규화 후 적용
      if (size) {
        let normalizedSize = null;
        const s = size.toLowerCase();

        if (s.includes("small") || s.includes("스몰")) normalizedSize = "Small";
        else if (s.includes("large") || s.includes("라지")) normalizedSize = "Large";

        if (normalizedSize) {
          setSelectedSize(normalizedSize);
        }
      }
    }


    if (data.intent === "AddToCart") {
      // 기존 장바구니 담기 로직 실행
      handleAddToCart();

      // 옵션창 자동 닫기
      setShowModal(false);

      // 옵션 초기화
      setSelectedTemp(null);
      setSelectedSize(null);
      setSelectedOption(null);
    }


    // 음성 재생
    const audio = new Audio("http://localhost:5000/" + data.audio_url);
    audio.play();
  };



  const [showOptionWarning, setShowOptionWarning] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [showVoiceSwitchModal, setShowVoiceSwitchModal] = useState(false);
  const [selectedTemp, setSelectedTemp] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [aiText, setAiText] = useState("어서오세요! 음성으로 주문해주세요.");  // ① 추가
  const [isBlinking, setIsBlinking] = useState(false);
  const [showStaffCallModal, setShowStaffCallModal] = useState(false);
  const [isStaffCalling, setIsStaffCalling] = useState(false);

  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableTemps, setAvailableTemps] = useState([]);

  const [cartItems, setCartItems] = useState([]);
  const location = useLocation();

  useEffect(() => {
    let ignore = false;

    if (!ignore) {
      fetch("http://localhost:5000/speak/welcome")
        .then(res => res.json())
        .then(data => {
          if (data.audio_url) {
            new Audio("http://localhost:5000/" + data.audio_url).play();
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (sessionStorage.getItem("welcomePlayed") === "true") return;

    fetch("http://localhost:5000/speak/welcome")
      .then(res => res.json())
      .then(data => {
        if (data.audio_url) {
          new Audio("http://localhost:5000/" + data.audio_url).play();
        }
        sessionStorage.setItem("welcomePlayed", "true");
      })
      .catch(err => console.error("음성 재생 실패:", err));
  }, []);


  // 눈 깜빡임 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200); // 0.2초 동안 눈 감기
    }, 3000); // 3초마다 깜빡임

    return () => clearInterval(interval);
  }, []);

  // 메뉴 불러오기 (FastAPI)
  useEffect(() => {
    fetch("http://localhost:5000/api/menu")
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};

        data.forEach((item) => {
          if (!grouped[item.category]) grouped[item.category] = [];

          // 중복 제거: 같은 이름의 메뉴는 한 번만 추가
          const exists = grouped[item.category].some(
            (menu) => menu.name === item.name
          );

          if (!exists) {
            grouped[item.category].push({
              name: item.name,
              price: item.price,
              calories_kcal: item.calories_kcal,
              caffeine_mg: item.caffeine_mg,
              sugar_g: item.sugar_g,
              sodium_mg: item.sodium_mg,
              img: item.image_url, // 임시 이미지
            });
          }
        });

        setMenuData(grouped);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ 메뉴 불러오기 실패:", err);
        setLoading(false);
      });
  }, []); // 빈 배열이면 처음 렌더링 시 1회만 실행

  // 옵션에 따른 상세정보, 가격 변동
  useEffect(() => {
    if (!selectedMenu || !selectedTemp || !selectedSize) return;

    fetch(
      `http://localhost:5000/api/menu/${selectedMenu.name}/detail?size=${selectedSize}&temperature=${selectedTemp}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSelectedMenu((prev) => ({
          ...prev,
          price: data.price,
          volume_ml: data.volume_ml,
          calories_kcal: data.calories_kcal,
          sugar_g: data.sugar_g,
          protein_g: data.protein_g,
          caffeine_mg: data.caffeine_mg,
          sodium_mg: data.sodium_mg,
        }));
      })
      .catch(() =>
        console.warn("⚠️ 상세정보를 불러오지 못했습니다.")
      );
  }, [selectedTemp, selectedSize]);

  useEffect(() => {
    if (location.state?.cartItems) {
      setCartItems(location.state.cartItems);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state?.forceTouch === true) {
      setIsTouchMode(true);
    }
  }, [location.state]);


  const handleMenuClick = (item) => {
    if (!isTouchMode) {
      setShowSwitchModal(true);
    } else {
      setSelectedMenu(item);
      setShowModal(true);

      // 메뉴별 선택 가능한 옵션만 표시
      fetch(`http://localhost:5000/api/menu/${item.name}/options`)
        .then((res) => res.json())
        .then((data) => {
          setAvailableSizes(data.sizes || []);
          setAvailableTemps(data.temperatures || []);

          // 온도 옵션이 1개이면 자동 선택
          if (data.temperatures && data.temperatures.length === 1) {
            if (!selectedTemp) { // 이미 음성으로 선택된 값이 있으면 유지
              setSelectedTemp(data.temperatures[0]);
            }
          }

          // 온도 옵션 여러 개일 때 초기화하지 않음!
          // 음성 인식으로 들어온 값이 소중함
          // setSelectedTemp(null)  ← 절대 하지 말기


          // 🔥 사이즈 옵션도 1개면 자동 선택 (필요하면)
          if (data.sizes && data.sizes.length === 1) {
            setSelectedSize(data.sizes[0]);
          } else {
            setSelectedSize(null);
          }
        })
        .catch((err) => console.error("옵션 불러오기 실패:", err));

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
    const hasTempOption = availableTemps.length > 0;
    const hasSizeOption = availableSizes.length > 0;

    // 추가옵션이 필요한 카테고리인지 판단 (기존 UI 조건과 동일하게)
    const needExtraOption = !['빙수 · 아이스크림', '베이커리', '스낵'].includes(activeCategory);

    // 온도 옵션 필요인데 선택 안 했으면 경고
    if (hasTempOption && !selectedTemp) {
      setShowOptionWarning(true);
      return;
    }

    // 사이즈 옵션 필요인데 선택 안 했으면 경고
    if (hasSizeOption && !selectedSize) {
      setShowOptionWarning(true);
      return;
    }



    // 온도 옵션이 ICE 하나만 있을 경우 자동 선택
    if (hasTempOption && availableTemps.length === 1 && !selectedTemp) {
      setSelectedTemp(availableTemps[0]);
    }

    const newItem = {
      name: selectedMenu.name,
      price: selectedMenu.price,
      temp: selectedTemp,
      size: selectedSize,
      option: selectedOption,
      img: selectedMenu.img,
      qty: 1
    };

    setCartItems(prev => [...prev, newItem]);
    handleCloseModal();
  };




  const updateQty = (index, diff) => {
    setCartItems(prev =>
      prev.map((item, i) =>
        i === index
          ? { ...item, qty: Math.max(1, item.qty + diff) }
          : item
      )
    );
  };


  const removeFromCart = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );


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

  if (loading) return <div className="menu-loading">메뉴 불러오는중...</div>;

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
            {menuData[activeCategory]?.length > 0 ? (
              menuData[activeCategory].map((item, i) => (
                <div className="menu-item" key={i} onClick={() => handleMenuClick(item)}>
                  <img src={item.img} alt={item.name} />
                  <p>
                    {item.name}
                    <br />
                    <strong>{item.price.toLocaleString()}원</strong>
                  </p>
                </div>
              ))
            ) : (
              <p>메뉴가 없습니다.</p>
            )}
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
              {aiText}
            </div>

            <button
              className="voice-record-btn"
              onClick={startRecording}
              style={{ background: 'red', zIndex: 9999 }}
            >
              🎤 말하기
            </button>

            {renderFooterOptions(() => setShowVoiceSwitchModal(true))}
          </>
        ) : (
          <div className="touch-mode-footer">

            {/* 카드들을 감싸는 회색 박스 */}
            <div className="cart-box-wrapper">
              <div className="cart-slider-area">

                {cartItems.length === 0 && (
                  <div style={{ padding: 20, opacity: 0.7 }}>담긴 메뉴가 없습니다.</div>
                )}

                {cartItems.map((item, idx) => (
                  <div className="cart-card" key={idx}>
                    <img src={item.img} alt={item.name} />
                    <p>{item.name}</p>

                    <div className="cart-option">
                      {item.temp} / {item.size}
                      {item.option && ` / ${item.option}`}
                    </div>

                    <div className="qty-controller">
                      <button onClick={() => updateQty(idx, -1)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => updateQty(idx, 1)}>+</button>
                    </div>

                    <button className="remove-btn" onClick={() => removeFromCart(idx)}>X</button>
                  </div>
                ))}
              </div>

            </div>

            {/* 결제 정보 박스 */}
            <div className="summary-box">
              <div className="summary-title">총 결제금액</div>
              <div className="summary-price">
                ₩{totalPrice.toLocaleString()}원
              </div>
              <div className="summary-buttons">
                <button className="cancel-order">전체 취소</button>
                <button
                  className="confirm-order"
                  onClick={() =>
                    navigate("/order", {
                      state: { cartItems, totalPrice },
                    })
                  }
                >
                  주문 하기
                </button>

              </div>
            </div>

            {renderFooterOptions(() => setShowSwitchModal(true))}
          </div>
        )}
      </footer>
      {showOptionWarning && (
        <div className="modal-overlay option-warning-overlay">

          <div className="modal-box switch-modal">
            <h3>옵션을 선택해주세요</h3>
            <p>필수 옵션을 모두 선택해야 담을 수 있습니다.</p>

            <div className="modal-buttons switch-buttons">
              <button
                onClick={() => setShowOptionWarning(false)}
                className="switch-confirm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p>현재 터치주문 모드입니다. <br />음성으로 주문하시려면 전환이 필요합니다.</p>
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

      {/*옵션 선택 모달*/}
      {showModal && (
        <div className="modal-overlay">
          <div className="option-modal-box">
            <h3>옵션 메뉴 선택</h3>
            <img
              src={selectedMenu?.img}
              alt={selectedMenu?.name}
              style={{ width: '140px', borderRadius: '8px' }}
            />
            <p><strong>{selectedMenu?.name || '음료 선택됨'}</strong></p>
            <p>V3X만의 특별한 원두로 제작한 {selectedMenu?.name}</p>

            {/* 실시간 가격 반영 */}
            <p style={{ fontWeight: 'bold', fontSize: '1.8rem', marginTop: '12px' }}>
              ₩{selectedMenu?.price?.toLocaleString() || 0}
            </p>

            {/* 옵션 선택: 빙수/베이커리/스낵 제외 */}
            {!['빙수 · 아이스크림', '베이커리', '스낵'].includes(activeCategory) && (
              <>
                {/* 온도 */}
                <div className="option-section">
                  <p><strong>온도</strong></p>
                  {availableTemps.includes('Hot') && (
                    <button
                      className={selectedTemp === 'Hot' ? 'active' : ''}
                      onClick={() => setSelectedTemp('Hot')}
                    >
                      HOT
                    </button>
                  )}
                  {availableTemps.includes('Iced') && (
                    <button
                      className={selectedTemp === 'Iced' ? 'active' : ''}
                      onClick={() => setSelectedTemp('Iced')}
                    >
                      ICE
                    </button>
                  )}
                </div>

                {/* 사이즈 */}
                <div className="option-section">
                  <p><strong>사이즈</strong></p>
                  {availableSizes.includes('Small') && (
                    <button
                      className={selectedSize === 'Small' ? 'active' : ''}
                      onClick={() => setSelectedSize('Small')}
                    >
                      Small
                    </button>
                  )}
                  {availableSizes.includes('Large') && (
                    <button
                      className={selectedSize === 'Large' ? 'active' : ''}
                      onClick={() => setSelectedSize('Large')}
                    >
                      Large
                    </button>
                  )}
                </div>


                {/* 추가 옵션 */}
                <div className="option-section">
                  <p><strong>추가 옵션</strong></p>
                  <button
                    className={selectedOption === '연하게' ? 'active' : ''}
                    onClick={() => setSelectedOption('연하게')}
                  >
                    연하게
                  </button>
                  <button
                    className={selectedOption === '기본' ? 'active' : ''}
                    onClick={() => setSelectedOption('기본')}
                  >
                    기본
                  </button>
                  <button
                    className={selectedOption === '진하게' ? 'active' : ''}
                    onClick={() => setSelectedOption('진하게')}
                  >
                    진하게
                  </button>
                </div>
              </>
            )}

            {/* 상세정보 보기 */}
            <div className="option-section">
              <p
                onClick={() => setShowDetail(!showDetail)}
                style={{
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  color: '#3A3A58',
                  marginTop: '10px',
                }}
              >
                {showDetail ? '상세정보 닫기' : '상세정보 보기'}
              </p>

              {showDetail && selectedMenu && (
                <div className="nutrition-box">
                  <p>용량: {selectedMenu.volume_ml || 0} ml</p>
                  <p>칼로리: {selectedMenu.calories_kcal || 0} kcal</p>
                  <p>카페인: {selectedMenu.caffeine_mg || 0} mg</p>
                  <p>단백질: {selectedMenu.protein_g || 0} g</p>
                  <p>당류: {selectedMenu.sugar_g || 0} g</p>
                  <p>나트륨: {selectedMenu.sodium_mg || 0} mg</p>
                </div>
              )}
            </div>

            <div className="modal-buttons option-buttons">
              <button onClick={handleCloseModal} className="cancel-btn option-cancel">
                취소
              </button>
              <button onClick={handleAddToCart} className="add-btn option-add">
                담기
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default MenuCoffee;
