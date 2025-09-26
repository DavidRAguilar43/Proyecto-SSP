#!/usr/bin/env python3
"""
Test script to verify user activation functionality.
"""

import requests
import json

def test_user_activation():
    """Test activating a user account."""
    
    # Admin login
    login_data = {
        'username': 'admin@sistema.edu',
        'password': 'admin123'
    }

    try:
        # Login first
        print("🔐 Logging in as admin...")
        response = requests.post('http://localhost:8000/api/v1/auth/login', data=login_data)
        if response.status_code == 200:
            token = response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}'}
            print("✅ Admin login successful")
            
            print("\n📝 Testing user activation...")
            # Try to update user ID 7 (personal@uabc.edu.mx) active status
            update_data = {'is_active': True}
            response = requests.put('http://localhost:8000/api/v1/personas/7', 
                                  json=update_data, headers=headers)
            print(f"Update status: {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"User is now active: {user_data['is_active']}")
                print(f"User email: {user_data['correo_institucional']}")
                
                # Test login with the activated user
                print("\n🧪 Testing login with activated user...")
                personal_login = {
                    'username': 'personal@uabc.edu.mx',
                    'password': '12345678'
                }
                login_response = requests.post('http://localhost:8000/api/v1/auth/login', data=personal_login)
                print(f"Personal login status: {login_response.status_code}")
                if login_response.status_code == 200:
                    print("✅ Personal user can now login successfully!")
                    return True
                else:
                    print(f"❌ Personal login failed: {login_response.text}")
                    return False
            else:
                print(f"❌ Update failed: {response.text}")
                return False
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_user_activation()
    if success:
        print("\n🎉 User activation test PASSED!")
    else:
        print("\n💥 User activation test FAILED!")
