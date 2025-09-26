#!/usr/bin/env python3
"""
Test script to debug authorization issues with persona deletion.
This script will help identify if the issue is with authentication or authorization logic.
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
ADMIN_EMAIL = "admin@sistema.edu"
ADMIN_PASSWORD = "12345678"  # Default test password

def test_server_connection():
    """Test basic server connection."""
    print("🌐 Testing server connection...")

    try:
        response = requests.get(f"{BASE_URL}/personas/validate-email/test@test.com", timeout=5)
        print(f"Server connection status: {response.status_code}")
        if response.status_code in [200, 404]:
            print("✅ Server is responding")
            return True
        else:
            print(f"❌ Server error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Server connection error: {e}")
        return False

def test_admin_login():
    """Test admin login and get access token."""
    print("🔐 Testing admin login...")

    login_data = {
        "username": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }

    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )

        print(f"Login response status: {response.status_code}")
        print(f"Login response headers: {dict(response.headers)}")

        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful!")
            print(f"Token type: {token_data.get('token_type')}")
            print(f"Access token (first 20 chars): {token_data.get('access_token', '')[:20]}...")
            return token_data.get('access_token')
        else:
            print("❌ Login failed!")
            print(f"Error: {response.text}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                pass
            return None

    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_current_user(token):
    """Test getting current user info."""
    print("\n👤 Testing current user info...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        # We need to find an endpoint that shows current user info
        # Let's try getting all personas first to see if auth works
        response = requests.get(f"{BASE_URL}/personas", headers=headers)
        
        print(f"Get personas response status: {response.status_code}")
        
        if response.status_code == 200:
            personas = response.json()
            print(f"✅ Successfully retrieved {len(personas)} personas")
            
            # Find admin user
            admin_user = next((p for p in personas if p.get('correo_institucional') == ADMIN_EMAIL), None)
            if admin_user:
                print(f"Admin user found: ID={admin_user.get('id')}, Role={admin_user.get('rol')}")
                return admin_user
            else:
                print("❌ Admin user not found in personas list")
                return None
        else:
            print("❌ Failed to get personas!")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Current user test error: {e}")
        return None

def test_delete_persona(token, persona_id, persona_role):
    """Test deleting a specific persona."""
    print(f"\n🗑️ Testing deletion of persona ID {persona_id} (role: {persona_role})...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.delete(f"{BASE_URL}/personas/{persona_id}", headers=headers)
        
        print(f"Delete response status: {response.status_code}")
        print(f"Delete response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Deletion successful!")
            deleted_persona = response.json()
            print(f"Deleted persona: {deleted_persona.get('correo_institucional')}")
            return True
        elif response.status_code == 403:
            print("❌ 403 Forbidden - Authorization failed!")
            print(f"Error details: {response.text}")
            
            # Try to parse error details
            try:
                error_data = response.json()
                print(f"Error message: {error_data.get('detail', 'No detail provided')}")
            except:
                pass
            return False
        elif response.status_code == 404:
            print("❌ 404 Not Found - Persona doesn't exist!")
            return False
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Delete test error: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 Starting authorization debug test...")
    print(f"Testing against: {BASE_URL}")
    print(f"Admin email: {ADMIN_EMAIL}")
    print(f"Timestamp: {datetime.now()}")
    print("=" * 60)

    # Step 0: Test server connection
    if not test_server_connection():
        print("\n❌ Cannot connect to server")
        return

    # Step 1: Login as admin
    token = test_admin_login()
    if not token:
        print("\n❌ Cannot proceed without valid token")
        return
    
    # Step 2: Verify current user
    admin_user = test_current_user(token)
    if not admin_user:
        print("\n❌ Cannot verify admin user")
        return
    
    # Step 3: Test deletion of different persona types
    test_cases = [
        (7, "personal"),  # Staff member
        (8, "docente"),   # Faculty member
    ]
    
    for persona_id, role in test_cases:
        success = test_delete_persona(token, persona_id, role)
        if success:
            print(f"✅ Successfully deleted {role} (ID: {persona_id})")
        else:
            print(f"❌ Failed to delete {role} (ID: {persona_id})")
    
    print("\n" + "=" * 60)
    print("🏁 Test completed!")

if __name__ == "__main__":
    main()
