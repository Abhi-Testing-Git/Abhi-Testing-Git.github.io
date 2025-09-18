import requests
import sys
import json
from datetime import datetime

class RevisionProAPITester:
    def __init__(self, base_url="https://revisionpro-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'subjects': [],
            'topics': [],
            'subtopics': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
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
                    if isinstance(response_data, dict) and 'id' in response_data:
                        print(f"   Created ID: {response_data['id']}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_dashboard_empty(self):
        """Test dashboard with no data"""
        success, response = self.run_test(
            "Dashboard Stats (Empty)",
            "GET", 
            "dashboard",
            200
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_create_subject(self):
        """Test creating a subject"""
        subject_data = {
            "name": "Physics",
            "description": "Classical and Modern Physics"
        }
        success, response = self.run_test(
            "Create Subject",
            "POST",
            "subjects",
            200,
            data=subject_data
        )
        if success and 'id' in response:
            self.created_ids['subjects'].append(response['id'])
        return success, response.get('id') if success else None

    def test_get_subjects(self):
        """Test getting all subjects"""
        success, response = self.run_test(
            "Get All Subjects",
            "GET",
            "subjects", 
            200
        )
        if success:
            print(f"   Found {len(response)} subjects")
        return success

    def test_create_topic(self, subject_id):
        """Test creating a topic"""
        topic_data = {
            "subject_id": subject_id,
            "name": "Mechanics",
            "description": "Classical Mechanics and Motion"
        }
        success, response = self.run_test(
            "Create Topic",
            "POST",
            "topics",
            200,
            data=topic_data
        )
        if success and 'id' in response:
            self.created_ids['topics'].append(response['id'])
        return success, response.get('id') if success else None

    def test_get_topics(self, subject_id):
        """Test getting topics for a subject"""
        success, response = self.run_test(
            "Get Topics by Subject",
            "GET",
            "topics",
            200,
            params={"subject_id": subject_id}
        )
        if success:
            print(f"   Found {len(response)} topics")
        return success

    def test_create_subtopic(self, topic_id):
        """Test creating a subtopic"""
        subtopic_data = {
            "topic_id": topic_id,
            "name": "Newton's Laws",
            "description": "Three fundamental laws of motion",
            "difficulty": "Hard"
        }
        success, response = self.run_test(
            "Create Subtopic",
            "POST",
            "subtopics",
            200,
            data=subtopic_data
        )
        if success and 'id' in response:
            self.created_ids['subtopics'].append(response['id'])
        return success, response.get('id') if success else None

    def test_get_subtopics(self, topic_id):
        """Test getting subtopics for a topic"""
        success, response = self.run_test(
            "Get Subtopics by Topic",
            "GET",
            "subtopics",
            200,
            params={"topic_id": topic_id}
        )
        if success:
            print(f"   Found {len(response)} subtopics")
        return success

    def test_create_revision(self, subtopic_id):
        """Test creating a revision history"""
        revision_data = {
            "subtopic_id": subtopic_id,
            "performance": "Struggled",
            "notes": "Need more practice with third law"
        }
        success, response = self.run_test(
            "Create Revision",
            "POST",
            "revisions",
            200,
            data=revision_data
        )
        return success

    def test_get_revision_history(self, subtopic_id):
        """Test getting revision history"""
        success, response = self.run_test(
            "Get Revision History",
            "GET",
            f"revisions/{subtopic_id}",
            200
        )
        if success:
            print(f"   Found {len(response)} revision records")
        return success

    def test_dashboard_with_data(self):
        """Test dashboard with data"""
        success, response = self.run_test(
            "Dashboard Stats (With Data)",
            "GET",
            "dashboard",
            200
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_recommendations(self):
        """Test AI recommendations"""
        success, response = self.run_test(
            "AI Recommendations",
            "GET",
            "recommendations",
            200,
            params={"limit": 3}
        )
        if success:
            print(f"   Found {len(response)} recommendations")
            for rec in response:
                print(f"   - {rec.get('subtopic_name')} (Priority: {rec.get('priority_score', 0):.1f})")
        return success

    def test_delete_operations(self):
        """Test delete operations (cleanup)"""
        success_count = 0
        
        # Delete subtopics
        for subtopic_id in self.created_ids['subtopics']:
            success, _ = self.run_test(
                f"Delete Subtopic {subtopic_id}",
                "DELETE",
                f"subtopics/{subtopic_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete topics  
        for topic_id in self.created_ids['topics']:
            success, _ = self.run_test(
                f"Delete Topic {topic_id}",
                "DELETE", 
                f"topics/{topic_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete subjects
        for subject_id in self.created_ids['subjects']:
            success, _ = self.run_test(
                f"Delete Subject {subject_id}",
                "DELETE",
                f"subjects/{subject_id}",
                200
            )
            if success:
                success_count += 1
        
        return success_count > 0

def main():
    print("🚀 Starting RevisionPro API Tests")
    print("=" * 50)
    
    tester = RevisionProAPITester()
    
    # Test sequence
    print("\n📋 Phase 1: Basic API Tests")
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed, stopping tests")
        return 1
    
    tester.test_dashboard_empty()
    
    print("\n📋 Phase 2: CRUD Operations")
    success, subject_id = tester.test_create_subject()
    if not success or not subject_id:
        print("❌ Subject creation failed, stopping tests")
        return 1
    
    tester.test_get_subjects()
    
    success, topic_id = tester.test_create_topic(subject_id)
    if not success or not topic_id:
        print("❌ Topic creation failed, stopping tests")
        return 1
    
    tester.test_get_topics(subject_id)
    
    success, subtopic_id = tester.test_create_subtopic(topic_id)
    if not success or not subtopic_id:
        print("❌ Subtopic creation failed, stopping tests")
        return 1
    
    tester.test_get_subtopics(topic_id)
    
    print("\n📋 Phase 3: Revision System")
    tester.test_create_revision(subtopic_id)
    tester.test_get_revision_history(subtopic_id)
    
    print("\n📋 Phase 4: Dashboard & Recommendations")
    tester.test_dashboard_with_data()
    tester.test_recommendations()
    
    print("\n📋 Phase 5: Cleanup")
    tester.test_delete_operations()
    
    # Final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())