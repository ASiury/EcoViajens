const GA_ID = 'G-BMBTCY4ZDR';

const products = [
    { id: 'geleia-cupuacu', name: 'Geleia de cupuaçu', category: 'geleias', desc: 'Azedinho perfumado e sabor marcante. Pote de 250 g.', price: 24, badge: 'Da estação', img: 'imgs/geleia-cupuacu.png' },
    { id: 'compota-buriti', name: 'Compota de buriti', category: 'compotas', desc: 'Doce macio de fruta amazônica. Pote de 250 g.', price: 28, badge: 'Receita da casa', img: 'imgs/compota-buriti.png' },
    { id: 'geleia-tapereba', name: 'Geleia de taperebá', category: 'geleias', desc: 'Equilíbrio delicioso entre o doce e o azedinho. Pote de 250 g.', price: 24, badge: 'Mais querida', img: 'imgs/geleia-tapereba.png' },
    { id: 'doce-mamao', name: 'Doce de mamão cristalizado', category: 'compotas', desc: 'Sabor exótico e apaixonante. Pote de 250g', price: 22, badge: 'O tradicional', img: 'imgs/doce-mamao.png' },
    { id: 'kit-regional', name: 'Kit sabores da região', category: 'kits', desc: 'Três potes em sabores sazonais para provar e presentear.', price: 68, badge: 'Para presentear', img: 'imgs/kit-sabores-regionais.png' }
];

const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
let activeFilter = 'todos';
let cart = JSON.parse(localStorage.getItem('doceafeto-compotas-cart') || '{}');

function track(event, params = {}) { if (typeof gtag === 'function') gtag('event', event, params); }

function imageUrl(path) { return path || ''; }

function renderProducts() {
    let q = document.getElementById('search').value.trim().toLowerCase();
    let list = products.filter(p =>
        (activeFilter === 'todos' || p.category === activeFilter) &&
        (`${p.name} ${p.desc}`).toLowerCase().includes(q)
    );
    const sort = document.getElementById('sort').value;
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);
    document.getElementById('products').innerHTML = list.length
        ? list.map(p => `<article class="product"><div class="product-photo" data-label="${p.name}"><img src="${imageUrl(p.img)}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('needs-image')"><span class="badge">${p.badge}</span></div><div class="product-info"><span class="product-category">${p.category === 'kits' ? 'Kits-presente' : p.category}</span><h3>${p.name}</h3><p class="product-desc">${p.desc}</p><div class="price-row"><div><span class="price">${brl(p.price)}</span><span class="pix">${brl(p.price * .95)} no Pix (5% off)</span></div><button class="add-btn" data-add="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">+</button></div></div></article>`).join('')
        : '<p>Nenhum doce encontrado. Tente outra busca.</p>';
    document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addToCart(b.dataset.add));
}

// ── Contagem do carrinho sem chamar renderCart (evita erro quando drawer está fechado) ──
function updateCartCount() {
    document.getElementById('cart-count').textContent = Object.values(cart).reduce((a, b) => a + b, 0);
}

function saveCart() {
    localStorage.setItem('doceafeto-compotas-cart', JSON.stringify(cart));
    updateCartCount();
    // Só renderiza o cart se o drawer estiver aberto
    if (document.getElementById('cart').classList.contains('open')) {
        renderCart();
    }
}

function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    track('add_to_cart', { currency: 'BRL', items: [{ item_id: id, item_name: products.find(p => p.id === id).name }] });
    toast('Adicionado à sua caixinha ♡');
}

let checkoutStep = 0;
let checkoutData = { name: '', email: '', cep: '', street: '', number: '', complement: '', city: 'Rio Branco', state: 'AC', shipping: 'standard', payment: 'pix', coupon: '' };
let currentAccount = JSON.parse(localStorage.getItem('doceafeto-session') || 'null');

function authenticatedAccount() {
    try {
        const session = JSON.parse(localStorage.getItem('doceafeto-session') || 'null');
        if (!session?.email) return null;
        const users = JSON.parse(localStorage.getItem('doceafeto-users') || '{}');
        const user = users[session.email.toLowerCase()];
        if (!user?.passwordHash || user.email !== session.email || user.name !== session.name) return null;
        currentAccount = { name: user.name, email: user.email, address: user.address || {} };
        return currentAccount;
    } catch {
        return null;
    }
}

function requireAccountForCheckout() {
    if (authenticatedAccount()) return true;
    currentAccount = null;
    checkoutStep = 0;
    openAccount('login');
    toast('Entre ou crie uma conta antes de continuar com a compra.');
    return false;
}

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function cartEntries() { return Object.entries(cart).filter(([id, q]) => products.some(p => p.id === id) && q > 0); }

function cartSubtotal() { return cartEntries().reduce((sum, [id, q]) => sum + products.find(p => p.id === id).price * q, 0); }

function shippingCost() { if (cartSubtotal() >= 180 && checkoutData.shipping === 'standard') return 0; return checkoutData.shipping === 'express' ? 20 : 12; }

function couponDiscount() { return checkoutData.coupon === 'AFETO10' ? cartSubtotal() * .10 : 0; }

function paymentDiscount() { return checkoutData.payment === 'pix' ? (cartSubtotal() - couponDiscount()) * .05 : 0; }

function orderTotal() { return Math.max(0, cartSubtotal() - couponDiscount() - paymentDiscount() + shippingCost()); }

function checkoutProgress() {
    return `<div class="checkout-progress">${['Carrinho', 'Entrega', 'Pagamento', 'Revisão'].map((label, i) => `<span class="${checkoutStep >= i ? 'done' : ''}"><b>${i + 1}</b>${label}</span>`).join('')}</div>`;
}

function closeCart() {
    document.getElementById('cart').classList.remove('open');
}

function renderCart() {
    const el = document.getElementById('cart-content');
    if (!el) return;
    const entries = cartEntries();
    if (checkoutStep > 0 && !authenticatedAccount()) {
        checkoutStep = 0;
        openAccount('login');
        toast('Entre ou crie uma conta para continuar com a compra.');
    }
    if (!entries.length) {
        checkoutStep = 0;
        // FIX: usar button em vez de <a href> para fechar o drawer ao navegar para o catálogo
        el.innerHTML = '<div class="empty">Sua caixinha ainda está vazia.<br><button class="btn small" id="browse">Escolher sabores</button></div>';
        document.getElementById('browse').onclick = () => {
            closeCart();
            document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
        };
        return;
    }
    const subtotal = cartSubtotal();
    if (checkoutStep === 0) {
        el.innerHTML = `${checkoutProgress()}<div class="cart-items">${entries.map(([id, q]) => { const p = products.find(x => x.id === id); return `<div class="cart-item"><img src="${imageUrl(p.img)}" alt="" onerror="this.style.display='none'"><div><h4>${p.name}</h4><small>${brl(p.price)} · pote/kit</small><div class="quantity"><button data-qty="${id}" data-delta="-1" aria-label="Diminuir">−</button>${q}<button data-qty="${id}" data-delta="1" aria-label="Aumentar">+</button></div></div><button class="remove" data-remove="${id}">Remover</button></div>`; }).join('')}</div><div class="coupon-box"><label for="coupon-code">Cupom de primeira compra</label><div><input id="coupon-code" placeholder="Digite AFETO10" value="${escapeHtml(checkoutData.coupon)}"><button class="btn outline small" id="apply-coupon">Aplicar</button></div><small id="coupon-message">Use AFETO10 para 10% de desconto (demonstração).</small></div><div class="cart-total"><span>Subtotal</span><span>${brl(subtotal)}</span></div>${checkoutData.coupon === 'AFETO10' ? `<div class="summary-line"><span>Cupom AFETO10</span><span>− ${brl(couponDiscount())}</span></div>` : ''}<div class="notice">Checkout demonstrativo. Seus dados ficam apenas neste navegador; nenhum pagamento será cobrado.</div><button class="btn full" id="start-checkout">Continuar para entrega · ${brl(subtotal - couponDiscount())}</button><p class="checkout-login-note">É necessário entrar ou criar uma conta para continuar.</p>`;
        document.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => { const id = b.dataset.qty; cart[id] = (cart[id] || 0) + Number(b.dataset.delta); if (cart[id] <= 0) delete cart[id]; saveCart(); });
        document.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { delete cart[b.dataset.remove]; saveCart(); });
        document.getElementById('apply-coupon').onclick = () => { const code = document.getElementById('coupon-code').value.trim().toUpperCase(); checkoutData.coupon = code === 'AFETO10' ? code : ''; if (checkoutData.coupon) track('coupon_applied', { coupon: checkoutData.coupon }); renderCart(); document.getElementById('coupon-message').textContent = checkoutData.coupon ? 'Cupom aplicado: 10% de desconto.' : 'Cupom inválido. Confira o código e tente novamente.'; };
        document.getElementById('start-checkout').onclick = () => { if (!requireAccountForCheckout()) return; checkoutData.name = currentAccount.name || ''; checkoutData.email = currentAccount.email || ''; Object.assign(checkoutData, currentAccount.address || {}); checkoutStep = 1; renderCart(); track('begin_checkout', { currency: 'BRL', value: subtotal, items: entries.map(([id, q]) => ({ item_id: id, quantity: q })) }); };
    } else if (checkoutStep === 1) {
        el.innerHTML = `${checkoutProgress()}<form id="shipping-form" class="checkout-form"><h3>Endereço de entrega</h3><p class="muted-text">Olá, ${escapeHtml(currentAccount.name)}. Confira o endereço da sua conta.</p><label>Nome completo<input name="name" autocomplete="name" required readonly value="${escapeHtml(currentAccount.name)}"></label><label>E-mail<input name="email" type="email" autocomplete="email" required readonly value="${escapeHtml(currentAccount.email)}"></label><div class="form-row"><label>CEP<input name="cep" inputmode="numeric" maxlength="9" placeholder="69900-000" required value="${escapeHtml(checkoutData.cep)}"></label><button class="btn outline small align-end" type="button" id="lookup-cep">Consultar CEP</button></div><label>Rua / Avenida<input name="street" autocomplete="street-address" required value="${escapeHtml(checkoutData.street)}"></label><div class="form-row"><label>Número<input name="number" required value="${escapeHtml(checkoutData.number)}"></label><label>Complemento<input name="complement" value="${escapeHtml(checkoutData.complement)}"></label></div><div class="form-row"><label>Cidade<input name="city" required value="${escapeHtml(checkoutData.city)}"></label><label>UF<input name="state" maxlength="2" required value="${escapeHtml(checkoutData.state)}"></label></div><p class="shipping-result" id="shipping-quote">${checkoutData.cep.replace(/\D/g, '').length === 8 ? 'Frete calculado para o CEP informado.' : 'Informe o CEP para consultar as opções de entrega.'}</p><fieldset class="shipping-options"><legend>Escolha a entrega</legend><label><input type="radio" name="shipping" value="standard" ${checkoutData.shipping === 'standard' ? 'checked' : ''}> Padrão · R$ 12,00 · até 2 dias úteis${cartSubtotal() >= 180 ? ' · grátis' : ''}</label><label><input type="radio" name="shipping" value="express" ${checkoutData.shipping === 'express' ? 'checked' : ''}> Expressa · R$ 20,00 · 1 dia útil</label></fieldset><div class="step-actions"><button class="btn outline" type="button" id="back-cart">Voltar ao carrinho</button><button class="btn" type="submit">Escolher pagamento</button></div></form>`;
        document.getElementById('lookup-cep').onclick = () => { const input = document.querySelector('[name="cep"]'), digits = input.value.replace(/\D/g, ''); document.getElementById('shipping-quote').textContent = digits.length === 8 ? 'Entrega para ' + digits.slice(0, 5) + '-' + digits.slice(5) + ': padrão R$ 12,00 (até 2 dias úteis) ou expressa R$ 20,00 (1 dia útil). Acima de R$ 180, frete padrão grátis.' : 'Digite um CEP válido com 8 números.'; if (digits.length === 8) { checkoutData.cep = digits; track('calculate_shipping', { shipping_tier: 'standard_and_express' }); } };
        document.getElementById('back-cart').onclick = () => { checkoutStep = 0; renderCart(); };
        document.getElementById('shipping-form').onsubmit = e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.target)); if (data.cep.replace(/\D/g, '').length !== 8) { toast('Informe um CEP válido para continuar.'); return; } checkoutData = { ...checkoutData, ...data, cep: data.cep.replace(/\D/g, '') }; track('add_shipping_info', { shipping_tier: checkoutData.shipping }); checkoutStep = 2; renderCart(); };
    } else if (checkoutStep === 2) {
        el.innerHTML = `${checkoutProgress()}<form id="payment-form" class="checkout-form"><h3>Forma de pagamento</h3><label class="payment-option"><input type="radio" name="payment" value="pix" ${checkoutData.payment === 'pix' ? 'checked' : ''}><span><b>Pix</b><small>Simulação · 5% de desconto</small></span></label><label class="payment-option"><input type="radio" name="payment" value="card" ${checkoutData.payment === 'card' ? 'checked' : ''}><span><b>Cartão de crédito</b><small>Simulação em ambiente de teste · sem informar número do cartão</small></span></label><label class="payment-option"><input type="radio" name="payment" value="wallet" ${checkoutData.payment === 'wallet' ? 'checked' : ''}><span><b>Carteira digital</b><small>Simulação · nenhuma carteira será acessada</small></span></label><div class="notice">Não informe número de cartão, senha bancária ou chave Pix. Esta demonstração não se conecta a um intermediador.</div><div class="step-actions"><button class="btn outline" type="button" id="back-shipping">Voltar</button><button class="btn" type="submit">Revisar pedido</button></div></form>`;
        document.getElementById('back-shipping').onclick = () => { checkoutStep = 1; renderCart(); };
        document.getElementById('payment-form').onsubmit = e => { e.preventDefault(); checkoutData.payment = new FormData(e.target).get('payment'); track('add_payment_info', { payment_type: checkoutData.payment }); checkoutStep = 3; renderCart(); };
    } else {
        const delivery = checkoutData.shipping === 'express' ? 'Expressa · até 1 dia útil' : 'Padrão · até 2 dias úteis';
        const paymentLabel = { pix: 'Pix (simulado)', card: 'Cartão (sandbox demonstrativo)', wallet: 'Carteira digital (simulada)' }[checkoutData.payment];
        el.innerHTML = `${checkoutProgress()}<div class="review-card"><h3>Revise seu pedido</h3><p><b>Entrega para</b><br>${escapeHtml(checkoutData.name)} · ${escapeHtml(checkoutData.email)}<br>${escapeHtml(checkoutData.street)}, ${escapeHtml(checkoutData.number)} ${escapeHtml(checkoutData.complement)}<br>${escapeHtml(checkoutData.city)} – ${escapeHtml(checkoutData.state)}, CEP ${escapeHtml(checkoutData.cep)}</p><p><b>Frete:</b> ${delivery} · ${shippingCost() === 0 ? 'grátis' : brl(shippingCost())}<br><b>Pagamento:</b> ${paymentLabel}</p>${entries.map(([id, q]) => { const p = products.find(x => x.id === id); return `<div class="summary-line"><span>${q} × ${p.name}</span><span>${brl(p.price * q)}</span></div>`; }).join('')}<div class="summary-line"><span>Subtotal</span><span>${brl(subtotal)}</span></div>${checkoutData.coupon === 'AFETO10' ? `<div class="summary-line"><span>Cupom AFETO10</span><span>− ${brl(couponDiscount())}</span></div>` : ''}${checkoutData.payment === 'pix' ? `<div class="summary-line"><span>Desconto Pix (5%)</span><span>− ${brl(paymentDiscount())}</span></div>` : ''}<div class="summary-line"><span>Frete</span><span>${shippingCost() === 0 ? 'Grátis' : brl(shippingCost())}</span></div><div class="cart-total"><span>Total demonstrativo</span><span>${brl(orderTotal())}</span></div></div><label class="terms-check"><input type="checkbox" id="accept-order-terms"> Confirmo os dados e entendo que este pedido é apenas uma simulação.</label><div class="step-actions"><button class="btn outline" id="back-payment">Voltar</button><button class="btn" id="confirm-order">Confirmar pedido</button></div>`;
        document.getElementById('back-payment').onclick = () => { checkoutStep = 2; renderCart(); };
        document.getElementById('confirm-order').onclick = () => { if (!document.getElementById('accept-order-terms').checked) { toast('Confirme que revisou os dados para continuar.'); return; } completeOrder(entries); };
    }
}

function completeOrder(entries) {
    if (!requireAccountForCheckout()) return;
    if (!entries.length || !cartEntries().length) {
        checkoutStep = 0;
        renderCart();
        toast('Sua caixinha está vazia.');
        return;
    }
    const order = {
        id: 'DA-' + Date.now().toString(36).toUpperCase(),
        date: new Date().toISOString(),
        items: entries.map(([id, q]) => ({ id, name: products.find(p => p.id === id).name, quantity: q, unitPrice: products.find(p => p.id === id).price })),
        subtotal: cartSubtotal(),
        coupon: checkoutData.coupon,
        shipping: shippingCost(),
        payment: checkoutData.payment,
        total: orderTotal(),
        status: 'Recebido (simulado)',
        customer: checkoutData.name,
        customerEmail: checkoutData.email
    };
    const orders = JSON.parse(localStorage.getItem('doceafeto-orders') || '[]');
    orders.unshift(order);
    localStorage.setItem('doceafeto-orders', JSON.stringify(orders));
    currentAccount.address = { cep: checkoutData.cep, street: checkoutData.street, number: checkoutData.number, complement: checkoutData.complement, city: checkoutData.city, state: checkoutData.state };
    const users = JSON.parse(localStorage.getItem('doceafeto-users') || '{}');
    const user = users[currentAccount.email.toLowerCase()];
    user.address = currentAccount.address;
    localStorage.setItem('doceafeto-users', JSON.stringify(users));
    localStorage.setItem('doceafeto-session', JSON.stringify(currentAccount));
    track('purchase', { transaction_id: order.id, currency: 'BRL', value: order.total, items: order.items.map(i => ({ item_id: i.id, item_name: i.name, quantity: i.quantity, price: i.unitPrice })) });
    cart = {};
    // Atualiza contagem sem chamar renderCart (o drawer vai ser re-renderizado logo abaixo)
    localStorage.setItem('doceafeto-compotas-cart', JSON.stringify(cart));
    updateCartCount();
    checkoutStep = 0;
    document.getElementById('cart-content').innerHTML = `<div class="order-success"><div class="success-mark">✓</div><span class="eyebrow">Pedido recebido</span><h3>Obrigada, ${escapeHtml(order.customer)}!</h3><p>Pedido <b>${order.id}</b></p><p>Você escolheu ${order.payment === 'pix' ? 'Pix (simulado)' : order.payment === 'card' ? 'cartão (simulado)' : 'carteira digital (simulada)'}. Nenhum pagamento ou envio real foi feito.</p><div class="summary-line"><span>Total da simulação</span><b>${brl(order.total)}</b></div><p>Na loja real, esta etapa enviaria a confirmação por e-mail e encaminharia o pagamento para o provedor seguro.</p><div class="step-actions"><button class="btn outline" id="track-order-btn">Acompanhar pedido</button><button class="btn full" id="done-order">Concluir</button></div></div>`;
    document.getElementById('done-order').onclick = () => closeCart();
    document.getElementById('track-order-btn').onclick = () => { closeCart(); openOrderTracker(order.id); };
    toast('Pedido demonstrativo registrado.');
}

// ── Acompanhamento de pedido ──────────────────────────────────────────────────

function openOrderTracker(highlightId = null) {
    const box = document.getElementById('modal-content');
    const orders = JSON.parse(localStorage.getItem('doceafeto-orders') || '[]');

    const payLabel = { pix: 'Pix (simulado)', card: 'Cartão (simulado)', wallet: 'Carteira digital (simulada)' };
    const statusSteps = ['Recebido (simulado)', 'Em preparo', 'Saiu para entrega', 'Entregue'];

    function orderCard(o) {
        const stepIndex = statusSteps.indexOf(o.status);
        const currentStep = stepIndex >= 0 ? stepIndex : 0;
        const isHighlighted = o.id === highlightId;
        const dateStr = new Date(o.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

        const timeline = statusSteps.map((s, i) => `
            <div class="track-step ${i <= currentStep ? 'done' : ''}">
                <div class="track-dot"></div>
                <span>${s}</span>
            </div>`).join('');

        const itemsList = o.items.map(i => `<div class="summary-line"><span>${i.quantity} × ${escapeHtml(i.name)}</span><span>${brl(i.unitPrice * i.quantity)}</span></div>`).join('');

        return `
        <div class="track-card ${isHighlighted ? 'track-card--new' : ''}">
            <div class="track-card-head">
                <div>
                    <b class="track-id">${escapeHtml(o.id)}</b>
                    ${isHighlighted ? '<span class="track-badge">Novo</span>' : ''}
                    <small class="track-date">${dateStr}</small>
                </div>
                <b class="track-total">${brl(o.total)}</b>
            </div>
            <div class="track-timeline">${timeline}</div>
            <details class="track-details">
                <summary>Ver itens e detalhes</summary>
                <div class="track-items">
                    ${itemsList}
                    <div class="summary-line"><span>Frete</span><span>${o.shipping === 0 ? 'Grátis' : brl(o.shipping)}</span></div>
                    <div class="summary-line"><span>Pagamento</span><span>${payLabel[o.payment] || o.payment}</span></div>
                    ${o.coupon ? `<div class="summary-line"><span>Cupom ${escapeHtml(o.coupon)}</span><span>aplicado</span></div>` : ''}
                    <div class="cart-total"><span>Total</span><span>${brl(o.total)}</span></div>
                </div>
            </details>
        </div>`;
    }

    box.innerHTML = `
        <span class="eyebrow">Demonstração local · dados neste navegador</span>
        <h2>Acompanhar pedido</h2>
        ${orders.length
            ? `<p class="muted-text">Seus pedidos feitos neste navegador. Em uma loja real, o status seria atualizado em tempo real.</p>
               <div id="orders-list">${orders.map(o => orderCard(o)).join('')}</div>`
            : `<div class="empty">Nenhum pedido encontrado neste navegador.<br>
               <button class="btn small" id="go-shop-track">Ver cardápio</button></div>`
        }
        <div class="step-actions" style="margin-top:20px">
            <button class="btn" id="close-tracker">Fechar</button>
        </div>`;

    document.getElementById('close-tracker').onclick = () => document.getElementById('modal').classList.remove('open');
    const goShop = document.getElementById('go-shop-track');
    if (goShop) goShop.onclick = () => { document.getElementById('modal').classList.remove('open'); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' }); };

    document.getElementById('modal').classList.add('open');
}

// ── Conta ─────────────────────────────────────────────────────────────────────

function openAccount(mode = 'login') { renderAccount(mode); document.getElementById('modal').classList.add('open'); }

async function passwordDigest(password, saltHex) {
    const salt = saltHex ? Uint8Array.from(saltHex.match(/.{2}/g), b => parseInt(b, 16)) : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
    const hex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex(salt)}:${hex(new Uint8Array(bits))}`;
}

function renderAccount(mode = 'login') {
    const box = document.getElementById('modal-content');
    if (currentAccount) {
        const orders = JSON.parse(localStorage.getItem('doceafeto-orders') || '[]').filter(o => o.customerEmail === currentAccount.email);
        box.innerHTML = `<span class="eyebrow">Área do cliente · demonstração local</span><h2>Olá, ${escapeHtml(currentAccount.name)}</h2><p>${escapeHtml(currentAccount.email)}</p>
        <div class="account-panel"><h3>Seus pedidos</h3>
        ${orders.length
            ? `${orders.slice(0, 3).map(o => `<div class="order-row"><div><b>${o.id}</b><small>${new Date(o.date).toLocaleDateString('pt-BR')} · ${o.status}</small></div><b>${brl(o.total)}</b></div>`).join('')}
               <button class="btn outline small" id="view-all-orders" style="margin-top:10px">Ver todos e acompanhar</button>`
            : '<p class="muted-text">Seus pedidos feitos neste navegador aparecerão aqui.</p>'
        }</div>
        <div class="account-panel"><h3>Endereço salvo</h3><p>${currentAccount.address?.street ? `${escapeHtml(currentAccount.address.street)}, ${escapeHtml(currentAccount.address.number)} · CEP ${escapeHtml(currentAccount.address.cep)}` : 'O endereço será salvo após seu primeiro checkout.'}</p></div>
        <div class="account-panel"><h3>Dados da conta</h3>
        <form id="profile-form" class="checkout-form"><label>Nome<input name="name" required value="${escapeHtml(currentAccount.name)}"></label><label>E-mail<input name="email" type="email" required value="${escapeHtml(currentAccount.email)}"></label><button class="btn outline small">Salvar dados</button><p id="profile-message" class="form-error"></p></form>
        <form id="password-form" class="checkout-form"><h4>Alterar senha</h4><input name="current" type="password" placeholder="Senha atual" required><input name="next" type="password" placeholder="Nova senha (8+ caracteres)" minlength="8" required><input name="confirm" type="password" placeholder="Confirme a nova senha" required><button class="btn outline small">Atualizar senha</button><p id="password-message" class="form-error"></p></form>
        </div>
        <div class="step-actions"><button class="btn outline" id="account-logout">Sair da conta</button><button class="btn" id="account-close">Fechar</button></div>`;

        document.getElementById('account-logout').onclick = () => { localStorage.removeItem('doceafeto-session'); currentAccount = null; renderAccount('login'); };
        document.getElementById('account-close').onclick = () => document.getElementById('modal').classList.remove('open');
        const viewAll = document.getElementById('view-all-orders');
        if (viewAll) viewAll.onclick = () => openOrderTracker();
        document.getElementById('profile-form').onsubmit = e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target)), users = JSON.parse(localStorage.getItem('doceafeto-users') || '{}'), email = data.email.trim().toLowerCase(), oldEmail = currentAccount.email.toLowerCase(), user = users[oldEmail];
            if (email !== oldEmail && users[email]) { document.getElementById('profile-message').textContent = 'Este e-mail já está em uso.'; return; }
            delete users[oldEmail]; user.name = data.name.trim(); user.email = email; users[email] = user;
            localStorage.setItem('doceafeto-users', JSON.stringify(users));
            if (email !== oldEmail) { const ords = JSON.parse(localStorage.getItem('doceafeto-orders') || '[]'); ords.forEach(order => { if (order.customerEmail === oldEmail) order.customerEmail = email; }); localStorage.setItem('doceafeto-orders', JSON.stringify(ords)); }
            currentAccount.name = user.name; currentAccount.email = email;
            localStorage.setItem('doceafeto-session', JSON.stringify(currentAccount));
            renderAccount('profile'); toast('Dados da conta atualizados.');
        };
        document.getElementById('password-form').onsubmit = async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target)), users = JSON.parse(localStorage.getItem('doceafeto-users') || '{}'), user = users[currentAccount.email.toLowerCase()], message = document.getElementById('password-message');
            if (data.next !== data.confirm) { message.textContent = 'As novas senhas não conferem.'; return; }
            if (user.passwordHash !== await passwordDigest(data.current, user.passwordHash.split(':')[0])) { message.textContent = 'A senha atual está incorreta.'; return; }
            user.passwordHash = await passwordDigest(data.next);
            localStorage.setItem('doceafeto-users', JSON.stringify(users));
            message.textContent = 'Senha atualizada neste navegador.'; e.target.reset();
        };
        return;
    }
    box.innerHTML = `<span class="eyebrow">Área do cliente · demonstração local</span><h2>${mode === 'register' ? 'Criar sua conta' : 'Entrar na sua conta'}</h2><p class="muted-text">A conta de demonstração é salva somente neste navegador. Não use uma senha que você utiliza em outros serviços.</p><div class="account-tabs"><button class="${mode === 'login' ? 'active' : ''}" data-account-mode="login">Entrar</button><button class="${mode === 'register' ? 'active' : ''}" data-account-mode="register">Criar conta</button></div><form id="account-form" class="checkout-form">${mode === 'register' ? '<label>Nome completo<input name="name" autocomplete="name" required minlength="2"></label>' : ''}<label>E-mail<input name="email" type="email" autocomplete="email" required></label><label>Senha<input name="password" type="password" autocomplete="${mode === 'register' ? 'new-password' : 'current-password'}" required minlength="8"><small class="muted-text">Mínimo de 8 caracteres.</small></label>${mode === 'register' ? '<label>Confirme a senha<input name="confirm" type="password" required minlength="8"></label>' : ''}<p class="form-error" id="account-error" aria-live="polite"></p><button class="btn full" type="submit">${mode === 'register' ? 'Criar conta' : 'Entrar'}</button></form><p class="demo-security">Demonstração acadêmica: um hash com salt é guardado localmente no navegador. Não há autenticação real nem sincronização entre dispositivos.</p>`;
    box.querySelectorAll('[data-account-mode]').forEach(b => b.onclick = () => renderAccount(b.dataset.accountMode));
    document.getElementById('account-form').onsubmit = async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target)), error = document.getElementById('account-error');
        error.textContent = '';
        if (mode === 'register' && data.password !== data.confirm) { error.textContent = 'As senhas não conferem.'; return; }
        try {
            const users = JSON.parse(localStorage.getItem('doceafeto-users') || '{}'), email = data.email.trim().toLowerCase(), hash = await passwordDigest(data.password);
            if (mode === 'register') {
                if (users[email]) { error.textContent = 'Já existe uma conta demonstrativa com este e-mail.'; return; }
                users[email] = { name: data.name.trim(), email, passwordHash: hash, address: {} };
                localStorage.setItem('doceafeto-users', JSON.stringify(users));
                track('sign_up', { method: 'local_demo' });
            } else {
                if (!users[email] || users[email].passwordHash !== await passwordDigest(data.password, users[email].passwordHash.split(':')[0])) { error.textContent = 'E-mail ou senha incorretos.'; return; }
                track('login', { method: 'local_demo' });
            }
            currentAccount = { name: users[email].name, email: users[email].email, address: users[email].address || {} };
            localStorage.setItem('doceafeto-session', JSON.stringify(currentAccount));
            renderAccount();
        } catch (err) {
            error.textContent = 'Não foi possível acessar o armazenamento seguro do navegador. Abra o site em HTTPS ou localhost.';
        }
    };
}

function toast(message) {
    const t = document.getElementById('toast');
    t.textContent = message;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Eventos globais ───────────────────────────────────────────────────────────

document.querySelectorAll('.filter').forEach(b => b.onclick = () => {
    document.querySelectorAll('.filter').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    activeFilter = b.dataset.filter;
    renderProducts();
    track('view_item_list', { item_list_name: activeFilter });
});

document.getElementById('search').oninput = renderProducts;
document.getElementById('sort').onchange = renderProducts;

document.getElementById('cart-open').onclick = () => {
    renderCart();
    document.getElementById('cart').classList.add('open');
    track('view_cart');
};

document.getElementById('account-open').onclick = () => openAccount(currentAccount ? 'profile' : 'login');
document.getElementById('cart-close').onclick = () => closeCart();
document.getElementById('cart').onclick = e => { if (e.target.id === 'cart') closeCart(); };

// Acompanhar pedido — link na nav
document.getElementById('track-order-open').onclick = () => openOrderTracker();

document.getElementById('newsletter').onsubmit = e => {
    e.preventDefault();
    track('generate_lead', { method: 'newsletter' });
    toast('Cadastro demonstrativo recebido. Obrigado!');
    e.target.reset();
};

const policies = {
    politica: `<h2>Privacidade e cookies</h2><p>Este projeto é uma demonstração acadêmica da marca fictícia Doce Afeto. Os dados de conta, endereço, carrinho e pedidos ficam somente no armazenamento local deste navegador; nada é enviado a um servidor nem usado para cobrança. Não use dados pessoais ou senhas reais.</p><p>Com seu consentimento, o Google Analytics (ID ${GA_ID}) coleta dados de navegação pseudonimizados para estatísticas de uso. Você pode recusar cookies analíticos sem perder as funções essenciais. O site não deve ser usado para inserir dados pessoais reais.</p><p>Em uma operação comercial, a empresa responsável identificaria o controlador, canal de contato, finalidades e bases legais de tratamento, prazos de retenção e direitos do titular, conforme a LGPD.</p>`,
    trocas: `<h2>Entrega, trocas e devoluções</h2><p>Esta loja é uma simulação sem venda real. Em uma operação real, o prazo e o frete seriam confirmados antes da conclusão do pedido, e a política detalharia conservação e transporte de alimentos.</p><p>Para compras realizadas fora do estabelecimento, o consumidor pode exercer o direito de arrependimento em até 7 dias, conforme a legislação aplicável. Entre em contato pelo canal de atendimento para registrar a solicitação.</p>`
};

document.querySelectorAll('[data-modal]').forEach(a => a.onclick = e => {
    e.preventDefault();
    document.getElementById('modal-content').innerHTML = policies[a.dataset.modal];
    document.getElementById('modal').classList.add('open');
});

document.getElementById('modal-close').onclick = () => document.getElementById('modal').classList.remove('open');
document.getElementById('modal').onclick = e => { if (e.target.id === 'modal') e.currentTarget.classList.remove('open'); };

// ── Analytics ─────────────────────────────────────────────────────────────────

function initAnalytics() {
    if (localStorage.getItem('doceafeto-analytics') !== 'accepted') return;
    if (window.analyticsInitialized) return;
    window.analyticsInitialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    // FIX: removido cookie_domain para evitar rejeição em github.io (domínio inválido)
    gtag('config', GA_ID, { anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);
}

const consent = localStorage.getItem('doceafeto-analytics');
if (!consent) document.getElementById('cookie').hidden = false;
document.getElementById('accept-cookies').onclick = () => {
    localStorage.setItem('doceafeto-analytics', 'accepted');
    document.getElementById('cookie').hidden = true;
    initAnalytics();
};
document.getElementById('reject-cookies').onclick = () => {
    localStorage.setItem('doceafeto-analytics', 'rejected');
    document.getElementById('cookie').hidden = true;
};
if (consent === 'accepted') initAnalytics();

// ── Init ──────────────────────────────────────────────────────────────────────
renderProducts();
updateCartCount(); // FIX: apenas atualiza o contador, não renderiza o drawer
