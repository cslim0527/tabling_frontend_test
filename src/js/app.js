import "../scss/style.scss";

const BASE_URL = "https://frontend.tabling.co.kr";
let reservation_data = [];
let resizing = false;

// 예약 정보 API 호출 함수
const getReservationData = async () => {
  const url = BASE_URL + "/v1/store/9533/reservations";
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return data?.reservations;
  } catch (err) {
    console.log(err);
    alert("예약정보를 불러올수 없습니다.\n관리자에게 문의하세요.");
  }
};

const getFormattedTime = (timeReserved) => {
  const HH = timeReserved.split(" ")[1].split(":")[0];
  const mm = timeReserved.split(" ")[1].split(":")[1];
  return `${HH}:${mm}`;
};

const getReservationStatus = (status) => {
  return status === "reserved" ? "예약" : "착석 중";
};

const getReservationTemp = (item) => {
  const { timeReserved, status, tables, customer, menus, id } = item;

  return `<li class="reservation-item" data-id="${id}">
            <div class="item-status">
              <span class="time">${getFormattedTime(timeReserved)}</span>
              <span class="status ${status}">${getReservationStatus(
    status
  )}</span>
            </div>

            <div class="item-desc">
              <div class="customer">
                ${customer.name}
                -
                ${tables
                  .reduce((text, table) => text + ` ${table.name},`, "")
                  .replace(/,$/, "")}
              </div>
              <div class="personnel">
                <span class="adult">성인 ${customer.adult}</span>
                ${
                  customer.child
                    ? '<span class="child">아이' + customer.child + "</span>"
                    : ""
                }
              </div>
              <div class="menus">${menus
                .reduce(
                  (text, menu) => text + ` ${menu.name} (${menu.qty}),`,
                  ""
                )
                .replace(/,$/, "")}</div>
            </div>

            <div class="item-btns">
             ${
               status === "reserved"
                 ? '<button type="button" class="reserved-btn">착석</button>'
                 : '<button type="button" class="seated-btn">퇴석</button>'
             }
              
            </div>
          </li>`;
};

const getReservationListHtmls = (reservations) => {
  return reservations.reduce((html, item) => {
    html += getReservationTemp(item);
    return html;
  }, "");
};

const renderReservationList = () => {
  const listWrapEl = document.getElementById("reservationListRender");
  if (!listWrapEl) {
    alert("리스트를 출력 할 수 없습니다.");
    return;
  }

  const filtered_data = reservation_data?.filter(
    (item) => item.status !== "done"
  );

  if (filtered_data.length) {
    listWrapEl.innerHTML = getReservationListHtmls(filtered_data);
  } else {
    listWrapEl.innerHTML = "예약이 없습니다.";
  }
};

const getReservationDetailTemp = (reservation) => {
  const { status, timeReserved, timeRegistered, customer } = reservation;
  // console.log(reservation);

  return `<div class="reservation-detail">
            <div class="detail-title">예약 정보</div>

            <ul class="info-list" id="reservationDetailInfo">
              <li class="info-item">
                <span class="subject">예약 상태</span>
                <span class="desc">${getReservationStatus(status)}</span>
              </li>
              <li class="info-item">
                <span class="subject">예약 시간</span>
                <span class="desc">${getFormattedTime(timeReserved)}</span>
              </li>
              <li class="info-item">
                <span class="subject">접수 시간</span>
                <span class="desc">${getFormattedTime(timeRegistered)}</span>
              </li>
            </ul>
          </div>
          <!--//reservation-detail-info-->

          <div class="customer-detail">
            <div class="detail-title">고객 정보</div>

            <ul class="info-list" id="customerDetailInfo">
              <li class="info-item">
                <span class="subject">고객 성명</span>
                <span class="desc">${customer.name}</span>
              </li>
              <li class="info-item">
                <span class="subject">고객 등급</span>
                <span class="desc">${customer.level}</span>
              </li>
              <li class="info-item">
                <span class="subject">고객 메모</span>
                <span class="desc">${customer.memo}</span>
              </li>
            </ul>
          </div>
          <!--//customer-detail-info-->

          <div class="request-detail">
            <ul class="info-list">
              <li class="info-item">
                <span class="subject">요청 사항</span>
                <span class="desc" id="requestDetailInfo">${
                  customer.request
                }</span>
              </li>
            </ul>
          </div>`;
};

const renderReservationDetail = (reservation) => {
  const detailWrapEl = document.getElementById("reservationDetailRender");
  detailWrapEl.innerHTML = reservation?.id
    ? getReservationDetailTemp(reservation)
    : "예약 정보를 선택하세요.";
};

const changeTableState = (current_reservation) => {
  if (current_reservation.status === "seated") {
    current_reservation.status = "done";
    renderReservationDetail([]);
  }

  if (current_reservation.status === "reserved") {
    current_reservation.status = "seated";
    renderReservationDetail(current_reservation);
  }

  const filtered_data = reservation_data?.filter(
    (item) => item.status !== "done"
  );

  renderReservationList();

  if (filtered_data.length) {
    setItemClickEvent();
  } else {
    renderReservationDetail([]);
  }
};

const setPopupState = (action) => {
  // 데스크톱 화면 이상에서는 팝업 띄우지 않게
  if (window.innerWidth >= 1024) {
    return;
  }

  const dim = document.getElementById("popupDim");
  const modal = document.getElementById("popupModal");

  if (action === "show") {
    dim.classList.add("show");
    modal.classList.add("slide-up");
  } else {
    dim.classList.remove("show");
    modal.classList.remove("slide-up");
  }
};

const handleClickReservationItem = (e) => {
  const reservation_id = e.currentTarget.dataset.id;
  const target_idx = reservation_data.findIndex(
    (item) => item.id === reservation_id
  );

  if (e.target.tagName !== "BUTTON") {
    // 예약 아이템 클릭 시
    renderReservationDetail(reservation_data[target_idx]);
    setPopupState("show");
  } else {
    // 착석 or 퇴석 버튼 클릭 시
    changeTableState(reservation_data[target_idx]);
  }
};

const handleClickDimArea = (e) => {
  if (e.target.id === "popupDim") {
    setPopupState("hide");
  }
};

const handleResizeEvent = () => {
  if (!resizing) {
    resizing = setTimeout(() => {
      console.log(window.innerWidth, resizing);
      resizing = false;

      if (window.innerWidth >= 1024) {
        const dim = document.getElementById("popupDim");
        const modal = document.getElementById("popupModal");
        dim.classList.remove("show");
        modal.classList.remove("slide-up");
      }
    }, 250);
  }
};

const setItemClickEvent = () => {
  const items = [
    ...document.querySelectorAll("#reservationListRender .reservation-item"),
  ];

  items.forEach((item) => {
    item.addEventListener("click", handleClickReservationItem);
  });
};

const setPopupCloseBtnEvent = () => {
  const closeBtn = document.getElementById("closePopupBtn");
  closeBtn.addEventListener("click", () => setPopupState("hide"));
};

const setDimCloseEvent = () => {
  window.addEventListener("click", handleClickDimArea);
};

const setResizeEvent = () => {
  window.addEventListener("resize", handleResizeEvent);
};

const addEvent = () => {
  setItemClickEvent();
  setPopupCloseBtnEvent();
  setDimCloseEvent();
  setResizeEvent();
};

const init = async () => {
  const reservations = await getReservationData();

  // API로 불러온 데이터 상태 저장
  reservation_data = reservations;

  // 예약 목록 렌더
  renderReservationList();

  // 예약 정보 렌더
  if (reservations) {
    renderReservationDetail(reservation_data[0]);
  } else {
    renderReservationDetail([]);
  }

  // 이벤트 등록
  addEvent();
};

// 예약 목록 페이지 초기화
init();
