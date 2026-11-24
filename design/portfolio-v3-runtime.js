(() => {
  const root = document.getElementById('frame-portfolio-v3');
  const site = root.querySelector('.fv-site');
  const shell = root.querySelector('.fv-shell');
  const dialog = root.querySelector('.fv-lightbox');
  const films = [
    { art: 'lilac', word: 'LUEUR', sub: 'LIGHT IN EVERY DETAIL', title: 'Lueur — Chạm ánh sáng', summary: 'Một nghiên cứu thị giác về ánh sáng, bề mặt và cảm xúc trong phim sản phẩm nước hoa.', role: 'Quay phim · Ánh sáng · Hậu kỳ' },
    { art: 'olive', word: 'EVERYDAY', sub: 'A QUIETER KIND OF BEAUTY', title: 'Everyday Ritual', summary: 'Một câu chuyện về thói quen chăm sóc bản thân, kể bằng ánh sáng tự nhiên và những chuyển động gần gũi.', role: 'Concept · Quay phim · Chỉnh màu' },
    { art: 'amber', word: 'GOLDEN', sub: 'THE BEAUTY OF SLOW MOMENTS', title: 'Golden Hour', summary: 'Chất liệu, sắc ấm và những khoảnh khắc chậm rãi trong một câu chuyện sản phẩm theo chiều dọc.', role: 'Quay phim · Dựng · Sound design' }
  ];
  const photos = [
    { art: 'lilac', caption: 'Ánh sáng & hình khối' },
    { art: 'olive', caption: 'Sắc xanh dịu' },
    { art: 'amber', caption: 'Chất liệu & sắc ấm' },
    { art: 'landscape', caption: 'Khoảng sáng' },
    { art: 'lilac', caption: 'Một góc nhìn gần hơn' }
  ];
  const backstage = [
    { art: 'bts', kind: 'image', ratio: 4 / 3, title: 'Setup ánh sáng', description: 'Ảnh hậu trường · Bối cảnh và cách bố trí ánh sáng.' },
    { art: 'bts', kind: 'video', ratio: 9 / 16, title: 'On set diary', description: 'Video hậu trường dọc · Từ lúc chuẩn bị đến khi bấm máy.' },
    { art: 'amber', kind: 'image', ratio: 3 / 2, title: 'Chi tiết chất liệu', description: 'Ảnh hậu trường · Những chi tiết nhỏ trong quá trình sản xuất.' },
    { art: 'lilac', kind: 'video', ratio: 9 / 16, title: 'Từ setup đến khung hình', description: 'Video hậu trường dọc · Quá trình hoàn thiện góc máy và ánh sáng.' }
  ];
  const ui = { version: 3, page: 'photo', device: 'desktop', film: 0, tab: 'story', slide: 0 };
  let modalIndex = 0;
  let modalTrigger = null;
  function restore(state) {
    if (!state || state.version !== 3) return;
    if (['home', 'video', 'photo'].includes(state.page)) ui.page = state.page;
    if (['desktop', 'phone'].includes(state.device)) ui.device = state.device;
    if (Number.isInteger(state.film) && state.film >= 0 && state.film < films.length) ui.film = state.film;
    if (Number.isInteger(state.slide) && state.slide >= 0 && state.slide < photos.length) ui.slide = state.slide;
    if (['story', 'bts'].includes(state.tab)) ui.tab = state.tab;
  }
  restore(window.openai?.widgetState?.modelContent);
  function remember() {
    if (window.openai?.setWidgetState) window.openai.setWidgetState({ modelContent: { ...ui }, privateContent: null }).catch(() => {});
  }
  function setArt(element, key) {
    const template = root.querySelector('#fv-art-' + key);
    if (element && template) element.replaceChildren(template.content.cloneNode(true));
  }
  root.querySelectorAll('[data-art]').forEach(el => setArt(el, el.dataset.art));
  function renderCarousel() {
    root.querySelector('.fv-album-track').style.transform = 'translateX(-' + ui.slide * 100 + '%)';
    root.querySelectorAll('[data-slide]').forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.slide) === ui.slide)));
    root.querySelectorAll('.fv-album-slide').forEach((el, index) => el.setAttribute('aria-hidden', String(index !== ui.slide)));
    root.querySelector('[data-album-caption]').textContent = String(ui.slide + 1).padStart(2, '0') + ' / 05 · ' + photos[ui.slide].caption;
    if (ui.page === 'photo') setArt(root.querySelector('.fv-viewer-blur'), photos[ui.slide].art);
  }
  function render() {
    const film = films[ui.film];
    const photo = ui.page === 'photo';
    shell.dataset.mode = ui.device;
    site.dataset.currentPage = ui.page;
    root.querySelectorAll('[data-view]').forEach(el => el.hidden = el.dataset.view !== (ui.page === 'home' ? 'home' : 'detail'));
    root.querySelectorAll('[data-page]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.page === ui.page)));
    root.querySelectorAll('[data-device]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.device === ui.device)));
    root.querySelectorAll('[data-current-art]').forEach(el => setArt(el, film.art));
    root.querySelector('.fv-arena').setAttribute('aria-label', photo ? 'Vùng xem bộ ảnh' : 'Vùng xem video dọc');
    root.querySelector('.fv-viewer-label').textContent = photo ? 'FRAME / PHOTO SERIES' : 'FRAME / PRODUCT FILM';
    root.querySelector('.fv-project-category').textContent = photo ? 'PRODUCT PHOTOGRAPHY / PHOTO SERIES' : 'PRODUCT FILM / VERTICAL';
    root.querySelector('[data-film-title]').textContent = photo ? 'Hình & khoảng trống.' : film.title;
    root.querySelector('[data-film-summary]').textContent = photo ? 'Một bộ ảnh sản phẩm khai thác hình khối, chất liệu và những khoảng sáng. Mỗi khung hình là một góc nhìn trong cùng câu chuyện.' : film.summary;
    root.querySelector('[data-film-role]').textContent = photo ? 'Nhiếp ảnh · Ánh sáng · Hậu kỳ' : film.role;
    root.querySelector('[data-film-word]').textContent = film.word;
    root.querySelector('[data-film-sub]').textContent = film.sub;
    root.querySelector('[data-film-index]').textContent = String(ui.film + 1).padStart(2, '0') + ' / 03';
    root.querySelectorAll('[data-info-tab]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.infoTab === ui.tab)));
    root.querySelectorAll('[data-info-panel]').forEach(el => el.hidden = el.dataset.infoPanel !== ui.tab);
    const story = root.querySelectorAll('.fv-info-story > p');
    story[0].textContent = photo ? 'Tạo một nhịp thị giác bằng ảnh ngang, ảnh dọc và những góc chụp chi tiết. Ánh sáng và chất liệu liên kết các khung hình thành một bộ ảnh nhất quán.' : 'Khai thác sự tương phản giữa ánh sáng mềm và những đường nét của sản phẩm. Chuyển động tiết chế để chất liệu trở thành nhân vật chính.';
    story[1].textContent = photo ? 'Lên hướng hình ảnh, sắp đặt sản phẩm, bố trí ánh sáng, chụp ảnh và hoàn thiện màu sắc. Credits ghi nhận đầy đủ các thành viên cùng tham gia.' : 'Phát triển hướng hình ảnh, setup ánh sáng, quay cận cảnh và hoàn thiện màu sắc. Phần việc cá nhân được ghi rõ theo từng dự án.';
    root.querySelector('.fv-next-link').textContent = photo ? 'Xem dự án video ↗' : 'Dự án tiếp theo ↗';
    root.querySelector('.fv-credit p').firstChild.textContent = photo ? 'Creative direction · Photography · Styling' : 'Creative direction · Cinematography · Styling';
    root.querySelector('.fv-player-note').hidden = true;
    root.querySelector('.fv-inquiry-note').hidden = true;
    renderCarousel();
  }
  function navigate(page) {
    ui.page = page;
    render();
    site.scrollTop = 0;
    root.querySelector('.fv-review').scrollIntoView({ block: 'start', behavior: 'auto' });
    remember();
  }
  function selectPhoto(index) {
    ui.slide = (index + photos.length) % photos.length;
    renderCarousel();
    remember();
  }
  root.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
  root.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => { ui.device = button.dataset.device; render(); site.scrollTop = 0; remember(); }));
  root.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', () => navigate('home')));
  root.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => { ui.film = Number(button.dataset.open); ui.tab = 'story'; navigate('video'); }));
  root.querySelectorAll('[data-photo]').forEach(button => button.addEventListener('click', () => { ui.slide = 0; ui.tab = 'story'; navigate('photo'); }));
  root.querySelectorAll('[data-info-tab]').forEach(button => button.addEventListener('click', () => { ui.tab = button.dataset.infoTab; render(); remember(); }));
  root.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => { ui.film = ui.page === 'photo' ? 0 : (ui.film + 1) % films.length; ui.tab = 'story'; navigate('video'); }));
  root.querySelector('[data-prev]').addEventListener('click', () => { ui.film = (ui.film + films.length - 1) % films.length; ui.tab = 'story'; navigate('video'); });
  root.querySelector('[data-album-prev]').addEventListener('click', () => selectPhoto(ui.slide - 1));
  root.querySelector('[data-album-next]').addEventListener('click', () => selectPhoto(ui.slide + 1));
  root.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => selectPhoto(Number(button.dataset.slide))));
  root.querySelector('.fv-arena').addEventListener('keydown', event => {
    if (ui.page !== 'photo' || dialog.open) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); selectPhoto(ui.slide + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  let swipeStart = null;
  root.querySelector('.fv-album-track').addEventListener('pointerdown', event => { if (event.isPrimary) { swipeStart = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); } });
  root.querySelector('.fv-album-track').addEventListener('pointerup', event => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) selectPhoto(ui.slide + (dx < 0 ? 1 : -1));
  });
  root.querySelector('.fv-album-track').addEventListener('pointercancel', () => { swipeStart = null; });
  function revealInfo() {
    const info = root.querySelector('.fv-project-info');
    if (ui.device === 'phone') site.scrollTop += info.getBoundingClientRect().top - site.getBoundingClientRect().top;
    else info.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  root.querySelector('[data-show-info]').addEventListener('click', revealInfo);
  function renderModal() {
    const item = backstage[modalIndex];
    dialog.dataset.device = ui.device;
    dialog.style.setProperty('--fv-modal-ratio', String(item.ratio));
    dialog.querySelector('[data-modal-kind]').textContent = 'BEHIND THE SCENES / ' + (item.kind === 'video' ? 'VIDEO · 9:16' : 'PHOTO');
    dialog.querySelector('#fv-lightbox-title').textContent = item.title;
    dialog.querySelector('#fv-lightbox-description').textContent = item.description;
    dialog.querySelector('[data-modal-project]').textContent = ui.page === 'photo' ? 'Hình & khoảng trống · Nội dung minh họa' : films[ui.film].title + ' · Nội dung minh họa';
    dialog.querySelector('[data-modal-counter]').textContent = String(modalIndex + 1).padStart(2, '0') + ' / 04';
    dialog.querySelector('[data-modal-play]').hidden = item.kind !== 'video';
    dialog.querySelector('[data-modal-player-note]').hidden = true;
    const asset = dialog.querySelector('[data-modal-art]');
    asset.dataset.kind = item.kind;
    asset.setAttribute('aria-label', item.title + ', ' + (item.kind === 'video' ? 'poster video minh họa' : 'ảnh minh họa'));
    setArt(asset, item.art);
    setArt(dialog.querySelector('[data-modal-blur]'), item.art);
  }
  function openBackstage(index, trigger) {
    modalIndex = index;
    modalTrigger = trigger;
    renderModal();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-modal-close]').focus({ preventScroll: true });
  }
  function moveBackstage(delta) { modalIndex = (modalIndex + delta + backstage.length) % backstage.length; renderModal(); }
  root.querySelectorAll('[data-bts-item]').forEach(button => button.addEventListener('click', () => openBackstage(Number(button.dataset.btsItem), button)));
  root.querySelectorAll('[data-bts-open]').forEach(button => button.addEventListener('click', () => {
    if (button.classList.contains('fv-secondary')) { ui.tab = 'bts'; navigate('video'); if (ui.device === 'phone') revealInfo(); return; }
    const label = button.getAttribute('aria-label') || '';
    openBackstage(label.includes('video') ? 1 : label.includes('chi tiết') ? 2 : 0, button);
  }));
  dialog.querySelector('[data-modal-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-modal-prev]').addEventListener('click', () => moveBackstage(-1));
  dialog.querySelector('[data-modal-next]').addEventListener('click', () => moveBackstage(1));
  dialog.querySelector('[data-modal-play]').addEventListener('click', () => { dialog.querySelector('[data-modal-player-note]').hidden = false; });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { dialog.querySelector('[data-modal-player-note]').hidden = true; if (modalTrigger?.isConnected) modalTrigger.focus({ preventScroll: true }); });
  dialog.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); moveBackstage(event.key === 'ArrowRight' ? 1 : -1); } });
  root.querySelectorAll('[data-anchor]').forEach(button => button.addEventListener('click', () => {
    navigate('home');
    const target = root.querySelector('#' + button.dataset.anchor);
    if (!target) return;
    if (ui.device === 'phone') site.scrollTop += target.getBoundingClientRect().top - site.getBoundingClientRect().top;
    else target.scrollIntoView({ block: 'start', behavior: 'auto' });
  }));
  root.querySelector('.fv-main-play').addEventListener('click', () => { root.querySelector('.fv-player-note').hidden = false; });
  root.querySelector('[data-contact]').addEventListener('click', () => { root.querySelector('.fv-contact-note').hidden = false; });
  root.querySelector('[data-inquiry]').addEventListener('click', () => { root.querySelector('.fv-inquiry-note').hidden = false; });
  window.addEventListener('openai:set_globals', event => { const state = event.detail?.globals?.widgetState?.modelContent; if (state?.version === 3) { restore(state); render(); } });
  render();
  const design = { blur: 32, accent: '#9166e7', hero: 'lilac' };
  function applyDesign() {
    root.style.setProperty('--fv-blur', design.blur + 'px');
    root.style.setProperty('--fv-purple', design.accent);
    root.querySelectorAll('[data-hero-art]').forEach(el => setArt(el, design.hero));
    const index = films.findIndex(film => film.art === design.hero);
    const heroButton = root.querySelector('.fv-hero-frame');
    heroButton.dataset.open = String(index);
    heroButton.setAttribute('aria-label', 'Xem phim sản phẩm ' + films[index].title);
    root.querySelector('.fv-frame-bottom').firstChild.textContent = ['Lueur', 'Everyday', 'Golden'][index];
  }
  applyDesign();
  if (globalThis.Tweak) {
    const tweak = new Tweak({ container: root.querySelector('.fv-hero'), onChange: applyDesign });
    tweak.addSlider(design, 'blur', { min: 12, max: 50, unit: 'px', label: 'Độ blur nền banner' });
    tweak.addColorPicker(design, 'accent', { label: 'Màu nhấn', reference: '--fv-purple' });
    tweak.addSelect(design, 'hero', { label: 'Poster & nền cùng nguồn', options: [{ label: 'Lueur / Tím', value: 'lilac' }, { label: 'Everyday / Xanh', value: 'olive' }, { label: 'Golden / Ấm', value: 'amber' }] });
  }
})();
