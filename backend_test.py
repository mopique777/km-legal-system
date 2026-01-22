import requests
import sys
import json
from datetime import datetime

class LegalCoreAPITester:
    def __init__(self, base_url="https://lawcore.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.company_id = None
        self.case_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, ensure_ascii=False)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_register_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@legalcore.ae",
            "password": "TestPass123!",
            "full_name_ar": "مستخدم تجريبي",
            "full_name_en": "Test User",
            "role": "user"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user ID: {self.user_id}")
            return True
        return False

    def test_login_user(self):
        """Test user login with test credentials"""
        login_data = {
            "email": "admin@legalcore.ae",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            self.company_id = response['user'].get('company_id')
            print(f"   Logged in user ID: {self.user_id}")
            return True
        return False

    def test_get_user_profile(self):
        """Test getting current user profile"""
        return self.run_test("Get User Profile", "GET", "auth/me", 200)

    def test_create_company(self):
        """Test creating a company"""
        company_data = {
            "name_ar": "شركة قانونية تجريبية",
            "name_en": "Test Legal Company",
            "primary_color": "#D4AF37",
            "secondary_color": "#334155"
        }
        
        success, response = self.run_test(
            "Create Company",
            "POST",
            "companies",
            200,
            data=company_data
        )
        
        if success and 'id' in response:
            self.company_id = response['id']
            print(f"   Created company ID: {self.company_id}")
            return True
        return False

    def test_create_case(self):
        """Test creating a new case"""
        case_data = {
            "case_number": f"TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title_ar": "قضية تجريبية",
            "title_en": "Test Case",
            "type": "civil",
            "court": "محكمة دبي الابتدائية",
            "priority": "medium",
            "plaintiff": "المدعي التجريبي",
            "defendant": "المدعى عليه التجريبي",
            "description_ar": "وصف القضية التجريبية"
        }
        
        success, response = self.run_test(
            "Create Case",
            "POST",
            "cases",
            200,
            data=case_data
        )
        
        if success and 'id' in response:
            self.case_id = response['id']
            print(f"   Created case ID: {self.case_id}")
            return True
        return False

    def test_get_cases(self):
        """Test getting all cases"""
        return self.run_test("Get Cases", "GET", "cases", 200)

    def test_get_case_details(self):
        """Test getting specific case details"""
        if not self.case_id:
            print("❌ No case ID available for testing")
            return False
        
        return self.run_test("Get Case Details", "GET", f"cases/{self.case_id}", 200)

    def test_update_case(self):
        """Test updating a case"""
        if not self.case_id:
            print("❌ No case ID available for testing")
            return False
            
        update_data = {
            "case_number": f"UPDATED-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title_ar": "قضية محدثة",
            "title_en": "Updated Test Case",
            "type": "commercial",
            "court": "محكمة دبي التجارية",
            "priority": "high",
            "plaintiff": "المدعي المحدث",
            "defendant": "المدعى عليه المحدث",
            "description_ar": "وصف القضية المحدثة"
        }
        
        return self.run_test("Update Case", "PUT", f"cases/{self.case_id}", 200, data=update_data)

    def test_create_invoice(self):
        """Test creating an invoice"""
        if not self.case_id:
            print("❌ No case ID available for testing")
            return False
            
        invoice_data = {
            "case_id": self.case_id,
            "type": "fees",
            "amount": 5000.0,
            "vat_percentage": 5.0,
            "description_ar": "أتعاب قانونية",
            "due_date": "2025-02-01"
        }
        
        return self.run_test("Create Invoice", "POST", "invoices", 200, data=invoice_data)

    def test_ai_chat(self):
        """Test AI chat functionality"""
        ai_request = {
            "message": "ما هي المواد القانونية المتعلقة بالعقود التجارية في القانون الإماراتي؟",
            "provider": "openai",
            "model": "gpt-5.2"
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "ai/chat",
            200,
            data=ai_request
        )
        
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
            return True
        return False

    def test_get_stats(self):
        """Test getting dashboard statistics"""
        return self.run_test("Get Statistics", "GET", "stats", 200)

    def test_create_session(self):
        """Test creating a court session"""
        if not self.case_id:
            print("❌ No case ID available for testing")
            return False
            
        session_data = {
            "case_id": self.case_id,
            "session_date": "2025-02-15",
            "session_time": "10:00",
            "location": "محكمة دبي الابتدائية - قاعة 1",
            "notes_ar": "جلسة أولى",
            "status": "scheduled"
        }
        
        return self.run_test("Create Session", "POST", "sessions", 200, data=session_data)

    def test_get_sessions(self):
        """Test getting case sessions"""
        if not self.case_id:
            print("❌ No case ID available for testing")
            return False
            
        return self.run_test("Get Sessions", "GET", f"cases/{self.case_id}/sessions", 200)

def main():
    print("🚀 Starting LegalCore API Testing...")
    print("=" * 50)
    
    tester = LegalCoreAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("User Registration", tester.test_register_user),
        ("User Login", tester.test_login_user),
        ("Get User Profile", tester.test_get_user_profile),
        ("Create Company", tester.test_create_company),
        ("Create Case", tester.test_create_case),
        ("Get Cases", tester.test_get_cases),
        ("Get Case Details", tester.test_get_case_details),
        ("Update Case", tester.test_update_case),
        ("Create Invoice", tester.test_create_invoice),
        ("Create Session", tester.test_create_session),
        ("Get Sessions", tester.test_get_sessions),
        ("AI Chat", tester.test_ai_chat),
        ("Get Statistics", tester.test_get_stats),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())