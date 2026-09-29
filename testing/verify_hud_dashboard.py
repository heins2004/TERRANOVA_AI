import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ARTIFACTS_DIR = r"c:\Users\hp\Desktop\Programs\TERRANOVA_AI\testing\artifacts"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def create_driver():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.set_capability("goog:loggingPrefs", {"browser": "ALL"})
    d = webdriver.Chrome(options=opts)
    d.set_window_size(1440, 1150)
    return d

print("=" * 60)
print("TEST 1: Citizen Dashboard, Fixed Corners & India Map Link")
print("=" * 60)
driver = create_driver()
try:
    driver.get("http://localhost:3000/login")
    time.sleep(1.5)
    driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("citizen@test.com")
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("12345678")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 20).until(lambda d: "/dashboard" in d.current_url)
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Command Center')]"))
    )
    time.sleep(3.5)

    citizen_shot = os.path.join(ARTIFACTS_DIR, "dashboard_citizen_fixed_corners.png")
    driver.save_screenshot(citizen_shot)
    print(f"  [PASS] Captured Citizen Dashboard: {citizen_shot}")

    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1.0)
    driver.save_screenshot(os.path.join(ARTIFACTS_DIR, "dashboard_citizen_bottom.png"))

    # Verify clicking National Coverage Map link navigates to /map
    map_link = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "national-map-link"))
    )
    driver.execute_script("arguments[0].click();", map_link)
    WebDriverWait(driver, 10).until(lambda d: "/map" in d.current_url)
    print(f"  [PASS] Clicked National Map Link -> Navigated to: {driver.current_url}")
    assert "/map" in driver.current_url
finally:
    driver.quit()

print("\n" + "=" * 60)
print("TEST 2: Planner Dashboard Verification")
print("=" * 60)
driver = create_driver()
try:
    driver.get("http://localhost:3000/login")
    time.sleep(1.5)
    driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys("planner@test.com")
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys("12345678")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 20).until(lambda d: "/dashboard" in d.current_url)
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Command Center')]"))
    )
    time.sleep(3.5)

    planner_shot = os.path.join(ARTIFACTS_DIR, "dashboard_planner_fixed_corners.png")
    driver.save_screenshot(planner_shot)
    print(f"  [PASS] Captured Planner Dashboard: {planner_shot}")

    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1.0)
    driver.save_screenshot(os.path.join(ARTIFACTS_DIR, "dashboard_planner_bottom.png"))
finally:
    driver.quit()

print("\n" + "=" * 60)
print("ALL VERIFICATIONS PASSED SUCCESSFULLY!")
print("=" * 60)
