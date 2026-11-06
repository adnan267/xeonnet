from django.db import models


class NotificationLog(models.Model):
    """Every email / SMS we try to send, so nothing is sent twice and staff can see what went out."""
    kind = models.CharField(max_length=40)              # invoice_sent, payment_received, due_soon, overdue, ...
    channel = models.CharField(max_length=10)           # email | sms
    to = models.CharField(max_length=200)
    subject = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    status = models.CharField(max_length=10, default="sent")  # sent | failed | skipped
    error = models.TextField(blank=True)
    document = models.ForeignKey("office.Document", null=True, blank=True, on_delete=models.SET_NULL,
                                 related_name="notifications")
    client = models.ForeignKey("office.Client", null=True, blank=True, on_delete=models.SET_NULL,
                               related_name="notifications")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-id"]
