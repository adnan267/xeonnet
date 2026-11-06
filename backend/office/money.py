"""Totals, statuses and amount-in-words for proposals and invoices."""
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

CURRENCIES = {
    "PKR": ("Rupees", "Paisa"), "GBP": ("Pounds", "Pence"), "USD": ("US Dollars", "Cents"),
    "EUR": ("Euros", "Cents"), "AED": ("UAE Dirhams", "Fils"), "SAR": ("Saudi Riyals", "Halalas"),
}
TWO = Decimal("0.01")


def q(x):
    return Decimal(x or 0).quantize(TWO, rounding=ROUND_HALF_UP)


def totals(doc, items=None, paid=None):
    items = list(doc.items.all()) if items is None else items
    subtotal = q(sum((Decimal(i.qty) * Decimal(i.unit_price) for i in items), Decimal(0)))
    dv = max(Decimal(doc.discount_value or 0), Decimal(0))
    if doc.discount_type == "percent":
        discount = q(subtotal * min(dv, Decimal(100)) / 100)
    else:
        discount = q(min(dv, subtotal))
    taxable = subtotal - discount
    tax = q(taxable * max(Decimal(doc.tax_percent or 0), Decimal(0)) / 100)
    total = q(taxable + tax)
    if paid is None:
        paid = sum((p.amount for p in doc.payments.all()), Decimal(0)) if doc.pk else Decimal(0)
    paid = q(paid)
    return {"subtotal": subtotal, "discount": discount, "tax": tax, "total": total,
            "paid": paid, "balance": q(max(total - paid, Decimal(0)))}


def effective_status(doc, t, today=None):
    if doc.doc_type != "invoice" or doc.status in ("draft", "cancelled"):
        return doc.status
    today = today or date.today()
    if t["total"] > 0 and t["paid"] >= t["total"]:
        return "paid"
    overdue = bool(doc.due_date) and doc.due_date < today
    if t["paid"] > 0:
        return "overdue" if overdue else "partial"
    return "overdue" if overdue else "sent"


_ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
         "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]


def _small(n):
    out = []
    if n >= 100:
        out.append(_ONES[n // 100] + " Hundred")
        n %= 100
    if n >= 20:
        out.append(_TENS[n // 10] + (" " + _ONES[n % 10] if n % 10 else ""))
    elif n:
        out.append(_ONES[n])
    return " ".join(out)


def words(n, south_asian=True):
    n = int(n)
    if n == 0:
        return "Zero"
    scale = ((10_000_000, "Crore"), (100_000, "Lakh"), (1000, "Thousand")) if south_asian else \
        ((1_000_000_000, "Billion"), (1_000_000, "Million"), (1000, "Thousand"))
    parts = []
    for size, name in scale:
        if n >= size:
            parts.append((words(n // size, south_asian) if n // size >= 1000 else _small(n // size)) + " " + name)
            n %= size
    if n:
        parts.append(_small(n))
    return " ".join(parts)


def amount_in_words(amount, currency="PKR"):
    major, minor = CURRENCIES.get(currency, (currency, "Cents"))
    amount = q(amount)
    whole = int(amount)
    cents = int((amount - whole) * 100)
    text = f"{major} {words(whole, currency == 'PKR')}"
    if cents:
        text += f" and {words(cents)} {minor}"
    return text + " Only"


def fmt(amount, currency="PKR"):
    amount = q(amount)
    s = f"{amount:,.0f}" if amount == amount.to_integral() else f"{amount:,.2f}"
    return f"{currency} {s}"
