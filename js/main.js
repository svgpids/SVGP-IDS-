// Live IST Clock Tracker (Accurate to current Indian Standard Time)
function updateClock() {
  const clockElement = document.getElementById('live-time-display');
  if (!clockElement) return;

  const now = new Date();
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  const formattedDate = now.toLocaleString('en-IN', options);
  clockElement.textContent = `${formattedDate} IST`;
}

// Mobile Menu Trigger
const mobileBtn = document.querySelector('.mobile-menu-trigger');
if (mobileBtn) {
  mobileBtn.addEventListener('click', () => {
    alert('S.V. Government Polytechnic Portal Menu');
  });
}

setInterval(updateClock, 1000);
updateClock();