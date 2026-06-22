"""Nova Act authenticated test - Short Courses access after login

Usage: 
  set NOVA_ACT_API_KEY=your_key
  python test_authenticated.py
"""
import os
from nova_act import NovaAct

assert os.environ.get("NOVA_ACT_API_KEY"), "Set NOVA_ACT_API_KEY env variable first"

# ===== FILL IN YOUR TEST CREDENTIALS =====
TEST_EMAIL = "your_test_email@example.com"
TEST_PASSWORD = "your_test_password"
# ==========================================

print("=" * 60)
print("Nova Act Authenticated Test: Short Courses")
print("=" * 60)

with NovaAct(starting_page="https://hidayat.pk", headless=True) as nova:

    # Step 1: Navigate to login
    print("\n[1/4] Navigating to login page...")
    nova.act("find and click the login button or link to go to the login page")
    print("      Done.")

    # Step 2: Log in with credentials
    print("\n[2/4] Logging in...")
    nova.act(
        f"fill in the email field with '{TEST_EMAIL}' "
        f"and the password field with '{TEST_PASSWORD}', "
        f"then click the login/sign-in button"
    )
    print("      Done.")

    # Step 3: Verify login was successful
    print("\n[3/4] Verifying login...")
    nova.act("wait a moment for the page to load after login, then confirm you are logged in")
    print("      Done.")

    # Step 4: Navigate to Short Courses
    print("\n[4/4] Accessing Short Courses...")
    nova.act(
        "navigate to the Short Courses section and describe "
        "what courses are available. List the course names if visible."
    )
    print("      Done.")

print("\n" + "=" * 60)
print("Test complete!")
print("=" * 60)
