(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  if (window.lucide) lucide.createIcons();

  // copy-to-clipboard buttons
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy'), old = btn.innerHTML;
      var done = function () { btn.textContent = 'Copied!'; setTimeout(function () { btn.innerHTML = old; if (window.lucide) lucide.createIcons(); }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done);
      else { var i = document.createElement('input'); i.value = text; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); done(); }
    });
  });

  // document form: dynamic rows + live totals
  var form = $('#docForm');
  if (!form) return;
  var items = $('#items');
  function n(v) { v = parseFloat(String(v).replace(/,/g, '')); return isNaN(v) ? 0 : v; }
  function money(x) { return x.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function recalc() {
    var cur = $('#currency').value, sub = 0;
    $$('.item-row', items).forEach(function (row) {
      var amt = n($('.qty', row).value) * n($('.price', row).value);
      sub += amt; $('.line', row).textContent = money(amt);
    });
    var dv = n($('#discount').value), disc = $('#discountType').value === 'percent' ? sub * Math.min(dv, 100) / 100 : Math.min(dv, sub);
    var tax = (sub - disc) * n($('#tax').value) / 100;
    $('#tSub').textContent = cur + ' ' + money(sub);
    $('#tDisc').textContent = '− ' + cur + ' ' + money(disc);
    $('#tTax').textContent = cur + ' ' + money(tax);
    $('#tTotal').textContent = cur + ' ' + money(sub - disc + tax);
  }
  form.addEventListener('input', recalc);
  form.addEventListener('change', recalc);
  $('#addItem').addEventListener('click', function () {
    var row = items.firstElementChild.cloneNode(true);
    $$('input', row).forEach(function (i) { i.value = i.classList.contains('qty') ? 1 : (i.classList.contains('price') ? 0 : ''); });
    items.appendChild(row); $('input', row).focus(); recalc();
  });
  items.addEventListener('click', function (e) {
    if (!e.target.classList.contains('rm')) return;
    if (items.children.length > 1) e.target.closest('.item-row').remove();
    else $$('input', items.firstElementChild).forEach(function (i) { i.value = i.classList.contains('qty') ? 1 : (i.classList.contains('price') ? 0 : ''); });
    recalc();
  });
  recalc();
})();
