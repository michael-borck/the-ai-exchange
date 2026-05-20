"""Simple test email script - reads SMTP config from backend/.env"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import dotenv_values

# Try multiple .env locations
for env_path in ["backend/.env", ".env"]:
    if os.path.exists(env_path):
        print(f"Loading config from: {env_path}")
        config = dotenv_values(env_path)
        break
else:
    print("ERROR: No .env file found in backend/.env or .env")
    exit(1)

smtp_server = config["SMTP_SERVER"]
smtp_port = int(config["SMTP_PORT"])
smtp_user = config["SMTP_USER"]
smtp_password = config["SMTP_PASSWORD"]
mail_from = config.get("MAIL_FROM", smtp_user)
mail_from_name = config.get("MAIL_FROM_NAME", "Test")

to_email = "michael.borck@curtin.edu.au"

msg = MIMEMultipart()
msg["From"] = f"{mail_from_name} <{mail_from}>"
msg["To"] = to_email
msg["Subject"] = "Test Email from The AI Exchange"

body = """\
This is a test email from The AI Exchange.

If you received this, the SMTP configuration is working correctly.

Server: {server}:{port}
From: {from_addr}
""".format(server=smtp_server, port=smtp_port, from_addr=mail_from)

msg.attach(MIMEText(body, "plain"))

print(f"Sending test email to {to_email}...")
print(f"  Server: {smtp_server}:{smtp_port}")
print(f"  From: {mail_from}")

try:
    context = ssl.create_default_context()
    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(mail_from, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_password)
            server.sendmail(mail_from, to_email, msg.as_string())
    print("Email sent successfully!")
except Exception as e:
    print(f"Failed to send email: {e}")
