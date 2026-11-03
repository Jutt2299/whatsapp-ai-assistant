document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chatMessages');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const resetChatBtn = document.getElementById('resetChatBtn');
  const travelerList = document.getElementById('travelerList');
  const promptChips = document.querySelectorAll('.chip');
  const langBtns = document.querySelectorAll('.lang-btn');

  let currentLanguageMode = 'auto'; // 'auto', 'en', 'es'

  // Language Switcher Logic
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selected = btn.getAttribute('data-lang');
      currentLanguageMode = selected;

      if (selected === 'es') {
        messageInput.placeholder = "Escribe en Español (ej., 'Búscame vuelos y hotel a Madrid para mi familia...')";
      } else if (selected === 'en') {
        messageInput.placeholder = "Type in English (e.g., 'Find flights and hotel in Madrid for my family...')";
      } else {
        messageInput.placeholder = "Ask in English or Español (e.g., 'Find flights for my family to Madrid...')";
      }
    });
  });

  // Load initial data (Phases 1–5)
  loadTravelers();
  loadDuffelResults('family');
  loadGmailAccounts();
  loadCalendarEvents();
  loadTransactions();
  loadDrive();
  loadFinance();
  loadVendors();

  // Panel Tabs Switcher
  const panelTabs = document.querySelectorAll('.panel-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  panelTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      panelTabs.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      document.getElementById(target)?.classList.add('active');
    });
  });

  // Duffel Search Button
  const runDuffelSearchBtn = document.getElementById('runDuffelSearchBtn');
  const flightPartySelect = document.getElementById('flightParty');

  runDuffelSearchBtn?.addEventListener('click', () => {
    loadDuffelResults(flightPartySelect.value);
  });

  flightPartySelect?.addEventListener('change', () => {
    loadDuffelResults(flightPartySelect.value);
  });

  // Prompt chips
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text');
      if (text) {
        messageInput.value = text;
        sendMessage();
      }
    });
  });

  // Send listeners
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Clear chat
  resetChatBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/chat/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'web-simulator-user' })
      });

      chatMessages.innerHTML = `
        <div class="bubble assistant">
          <div class="bubble-sender">Aura Travel Concierge</div>
          <div class="bubble-text">Conversation history cleared. How can I assist your family travel plans today, Ahmed?</div>
          <div class="bubble-meta">
            <span class="bubble-time">${formatTime()}</span>
            <span class="check-marks">✓✓</span>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Reset error:', err);
    }
  });

  async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    // Append User Bubble
    appendMessage({
      sender: 'user',
      text,
      time: formatTime()
    });

    messageInput.value = '';
    messageInput.disabled = true;
    sendBtn.disabled = true;

    // Typing indicator
    const typingIndicator = appendTypingIndicator();

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'web-simulator-user',
          message: text,
          languageOverride: currentLanguageMode === 'auto' ? null : currentLanguageMode
        })
      });

      const data = await res.json();
      typingIndicator.remove();

      if (data.success) {
        appendMessage({
          sender: 'assistant',
          text: data.reply,
          language: data.language,
          time: formatTime()
        });
      } else {
        appendMessage({
          sender: 'assistant',
          text: 'Error: ' + (data.error || 'Failed to process travel request.'),
          time: formatTime()
        });
      }
    } catch (err) {
      typingIndicator.remove();
      appendMessage({
        sender: 'assistant',
        text: 'Network error connecting to the AI Concierge server.',
        time: formatTime()
      });
    } finally {
      messageInput.disabled = false;
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }

  function appendMessage({ sender, text, language, time }) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${sender}`;

    if (sender === 'assistant') {
      const langLabel = language === 'es' ? '🇪🇸 Español' : '🇬🇧 English';
      bubble.innerHTML = `
        <div class="bubble-sender" style="display: flex; justify-content: space-between;">
          <span>Aura Travel Concierge</span>
          <span style="font-weight: 500; font-size: 0.65rem; color: #64748B;">${langLabel}</span>
        </div>
        <div class="bubble-text">${formatMarkdown(text)}</div>
        <div class="bubble-meta">
          <span class="bubble-time">${time}</span>
          <span class="check-marks">✓✓</span>
        </div>
      `;
    } else {
      bubble.innerHTML = `
        <div class="bubble-text">${escapeHtml(text)}</div>
        <div class="bubble-meta">
          <span class="bubble-time">${time}</span>
          <span class="check-marks">✓✓</span>
        </div>
      `;
    }

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  function appendTypingIndicator() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble assistant';
    bubble.innerHTML = `
      <div class="bubble-sender">Aura Travel Concierge</div>
      <div class="bubble-text" style="color: #64748B; font-style: italic;">
        Checking flight availability & applying family preferences...
      </div>
    `;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  async function loadTravelers() {
    try {
      const res = await fetch('/api/preferences');
      const data = await res.json();
      if (data.success && data.preferences) {
        const travelers = data.preferences.travelers || [];
        travelerList.innerHTML = travelers.map(t => {
          const initials = t.fullName.split(' ').map(n => n[0]).join('').substring(0, 2);
          const isPrimary = t.isPrimary;
          const roleClass = isPrimary ? 'member-role primary' : 'member-role';
          const roleText = isPrimary ? 'Primary Account' : t.relationship;

          return `
            <div class="member-card">
              <div class="member-card-top">
                <div class="member-name-wrap">
                  <div class="member-avatar">${initials}</div>
                  <div>
                    <div class="member-name">${t.fullName}</div>
                    <span style="font-size: 0.72rem; color: #64748B;">${t.type} • DOB: ${t.dateOfBirth || 'N/A'}</span>
                  </div>
                </div>
                <span class="${roleClass}">${roleText}</span>
              </div>

              <div class="member-grid">
                <div class="member-grid-item">
                  <label>Seating Preference</label>
                  <span>${t.seatPreference}</span>
                </div>
                <div class="member-grid-item">
                  <label>Meal Code</label>
                  <span>${t.mealPreference}</span>
                </div>
                ${t.loyaltyPrograms && t.loyaltyPrograms.length > 0 ? `
                  <div class="member-grid-item full">
                    <label>Loyalty Tier</label>
                    <div>
                      ${t.loyaltyPrograms.map(l => `<span class="loyalty-tag">${l.airline} (${l.tier})</span>`).join(' ')}
                    </div>
                  </div>
                ` : ''}
                <div class="member-grid-item full">
                  <label>Identity / Passport Security</label>
                  <span style="color: #0F766E;">● ${t.passportEncrypted?.maskedNumber || 'Encrypted on Record'}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Could not load travelers:', err);
    }
  }

  async function loadDuffelResults(party = 'family') {
    const duffelResults = document.getElementById('duffelResults');
    if (!duffelResults) return;

    duffelResults.innerHTML = `
      <div class="loading-state">
        Querying Duffel API for MTY ➔ MAD and Salamanca hotels...
      </div>
    `;

    try {
      const [flightRes, hotelRes] = await Promise.all([
        fetch('/api/travel/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: 'MTY', destination: 'MAD', party })
        }),
        fetch('/api/travel/hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: 'Madrid', neighborhood: 'Salamanca', party })
        })
      ]);

      const flightData = await flightRes.json();
      const hotelData = await hotelRes.json();

      let html = '';

      // Flight section
      html += `<div style="font-size:0.75rem; font-weight:700; color:#0F172A; text-transform:uppercase; margin-top:4px;">✈️ Curated Flights (Duffel API)</div>`;

      if (flightData.success && flightData.data?.top3Offers) {
        flightData.data.top3Offers.forEach(o => {
          const isTop = o.rank === 1;
          html += `
            <div class="offer-card ${isTop ? 'top-pick' : ''}">
              <div class="offer-header">
                <span class="airline-tag">${o.rank}. ${o.airline.name}</span>
                <span class="offer-price">$${o.pricing.totalAmount} ${o.pricing.currency}</span>
              </div>
              <div class="offer-route">${o.route} • ${o.duration} (${o.stops} stop)</div>
              <div class="offer-meta-chips">
                <span class="meta-chip highlight">${o.cabinClass}</span>
                <span class="meta-chip">${o.departureTime} departure</span>
                <span class="meta-chip">${o.fareConditions.baggage}</span>
              </div>
              <div class="offer-reason">💡 ${o.matchReason}</div>
            </div>
          `;
        });
      }

      // Hotel section
      html += `<div style="font-size:0.75rem; font-weight:700; color:#0F172A; text-transform:uppercase; margin-top:10px;">🏨 Salamanca Accommodations (Duffel Stays)</div>`;

      if (hotelData.success && hotelData.data?.top3Hotels) {
        hotelData.data.top3Hotels.forEach(h => {
          const isTop = h.rank === 1;
          html += `
            <div class="offer-card ${isTop ? 'top-pick' : ''}">
              <div class="offer-header">
                <span class="airline-tag">${h.rank}. ${h.name}</span>
                <span class="offer-price">$${h.pricing.totalStayPrice} ${h.pricing.currency}</span>
              </div>
              <div class="offer-route">${h.rating} • ${h.roomType}</div>
              <div class="offer-meta-chips">
                <span class="meta-chip highlight">${h.cancellationPolicy}</span>
                <span class="meta-chip">4 Nights Stay</span>
              </div>
              <div class="offer-reason">💡 ${h.matchReason}</div>
            </div>
          `;
        });
      }

      duffelResults.innerHTML = html;
    } catch (err) {
      duffelResults.innerHTML = `<div class="loading-state">Error querying Duffel: ${err.message}</div>`;
    }
  }

  // ==========================================
  // PHASE 4: TRANSACTIONS & BOOKING APPROVALS
  // ==========================================

  let currentPendingTxId = null;

  async function loadTransactions() {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (!data.success) return;

      // Render Payment Vaults
      const vaultsList = document.getElementById('paymentVaultsList');
      if (vaultsList && data.paymentMethods) {
        vaultsList.innerHTML = data.paymentMethods.map(pm => `
          <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.8rem; font-weight:700; color:#0F172A;">${pm.brand} ${pm.type}</div>
              <div style="font-size:0.72rem; color:#64748B; margin-top:2px;">${pm.maskedCard} • Exp ${pm.expiry}</div>
              <div style="font-size:0.68rem; color:#0891B2; margin-top:2px;">${pm.provider}</div>
            </div>
            <div style="text-align:right;">
              ${pm.isDefault ? '<span style="background:#ECFDF5; color:#065F46; border:1px solid #BBF7D0; border-radius:20px; padding:3px 10px; font-size:0.68rem; font-weight:700;">Default</span>' : '<span style="background:#F1F5F9; color:#64748B; border:1px solid #E2E8F0; border-radius:20px; padding:3px 10px; font-size:0.68rem;">Backup</span>'}
              <div style="font-size:0.68rem; color:#475569; margin-top:4px;">🔒 Tokenized Vault</div>
            </div>
          </div>
        `).join('');
      }

      // Render Transaction History
      const histList = document.getElementById('transactionHistoryList');
      if (histList && data.transactions) {
        histList.innerHTML = data.transactions.map(tx => {
          const statusColor = tx.status === 'PAID_AND_BOOKED'
            ? { bg: '#ECFDF5', color: '#065F46', border: '#BBF7D0' }
            : tx.status === 'APPROVED'
              ? { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' }
              : { bg: '#FFF7ED', color: '#92400E', border: '#FED7AA' };
          const statusIcon = tx.status === 'PAID_AND_BOOKED' ? '✅' : tx.status === 'APPROVED' ? '🔄' : '⏳';

          return `
            <div style="background:#FFFFFF; border:1.5px solid #E2E8F0; border-radius:12px; padding:13px 14px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div>
                  <div style="font-size:0.8rem; font-weight:700; color:#0F172A;">${tx.id}</div>
                  <div style="font-size:0.7rem; color:#64748B; margin-top:1px;">${tx.travelParty}</div>
                </div>
                <span style="background:${statusColor.bg}; color:${statusColor.color}; border:1px solid ${statusColor.border}; border-radius:20px; padding:3px 10px; font-size:0.68rem; font-weight:700; white-space:nowrap;">
                  ${statusIcon} ${tx.status.replace(/_/g,' ')}
                </span>
              </div>
              <div style="font-size:0.74rem; color:#374151; line-height:1.7;">
                ✈️ ${tx.flight.airline} • ${tx.flight.route}<br>
                🏨 ${tx.hotel.name} (${tx.hotel.roomType})<br>
                💳 $${tx.totalAmount.toLocaleString()} USD • ${tx.paymentMethod.maskedCard}
              </div>
              ${tx.status === 'PAID_AND_BOOKED' && tx.paymentReceipt ? `
                <div style="margin-top:8px; background:#ECFDF5; border:1px solid #BBF7D0; border-radius:8px; padding:8px 10px; font-size:0.7rem; color:#065F46;">
                  <strong>🧧 Receipt:</strong> ${tx.paymentReceipt.receiptId}<br>
                  Auth Code: ${tx.paymentReceipt.authorizationCode} • ${tx.paymentReceipt.pciStatus}
                </div>
              ` : ''}
              ${tx.status === 'PENDING_APPROVAL' ? `
                <button class="duffel-search-btn quick-approve-btn" data-txid="${tx.id}" style="margin-top:8px; padding:7px; font-size:0.74rem; background:linear-gradient(135deg,#16A34A,#15803D); width:100%;">
                  ✅ Approve This Booking
                </button>
              ` : ''}
            </div>
          `;
        }).join('');

        // Bind inline approve buttons
        histList.querySelectorAll('.quick-approve-btn').forEach(btn => {
          btn.addEventListener('click', () => approveTransaction(btn.getAttribute('data-txid')));
        });
      }

      // Check for pending approval to show banner
      const pending = data.transactions.find(t => t.status === 'PENDING_APPROVAL');
      const banner = document.getElementById('pendingApprovalBanner');
      if (pending && banner) {
        currentPendingTxId = pending.id;
        document.getElementById('pendingTxId').textContent = `Order: ${pending.id} • Token: ${pending.approvalDetails.approvalToken}`;
        document.getElementById('pendingTxSummary').innerHTML =
          `✈️ <strong>${pending.flight.airline}</strong> ${pending.flight.route} (${pending.flight.cabin})<br>` +
          `🏨 ${pending.hotel.name} • ${pending.hotel.roomType}<br>` +
          `💳 Total: <strong>$${pending.totalAmount.toLocaleString()} USD</strong> • via ${pending.paymentMethod.provider} (${pending.paymentMethod.maskedCard})<br>` +
          `🔒 ${pending.safetyGuarantee}`;
        banner.style.display = 'block';
      } else if (banner) {
        banner.style.display = 'none';
      }

    } catch (err) {
      console.warn('Could not load transactions:', err);
    }
  }

  async function approveTransaction(txId) {
    const btn = document.getElementById('approveTxBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Processing Secure Payment...'; }

    try {
      const res = await fetch('/api/transactions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: txId, channel: 'Web Dashboard', approvedBy: 'Ahmed Zainul' })
      });
      const data = await res.json();

      if (data.success) {
        // Reload transactions to reflect new status
        await loadTransactions();
        await loadCalendarEvents();

        // Notify in chat
        appendMessage({
          sender: 'assistant',
          text: `✅ *Booking Approved & Confirmed!*\n\n` +
                `Order *${data.transaction.id}* has been explicitly authorized and executed via *${data.transaction.paymentMethod.provider}* (${data.transaction.paymentMethod.maskedCard}).\n\n` +
                `✈️ ${data.transaction.flight.airline} ${data.transaction.flight.route} — PNR: *${data.transaction.flight.pnr}*\n` +
                `🏨 ${data.transaction.hotel.name} — Ref: *${data.transaction.hotel.bookingRef}*\n\n` +
                `Receipt: *${data.transaction.paymentReceipt?.receiptId}* | Auth: *${data.transaction.paymentReceipt?.authorizationCode}*\n\n` +
                `🗓️ Flight & Hotel synced to your Google Calendar. 📧 Confirmation email draft prepared.`,
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) {
      console.error('Approval error:', err);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '✅ I Explicitly APPROVE & Authorize Payment'; }
    }
  }

  // Approve button in pending banner
  document.getElementById('approveTxBtn')?.addEventListener('click', () => {
    if (currentPendingTxId) approveTransaction(currentPendingTxId);
  });

  // Decline button
  document.getElementById('declineTxBtn')?.addEventListener('click', () => {
    const banner = document.getElementById('pendingApprovalBanner');
    if (banner) banner.style.display = 'none';
    appendMessage({
      sender: 'assistant',
      text: `❌ Booking request declined. No charges have been made. Your Elevate and Revolut vaults are untouched. Let me know if you\'d like to modify the itinerary or choose a different option.`,
      language: currentLanguageMode === 'es' ? 'es' : 'en',
      time: formatTime()
    });
  });

  // ==========================================
  // PHASE 3: GMAIL & CALENDAR INTEGRATIONS
  // ==========================================

  let selectedAccountId = 'all';

  async function loadGmailAccounts() {
    const row = document.getElementById('accountSelectorRow');
    if (!row) return;

    try {
      const res = await fetch('/api/automation/accounts');
      const data = await res.json();
      if (data.success && data.accounts) {
        let html = `
          <button class="account-pill active" data-acc="all">
            <span class="account-dot" style="background:#0F172A;"></span>
            All 3 Inboxes
          </button>
        `;

        data.accounts.forEach(acc => {
          html += `
            <button class="account-pill" data-acc="${acc.id}">
              <span class="account-dot" style="background:${acc.color};"></span>
              ${acc.label.split(' ')[0]} (${acc.email.split('@')[0]})
            </button>
          `;
        });

        row.innerHTML = html;

        // Bind clicks
        row.querySelectorAll('.account-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            row.querySelectorAll('.account-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAccountId = btn.getAttribute('data-acc');
            loadGmailInbox(selectedAccountId);
          });
        });

        // Load all inbox initially
        loadGmailInbox('all');
      }
    } catch (err) {
      console.warn('Could not load Gmail accounts:', err);
    }
  }

  async function loadGmailInbox(accountId = 'all') {
    const list = document.getElementById('gmailInboxList');
    if (!list) return;

    list.innerHTML = `<div class="loading-state">Scanning authenticated emails...</div>`;

    try {
      const url = accountId === 'all' 
        ? '/api/automation/emails' 
        : `/api/automation/emails?accountId=${encodeURIComponent(accountId)}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.emails) {
        if (data.emails.length === 0) {
          list.innerHTML = `<div class="loading-state">No travel emails found in this account.</div>`;
          return;
        }

        list.innerHTML = data.emails.map(m => `
          <div class="email-card">
            <div class="email-header-top">
              <span class="email-sender">${escapeHtml(m.sender)}</span>
              <span class="email-badge" style="background:${m.badgeColor}15; color:${m.badgeColor}; border:1px solid ${m.badgeColor}40;">
                ${m.category}
              </span>
            </div>
            <div class="email-subject">${escapeHtml(m.subject)}</div>
            <div class="email-snippet">${escapeHtml(m.snippet)}</div>
            ${m.parsedData ? `
              <div class="email-parsed-tag">
                🏷️ <strong>Extracted:</strong> ${m.parsedData.pnr ? 'PNR: ' + m.parsedData.pnr : ''} ${m.parsedData.bookingRef ? 'Ref: ' + m.parsedData.bookingRef : ''} ${m.parsedData.route || m.parsedData.flight || ''}
              </div>
            ` : ''}
          </div>
        `).join('');
      }
    } catch (err) {
      list.innerHTML = `<div class="loading-state">Error loading inbox: ${err.message}</div>`;
    }
  }

  // Scan inboxes button
  const scanInboxesBtn = document.getElementById('scanInboxesBtn');
  scanInboxesBtn?.addEventListener('click', async () => {
    scanInboxesBtn.disabled = true;
    scanInboxesBtn.innerHTML = `<span>Scanning 3 inboxes...</span>`;

    try {
      const res = await fetch('/api/automation/emails/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        loadGmailInbox(selectedAccountId);
        appendMessage({
          sender: 'assistant',
          text: `📧 Scanned ${data.report.scannedAccountsCount} Gmail accounts. Discovered ${data.report.totalTravelItemsFound} verified travel confirmations (Iberia PNR IB-48209 & Hotel Wellington guarantee).`,
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      scanInboxesBtn.disabled = false;
      scanInboxesBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        Audit & Scan 3 Inboxes for Travel
      `;
    }
  });

  // Calendar Loader
  async function loadCalendarEvents() {
    const list = document.getElementById('calendarEventsList');
    if (!list) return;

    try {
      const res = await fetch('/api/automation/calendar/events');
      const data = await res.json();

      if (data.success && data.events) {
        list.innerHTML = data.events.map(e => {
          const borderColor = e.type === 'flight' ? '#EF4444' : (e.type === 'hotel' ? '#10B981' : '#3B82F6');
          const timeStr = `${new Date(e.start).toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

          return `
            <div class="calendar-event-card" style="border-left-color: ${borderColor};">
              <div class="calendar-event-title">${escapeHtml(e.title)}</div>
              <div class="calendar-event-time">
                <span>🕒 ${timeStr}</span>
                <span>• 📍 ${escapeHtml(e.location || 'Madrid')}</span>
              </div>
              ${e.description ? `<div class="calendar-event-desc">${escapeHtml(e.description)}</div>` : ''}
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Calendar loading error:', err);
    }
  }

  // Conflict Check Button
  const runConflictCheckBtn = document.getElementById('runConflictCheckBtn');
  runConflictCheckBtn?.addEventListener('click', async () => {
    runConflictCheckBtn.disabled = true;
    runConflictCheckBtn.textContent = 'Scanning...';

    try {
      const res = await fetch('/api/automation/calendar/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: '2026-10-08', endDate: '2026-10-13' })
      });
      const data = await res.json();

      const badge = document.getElementById('conflictStatusBadge');
      const statusText = document.getElementById('conflictStatusText');

      if (data.hasConflicts) {
        badge.style.background = '#FEF3C7';
        badge.style.color = '#92400E';
        badge.textContent = `${data.conflictCount} Event(s) Noted`;
        statusText.innerHTML = `<strong>Schedule Note:</strong> Found ${data.conflictCount} event(s) during Madrid trip (Board Meeting on Oct 10 coincides in Madrid).`;
      } else {
        badge.style.background = '#ECFDF5';
        badge.style.color = '#065F46';
        badge.textContent = 'Schedule Clear';
        statusText.textContent = data.status;
      }
    } catch (err) {
      console.error(err);
    } finally {
      runConflictCheckBtn.disabled = false;
      runConflictCheckBtn.textContent = 'Re-Scan Calendar Conflicts';
    }
  });

  // Sync Itinerary Button
  const syncItineraryBtn = document.getElementById('syncItineraryBtn');
  syncItineraryBtn?.addEventListener('click', async () => {
    syncItineraryBtn.disabled = true;
    syncItineraryBtn.textContent = 'Syncing...';

    try {
      const res = await fetch('/api/automation/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightDetails: {
            airline: 'Iberia',
            route: 'MTY ➔ MAD',
            pnr: 'IB-48209',
            departureTime: '2026-10-08T10:30:00',
            arrivalTime: '2026-10-09T06:15:00',
            seats: '12A, 12B, 12C',
            cabin: 'Premium Economy'
          },
          hotelDetails: {
            name: 'Hotel Wellington & Spa Madrid',
            address: 'C. de Velázquez 8, Salamanca, Madrid',
            checkIn: '2026-10-09T15:00:00',
            checkOut: '2026-10-13T12:00:00',
            roomType: 'Connected Family Suite',
            bookingRef: 'HW-77382'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        await loadCalendarEvents();
        appendMessage({
          sender: 'assistant',
          text: `🗓️ *Itinerary Synchronized!* Scheduled Iberia flight IB-48209 and Hotel Wellington & Spa stay directly into your *Aura Travel Master Itinerary* Google Calendar with 24h/3h automated reminders.`,
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      syncItineraryBtn.disabled = false;
      syncItineraryBtn.textContent = 'Sync Flight & Hotel to Calendar';
    }
  });

  function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function formatMarkdown(str) {
    let formatted = escapeHtml(str);
    // Bold *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    // Italics _text_
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    // Bullet points
    formatted = formatted.replace(/^•\s+(.*)$/gm, '&bull; $1');
    return formatted;
  }

  // ==========================================
  // PHASE 5: GOOGLE DRIVE & INVOICE AUTOMATION
  // ==========================================

  const FOLDER_COLORS = {
    folder_root_zainul: '#1E40AF',
    folder_travel: '#0891B2',
    folder_invoices: '#D97706',
    folder_contracts: '#7C3AED',
    folder_reports: '#059669',
    folder_meeting_notes: '#DC2626'
  };

  async function loadDrive() {
    try {
      const [foldersRes, filesRes, invoicesRes] = await Promise.all([
        fetch('/api/drive/folders'),
        fetch('/api/drive/files'),
        fetch('/api/drive/invoices')
      ]);
      const foldersData = await foldersRes.json();
      const filesData = await filesRes.json();
      const invoicesData = await invoicesRes.json();

      // Render Folder Tree
      const folderList = document.getElementById('driveFolderList');
      if (folderList && foldersData.folders) {
        const subFolders = foldersData.folders.filter(f => f.parentId !== null);
        folderList.innerHTML = subFolders.map(f => {
          const color = FOLDER_COLORS[f.id] || '#64748B';
          const fileCount = (filesData.files || []).filter(file => file.folderId === f.id).length;
          return `
            <div style="border:1.5px solid #E2E8F0; border-left:4px solid ${color}; border-radius:10px; padding:10px 12px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#FAFAFA;" onclick="window.filterDriveByFolder('${f.id}')">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.1rem;">${f.icon}</span>
                <div>
                  <div style="font-size:0.78rem; font-weight:700; color:#0F172A;">${escapeHtml(f.name)}</div>
                  <div style="font-size:0.68rem; color:#64748B;">${escapeHtml(f.description)}</div>
                </div>
              </div>
              <span style="background:${color}15; color:${color}; border:1px solid ${color}40; border-radius:20px; padding:2px 9px; font-size:0.68rem; font-weight:700; white-space:nowrap;">${fileCount} file${fileCount !== 1 ? 's' : ''}</span>
            </div>
          `;
        }).join('');
      }

      renderInvoiceRequests(invoicesData.requests || []);
      renderDriveFiles(filesData.files || [], 'All Drive Files');

    } catch (err) {
      console.warn('Could not load Drive data:', err);
    }
  }

  function renderDriveFiles(files, headerText) {
    const list = document.getElementById('driveFilesList');
    const header = document.getElementById('driveFilesHeader');
    if (header) header.textContent = '\uD83D\uDCC4 ' + (headerText || 'Drive Files') + ' (' + files.length + ')';
    if (!list) return;

    if (files.length === 0) {
      list.innerHTML = '<div class="loading-state">No files found.</div>';
      return;
    }

    list.innerHTML = files.map(f => {
      const color = FOLDER_COLORS[f.folderId] || '#64748B';
      const date = new Date(f.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      const statusLabel = f.status === 'organized' ? '\u2705 Organized' : '\u23F3 Pending';
      const statusBg = f.status === 'organized' ? '#ECFDF5' : '#FFF7ED';
      const statusColor = f.status === 'organized' ? '#065F46' : '#92400E';
      const statusBorder = f.status === 'organized' ? '#BBF7D0' : '#FED7AA';

      let invoiceBadge = '';
      if (f.invoiceData) {
        const invColor = f.invoiceData.status === 'PAID' ? '#065F46' : '#92400E';
        invoiceBadge = `<div style="margin-top:8px; background:#FFF7ED; border:1px solid #FED7AA; border-radius:7px; padding:7px 10px; font-size:0.7rem; color:#92400E;"><strong>\uD83E\uDDE7 Invoice:</strong> ${escapeHtml(f.invoiceData.vendor)} \u2014 ${escapeHtml(f.invoiceData.invoiceNumber)} | $${(f.invoiceData.amount || 0).toLocaleString()} ${f.invoiceData.currency} | <span style="font-weight:700; color:${invColor};">${f.invoiceData.status}</span></div>`;
      }

      const tagsHtml = f.tags.map(tag => `<span style="background:#F1F5F9; color:#475569; border-radius:12px; padding:2px 7px; font-size:0.65rem;">${escapeHtml(tag)}</span>`).join('');
      const sharedHtml = f.sharedWith && f.sharedWith.length > 0 ? `<div style="font-size:0.68rem; color:#0891B2; margin-top:5px;">\uD83D\uDCE4 Shared with: ${f.sharedWith.join(', ')}</div>` : '';

      return `<div style="background:#FFFFFF; border:1.5px solid #E2E8F0; border-left:4px solid ${color}; border-radius:10px; padding:11px 12px;"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:5px;"><div style="flex:1; min-width:0;"><div style="font-size:0.74rem; font-weight:700; color:#0F172A; word-break:break-all;">${escapeHtml(f.name)}</div><div style="font-size:0.68rem; color:#64748B; margin-top:2px;">${f.size} \u2022 ${escapeHtml(f.uploadedBy)} \u2022 ${date}</div></div><span style="background:${statusBg}; color:${statusColor}; border:1px solid ${statusBorder}; border-radius:20px; padding:2px 8px; font-size:0.65rem; font-weight:700; white-space:nowrap; margin-left:8px;">${statusLabel}</span></div><div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:5px;">${tagsHtml}</div>${invoiceBadge}${sharedHtml}</div>`;
    }).join('');
  }

  function renderInvoiceRequests(requests) {
    const list = document.getElementById('invoiceRequestsList');
    if (!list) return;

    if (requests.length === 0) {
      list.innerHTML = '<div class="loading-state">No pending invoice requests.</div>';
      return;
    }

    const statusMap = {
      'REQUESTED':    { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', icon: '\uD83D\uDCE4' },
      'FOLLOWING_UP': { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', icon: '\uD83D\uDD04' },
      'OVERDUE':      { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', icon: '\uD83D\uDEA8' },
      'RECEIVED':     { bg: '#ECFDF5', color: '#065F46', border: '#BBF7D0', icon: '\u2705' }
    };

    list.innerHTML = requests.map(r => {
      const s = statusMap[r.status] || statusMap['REQUESTED'];
      const dueDate = r.dueBy ? new Date(r.dueBy).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBD';
      const followupBtn = r.status !== 'RECEIVED'
        ? `<button class="clean-btn followup-btn" data-reqid="${r.id}" style="margin-top:8px; width:100%; justify-content:center; padding:6px; font-size:0.73rem; border-color:${s.border}; color:${s.color};">\uD83D\uDD04 Follow-up ${r.vendor} (${r.followUps} sent)</button>`
        : '';

      return `<div style="background:#FFFFFF; border:1.5px solid ${s.border}; border-radius:10px; padding:11px 12px;"><div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;"><div><div style="font-size:0.78rem; font-weight:700; color:#0F172A;">${s.icon} ${escapeHtml(r.vendor)}</div><div style="font-size:0.7rem; color:#64748B; margin-top:2px;">${escapeHtml(r.description)}</div></div><span style="background:${s.bg}; color:${s.color}; border:1px solid ${s.border}; border-radius:20px; padding:2px 9px; font-size:0.68rem; font-weight:700; white-space:nowrap; margin-left:8px;">${r.status.replace(/_/g, ' ')}</span></div><div style="font-size:0.7rem; color:#374151;">\uD83D\uDCB3 Expected: <strong>$${(r.expectedAmount || 0).toLocaleString()} ${r.currency}</strong> \u2022 Due: ${dueDate} \u2022 Follow-ups sent: ${r.followUps}</div>${followupBtn}</div>`;
    }).join('');

    list.querySelectorAll('.followup-btn').forEach(btn => {
      btn.addEventListener('click', () => followUpInvoice(btn.getAttribute('data-reqid'), btn));
    });
  }

  window.filterDriveByFolder = async function(folderId) {
    try {
      const res = await fetch('/api/drive/files?folderId=' + folderId);
      const data = await res.json();
      const names = { folder_travel: 'Travel & Itineraries', folder_invoices: 'Invoices & Receipts', folder_contracts: 'Contracts & Agreements', folder_reports: 'Financial Reports', folder_meeting_notes: 'Meeting Notes' };
      renderDriveFiles(data.files || [], names[folderId] || folderId);
    } catch (err) { console.error(err); }
  };

  async function followUpInvoice(requestId, btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    try {
      const res = await fetch('/api/drive/invoices/request/' + requestId + '/followup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadDrive();
        appendMessage({
          sender: 'assistant',
          text: '\uD83D\uDCE7 *Follow-up Email Sent!*\n\n' + data.message + '\n\n*Email Draft:*\nTo: ' + data.emailDraft.to + '\nSubject: ' + data.emailDraft.subject,
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) { console.error(err); }
    finally { if (btn) { btn.disabled = false; btn.textContent = '\uD83D\uDD04 Send Follow-up'; } }
  }

  document.getElementById('driveShowAllFilesBtn')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/drive/files');
      const data = await res.json();
      renderDriveFiles(data.files || [], 'All Drive Files');
    } catch (err) { console.error(err); }
  });

  document.getElementById('driveGenReportBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('driveGenReportBtn');
    btn.disabled = true; btn.textContent = '\u23F3 Generating...';
    try {
      const res = await fetch('/api/drive/invoices/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.success) {
        const r = data.report;
        await loadDrive();
        appendMessage({
          sender: 'assistant',
          text: '\uD83D\uDCCA *Monthly Invoice Summary — ' + r.period + '*\n\n' +
                '\uD83D\uDCCB Total Invoices: ' + r.summary.totalInvoices + '\n' +
                '\u2705 Paid: ' + r.summary.paidCount + ' ($' + r.summary.totalPaidUSD.toLocaleString() + ' USD)\n' +
                '\u23F3 Pending Payment: ' + r.summary.pendingCount + ' ($' + r.summary.totalPendingUSD.toLocaleString() + ' USD)\n' +
                '\uD83D\uDCB0 Grand Total: $' + r.summary.grandTotalUSD.toLocaleString() + ' USD\n\n' +
                '\uD83D\uDCC1 Report auto-saved to *Financial Reports* folder in Google Drive. Ready to forward to your accountant.',
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) { console.error(err); }
    finally { btn.disabled = false; btn.textContent = '\uD83D\uDCCA Generate Monthly Summary'; }
  });

  // ==========================================
  // PHASE 6: FINANCIAL ANALYSIS & EXPENSE MANAGEMENT
  // ==========================================
  async function loadFinance() {
    try {
      // 1. Spending Breakdown
      const bdRes = await fetch('/api/finance/breakdown');
      const bdData = await bdRes.json();
      if (bdData.success) {
        const spentEl = document.getElementById('finTotalSpent');
        const budgetEl = document.getElementById('finBudgetUsed');
        if (spentEl) spentEl.textContent = '$' + (bdData.grandTotalUSD || 0).toLocaleString();
        if (budgetEl) budgetEl.textContent = (bdData.overallBudgetUsedPct || 0) + '%';

        const catList = document.getElementById('finCategoryList');
        if (catList && bdData.breakdown) {
          catList.innerHTML = bdData.breakdown.map(c => {
            const barPct = Math.min(c.budgetUsedPct || 0, 100);
            const statusColor = c.overBudget ? '#DC2626' : (c.budgetUsedPct > 80 ? '#D97706' : '#16A34A');
            const statusBadge = c.overBudget 
              ? '<span style="font-size:0.6rem; color:#DC2626; background:#FEE2E2; padding:2px 6px; border-radius:4px; font-weight:700;">OVER BUDGET</span>' 
              : (c.budgetUsedPct > 80 
                ? '<span style="font-size:0.6rem; color:#D97706; background:#FEF3C7; padding:2px 6px; border-radius:4px; font-weight:700;">NEAR LIMIT</span>' 
                : '<span style="font-size:0.6rem; color:#16A34A; background:#DCFCE7; padding:2px 6px; border-radius:4px; font-weight:700;">ON TRACK</span>');

            return `
              <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:0.75rem; font-weight:600; color:#0F172A;">${c.label}</span>
                  <div style="display:flex; gap:6px; align-items:center;">
                    ${statusBadge}
                    <span style="font-size:0.75rem; font-weight:700; color:#0F172A;">$${c.totalUSD.toLocaleString()}</span>
                  </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#64748B; margin-bottom:4px;">
                  <span>${c.transactionCount} transactions</span>
                  <span>Budget: $${c.budget.toLocaleString()} (${c.budgetUsedPct}%)</span>
                </div>
                <div style="background:#F1F5F9; border-radius:999px; height:6px; overflow:hidden;">
                  <div style="background:${statusColor}; width:${barPct}%; height:100%; border-radius:999px;"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // 2. Anomalies
      const anomRes = await fetch('/api/finance/anomalies');
      const anomData = await anomRes.json();
      if (anomData.success) {
        const countEl = document.getElementById('finAnomalyCount');
        if (countEl) countEl.textContent = anomData.count || 0;
        const anomList = document.getElementById('finAnomalyList');
        if (anomList) {
          if (!anomData.anomalies || anomData.anomalies.length === 0) {
            anomList.innerHTML = '<div style="font-size:0.72rem; color:#64748B; padding:8px; text-align:center;">No anomalies detected. Spending is healthy.</div>';
          } else {
            anomList.innerHTML = anomData.anomalies.map(a => `
              <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:10px 12px; display:flex; gap:10px; align-items:flex-start;">
                <div style="font-size:1.1rem; line-height:1;">⚠️</div>
                <div style="flex:1;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.75rem; font-weight:700; color:#991B1B;">${a.merchant || a.type}</span>
                    <span style="font-size:0.75rem; font-weight:800; color:#DC2626;">${a.amount ? '$' + a.amount.toLocaleString() : 'Alert'}</span>
                  </div>
                  <div style="font-size:0.68rem; color:#B91C1C; margin-top:2px;">${a.reason || a.message || 'Suspicious spending pattern detected'}</div>
                  <div style="font-size:0.62rem; color:#7F1D1D; margin-top:4px;">Date: ${a.date || 'Recent'} • Card: ${a.card || 'Corporate'}</div>
                </div>
              </div>
            `).join('');
          }
        }
      }

      // 3. Transactions
      const txnRes = await fetch('/api/finance/transactions');
      const txnData = await txnRes.json();
      if (txnData.success) {
        const txnCountEl = document.getElementById('finTxnCount');
        if (txnCountEl) txnCountEl.textContent = txnData.count || 0;
        const txnList = document.getElementById('finTxnList');
        if (txnList && txnData.transactions) {
          txnList.innerHTML = txnData.transactions.slice(0, 8).map(t => `
            <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:0.74rem; font-weight:600; color:#0F172A;">${t.merchant}</div>
                <div style="font-size:0.65rem; color:#64748B;">${t.date} • ${t.card} • ${t.category}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.75rem; font-weight:700; color:${t.flag === 'ANOMALY' ? '#DC2626' : '#0F172A'};">
                  ${t.currency === 'USD' ? '$' : t.currency + ' '}${t.amount.toLocaleString()}
                </div>
                <div style="font-size:0.6rem; color:${t.status === 'cleared' ? '#16A34A' : '#D97706'}; text-transform:uppercase; font-weight:600;">
                  ${t.status} ${t.flag === 'ANOMALY' ? '🚨' : ''}
                </div>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.error('Error loading finance data:', err);
    }
  }

  // Generate Financial Report
  document.getElementById('finGenReportBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('finGenReportBtn');
    btn.disabled = true; btn.textContent = '⏳ Generating...';
    try {
      const res = await fetch('/api/finance/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: 'September 2026' })
      });
      const data = await res.json();
      if (data.success) {
        const rep = data.report;
        await loadFinance();
        appendMessage({
          sender: 'assistant',
          text: '📊 *Comprehensive Financial Report — ' + rep.period + '*\n\n' +
                '💵 *Total Expenditure:* $' + rep.summary.totalSpentUSD.toLocaleString() + ' USD\n' +
                '🎯 *Budget Utilization:* ' + rep.summary.overallBudgetUsedPct + '% ($' + rep.summary.totalBudgetUSD.toLocaleString() + ' Budget)\n' +
                '💳 *Total Transactions:* ' + rep.summary.totalTransactions + ' cleared\n' +
                '🚨 *Anomalies Flagged:* ' + rep.summary.anomalyCount + ' items requiring review\n\n' +
                '📂 *Top Expense Categories:*\n' +
                rep.topCategories.map(c => '• ' + c.label + ': $' + c.totalUSD.toLocaleString() + ' (' + c.pctOfTotal + '% of total)').join('\n') + '\n\n' +
                '📁 *Accountant Status:* Generated & synced with Drive Financial Reports folder.',
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = '📋 Generate Monthly Report';
    }
  });

  // Export Spreadsheet
  document.getElementById('finExportBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('finExportBtn');
    btn.disabled = true; btn.textContent = '⏳ Exporting...';
    try {
      const res = await fetch('/api/finance/export');
      const data = await res.json();
      if (data.success) {
        appendMessage({
          sender: 'assistant',
          text: '📥 *Spreadsheet Export Ready*\n\n' +
                '📄 *Filename:* ' + data.filename + '\n' +
                '📊 *Format:* CSV / Spreadsheet-Ready\n' +
                '🔢 *Records Exported:* ' + data.recordCount + ' transactions\n' +
                '🏷️ *Columns Included:* ID, Date, Card, Merchant, Category, Amount, Currency, Amount USD, Status, Anomaly Flag\n\n' +
                '✅ Ready for your accountant or ERP import.',
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = '📥 Export Spreadsheet';
    }
  });

  // ==========================================
  // PHASE 7: VENDOR COMMUNICATION & QUOTE COLLECTION
  // ==========================================
  async function loadVendors() {
    try {
      // 1. Pipeline Stats
      const statsRes = await fetch('/api/vendors/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        const s = statsData.stats;
        const actEl = document.getElementById('venActiveRequests');
        const qEl = document.getElementById('venQuotesReceived');
        const pEl = document.getElementById('venPendingReplies');
        const savEl = document.getElementById('venSavings');
        if (actEl) actEl.textContent = s.totalRequests || 0;
        if (qEl) qEl.textContent = s.quotesReceived || 0;
        if (pEl) pEl.textContent = s.pendingReplies || 0;
        if (savEl) savEl.textContent = '$' + (s.potentialSavingsUSD || 0).toLocaleString();
      }

      // 2. Quote Requests & Side-by-Side Comparisons
      const reqRes = await fetch('/api/vendors/requests');
      const reqData = await reqRes.json();
      const reqList = document.getElementById('venRequestsList');
      if (reqList && reqData.success) {
        if (!reqData.requests || reqData.requests.length === 0) {
          reqList.innerHTML = '<div style="font-size:0.72rem; color:#64748B; padding:8px; text-align:center;">No active RFPs. Dispatch a new quote request above.</div>';
        } else {
          reqList.innerHTML = reqData.requests.map(r => {
            const isAwarded = r.status === 'AWARDED';
            const statusBadge = isAwarded
              ? '<span style="font-size:0.6rem; color:#15803D; background:#DCFCE7; padding:2px 8px; border-radius:4px; font-weight:700;">AWARDED 🏆</span>'
              : (r.status === 'QUOTES_RECEIVED'
                ? '<span style="font-size:0.6rem; color:#1E40AF; background:#DBEAFE; padding:2px 8px; border-radius:4px; font-weight:700;">QUOTES READY (' + (r.quotes?.length || 0) + ')</span>'
                : '<span style="font-size:0.6rem; color:#B45309; background:#FEF3C7; padding:2px 8px; border-radius:4px; font-weight:700;">AWAITING REPLIES ⏳</span>');

            const quotesHtml = (r.quotes && r.quotes.length > 0)
              ? r.quotes.map(q => {
                  const isRec = q.isRecommended;
                  const border = isRec ? '2px solid #10B981' : '1px solid #CBD5E1';
                  const bg = isRec ? '#F0FDF4' : '#F8FAFC';
                  const isSelected = r.awardedTo && r.awardedTo.quoteId === q.quoteId;

                  return `
                    <div style="background:${bg}; border:${border}; border-radius:8px; padding:10px; margin-top:8px;">
                      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                          <div style="display:flex; gap:6px; align-items:center;">
                            <span style="font-size:0.78rem; font-weight:700; color:#0F172A;">${q.vendorName}</span>
                            ${isRec ? '<span style="font-size:0.58rem; background:#10B981; color:#FFFFFF; padding:2px 6px; border-radius:3px; font-weight:800;">⭐ TOP AI CHOICE</span>' : ''}
                            ${isSelected ? '<span style="font-size:0.58rem; background:#1E40AF; color:#FFFFFF; padding:2px 6px; border-radius:3px; font-weight:800;">🏆 BOOKED</span>' : ''}
                          </div>
                          <div style="font-size:0.68rem; color:#64748B; margin-top:2px;">
                            ⭐ ${q.rating} rating • ${q.vehicle || 'Service'} • Score: ${q.aiScore}/100
                          </div>
                        </div>
                        <div style="text-align:right;">
                          <div style="font-size:0.9rem; font-weight:800; color:#0F172A;">
                            $${q.amountUSD.toLocaleString()} USD
                          </div>
                          <div style="font-size:0.62rem; color:#64748B;">
                            (${q.amount.toLocaleString()} ${q.currency})
                          </div>
                        </div>
                      </div>
                      <div style="font-size:0.68rem; color:#334155; margin-top:6px; background:#FFFFFF; padding:6px 8px; border-radius:4px; border:1px solid #E2E8F0;">
                        <b>Includes:</b> ${q.included}
                      </div>
                      ${q.recommendationReason ? `<div style="font-size:0.65rem; color:#047857; margin-top:4px;">💡 ${q.recommendationReason}</div>` : ''}
                      ${!isAwarded ? `
                        <button class="ven-award-btn duffel-search-btn" data-req="${r.id}" data-quote="${q.quoteId}" style="margin-top:8px; padding:6px 12px; font-size:0.7rem; width:100%;">
                          🏆 Award &amp; Queue for Payment Approval
                        </button>
                      ` : ''}
                    </div>
                  `;
                }).join('')
              : '<div style="font-size:0.68rem; color:#64748B; margin-top:6px; font-style:italic;">Awaiting vendor responses...</div>';

            const pendingHtml = (r.pendingVendors && r.pendingVendors.length > 0)
              ? `
                <div style="margin-top:8px; padding:6px 10px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
                  <div style="font-size:0.68rem; color:#92400E;">
                    ⏳ <b>Pending reply from:</b> ${r.pendingVendors.map(p => p.name).join(', ')}
                  </div>
                  <button class="ven-followup-single-btn clean-btn" data-req="${r.id}" data-vendor="${r.pendingVendors[0].vendorId}" style="padding:4px 8px; font-size:0.65rem;">
                    ⚡ Follow Up Now
                  </button>
                </div>
              ` : '';

            return `
              <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:12px 14px; box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>
                    <span style="font-size:0.65rem; font-weight:700; color:#64748B; text-transform:uppercase;">${r.category}</span>
                    <h4 style="font-size:0.85rem; font-weight:700; color:#0F172A; margin:2px 0 4px 0;">${r.title}</h4>
                    <p style="font-size:0.7rem; color:#475569; margin:0;">${r.description}</p>
                  </div>
                  <div>${statusBadge}</div>
                </div>
                <div style="display:flex; gap:12px; margin-top:8px; font-size:0.65rem; color:#64748B; border-top:1px solid #F1F5F9; padding-top:6px;">
                  <span><b>Budget Cap:</b> $${r.budgetUSD.toLocaleString()} USD</span>
                  <span><b>Deadline:</b> ${r.deadline}</span>
                  <span><b>Follow-ups Sent:</b> ${r.followUpsSent || 0}</span>
                </div>
                ${quotesHtml}
                ${pendingHtml}
              </div>
            `;
          }).join('');

          // Wire up Award buttons
          document.querySelectorAll('.ven-award-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const reqId = e.currentTarget.getAttribute('data-req');
              const quoteId = e.currentTarget.getAttribute('data-quote');
              e.currentTarget.disabled = true;
              e.currentTarget.textContent = '⏳ Processing...';
              try {
                const res = await fetch('/api/vendors/award', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ requestId: reqId, quoteId })
                });
                const data = await res.json();
                if (data.success) {
                  await loadVendors();
                  appendMessage({
                    sender: 'assistant',
                    text: '🏆 *Vendor Quote Awarded!*\n\n' +
                          '🤝 *Vendor:* ' + data.awardedQuote.vendorName + '\n' +
                          '💵 *Amount:* $' + data.awardedQuote.amountUSD.toLocaleString() + ' USD\n' +
                          '🚗 *Details:* ' + (data.awardedQuote.vehicle || 'Service') + '\n\n' +
                          '🔒 *Next Step:* Automatically forwarded to *Phase 4 Booking & Approval* workflow for tokenized payment authorization.',
                    language: currentLanguageMode === 'es' ? 'es' : 'en',
                    time: formatTime()
                  });
                }
              } catch (err) {
                console.error(err);
              }
            });
          });

          // Wire up Single Follow-up buttons
          document.querySelectorAll('.ven-followup-single-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const reqId = e.currentTarget.getAttribute('data-req');
              const vendorId = e.currentTarget.getAttribute('data-vendor');
              e.currentTarget.disabled = true;
              e.currentTarget.textContent = 'Sending...';
              try {
                const res = await fetch('/api/vendors/followup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ requestId: reqId, vendorId })
                });
                const data = await res.json();
                if (data.success) {
                  await loadVendors();
                  appendMessage({
                    sender: 'assistant',
                    text: '⚡ *Proactive Follow-up Dispatched*\n\n' +
                          '📨 *Recipient:* ' + data.followUp.vendorName + ' (' + data.followUp.vendorEmail + ')\n' +
                          '📱 *Channel:* Dual WhatsApp & Business Email\n' +
                          '💬 *Subject:* ' + data.followUp.subject + '\n\n' +
                          '✅ Response simulated & incoming quote added to comparison matrix!',
                    language: currentLanguageMode === 'es' ? 'es' : 'en',
                    time: formatTime()
                  });
                }
              } catch (err) {
                console.error(err);
              }
            });
          });
        }
      }

      // 3. Directory List
      const dirRes = await fetch('/api/vendors/directory');
      const dirData = await dirRes.json();
      const dirList = document.getElementById('venDirectoryList');
      if (dirList && dirData.success) {
        dirList.innerHTML = dirData.vendors.map(v => `
          <div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; gap:6px; align-items:center;">
                <span style="font-size:0.75rem; font-weight:700; color:#0F172A;">${v.name}</span>
                ${v.preferred ? '<span style="font-size:0.55rem; background:#DCFCE7; color:#15803D; padding:1px 5px; border-radius:3px; font-weight:700;">PREFERRED</span>' : ''}
              </div>
              <div style="font-size:0.65rem; color:#64748B;">${v.category} • Contact: ${v.contactName} • ${v.phone}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem; font-weight:700; color:#0F172A;">⭐ ${v.rating}</div>
              <div style="font-size:0.6rem; color:#64748B;">~${v.typicalTurnaround} reply</div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading vendors:', err);
    }
  }

  // New RFP Button
  document.getElementById('venNewRfpBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('venNewRfpBtn');
    btn.disabled = true; btn.textContent = '⏳ Dispatching...';
    try {
      const res = await fetch('/api/vendors/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'VIP Airport Meet & Fast-Track Customs MAD',
          category: 'Ground Transportation',
          description: 'VIP gate greet, luggage porterage, and escort through diplomatic customs lane at Madrid-Barajas (MAD) for 3 passengers on Oct 8, 2026.',
          budgetUSD: 950,
          deadline: '2026-10-03'
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadVendors();
        appendMessage({
          sender: 'assistant',
          text: '📤 *New RFP Dispatched to Preferred Vendors*\n\n' +
                '📋 *Title:* ' + data.request.title + '\n' +
                '🎯 *Category:* ' + data.request.category + '\n' +
                '💵 *Budget Cap:* $' + data.request.budgetUSD.toLocaleString() + ' USD\n' +
                '⏳ *Response Deadline:* ' + data.request.deadline + '\n\n' +
                '🤖 Aura is tracking supplier responses and will automatically follow up in 24 hours if no reply is received.',
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = '➕ Dispatch New RFP';
    }
  });

  // Run Proactive Follow-ups Button
  document.getElementById('venRunFollowUpsBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('venRunFollowUpsBtn');
    btn.disabled = true; btn.textContent = '⚡ Running...';
    try {
      const res = await fetch('/api/vendors/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: 'rfp_103' })
      });
      const data = await res.json();
      if (data.success) {
        await loadVendors();
        appendMessage({
          sender: 'assistant',
          text: '⚡ *Proactive Automated Follow-up Triggered*\n\n' +
                '📤 Dispatched multi-channel follow-up to awaiting aviation vendors for *Private Aviation Charter: MAD to NCE*.\n\n' +
                '✅ *Result:* SkyLink Aviation Spain responded with updated quote ($14,250 USD) and added to comparison matrix!',
          language: currentLanguageMode === 'es' ? 'es' : 'en',
          time: formatTime()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = '⚡ Proactive Follow-up';
    }
  });

});


