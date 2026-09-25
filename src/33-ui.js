//@ UI: panels, menu and HUD
  // ── UI: panels, menu, HUD ─────────────────────────────────────────
  var ui = {
    panelOpen: false, panelKind: null, panelTab: null, menuOpen: false, ctxOpen: false, started: false,
    blocked: function () { return this.panelOpen || this.menuOpen || this.ctxOpen || this.taskOpen || this.pcOpen || this.deviceOpen || this.wheelOpen || !this.started; },
    openPanel: function (kind, tab) {
      this.panelKind = kind; this.panelTab = tab || (kind === 'laptop' ? 'shop' : kind === 'inventory' ? 'inv' : null);
      this.panelOpen = true; $('g3-panel').hidden = false; document.exitPointerLock(); this.render(); sfx(kind === 'laptop' ? 'type' : 'panel');
    },
    closePanel: function () { this.panelOpen = false; $('g3-panel').hidden = true; if (!this.menuOpen) lockPointer(); sfx('close'); },
    refreshOpen: function () { if (this.panelOpen) this.render(); if (pc.open) pcRender(); if (dev.open) deviceRender(); if (this.ctxOpen && this.ctxBtns) { /* ctx closes on action; nothing */ } },
    render: function () {
      var kind = this.panelKind, tab = this.panelTab; var title = '', tabs = [], body = '';
      if (kind === 'laptop') { title = '💻 Supply desk'; tabs = [['shop', '🛒 Supplies'], ['seeds', '🌱 Seed bank'], ['gear', '⚙️ Gear'], ['lic', '🪪 Licences'], ['staff', '🧑‍🔧 Staff'], ['bank', '🏦 Bank']]; body = tab === 'seeds' ? paneSeeds() : tab === 'gear' ? paneUpgrades() : tab === 'lic' ? paneLicences() : tab === 'staff' ? paneStaff() : tab === 'bank' ? paneBank() : paneShop(); }
      else if (kind === 'vault') { title = '🔒 Vault'; body = paneVault(); }
      else if (kind === 'atm') { title = '🏧 ATM'; body = paneAtm(); }
      else if (kind === 'storage') { title = '📦 Back room'; body = paneStorage(); }
      else if (kind === 'stock') { title = '🗄️ Stock cabinet'; body = paneStock(); }
      else if (kind === 'bench') { title = '✂️ Workbench'; body = paneProcess(); }
      else if (kind === 'register') { title = '💵 Till'; body = paneRegister(); }
//#if desk
      else if (kind === 'desk') { title = '🖥️ Live desk'; body = paneDesk(); }
//#else
      else if (kind === 'desk') { title = '📊 Shop dashboard'; body = paneDesk(); }
//#endif
      else if (kind === 'controls') { title = '🏪 Control box'; body = paneControls(); }
      else if (kind === 'miniFront') { title = '🏪 Front panel'; body = paneMiniCtl('front'); }
      else if (kind === 'miniOffice') { title = '🗄️ Office panel'; body = paneMiniCtl('office'); }
      else if (kind === 'jobs') { title = '🚚 Deliveries'; tabs = [['phone', '📱 Burner'], ['tablet', '📋 Tablet']]; body = paneJobs(tab === 'tablet' ? 'tablet' : 'phone'); }
      else if (hooks.panel[kind]) { var hp = hooks.panel[kind](tab); title = hp.title; tabs = hp.tabs || []; body = hp.body; if (!tab && tabs.length) { tab = tabs[0][0]; this.panelTab = tab; } }
      else if (kind === 'inventory') { title = '🎒 Inventory & diary'; tabs = [['inv', '🎒 Inventory'], ['log', '📜 Diary'], ['stats', '📊 Stats']]; body = tab === 'log' ? paneLog() : tab === 'stats' ? paneStats() : paneInventory(); }
      $('g3-panel-title').innerHTML = title;
      $('g3-panel-tabs').innerHTML = tabs.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (t[0] === tab ? 'active' : '') + '">' + t[1] + '</button>'; }).join('');
      $('g3-panel-body').innerHTML = body;
    }
  };
