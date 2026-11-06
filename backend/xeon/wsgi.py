import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "xeon.settings")
application = get_wsgi_application()

from xeon import bootstrap  # noqa: E402

bootstrap.run()
app = application  # Vercel looks for "app"
